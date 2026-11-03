# Search, Indexing and Privacy — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: SEARCH
- Scope limitations: read-only static review; no live Postgres/PostgREST, so query plans and RLS behaviour were verified from code/SQL only.

## Scope

Re-verified all 15 previous SEARCH findings at `6b7aa1a`: PostgREST filter sanitisation, admin/portal tenant scoping and PII projection, hashed audit logging, document visibility filtering, FTS/trigram indexes, rate limiting, pagination/counts, analytics metric/RPC and SDK/OpenAPI/docs parity. The diff changed the portal route to add the audit event (`SEARCH-P3-004`) and added its regression test.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Admin search | `routes/search.ts` `GET /search` | Cross-entity search | Working | Low | limit/counts, hashed audit |
| Portal search | `routes/search-portal.ts` `GET /search/portal` | Member search | Partial | Medium | Fixed 5, no counts |
| Sanitizer | `lib/search.ts:26-36` | PostgREST safety | Working | Low | Literal dots unsearchable |
| Visibility filter | `lib/document-visibility.ts` | `can_read_document` | Working | Low | Bounded over-fetch |
| Indexes | `5302456` btree/trgm + generated `search_vector` GIN | Query performance | Working | Low | tickets/projects/documents |
| Analytics RPC | `5302440` `get_analytics_summary` | Search analytics | Working | Low | Service-role only |
| Audit | `search.ts:241-261`, `search-portal.ts:96-117` | Hashed query log | Working | Low | Portal event lacks org id |
| UI | `AdminGlobalSearch.tsx`, `PortalGlobalSearch.tsx` | Search UX | Working | Low | Documents rendered |
| Contracts | `packages/sdk/src/search.ts`, `openapi/spec.ts` | Client contract | Working | Low | Portal fixed-5 documented |

## Domain scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Search routes/UI | 4 | Admin + portal + UI | Portal paging absent | P2-004 |
| Indexes | 4 | btree/trgm/GIN migration | — | — |
| Indexing jobs | 3 | Generated columns (no external indexer) | No reindex runbook evidence | Document |
| Indexed fields | 4 | name/title/description/mime | — | — |
| Tenant filters | 5 | Org pin + admin scope | — | — |
| Permission filters | 5 | `can_read_document` both routes | — | — |
| Entity coverage | 4 | users/orgs/tickets/projects/documents | Messages not searched | Future |
| Admin/global search | 4 | limit/counts/audit | — | — |
| Autocomplete | 3 | Debounced full search + limiter | No dedicated endpoint | Later |
| Search logs | 4 | Hashed audit both routes | Portal org id | Minor |
| Query analytics | 4 | Metric + RPC | — | — |
| Deleted/private data | 4 | Visibility + soft-delete columns dropped | — | — |

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/lib/search.ts` | Read | Sanitizer | Strips `,()."\%*`, caps 100 chars |
| `apps/api/src/routes/search.ts` | Read | Admin global search | Auth/org/admin order, scoping, counts, hashed audit |
| `apps/api/src/routes/search-portal.ts` | Read | Portal search | Documents + visibility + hashed audit |
| `apps/api/src/lib/document-visibility.ts` | Read | `can_read_document` mirror | Used by both routes |
| `supabase/migrations/5302432`, `5302440`, `5302456` | Read | Soft-delete drop, analytics RPC, indexes | Prefix/trigram + generated tsvector |
| `packages/sdk/src/search.ts`, `apps/api/src/openapi/spec.ts` | Read | Contracts | Documents/counts/limit shapes |
| `apps/api/src/__tests__/{search,search-tenant-scope,search-document-visibility,search-org-pin,search-portal,sanitize-search}.test.ts` | Read | Regression coverage | New portal audit test |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| Portal audit test read | Read | Asserts hash/length/counts and no raw term | `search-portal.test.ts:142-180` |
| Middleware order read | Read | Org-pinned admin check | `search.ts:22-27` |
| Route line walk | Read | Portal still fixed-5 | `search-portal.ts:20,94-100` |
| SQL read | Read | Index/FTS definitions | `5302456` |
| No live DB | Not run | Query plans not captured | Documented as a scope limitation |

## Executive Summary

14 of 15 previous SEARCH findings are **verified fixed**; `SEARCH-P2-004` remains **partially fixed**. `SEARCH-P3-004` (portal searches not audit-logged) closed in this diff: the portal route now writes the same privacy-preserving event as admin search — a truncated SHA-256 `queryHash`, `queryLength`, `surface: "portal"` and per-entity result counts, never the raw term. The new test asserts the raw term is absent.

The only remaining gap is unchanged: the portal route has a fixed 5-result page with no counts or offset, and the SDK documents that fixed-5 behaviour. Admin search accepts `limit` (max 25) and returns exact counts, so the two surfaces remain inconsistent. No new SEARCH findings and no regressions were identified.

## Findings

