# Data, Schema, Migration, and Runtime Validation Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: `20260806-1722-develop-75d3926`
- Repository: `C:\temp\mainecybertech-portal`
- Branch: develop
- Commit SHA: `75d3926` (test-data: cover admin workflow-button states; preceded by `3ec6024` me/permissions engineer-role test and `1a6e0d2` expanded role catalog)
- Generated at: 2026-08-06
- Auditor: principal-level repository auditor (fresh pass — no prior reports reused)
- Area code: DATA
- Output path: `prompts/repo-deep-dive/20260806-1722-develop-75d3926/07_data_schema_migration_runtime_validation.md`
- Scope limitations: static analysis of SQL + TypeScript only. No live Postgres/PostgREST session, no production connection (per safety rules). Policy *counts* are derived from migration text, not `pg_policies`.

## Scope

Reviewed:
- All 97 migration files under `supabase/migrations/` (5302026 → 5302128), version sequencing, idempotency, RLS, grants, functions.
- All 9 seed files under `supabase/seeds/` (00–08) for schema/column/role-key consistency (cross-checked against migration-created tables/columns and the 5302128 role catalog).
- All 55 API route files under `apps/api/src/routes/` + middleware (`org-access.ts`, `admin.ts`, `optimistic-locking.ts`) for table usage, transactional integrity, optimistic locking, and role-key handling.
- Worker task `public-interaction-retention` and its schedule.
- Table-level usage analysis: every `create table` in migrations cross-checked against every quoted table string in `apps/api/src/routes/**`, `apps/api/src/services/**`, `apps/api/src/middleware/**`, `apps/worker/src/**`.

Not reviewed: web app UI beyond `lib/auth/admin.ts` / `lib/permissions.ts` permission gates, storage bucket objects beyond policy text, live runtime behavior.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `supabase/migrations/5302026_*.sql` (2,377 lines) | SQL bootstrap | Core schema, enums, RLS, helper functions, seeds | All live tables except public_interactions have RLS enabled |
| `5302028_seed_permissions.sql` | SQL | Original 25-permission catalog + 5 roles | `documents:manage/upload`, `tickets:manage/comment` etc. never seeded |
| `5302055_cleanup_dead_tables.sql` | SQL | Dropped 9 tables incl. `document_permissions` (cascade) | Root cause of the 5302110 restore |
| `5302051/5302113` | SQL | Optimistic locking + CHECK constraints | `version >= 1` on all 9 versioned tables |
| `5302108/5302109` | SQL | Audit cascade; soft-delete columns | Soft-delete columns are unused by any route |
| `5302110_restore_document_permissions.sql` | SQL | P0 restore | Idempotent; `documents:manage` branch dead (see DATA-P2-001) |
| `5302111_harden_bulk_update_rpc.sql` | SQL | bulk_update_with_version hardening | Whitelist + per-row org check; column allowlist still missing (DATA-P1-001) |
| `5302112_fix_rls_approved_membership.sql` (707 lines) | SQL | 24-table approved-membership rewrite; 44 orphan policy drops | Verified: all 44 5302076 `*_delete_admin` orphans dropped, clean replacements exist |
| `5302116_grant_table_privileges.sql` | SQL | Restored PostgREST grants | Grants full DML to anon on **all** tables (gate is RLS — except public_interactions, see DATA-P0-001) |
| `5302117_public_interactions_retention.sql` | SQL | Retention index + policy comment | Worker task exists + scheduled daily |
| `5302118_permission_matrix_full_catalog.sql` | SQL | 300+ permission catalog w/ group_key/scope/label | Missing `retention`, `training-modules` modules |
| `5302128_role_catalog_expansion.sql` (422 lines) | SQL | 8 new roles + assignments + demo users | Silent no-op refs to `retention`/`training-modules` (DATA-P2-003); FKs verified |
| `5302122_mark_task_read_rpc.sql` | SQL | SECURITY DEFINER read-mark RPC | Caller-supplied user_id, no org/task validation (DATA-P2-002) |
| `5302126/5302120/5302123/5302119/5302121` | SQL | Demo-data migrations w/ prod-domain guard | Column/table refs verified against schema |
| `apps/api/src/routes/*.ts` (55 files) | TS | Table usage, locking, role gates | See Inventory + Findings |
| `apps/api/src/middleware/{org-access,admin,optimistic-locking}.ts` | TS | Tenant isolation, admin gates | New roles wired via `lib/roles.ts` |
| `apps/api/src/lib/roles.ts` | TS | PLATFORM_ADMIN_KEYS | 8 keys incl. 6 new MSP roles |
| `apps/api/src/routes/me.ts` | TS | me/permissions endpoint | Data-driven; resolves new roles (test 3ec6024) |
| `apps/api/src/__tests__/me-permissions.test.ts` | Test | 6 tests incl. engineer-role case | Green per commit |
| `apps/worker/src/tasks/public-interaction-retention.ts` + `main.ts` | TS | 90-day PII purge | Scheduled daily |
| `apps/web/lib/auth/admin.ts` | TS | Admin UI gate | admin/super_admin only (see DATA-P3-003) |
| All seeds 00–08 | SQL | Fixture consistency | References verified columns/roles; E2E db reset green |

## Executive Summary

