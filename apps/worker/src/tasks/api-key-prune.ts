import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskResult } from "../task-registry";

/**
 * Bounded prune path for expired API keys (SEC-P2-017 / ACM-P2-005).
 *
 * `expires_at` is enforced at authentication time (middleware/api-key.ts) but
 * expired rows accumulated forever. A scheduled worker task was chosen over a
 * cleanup in the list/create request path: it keeps write work and unbounded
 * scan cost off the API, and it matches the existing retention/orphan-cleanup
 * pattern. The task runs in two bounded phases:
 *
 *   1. deactivate keys whose `expires_at` has passed (`is_active = false`) so
 *      they surface as revoked in the admin UI immediately, then
 *   2. delete keys that have been expired for more than DELETE_GRACE_MS and
 *      are already inactive, so operators keep a recent audit view while the
 *      table cannot grow without bound.
 *
 * Each phase reads at most BATCH_SIZE rows and runs at most MAX_BATCHES
 * batches per invocation, so a large backlog cannot hold a long transaction
 * or blow the task timeout; a truncated run is logged and the next run
 * continues.
 */

const BATCH_SIZE = 1000;
const MAX_BATCHES = 20;
/** Keep expired keys visible (revoked) for this long before deleting them. */
const DELETE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

interface BatchOutcome {
  processed: number;
  truncated: boolean;
  error?: string;
}

interface BatchError {
  message: string;
}

/**
 * Run `act` over the ids returned by `selectBatch` until a short page (backlog
 * drained), the hard batch ceiling is hit, or a query fails. A failed read or
 * write stops the phase and is reported — never treated as "nothing to do".
 */
async function runBatched(
  selectBatch: () => Promise<{ data: Array<{ id: string }> | null; error: BatchError | null }>,
  act: (ids: string[]) => Promise<{ error: BatchError | null }>,
): Promise<BatchOutcome> {
  let processed = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data, error } = await selectBatch();
    if (error) return { processed, truncated: false, error: error.message };

    const ids = (data ?? []).map((row) => row.id);
    if (ids.length === 0) return { processed, truncated: false };

    const { error: actError } = await act(ids);
    if (actError) return { processed, truncated: false, error: actError.message };

    processed += ids.length;
    if (ids.length < BATCH_SIZE) return { processed, truncated: false };
  }

  return { processed, truncated: true };
}

export async function apiKeyPrune(_payload: Record<string, unknown>): Promise<TaskResult> {
  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const deleteCutoffIso = new Date(Date.now() - DELETE_GRACE_MS).toISOString();

    const deactivation = await runBatched(
      async () => {
        const { data, error } = await supabase
          .from("api_keys")
          .select("id")
          .eq("is_active", true)
          .lte("expires_at", nowIso)
          .limit(BATCH_SIZE);
        return { data: data as Array<{ id: string }> | null, error };
      },
      async (ids) => {
        const { error } = await supabase
          .from("api_keys")
          .update({ is_active: false, updated_at: nowIso })
          .in("id", ids);
        return { error };
      },
    );

    if (deactivation.error) {
      logger.error(
        { error: deactivation.error, deactivated: deactivation.processed },
        "API key prune: deactivation phase failed",
      );
      return { ok: false, error: `deactivate: ${deactivation.error}` };
    }

    const deletion = await runBatched(
      async () => {
        const { data, error } = await supabase
          .from("api_keys")
          .select("id")
          .eq("is_active", false)
          .lte("expires_at", deleteCutoffIso)
          .limit(BATCH_SIZE);
        return { data: data as Array<{ id: string }> | null, error };
      },
      async (ids) => {
        const { error } = await supabase.from("api_keys").delete().in("id", ids);
        return { error };
      },
    );

    if (deletion.error) {
      logger.error(
        { error: deletion.error, deleted: deletion.processed },
        "API key prune: deletion phase failed",
      );
      return { ok: false, error: `delete: ${deletion.error}` };
    }

    if (deactivation.truncated || deletion.truncated) {
      logger.warn(
        {
          deactivationTruncated: deactivation.truncated,
          deletionTruncated: deletion.truncated,
          maxBatches: MAX_BATCHES,
        },
        "API key prune: backlog remains; next run will continue",
      );
    }

    logger.info(
      { deactivated: deactivation.processed, deleted: deletion.processed },
      "API key prune complete",
    );
    return { ok: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "API key prune task failed");
    return { ok: false, error: errMsg };
  }
}
