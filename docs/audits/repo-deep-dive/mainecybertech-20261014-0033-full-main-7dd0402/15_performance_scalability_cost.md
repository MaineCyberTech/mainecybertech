# 15_performance_scalability_cost — Prompt 15 - Performance, Scalability, and Cost Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `15_performance_scalability_cost.md` (area PERF, prompt)

## Verification Performed

Domain subagent produced 10 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

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