The repository is in strong shape for a schema/migration audit: 97 migrations apply cleanly to hosted Supabase and E2E (migrations → seeds → 253/253 green), every live table has RLS enabled, per-org tenant columns are universal, optimistic locking is wired end-to-end on the mutable entities, the bulk RPC and mark-read RPC were hardened with search_path pinning and grants, and the previous P0 (missing PostgREST grants, dropped `document_permissions`) were correctly forward-fixed.

The audit found **one new P0**: the contact-lead PII table `public_interactions` has RLS **disabled** (5302038) and migration 5302116 now grants `anon` **SELECT/UPDATE/DELETE** on every table including it — anonymous callers can dump or destroy all contact-form PII (name/email/phone/message). A second P1: `increment_article_count` (5302098) is an unguarded PUBLIC-executable SECURITY DEFINER function without search_path pinning or org validation — a cross-tenant counter-tamper primitive. The 5302128 role-catalog migration is well-built (idempotent, valid FKs, guarded demo users, wired into `PLATFORM_ADMIN_KEYS`) but silently references two permission keys (`retention`, `training-modules`) that do not exist in the catalog, so those grants never materialize. The soft-delete columns (5302109) remain unused — DELETE routes still hard-delete. The main structural gap is vocabulary drift between bootstrap RLS policies (which reference `tickets:manage`, `documents:upload`, `onboarding:update`, etc.) and the current 300-key catalog (view/create/edit/delete/manage/export only) — defense-in-depth branches that can never fire.

Recommended next actions: (1) re-enable RLS on `public_interactions` with anon INSERT-only policy + service_role full, and narrow 5302116-style grants; (2) gate `increment_article_count`; (3) add column allowlists to `bulk_update_with_version` and caller checks to `mark_task_read`; (4) reconcile the policy permission vocabulary or add the missing keys; (5) either implement soft delete in routes or drop the columns.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Migrations | `supabase/migrations/` (97 files) | Schema evolution | Applied to hosted + E2E | Low | Version gaps 5302027/5302039/5302040/5302044-49/5302084 (unexplained, likely renumbered deletes) |
| Roles catalog | 5302026 (5) + 5302128 (8) | 13 roles | `is_system=true` everywhere; fixed UUIDs | Low | `on conflict (id) do update` idempotent |
| Permission catalog | 5302028 + 5302118 | 300+ keys w/ group_key/scope/label | Data-driven UI/API | Med | `retention`/`training-modules` missing |
| Optimistic locking | 5302051 + `optimistic-locking.ts` | Version columns + If-Match | Wired on tickets/documents/projects(+tasks)/organizations/webhook-endpoints | Low | CHECK `version>=1` on 9 tables (5302113) |
| Bulk update RPC | 5302111 | Generic versioned bulk write | Hardened (REVOKE, definer, whitelist, per-row org check) | Med | No column allowlist (DATA-P1-001) |
| mark_task_read RPC | 5302122 | RLS-bypass read marking | Pinned search_path + revokes | Med | Caller-controlled user_id (DATA-P2-002) |
| Soft delete | 5302109 | deleted_at/deleted_by columns | Schema only; no route usage | Med | Routes hard-delete (DATA-P2-004) |
| Retention | 5302117 + worker task | 90-day PII purge | Implemented + scheduled daily | Low | Only retention policy in platform |
| Seeds | `supabase/seeds/00-08` | Demo/edge data | Consistent with schema; E2E-verified | Low | 8 seeds registered in config.toml |
| Grants | 5302116 | PostgREST DML grants | Restored + default privileges | High | anon full DML × RLS-off table = P0 |
| Generated DB types | none | - | Absent | Low | SDK types hand-maintained (drift risk) |

## Domain Scorecard

| Category              | Score | Evidence | Gap | Recommended action |
| --------------------- | ----: | -------- | --- | ------------------ |
| Database schema       | 4 | Enums for statuses, universal `organization_id`, version columns, soft-delete cols | Soft-delete unused; policy vocabulary drift | Implement soft delete or drop columns; align policy perms |
| Migrations            | 4 | 97 files, idempotent constructs, CI-applied to hosted, E2E green | 10 unexplained version gaps; no down-migrations | Document/delete gaps; adopt date-prefixed naming |
| Constraints           | 3 | Enum types + `version >= 1` CHECKs + FK cascade cleanup | No domain CHECKs (rejected deliberately), few NOT NULL on module tables | Add NOT NULL where app assumes it; enforce status CHECK via enums (already) |
| Indexes               | 4 | Dedicated index migrations (5302056/5302082/5302102/5302107/5302117), FK indexes | Some module FK columns lack indexes (covered per-migration) | Add FK-index regression test |
| Foreign keys/cascades | 3 | CASCADE on memberships.role_id, audit org FK, document_permissions FKs | audit_logs org-delete CASCADE destroys compliance history | Reconsider audit retention on org delete |
| RLS                   | 3 | All live tables RLS-enabled; only 3 tables w/o policies was false positive (unquoted names) | public_interactions RLS disabled + anon DML (P0) | Re-enable RLS, INSERT-only anon policy |
| Tenant columns        | 4 | Every tenant table carries `organization_id`; approved-membership helpers | New platform roles bypass tenant scoping by design | Document role semantics; consider flag |
| Soft deletes          | 1 | Columns only (5302109) | Zero route/query usage | Implement or remove |
| Audit fields          | 3 | audit_logs comprehensive; 5302108 cascade fix | Cascade-on-org-delete wipes evidence | Preserve audit trail on delete |
| Retention             | 3 | public_interactions 90-day purge implemented+scheduled | No other retention policies (notifications, audit, shares) | Extend retention framework |
| Seeds/fixtures        | 4 | 8 seeds, role-key joins, edge states, E2E-verified | Seeds can drift silently from prod data | Add schema-consistency CI check |
| Generated DB types    | 1 | None generated; SDK types hand-written | Drift between DB and SDK types | Generate types or add drift test |

