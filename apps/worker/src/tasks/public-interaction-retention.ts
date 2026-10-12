import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import { loadActiveRetentionPolicies, resolveRetentionDays } from "../lib/retention-policy";
import { purgeInBatches } from "../lib/purge";
import type { TaskResult } from "../task-registry";

const DEFAULT_RETENTION_DAYS = 90;

export async function publicInteractionRetention(
  payload: Record<string, unknown>,
): Promise<TaskResult> {
  try {
    // A 0/negative/NaN payload window would set the cutoff to "now" and wipe
    // the table; refuse instead (same guard as the main retention task).
    const requested = typeof payload.retentionDays === "number" ? payload.retentionDays : undefined;
    if (requested !== undefined && (!Number.isFinite(requested) || requested <= 0)) {
      const error = `refusing to purge: retentionDays must be a positive number of days (got ${String(requested)})`;
      logger.error({ retentionDays: requested }, `Public interaction retention: ${error}`);
      return { ok: false, error };
    }

    const supabase = getSupabaseAdmin();

    // DATA-P2-006: an explicit payload window wins, then the active
    // retention_policies registry, then the built-in 90-day default.
    const policies = await loadActiveRetentionPolicies(supabase);
    const window = resolveRetentionDays(
      "public_interactions",
      DEFAULT_RETENTION_DAYS,
      policies,
    );
    const retentionDays = requested ?? window.days;

    const cutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    // PRIV-P3-003: the PII purge deletes in bounded batches (shared helper),
    // not one unbounded statement, and reports the real count.
    const outcome = await purgeInBatches(supabase, "public_interactions", cutoff);

    if (outcome.error) {
      logger.error(
        { error: outcome.error, retentionDays, cutoff },
        "Public interaction retention purge failed",
      );
      return {
        ok: false,
        error: outcome.error,
        deleted: outcome.deleted,
        batches: outcome.batches,
      };
    }

    logger.info(
      {
        purged: outcome.deleted,
        batches: outcome.batches,
        truncated: outcome.truncated,
        retentionDays,
        cutoff,
        window: { source: window.source, matchingPolicies: window.matchingPolicies },
      },
      "Public interaction retention purge complete",
    );

    if (outcome.truncated) {
      logger.warn(
        { purged: outcome.deleted, batches: outcome.batches },
        "[public-interaction-retention] backlog remains; next run will continue",
      );
    }

    return {
      ok: true,
      deleted: outcome.deleted,
      batches: outcome.batches,
      truncated: outcome.truncated,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "Public interaction retention task failed");
    return { ok: false, error: errMsg };
  }
}
