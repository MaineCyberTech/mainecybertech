import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { wsTransport } from "../services/supabase";
import { env } from "../env";
import { logger } from "../logger";
import { loadActiveRetentionPolicies, resolveRetentionDays } from "../lib/retention-policy";
import { BATCH_SIZE, MAX_BATCHES, purgeInBatches, type PurgeOutcome } from "../lib/purge";
import type { TaskExecutionContext, TaskHandler, TaskResult } from "../task-registry";

interface RetentionConfig {
  auditLogRetentionDays: number;
  notificationRetentionDays: number;
  /** AN-P2-004: first-party storefront analytics rows (no PII). */
  storeAnalyticsRetentionDays: number;
  /** PRIV-P2-008: public store quote submissions (name/email/phone). */
  storeQuoteRetentionDays: number;
  /** PRIV-P2-008: structured quote requests whose `customer` jsonb holds PII. */
  storeQuoteRequestRetentionDays: number;
  /** WH-P3-009: outbound/inbound delivery audit rows. */
  webhookDeliveryRetentionDays: number;
  /** WH-P3-009: dead letters are kept longer so an operator can triage. */
  webhookDeadLetterRetentionDays: number;
}

const DEFAULT_CONFIG: RetentionConfig = {
  auditLogRetentionDays: 365,
  notificationRetentionDays: 90,
  storeAnalyticsRetentionDays: 90,
  storeQuoteRetentionDays: 90,
  storeQuoteRequestRetentionDays: 90,
  webhookDeliveryRetentionDays: 90,
  webhookDeadLetterRetentionDays: 180,
};

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
  context?: TaskExecutionContext,
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
    ["storeQuoteRetentionDays", config.storeQuoteRetentionDays],
    ["storeQuoteRequestRetentionDays", config.storeQuoteRequestRetentionDays],
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
  // PRIV-P2-008: public quote/lead PII had no purge path at all.
  const storeQuoteWindow = resolveRetentionDays(
    "store_quotes",
    config.storeQuoteRetentionDays,
    policies,
  );
  const storeQuoteRequestWindow = resolveRetentionDays(
    "store_quote_requests",
    config.storeQuoteRequestRetentionDays,
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
  const storeQuoteDays =
    typeof overrides.storeQuoteRetentionDays === "number"
      ? overrides.storeQuoteRetentionDays
      : storeQuoteWindow.days;
  const storeQuoteRequestDays =
    typeof overrides.storeQuoteRequestRetentionDays === "number"
      ? overrides.storeQuoteRequestRetentionDays
      : storeQuoteRequestWindow.days;
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

  const storeQuoteCutoff = new Date();
  storeQuoteCutoff.setDate(storeQuoteCutoff.getDate() - storeQuoteDays);

  const storeQuoteRequestCutoff = new Date();
  storeQuoteRequestCutoff.setDate(storeQuoteRequestCutoff.getDate() - storeQuoteRequestDays);

  const webhookDeliveryCutoff = new Date();
  webhookDeliveryCutoff.setDate(webhookDeliveryCutoff.getDate() - webhookDeliveryDays);

  const webhookDeadLetterCutoff = new Date();
  webhookDeadLetterCutoff.setDate(webhookDeadLetterCutoff.getDate() - webhookDeadLetterDays);

  // RES-P3-011: the registry aborts this signal at the task deadline, so the
  // bounded purge loops stop instead of continuing after the task was failed.
  const purgeOptions = { signal: context?.signal };
  const outcomes: PurgeOutcome[] = [];
  outcomes.push(await archiveAuditLogs(supabase, auditCutoff.toISOString()));
  outcomes.push(
    await purgeInBatches(supabase, "notifications", notificationCutoff.toISOString(), purgeOptions),
  );
  // AN-P2-004: storefront events previously had no retention path.
  outcomes.push(
    await purgeInBatches(
      supabase,
      "store_analytics_events",
      storeAnalyticsCutoff.toISOString(),
      purgeOptions,
    ),
  );
  // PRIV-P2-008: public quote/lead PII now has the same bounded purge.
  outcomes.push(
    await purgeInBatches(supabase, "store_quotes", storeQuoteCutoff.toISOString(), purgeOptions),
  );
  outcomes.push(
    await purgeInBatches(
      supabase,
      "store_quote_requests",
      storeQuoteRequestCutoff.toISOString(),
      purgeOptions,
    ),
  );
  // WH-P3-009: bounded purges for the webhook delivery log and DLQ.
  outcomes.push(
    await purgeInBatches(
      supabase,
      "webhook_deliveries",
      webhookDeliveryCutoff.toISOString(),
      purgeOptions,
    ),
  );
  outcomes.push(
    await purgeInBatches(
      supabase,
      "webhook_dead_letters",
      webhookDeadLetterCutoff.toISOString(),
      purgeOptions,
    ),
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
      storeQuoteCutoff: storeQuoteCutoff.toISOString(),
      storeQuoteRequestCutoff: storeQuoteRequestCutoff.toISOString(),
      storeWindows: {
        quotes: {
          days: storeQuoteDays,
          source:
            typeof overrides.storeQuoteRetentionDays === "number"
              ? "payload"
              : storeQuoteWindow.source,
          matchingPolicies: storeQuoteWindow.matchingPolicies,
        },
        quoteRequests: {
          days: storeQuoteRequestDays,
          source:
            typeof overrides.storeQuoteRequestRetentionDays === "number"
              ? "payload"
              : storeQuoteRequestWindow.source,
          matchingPolicies: storeQuoteRequestWindow.matchingPolicies,
        },
      },
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

  // RES-P3-011: the deadline signal stopped at least one purge early. The
  // registry has already failed the task, so never report success here.
  if (outcomes.some((o) => o.aborted)) {
    return {
      ok: false,
      error: "task aborted before completing; purge stopped early (next run continues)",
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
