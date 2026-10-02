# Search, Indexing, and Privacy Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: `C:/temp/mainecybertech` (`mainecybertech-portal` monorepo)
- Branch: develop
- Commit SHA: 6286137017c4b7c77e83ee420ec11382d984f263 (short `62861370`)
- Generated at: 2026-10-02T03:44Z
- Auditor: subagent (prompt 31)
- Area code: SEARCH
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/31_search_indexing_privacy_audit.md
- Scope limitations:
  - Static, read-only review of the working tree at the audited commit. No running database, no hosted Supabase project, and no production access were used. All DB-level behavior (RLS enforcement, `pg_trgm` index usage, PostgREST `.or()` parsing) is inferred from SQL/TypeScript source, not exercised live.
  - `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED` runtime values are not committed; the default (empty allow-list) is assumed from code and env schema.
  - Prior sibling `get_analytics_summary` analysis is cross-referenced (06 `SEC-P2-004`) and not duplicated here.
  - No external search provider, indexing job, or reindexing scheduler was found, so those scope rows are "not applicable" rather than "unknown".

## Scope

Reviewed:

- Search API routes: `apps/api/src/routes/search.ts` (admin global), `apps/api/src/routes/search-portal.ts` (portal), `apps/api/src/lib/search.ts` (`sanitizeSearchTerm`).
- Adjacent search surfaces that reuse the same sanitizer / `ilike`: `knowledge-base.ts`, `edu-automation.ts` (`/kb/search`), `assets.ts`, `approvals.ts`, `proposals.ts`, `vendors.ts`, `network-diagrams.ts`, `staging.ts`, `findings.ts`, `device-profiles.ts`, `domain-monitors.ts`.
- UI: `apps/web/components/admin/AdminGlobalSearch.tsx`, `apps/web/components/portal/PortalGlobalSearch.tsx`, `apps/web/components/admin/AdminListPageSearch.tsx`, `apps/web/e2e/admin/search.spec.ts`.
- SDK: `packages/sdk/src/search.ts`, `packages/sdk/src/index.ts`.
- Indexes/migrations: `supabase/migrations/5302102_add_performance_indexes.sql`, `5302109_soft_delete.sql`, `5302135_profiles_encrypted_pii.sql`, `5302026_...consolidated...v3.sql` (RLS policies), `5302110_restore_document_permissions.sql`, `5302112_fix_rls_approved_membership.sql`.
- Authorization chain: `apps/api/src/middleware/auth.ts`, `admin.ts`, `org-access.ts`, `apps/api/src/services/supabase.ts` (`getScopedClient`), `apps/api/src/services/audit.ts`.
- Logs/analytics/retention: `apps/api/src/lib/metrics.ts`, `apps/api/src/routes/analytics.ts`, `apps/worker/src/tasks/retention.ts`, `docs/MONITORING_AND_ALERTING.md`.
- Tests: `apps/api/src/__tests__/search.test.ts`, `search-portal.test.ts`, `sanitize-search.test.ts`, `tenant-scoping-guard.test.ts`, `get-scoped-client.test.ts`.

Not reviewed / out of scope:

- Runtime EXPLAIN plans and live index selectivity (no DB).
- Hosted Supabase function catalog (only repo migrations/seeds).
- Vector/AI/RAG retrieval (not present).
- The full audit-log reader UI (covered by prompts 06/37).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/routes/search.ts:12` | Source | Admin global search authz | `router.use(requireAuth, requireAdmin, requireOrgAccess)` |
| `apps/api/src/routes/search.ts:23-24` | Source | Wildcard construction | `searchTerm = q%`, `wildcardTerm = %q%` |
| `apps/api/src/routes/search.ts:35-56` | Source | Profiles/PII query + org scoping | Selects `id, full_name, email, phone, title` |
| `apps/api/src/routes/search.ts:93-97` | Source | Organizations query | **No** org scoping applied |
| `apps/api/src/routes/search.ts:76-107` | Source | Documents query + error handling | Documents added since prior run |
| `apps/api/src/routes/search.ts:109-123` | Source | Audit logging of raw query | `metadata.query = q` (plaintext) |
| `apps/api/src/routes/search-portal.ts:20` | Source | Scoped client selection | `getScopedClient(req, "search-portal", "read")` |
| `apps/api/src/routes/search-portal.ts:23-49` | Source | Tenant filter | Memberships → orgIds → `.in("organization_id", orgIds)` |
| `apps/api/src/lib/search.ts:11-16` | Source | Query sanitizer | Strips `,()"\ %`; **keeps `.`** |
| `apps/api/src/__tests__/sanitize-search.test.ts:1-25` | Test | Sanitizer coverage | No `.`-injection case |
| `apps/api/src/__tests__/search.test.ts:32-37` | Test | Admin router test shim | Mocks `requireAdmin` to `next()` — authz never asserted |
| `apps/api/src/__tests__/search-portal.test.ts` | Test | Portal router tests | No cross-tenant/RLS assertion |
| `apps/web/e2e/admin/search.spec.ts` | E2E | Admin search smoke | UI presence only; no result-shape assertion |
| `supabase/migrations/5302102_add_performance_indexes.sql:7-16` | Migration | GIN trigram indexes | `pg_trgm` + 7 `gin_trgm_ops` indexes |
| `supabase/migrations/5302109_soft_delete.sql:1-17` | Migration | Soft-delete columns | `deleted_at`/`deleted_by` on tickets/projects/documents |
| `supabase/migrations/5302135_profiles_encrypted_pii.sql:1-26` | Migration | PII-at-rest | Encrypted mirror; **plaintext columns remain source of truth** |
| `supabase/migrations/5302026_....v3.sql:997-1013,1132-1139,1193-1200,2181-2187` | Migration | RLS select policies | profiles/tickets/projects/documents select scoping |
| `apps/api/src/middleware/admin.ts:24-30` | Source | `requireAdmin` role set | Accepts `admin` **or** `super_admin` |
| `apps/api/src/middleware/org-access.ts:43-63,107-124` | Source | Platform-admin cross-tenant grant | Platform key in any membership grants any org |
| `apps/api/src/services/supabase.ts:163-186` | Source | `getScopedClient` | Service-role fallback unless module allow-listed |
| `apps/api/src/lib/metrics.ts:68-72,123-125` | Source | Search metric | Defined; `recordSearchQuery` never called |
| `apps/api/src/routes/analytics.ts:80-91` | Source | Analytics summary | `rpc("get_analytics_summary")` |
| `apps/worker/src/tasks/retention.ts:12-50` | Source | Log retention | audit_logs 365d, notifications 90d |
| `packages/sdk/src/search.ts:4-26` | SDK | Search contract | `PortalSearchResult.documents` declared |
| `docs/API_ENDPOINT_INVENTORY.md:163-164` | Doc | Documented contract | Claims portal search returns documents |
| `docs/modules/search.md`, `docs/modules/search-portal.md` | Doc | Module docs | Omits documents; states all-org admin scope |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `git -C C:\temp\mainecybertech rev-parse HEAD` | Command | Bind report to commit | `6286137017c4b7c77e83ee420ec11382d984f263` on `develop` |
| `grep -rn "deleted_at" apps/api/src` | Command | Deleted-data filtering | 2 matches, both `openapi/spec.ts` + contract test — **no runtime query filters `deleted_at`** |
| `grep -rn "recordSearchQuery" apps` | Command | Metric wiring | Only definition in `metrics.ts`; **zero call sites** |
| `grep -rn "get_analytics_summary" supabase/` | Command | Reproduce sibling 06 | Zero definitions in migrations/seeds — still open (`SEC-P2-004`) |
| `grep -rn "ilike" apps/api/src/routes` | Command | Search surface inventory | 10+ routes; only `search.ts`/`search-portal.ts`/`knowledge-base.ts`/`edu-automation.ts` use `sanitizeSearchTerm` |
| `grep -rn "autocomplete|typeahead|suggest" apps/api/src` | Command | Autocomplete endpoint | No dedicated endpoint; only AI triage "suggestions" |
| `grep -rn "search_queries|searchable_fields|search_log" supabase/` | Command | Search analytics/field config | No matches |
| `grep -rn "documents" apps/web/components/admin/AdminGlobalSearch.tsx` | Command | UI consumption of documents | No matches — API array is discarded |
| Read `apps/api/src/routes/search.ts` (full) | Read | Trace admin handler | Confirms org query unscoped; documents scoped |
| Read `apps/api/src/routes/search-portal.ts` (full) | Read | Trace portal handler | Confirms membership-derived org filter only |
| Read `apps/api/src/lib/search.ts` (full) | Read | Sanitizer grammar | `%` stripped; `.` retained |
| Read `apps/api/src/services/supabase.ts:144-190` | Read | RLS client behavior | `search-portal` not in default allow-list ⇒ service role |
| Read prior run `prompts/repo-deep-dive/20260730-0650-develop-62da92c/31_...md` | Read | Continuity | Compared finding-by-finding at current commit |

