# Search, Indexing, and Privacy Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 31) · Area code: SEARCH
- Scope limitations: static read-only review at 7dd0402. No database/EXPLAIN/PostgREST access; no test suite executed. Index existence/selectivity is inferred from migrations; live query plans are `unverified`.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (14 SEARCH findings).

## Executive Summary

Search is fully remediated except the portal pagination residual. Both P1s are `verified-fixed`: the sanitizer strips every PostgREST grammar token and the admin search is org-scoped with super-admin-only PII. Documents now appear in both routes and both UIs, filtered by the `can_read_document` visibility mirror; search terms are only stored as a truncated hash; the prefix/wildcard mismatch is closed with btree/trigram indexes and generated `tsvector` columns; both routes are rate limited; and SDK/OpenAPI/docs match the implementation.

`SEARCH-P2-004` stays `partially-fixed`: the admin route gained `?limit` + per-entity counts, but the portal route still returns a fixed 5 per entity with no counts or offset (documented as such). One new P3: the portal search route — the highest-volume data-access path — emits no audit event, while the admin route records a privacy-preserving hashed audit row.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators | verified-fixed |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes organizations | verified-fixed |
| SEARCH-P2-001 | P2 | Raw search terms persisted in plaintext `audit_logs.metadata` | verified-fixed |
| SEARCH-P2-002 | P2 | Portal search omits documents | verified-fixed |
| SEARCH-P2-003 | P2 | Admin search UI silently discards the documents result set | verified-fixed |
| SEARCH-P2-004 | P2 | No search pagination or result counts; hard 5-result ceiling | partially-fixed |
| SEARCH-P2-005 | P2 | Search query analytics metric is dead and the analytics summary RPC is missing | verified-fixed |
| SEARCH-P2-006 | P2 | Prefix/wildcard mismatch: no btree on prefix columns and no full-text search | verified-fixed |
| SEARCH-P2-007 | P2 | Typeahead calls full search endpoints without rate limiting | verified-fixed |
| SEARCH-P2-008 | P2 | Admin global search returns private/internal documents without visibility filtering | verified-fixed |
| SEARCH-P2-009 | P2 | Search router bypasses the org-pinned admin check | verified-fixed |
| SEARCH-P3-001 | P3 | Soft-delete columns are defined but never used | verified-fixed |
| SEARCH-P3-002 | P3 | Search module documentation is stale | verified-fixed |
| SEARCH-P3-003 | P3 | Search SDK and OpenAPI contracts do not cover the implemented response | verified-fixed |
| SEARCH-P3-004 | P3 | Portal search queries are not audit-logged | **open (new)** |

### Re-verification evidence (headline rows)

- **SEARCH-P1-001** — `apps/api/src/lib/search.ts:26-36`; `sanitize-search.test.ts`.
- **SEARCH-P1-002 / P2-008 / P2-009** — `routes/search.ts:22-27` (middleware order), `:101-115` (org scope + PII projection), `:166-185,228-233` (visibility filter); `lib/document-visibility.ts` mirrors SQL `can_read_document` (5302129); tests `search-org-pin.test.ts`, `search-document-visibility.test.ts`, `search-tenant-scope.test.ts`.
- **SEARCH-P2-004 (partial)** — admin `search.ts:32-33,265-285`; portal `search-portal.ts:18,94-100` (fixed 5, no counts/offset); SDK documents the fixed portal size (`packages/sdk/src/search.ts:37`).
- **SEARCH-P2-006** — `supabase/migrations/5302456_search_prefix_and_fulltext_indexes.sql`; FTS branch at `search.ts:54-59` / `search-portal.ts:35-37`.
- **SEARCH-P3-004 (new)** — `search-portal.ts` has no `logAuditEvent` (contrast `search.ts:243-261`).

## Recommendations

1. **This month (partial):** finish the pagination rollout for the portal route (limit/offset + counts) or explicitly record the fixed-5 portal UX as the product decision.
2. **This quarter (new P3):** add the same hashed `search.query` audit event to the portal route.
3. **Later:** measure exact-count cost on large tenants; consider a cursor if the admin `?limit` grows.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Portal `search.query` audit (hashed) | Restores data-access traceability on the highest-volume path | `routes/search-portal.ts` |

## Suggested Tests

- Unit/route: portal search emits an audit event with `queryHash` and no raw term (new).
- Route: portal `?limit`/counts once implemented.
- Security: tenant admin requesting another org's `organization_id` gets 403 (exists).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is fixed-5 portal search the intended UX? | Determines whether SEARCH-P2-004 can close as designed | Product decision |
