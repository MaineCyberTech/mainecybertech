import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bounded-batch purge helper shared by the retention tasks.
 *
 * DATA-P1-002 (audit): deleting a year of rows in one statement takes a long
 * lock, can time out the connection, and holds a large transaction open.
 * PRIV-P3-003: the public-interaction PII purge had the same unbounded
 * single-statement delete, so the helper was extracted from the `retention`
 * task and is reused there.
 */

/**
 * Rows deleted per batch. Batching keeps each transaction short and lets the
 * task report real progress instead of guessing.
 */
export const BATCH_SIZE = 1000;

/**
 * Hard ceiling on batches per table per run. Without it a misconfigured
 * retention window (e.g. 0 days) would try to delete the entire table in one
 * invocation. When the cap is hit we report it rather than silently
 * truncating, so the next run continues and an operator sees the backlog.
 */
export const MAX_BATCHES = 200;

export interface PurgeOutcome {
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
export async function purgeInBatches(
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