Verification outcomes against the prior run's headline claims:

| Prior claim | Outcome | Note |
|---|---|---|
| SEARCH-P1-001 "Documents not searchable" | **partially supported → partially-fixed** | Admin search now queries `documents` (`search.ts:76-83`); portal search still does not. |
| SEARCH-P1-002 "ILIKE leading wildcard prevents B-tree" | **supported (still open)** | `wildcardTerm` unchanged; GIN trigram present; no prefix btree. |
| SEARCH-P2-001 "No pagination" | **supported (still open)** | Hard `.limit(5)` per type in both routes. |
| SEARCH-P2-002 "No search analytics" | **supported (still open)** | Metric defined, unwired; no analytics table. |
| SEARCH-P2-003 "No full-text on document content" | **supported (still open)** | No `tsvector`, no extraction worker for search. |
| SEARCH-P3-001 "No field-level permission filtering" | **supported (still open)** | All matched columns returned. |
| Prior "Admin search: no tenant filter" | **unsupported now** | Admin search now scopes users/tickets/projects/documents to the admin's orgs (`search.ts:26-83`) — but **not** organizations. |

## Executive Summary

Search in this repository is a Postgres-native, real-time implementation: two authenticated REST endpoints (`GET /api/v1/search`, `GET /api/v1/search/portal`) issue `ilike`/`or` filters against Supabase, accelerated by seven `gin_trgm_ops` indexes (`5302102`). There is **no** external index (no Elasticsearch/Algolia/Meilisearch), **no** indexing job, **no** reindexing scheduler, **no** `tsvector` full-text column, and **no** dedicated autocomplete/suggestion endpoint. Because search reads live tables, there is no stale-index or index-deletion problem by construction — the privacy risks are about *what is queried, returned, and logged*, not about index residue.

Strengths worth stating: (1) both endpoints are authenticated; (2) portal search derives its org scope from the caller's own approved memberships and never trusts a client-supplied org id; (3) a dedicated `sanitizeSearchTerm` was added since the prior run to strip PostgREST separators (`search.ts` / `lib/search.ts`); (4) admin search was widened to include documents and to scope most entity types to the admin's orgs; (5) `pg_trgm` trigram indexes exist for every searched column except organizations' slug path.

The material gaps at this commit:

1. **Filter-injection hardening gap** — `sanitizeSearchTerm` strips `,`, `()`, `"`, `\`, `%` but keeps `.`, which is PostgREST's operator separator inside `.or()` expressions. Whether a crafted dotted term can shift the parsed condition boundary is unproven from repo evidence alone (no live PostgREST), hence filed with Medium/Low confidence, but it is a cheap, clearly-correct hardening.
2. **Admin PII + cross-tenant org enumeration** — admin global search returns `profiles.email`/`profiles.phone` and the `organizations` result set is **never** org-scoped, even though the same handler scopes every other entity. Any `admin` role (not just `super_admin`) can enumerate all tenant names/slugs/statuses.
3. **Search terms persisted in plaintext audit metadata** — `metadata.query` stores the raw term; the audit redactor matches on *key names*, not values, so a term containing an email or phone number survives in `audit_logs` for the 365-day retention window.
4. **Contract drift** — the SDK declares `PortalSearchResult.documents` and `API_ENDPOINT_INVENTORY.md` states portal search returns documents, but neither the route nor the UI does; the admin API returns `documents` and the admin UI silently discards them.
5. **Observability dead-end** — `portal_search_queries_total` is registered but `recordSearchQuery()` has no caller, and there is no search-term analytics store. The admin analytics summary endpoint still calls a non-existent `get_analytics_summary` RPC (`SEC-P2-004`, cross-referenced).

Recommended next actions: (a) extend the sanitizer to strip `.` and add regression tests; (b) scope the organizations query and drop `phone`/`email` from admin search output (or gate them to `super_admin`); (c) redact search terms by value before audit insert; (d) fix the SDK/doc/UI contract for documents; (e) wire `recordSearchQuery()` and add a zero-result counter. None of these are P0.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Admin global search route | `apps/api/src/routes/search.ts` `GET /api/v1/search` | Cross-entity admin search | Implemented | High | users/orgs/tickets/projects/documents |
| Portal search route | `apps/api/src/routes/search-portal.ts` `GET /api/v1/search/portal` | Org-scoped search | Implemented | Medium | tickets/projects only |
| Search sanitizer | `apps/api/src/lib/search.ts` `sanitizeSearchTerm` | PostgREST filter safety | Implemented | Medium | `.` not stripped |
| Admin search UI | `apps/web/components/admin/AdminGlobalSearch.tsx` | Typeahead UI | Implemented | Low-Med | Ignores `documents` |
| Portal search UI | `apps/web/components/portal/PortalGlobalSearch.tsx` | Typeahead UI | Implemented | Low | 300ms debounce |
| Admin list filter | `apps/web/components/admin/AdminListPageSearch.tsx` | Per-list search box | Implemented | Low | — |
| SDK search API | `packages/sdk/src/search.ts` `SearchApi` | Client contract | Implemented | Medium | Portal type declares `documents` |
| GIN trigram indexes | `supabase/migrations/5302102_add_performance_indexes.sql` | Fuzzy text search perf | Implemented | Low | 7 indexes |
| Composite indexes | `5302102` (audit_logs, tickets, projects, notifications, document_versions) | Common query patterns | Implemented | Low | — |
| Soft-delete columns | `supabase/migrations/5302109_soft_delete.sql` | Tombstoning | **Unused** | Low | No query filters `deleted_at` |
| Encrypted PII mirror | `supabase/migrations/5302135_profiles_encrypted_pii.sql` | PII at rest | Implemented | Medium | Plaintext columns still source of truth |
| Search metric | `apps/api/src/lib/metrics.ts:68` `portal_search_queries_total` | Search volume | **Dead** | Low | No caller |
| Analytics summary RPC | `apps/api/src/routes/analytics.ts:84` `get_analytics_summary` | Admin analytics | **Missing RPC** | Medium | `SEC-P2-004` |
| Audit retention | `apps/worker/src/tasks/retention.ts` | Purge audit/notifications | Implemented | Low-Med | 365d / 90d; not exercised in audit |
| External index | — | — | Absent | — | Not applicable |
| Indexing/reindex job | — | — | Absent | — | Not applicable |
| Autocomplete endpoint | — | — | Absent | — | Debounced full search used instead |
| Search-terms analytics table | — | — | Absent | Medium | No `search_queries` table |
| Field-level visibility config | — | — | Absent | Low | No `searchable_fields` |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Search routes/UI | 3 | `search.ts`, `search-portal.ts`, both `*GlobalSearch.tsx` | Admin UI drops documents; no pagination | Render documents; add pagination |
| Indexes | 3 | `5302102` GIN trigram + composites | No prefix btree; no tsvector; slug path unindexed | Add expression/btree indexes for prefix; consider `tsvector` |
| Indexing jobs | N/A | No external index or worker task found | Real-time queries only | Document the "no external index" decision |
| Indexed fields | 2 | `5302102`, route `.select()` lists | PII (`email`,`phone`) surfaced; descriptions searched | Define a per-entity searchable-field allowlist |
| Tenant filters | 3 | `search-portal.ts:23-49`; `search.ts:26-83` | Admin `organizations` query unscoped | Scope organizations in admin search |
| Permission filters | 2 | `requireAdmin`/`requireAuth` only | No field-level or per-role filtering | Add role-aware field projection |
| Document/ticket/project/message search | 2 | `search.ts:58-83`; `search-portal.ts:36-49` | Portal misses documents; no message search | Add documents to portal; define message search or document absence |
| Admin/global search | 3 | `search.ts` | PII exposure + org enumeration | Gate PII to `super_admin`; scope orgs |
| Autocomplete | 2 | Debounced UI calls to full endpoints | No dedicated endpoint; amplification | Add rate limit/cache or dedicated lightweight endpoint |
| Search logs | 3 | `logAuditEvent` in `search.ts:109-123` | Raw term stored; no query text redaction | Value-level redaction; define retention |
| Query analytics | 1 | `metrics.ts:68`; `analytics.ts:84` | Dead metric; missing RPC; no analytics store | Wire metric; add zero-result tracking; fix/replace RPC |
| Deleted data removal | 3 | `5302109`; hard-delete in `documents.ts:546`; no `deleted_at` filters | Soft-delete unused; latent if wired | Either implement soft-delete filtering or drop the columns |

## Detailed Review

### Item: Admin global search (`GET /api/v1/search`)

- Evidence: `apps/api/src/routes/search.ts`; authz `search.ts:12`; scoping `search.ts:26-83`; org query `search.ts:93-97`; audit `search.ts:109-123`.
- What it does: Authenticated `admin`/`super_admin` search across `profiles`, `organizations`, `tickets`, `projects`, `documents`. Minimum 2 chars; `.limit(5)` per entity.
- How it appears to work: Resolves the caller's approved memberships (`organization_id` list). For profiles it filters user ids to members of those orgs; for tickets/projects/documents it adds `.in("organization_id", adminOrgIds)`. When `adminOrgIds` is empty the filters are skipped entirely. The `organizations` query is always unscoped. Results are logged to `audit_logs` with the raw query, then returned.
- Dependencies: `requireAdmin`, `requireOrgAccess`, `getSupabaseAdmin` (service role), `sanitizeSearchTerm`, `logAuditEvent`.
- Current controls: Authentication; `admin`/`super_admin` role check; approved-membership resolution; trigram indexes.
- Missing controls: Field-level/role-based projection; organizations tenant scoping; value-level PII redaction in audit metadata; pagination; per-entity counts.
- Risks: Cross-tenant organization enumeration; staff PII (`email`, `phone`) exposure to `admin`; raw search terms at rest.
- Recommended improvement: Scope the `organizations` query to `adminOrgIds` (or gate to `super_admin`); remove `phone`/`email` from the default projection or restrict to `super_admin`; add `limit`/`offset`; redact query values before audit insert.
- Suggested tests: super_admin vs org-admin result-set diff; `admin` cannot see other tenants' orgs; searched email not present in stored audit metadata.
- Suggested docs: `docs/modules/search.md` (documents, scoping, PII).

### Item: Portal search (`GET /api/v1/search/portal`)

- Evidence: `apps/api/src/routes/search-portal.ts`; scoped client `:20`; membership filter `:23-49`.
- What it does: Org-scoped search over `tickets` and `projects`, limited to the caller's approved memberships.
- How it appears to work: Uses `getScopedClient(req, "search-portal", "read")` — which falls back to the service-role client unless `search-portal` is in `RLS_READS_ENABLED` (empty by default) — then derives `orgIds` from `memberships` and applies `.in("organization_id", orgIds)`.
- Dependencies: `requireAuth`, `getScopedClient`, `memberships`, `sanitizeSearchTerm`.
- Current controls: Authentication; membership-derived tenant filter server-side.
- Missing controls: Documents not searched; no pagination; RLS not exercised by default (service-role client); no rate limiting.
- Risks: Contract drift (SDK/docs promise documents); tenant isolation rests entirely on the membership query (no defense-in-depth RLS by default).
- Recommended improvement: Add documents (respecting `can_read_document`/visibility); add pagination; enable `search-portal` in `RLS_READS_ENABLED` in staging then prod; add rate limiting.
- Suggested tests: RLS-on matrix test (member of org A cannot match org B tickets); documents visibility test.
- Suggested docs: `docs/modules/search-portal.md`; `docs/MULTI_TENANCY.md`-style note on search scope.

### Item: Query sanitizer (`sanitizeSearchTerm`)

- Evidence: `apps/api/src/lib/search.ts:11-16`; tests `apps/api/src/__tests__/sanitize-search.test.ts`.
- What it does: Coerces input to string, replaces `,()"\ %` with spaces, collapses whitespace, trims.
- How it appears to work: PostgREST `.or("col.ilike.<term>")` treats `,` as a condition separator and `()` as grouping, so stripping those prevents clause injection. `%` (SQL LIKE wildcard) is stripped and the code re-adds its own `%`.
- Dependencies: Used by `search.ts`, `search-portal.ts`, `knowledge-base.ts`, `edu-automation.ts`.
- Current controls: Separator/grouping/wildcard stripping; min-length check.
- Missing controls: `.` (PostgREST operator separator) not stripped; `*` (PostgREST full-text `like`/`ilike` alias) not stripped; no length cap.
- Risks: If PostgREST's parser allows a trailing dotted token to be reinterpreted, an attacker could alter filter semantics. Unproven without a live PostgREST instance (documented as Medium/Low confidence).
- Recommended improvement: Also strip `.` and `*`; add a max length (e.g. 100); add explicit tests for `a.eq.b` and `a*`.
- Suggested tests: `sanitizeSearchTerm("a.eq.b") === "a eq b"`; integration test that `.or` receives a single literal.
- Suggested docs: `docs/API_SECURITY.md` note on filter construction.

### Item: Indexes and query performance

- Evidence: `supabase/migrations/5302102_add_performance_indexes.sql:7-16`; route filter construction `search.ts:23-24,61,70,79`, `search-portal.ts:21,41,47`.
- What it does: Enables `pg_trgm`; creates GIN trigram indexes on `profiles.full_name`, `profiles.email`, `organizations.name`, `tickets.title`, `tickets.description`, `projects.name`, `projects.description`.
- How it appears to work: Admin search uses `searchTerm = q%` for profiles.full_name/organizations.name/slug (prefix form, could use btree) and `%q%` (wildcard) for emails, tickets and projects. No `tsvector` exists.
- Dependencies: `pg_trgm` extension.
- Current controls: Trigram indexes cover wildcard scans; composite indexes for common patterns.
- Missing controls: No btree on org slug/name prefix; no `tsvector` for ranked full-text; descriptions searched with unindexed `%q%` for `organizations.slug`.
- Risks: Full table scans for slug search and on datasets lacking matching trigram selectivity; higher write cost from GIN.
- Recommended improvement: Add plain btree indexes for prefix-only columns; consider `to_tsvector` generated columns + GIN for English text; measure with EXPLAIN.
- Suggested tests: performance regression test with seeded volume; EXPLAIN assertion in a DB-backed test suite.
- Suggested docs: `docs/DATABASE_INDEXES.md`.

### Item: Soft delete vs search/deletion

