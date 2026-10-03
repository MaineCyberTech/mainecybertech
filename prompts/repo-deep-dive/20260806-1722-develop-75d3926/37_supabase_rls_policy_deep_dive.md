# Supabase RLS Policy Deep-Dive Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: `20260806-1722-develop-75d3926`
- Repository: `C:\temp\mainecybertech-portal`
- Branch: develop
- Commit SHA: `75d3926`
- Generated at: 2026-08-06
- Auditor: principal-level repository auditor (fresh pass)
- Area code: RLS
- Output path: `prompts/repo-deep-dive/20260806-1722-develop-75d3926/37_supabase_rls_policy_deep_dive.md`
- Scope limitations: static analysis of migration SQL + app code. Policy inventory derived from migration text (811 policy definitions across 137 RLS-enable statements), not a live `pg_policies` query. No production connection.

## Scope

- Full RLS coverage scan of every `create table` in `supabase/migrations/` (97 files, versions 5302026–5302128): RLS enablement, policy presence (quoted and unquoted policy names), grants.
- Policy quality review on core tables (documents, tickets, projects, memberships, module tables) including WITH CHECK clauses and SECURITY DEFINER helpers.
- Grant review (5302116 sweep, sequence grants, default privileges).
- Storage object policies for the `documents` bucket.
- Security-definer function inventory: search_path pinning, EXECUTE grants, authorization checks (22 definitions; 1 found unguarded).
- App-side consistency: `apps/api/src/middleware/{auth,admin,org-access}.ts`, `lib/roles.ts`, route-level org scoping, worker service-role usage.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `5302026_*.sql` | SQL bootstrap | Core RLS + helper functions | 137 RLS enables across all files; policy vocabulary uses `manage/upload/comment/schedule/update` keys |
| `5302033/5302036/5302037/5302038` | SQL | public_interactions lifecycle | 5302038 disables RLS (the only table in the schema) |
| `5302055/5302057/5302069/5302076/5302077/5302081` | SQL | Policy churn + dead-table cleanup | 5302055 dropped 9 tables (policies cascaded away) |
| `5302100_fix_rls_membership_status.sql` | SQL | is_org_member approved-aware helper + ~44 table rewrites | Redefined helper without search_path — pinned later by 5302112 |
| `5302101_fix_missing_rls_policies.sql` | SQL | Clean `*_admin_delete` policies for 6 tables | Kept; 5302112 drops the raw orphans |
| `5302110_restore_document_permissions.sql` | SQL | P0 forward-fix | Restores table, `can_read_document`, SELECT policies idempotently |
| `5302111_harden_bulk_update_rpc.sql` | SQL | RPC hardening | REVOKE PUBLIC/anon; whitelist; per-row org check; still no column allowlist (see DATA-P1-001) |
| `5302112_fix_rls_approved_membership.sql` | SQL | 24-table approved rewrite + 44 orphan drops | Verified complete (all 5302076 `*_delete_admin` dropped; clean replacements exist) |
| `5302116_grant_table_privileges.sql` | SQL | PostgREST grant sweep | Grants full DML to anon on **all** tables — safe only where RLS is on (P0 on public_interactions) |
| `5302122_mark_task_read_rpc.sql` | SQL | SECURITY DEFINER read-mark RPC | Caller-supplied user_id, no authz (see DATA-P2-002) |
| `5302098_article_feedback_fields.sql` | SQL | increment_article_count SECURITY DEFINER | PUBLIC execute, no search_path, no org check (see DATA-P1-002) |
| `5302104/5302105/5302106/5302114/5302115` | SQL | Store tables RLS | RLS on; service-role policies; anon INSERT for quotes/analytics by design |
| `5302118/5302128` | SQL | Permission catalog + 8 roles | Catalog ↔ policy vocabulary drift (see DATA-P2-001/P2-003) |
| `apps/api/src/middleware/org-access.ts` | TS | Tenant isolation | PLATFORM_ADMIN_KEYS wired (8 keys) |
| `apps/api/src/middleware/admin.ts` | TS | Admin gate | admin/super_admin only — new MSP roles excluded by design |
| `apps/api/src/lib/roles.ts` | TS | Role-key constants | In sync with 5302128 |
| `apps/api/src/routes/me.ts` | TS | me/permissions | Data-driven; approved memberships → role_permissions → permissions |
| `apps/api/src/services/supabase.ts` | TS | Service-role client | All route queries run as service_role (RLS bypassed — defense-in-depth relies on API middleware) |
| `apps/worker/src/**` | TS | Background tasks | Service-role; retention task for public_interactions scheduled daily |

