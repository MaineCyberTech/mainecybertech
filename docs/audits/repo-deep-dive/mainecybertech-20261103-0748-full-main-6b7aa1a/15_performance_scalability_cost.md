# 15_performance_scalability_cost — Prompt 15 - Performance, Scalability, and Cost Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `15_performance_scalability_cost.md` (area PERF, prompt)

## Verification Performed

8 verified-fixed, 2 partially-fixed, 0 regressed, 1 open (PERF-P3-005 new); PERF-P3-001 is now fixed by the 5,000-row export cap.

## Findings

| ID | Severity | Title |
|---|---|---|
| PERF-P2-001 | P2 | Request metrics label uses the raw URL path, so Prometheus cardinality grows with every resource ID |
| PERF-P2-002 | P2 | Public storefront pages are force-dynamic and uncached; each page view costs two Supabase reads |
| PERF-P2-003 | P2 | resolveEffectivePermissions is uncached and fans out 4-6 queries per gated request |
| PERF-P2-004 | P2 | Bulk invite performs 4 sequential Supabase calls per invite and cannot finish 500 invites inside the 30s request timeout |
| PERF-P2-005 | P2 | Each SSE notification stream opens its own Supabase Realtime channel with no connection cap |
| PERF-P2-006 | P2 | POST /billing/sync does not paginate Stripe results |
| PERF-P3-001 | P3 | Unbounded list reads remain on compliance and time-entry endpoints; exports load up to 10k rows with select("*") |
| PERF-P3-002 | P3 | Every paginated list request also runs an exact row count |
| PERF-P3-003 | P3 | No bundle-size or performance budget gate; the analyzer is opt-in only |
| PERF-P3-004 | P3 | API routes broadly select all columns (`select("*")`) and pagination is ad hoc |
| PERF-P3-005 | P3 | SLA metrics endpoint reads every SLA row in a 90-day window with `select('*')` and no limit |
