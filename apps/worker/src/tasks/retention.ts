import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { wsTransport } from "../services/supabase";
import { env } from "../env";
import { logger } from "../logger";
import { loadActiveRetentionPolicies, resolveRetentionDays } from "../lib/retention-policy";
import type { TaskHandler, TaskResult } from "../task-registry";

interface RetentionConfig {
  auditLogRetentionDays: number;
  notificationRetentionDays: number;
  /** AN-P2-004: first-party storefront analytics rows (no PII). */
  storeAnalyticsRetentionDays: number;
  /** WH-P3-009: outbound/inbound delivery audit rows. */
  webhookDeliveryRetentionDays: number;
  /** WH-P3-009: dead letters are kept longer so an operator can triage. */
  webhookDeadLetterRetentionDays: number;
}

const DEFAULT_CONFIG: RetentionConfig = {
  auditLogRetentionDays: 365,
  notificationRetentionDays: 90,
  storeAnalyticsRetentionDays: 90,
  webhookDeliveryRetentionDays: 90,
  webhookDeadLetterRetentionDays: 180,
};

/**
 * Rows deleted per batch. Deleting a year of audit rows in one statement takes
 * a long lock, can time out the connection, and holds a large transaction open
 * (audit DATA-P1-002). Batching keeps each transaction short and lets us report
 * progress.
 */
const BATCH_SIZE = 1000;

/**
 * Hard ceiling on batches per table per run. Without it a misconfigured
 * retention window (e.g. 0 days) would try to delete the entire table in one
 * invocation. When the cap is hit we report it rather than silently truncating,
 * so the next run continues and an operator sees the backlog.
 */
const MAX_BATCHES = 200;

interface PurgeOutcome {
  table: string;
  deleted: number;
  batches: number;
  /** True when MAX_BATCHES was reached before the backlog was drained. */
  truncated: boolean;
  error?: string;
}

/**
 * Delete rows older than `cutoff` in bounded batches.
 *
 * Selects ids first so we can report an actual count (a bare .delete() returns
 * no row count, which is how the previous implementation reported success
 * without knowing what it deleted) and so each batch is a bounded statement.
 */
async function purgeInBatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  table: string,
  cutoffIso: string,
): Promise<PurgeOutcome> {
  let deleted = 0;
  let batches = 0;

  while (batches < MAX_BATCHES) {
    const { data: batch, error: selectError } = await supabase
      .from(table)
      .select("id")
      .lt("created_at", cutoffIso)
      .limit(BATCH_SIZE);

    if (selectError) {
      return { table, deleted, batches, truncated: false, error: selectError.message };
    }
    if (!batch || batch.length === 0) {
      return { table, deleted, batches, truncated: false };
    }

    const ids = batch.map((row) => (row as { id: string }).id);
    const { error: deleteError } = await supabase.from(table).delete().in("id", ids);

    if (deleteError) {
      return { table, deleted, batches, truncated: false, error: deleteError.message };
    }

    deleted += ids.length;
    batches += 1;

    // A short batch means the backlog is drained.
    if (ids.length < BATCH_SIZE) {
      return { table, deleted, batches, truncated: false };
    }
  }

  return { table, deleted, batches, truncated: true };
}

/**
 * Archive audit rows older than `cutoff` and delete them, via the DB function
 * added in 5302442 (DATA-P2-005). The copy and the delete happen in one
 * transaction, so a failed archive can never destroy a row. The function caps
 * itself at BATCH_SIZE * MAX_BATCHES; hitting the cap means the backlog
 * remains for the next run.
 */
async function archiveAuditLogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  cutoffIso: string,
): Promise<PurgeOutcome> {
  const { data, error } = await supabase.rpc("archive_audit_logs", {
    p_cutoff: cutoffIso,
    p_batch_size: BATCH_SIZE,
    p_max_batches: MAX_BATCHES,
  });

  if (error) {
    return { table: "audit_logs", deleted: 0, batches: 0, truncated: false, error: error.message };
  }

  const deleted = typeof data === "number" ? data : 0;
  return {
    table: "audit_logs",
    deleted,
    batches: Math.ceil(deleted / BATCH_SIZE),
    truncated: deleted >= BATCH_SIZE * MAX_BATCHES,
  };
}

