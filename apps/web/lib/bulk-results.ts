import type { BulkUpdateResult } from "@mct/sdk";

export type BulkItemFailure = { id: string; error: string };

export type BulkSummary = {
  succeeded: string[];
  failed: BulkItemFailure[];
};

/**
 * Turn a bulk update API response into per-item results.
 *
 * USE-P2-001: the bulk endpoints return `{ results, successful, failed }`; the
 * web actions must report the real per-item outcome and must never fall back to
 * "all requested ids succeeded". The API pre-filters ids to the caller's tenant
 * scope, so requested ids missing from the response were not applied and are
 * reported as failures instead of being silently counted as successes.
 */
export function summarizeBulkUpdate(
  requestedIds: string[],
  result: BulkUpdateResult | null | undefined,
): BulkSummary {
  if (!result || !Array.isArray(result.results)) {
    throw new Error(
      "The server did not return per-item bulk results; no changes were applied.",
    );
  }

  const succeeded: string[] = [];
  const failed: BulkItemFailure[] = [];
  const returned = new Set<string>();

  for (const row of result.results) {
    if (!row || typeof row.id !== "string") continue;
    returned.add(row.id);
    if (row.success) {
      succeeded.push(row.id);
    } else {
      failed.push({ id: row.id, error: row.error || "Update failed" });
    }
  }

  for (const id of requestedIds) {
    if (!returned.has(id)) {
      failed.push({ id, error: "Not found or not accessible" });
    }
  }

  return { succeeded, failed };
}
