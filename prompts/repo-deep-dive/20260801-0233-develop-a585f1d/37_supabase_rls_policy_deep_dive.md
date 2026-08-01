# 37 — Supabase RLS Policy Deep Dive

## Audit Metadata

| Field | Value |
| --- | --- |
| Audit ID | `37` |
| Target | `C:\temp\mainecybertech-portal` (MCT Client Portal monorepo) |
| Branch / SHA | `develop` @ `a585f1d` |
| Audit date | 2026-08-01 |
| Scope file | `prompts/repo-deep-dive/prompts/37_supabase_rls_policy_deep_dive.md` |
| Rules file | `prompts/repo-deep-dive/prompts/00_SHARED_AUDIT_RULES.md` |
| Finding ID prefix | `RLS-*` |
| Audit mode | Read-only / static evidence review (no code modified) |

## Scope

- Every `create policy` / `alter table … enable row level security` across the 70-migration set (`5302026`–`5302109`) — extracted with multiline-aware parsing (policy bodies span lines).
- Bootstrap helpers: `is_org_member`, `is_org_approved_member`, `can_read_document`, `is_super_admin` (5302026, 5302100).
- RLS posture per table (enabled/disabled), per-operation coverage (select/insert/update/delete), approved-membership filtering, service-role/anon grants.
- Interaction with `bulk_update_with_version` RPC (RLS invoker-rights), webhook dead-letter, store analytics anon inserts, `public_interactions` RLS-disable.
- Cross-reference to API authz (`requireOrgAccess`, `requireAdmin`) to identify where RLS is the only guard vs. defense-in-depth.

## Evidence Reviewed

- `5302026_...corrected.v3.sql` (bootstrap; ~150 tables, 400+ policies) — multiline parse at `mct_sql_inventory.txt`.
- `5302041_sla_logs.sql` … `5302093` module tables with inline membership policy bodies.
- `5302100_fix_rls_membership_status.sql` (60-table rewrite to approved-aware `is_org_member`; `create or replace function public.is_org_member(org_id uuid)` — **no `set search_path`**).
- `5302101_fix_missing_rls_policies.sql` (adds missing UPDATE/DELETE for `module_timeline_events`, `scheduled_check_results`, `webhook_deliveries`, `training_enrollments`).
- `5302104/5302105/5302106` (store: promotions, quotes, analytics events).
- `5302033/5302036/5302037/5302038` (public_interactions RLS churn → disabled).
- `5302055_cleanup_dead_tables.sql` (drops `document_permissions` CASCADE — see DATA-001 in report 07).
- `5302052/5302054` (`bulk_update_with_version` RPC — invoker rights, no REVOKE).
- `apps/api/src/middleware/authorization.ts` (`requireOrgAccess`), `apps/api/src/middleware/admin.ts` (`requireAdmin`), `apps/api/src/lib/supabase.ts` (service-role client + CircuitBreaker).

## Executive Summary

**Score: 3.1 / 5**

RLS is broadly enabled (all ~140 RLS-enabled tables have at least one policy; no RLS-on-zero-policy tables) and the base entities (documents, tickets, projects, memberships) use an approved-membership helper (`is_org_approved_member`) with `set search_path = public`. The May 2026 hardening added `requireOrgAccess()` at the API layer as defense-in-depth, which masks many RLS defects because the API always uses the **service-role** client and never exercises the authenticated-role policies in tests.

The audit found **four P0/P1 structural problems**:

