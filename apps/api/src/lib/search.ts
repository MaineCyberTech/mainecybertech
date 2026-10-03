/**
 * Sanitize a user-supplied search term before interpolating it into a
 * PostgREST `.or("col.ilike.<term>")` filter.
 *
 * PostgREST parses `,` as a condition separator, `()` as grouping, and `.` as
 * the column/operator/value separator inside a single condition. Leaving any
 * of those in lets a caller inject or reshape filter clauses, so they are all
 * stripped and replaced with spaces. `%` is a SQL LIKE wildcard, `*` is
 * PostgREST's full-text alias, and `"`/`\` are PostgREST quoting characters;
 * those are stripped too. Underscore is kept so identifiers like `user_id`
 * still search normally.
 *
 * Tradeoff (safety wins over convenience): a literal dot is NOT searchable.
 * Terms such as `example.com`, `10.0.0.1`, or `first.last` are flattened to
 * `example com`, `10 0 0 1`, `first last`. This is deliberate — `.` is the
 * exact token PostgREST uses to separate the filter operator from its value,
 * so allowing it through defeats the purpose of the sanitizer. There is no
 * encoding that both preserves the dot and guarantees it is treated as data
 * (the route builds the `.or()` grammar itself). The term is also capped at
 * 100 characters to bound misuse; anything longer is truncated.
 */
const MAX_SEARCH_TERM_LENGTH = 100;

export function sanitizeSearchTerm(input: unknown): string {
  const normalized = String(input ?? "")
    // `,()` grouping/separators, `.` operator separator, `"`/`\` quoting, `%`
    // LIKE wildcard, `*` PostgREST full-text alias — all replaced with spaces
    // so the remaining text can only ever be treated as opaque filter data.
    .replace(/[,()."\\%*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, MAX_SEARCH_TERM_LENGTH).trim();
}