- Evidence: `supabase/migrations/5302109_soft_delete.sql:1-17`; `documents.ts:528-563` (hard delete); `grep "deleted_at" apps/api/src` (no runtime filters).
- What it does: Adds `deleted_at`/`deleted_by` to tickets, projects, documents plus indexes.
- How it appears to work: No application code reads or writes these columns; deletes are physical (`supabase.from("documents").delete()`), and storage objects are removed first.
- Dependencies: None.
- Current controls: Hard delete removes rows, so deleted data is not searchable today.
- Missing controls: No soft-delete wiring, no restore, no tombstone retention.
- Risks: Latent — if soft-delete is later wired without adding `deleted_at is null` to search filters, deleted tickets/projects/documents become searchable again.
- Recommended improvement: Either implement soft-delete end-to-end (including search filters) or drop the unused columns to avoid a false impression of a tombstone/restore capability.
- Suggested tests: If soft-delete is adopted, a test asserting a soft-deleted ticket never appears in admin or portal search.
- Suggested docs: `docs/DATA_RETENTION.md`.

### Item: Search logging, analytics, and retention

- Evidence: `apps/api/src/routes/search.ts:109-123`; `apps/api/src/services/audit.ts:34-45`; `apps/api/src/lib/metrics.ts:68-125`; `apps/worker/src/tasks/retention.ts`; `docs/MONITORING_AND_ALERTING.md:132`.
- What it does: Admin search writes an `audit_logs` row (`action: "search.query"`) with `metadata.query` and per-entity result counts. `portal_search_queries_total` exists but is not incremented.
- How it appears to work: Audit redaction replaces values only when the *key* contains PII-ish names; `query` is not a PII key, so its *value* is stored verbatim. Retention deletes `audit_logs` older than 365 days.
- Dependencies: `logAuditEvent`, worker `retention` task, Prometheus registry.
- Current controls: Admin-search audit trail; 365-day purge; no portal-search logging (portal route logs nothing).
- Missing controls: Value-level term redaction; portal search audit/metrics; zero-result tracking; no analytics store; documented metric is dead.
- Risks: Sensitive terms (emails, names, ticket keywords) persist in audit metadata; no signal for zero-result/abusive queries; no portal-side floor.
- Recommended improvement: Redact/truncate query values (hash or length-cap); call `recordSearchQuery()`; add zero-result counter; add a `search_queries` analytics table (query hash, result count, entity mix) if product analytics are wanted; fix or replace `get_analytics_summary` (`SEC-P2-004`).
- Suggested tests: audit-metadata assertion that an email-like term is not stored verbatim; metric-increment test; zero-result counter test.
- Suggested docs: `docs/MONITORING_AND_ALERTING.md` (wire status), `docs/PRIVACY.md`.

### Item: SDK / UI / docs contract for documents

- Evidence: `packages/sdk/src/search.ts:11-15,24-26`; `docs/API_ENDPOINT_INVENTORY.md:163-164`; `apps/web/components/admin/AdminGlobalSearch.tsx` (no `documents`); `search-portal.ts:54-59`.
- What it does: SDK `PortalSearchResult` declares `documents`; inventory doc says portal returns documents; admin UI type omits documents; portal route returns only tickets/projects.
- How it appears to work: Three-way drift between SDK type, documented contract, and server behavior.
- Dependencies: `packages/sdk`, web components, docs.
- Current controls: None — drift is undetected by tests.
- Missing controls: Contract test between SDK types, OpenAPI spec, and route responses.
- Risks: Client code may read `result.documents` and get `undefined`; documentation misleads implementers and AI agents.
- Recommended improvement: Align the SDK, OpenAPI, docs, and routes; either add documents to portal search (respecting visibility) or remove `documents` from `PortalSearchResult`/docs.
- Suggested tests: SDK↔response shape contract test; openapi-contracts test extended to search payloads.
- Suggested docs: `docs/modules/search.md`, `docs/modules/search-portal.md`, `docs/API_ENDPOINT_INVENTORY.md`.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| SEARCH-001 | Search routes/UI | `search.ts`, `search-portal.ts`, UIs | `requireAuth`(+`requireAdmin`) | No pagination; UI drift | P2 | Align UI + add pagination |
| SEARCH-002 | Indexes | `5302102` | GIN trigram | No prefix btree/tsvector | P2 | Add btree + measure |
| SEARCH-003 | Indexing jobs | none found | N/A (real-time) | No external index decision doc | P3 | Document decision |
| SEARCH-004 | Indexed fields | route `.select()` | Whole row subset | PII surfaced; no allowlist | P1 | Field allowlist + role gating |
| SEARCH-005 | Tenant filters | `search.ts:26-83`, `search-portal.ts:23-49` | Membership-derived | Admin `organizations` unscoped | P1 | Scope orgs |
| SEARCH-006 | Permission filters | `requireAdmin`/`requireAuth` | Coarse role gate | No per-role field filtering | P2 | Role-aware projection |
| SEARCH-007 | Document/ticket/project/message search | `search.ts`, `search-portal.ts` | Tickets/projects/docs(admin) | Portal docs; message search absent | P2 | Add docs to portal |
| SEARCH-008 | Admin/global search | `search.ts` | Auth + role + partial scope | PII + org enumeration | P1 | Redact/limit + scope |
| SEARCH-009 | Autocomplete | `*GlobalSearch.tsx` | 300ms debounce to full endpoint | No dedicated endpoint/limiter | P2 | Add limiter or light endpoint |
| SEARCH-010 | Search logs | `search.ts:109-123`, `audit.ts` | Admin-search audit row | Raw term stored; portal unlogged | P2 | Value redaction; log portal |
| SEARCH-011 | Query analytics | `metrics.ts:68`, `analytics.ts:84` | None (dead metric) | Missing RPC; no store | P2 | Wire metric; fix RPC |
| SEARCH-012 | Deleted data removal | `5302109`; `documents.ts:546` | Hard delete | Soft-delete unused (latent) | P3 | Wire or drop columns |

## Findings

### Finding ID: SEARCH-P1-001 - `sanitizeSearchTerm` does not strip PostgREST `.` operator separators

- Severity: P1
- Confidence: Medium (Low on exploitability until a live PostgREST is exercised — see What is happening)
- Area: SEARCH
- Evidence:
  - `apps/api/src/lib/search.ts:11-16` — sanitizer strips `,()"\ %` only.
  - `apps/api/src/routes/search.ts:38,61,70,79,96` — term interpolated into `.or("col.ilike.<term>")`.
  - `apps/api/src/routes/search-portal.ts:41,47` — same pattern.
  - `apps/api/src/__tests__/sanitize-search.test.ts:1-25` — no `.`-injection case.
- What is happening: The sanitizer was added to neutralize PostgREST's `.or()` grammar separators (`,`, `()`), but `.` — the token PostgREST uses to separate *column/operator/value* within a condition — is retained. A caller can therefore submit a dotted term (e.g. `a.eq.b`, `a.and.x`) that is passed through verbatim into a multi-condition `.or()` string. The repository does not prove whether PostgREST re-interprets a trailing dotted token or treats it as opaque value data; this is the specific behavior that must be verified before assigning an exploit severity.
- Why it matters: The sanitizer is the single control protecting every search endpoint (and `knowledge-base`/`edu-automation`). If the grammar boundary can be shifted, an authenticated caller could alter result sets (e.g. force a broad match) or probe filter structure. Even if not exploitable today, relying on "PostgREST happens to treat it as data" is fragile.
- User / business impact: Low direct user impact; potential for confusing/incorrect results if a term contains dots (e.g. domain names like `acme.com`, IPs) — these are currently preserved and may or may not parse as intended.
- Security / privacy / reliability impact: Potential filter-injection vector and non-deterministic query parsing; undermines the stated purpose of the sanitizer.
- Recommended fix: Extend the strip set in `apps/api/src/lib/search.ts` to include `.` and `*` (PostgREST full-text alias), and cap length (e.g. 100 chars). Replace with spaces as done for `,`.
- Suggested validation: Unit tests `expect(sanitizeSearchTerm("a.eq.b")).toBe("a eq b")` and `("a*b")`; an integration test asserting the `.or()` value received by Supabase contains no unescaped dots; a hosted-PostgREST probe confirming dotted terms are treated as data (to close the confidence gap).
- Owner suggestion: API team
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `GET /api/v1/search?q=` / `GET /api/v1/search/portal?q=` → `sanitizeSearchTerm` → `supabase.from(...).or("col.ilike.<term>")`.
- Attack path: none identified (unproven; candidate input for CHAIN availability/integrity if confirmed).