1. **`RLS-001` (P0)**: `5302055_cleanup_dead_tables.sql` drops `document_permissions CASCADE`, which cascades to drop `can_read_document()` (SECURITY DEFINER) **and** the `documents_select_visibility_aligned` SELECT policy. After this migration, `documents` has RLS enabled with no viable SELECT policy for `authenticated` — direct reads break. API is unaffected (service role) which is why nothing caught it. (Cross-ref `DATA-001`.)
2. **`RLS-002` (P1)**: **24 tables still use raw inline membership checks `memberships … auth.uid()` with NO `status = 'approved'` filter on SELECT/INSERT/UPDATE** (e.g., `proposals_select_org` in 5302059, `api_keys_select_org` in 5302042, `sop_library_org_select` in 5302086). A lifecycle-tracked scan (drop→recreate resolved in order) confirms 5302100 rewrote the select/insert/update policies for its 60-table set but **never touched these 24 tables**; 66 distinct tables total still carry ≥1 raw policy (24 with raw read/write, 59 with raw role-gated DELETE — overlapping sets). RLS is the ONLY enforcement here (module routes use `requireAuth`, not `requireOrgAccess` — verified: `proposals.ts`, `api-keys.ts` route-level `requireAuth` only).
3. **`RLS-003` (P1)**: `5302100` redefines `public.is_org_member(uuid)` as SECURITY DEFINER **without `set search_path = public`** — a security-definer search-path hazard (PG 15 hardened but the convention used everywhere else is explicit). Both helpers coexist (`is_org_member` in new module tables; `is_org_approved_member` in base tables), creating two source-of-truth membership predicates.
4. **`RLS-004` (P1)**: `bulk_update_with_version(text, jsonb)` is PUBLIC-executable (no REVOKE) and runs as invoker, so its write effect is bounded only by the permissive per-row RLS of the 28 tables above — a combined escalation path (any authenticated user can call it on `proposals`/`api_keys`/etc. where RLS is not approved-filtered).

Secondary findings: `RLS-005` (P2) per-operation gaps — tickets/projects lack DELETE policies, documents lack DELETE (only 4 ops), many module tables have no DELETE; `RLS-006` (P2) `store_analytics_events` anon INSERT collects ip_address/user_agent without anonymization; `RLS-007` (P2) `public_interactions` RLS disabled by 5302038 (by design, but posture is hidden — flip-flopped across 4 migrations); `RLS-008` (P2) 59 tables carry role-gated `*_delete_admin` policies from 5302076 that never check `status='approved'` — 44 of them were orphaned when 5302100 added clean `*_admin_delete` policies without dropping the old names; `RLS-009` (P3) RLS status not verified in CI (no `verify_seed.sql` RLS checks).

## Findings

### RLS-001 — `document_permissions` CASCADE drop removes `can_read_document()` and the `documents` SELECT policy

- **Severity: P0 (Critical)**
- **Location**: `5302055_cleanup_dead_tables.sql:10`; bootstrap `5302026` (`can_read_document` fn; `documents_select_visibility_aligned` policy)
- **Impact**: After 5302055, `authenticated` SELECT on `documents` is blocked (no policy) — direct/PostgREST reads fail for non-service-role. `private` visibility gating is gone. API masked (service role). Cross-ref `DATA-001`.
- **Evidence**: `5302055_cleanup_dead_tables.sql:10 drop table if exists public.document_permissions cascade;` Bootstrap: `create policy documents_select_visibility_aligned on public.documents for select to authenticated using (public.can_read_document(id));` and `can_read_document` has `from public.document_permissions dp`. No later re-creation (grep across > 5302055).
- **Recommendation**: Forward-fix migration re-creating table + function + policy; add RLS-resolution integration test.
- **Suggested test**: `SET ROLE authenticated; SELECT count(*) FROM documents;` after chain.

### RLS-002 — 24 tables still use raw `memberships … auth.uid()` SELECT/INSERT/UPDATE without `status='approved'` (pending/disabled members keep full read/write)