## Executive Summary

RLS coverage is essentially complete: every live table in the schema has RLS enabled (137 enable statements across the migration set), every RLS-enabled table has at least one policy (quoted and unquoted policy names both counted — the earlier "3 tables without policies" suspicion was a false positive from unquoted policy names in the bootstrap), and the RLS posture was materially improved across the 5302100/5302101/5302112 batch: `is_org_member` is approved-membership-aware with a pinned search_path, 24 tables were rewritten to it, and 44 orphaned raw `*_delete_admin` policies were dropped in favor of clean replacements. The 5302110 forward-fix correctly restored `document_permissions` + `can_read_document` + the visibility-aligned SELECT policies that 5302055's cascade destroyed.

However, the audit surfaced one critical hole: **`public_interactions` is the only RLS-disabled table and 5302116 grants `anon` full DML on it** — anonymous SELECT/UPDATE/DELETE of the PII contact-lead store (RLS-P0-001, mirrors DATA-P0-001). Two SECURITY DEFINER functions remain weakly guarded: `increment_article_count` (PUBLIC-executable, no search_path, no org check — RLS-P1-001) and `mark_task_read` (caller-controlled user_id — RLS-P2-001). The bulk RPC, while hardened, remains a definer write primitive without a column allowlist (RLS-P2-002). Finally, there is systemic vocabulary drift: bootstrap policies reference permission keys (`tickets:manage`, `documents:upload`, `contracts:manage`, `onboarding:update`, `appointments:schedule`) that do not exist in the current 300-key catalog, and the new 5302128 platform roles are absent from RLS role gates (`r.key in ('admin','super_admin')` lists) — both are defense-in-depth inconsistencies only, because every route executes with the service-role client.

Positive notes: service-role-only app architecture means RLS failures don't break the product (the one that did — the `mark_task_read` RLS violation on hosted — was fixed with a proper RPC); storage object policies are aligned with `can_read_document`; anon INSERT policies on store quotes/analytics are intentional public-lead paths.

Recommended next actions: (1) re-enable RLS on `public_interactions` with anon INSERT-only + service-role policies and revoke anon SELECT/UPDATE/DELETE; (2) lock down `increment_article_count`; (3) add caller/authz checks to `mark_task_read` and column allowlists to `bulk_update_with_version`; (4) align policy permission vocabulary with the catalog; (5) add an RLS-matrix CI test.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| RLS enablement | All migrations | Tenant isolation at DB | All live tables enabled | Low | Only `public_interactions` disabled (P0) |
| Policy inventory | 811 policy defs (777 quoted, 34 unquoted) | Read/write gates | Comprehensive; approved-aware helpers | Med | Vocabulary drift (dead `manage/upload` branches) |
| Helper functions | `is_org_member`, `is_org_approved_member`, `user_has_role`, `user_has_permission`, `can_read_document` | Policy building blocks | SECURITY DEFINER + pinned search_path | Low | `user_has_role` arrays don't include new MSP roles |
| Grants | 5302116 | PostgREST roles | Restored; default privileges set | High | anon DML on RLS-off table (P0) |
| Storage | `storage.objects` policies + buckets | Document bucket gating | Aligned with `can_read_document` | Low | avatars bucket public by design |
| SECURITY DEFINER RPCs | `bulk_update_with_version`, `mark_task_read`, `increment_article_count`, `bootstrap_portal_access` | App/utility writes | Mixed | High | Two weakly guarded (RLS-P1-001, P2-001, P2-002) |
| Role gates | `r.key in ('admin','super_admin')` inline + `user_has_role` | Admin delete/write policies | Consistent | Med | 5302128 MSP roles not included (by design? inconsistent) |
| App queries | `apps/api/src/services/supabase.ts` | All API reads/writes | service_role only | Low | RLS is defense-in-depth; API middleware is primary control |
| New roles | 5302128 + `lib/roles.ts` | Cross-tenant MSP roles | Wired in org-access/orgs/tickets | Low | Web admin gate excludes them (consistency gap) |

## Domain Scorecard

