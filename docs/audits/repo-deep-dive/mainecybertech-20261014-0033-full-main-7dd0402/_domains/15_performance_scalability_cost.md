# Performance, Scalability, and Cost Audit (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: PERF
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (10 PERF findings)
- Scope limitations: static analysis only — no load test, bundle measurement or live Prometheus query was run; counts (select("*"), pagination adoption) are grep-based snapshots of this commit.

## Scope

Re-verified all 10 previous PERF findings at `main@7dd0402` and re-ran the performance/cost lens: metric cardinality, storefront caching, permission fan-out, bulk endpoints, SSE scaling, third-party pagination, unbounded reads, count strategy, bundle budgets and query projections.

## Executive Summary

The performance wave landed well: **7 of 10 previous findings are `verified-fixed`**. HTTP metric labels are bounded, the public storefront is cached at both the web and API layers (60 s, Redis-backed), permission resolution is memoized per user+org with in-flight dedupe, SSE streams are capped at 200 per process with a 503, Stripe sync paginates with a truncation-reporting cap, paginated lists default to `estimated` counts, and a committed bundle budget now gates CI.

Three rows remain `partially-fixed`: bulk invite still creates auth accounts one at a time inside the 30 s deadline (worst case 500 new emails), the audit export and three service reads still fetch 10 000 rows above the new 5 000-row export cap, and `select("*")` is still the norm (156 call sites) with 37 routes parsing pagination inline. No regressions, no new findings.

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| PERF-P2-001 | P2 | Request metrics label uses the raw URL path | verified-fixed | `request-id.ts` `routeLabel`; d9911286 |
| PERF-P2-002 | P2 | Public storefront pages force-dynamic and uncached | verified-fixed | web 60 s snapshot (`catalog-source.ts:47-80`) + API `responseCache` (60 s, Redis) |
| PERF-P2-003 | P2 | resolveEffectivePermissions uncached, 4–6 queries per request | verified-fixed | `permissions.ts:21-124` TTL cache + in-flight dedupe |
| PERF-P2-004 | P2 | Bulk invite 4 sequential calls per invite, cannot finish 500 in 30 s | partially-fixed | DB ops batched per 100 (`bulk.ts:133-226`); auth invite still per-user sequential |
| PERF-P2-005 | P2 | Each SSE stream opens its own Realtime channel with no cap | verified-fixed | `SSE_MAX_STREAMS=200` + 503 (`notifications.ts:29-41,198`) |
| PERF-P2-006 | P2 | POST /billing/sync does not paginate Stripe results | verified-fixed | `billing.ts:75-142` `starting_after` loop + cap |
| PERF-P3-001 | P3 | Unbounded reads on compliance/time-entries; exports up to 10k rows | partially-fixed | compliance/time-entries capped; audit export + 3 services still 10 000 |
| PERF-P3-002 | P3 | Every paginated list runs an exact row count | verified-fixed | `listCountMode()` defaults to `estimated` (`pagination.ts:59-69`) |
| PERF-P3-003 | P3 | No bundle-size budget gate | verified-fixed | `scripts/bundle-budget.json` + `check-bundle-budget.mjs` in `e2e.yml:164` |
| PERF-P3-004 | P3 | Routes broadly `select("*")`; pagination ad hoc | partially-fixed | helper adopted by 43 files; 156 `select("*")`; 37 inline parsers |

Counts: 7 verified-fixed / 3 partially-fixed / 0 regressed / 0 open / 0 new.

## Recommendations

### Immediate / Release blocking

None.

### This week

1. Cap the audit export and the three service reads at `EXPORT_ROW_LIMIT` (or document why audit needs 10 000) — PERF-P3-001.
2. Measure one worst-case bulk invite (500 new emails) against the 30 s deadline; if it cannot finish, lower the cap, parallelize the auth calls with bounded concurrency, or return a job id — PERF-P2-004.

### This month

3. Project explicit columns on the hottest list endpoints (tickets/projects/documents/audit) instead of `select("*")` — PERF-P3-004.
4. Add a CI guard (lint or test) that flags new inline page/limit parsing and unbounded selects — PERF-P3-004.

### Later / Platform evolution

5. Replace the per-process SSE cap with a connection budget that accounts for replicas if the API ever scales out (PERF-P2-005 residual note).
6. Stream large exports instead of materializing 5 000 rows (documented follow-up in `pagination.ts:21-27`).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Align the audit export with `EXPORT_ROW_LIMIT` | One constant, one policy | `apps/api/src/routes/audit.ts:93,187` | unit test asserting the cap |
| Add `.limit()` assertions to the 3 service reads | Bounds memory on widget renders | `services/*-widget.ts` | code review |
| Project columns on tickets list | Cuts payload and Supabase egress | `apps/api/src/routes/tickets.ts` | contract tests |

## Suggested Tests

- **Load**: a bulk-invite throughput test (500 rows) measuring wall-clock against the 30 s timeout.
- **Guard**: a static test that any new `select("*")` in `routes/` is allowlisted or justified.
- **CI**: assert `check-bundle-budget.mjs` fails on a synthetic over-budget build.
- **Benchmark**: k6 storefront scenario (now cached) to record the cache-hit path.

## Suggested Documentation Updates

- `docs/PERFORMANCE.md`: record the caching layers (web snapshot + API response cache) and the SSE cap.
- `apps/api/src/lib/pagination.ts`: the export cap comment should name the audit export exception if it stays.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| What is the real wall-clock for 500 brand-new invites? | Decides whether PERF-P2-004 needs a job-based redesign | A measured run against a scratch org |
| Which `select("*")` endpoints are the biggest payloads? | Prioritises the projection work | Supabase egress/row-size data |
| Is the 60 s catalog TTL acceptable for admin catalog edits? | Trade-off between freshness and cost | Product decision |

## Appendix

- Grep snapshots at 7dd0402 (non-test API code): `select("*")` = 156 (was 154); `count: "exact"` = 38 (was 77); `lib/pagination` importers = 43 (was 4); inline `queryInt(req.query.page` = 37 (was 37); `.limit(10000)` = 5 (audit export ×2, services ×3).
- Cache stack: web 60 s per-process snapshot (DB-backed only), API `responseCache` 60 s backed by Redis with in-memory fallback (`middleware/cache.ts`).