- **Severity: P1 (High)**
- **Location**: module policy bodies in `5302041`–`5302093`; representative: `5302059_proposal_builder.sql` (`proposals_select_org`, `proposals_insert_auth`, `proposals_update_org`), `5302042_api_keys.sql` (`api_keys_select_org` etc.), `5302058_shared_module_tables.sql` (`ai_draft_outputs_*`, `approval_requests_*`, `module_comments_*`), `5302060` (`findings_*`), `5302061` (`assets_*`), `5302062` (`domain_monitors_*`), `5302063` (`qbr_reports_*`), `5302064` (`file_requests_*`), `5302066` (`vendor_contracts_*`, `vendor_contacts_*`), `5302067` (`service_catalog_*`), `5302041` (`sla_logs_select_org`, `sla_logs_insert_admin`), `5302043` (`document_shares_*`), `5302085` (`badges_earned`, `score_history`), `5302086` (`sop_library_org_*`), `5302058` (`portal_module_settings_*`, `scheduled_check_results_*`, `module_timeline_events_*`), `5302065` (`ticket_triage_drafts` / `triage_drafts_*`), `5302059` (`proposal_line_items_*`, `proposal_phases_*`).
- **Impact**: 24 tables have raw (non-approved-filtered) read/write policies: `ai_draft_outputs, api_keys, approval_requests, assets, badges_earned, document_shares, domain_monitors, file_requests, findings, module_comments, module_timeline_events, portal_module_settings, proposal_line_items, proposal_phases, proposals, qbr_reports, scheduled_check_results, score_history, service_catalog, sla_logs, sop_library, ticket_triage_drafts, vendor_contacts, vendor_contracts`. A membership whose status is `pending`/`disabled`/`removed` still matches `auth.uid()`, so those users can read and write these tables. 5302100 rewrote the select/insert/update policies for the tables in ITS set (60 tables) but never touched these 24.
- **Evidence** (lifecycle-tracked over the full migration chain: drop-then-recreate resolved in order, bare `on <table>` names included):
  - `5302059` `proposals_select_org` (never dropped by 5302100): `exists (select 1 from memberships m where m.user_id = auth.uid() and m.organization_id = proposals.organization_id)` — no `m.status='approved'`, no role gate. Same pattern for `proposals_insert_auth`, `proposals_update_org`, `proposal_line_items_*`, `proposal_phases_*`.
  - `5302042` `api_keys_select_org` + `api_keys_insert_admin`/`update_admin`/`delete_admin`: raw membership, some role-gated to `admin`, none checking `status='approved'`.
  - `5302086` `sop_library_org_select/insert/update` + `sop_library_admin_delete`: raw inline `memberships … user_id = auth.uid()`; 5302100 created a parallel `sop_org*` set but did **not** drop these older-named policies, so both coexist and the raw ones remain effective.
  - 5302100 `create policy … *admin_delete` blocks add approved-aware DELETE for its tables but the **pre-existing `*_delete_admin` policies from `5302076_delete_rls_policies.sql` (44 of them) were never dropped** — those tables now carry BOTH a raw role-gated DELETE policy and a clean one.
- **Recommendation**: Extend the 5302100 pattern to these 24 tables (rewrite to `is_org_member(organization_id)` with approved filter) AND drop the orphaned raw `*_delete_admin` policies from 5302076 where 5302100 added clean `*_admin_delete`. Add a CI grep rule that fails on any `create policy` body containing `memberships` + `auth.uid()` without `status = 'approved'` or an `is_org_member` helper.
- **Suggested test**: For each of the 24 tables, `SET ROLE` a pending-membership user and assert `select count(*)` returns 0; assert delete fails for a pending admin on the 59 role-gated tables.

### RLS-003 — `is_org_member` redefined without `SET search_path = public` (SECURITY DEFINER)

- **Severity: P1 (High)**
- **Location**: `5302100_fix_rls_membership_status.sql` (`create or replace function public.is_org_member(org_id uuid) returns boolean … security definer … no set search_path`)
- **Impact**: The bootstrap convention (`is_org_approved_member` in `5302026`) sets `search_path = public` for the same reason PG 15 changed the default `public` search path to `pg_catalog`. Omitting it on a SECURITY DEFINER function leaves schema-resolution to the caller's `search_path`, a classic privilege-escalation hazard when misconfigured (and a review/audit flag). It also creates a second, subtly different membership predicate (two source-of-truth helpers).
- **Evidence**: `5302100` body vs `5302026` (`is_org_approved_member … set search_path = public` + `and m.status = 'approved'`). `5302100` adds the status filter but drops the search_path clause.
- **Recommendation**: `alter function public.is_org_member(uuid) set search_path = public;` Add an SQL lint rule requiring `set search_path` on every SECURITY DEFINER function.
- **Suggested test**: Static grep for `security definer` functions lacking `set search_path`.

