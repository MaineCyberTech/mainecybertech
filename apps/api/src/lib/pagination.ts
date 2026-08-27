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

/** Apply the parsed pagination range to a Supabase select query. */
export function applyPagination<T extends { range: (from: number, to: number) => T }>(
  query: T,
  input: PaginationInput,
): T {
  return query.range(input.offset, input.offset + input.limit - 1);
}
