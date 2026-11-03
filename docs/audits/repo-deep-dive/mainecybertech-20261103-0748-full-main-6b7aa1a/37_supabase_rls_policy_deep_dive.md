# 37_supabase_rls_policy_deep_dive — Prompt 37 - Supabase RLS Policy Deep-Dive Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `37_supabase_rls_policy_deep_dive.md` (area RLS, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5; no hosted-Supabase or local-Postgres replay. 13 of 17 previous RLS rows verified fixed, 4 partially fixed, 0 regressed, 1 new P3. Executed: node scripts/verify-rls.mjs (140/140 tables RLS-enabled, 1035 policies, 0 failures, 0 warnings), node scripts/check-rls-predicate.mjs (PASS, 34 migrations), node scripts/check-permission-catalog.mjs (PASS: 206 route + 46 policy references vs 338 keys), and promtool check/test rules against prom/prometheus:v3.5.1 (26 rules, tests SUCCESS). 5302461 closes both RLS-P3-008 and the pre-baseline notifications exception; 5302452/5302447/5302448/5302435/5302436 remain effective. Residuals: service-role fallback + secret-defined allow-lists (RLS-P2-004), no anon-grant lint (RLS-P3-001), name-derived storage org (RLS-P3-003), unguarded matrix counts (RLS-P3-004). New: RLS-P3-009 (self-addressed notification can name any organization).

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
| RLS-P3-001 | P3 | 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off x anon-write lint |
| RLS-P3-002 | P3 | No behavioral RLS allow/deny matrix test (static gate only) |
| RLS-P3-003 | P3 | storage_path_org_id trusts a client-controlled object name |
| RLS-P3-004 | P3 | Duplicate scoped-client tests and stale coverage-matrix snapshot |
| RLS-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) |
| RLS-P3-006 | P3 | No static lint for RLS role-gate drift or policy<->permission-catalog drift |
| RLS-P3-007 | P3 | Scoped-client adoption is partial: several tenant modules have no RLS call sites and service helpers bypass the scoped client |
| RLS-P3-008 | P3 | Four live policies still hardcode partial platform-role lists (document_shares trio omits super_admin; notifications insert omits six platform keys) |
| RLS-P3-009 | P3 | notifications INSERT policy allows any authenticated user to write a self-addressed row into an arbitrary organization |
