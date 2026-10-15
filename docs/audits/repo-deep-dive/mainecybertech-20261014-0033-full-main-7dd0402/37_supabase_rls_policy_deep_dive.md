# 37_supabase_rls_policy_deep_dive — Prompt 37 - Supabase RLS Policy Deep-Dive Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `37_supabase_rls_policy_deep_dive.md` (area RLS, prompt)

## Verification Performed

Read-only re-verification at `7dd0402`; no hosted-Supabase or local-Postgres replay. 12 of 16 previous RLS rows verified fixed, 4 partially fixed, 0 regressed, 1 new P3. Executed: `node scripts/verify-rls.mjs` (0 failures; 1 baseline role-gate warning), `node scripts/check-rls-predicate.mjs` (PASS), `node scripts/check-permission-catalog.mjs` (PASS: 198 route + 46 policy references vs 338 keys), `sh scripts/ci/check-permission-catalog.sh` (PASS + negative fixture), and `promtool check rules` + `promtool test rules` (docker prom/prometheus:v3.5.1 — 22 rules SUCCESS, tests SUCCESS). Key migrations: 5302435/5302436/5302447/5302448/5302452/5302459. Residuals: service-role default + secret-defined allow-lists (RLS-P2-004), no anon-grant lint (RLS-P3-001), name-derived storage org helper (RLS-P3-003), duplicate scoped-client tests + unguarded matrix counts (RLS-P3-004). New: RLS-P3-008 (four live policies hardcode partial platform-role lists).

## Findings

| ID | Severity | Title |
|---|---|---|
| RLS-P1-001 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| RLS-P1-002 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data |
| RLS-P2-001 | P2 | MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies |
| RLS-P2-002 | P2 | webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client |
| RLS-P2-003 | P2 | approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated |
| RLS-P2-004 | P2 | API defaults to the service-role DB client (RLS bypass) |
| RLS-P2-005 | P2 | document_versions UPDATE policy still uses the raw unfiltered membership predicate |
| RLS-P2-006 | P2 | store_quotes public INSERT policy allows arbitrary organization_id after tenant scoping |
| RLS-P2-007 | P2 | Auth write endpoints call GoTrue admin APIs through the RLS-scoped client |
| RLS-P3-001 | P3 | 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint |
| RLS-P3-002 | P3 | No behavioral RLS allow/deny matrix test (static gate only) |
| RLS-P3-003 | P3 | storage_path_org_id trusts a client-controlled object name |
| RLS-P3-004 | P3 | Duplicate scoped-client tests and stale coverage-matrix snapshot |
| RLS-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) |
| RLS-P3-006 | P3 | No static lint for RLS role-gate drift or policy↔permission-catalog drift |
| RLS-P3-007 | P3 | Scoped-client adoption is partial: several tenant modules have no RLS call sites and service helpers bypass the scoped client |
| RLS-P3-008 | P3 | Four live policies still hardcode partial platform-role lists (document_shares trio omits super_admin; notifications insert omits six platform keys) |