| Category                | Score | Evidence | Gap | Recommended action |
| ----------------------- | ----: | -------- | --- | ------------------ |
| Supabase migrations     |   4 | 97 files; applied to hosted + E2E | Version gaps 5302027/39/40/44-49/84 | Document or clean |
| SQL schema              |   4 | Enums, tenant cols, version cols | Soft-delete unused; policy vocab drift | Align vocab; implement/drop soft delete |
| RLS enablement          |   4 | All live tables enabled (137 stmts) | public_interactions disabled (P0) | Re-enable + anon INSERT-only |
| Policies                |   3 | 811 defs; approved-aware; orphan cleanup verified | Dead `manage/upload` branches; permissive member INSERTs | Rewrite to catalog keys; tighten inserts |
| Grants/roles            |   3 | 5302116 restore + defaults | anon over-grant on PII table | Targeted grants |
| Storage bucket policies |   4 | documents bucket aligned w/ can_read_document | avatars public (by design) | None |
| Functions/triggers      |   3 | Helpers pinned; triggers for updated_at | increment_article_count unguarded | Revoke PUBLIC; add checks |
| Security definer        |   3 | search_path pinned on all current helpers | mark_task_read caller control; bulk column allowlist | Add authz to RPCs |
| Generated types         |   1 | none | Drift risk | Generate or lint |
| App queries             |   3 | service-role only; middleware-gated | RLS not independently exercised | Add RLS matrix CI test |
| Tenant/user matching    |   4 | approved-membership helpers universal | New roles org-agnostic by design | Document |
| Admin bypass            |   4 | requireAdmin admin/super_admin; org-access PLATFORM_ADMIN_KEYS | Web requireAdminAccess differs from API (see DATA-P3-003) | Align or document |

## Detailed Review

### Item: RLS coverage matrix (scripted scan)

- Evidence: script over all migrations; per-table RLS-enable count and policy count (quoted + unquoted names).
- What it does: verifies no live table is RLS-enabled-without-policies and no table lacks RLS.
- How it appears to work: 137 `alter table … enable row level security`; 811 policy definitions; zero tables with RLS-on and zero policies; only `public_interactions` has a `disable` statement.
- Dependencies: policies reference helper functions — all present with pinned search_path after 5302112.
- Current controls: approved-membership helpers; `*_admin_delete` role-gated policies; unquoted-name policies in bootstrap (project_task_comment_reads/comments, project_updates) are self-scoped (`auth.uid() = user_id`).
- Missing controls: none structural — the P0 is a grant/RLS interplay, not missing coverage.
- Risks: public_interactions (P0); dead policy branches; permissive INSERT policies on module tables (any approved member can insert proposals/findings/assets/etc. directly).
- Recommended improvement: keep coverage; add CI matrix test.
- Suggested tests: see "Suggested Tests".
- Suggested docs: `docs/RLS_MODEL.md` with table→policy map.

### Item: Security-definer function inventory

- Evidence: grep of all migrations — 22 `security definer` occurrences; per-function search_path + grants checked.
- What it does: 8 bootstrap helpers (pinned), `bootstrap_portal_access` (5302035/5302057), `increment_article_count` (5302098), `bulk_update_with_version` (5302111), `mark_task_read` (5302122).
- How it appears to work: all except `increment_article_count` have search_path pinned; 5302111/5302122/5302098-related revokes present for the first two only.
- Dependencies: auth.uid()/JWT claims for authz — present in 5302111, absent in 5302098/5302122.
- Current controls: REVOKE from PUBLIC/anon on 5302111 + 5302122; whitelist + per-row org check on 5302111.
- Missing controls: EXECUTE revoke + authz on 5302098; caller identity + task/org validation on 5302122; column allowlist on 5302111.
- Risks: see findings RLS-P1-001, RLS-P2-001, RLS-P2-002.
- Recommended improvement: apply the 5302111 pattern to all definer functions.
- Suggested tests: direct RPC abuse cases.
- Suggested docs: `docs/DB_FUNCTIONS.md` inventory with authz contract per function.

## Scenario / Control Matrix