## Detailed Review

### Item: Migration pipeline (5302026 → 5302128)

- Evidence: 97 files; `supabase/config.toml` seeds; `.github/workflows/supabase-migrations.yml`.
- What it does: fresh-bootstrap consolidated schema + 70+ incremental migrations.
- How it appears to work: sequential, idempotent-by-convention (`if not exists`, `on conflict`, DO-block guards for CHECKs). Applied to hosted dev/prod by CI; `db reset` path for E2E (migrations then seeds).
- Dependencies: role catalog in 5302128 must run before seeds (it does); demo migrations 5302119-5302126 depend on users created in earlier guarded migrations (verified: `66ce903f` superadmin created in 5302119; `f1000000-…` family in 5302120; `f2000000/f3000000` in 5302128; no overlap).
- Current controls: idempotency, prod-domain guard (`primary_domain not like '%.example'/'%.local'`) on all demo migrations, fixed UUIDs, `on conflict` everywhere.
- Missing controls: no down-migrations; version gaps (5302027, 5302039, 5302040, 5302044-5302049, 5302084) never explained; no automated "policy references existing permission keys" check.
- Risks: silent no-op grants (5302128 → `retention`/`training-modules`), demo-data drift in prod guard bypass.
- Recommended improvement: add a validation job that runs the full migration set against an empty DB and fails on warnings; add a catalog lint (module/action keys referenced in 5302128 must exist in permissions).
- Suggested tests: `supabase db reset` + `select count(*) from roles` = 13; per-role permission count assertions for each of the 8 new roles; count of `role_permissions` rows per new role > 0.
- Suggested docs: `docs/MIGRATIONS.md` history table including version-gap rationale.

### Item: Runtime validators (Zod)

- Evidence: `apps/api/src/validators/*`, inline schemas in routes (e.g., `bulkTicketUpdateSchema`), middleware `security.ts`.
- What it does: Zod validation on all mutation endpoints; input sanitizer (pattern detection only — HTML-encoding mutation removed per prior audit).
- How it appears to work: schemas constrain request bodies; UUID params use relaxed string rules by design.
- Dependencies: validators mirror DB columns — drift risk when migrations add columns (e.g., 5302127 added `submitted_at`/`approved_by` — routes updated in `dff9f45`).
- Current controls: full mutation coverage (~27+ endpoints), strict `bulk` payloads (ids/status/priority only).
- Missing controls: no shared schema-generator from DB; some module routes (config-driven) validate via generic per-module schemas that may not cover new columns.
- Risks: silent column drift when migrations and validators diverge.
- Recommended improvement: add a CI test that greps migration `alter table … add column` names against validator schemas (best-effort lint).
- Suggested tests: fuzz each mutation endpoint with extra unknown columns (Zod strips by default — verify).
- Suggested docs: `docs/API_ERROR_HANDLING.md` already exists; add validator↔schema matrix.

## Scenario / Control Matrix

| ID       | Scenario or control   | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | --------------------- | -------- | --------------- | --- | -------- | -------------- |
| DATA-001 | Database schema       | 5302026 + 100 module tables | Enums, tenant cols, RLS everywhere | Soft-delete cols unused; policy vocab drift | P2 | Implement or drop soft delete; align policy perms |
| DATA-002 | Migrations            | 97 files + CI | Idempotent, guarded demo blocks | Version gaps; no down-migrations | P3 | Document gaps; add empty-DB validation job |
| DATA-003 | Constraints           | Enums + version CHECKs | Good type-level enforcement | No cross-table invariants (e.g., task org = project org) | P3 | Add invariant CHECKs/triggers where app assumes them |
| DATA-004 | Indexes               | 5 index migrations | Broad FK/query index coverage | No index-coverage regression test | P3 | Add index lint |
| DATA-005 | Foreign keys/cascades | 5302055/5302108 | Deliberate cascades | audit org-delete cascade wipes audit history | P3 | Preserve audit rows |
| DATA-006 | RLS                   | All tables enabled | Approved-membership helpers | public_interactions anon DML (P0) | **P0** | Re-enable RLS + anon INSERT-only |
| DATA-007 | Tenant columns        | Universal org_id | requireOrgAccess + RLS | New platform roles are org-agnostic by design | P2 | Document + UI flag |
| DATA-008 | Soft deletes          | 5302109 | Columns only | Unused | P3 | Implement or remove |
| DATA-009 | Audit fields          | audit_logs + logAuditEvent | Wired to all mutations | org-delete cascade | P3 | Preserve on delete |
| DATA-010 | Retention             | 5302117 + worker | 90-day purge scheduled | Single policy only | P3 | Extend framework |
| DATA-011 | Seeds/fixtures        | 8 seeds | E2E-verified | Drift risk | P2 | CI schema lint |
| DATA-012 | Generated DB types    | none | Hand-written SDK types | Drift risk | P3 | Generate from DB or add drift test |