### Finding ID: SEARCH-P1-002 - Admin global search exposes profile PII and never tenant-scopes the organizations query

- Severity: P1
- Confidence: High (reproduced by reading the handler and authz chain at this commit)
- Area: SEARCH
- Evidence:
  - `apps/api/src/routes/search.ts:12` — `requireAuth, requireAdmin, requireOrgAccess`.
  - `apps/api/src/routes/search.ts:35-39` — `profiles` select includes `email, phone, title`.
  - `apps/api/src/routes/search.ts:43-56` — profiles/tickets/projects/documents scoped to `adminOrgIds`.
  - `apps/api/src/routes/search.ts:93-97` — `organizations` query has **no** `.in("organization_id", ...)`.
  - `apps/api/src/middleware/admin.ts:24-30` — `requireAdmin` accepts `admin` **or** `super_admin`.
  - `apps/api/src/middleware/org-access.ts:43-63,107-124` — a platform admin key in any approved membership grants access to any org (also CHAIN-P1-001, prompt 45).
  - `apps/api/src/__tests__/search.test.ts:35-37` — the test shim replaces `requireAdmin` with a pass-through, so the role gate is never asserted.
- What is happening: The admin handler scopes most entity types to the caller's orgs, but the `organizations` query is global for every admin. Separately, matched profile rows are returned with `email` and `phone` in full. Because `requireAdmin` admits the per-tenant `admin` role, a tenant admin can enumerate organization names/slugs/statuses across all tenants and read staff PII from any profile matching the term.
- Why it matters: This is cross-tenant metadata disclosure plus PII exposure on a single authenticated endpoint, reachable by a role the code explicitly permits. It directly contradicts the scoping intent implemented for the other four entity types in the same function.
- User / business impact: Tenant admins can learn the MSP's full customer list and employee contact details; weakened trust boundary between tenants.
- Security / privacy / reliability impact: Cross-tenant data exposure and unnecessary PII processing; broadens the blast radius that CHAIN-P1-001 relies on.
- Recommended fix: Apply the same `adminOrgIds` scoping to the `organizations` query (add `.in("id", adminOrgIds)`, skipping the filter only when the caller is a true platform admin), and either remove `phone`/`email` from the default projection or gate them behind `super_admin`. Consider adding a `requirePermission("search","view")` gate consistent with the permission catalog entries created in `5302118`.
- Suggested validation: Integration test with two orgs and an `admin` of org A asserting the response contains no org-B organization and no org-B user; a test asserting `phone`/`email` are absent for non-super_admin.
- Owner suggestion: API + Security
- Effort estimate: S
- Dependencies: Decision on whether MSP `admin` should remain cross-tenant (SEC-P2-002 / CHAIN-P1-001).
- Status: open
- Endpoint / data path: `GET /api/v1/search?q=` → `requireAdmin` → `getSupabaseAdmin()` (service role, RLS bypassed) → `profiles`/`organizations` unscoped read.
- Attack path: A low-trust `admin`-or-higher session uses `GET /api/v1/search` to enumerate all tenant organizations and staff PII; composes with CHAIN-P1-001 (cross-tenant read breadth).

### Finding ID: SEARCH-P2-001 - Raw search terms persisted in plaintext `audit_logs.metadata`

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `apps/api/src/routes/search.ts:109-123` — `metadata: { query: q, resultCounts: {...} }`.
  - `apps/api/src/services/audit.ts:34-45` — redaction matches on **key names** containing `full_name|email|phone|password|token|secret`; `query` is unaffected, so its **value** is stored verbatim.
  - `apps/worker/src/tasks/retention.ts:12-50` — `audit_logs` retained 365 days.
- What is happening: Admin search terms are written into `audit_logs` as-is. If an operator searches for a customer email, phone number, or a sensitive project keyword, that value is durably stored in the audit trail for up to a year, beyond the profile PII that `5302135` attempts to encrypt at rest.
- Why it matters: This is an unintended secondary store of user-supplied PII/keywords with a long retention window, and it is not covered by the field-level encryption added for `profiles`.
- User / business impact: Expanded PII footprint and retention exposure; complicates DSR/erasure and breach scope.
- Security / privacy / reliability impact: Privacy/compliance risk (retention, minimization, erasure); audit-tooling viewers may surface these terms.
- Recommended fix: Redact the term before insert — store a hash plus a length cap, or a short excerpt — or add a value-level scrub in `logAuditEvent`. Define an explicit retention for search audit rows if they are not needed for compliance.
- Suggested validation: Test that searching for `someone@example.com` yields an `audit_logs` row whose `metadata.query` does not contain the literal string.
- Owner suggestion: API + Privacy
- Effort estimate: S
- Dependencies: Data-retention policy decision.
- Status: open
- Endpoint / data path: `GET /api/v1/search?q=<pii>` → `logAuditEvent({ metadata:{ query } })` → `audit_logs` insert.
- Attack path: none identified.

### Finding ID: SEARCH-P2-002 - Portal search omits documents despite SDK and documentation contract

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `packages/sdk/src/search.ts:11-15` — `PortalSearchResult` declares `documents`.
  - `docs/API_ENDPOINT_INVENTORY.md:164` — "Org-scoped portal search (tickets + projects + documents)".
  - `apps/api/src/routes/search-portal.ts:54-59` — response is `{ tickets, projects }` only.
  - `apps/web/components/portal/PortalGlobalSearch.tsx:7-10` — type expects only tickets/projects.
- What is happening: Three artifacts disagree. Client code typed to the SDK may read `result.documents` and receive `undefined`; documentation tells implementers documents are returned when they are not.
- Why it matters: Contract drift between SDK, docs, and server produces silent client failures and misleads future contributors/AI agents.
- User / business impact: Portal users cannot search documents; integrators write code against a false shape.
- Security / privacy / reliability impact: If documents are added later, visibility/`can_read_document` must be respected — the current absent implementation avoids that risk but leaves the contract broken.
- Recommended fix: Choose one: (a) add a visibility-respecting documents query to `search-portal.ts` and to the portal UI, or (b) remove `documents` from `PortalSearchResult` and correct `API_ENDPOINT_INVENTORY.md`. Option (a) also completes prior-run SEARCH-P1-001 for the portal.
- Suggested validation: Contract test comparing the SDK type, OpenAPI spec, and the actual JSON keys returned by `GET /api/v1/search/portal`.
- Owner suggestion: API + SDK
- Effort estimate: S–M
- Dependencies: Document visibility model (`can_read_document`, `documents_select_visibility_aligned`).
- Status: still-open (regressed relative to prior-run P1-001, which remains unsatisfied for the portal)
- Endpoint / data path: `GET /api/v1/search/portal?q=` → `tickets`/`projects` only.
- Attack path: none identified.

### Finding ID: SEARCH-P2-003 - Admin search UI silently discards the documents result set

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `apps/api/src/routes/search.ts:76-83,125-132` — API returns `documents`.
  - `apps/web/components/admin/AdminGlobalSearch.tsx:7-12` — `SearchResult` type has no `documents`; `resultCount()` and render omit it.
  - `grep "documents" apps/web/components/admin/AdminGlobalSearch.tsx` — zero matches.