| ID      | Scenario or control     | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ----------------------- | -------- | --------------- | --- | -------- | -------------- |
| RLS-001 | Supabase migrations     | 97 files, CI-applied | Idempotent + guarded demos | Version gaps | P3 | Document |
| RLS-002 | SQL schema              | Bootstrap + 70 migrations | Enums/tenant/version | Vocab drift | P2 | Align |
| RLS-003 | RLS enablement          | 137 enables | Universal | public_interactions off | **P0** | Re-enable |
| RLS-004 | Policies                | 811 defs | Approved-aware | Dead branches; permissive inserts | P2 | Rewrite |
| RLS-005 | Grants/roles            | 5302116 | Restored | anon over-grant | **P0** | Target grants |
| RLS-006 | Storage bucket policies | documents bucket | Aligned | avatars public (by design) | P3 | None |
| RLS-007 | Functions/triggers      | Helpers pinned | Good | increment_article_count | P1 | Guard |
| RLS-008 | Security definer        | 5302111/5302122 | Pinned + revoked | mark_task_read authz | P2 | Add checks |
| RLS-009 | Generated types         | none | - | Drift | P3 | Generate |
| RLS-010 | App queries             | service-role only | Middleware-gated | RLS unexercised | P2 | Matrix test |
| RLS-011 | Tenant/user matching    | approved helpers | Strong | New roles org-agnostic | P2 | Document |
| RLS-012 | Admin bypass            | requireAdmin | admin/super_admin | Web/API asymmetry | P3 | Align |

## Findings

### Finding ID: RLS-P0-001 - RLS disabled + anon full DML on the PII contact-lead table

- Severity: P0
- Confidence: High
- Area: RLS enablement / grants
- Evidence:
  - `supabase/migrations/5302038_disable_rls_public_interactions.sql` — `ALTER TABLE public.public_interactions DISABLE ROW LEVEL SECURITY;`
  - `supabase/migrations/5302116_grant_table_privileges.sql` — DO loop `grant select, insert, update, delete on table public.%I to anon` over all tables
  - `supabase/migrations/5302117_public_interactions_retention.sql` — PII comment (name, email, phone, message)
  - Verified: this is the **only** table with a `disable row level security` statement in the repo
- What is happening: `anon` (public anon key, discoverable) can SELECT all contact-form PII and UPDATE/DELETE rows. RLS is the only gate between anon and the data, and it is off.
- Why it matters: Anonymous PII exfiltration + tampering; defeats the 90-day retention design.
- User / business impact: Privacy breach (GDPR-class), loss of leads, reputation damage.
- Security / privacy / reliability impact: Unauthenticated data disclosure of raw PII; availability (delete) and integrity (update) of the lead pipeline.
- Recommended fix: ENABLE RLS; create `anon_insert` INSERT policy + `service_role_all` policy; `revoke select, update, delete on table public.public_interactions from anon;` Re-test contact-form submit; root-cause the original 500 that motivated 5302038 instead of disabling RLS.
- Suggested validation: anon SELECT/UPDATE/DELETE → denied; anon INSERT → allowed; service_role all → allowed; E2E contact form still works.
- Owner suggestion: Backend lead.
- Effort estimate: < 1 day.
- Dependencies: 5302033/5302036/5302037 policy history available to reuse.
- Status: Open (new this run).

### Finding ID: RLS-P1-001 - increment_article_count: PUBLIC-executable SECURITY DEFINER without search_path or authz

- Severity: P1
- Confidence: High
- Area: Security definer / grants
- Evidence:
  - `supabase/migrations/5302098_article_feedback_fields.sql` — `CREATE OR REPLACE FUNCTION increment_article_count(article_id uuid, field_name text) … $$ LANGUAGE plpgsql SECURITY DEFINER;` (no `set search_path`, no revoke, no membership check)
- What is happening: Functions default to PUBLIC EXECUTE; anon can invoke the RPC via PostgREST and increment any integer column on any `knowledge_articles` row in any org (cross-tenant), executing as owner (RLS bypassed).
- Why it matters: Cross-tenant write primitive; the exact vulnerability class 5302111/5302122 were built to prevent remains here.
- User / business impact: Counter corruption (helpful/not-helpful, and any numeric column via `field_name`).
- Security / privacy / reliability impact: Integrity corruption; search_path not pinned (low hijack risk since body is schema-qualified, but grant + authz are the issue).
- Recommended fix: `revoke all on function public.increment_article_count(uuid, text) from public, anon;` grant to authenticated + service_role; `set search_path = public`; add org-membership check on the target row.
- Suggested validation: anon RPC → denied; authenticated non-member → no rows affected; member → works.
- Owner suggestion: Backend lead.
- Effort estimate: Half day.
- Dependencies: none.
- Status: Open (new this run).