### RLS-004 — `bulk_update_with_version` PUBLIC-executable + permissive per-row RLS on the 24 raw tables = combined escalation path

- **Severity: P1 (High)**
- **Location**: `5302052` (v1) / `5302054` (final); callers `documents.ts:478,527`, `tickets.ts:455`
- **Impact**: RLS is the only boundary for this generic versioned-table writer. On tables where RLS is permissive (RLS-002 list), any authenticated user can update rows they could also update directly — but more importantly, the function is a single choke point that, if RLS on any versioned table is ever misconfigured to `using(true)`, becomes a full write primitive. No `REVOKE` exists (only 2 grants in the migration set — `approve_project_task`, `add_project_task_comment`).
- **Evidence**: grep across migrations: only `grant execute on function public.approve_project_task` and `add_project_task_comment`; no grant/revoke for `bulk_update_with_version`. Function body: `format('update %I set version = version + 1, updated_at = now(), %s where id = %L and version = %L returning *', table_name, set_clause, …)`.
- **Recommendation**: `REVOKE ALL ON FUNCTION public.bulk_update_with_version(text, jsonb) FROM PUBLIC; grant execute to service_role;` plus table whitelist inside function. (Cross-ref DATA-005.)
- **Suggested test**: authenticated call returns permission-denied.

### RLS-005 — Per-operation policy gaps: no DELETE (or limited UPDATE) policies on key entity tables

- **Severity: P2 (Medium)**
- **Location**: matrix across migrations (see evidence file)
- **Impact**: Missing DELETE policies mean deletes are denied for direct clients but succeed via service-role API routes that perform their own `requireAdmin` — so this is defense-in-depth debt, not an active break. Some gaps are intentional (immutable `roles`, `permissions`, `audit_logs`).
- **Evidence**: Per-op coverage gaps (tables lacking full select/insert/update/delete):
  - Select-only: `roles`, `permissions`, `role_permissions`, `webhook_endpoints` (all+select split), `onboarding_submissions`, `user_permission_overrides`, `notification_preferences`.
  - No DELETE: `tickets`, `ticket_comments`, `projects`, `organizations`, `profiles`, `memberships`, `comments`, `contracts`, `appointments`, `billing_customers`, `subscriptions`, `invoices`, `payments`, `chat_threads`, `chat_messages`, `audit_logs`, `notifications`, `webhook_dead_letters`, `ai_draft_outputs`, `sla_logs`, `portal_module_settings`, `webhook_endpoints`.
  - No UPDATE/DELETE (insert+select only): `comments`, `sla_logs` (metric-append), `webhook_dead_letters`.
  - Documents: 4 ops (select/insert/update/delete) — but see RLS-001 (SELECT policy at risk).
- **Recommendation**: Add DELETE policies mirroring admin RLS where soft-delete or archival is not the intent; for genuinely immutable tables, add explicit `revoke`/comment. Track in verify script.
- **Suggested test**: Per-table policy-op coverage report generated in CI.

### RLS-006 — `store_analytics_events` anon INSERT collects `ip_address` + `user_agent` (PII) with no anonymization

- **Severity: P2 (Medium)**
- **Location**: `5302106_store_analytics.sql` (`anon_insert` policy FOR INSERT TO anon WITH CHECK (true); columns ip_address, user_agent)
- **Impact**: Anonymous tracking of full IPs + UA without truncation/hashing. Combined with store quote data, this accumulates PII on a PUBLIC (unauthenticated) write path. No retention/deletion policy.
- **Evidence**: `5302106` column list + policy `anon_insert … with check (true)`; store.ts uses service-role reads for analytics.
- **Recommendation**: Store hashed/truncated IP (e.g., `/24` prefix) or IP metadata only; add a `stored_at` retention cleanup; restrict columns anon can set (allowlist `event_type`, `path`, `referrer`, `entity_id`, truncate IP at middleware level).
- **Suggested test**: anon insert with 40-char payload rejected; confirm `ip_address` stored truncated.