## Findings

### Finding ID: DATA-P0-001 - Anonymous SELECT/UPDATE/DELETE on RLS-disabled PII leads table

- Severity: P0
- Confidence: High
- Area: Data access / Privacy / Retention
- Evidence:
  - `supabase/migrations/5302038_disable_rls_public_interactions.sql` — `ALTER TABLE public.public_interactions DISABLE ROW LEVEL SECURITY;` (the only RLS-disabled table in the schema)
  - `supabase/migrations/5302116_grant_table_privileges.sql` — DO loop grants `select, insert, update, delete on table public.%I to anon` for **all** tables
  - `supabase/migrations/5302117_public_interactions_retention.sql` — table comment: "contains PII: name, email, phone, message"
  - `supabase/migrations/5302033_public_interactions.sql` — CREATE TABLE (name, email, phone, message columns)
- What is happening: `public_interactions` (contact-form leads with raw PII) has RLS disabled, and the 5302116 grant sweep gives the `anon` role full DML. The anon key is a public credential embedded in any Supabase client; the project URL is discoverable from the marketing site.
- Why it matters: Anonymous visitors can `SELECT` every contact-form submission (name, email, phone, message) — a PII disclosure; can also `UPDATE`/`DELETE` rows — destroying the marketing lead pipeline and compliance records.
- User / business impact: Privacy breach (GDPR-class), loss of lead data, reputation damage.
- Security / privacy / reliability impact: Unauthenticated data exfiltration and tampering of a PII store; the retention design (5302117 + worker) is defeated because any attacker can delete rows early or read them before purge.
- Recommended fix: `ALTER TABLE public.public_interactions ENABLE ROW LEVEL SECURITY;` + `create policy anon_insert_only for insert to anon with check (true);` + `create policy service_role_full for all to service_role using (true) with check (true);` + `revoke select, update, delete on table public.public_interactions from anon;` — or scope the 5302116 loop to exclude this table. Fix the original INSERT failure cause (the 5302037-era INSERT policies should have sufficed) instead of disabling RLS.
- Suggested validation: as `anon`: `select count(*) from public_interactions` → 0 rows / error; `insert` → succeeds; `delete` → fails. As `authenticated` (non-member): same expectations.
- Owner suggestion: Platform/backend lead.
- Effort estimate: < 1 day including re-test of contact-form INIT/SUBMIT flow.
- Dependencies: 5302117 worker retention unchanged.
- Status: Open (new finding this run).

### Finding ID: DATA-P1-001 - bulk_update_with_version is a definer-rules write primitive without a column allowlist

- Severity: P1
- Confidence: High
- Area: Authorization / Data integrity
- Evidence:
  - `supabase/migrations/5302111_harden_bulk_update_rpc.sql` — `SECURITY DEFINER`, `SET search_path = public`, EXECUTE granted to `authenticated`; per-row check is `IF caller_uid IS NOT NULL THEN … is_org_member(row_org_id)`; the final write is `EXECUTE format('UPDATE %I SET %s WHERE id = $1', v_table_name, string_agg(format('%I = %L', key, value), ', '))` over **every** key in `update_record->'data'`
  - `apps/api/src/routes/tickets.ts:474-513` and `apps/api/src/routes/documents.ts` — API callers constrain `data` to `status/priority` and `folder_path` via Zod