### Finding ID: RLS-P2-001 - mark_task_read RPC trusts caller-supplied identity and skips membership/ownership checks

- Severity: P2
- Confidence: High
- Area: Security definer
- Evidence:
  - `supabase/migrations/5302122_mark_task_read_rpc.sql` — signature `(p_user_id uuid, p_task_id uuid, p_organization_id uuid)`; SECURITY DEFINER; EXECUTE granted to `authenticated`; body upserts exactly the supplied values into `project_task_comment_reads`; `on conflict (user_id, task_id)`
- What is happening: Any authenticated user can mark read-state for **any** user/task/org tuple, including orgs they don't belong to; the task↔org relationship is never validated.
- Why it matters: Read-receipt spoofing and cross-org writes to a tenant table through an RLS-bypassing definer; the RLS policies (self-scoped `auth.uid() = user_id`) encode the correct intent — the RPC bypasses them.
- User / business impact: Integrity pollution of read-state/analytics.
- Security / privacy / reliability impact: RLS-bypass write primitive with no authz; low blast radius (single analytics table).
- Recommended fix: Add `if p_user_id is distinct from auth.uid() and session_user <> 'service_role' then raise exception 'not allowed'; end if;` plus `exists (select 1 from project_tasks t where t.id = p_task_id and t.organization_id = p_organization_id)` and `is_org_member(p_organization_id)`.
- Suggested validation: authz-negative calls as described in 07 report.
- Owner suggestion: Backend lead.
- Effort estimate: Half day.
- Status: Open.

### Finding ID: RLS-P2-002 - bulk_update_with_version remains a definer write primitive without a column allowlist

- Severity: P2 (RLS-side view of DATA-P1-001)
- Confidence: High
- Area: Security definer / policies
- Evidence: `supabase/migrations/5302111_harden_bulk_update_rpc.sql` (SECURITY DEFINER; whitelist `tickets`/`documents`; per-row `is_org_member` for JWT callers; dynamic `SET %I = %L` over all data keys)
- What is happening: Approved members can write any column (including `organization_id`, `created_by`, `version`) on rows in their org; service_role passes through un-validated (app-layer gated).
- Why it matters: DB-level invariant enforcement missing; the version-check race is covered (rowcount check) but the write-set is unbounded.
- User / business impact: Cross-org integrity corruption from a compromised client.
- Security / privacy / reliability impact: RLS bypass + unbounded column writes.
- Recommended fix: Per-table column allowlist, forbid identity/org/version columns, and re-assert `organization_id` unchanged after update.
- Suggested validation: direct RPC with `organization_id` in data → denied.
- Owner suggestion: Backend lead.
- Effort estimate: 0.5–1 day.
- Status: Open.

### Finding ID: RLS-P2-003 - RLS policy permission vocabulary drifted from the 5302118 catalog

- Severity: P2
- Confidence: High
- Area: Policies / permission model
- Evidence: bootstrap policies use `user_has_permission(org, 'tickets', 'manage')`, `'tickets','comment'`, `'projects','manage'`, `'documents','upload'`, `'documents','manage'`, `'contracts','manage'`, `'onboarding','update'`, `'appointments','schedule'` — none of these (module, action) pairs exist in 5302028/5302118 catalog (only view/create/edit/delete/manage/export, and `contracts`/`appointments` tables were dropped in 5302055)
- What is happening: `user_has_permission` is data-driven → those branches are permanently false; e.g. non-superadmin RLS-level ticket/documents updates are impossible and the `documents:manage` branch inside `can_read_document` (5302110) is dead.
- Why it matters: RLS semantics diverge from the API permission model; future direct-client flows get unexpected denials; the "manage" override path documented in 5302110 never fires.
- User / business impact: None today (service-role API); latent authz surprise.
- Security / privacy / reliability impact: Dead branches → either over- or under-restrictive when RLS is finally exercised.
- Recommended fix: Rewrite policy branches to catalog keys (`tickets:edit`, `documents:create`, `onboarding:edit`, `projects:edit`) or add the legacy keys as catalog rows; add a CI lint that all `user_has_permission` calls resolve to catalog entries.
- Suggested validation: lint + targeted PostgREST calls as client_admin.
- Owner suggestion: Platform lead.
- Effort estimate: 1–2 days.
- Status: Open.