- What is happening: The backend now searches and returns documents for admin search, but the admin global search component neither types, counts, nor renders them. The result is computed and transmitted, then thrown away.
- Why it matters: Wasted queries and payload; admins cannot actually reach the documents the API found, so the "documents in admin search" improvement is not delivered end-to-end.
- User / business impact: Admin UX gap and needless backend load.
- Security / privacy / reliability impact: Unnecessary PII/description matching performed for no user benefit.
- Recommended fix: Add `documents` to the `SearchResult` type, `resultCount()`, and rendering (link to the document view) in `AdminGlobalSearch.tsx`, mirroring the tickets/projects blocks.
- Suggested validation: E2E test that typing a document name in admin search shows a Documents group; unit snapshot of the dropdown.
- Owner suggestion: Web team
- Effort estimate: S
- Dependencies: SEARCH-P2-002 shape decision.
- Status: open
- Endpoint / data path: `GET /api/v1/search?q=` → response `documents` → UI drops it.
- Attack path: none identified.

### Finding ID: SEARCH-P2-004 - No search pagination or result counts; hard 5-result ceiling

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `apps/api/src/routes/search.ts:39,62,71,80,97` — `.limit(5)` per entity.
  - `apps/api/src/routes/search-portal.ts:42,48` — `.limit(5)`.
  - `apps/api/src/openapi/spec.ts:950-963` — only `q` param documented; no `page`/`limit`.
- What is happening: Every entity type is capped at 5 results with no pagination parameter, no total count, and no "view more". A common term ("test", "admin") hides most matches.
- Why it matters: Search is a discovery surface; silently truncating at 5 with no total prevents users from knowing more exists.
- User / business impact: Users resort to list-page filters; perceived search quality is poor at scale.
- Security / privacy / reliability impact: Low.
- Recommended fix: Add optional `limit` (bounded, e.g. ≤25) and `offset`/cursor plus a total count; surface a "show more" affordance in both search UIs.
- Suggested validation: Integration test asserting `limit` is honored and bounded; UI test for the "show more" control.
- Owner suggestion: API + Web
- Effort estimate: M
- Dependencies: SEARCH-P2-002 shape decision.
- Status: still-open (prior SEARCH-P2-001)
- Endpoint / data path: both search endpoints.
- Attack path: none identified.

### Finding ID: SEARCH-P2-005 - Search query analytics metric is dead and the analytics summary RPC is missing

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `apps/api/src/lib/metrics.ts:68-72` — `portal_search_queries_total` registered.
  - `apps/api/src/lib/metrics.ts:123-125` — `recordSearchQuery()` defined.
  - `grep -rn "recordSearchQuery" apps` — zero call sites (only the definition).
  - `docs/MONITORING_AND_ALERTING.md:132` — documented as "defined, not wired".
  - `apps/api/src/routes/analytics.ts:84` — `supabase.rpc("get_analytics_summary")`.
  - `grep -rn "get_analytics_summary" supabase/` — zero definitions (reproduces `SEC-P2-004`, cross-referenced, not duplicated).
- What is happening: The Prometheus counter for search volume is registered but never incremented by either search endpoint, and the admin analytics summary endpoint calls a database function no migration defines (it will 500). There is no `search_queries` table or zero-result tracking.
- Why it matters: Operators have no search-volume, latency, or zero-result signal, and the analytics summary path is broken — so tuning search is blind.
- User / business impact: No data to prioritize search improvements or content gaps.
- Security / privacy / reliability impact: Observability gap; the broken RPC is a reliability defect covered by 06.
- Recommended fix: Call `recordSearchQuery()` in both handlers (and optionally a `recordSearchResult(count)` zero-result counter); implement or replace `get_analytics_summary` per `SEC-P2-004`; consider a `search_queries` analytics table (hashed terms) if product analytics are desired.
- Suggested validation: Metric-increment test on both endpoints; a DB-backed test that `get_analytics_summary` returns rather than errors.
- Owner suggestion: API + SRE
- Effort estimate: S (metric) / M (analytics store)
- Dependencies: `SEC-P2-004` for the RPC; privacy review if an analytics table is added.
- Status: still-open (prior SEARCH-P2-002)
- Endpoint / data path: all search endpoints → metrics registry; `GET /api/v1/analytics/summary` → `rpc("get_analytics_summary")`.
- Attack path: none identified.

### Finding ID: SEARCH-P2-006 - Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search

- Severity: P2
- Confidence: High
- Area: SEARCH
- Evidence:
  - `apps/api/src/routes/search.ts:23,96` — prefix form `q%` for `profiles.full_name`, `organizations.name`, `organizations.slug`; wildcard `%q%` for `profiles.email`, tickets, projects, documents.
  - `supabase/migrations/5302102_add_performance_indexes.sql:10-16` — trigram indexes cover names/emails/titles/descriptions but **not** `organizations.slug`.
  - Absence of `tsvector`/`to_tsvector` in all migrations (`grep` on `supabase/`).
- What is happening: The admin path builds a prefix term for some columns (where a btree would help) but only trigram indexes exist; `organizations.slug` is searched with a wildcard and has no index at all. No ranked full-text search exists anywhere.
- Why it matters: At volume, wildcard scans on unindexed columns and trigram-only plans degrade; results lack relevance ranking.
- User / business impact: Slower search and less relevant ordering as data grows.
- Security / privacy / reliability impact: Reliability/latency; contributes to availability chains under abusive query volume (see prompt 45).
- Recommended fix: Add btree indexes for prefix-searchable columns (`profiles.full_name`, `organizations.name`), an index for `organizations.slug`, and evaluate a `to_tsvector('english', ...)` generated column + GIN index for ticket/project descriptions.
- Suggested validation: EXPLAIN-based DB test showing index usage; load test on seeded volume.
- Owner suggestion: Data/Platform
- Effort estimate: M
- Dependencies: Migration review (`07`/`37`).
- Status: still-open (prior SEARCH-P1-002)
- Endpoint / data path: both search endpoints → Postgres planner.
- Attack path: none identified.

### Finding ID: SEARCH-P2-007 - Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface

- Severity: P2
- Confidence: Medium
- Area: SEARCH
- Evidence:
  - `apps/web/components/admin/AdminGlobalSearch.tsx:38-60` — 300ms debounce then `search.admin(query)`.
  - `apps/web/components/portal/PortalGlobalSearch.tsx:36-58` — 300ms debounce then `search.portal(query, "")`.
  - `apps/api/src/routes/search.ts:91-101` — each admin keystroke triggers 5 parallel queries after the debounce.
  - `grep "autocomplete|typeahead|suggest" apps/api/src` — no dedicated endpoint.
- What is happening: "Autocomplete" is implemented by hitting the full multi-entity search endpoint on every debounced keystroke; there is no dedicated lightweight endpoint, no caching, and no visible rate limit on these routes.
- Why it matters: Typing a long term issues many 4–5-query bursts per user; concurrent users can amplify DB load, and there is no throttle to bound it.
- User / business impact: Potential latency spikes during heavy use.
- Security / privacy / reliability impact: Availability/amplification risk; composes with prompt 45 availability chains.
- Recommended fix: Either add a dedicated minimal autocomplete endpoint (single indexed column, small limit) or add per-user rate limiting and short-TTL response caching to the search routes; increase the debounce/min-length for typeahead.
- Suggested validation: Load test simulating typing; assert rate-limit behavior; measure query count per keystroke.
- Owner suggestion: API + Web
- Effort estimate: M
- Dependencies: Rate-limit middleware availability.
- Status: open
- Endpoint / data path: debounced UI → `GET /api/v1/search` / `/search/portal` (×5 queries).
- Attack path: high-frequency authenticated search as a DB load amplifier (candidate CHAIN availability input).

### Finding ID: SEARCH-P3-001 - Soft-delete columns are defined but never used by queries or deletes

- Severity: P3
- Confidence: High
- Area: SEARCH
- Evidence:
  - `supabase/migrations/5302109_soft_delete.sql:1-17` — `deleted_at`/`deleted_by` added to tickets/projects/documents.
  - `grep -rn "deleted_at" apps/api/src` — only `openapi/spec.ts` and a contract test; no runtime filters.
  - `apps/api/src/routes/documents.ts:528-563` — document delete is physical (`delete()`), storage removed first.
