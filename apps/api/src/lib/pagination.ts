/**
 * Reusable pagination helper (P2-21).
 *
 * Many list endpoints previously returned every row. This extracts the
 * page/limit query parsing and builds the Supabase range + pagination metadata
 * so endpoints stay consistent and bounded.
 */
export interface PaginationInput {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Upper bound for list endpoints that still return a plain array (the web
 * admin/portal UIs consume those directly). Prevents an unbounded table read
 * from exhausting API memory; full cursor pagination is a follow-up.
 */
export const LIST_HARD_CAP = 1000;

/**
 * Upper bound for CSV/JSON export queries (PERF-P3-001). Exports materialize
 * the whole result in memory before writing the response, so the cap protects
 * the 256MB API container from concurrent large reads. Streaming exports
 * remain a follow-up.
 */
export const EXPORT_ROW_LIMIT = 5000;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): PaginationInput {
  const defaultLimit = opts.defaultLimit ?? 20;
  const maxLimit = opts.maxLimit ?? 100;
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  let limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit;
  limit = Math.min(limit, maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

export function paginationMeta(input: PaginationInput, total: number): PaginationMeta {
  return {
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

/**
 * PERF-P3-002: choose the PostgREST count mode for a paginated list.
 *
 * `exact` runs a COUNT(*) scan for every list request; `estimated` uses
 * planner statistics and is enough for pagination chrome. Callers that need an
 * exact total opt in with `?withTotal=1` (or `?exactTotal=1`).
 */
export function listCountMode(query: Record<string, unknown>): "exact" | "estimated" {
  const value = query.withTotal ?? query.exactTotal;
  return value === "1" || value === "true" ? "exact" : "estimated";
}

/** Apply the parsed pagination range to a Supabase select query. */
export function applyPagination<T extends { range: (from: number, to: number) => T }>(
  query: T,
  input: PaginationInput,
): T {
  return query.range(input.offset, input.offset + input.limit - 1);
}