### Finding ID: RLS-P2-004 - 5302128 platform roles absent from RLS role gates

- Severity: P2
- Confidence: High
- Area: Tenant/user matching
- Evidence: `r.key in ('admin','super_admin')` inline gates in 5302100/5302112 (api_keys, delete policies, document_shares `('admin','client_admin','technician')`, etc.); `user_has_role(org, array['admin','super_admin','technician'])` in `can_read_document` (5302110/5302026); `lib/roles.ts` PLATFORM_ADMIN_KEYS includes 6 new MSP roles
- What is happening: At the RLS layer, the new platform roles (dispatcher, engineer, security-analyst, project-manager, finance, onboarding-specialist) are treated like ordinary users: they cannot perform RLS-gated admin writes and fail `user_has_role` visibility branches (e.g., internal documents). At the API layer they are platform admins.
- Why it matters: Defense-in-depth inconsistency — a direct-RLS flow (or a future client SDK) would deny capabilities the API grants; conversely, if role-key strings were ever reused for privilege escalation checks, the divergence is a footgun.
- User / business impact: None today; latent inconsistency.
- Security / privacy / reliability impact: Mixed posture; `user_has_role` arrays are hardcoded strings duplicated across migrations — no single source of truth.
- Recommended fix: Centralize role keys in a helper (`is_platform_role_keys(keys text[])` derived from a constant), include new MSP keys where platform-admin semantics apply, and add a lint comparing `lib/roles.ts` against RLS role-key strings.
- Suggested validation: grep-based drift test between `PLATFORM_ADMIN_KEYS` and RLS `r.key in (...)` lists.
- Owner suggestion: Platform lead.
- Effort estimate: 1 day.
- Status: Open.

### Finding ID: RLS-P3-001 - Permissive approved-member INSERT policies on operational module tables

- Severity: P3
- Confidence: High
- Area: Policies
- Evidence: 5302112 rewrites — `proposals_insert_auth`, `findings_insert_auth`, `assets_insert_auth`, `domain_monitors_insert_auth`, `qbr_reports_insert_auth`, `file_requests_insert_auth`, `vendor_contracts/contacts_insert_auth`, `service_catalog_insert_auth`, `module_comments_insert_auth`, `approval_requests_insert_auth`, `ai_draft_outputs_insert_auth`, `triage_drafts_insert_auth` — all `with check (public.is_org_member(organization_id))` (role-agnostic)
- What is happening: Any approved member (including `client_user`) can directly INSERT into these operational tables via PostgREST; UPDATE is similarly member-wide on most.
- Why it matters: RLS is more permissive than the API permission model (which gates by module permissions); inconsistent least-privilege posture.
- User / business impact: None today (service-role API); future direct-client risk.
- Security / privacy / reliability impact: Over-broad write surface at the DB layer.
- Recommended fix: Where feasible, gate INSERT/UPDATE by `user_has_permission(org, <module>, 'create'/'edit')` instead of bare membership; at minimum document the divergence.
- Suggested validation: as client_user, direct INSERT into `assets` → denied after fix.
- Owner suggestion: Platform lead.
- Effort estimate: 2–3 days (large surface).
- Status: Open (improvement).

### Finding ID: RLS-P3-002 - 5302116 default privileges vs. anon grant sweep style

- Severity: P3
- Confidence: High
- Area: Grants
- Evidence: `5302116_grant_table_privileges.sql` — explicit loop grants `select, insert, update, delete` to anon/authenticated on all tables; `alter default privileges … to anon`
- What is happening: The grant sweep is functional and necessary (fixed the E2E 42501 blocker), but granting anon UPDATE/DELETE on every table is unnecessary noise — RLS still gates, yet a single future `disable rls` mistake (as with public_interactions) becomes instantly exploitable.
- Why it matters: Reduces the blast radius of future RLS misconfiguration.
- User / business impact: None.
- Security / privacy / reliability impact: Defense-in-depth hygiene.
- Recommended fix: Grant anon only SELECT (+INSERT where public forms need it); keep full DML for service_role; add a CI check that no table has both RLS disabled and anon write grants.
- Suggested validation: lint over migrations.
- Owner suggestion: Platform lead.
- Effort estimate: Half day.
- Status: Open.