- What is happening: The soft-delete schema exists but is inert; tickets/projects/documents are hard-deleted today, so search correctly never returns deleted rows. The risk is latent: any future switch to soft-delete that forgets to add `deleted_at is null` to the search filters would make deleted data searchable again.
- Why it matters: Schema/behavior drift creates a false impression of a tombstone/restore capability and a future privacy gap.
- User / business impact: None currently.
- Security / privacy / reliability impact: Latent retention/erasure risk.
- Recommended fix: Either implement soft-delete end-to-end (writes + all read filters, including both search endpoints) or drop the unused columns; add a guard test either way.
- Suggested validation: If adopted, a test asserting a soft-deleted ticket/document never appears in admin or portal search.
- Owner suggestion: Data/Platform
- Effort estimate: S
- Dependencies: Product decision on restore.
- Status: open
- Endpoint / data path: delete endpoints → `documents`/`tickets`/`projects`; search read paths.
- Attack path: none identified.

### Finding ID: SEARCH-P3-002 - Search module documentation is stale relative to the code

- Severity: P3
- Confidence: High
- Area: SEARCH
- Evidence:
  - `docs/modules/search.md:9,27` — lists only users/organizations/tickets/projects; states "can search across all organizations".
  - `docs/modules/search-portal.md:9,27` — lists only tickets/projects.
  - `docs/API_ENDPOINT_INVENTORY.md:163` — `/admin` path/auth columns misstate auth (`requireOrgAccess` labelled, `requireAdmin` omitted) and entity list.
  - `docs/modules/search-portal.md:4` — attributes the route to `search.ts` rather than `search-portal.ts`.
- What is happening: Docs predate the documents addition and the admin org-scoping change, and misattribute routes/auth.
- Why it matters: Operators and future AI agents will reason from incorrect contracts (this audit pack explicitly targets agent readiness).
- User / business impact: Low; onboarding friction.
- Security / privacy / reliability impact: Low; misdocuments the very scoping that matters for tenant isolation.
- Recommended fix: Update the two module docs and `API_ENDPOINT_INVENTORY.md` to reflect documents, the actual auth gates, and tenant-scoping behavior; add the search routes to the OpenAPI `Search` tag with response schemas.
- Suggested validation: Docs review against the routes; a link/route cross-check in CI if available.
- Owner suggestion: Docs + API
- Effort estimate: S
- Dependencies: SEARCH-P2-002 shape decision.
- Status: open
- Endpoint / data path: N/A.
- Attack path: none identified.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Cross-tenant organization enumeration + staff PII via admin search | P1 | Medium (needs `admin` session) | Confidentiality loss | `search.ts:93-97`, `admin.ts:24-30` | Scope orgs; drop/gate PII |
| Filter-grammar ambiguity in `.or()` via unstripped `.` | P1 | Low–Medium | Result manipulation | `lib/search.ts:11-16` | Strip `.`/`*`; add tests |
| Search terms stored in plaintext audit metadata | P2 | High | Privacy/retention exposure | `search.ts:113`, `audit.ts:34-45` | Value-level redaction |
| SDK/docs/UI disagree on documents | P2 | High | Silent client bugs | `sdk/search.ts:11-15`, `API_ENDPOINT_INVENTORY.md:164` | Align contract |
| Dead search metric + missing `get_analytics_summary` | P2 | High | No search observability | `metrics.ts:123`, `analytics.ts:84` | Wire metric; fix RPC |
| Typeahead query amplification | P2 | Medium | Latency/availability | `*GlobalSearch.tsx:38-60`, `search.ts:91-101` | Rate limit/cache |
| Latent soft-delete/search mismatch | P3 | Low | Future privacy gap | `5302109`, `grep deleted_at` | Wire or drop columns |
| Stale search docs mislead agents/operators | P3 | High | Dev friction | `docs/modules/search*.md` | Update docs |

## Recommendations

### Immediate / Release Blocking

None. No P0 found: both endpoints require authentication, portal search derives scope from server-side memberships, no external index exists, and deletions are physical (not searchable).

### This Week

1. SEARCH-P1-001 — strip `.` and `*` in `apps/api/src/lib/search.ts`; add sanitizer regression tests.
2. SEARCH-P1-002 — tenant-scope the `organizations` query in `apps/api/src/routes/search.ts` and remove/gate `profiles.email`/`phone`.
3. SEARCH-P2-001 — redact search-term values before `logAuditEvent`.

### This Month

4. SEARCH-P2-002 / SEARCH-P2-003 — resolve the documents contract (add to portal + render in admin UI, or remove from SDK/docs).
5. SEARCH-P2-005 — wire `recordSearchQuery()`; resolve `get_analytics_summary` (`SEC-P2-004`); add zero-result tracking.
6. SEARCH-P2-006 — add btree/staging indexes for prefix and slug columns; evaluate `tsvector`.
7. SEARCH-P2-007 — add rate limiting and/or a dedicated autocomplete endpoint.
8. SEARCH-P2-004 — add bounded pagination and totals.

### Later / Platform Evolution

9. SEARCH-P3-001 — decide soft-delete semantics and either implement or drop the columns.
10. SEARCH-P3-002 — refresh search docs and OpenAPI schemas.
11. Introduce a per-entity searchable-field allowlist and role-aware field projection (prior SEARCH-P3-001).
12. Enable `search-portal`/`search` in `RLS_READS_ENABLED` for defense-in-depth (aligns with prompt 37).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Strip `.`/`*` in sanitizer | Closes grammar ambiguity | `apps/api/src/lib/search.ts` | `sanitize-search.test.ts` new cases |
| Scope `organizations` query | Removes cross-tenant enumeration | `apps/api/src/routes/search.ts` | Two-org integration test |
| Drop `phone`/`email` from admin search (or gate to `super_admin`) | Reduces PII exposure | `apps/api/src/routes/search.ts` | Response-shape test |
| Redact `metadata.query` | Removes plaintext PII store | `apps/api/src/routes/search.ts`, `services/audit.ts` | Audit-row assertion |
| Call `recordSearchQuery()` | Turns on a documented metric | `search.ts`, `search-portal.ts` | Metric test |
| Render `documents` in admin UI | Delivers existing backend work | `apps/web/components/admin/AdminGlobalSearch.tsx` | E2E test |
| Fix search docs | Aligns agents/operators | `docs/modules/search*.md`, `docs/API_ENDPOINT_INVENTORY.md` | Doc review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Harden sanitizer (`.`, `*`, length cap) | P1 | API | S | — |
| Scope orgs + PII gating in admin search | P1 | API/Security | S | MSP trust decision |
| Value-level audit redaction | P2 | API/Privacy | S | Retention policy |
| Resolve documents contract (portal + UI + SDK + docs) | P2 | API/SDK/Web | M | Visibility model |
| Search observability (metric, zero-result, `get_analytics_summary`) | P2 | API/SRE | M | `SEC-P2-004` |
| Index tuning (btree prefix/slug, `tsvector`) | P2 | Platform | M | Migration review |
| Typeahead rate limit / dedicated endpoint | P2 | API/Web | M | Rate-limit middleware |
| Pagination + totals | P2 | API/Web | M | — |
| Soft-delete decision + guard test | P3 | Platform | S | Product decision |
| Searchable-field allowlist + role projection | P3 | API/Web | M | — |
| Enable search modules in `RLS_READS_ENABLED` | P3 | API/Platform | M | RLS rollout (37) |

## Suggested Tests