export const retentionTask: TaskHandler = async (
  payload?: Record<string, unknown>,
): Promise<TaskResult> => {
  const overrides = (payload ?? {}) as Partial<RetentionConfig>;
  const config = {
    ...DEFAULT_CONFIG,
    ...overrides,
  };

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  // Guard against a nonsensical window silently wiping the tables. Retention
  // must be a positive number of days; 0/negative/NaN would set the cutoff to
  // "now" and delete everything.
  for (const [name, days] of [
    ["auditLogRetentionDays", config.auditLogRetentionDays],
    ["notificationRetentionDays", config.notificationRetentionDays],
    ["storeAnalyticsRetentionDays", config.storeAnalyticsRetentionDays],
    ["webhookDeliveryRetentionDays", config.webhookDeliveryRetentionDays],
    ["webhookDeadLetterRetentionDays", config.webhookDeadLetterRetentionDays],
  ] as const) {
    if (typeof days !== "number" || !Number.isFinite(days) || days <= 0) {
      const error = `refusing to purge: ${name} must be a positive number of days (got ${String(days)})`;
      logger.error({ [name]: days }, `[retention] ${error}`);
      return { ok: false, error };
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: { transport: wsTransport },
  });

  // DATA-P2-006: prefer the product's retention_policies registry over the
  // hardcoded windows. An explicit payload override (manual/operator runs)
  // still wins; the registry is the next fallback, then the built-in default.
  const policies = await loadActiveRetentionPolicies(supabase);
  const auditWindow = resolveRetentionDays("audit_logs", config.auditLogRetentionDays, policies);
  const notificationWindow = resolveRetentionDays(
    "notifications",
    config.notificationRetentionDays,
    policies,
  );
  // WH-P3-009: webhook_deliveries and webhook_dead_letters had no purge path.
  const webhookDeliveryWindow = resolveRetentionDays(
    "webhook_deliveries",
    config.webhookDeliveryRetentionDays,
    policies,
  );
  const webhookDeadLetterWindow = resolveRetentionDays(
    "webhook_dead_letters",
    config.webhookDeadLetterRetentionDays,
    policies,
  );

  const auditDays =
    typeof overrides.auditLogRetentionDays === "number"
      ? overrides.auditLogRetentionDays
      : auditWindow.days;
  const notificationDays =
    typeof overrides.notificationRetentionDays === "number"
      ? overrides.notificationRetentionDays
      : notificationWindow.days;
  const webhookDeliveryDays =
    typeof overrides.webhookDeliveryRetentionDays === "number"
      ? overrides.webhookDeliveryRetentionDays
      : webhookDeliveryWindow.days;
  const webhookDeadLetterDays =
    typeof overrides.webhookDeadLetterRetentionDays === "number"
      ? overrides.webhookDeadLetterRetentionDays
      : webhookDeadLetterWindow.days;

  const auditCutoff = new Date();
  auditCutoff.setDate(auditCutoff.getDate() - auditDays);

  const notificationCutoff = new Date();
  notificationCutoff.setDate(notificationCutoff.getDate() - notificationDays);

  const storeAnalyticsCutoff = new Date();
  storeAnalyticsCutoff.setDate(storeAnalyticsCutoff.getDate() - config.storeAnalyticsRetentionDays);

  const webhookDeliveryCutoff = new Date();
  webhookDeliveryCutoff.setDate(webhookDeliveryCutoff.getDate() - webhookDeliveryDays);

  const webhookDeadLetterCutoff = new Date();
  webhookDeadLetterCutoff.setDate(webhookDeadLetterCutoff.getDate() - webhookDeadLetterDays);

  const outcomes: PurgeOutcome[] = [];
  outcomes.push(await archiveAuditLogs(supabase, auditCutoff.toISOString()));
  outcomes.push(
    await purgeInBatches(supabase, "notifications", notificationCutoff.toISOString()),
  );
  // AN-P2-004: storefront events previously had no retention path.
  outcomes.push(
    await purgeInBatches(supabase, "store_analytics_events", storeAnalyticsCutoff.toISOString()),
  );
  // WH-P3-009: bounded purges for the webhook delivery log and DLQ.
  outcomes.push(
    await purgeInBatches(supabase, "webhook_deliveries", webhookDeliveryCutoff.toISOString()),
  );
  outcomes.push(
    await purgeInBatches(supabase, "webhook_dead_letters", webhookDeadLetterCutoff.toISOString()),
  );

  const failures = outcomes.filter((o) => o.error);
  const truncated = outcomes.filter((o) => o.truncated);
  const summary = outcomes
    .map((o) => {
      const parts = [`${o.deleted} deleted in ${o.batches} batch(es)`];
      if (o.error) parts.push(`ERROR: ${o.error}`);
      if (o.truncated) parts.push(`truncated at ${MAX_BATCHES} batches (backlog remains)`);
      return `${o.table}: ${parts.join("; ")}`;
    })
    .join(" | ");

  logger.info(
    {
      outcomes,
      auditCutoff: auditCutoff.toISOString(),
      notificationCutoff: notificationCutoff.toISOString(),
      windows: {
        auditLogs: {
          days: auditDays,
          source:
            typeof overrides.auditLogRetentionDays === "number" ? "payload" : auditWindow.source,
          matchingPolicies: auditWindow.matchingPolicies,
        },
        notifications: {
          days: notificationDays,
          source:
            typeof overrides.notificationRetentionDays === "number"
              ? "payload"
              : notificationWindow.source,
          matchingPolicies: notificationWindow.matchingPolicies,
        },
      },
      storeAnalyticsCutoff: storeAnalyticsCutoff.toISOString(),
      webhookDeliveryCutoff: webhookDeliveryCutoff.toISOString(),
      webhookDeadLetterCutoff: webhookDeadLetterCutoff.toISOString(),
      webhookWindows: {
        deliveries: {
          days: webhookDeliveryDays,
          source:
            typeof overrides.webhookDeliveryRetentionDays === "number"
              ? "payload"
              : webhookDeliveryWindow.source,
        },
        deadLetters: {
          days: webhookDeadLetterDays,
          source:
            typeof overrides.webhookDeadLetterRetentionDays === "number"
              ? "payload"
              : webhookDeadLetterWindow.source,
        },
      },
    },
    `[retention] ${summary}`,
  );

  // Report failure honestly. The previous implementation returned ok:true even
  // when a purge errored, so a silent retention failure was indistinguishable
  // from success (DATA-P1-002).
  if (failures.length > 0) {
    return {
      ok: false,
      error: failures.map((f) => `${f.table}: ${f.error}`).join("; "),
    };
  }

  // Partial completion is not failure, but it must be visible.
  if (truncated.length > 0) {
    logger.warn(
      { tables: truncated.map((t) => t.table) },
      "[retention] backlog remains; next run will continue",
    );
  }

  return { ok: true };
};
