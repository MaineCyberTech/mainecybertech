/**
 * Sanitize a user-supplied search term before interpolating it into a
 * PostgREST `.or("col.ilike.<term>")` filter.
 *
 * PostgREST parses `,` as a condition separator and `()` as grouping, so
 * leaving them in lets a caller inject extra filter clauses; `%` is a SQL
 * LIKE wildcard and `"`/`\` are PostgREST quoting characters. We strip those
 * so the term is only ever treated as data (underscore is kept so identifiers
 * like `user_id` still search normally).
 */
export function sanitizeSearchTerm(input: unknown): string {
  return String(input ?? "")
    .replace(/[,()"\\%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