- Unit (`sanitize-search.test.ts`): `sanitizeSearchTerm("a.eq.b")`, `"a*b"`, long string length cap, unicode/whitespace.
- Unit (route): admin search response contains no `phone`/`email` for a non-`super_admin`; `documents` present in admin payload.
- Integration (authz): two-org fixture — org-A `admin` gets zero org-B organizations, users, tickets, projects, documents.
- Integration (RLS matrix): with `RLS_READS_ENABLED=search-portal`, member of org A matches nothing in org B; without it, the same assertion (proves the membership filter alone is sufficient).
- Integration (audit privacy): search an email-like term; assert `audit_logs.metadata.query` contains no literal PII.
- Integration (metric): `recordSearchQuery()` increments `portal_search_queries_total` on both endpoints.
- Contract: SDK `SearchResult`/`PortalSearchResult` ↔ OpenAPI spec ↔ actual route JSON keys (extend `openapi-contracts.test.ts`).
- Performance/CI: EXPLAIN assertion that new btree indexes are used for prefix terms.
- E2E (`apps/web/e2e/admin/search.spec.ts`): documents group renders; "show more" paginates.
- Security: rate-limit assertion on search routes (e.g. N requests → 429 or throttled).
- Regression: soft-deleted (if implemented) ticket/document never appears in either search.
- Manual validation: query with dots/asterisks/percent signs against a hosted PostgREST to close SEARCH-P1-001's confidence gap.

## Suggested Documentation Updates

- `docs/modules/search.md` — add documents, correct auth gates, document tenant scoping, PII fields.
- `docs/modules/search-portal.md` — fix route path (`search-portal.ts`), document actual entities and scope.
- `docs/API_ENDPOINT_INVENTORY.md` — correct `/search` auth and entity lists; mark documents support accurately.
- `docs/MONITORING_AND_ALERTING.md` — update `portal_search_queries_total` from "defined, not wired" to wired (after SEARCH-P2-005).
- `docs/PRIVACY.md` (or `docs/DATA_RETENTION.md`) — document that search terms are logged, retention, and redaction.
- `docs/DATABASE_INDEXES.md` (new) — search index inventory and rationale.
- `docs/DB_FUNCTIONS.md` — reinforce the `get_analytics_summary` gap reference (owned by prompt 06/37).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does hosted PostgREST reinterpret a dotted token inside `.or()` as filter structure? | Determines SEARCH-P1-001 severity (Medium→High) | Live PostgREST probe or PostgREST docs/version pin |
| Should MSP `admin` remain cross-tenant on search, or is only `super_admin`? | Drives SEARCH-P1-002 fix shape | Product/security decision (`SEC-P2-002`, CHAIN-P1-001) |
| Is there a compliance reason to retain raw search terms? | Governs redaction vs deletion | Privacy/compliance sign-off |
| Is `search-portal` intended to search documents? | Determines SDK/docs vs server fix | Product decision |
| Where is `get_analytics_summary` defined (hosted)? | Analytics summary currently 500s | Hosted function catalog / missing migration (`SEC-P2-004`) |
| Was the 365-day audit purge ever exercised? | Retention claim verification | Operator evidence or drill record |
| Are `deleted_at` columns intended to be wired? | Latent search/privacy risk | Product/data decision |

## Appendix

### A. Search surface inventory

| Feature | Endpoint | Auth | Scope | Entities | Fields matched |
|---|---|---|---|---|---|
| Admin global search | `GET /api/v1/search` | `requireAuth` + `requireAdmin` + `requireOrgAccess` | Admin's approved orgs (except organizations) | profiles, organizations, tickets, projects, documents | `full_name`,`email`; `name`,`slug`; `title`,`description`; `name`,`description`; `name`,`mime_type` |
| Portal search | `GET /api/v1/search/portal` | `requireAuth` | Caller's approved memberships | tickets, projects | `title`,`description`; `name`,`description` |
| Knowledge base | `GET /api/v1/knowledge-base?search=` | `requireAuth` + `requireOrgAccess` | Org via `req.query.organization_id` | knowledge_base_articles | `title`,`body` |
| Edu KB search | `GET /api/v1/edu-automation/kb/search` | router-level | `organization_id` query | knowledge_articles | `title`,`content`,`category` |
| List filters | assets/approvals/proposals/vendors/network-diagrams/staging/findings/device-profiles/domain-monitors | router-level | varies | one entity each | single column `ilike` |

### B. Indexed data inventory

| Entity | Matched fields | Index | Searchable from |
|---|---|---|---|
| profiles | full_name, email | GIN trigram (`5302102:10-11`) | Admin |
| organizations | name, slug | GIN trigram on `name` only (`5302102:12`); slug **unindexed** | Admin |
| tickets | title, description | GIN trigram (`5302102:13-14`) | Admin + portal |
| projects | name, description | GIN trigram (`5302102:15-16`) | Admin + portal |
| documents | name, mime_type | None dedicated | Admin only |
| knowledge_base_articles | title, body | None dedicated | Knowledge base route |
| knowledge_articles | title, content, category | None dedicated | Edu KB route |

### C. Index owner / retention / cleanup

| Index or store | Owner | Retention | Cleanup |
|---|---|---|---|
| `idx_*_trgm` (`5302102`) | Platform | Schema lifetime | Not applicable (index) |
| `audit_logs` (incl. `search.query` rows) | API/Compliance | 365 days (`retention.ts:13`) | Worker `retention` task (not exercised in this audit) |
| notifications | API | 90 days (`retention.ts:14`) | Same task |
| public_interactions (PII) | API | 90 days (`public-interaction-retention.ts:5`) | Daily worker (`main.ts:61-69`) |
| External search index | — | — | Not present |

Leftovers without an explicit retention/cleanup: none identified for search itself; search terms live inside `audit_logs` (365d). No dedicated search-term store exists.

### D. Schema-drift / mapping check

| Check | Result |
|---|---|
| Migration naming consistency | `53xxxxx` pattern; no gaps introduced by search work |
| Old vs new mapping for search columns | No rename/type change affecting search columns found |
| Consumer query against real columns | `search.ts` `documents.name`/`mime_type`, `documents.visibility` align with `5302026` document schema |
| Silent-empty risk | `search.ts` checks and throws on all five query errors; `search-portal.ts` checks both — no silent-empty path |

### E. Authorization review

| Search type | Tenant isolation | Authorization | Assessment |
|---|---|---|---|
| Admin (global) | Partial — users/tickets/projects/documents scoped to admin's orgs; **organizations unscoped** | `requireAdmin` (`admin`/`super_admin`) | ⚠️ SEARCH-P1-002 |
| Portal (org-scoped) | Membership-derived server-side | `requireAuth` | ✅ Correct scoping (RLS off by default) |
| Knowledge base | Org via query param + `requireOrgAccess` | `requireAuth` + `requireOrgAccess` | ✅ (cross-ref 06/37) |
| Edu KB search | `organization_id` query + router-level `requireOrgAccess` | router-level | ✅ |

### F. Cross-references (not duplicated)

| Finding here | Related sibling | Relationship |
|---|---|---|
| SEARCH-P1-002 | 45 CHAIN-P1-001; 06 SEC-P2-002 | Search is one of the cross-tenant read surfaces the platform key broadens |
| SEARCH-P2-005 | 06 SEC-P2-004; 37 (get_analytics_summary Open Question) | Same missing RPC; analytics on search depends on it |
| SEARCH-P2-007 | 45 (availability chains) | Search amplification under abusive volume |
| SEARCH-P3-001 | 07 DATA-* | Soft-delete schema drift |
| Portal search isolation | 06 (search-portal row), 37 (RLS), 45 (sla/search-portal) | RLS-off-by-default reads |

### G. Mermaid — current search data flow

```mermaid
flowchart TD
  UI[AdminGlobalSearch / PortalGlobalSearch] -->|debounced q| R{GET /api/v1/search[/portal]}
  R --> AUTH[requireAuth + requireAdmin + requireOrgAccess]
  AUTH --> SAN[sanitizeSearchTerm: strips ,()\\" %  keeps .]
  SAN --> SB[Supabase .or col.ilike.term]
  SB --> PG[(Postgres + pg_trgm GIN)]
  R --> AUD[logAuditEvent: raw query -> audit_logs 365d]
  PG --> RESP[JSON results]
  RESP --> ADMINUI[Admin UI: drops documents]
  RESP --> PORTALUI[Portal UI: tickets+projects]
```