### RLS-007 — `public_interactions` RLS disabled after 4-migration flip-flop (by design, but posture obscured)

- **Severity: P2 (Medium)**
- **Location**: `5302033` (enable + anon INSERT), `5302036` (service_role INSERT), `5302037` (idempotent anon+service_role), `5302038` (DISABLE RLS)
- **Impact**: The public contact form writes rely on webhook/JSM rate-limit and app-level validation, not RLS. Acceptable for public data, but the flip-flop and final disable is undocumented and easy to accidentally re-enable (breaking the form with a 500).
- **Evidence**: `5302038: alter table public.public_interactions disable row level security;` No explanatory comment.
- **Recommendation**: Comment the disable rationale; add a `verify_seed.sql` assertion of `relrowsecurity = false`.
- **Suggested test**: Post-apply query asserting RLS state.

### RLS-008 — 59 tables carry role-gated DELETE policies (`*_delete_admin` from 5302076) that never check `status='approved'`

- **Severity: P2 (Medium)**
- **Location**: `5302076_delete_rls_policies.sql` (44 policies, e.g., `status_items_delete_admin`, `website_monitors_delete_admin`, `offboarding_delete_admin`); plus raw admin-delete policies in `5302042`, `5302059`, `5302058`, `5302061`–`5302067`, `5302086`, `5302077` (total 59 tables with a raw DELETE-only policy)
- **Impact**: A pending/disabled membership whose role is `admin`/`super_admin` can still DELETE rows via these policies (e.g., `exists (select 1 from memberships m join roles r … where m.user_id = auth.uid() and r.key in ('super_admin','admin'))` with no `m.status='approved'`). Lower blast radius than RLS-002 because DELETE is role-gated and admin flows additionally require `requireAdmin` at the API layer — but the DB layer is not approved-aware.
- **Evidence**: `5302076_delete_rls_policies.sql:7-9` (representative bodies) — all 44 follow the identical pattern. Lifecycle-tracked scan: 59 distinct tables have a raw DELETE-only policy surviving to the final state; 44 of them originate in 5302076 and were never dropped when 5302100 added clean `*_admin_delete` policies.
- **Recommendation**: Drop the orphaned `*_delete_admin` policies on tables where 5302100 created clean `*_admin_delete`, or rewrite their bodies to include `m.status = 'approved'`. Standardize all admin DELETE policies on a shared approved-aware helper.
- **Suggested test**: `SET ROLE` a pending admin membership user; assert DELETE is denied on one representative table.

### RLS-009 — RLS posture not verified in CI / verification scripts

- **Severity: P3 (Low)**
- **Location**: `supabase/verify_seed.sql`, CI `e2e.yml`, `supabase-migrations.yml`
- **Impact**: Regressions like RLS-001/002 can ship because nothing asserts policy presence/behavior. 1,530 unit tests all use the service-role path (RLS bypassed), so the policy layer is effectively untested.
- **Evidence**: No `pg_policies`-based assertions in verify_seed.sql; no RLS-resolution test in test suite.
- **Recommendation**: Add a `verify_rls.sql` (assert per-table policy counts + approved filter) and a PostgREST `authenticated`-role smoke test in CI.
- **Suggested test**: `select count(*) from pg_policies where tablename='documents'` ≥ 1 after chain.

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Direct/PostgREST document reads fail after 5302055 (RLS-001) | Medium | Critical | Forward-fix migration + RLS-resolution test |
| R2 | Pending/disabled members read/write 24 module tables (RLS-002) | High | High | Rewrite 24 tables' policies to `is_org_member`; drop orphaned raw delete policies; grep rule |
| R3 | SECURITY DEFINER search_path misconfiguration (RLS-003) | Low | Critical | Add `set search_path` + lint rule |
| R4 | `bulk_update_with_version` becomes full write primitive if any versioned table gets `using(true)` (RLS-004) | Low | High | REVOKE PUBLIC; table whitelist |
| R5 | Anon analytics PII accumulation (RLS-006) | Medium | Medium | Truncate/hash IP; retention cleanup |