### Finding ID: RLS-P3-003 - No RLS-matrix regression tests in CI

- Severity: P3
- Confidence: High
- Area: RLS tests
- Evidence: No test files assert RLS behavior as anon/authenticated/approved-member; E2E only exercises the app (service-role) path.
- What is happening: RLS quality is maintained by review, not by tests; the 5302100-5302112 fixes would not have been caught by a regression suite.
- Why it matters: RLS is the tenant-isolation backstop; unexercised code drifts (see RLS-P2-003/P2-004).
- User / business impact: None directly.
- Security / privacy / reliability impact: Regression risk for the security backstop.
- Recommended fix: Add a `supabase-testing` script (or CI job) that runs `set role anon/authenticated`-style queries against `db reset` and asserts expected allow/deny matrix.
- Suggested validation: CI green with matrix assertions.
- Owner suggestion: Platform lead.
- Effort estimate: 2–3 days.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| anon PII exfiltration (public_interactions) | P0 | High | Privacy breach, data loss | 5302038 + 5302116 | Re-enable RLS; anon INSERT-only |
| Definér-write primitives (increment_article_count) | P1 | Medium | Cross-org integrity | 5302098 | Revoke PUBLIC; authz |
| Definér RPCs missing authz (mark_task_read, bulk) | P2 | Medium | Integrity pollution | 5302122/5302111 | Identity + allowlist checks |
| Policy↔catalog vocab drift | P2 | Certain | Authz surprises | bootstrap vs 5302118 | Lint + rewrite |
| Future RLS-disable mistakes amplified by anon DML sweep | P2 | Low | Exploitable hole | 5302116 | Narrow anon grants |

## Recommendations

### Immediate / Release Blocking

1. **RLS-P0-001**: Enable RLS on `public_interactions`; anon INSERT-only + service-role policies; revoke anon SELECT/UPDATE/DELETE.
2. **RLS-P1-001**: Revoke PUBLIC/anon EXECUTE on `increment_article_count`; pin search_path; add org check.

### This Week

3. **RLS-P2-001**: Authz checks in `mark_task_read` (caller identity, task/org match, membership).
4. **RLS-P2-002**: Column allowlist + immutability in `bulk_update_with_version`.
5. **RLS-P2-003**: Start policy↔catalog alignment (documents/tickets first — highest-value branches).

### This Month

6. **RLS-P2-004**: Centralize RLS role-key lists; include new MSP platform roles; drift lint vs `lib/roles.ts`.
7. **RLS-P3-001**: Tighten INSERT/UPDATE policies with permission checks on operational module tables.
8. **RLS-P3-002**: Narrow anon grants; add RLS-off × anon-write lint.

### Later / Platform Evolution

9. **RLS-P3-003**: RLS-matrix CI suite.
10. Storage bucket audit (avatars public by design; documents private) — keep as-is, document.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| `revoke select, update, delete on table public.public_interactions from anon;` | Instantly closes PII read/tamper (before full RLS re-enable) | New migration | anon SELECT → denied |
| `revoke all on function increment_article_count(uuid,text) from public, anon;` | Closes anon definer write | New migration | anon RPC → denied |
| Grep lint: `disable row level security` count must be 0 | Prevents recurrence of the P0 | CI job | CI fails on any disable |
| Grep lint: RLS role-key lists ⊆ PLATFORM_ADMIN_KEYS + admin/super_admin | Keeps RLS and API role model aligned | CI job | CI green |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| public_interactions RLS re-enable + anon revoke | P0 | Backend lead | < 1 d | None |
| increment_article_count lockdown | P1 | Backend lead | 0.5 d | None |
| mark_task_read authz | P2 | Backend lead | 0.5 d | None |
| bulk_update_with_version allowlist | P2 | Backend lead | 0.5–1 d | None |
| Policy↔catalog vocabulary alignment | P2 | Platform lead | 1–2 d | Catalog decision |
| RLS role-key centralization + drift lint | P2 | Platform lead | 1 d | None |
| Permissive INSERT policy tightening | P3 | Platform lead | 2–3 d | Product decision |
| Narrow anon grants + RLS-off lint | P3 | Platform lead | 0.5 d | None |
| RLS matrix CI suite | P3 | Platform lead | 2–3 d | db reset infra |