- What is happening: Any `authenticated` JWT holder can call the RPC directly via PostgREST with arbitrary `data` keys on `tickets`/`documents` rows in any org where they are an approved member — including `organization_id`, `created_by`, `version` bypasses, or any column. SECURITY DEFINER bypasses RLS entirely.
- Why it matters: The app layer is safe, but the database no longer enforces the boundary; a compromised client or direct-API consumer can move records across tenants, rewrite authorship, or corrupt any column.
- User / business impact: Cross-tenant data integrity breach from an approved member; audit trail forgery.
- Security / privacy / reliability impact: RLS-bypassing generic write primitive; the version bump can be suppressed (set `version` in data or rely on the 2nd UPDATE which doesn't require version match).
- Recommended fix: Add a per-table column allowlist (`tickets: status, priority`, `documents: folder_path`), forbid `organization_id`/`created_by`/`id`/`version` keys, and re-check the target org *after* computing the new row (or add `AND organization_id = <original>` to the UPDATE).
- Suggested validation: Direct `select bulk_update_with_version('tickets', '[{"id":…,"data":{"organization_id":"<other-org>"}}]')` as an authenticated member → must fail.
- Owner suggestion: Backend/platform lead.
- Effort estimate: 0.5–1 day.
- Dependencies: API bulk routes unchanged.
- Status: Open (new finding this run).

### Finding ID: DATA-P1-002 - increment_article_count: unguarded PUBLIC-executable SECURITY DEFINER function

- Severity: P1
- Confidence: High
- Area: Authorization / RLS bypass
- Evidence:
  - `supabase/migrations/5302098_article_feedback_fields.sql` — `CREATE OR REPLACE FUNCTION increment_article_count(article_id uuid, field_name text) … $$ LANGUAGE plpgsql SECURITY DEFINER;` — no `set search_path`, no `revoke … from public/anon`, no org/membership validation; body runs `UPDATE knowledge_articles SET %I = %I + 1 WHERE id = $1`
  - `apps/api/src/routes/*.ts` — `await supabase.rpc("increment_article_count", { article_id: req.params.id, field_name: field })` (validated caller)
- What is happening: Functions default to EXECUTE granted to PUBLIC. Any caller (including `anon` through PostgREST) can execute the function against **any** `knowledge_articles` row in **any** org, incrementing any integer column (`helpful_count`, `not_helpful_count`, or arbitrary columns) as the function owner — RLS is bypassed (definer) and the counter tamper crosses tenant boundaries.
- Why it matters: Cross-tenant write integrity primitive; contrary to the hardening pattern applied in 5302111/5302122.
- User / business impact: Counter/analytics corruption for knowledge base, phishing opened/clicked counts etc. (if the same pattern were reused).
- Security / privacy / reliability impact: Unauthenticated (anon) write capability via SECURITY DEFINER; search_path not pinned (function body is schema-qualified so hijack risk is low, but the PUBLIC execute + no authz is the issue).
- Recommended fix: `revoke all on function public.increment_article_count(uuid, text) from public, anon; grant execute … to authenticated;` add `set search_path = public`, and add an org check (`exists (select 1 from knowledge_articles k join memberships m on m.organization_id = k.organization_id where k.id = article_id and m.user_id = auth.uid() and m.status='approved')`) or route through an RLS-respecting path.
- Suggested validation: As anon via PostgREST: RPC call → permission denied. As authenticated non-member: call → 0 rows affected.
- Owner suggestion: Backend lead.
- Effort estimate: Half day.
- Dependencies: none.
- Status: Open (new finding this run).

### Finding ID: DATA-P1-003 - Soft-delete columns are dead schema; DELETE routes hard-delete

- Severity: P1
- Confidence: High
- Area: Data lifecycle / integrity
- Evidence:
  - `supabase/migrations/5302109_soft_delete.sql` — adds `deleted_at`/`deleted_by` to tickets/projects/documents + indexes
  - `apps/api/src/routes/tickets.ts:456` — `await supabase.from("tickets").delete().eq("id", req.params.id);` (hard delete)
  - grep of all routes: zero references to `deleted_at`/`deleted_by`
- What is happening: The platform signals soft-delete semantics (columns, indexes) but no route filters `deleted_at` and DELETE endpoints physically remove rows.
- Why it matters: False sense of recoverability; if the columns were meant to gate visibility, pending/suspended access to deleted records is not protected; conversely no route sets them, so they never populate.
- User / business impact: Accidental permanent data loss with no restore path; audit/compliance rows deleted with the entity.
- Security / privacy / reliability impact: Compliance exposure (no tombstone), recovery capability absent.
- Recommended fix: Either implement tombstone semantics (DELETE routes set `deleted_at = now(), deleted_by = auth.uid()`, list/get queries add `.is("deleted_at", null)`, add admin restore) or drop the columns and document hard delete.
- Suggested validation: Unit test: delete ticket → row retained with deleted_at set; list excludes it; get by id returns 404.
- Owner suggestion: Backend lead.
- Effort estimate: 1–2 days (implement) / half day (remove).
- Dependencies: RLS policies unaffected either way.
- Status: Open.

### Finding ID: DATA-P2-001 - RLS policies reference permission keys that no longer exist in the catalog

- Severity: P2
- Confidence: High
- Area: RLS / permission drift (defense-in-depth)
- Evidence:
  - `5302026` bootstrap policies: `user_has_permission(…, 'tickets', 'manage')` (tickets_update_with_permission), `'tickets', 'comment'` (ticket_comments_insert), `'projects', 'manage'` (projects_update, project_tasks_update, project_members_manage), `'documents', 'upload'` (documents_insert, document_versions_insert), `'documents', 'manage'` (documents_update, document_permissions_*, can_read_document), `'contracts', 'manage'`, `'onboarding', 'update'` (onboarding_update_same_org), `'appointments', 'schedule'`
  - `5302118_permission_matrix_full_catalog.sql` + `5302028_seed_permissions.sql` — catalog contains only view/create/edit/delete/manage/export keys; **no** `tickets:manage`, `tickets:comment`, `projects:manage`, `documents:upload`, `documents:manage`, `contracts:manage`, `onboarding:update`, `appointments:schedule`
  - `user_has_permission` (5302026:702-734) is strictly data-driven (role_permissions → permissions by module/action)
- What is happening: Every RLS branch using these keys always evaluates false; e.g., only `is_super_admin()` can update tickets/projects/documents through RLS, and the "documents:manage" override inside `can_read_document` is dead code.
- Why it matters: RLS is currently the defense-in-depth layer (API/worker use service_role which bypasses it), but any future direct client (mobile app, Supabase client, public share flows) will silently get stricter-than-intended behavior, or drift when someone "fixes" one branch without the other.
- User / business impact: None today (service-role only); latent correctness/authorization surprise later.
- Security / privacy / reliability impact: Dead policy branches; inconsistent permission semantics between RLS and API.
- Recommended fix: Either add the missing keys to the catalog (e.g., `tickets:manage`, `documents:upload`, `onboarding:update` mapped onto role assignments) or rewrite the policies to the existing keys (`tickets:edit`, `documents:create`, `onboarding:edit`).
- Suggested validation: Static lint: every `user_has_permission` module/action pair in migrations must exist in the catalog; runtime: as client_admin attempt direct PostgREST ticket update → should succeed per intended matrix.
- Owner suggestion: Platform lead.
- Effort estimate: 1–2 days.
- Dependencies: 5302118/5302128 catalog is the source of truth.
- Status: Open.

### Finding ID: DATA-P2-002 - mark_task_read RPC accepts caller-supplied user_id and skips all validation

- Severity: P2
- Confidence: High
- Area: Authorization / integrity (small blast radius)
- Evidence:
  - `supabase/migrations/5302122_mark_task_read_rpc.sql` — `create or replace function public.mark_task_read(p_user_id uuid, p_task_id uuid, p_organization_id uuid)` SECURITY DEFINER; body inserts/upserts `project_task_comment_reads` with the **caller-supplied** values; EXECUTE granted to `authenticated`
- What is happening: Any authenticated user can invoke the RPC for **any** (user, task, org) tuple — including writing rows for other users' read receipts or arbitrary organization_ids. It bypasses RLS by design (that was the fix for the hosted crash), but it also bypasses the membership/ownership checks the RLS policies encoded.
- Why it matters: Read-receipt spoofing and cross-org write of a tenant table; while the API route passes `req.authUser.userId` (safe today), the DB primitive itself is unsafe for direct callers.
- User / business impact: Integrity pollution of read-state/analytics; low direct business impact.
- Security / privacy / reliability impact: RLS-bypass write primitive; org/task relationship not validated (task could belong to org A while row claims org B).
- Recommended fix: Inside the function: `IF p_user_id IS DISTINCT FROM auth.uid() AND session_user <> 'service_role' THEN raise exception; END IF;` plus validate `exists (select 1 from project_tasks where id = p_task_id and organization_id = p_organization_id)` and `is_org_member(p_organization_id)`.
- Suggested validation: As authenticated user A call with p_user_id = user B → denied; with task of an org A is not a member of → denied.
- Owner suggestion: Backend lead.
- Effort estimate: Half day.
- Dependencies: Portal project detail route (unaffected — passes correct values).
- Status: Open.

### Finding ID: DATA-P2-003 - 5302128 role grants silently reference nonexistent permission modules

- Severity: P2
- Confidence: High
- Area: Permission catalog drift
- Evidence:
  - `supabase/migrations/5302128_role_catalog_expansion.sql:140` — security-analyst assignment: `(p.module_key = 'retention' and p.action_key in ('view','create','edit'))`
  - `supabase/migrations/5302128_role_catalog_expansion.sql:252` — onboarding-specialist: `(p.module_key = 'training-modules' …)`
  - `5302118` catalog — no `retention` module; only `training-hub` (not `training-modules`)
- What is happening: The cross-join `select … from roles r cross join permissions p where …` yields zero rows for those conditions; the intended grants never materialize, silently.
- Why it matters: The permission matrix UI and `me/permissions` will show security-analyst without retention access and onboarding-specialist without training-module access, while the role description promises them; drift between intent and catalog.
- User / business impact: Users in those roles can't access retention policies / training modules through permission-gated UI even though the role was designed to.
- Security / privacy / reliability impact: None (fail-closed), but undermines the role model.
- Recommended fix: Add `('retention', 'view'/'create'/'edit', …)` and `('training-modules', …)` (or alias to `training-hub`) to the 5302118 catalog and re-run the assignments.
- Suggested validation: `select count(*) from role_permissions rp join roles r on r.id=rp.role_id join permissions p on p.id=rp.permission_id where r.key='security-analyst' and p.module_key='retention'` → > 0 after fix.
- Owner suggestion: Backend lead.
- Effort estimate: Half day.
- Dependencies: 5302118 catalog.
- Status: Open.

### Finding ID: DATA-P2-004 - Seven tables are never queried by API or worker code

- Severity: P2
- Confidence: High
- Area: Feature completeness
- Evidence:
  - Grep across `apps/api/src/**` + `apps/worker/src/**`: `document_permissions`, `ai_draft_outputs`, `portal_module_settings`, `store_leads`, `store_proposal_drafts`, `store_quote_requests`, `store_visual_assets` → zero hits (table strings)
  - `apps/api/src/routes/store.ts` only touches `store_promotions`/`store_quotes`
  - Config-driven routes verified: every `table:` string in `batch.ts`, `edu-automation.ts`, `field-services.ts`, `final.ts`, `governance.ts`, `security-ops.ts`, `security-suite.ts` resolves to a real table (no dangling refs)
- What is happening: These tables exist and are seeded but have no read/write path: `document_permissions` is only consulted inside `can_read_document()` (RLS); `ai_draft_outputs`/`portal_module_settings` have no API; store sales-ops tables have no API.
- Why it matters: Seeded data with no API means admin/portal features silently can't manage them; `document_permissions` restore (5302110) exists purely for visibility — there is no route to manage per-document permissions.
- User / business impact: "Settings" and store-lead features show data or nothing without management; document-level permissions can't be administered from UI.
- Security / privacy / reliability impact: `document_permissions` written only by direct DB access (none) — feature dead; no exposure risk.
- Recommended fix: Add minimal CRUD for `document_permissions` (or document the design as RLS-only), and add routes for `portal_module_settings` and the store sales-ops tables or document as backlog.
- Suggested validation: Endpoint inventory test: every table in migrations appears in at least one route or an allowlisted exception file.
- Owner suggestion: Platform lead.
- Effort estimate: 2–3 days for all.
- Dependencies: None.
- Status: Open (known gaps from prior audits: settings + store-campaigns had no API).

### Finding ID: DATA-P3-001 - Unexplained migration version gaps

- Severity: P3
- Confidence: High
- Area: Migrations hygiene
- Evidence: Sorted file inventory — missing versions 5302027, 5302039, 5302040, 5302044–5302049, 5302084
- What is happening: The sequence jumps (5302026→5302028, 5302038→5302041, 5302043→5302050, 5302083→5302085) with no in-repo explanation.
- Why it matters: Version gaps are normal after deleted/renumbered migrations, but without documentation operators may wonder if a migration was lost; `supabase db push` tracks by version so gaps are harmless.
- User / business impact: None.
- Security / privacy / reliability impact: None.
- Recommended fix: Add a note in a migrations README listing the retired versions.
- Suggested validation: N/A (cosmetic).
- Owner suggestion: Platform lead.
- Effort estimate: < 1 hour.
- Status: Open (informational).

### Finding ID: DATA-P3-002 - audit_logs org-delete cascade destroys compliance history

- Severity: P3
- Confidence: High
- Area: Audit/Compliance
- Evidence: `supabase/migrations/5302108_fix_audit_logs_cascade.sql` — `audit_logs.organization_id` FK now `on delete cascade`
- What is happening: Deleting an organization deletes its complete audit trail.
- Why it matters: Audit logs are the compliance record; org deletion (e.g., offboarding) should preserve evidence.
- User / business impact: Lost evidence during tenant teardown.
- Security / privacy / reliability impact: Compliance risk (no audit of the deletion itself).
- Recommended fix: Keep FK but change to `on delete set null` (org_id nullable already) or archive to a cold store before org delete; log the deletion event first.
- Suggested validation: Delete org in test → audit rows retained with null org or archived.
- Owner suggestion: Platform lead.
- Effort estimate: Half day.
- Dependencies: Org deletion flow.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Anonymous PII exfiltration of contact-form leads | P0 | High (bots + anon key) | Privacy breach, lead loss | 5302038 RLS off + 5302116 anon grants | Re-enable RLS; anon INSERT-only; revoke anon DML |
| RLS-bypassing write primitives callable by authenticated users | P1 | Medium | Cross-org integrity corruption | 5302111 bulk RPC, 5302122 mark_task_read, 5302098 increment_article_count | Column allowlists, caller identity checks, org validation |
| Permission catalog drift (dead policy branches) | P2 | Certain (already true) | Authorization surprises on direct-client adoption | bootstrap policies vs 5302118 catalog | Catalog lint + policy rewrite |
| Dead soft-delete semantics | P1 | Certain | False recoverability; compliance gap | 5302109 vs routes hard-delete | Implement or remove |
| Seed/demo drift with prod data | P2 | Medium | Wrong demo accounts in prod | prod-domain guard in 5302119-28 | Test the guard; add data checks |

## Recommendations

### Immediate / Release Blocking

1. **DATA-P0-001**: Re-enable RLS on `public_interactions`; replace 5302116's blanket anon grant with targeted grants; keep the anon INSERT policy path working (re-test contact form).
2. **DATA-P1-002**: Revoke PUBLIC/anon EXECUTE on `increment_article_count`; add search_path + org check.

### This Week

3. **DATA-P1-001**: Column allowlist + immutability guards in `bulk_update_with_version`.
4. **DATA-P2-002**: Caller-identity and task/org validation in `mark_task_read`.
5. **DATA-P1-003**: Decide soft delete: implement tombstone semantics or remove columns.

### This Month

6. **DATA-P2-001**: Align RLS policy permission vocabulary with the 5302118 catalog (or add missing keys).
7. **DATA-P2-003**: Add `retention`/`training-modules` to the catalog and re-run 5302128 assignments.
8. **DATA-P2-004**: Add CRUD for `document_permissions`/`portal_module_settings`/store sales-ops tables or document as RLS-only/backlog.

### Later / Platform Evolution

9. **DATA-P3-001/002**: Migration version-gap notes; audit preservation on org delete.
10. Generate DB types from the live schema (or add a drift test) to replace hand-written SDK types.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| `revoke all on function increment_article_count(uuid,text) from public, anon;` | Closes anon-accessible definer write | New migration | anon RPC → denied |
| Add `retention`/`training-modules` rows to 5302118 | Restores intended 5302128 grants | `5302118` (new migration) | role_permissions counts |
| Lint script: policy permission keys exist in catalog | Prevents DATA-P2-001 class | CI job / script | CI green |
| Lint script: every migration `create table` name appears in a route or allowlist | Prevents dead tables | CI job | CI green |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| public_interactions RLS re-enable | P0 | Backend lead | < 1 d | None |
| bulk_update_with_version column allowlist | P1 | Backend lead | 0.5–1 d | None |
| increment_article_count guard | P1 | Backend lead | 0.5 d | None |
| Soft-delete implementation or removal | P1 | Platform lead | 1–2 d | Product decision |
| mark_task_read caller checks | P2 | Backend lead | 0.5 d | None |
| Policy↔catalog vocabulary alignment | P2 | Platform lead | 1–2 d | Catalog decision |
| Missing catalog modules (retention, training-modules) | P2 | Platform lead | 0.5 d | None |
| Dead-table API gap closure | P2 | Platform lead | 2–3 d | Product decision |
| Audit preservation on org delete | P3 | Platform lead | 0.5 d | None |
| Generated DB types / drift test | P3 | Platform lead | 1 d | None |

## Suggested Tests

- RLS matrix test (E2E or scripted psql): anon/authenticated/approved-member/service_role × SELECT/INSERT/UPDATE/DELETE on `public_interactions` (the P0 proof).
- RPC abuse tests: `bulk_update_with_version` with `organization_id` in data; `mark_task_read` with another user's id; `increment_article_count` as anon — all must fail.
- Permission catalog lint in CI: keys referenced in 5302128 exist; keys referenced in RLS policies exist.
- Table-usage lint in CI: every `create table` (minus dropped) appears in a route or allowlist.
- Role-catalog assertions after `db reset`: 13 roles; per-role `role_permissions` counts > 0; `me/permissions` returns engineer/dispatcher keys (already covered by `me-permissions.test.ts`).
- Soft-delete decision test: tombstone semantics (delete → retained + excluded from lists) or removal.

## Suggested Documentation Updates

- `docs/MIGRATIONS.md` (new): version table, gap rationale, migration conventions, demo-data guard contract.
- `docs/ENVIRONMENT_VARIABLES.md`: no changes needed.
- `docs/API_ENDPOINT_INVENTORY.md`: add `document_permissions`/settings/store-ops endpoints or mark as RLS-only.
- `docs/PERMISSION_MATRIX.md` (new or extend): 13-role × module catalog matrix incl. new role assignments and the `retention`/`training-modules` gap.
- `docs/ROLLBACK_PROCEDURES.md`: note that migrations are forward-only; soft-delete stance.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Why were migration versions 5302027/5302039/5302040/5302044-49/5302084 retired? | Confirm no lost schema change | Git history of `supabase/migrations/` |
| Is `public_interactions` consumed by any non-API path (marketing site direct PostgREST)? | Determines blast radius of the P0 | Cloudflare/Supabase logs |
| Are the new MSP roles intended to ever reach the admin web UI? | Web `requireAdminAccess` gates admin/super_admin only, while API grants org-agnostic access | Product decision |
| Should `document_permissions` be administrable from UI, or is RLS-only visibility the intended design? | Drives DATA-P2-004 scope | Product decision |
| Was the original contact-form 500 (which led to RLS disable in 5302038) ever root-caused? | Correct fix is INSERT policy, not RLS-off | Old issue/commit history |

## Appendix

### Migration version sequence (gaps marked)

```
5302026, 5302028, 5302029, 5302030, 5302031, 5302032, 5302033, 5302034,
5302035, 5302036, 5302037, 5302038, 5302041, 5302042, 5302043, 5302050,
5302051, 5302052, 5302053, 5302054, 5302055, 5302056, 5302057, 5302058,
5302059, 5302060, 5302061, 5302062, 5302063, 5302064, 5302065, 5302066,
5302067, 5302068, 5302069, 5302070, 5302071, 5302072, 5302073, 5302074,
5302075, 5302076, 5302077, 5302078, 5302079, 5302080, 5302081, 5302082,
5302083, 5302085, 5302086, 5302087, 5302088, 5302089, 5302090, 5302091,
5302092, 5302093, 5302094, 5302095, 5302096, 5302097, 5302098, 5302099,
5302100 … 5302128 (contiguous)
Missing: 5302027, 5302039, 5302040, 5302044, 5302045, 5302046, 5302047,
5302048, 5302049, 5302084
```

### Tables never referenced by app code (quoted-string grep of routes/services/middleware/worker)

`document_permissions`, `ai_draft_outputs`, `portal_module_settings`, `store_leads`, `store_proposal_drafts`, `store_quote_requests`, `store_visual_assets` (all other ~120 tables are referenced; `webhook_dead_letters` is worker-only, which is by design).

### 5302128 role-permission reference check

- `retention` → catalog missing (no rows assigned to security-analyst)
- `training-modules` → catalog missing (no rows assigned to onboarding-specialist)
- All other referenced module keys exist in 5302118 (verified: domain-monitors, status-pages, uptime-monitor, backup-dr, field-services, camera-calculator, network-port-maps, hardware-staging, time-entries, vendor-contracts/contacts, service-catalog, sla, change-requests, risk-register, incidents, incident-response, break-glass, id-verify, identity-verification, patch-compliance, endpoint-security, m365-hardening, runbooks, sop-library, automation, client-knowledge-base, compliance-readiness, phishing-simulations, dmarc-coach, dmarc, scoreboard, tabletop, governance, insurance-binder, onboarding, offboarding, client-onboarding-command-center, dynamic-forms, satisfaction-pulse, proposals, qbr, budgets, procurement, vendors, approvals, licenses, license-optimizer, saas-audit, audit, billing, store, search, timeline, profile, dashboard, notifications, tickets, documents, projects, assets, findings, file-requests, training-hub, security-suite, security-ops)
