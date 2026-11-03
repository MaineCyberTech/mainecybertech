# Performance, Scalability, and Cost Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: PERF
- Scope limitations: static review only; no load test, bundle build, database plan or production timing was measured locally. The load-test workflow’s own run history was read from the public API.

## Scope

Re-verified all 10 previous PERF findings at `6b7aa1a`: request-metric cardinality, storefront caching, permission-resolution caching, bulk invite fan-out, SSE connection caps, Stripe pagination, unbounded reads/exports, exact-count pagination, bundle budgets and `select("*")`/list-shape adoption. The `7dd0402..6b7aa1a` diff was reviewed for export caps, the new SLA endpoint and any new unbounded list reads.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/{middleware/request-id,lib/permissions,middleware/cache}.ts` | Read | Metric labels and cache behavior | Route-template labels; user-scoped cache option |
| `apps/api/src/routes/{store/catalog,notifications,billing,audit,sla,compliance,final/time-entries}.ts` | Read | Caching, SSE, pagination, export caps | Current at `6b7aa1a` |
| `apps/api/src/lib/pagination.ts` | Read | `LIST_HARD_CAP`, `EXPORT_ROW_LIMIT` | 1,000 / 5,000 |
| `apps/worker/src/...` bulk/permission code | Read | Fan-out and caching | Current |
| `scripts/bundle-budget.json`, `scripts/check-bundle-budget.mjs`, `.github/workflows/e2e.yml` | Read | Bundle gate | Budgets + CI step |
| `grep -R '\.select("\*")' apps/api/src` | Executed | Projection debt | 156 non-test occurrences |
| Public GitHub Actions API | Read-only | Load-test execution | Green 2026-11-02 |

## Executive Summary

Eight of the 10 prior findings are `verified-fixed`; two are `partially-fixed`; one new P3 is open. PERF-P3-001 is now fixed: the audit/impersonation exports were lowered from 10,000 rows to the shared 5,000-row `EXPORT_ROW_LIMIT`, and every cited list read is bounded. The storefront cache, permission cache, SSE cap, Stripe pagination, metric labels, exact-count mode and bundle budget remain in place.

The two residual areas are unchanged: bulk invite still creates auth accounts sequentially (the DB fan-out was fixed), and 156 `select("*")` calls plus per-route inline pagination keep list responses wider than necessary. The new P3 is `GET /sla/metrics` (pre-existing code, newly recorded), which reads every SLA row in a 90-day window with no limit and computes the summary in memory.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| PERF-P2-001 | P2 | verified-fixed | Request metric uses raw URL path | `request-id.ts` route-template `routeLabel`; `unmatched` bucket |
| PERF-P2-002 | P2 | verified-fixed | Storefront force-dynamic and uncached | 60s catalog snapshot + API response cache |
| PERF-P2-003 | P2 | verified-fixed | `resolveEffectivePermissions` uncached | `lib/permissions.ts:21-124` TTL + in-flight dedupe |
| PERF-P2-004 | P2 | partially-fixed | Bulk invite 4 sequential calls/invite | DB fan-out fixed; auth invites still sequential (`bulk.ts:163-190`) |
| PERF-P2-005 | P2 | verified-fixed | Each SSE stream opens a Realtime channel | `notifications.ts:35-41,198` cap 200 + 503 |
| PERF-P2-006 | P2 | verified-fixed | `POST /billing/sync` does not paginate Stripe | `billing.ts:73-142` `starting_after` + page cap |
| PERF-P3-001 | P3 | verified-fixed | Unbounded list reads; exports up to 10k | `audit.ts:95,191` now `EXPORT_ROW_LIMIT=5000`; other reads capped |
| PERF-P3-002 | P3 | verified-fixed | Every paginated list runs an exact count | `pagination.ts:59-69` `listCountMode` default estimated |
| PERF-P3-003 | P3 | verified-fixed | No bundle-size budget gate | `bundle-budget.json` + `check-bundle-budget.mjs` in e2e.yml:210-211 |
| PERF-P3-004 | P3 | partially-fixed | Broad `select("*")`; ad-hoc pagination | 156 non-test `select("*")`; 43 route files use shared pagination |
| PERF-P3-005 | P3 | open (new) | SLA metrics reads all 90-day rows with no limit | `routes/sla.ts:24-30`; summary computed in memory at :32-56 |

Counts: **8 verified-fixed / 2 partially-fixed / 0 regressed / 1 open** (PERF-P3-005 new). PERF-P3-001 moved to fixed.

## Residual detail

### PERF-P2-004 — auth invites remain sequential

`apps/api/src/routes/bulk.ts` (or the bulk service it calls) now looks up profiles/memberships once per 100-entry chunk and inserts memberships in a multi-row batch, which removes the DB fan-out. The Supabase auth invite call is still made one account at a time inside a sequential loop (`bulk.ts:163-190`), so a 500-invite request still takes roughly 500 × the auth round-trip and can exceed the request timeout. Fix: bound the batch (e.g. 25-50), parallelize invites with a small concurrency limit, and return per-invite results so a partial failure is visible.

### PERF-P3-004 — projection debt

`grep` still finds **156** non-test `select("*")` calls in `apps/api/src`; 43 route files use the shared `lib/pagination` helpers, but many still parse `page`/`limit` inline. Every list response therefore ships every column of every row, increasing DB I/O, JSON size and cache memory. Fix: add explicit column projections per list/detail route (start with the highest-volume: projects, tickets, documents, notifications, audit), and make the shared pagination helper the only page/limit parser.

### PERF-P3-005 — the new SLA dashboard read

`apps/api/src/routes/sla.ts:24-30` builds `select("*", { count: "exact" }).gte("created_at", since)` where `days` can be 90, with no `.limit()`/`.range()`. `:32-56` then loads all rows and computes `total`/`breached`/`resolved`/`byMetric` in memory, returning only the last 20. The 60-second response cache bounds repeat cost but not the first read; a high-volume org can make one refresh read tens of thousands of full rows. Fix: aggregate in SQL (group by metric; count/sum/avg) or page with `LIST_HARD_CAP` and a `truncated` flag; select only `metric`, `breached`, `resolved_at`, `actual_minutes`, `created_at`.

## Cost posture

Backup retention is 30 days (`scripts/backup-database.sh:25,124-140`), the Spaces storage class is `STANDARD` (the DO-supported default; `STANDARD_IA` only for real AWS S3), and there are no committed cloud-spend dashboards, budget alerts or per-tenant cost allocation in the repository. The observability stack now adds node-exporter (64 MB limit) and Prometheus retention is on-box `--storage.tsdb.retention.time=30d` (compose:322), so the marginal cost is small. Unknown: actual droplet/Spaces/Supabase spend and egress; those are operator billing-console checks, not repository evidence.

## Recommendations

### This month

1. Bound `/sla/metrics` (SQL aggregate or cap) and add a test with >1,000 rows.
2. Add explicit column projections to the highest-volume list routes; track the `select("*")` count in a guard so it ratchets down.
3. Bound/parallelize bulk invites and return per-item outcomes.

### This quarter

4. Extend the bundle budget to per-route chunks and run it on the prod image, not only the E2E build.
5. Add a query-count/latency budget to the load-test suite for the top list endpoints.
6. Review the 60s catalog/response caches for invalidation correctness after mutations.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Cap or aggregate `/sla/metrics` | Removes a new unbounded read | `apps/api/src/routes/sla.ts` | >1,000-row test |
| Project columns on `projects`/`tickets` lists | Cuts payload and DB I/O immediately | `routes/{projects,tickets}.ts` | response-shape test |
| Guard the `select("*")` count | Prevents silent growth | `scripts/check-docs-counts.mjs` or a new guard | CI fails on increase |
| Parallelize auth invites with a concurrency cap | Makes 500-invite batches feasible | `routes/bulk.ts` | timing test |

## Suggested Tests

- **Load**: k6 scenario for `/sla/metrics` and the top five list endpoints with 10k+ rows; assert p95 and row-count caps.
- **Query shape**: a static test that new non-test `select("*")` calls require an allowlist entry.
- **Bulk**: 500-invite test with a mocked auth provider; assert bounded concurrency and partial-failure reporting.
- **Cache**: mutation then list; assert the response cache is invalidated per org/user scope.

## Suggested Documentation Updates

- `docs/SLO.md`: add the list-endpoint latency/row-count objectives.
- `docs/PERFORMANCE.md` (or the README performance section): document the 5,000-row export cap and 1,000-row list cap.
- `docs/MONITORING_AND_ALERTING.md`: note the per-route metric label and the cache scopes.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| How many SLA rows does the busiest org have in 90 days? | Sets the urgency of PERF-P3-005 | Prod row counts / query plan |
| Is 5,000 rows an acceptable export ceiling? | Product decision vs operator need | Product/ops confirmation |
| Are the 156 `select("*")` calls all low-volume? | Determines the projection priority | Route-level traffic data |

## Appendix

- Executed: `grep -RIn '\.select("\*")' apps/api/src` → 156 non-test matches; shared pagination imported by 43 route files.
- Public GitHub Actions evidence: load-test 41511827450 (schedule) and 41515001890 (dispatch) succeeded on 2026-11-02, so the budgets/failure-injection path is exercised.
- No prior finding regressed; PERF-P3-001 moved to fixed and PERF-P3-005 is the only new row.