## Suggested Tests

- RLS matrix (psql, after `db reset`): for each of anon / authenticated / approved member / platform role / service_role × {public_interactions, tickets, documents, proposals, assets, api_keys, project_task_comment_reads}: SELECT/INSERT/UPDATE/DELETE expected outcomes.
- RPC abuse tests: `increment_article_count` as anon → denied; `mark_task_read` with foreign user_id → denied; `bulk_update_with_version` with `organization_id` in data → denied.
- Drift lints (CI): (a) `disable row level security` occurrences == 0; (b) every `user_has_permission(…,'module','action')` pair exists in the permissions catalog; (c) RLS `r.key in (...)` lists match `PLATFORM_ADMIN_KEYS` + admin/super_admin; (d) every migration `create table` appears in a route or allowlist.
- E2E: contact-form submit → row created; as logged-in non-member, direct REST call to read leads → 403.
- Post-deploy smoke on hosted: health endpoint + login still green after the RLS re-enable.

## Suggested Documentation Updates

- `docs/RLS_MODEL.md` (new): table→policy map, helper-function contract, grant model, and the "no RLS-disabled tables" invariant.
- `docs/DB_FUNCTIONS.md` (new): every SECURITY DEFINER function with its authz contract.
- `docs/PERMISSION_CATALOG.md` (new or extend existing): 13-role × module matrix incl. 5302128 roles and the `retention`/`training-modules` gap.
- `docs/ROLLBACK_PROCEDURES.md`: note forward-only migrations and the public_interactions RLS change.
- Update `docs/INDEX.md` with the new audit reports.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Does any client (marketing site, embed) call PostgREST directly for public_interactions or store endpoints? | Determines whether anon SELECT on other tables is reachable | Network/CF logs |
| Why did the contact-form INSERT fail under the 5302037-era RLS policies (the reason RLS was disabled)? | The P0 fix must not regress the form | Historical issue/commit |
| Should new MSP platform roles ever exercise RLS-level admin writes? | Drives RLS-P2-004 scope | Product decision |
| Is `document_permissions` management planned (UI), or is RLS-visibility-only final? | Drives policy surface for that table | Product decision |
| Are the unquoted bootstrap policy names (project_task_comment_reads etc.) a maintenance hazard? | Naming convention consistency | None — cosmetic |

## Appendix

### Coverage scan results (script, all migrations)

- 137 `alter table … enable row level security`
- 1 `alter table … disable row level security` (public_interactions — P0)
- 811 policy definitions (777 quoted names, 34 unquoted)
- 0 tables with RLS enabled and no policies (quoted + unquoted counted)
- 22 `security definer` function definitions; 1 without search_path pinning and without EXECUTE revokes (increment_article_count); 2 with incomplete authz (mark_task_read, bulk_update_with_version)
- 44 orphaned `*_delete_admin` policies from 5302076 — all dropped in 5302112; clean `*_admin_delete` replacements exist in 5302100/5302101

### Helper function search_path state (final, after 5302112)

| Function | SECURITY DEFINER | search_path pinned | EXECUTE revoked from PUBLIC/anon |
| -------- | ---------------- | ------------------ | -------------------------------- |
| is_super_admin / is_org_member / is_org_approved_member / user_has_role / user_has_permission / can_read_document / storage_path_org_id / bootstrap_portal_access | yes | yes | n/a (policy helpers; direct calls not exposed) |
| bulk_update_with_version | yes | yes | yes |
| mark_task_read | yes | yes | yes |
| increment_article_count | yes | **no** | **no** |
| approve_project_task / add_project_task_comment (bootstrap) | yes | yes | n/a |

### Permission keys referenced by RLS policies but missing from the 5302118 catalog

`tickets:manage`, `tickets:comment`, `projects:manage`, `documents:upload`, `documents:manage`, `contracts:manage` (table dropped), `onboarding:update`, `appointments:schedule` (table dropped) — all branches evaluate false.

### Storage bucket policies (from migrations)

- `documents` bucket: SELECT/INSERT/UPDATE/DELETE policies on `storage.objects` aligned with `can_read_document`/org membership (5302026 + cleanup in 5302110 era).
- `avatars` bucket: public by design (per AGENTS.md; Terraform-managed).