| ID | Sev | Status | Title |
|---|---|---|---|
| SEARCH-P1-001 | P1 | verified-fixed | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators |
| SEARCH-P1-002 | P1 | verified-fixed | Admin global search exposes profile PII and never tenant-scopes the organizations query |
| SEARCH-P2-001 | P2 | verified-fixed | Raw search terms persisted in plaintext `audit_logs.metadata` |
| SEARCH-P2-002 | P2 | verified-fixed | Portal search omits documents despite SDK and documentation contract |
| SEARCH-P2-003 | P2 | verified-fixed | Admin search UI silently discards the documents result set |
| SEARCH-P2-004 | P2 | partially-fixed | No search pagination or result counts; hard 5-result ceiling |
| SEARCH-P2-005 | P2 | verified-fixed | Search query analytics metric is dead and the analytics summary RPC is missing |
| SEARCH-P2-006 | P2 | verified-fixed | Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search |
| SEARCH-P2-007 | P2 | verified-fixed | Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface |
| SEARCH-P2-008 | P2 | verified-fixed | Admin global search returns private/internal documents without applying the `can_read_document` visibility filter |
| SEARCH-P2-009 | P2 | verified-fixed | Search router bypasses the org-pinned admin check, so a tenant admin can read another tenant's search results |
| SEARCH-P3-001 | P3 | verified-fixed | Soft-delete columns are defined but never used by queries or deletes |
| SEARCH-P3-002 | P3 | verified-fixed | Search module documentation is stale relative to the code |
| SEARCH-P3-003 | P3 | verified-fixed | Search SDK and OpenAPI contracts do not cover the implemented response (documents, counts, limit) |
| SEARCH-P3-004 | P3 | verified-fixed | Portal search queries are not audit-logged, unlike the admin search route |

Counts: **14 verified-fixed, 1 partially-fixed, 0 regressed, 0 new.**

## Key fix verified in this diff

### SEARCH-P3-004 — portal searches are now audit-logged without the raw term

`apps/api/src/routes/search-portal.ts:96-117` computes `sha256(q).slice(0,16)` and writes `search.query` with `surface: "portal"`, `queryLength` and `resultCounts`, never `q`. The regression test (`apps/api/src/__tests__/search-portal.test.ts:142-180`) asserts the audit event values and that `JSON.stringify(metadata)` does not contain the query. Residual note: the event has no `organization_id` because a portal search spans every membership; org-scoped audit readers cannot see it, while platform admins can.

## Residual — SEARCH-P2-004

Admin search now has `?limit` (default 5, cap 25) and per-entity exact counts (`search.ts:33,265-285`), surfaced in the SDK and OpenAPI. Portal search still hard-codes `RESULT_LIMIT = 5` (`search-portal.ts:20`) and returns no counts or offset (`:94-100`); the SDK explicitly documents "fixed page size of 5 per entity and no counts" (`packages/sdk/src/search.ts:43`). Closing it requires a portal `limit`/`offset` and count shape plus SDK/OpenAPI/doc updates.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Users cannot page past 5 portal results | P2 | Medium on document-heavy tenants | Missed tickets/documents | SEARCH-P2-004 | Add portal limit/counts |
| Search audit not org-visible | P3 | Low | Org admin cannot audit their users' searches | `search-portal.ts:96-117` | Add org ids to metadata/event fan-out |
| Literal-dot searches fail silently | P3 | Low | Search misses dotted names | `lib/search.ts:26-36` | Documented; escape-aware tokenizer later |

## Recommendations

### Immediate / Release Blocking

None.

### This Month

1. Add portal `limit`/`offset` + per-entity counts, and update the SDK, OpenAPI and `docs/modules/search-portal.md` together.
2. Include the searched organization ids (when a single org is resolved) in the portal audit metadata so org-scoped audit readers can reconstruct the event.

### Later

3. Consider an escape-aware tokenizer so literal dots/commas can be searched without reopening PostgREST injection.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add `limit` query param to portal | Unblocks typeahead/result paging | `search-portal.ts`, SDK | Route test |
| Return `counts` in portal response | Parity with admin search | `search-portal.ts`, SDK/OpenAPI | Contract test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Portal limit/offset + counts (SEARCH-P2-004) | P2 | API/web | M | SDK/OpenAPI update |
| Org id in portal search audit event | P3 | API/backend | S | Audit schema |
| Dedicated autocomplete surface | P3 | web/API | M | Product decision |
| Reindex runbook/evidence for tsvector backfill | P3 | data platform | S | Migration runbook |

## Suggested Tests

- Sanitizer: `a.eq.b`, `a*b`, `a,b`, backslash and quote inputs produce opaque text.
- Portal: `q` with >5 matches returns the count and honours `limit`; private documents never appear.
- Audit: portal event contains hash/length/counts and never the raw term; expired/unauthorised requests write nothing.
- FTS: `search_vector.wfts(english)` path returns matches on title/name/description.
- RLS: tenant admin with an explicit other-org `organization_id` gets 403/no rows.

## Suggested Documentation Updates

- `docs/modules/search-portal.md`: pagination/counts once added.
- `packages/sdk/src/search.ts`: remove the fixed-5 comment after the change.
- `docs/modules/search.md`: note the audit event's org-scoping limitation (or the fix).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is portal search expected to paginate or is fixed-5 a product decision? | Decides whether SEARCH-P2-004 closes | Product/UX decision |
| Should portal search audits fan out per organization? | Org-admin audit visibility | Compliance/audit requirement |
| Are literal-dot searches a real user need? | Sanitizer trade-off | Search analytics/top queries |

## Appendix

Portal audit implementation (verbatim shape):

```
metadata: {
  surface: "portal",
  queryHash: sha256(q).slice(0,16),
  queryLength: q.length,
  resultCounts: { tickets, projects, documents }
}
```

No live database was queried; evidence is code/SQL at `6b7aa1a5`.