## Recommendations

1. **(P0)** Forward-fix migration: re-create `document_permissions`, `can_read_document()`, and `documents_select_visibility_aligned`; add `authenticated`-role document SELECT integration test.
2. **(P1)** Rewrite the 24 raw read/write membership policies to `is_org_member(organization_id)`; drop orphaned `*_delete_admin` policies from 5302076 where 5302100 added clean `*_admin_delete`; add CI grep rule banning `memberships … auth.uid()` without `status='approved'`.
3. **(P1)** `alter function public.is_org_member(uuid) set search_path = public;` — and add a lint rule for all SECURITY DEFINER functions.
4. **(P1)** `REVOKE ALL ON FUNCTION bulk_update_with_version(text, jsonb) FROM PUBLIC;` grant to service_role; whitelist tables.
5. **(P2)** Add DELETE policies for entities that are admin-deleted via API (align API `requireAdmin` with policy); document immutable tables.
6. **(P2)** Anonymize store analytics IP/UA; add retention cleanup.
7. **(P3)** Comment `public_interactions` RLS disable; add verify_rls.sql + CI RLS smoke tests.

## Quick Wins

- REVOKE PUBLIC on `bulk_update_with_version`.
- One forward-fix migration restoring the 3 document RLS objects.
- Add `set search_path` to `is_org_member`.
- Add a `verify_rls.sql` with policy-count assertions.

## Hardening Backlog

| # | Item | Effort |
| --- | --- | --- |
| 1 | Restore documents RLS stack (table + fn + policy) | Medium |
| 2 | Rewrite 24 raw read/write policies → `is_org_member`; drop orphaned delete policies | Medium |
| 3 | Search_path lint for SECURITY DEFINER | Small |
| 4 | REVOKE PUBLIC on bulk RPC | Small |
| 5 | DELETE-policy gap fill | Medium |
| 6 | Store analytics PII anonymization | Small |
| 7 | RLS CI smoke tests (authenticated role) | Small |

## Suggested Tests

- Authenticated-role resolution on `documents` after chain (RLS-001).
- Pending-membership user `select count(*)` = 0 on the 24 tables (RLS-002); delete denied for pending admin on 59 tables (RLS-008).
- Function search_path assertion (RLS-003).
- PostgREST denial on `bulk_update_with_version` after REVOKE (RLS-004).
- Anon store insert: truncated IP + allowlisted columns only (RLS-006).
- `pg_policies` counts in verify_rls.sql (RLS-009).

## Open Questions

- Are any of the 24 raw read/write tables accessed by authenticated-role clients in production, or is everything service-role today? (If the latter, RLS-002 is latent until a non-service-role client is introduced.)
- Is `document_permissions` intended to return (shared/document ACL model), or should `private` visibility be modeled differently (e.g., `document_shares`)? Decision gates the forward-fix shape.
- Should `is_org_member` and `is_org_approved_member` be consolidated into one helper? (Recommended: yes.)

## Evidence Index (temp files)

- `mct_sql_inventory.txt` — full migration table/RLS/policy inventory (2012 lines) incl. policy names, bodies, per-op coverage
- `5302100` rewrite list (60/88) and the remaining-28 verification from multiline regex runs
- Representative policy bodies read directly: `5302059` (proposals), `5302042` (api_keys), `5302101` (missing-op fixes), `5302104–5302106` (store), `5302055` (drop), `5302052/5302054` (bulk RPC), `5302026` (bootstrap helpers + base-table policies)
