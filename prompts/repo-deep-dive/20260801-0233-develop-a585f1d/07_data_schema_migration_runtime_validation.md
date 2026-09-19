# 07 — Data / Schema / Migration / Runtime Validation Audit

## Audit Metadata

| Field | Value |
| --- | --- |
| Audit ID | `07` |
| Target | `C:\temp\mainecybertech-portal` (MCT Client Portal monorepo) |
| Branch / SHA | `develop` @ `a585f1d` |
| Audit date | 2026-08-01 |
| Scope file | `prompts/repo-deep-dive/prompts/07_data_schema_migration_runtime_validation.md` |
| Rules file | `prompts/repo-deep-dive/prompts/00_SHARED_AUDIT_RULES.md` |
| Finding ID prefix | `DATA-*` |
| Audit mode | Read-only / static evidence review (no code modified) |

## Scope

- Supabase migrations directory (`supabase/migrations/`, 70 files, `5302026`–`5302109`), seeds (`supabase/seeds/`), `supabase/config.toml`.
- API data-access layer: `apps/api/src/routes/**/*.ts`, `apps/api/src/services/**/*.ts`, `apps/api/src/lib/**/*.ts`.
- Worker tasks that write to DB: `apps/worker/src/tasks/**/*.ts`.
- Optimistic locking middleware (`apps/api/src/middleware/optimistic-locking.ts`) and RPCs (`bulk_update_with_version`, `get_analytics_summary`, `increment_article_count`, `approve_project_task`, `add_project_task_comment`).
- Runtime validation: schema-to-code alignment, dead tables, migration numbering, version columns, FK indexes, check constraints, soft-delete, transactional integrity, document/seed references.

Out of scope: RLS policy deep-dive (separate report `37`), backup/restore (report `32`), security/authz (report `06`).

## Evidence Reviewed

- All 70 migration files in `supabase/migrations/` (full inventory at `C:\Users\Admin\AppData\Local\Temp\opencode\mct_sql_inventory.txt`).
- API table usage maps: `api_usage.txt`, `config_tables.txt`, `config_objs.txt`, `service_usage.txt`, `patch_patterns.txt` (temp evidence files).
- `apps/api/src/routes/documents.ts` (349–404 optimistic locking), `tickets.ts` (197–232, 455 bulk RPC), `projects.ts` (209–211 sub-resources, 403/560 version bump, 934/961 RPCs), `proposals.ts` (290/587/645), `assets.ts:268`, `organizations.ts:212`, `profiles.ts:130`, `domain-monitors.ts:239`, `approvals.ts:260`, `webhook-management.ts:146`, `findings.ts`, `analytics.ts:81`, `edu-automation.ts:239`, `store.ts`.
- `apps/api/src/middleware/optimistic-locking.ts` + `apps/api/src/__tests__/optimistic-locking.test.ts`.
- `apps/worker/src/tasks/webhook-retry.ts` (117, 149), `module-tasks.ts`, `apps/api/src/services/dynamic-client-forms-builder.ts`, `satisfaction-pulse-widget.ts`, `client-onboarding-command-center.ts`.
- `supabase/seeds/` (5 seed files + correction notes), `supabase/config.toml`.
- Git history (e.g., `2e0ea86` revert of soft-delete handlers; `15bbbcf` "migration not applied to prod DB yet").

## Executive Summary

**Score: 3.4 / 5**

The schema layer is functional and unusually well-maintained for a monorepo of this size: optimistic locking is correctly wired end-to-end (middleware + atomic `.eq("version", …)` predicates + transaction-wrapped RPCs), 279 FK constraints and 266 indexes exist, and the migration history is monotonic. However, the audit found **one critical runtime-breaking chain**, **five high-severity data-integrity gaps**, and a consistent theme of **migrations that land in the repo but are never consumed by application code**.

The most serious issue is `DATA-001`: `5302055_cleanup_dead_tables.sql` executes `DROP TABLE public.document_permissions CASCADE`, and the bootstrap defines `public.can_read_document()` (SECURITY DEFINER) **and** the `documents_select_visibility_aligned` policy, both of which reference `document_permissions`. Because the drop is `CASCADE`, PostgreSQL would drop the dependent function and the RLS SELECT policy on `documents` at runtime. No later migration re-creates the table, the function, or the policy — meaning **after 5302055, authenticated reads of `documents` through PostgREST would be blocked by RLS with no viable SELECT policy**, and `can_read_document()` would error on the dropped-table reference. The API itself survives because it uses the service-role client (RLS bypass), which is why no test catches it — the failure only manifests for non-service-role access and for any future direct DB/PostgREST consumer. This is a schema-modeling error that must be fixed before this migration is applied to production.

Secondary themes:

1. **Orphan schema (`DATA-002`)**: 9 tables were dropped as "dead" (`appointments`, `chat_*`, `comments`, `contracts`, `contract_signers`, `document_permissions`, `onboarding_submissions`, `project_members`) — and one of them, `document_permissions`, was **not** dead; it backs the document visibility model. The cleanup migration dropped it anyway.
2. **Unconsumed migrations (`DATA-003`)**: `5302109_soft_delete.sql` adds `deleted_at`/`deleted_by` columns + indexes to tickets/projects/documents, but **zero** API/worker code references these columns. Git history (`15bbbcf`, `2e0ea86`) confirms handlers were reverted because "deleted_at col doesn't exist in prod". The migration is dead weight that will silently break if a future developer trusts it.
3. **Schema re-definition churn (`DATA-004`)**: three tables are created in one migration and re-created with different shapes in a later one (`sop_library` 5302073 vs 5302086; `insurance_evidence` 5302073 vs 5302091; `satisfaction_pulses` 5302074 vs 5302079). Mitigated by `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` so it applies, but the pattern is fragile and is a strong signal that module-scoped migration ownership is leaking.
4. **RPC exposure (`DATA-005`)**: `bulk_update_with_version(text, jsonb)` executes **dynamic SQL against any public table that has a `version` column** and is granted EXECUTE to PUBLIC by default (no `REVOKE`). It is exposed via PostgREST to `anon`/`authenticated` and takes an arbitrary table name — a broad write-surface / injection-adjacent risk that is mitigated only by RLS (which in several module tables is still permissive — see report 37) and by the fact the API calls it with the service role.
5. **Missing check constraints (`DATA-006`)**: only 9 column CHECK constraints exist across ~180 tables (6 added in `5302103`, plus store/sla inline); bounded numeric columns (`score`, `rating`, `pct`, `minutes`, `version`, amounts) are unconstrained at the schema level, so the API's Zod schemas are the only guard, and worker/bulk/RPC writes bypass them.

Positive confirmations: optimistic locking is atomic (`UPDATE … SET version = v+1 WHERE id = ? AND version = ?` in all 11 PATCH handlers; RPC does version-check + update inside one plpgsql function); `markAllRead` org filter is conditional (`DATA-009` fixed); audit_logs FK cascade was fixed (`5302108`); notification dedup key + unique index added (`5302107`); seeds are wired via `config.toml` `[db.seed]` and are schema-aligned.

## Findings

### DATA-001 — `CASCADE` drop of `document_permissions` breaks `documents` RLS SELECT policy and `can_read_document()`

- **Severity: P0 (Critical)**
- **Location**: `supabase/migrations/5302055_cleanup_dead_tables.sql:10`; `supabase/migrations/5302026_…corrected.v3.sql` (bootstrap: `document_permissions` table, `can_read_document` fn, `documents_select_visibility_aligned` policy)
- **Impact**: Authenticated/anon reads of `documents` via PostgREST become impossible or error after 5302055 is applied. The API masks it (service role bypasses RLS), so all tests stay green. Any future non-service-role consumer or direct-DB tooling silently breaks; `private`-visibility documents lose their per-user gating.
- **Evidence**:
  - `5302055_cleanup_dead_tables.sql:10`: `drop table if exists public.document_permissions cascade;`
  - Bootstrap defines `document_permissions` table + `idx_document_permissions_document_id` index + policies (`5302026…:1` area), then `can_read_document()` (`SECURITY DEFINER`) references `from public.document_permissions dp` in its `private`-visibility branch.
  - Bootstrap policy: `create policy documents_select_visibility_aligned on public.documents for select to authenticated using (public.can_read_document(id));`
  - Grep for `create table.*document_permissions` across migrations **> 5302055**: no matches — never re-created. Grep for documents SELECT policy / `can_read_document` after 5302055: no matches.
- **Root cause**: "Dead table" cleanup was decided by code-grep for API usage only; the schema-layer dependency (SECURITY DEFINER function + RLS policy) was missed. `document_permissions` is **not** dead — it is the implementation of the documented "explicit permissions" document model (`docs/SUPABASE_MIGRATION_WORKFLOW.md` lines 349–354).
- **Recommendation**: In a **new** forward-fix migration (never edit 5302055 after it may have applied): re-create `document_permissions` with the original shape/indexes/RLS, re-create `can_read_document()` (or a slimmed version that treats `private` via the permissions join), and re-create `documents_select_visibility_aligned`. Add an integration test that executes a document SELECT under the `authenticated` role to prove the policy resolves.
- **Suggested test**: RLS policy resolution test — `SET ROLE authenticated; SELECT count(*) FROM documents;` after applying full migration chain, asserting no dropped-relation error.

### DATA-002 — Schema-migration dead tables listed as "no API/SDK/frontend usage" while backing documented features

- **Severity: P1 (High)**
- **Location**: `supabase/migrations/5302055_cleanup_dead_tables.sql:1-12`
- **Impact**: At minimum `document_permissions` (see DATA-001) is broken. Other dropped tables (`contracts`, `contract_signers`, `appointments`, `chat_threads`, `chat_messages`, `comments`, `onboarding_submissions`, `project_members`) have no API references today, so their drop is safe **today** — but the migration's own comment asserts an analysis that was incomplete.
- **Evidence**: Dropped-table grep across `apps/` (routes + services + worker) confirms no `.from("appointments")`, `.from("contracts")`, etc. references. However, `document_permissions` has 10+ references in the bootstrap (`from public.document_permissions dp` × 2 inside `can_read_document`, plus 2 policies), which the cleanup author did not account for.
- **Recommendation**: Before promoting `develop` migrations to a fresh environment, run a dependency check: `SELECT dependent.relname FROM pg_depend d JOIN pg_class dep ON d.refobjid=dep.oid JOIN pg_class dependent ON d.objid=dependent.oid WHERE dep.relname IN ('document_permissions', …)`; document the analysis in the migration file comment.
- **Suggested test**: Post-apply query verifying `to_regclass('public.document_permissions')` is non-null and that `pg_policies` still lists a SELECT policy for `documents`.

### DATA-003 — Unconsumed `soft_delete` migration (`5302109`): `deleted_at`/`deleted_by` never read by any code

- **Severity: P1 (High)**
- **Location**: `supabase/migrations/5302109_soft_delete.sql`; git `2e0ea86`, `15bbbcf`
- **Impact**: If applied to prod, the columns exist but nothing filters them; future code that assumes soft-delete filtering (`WHERE deleted_at IS NULL`) would silently return wrong results, or a developer might believe soft-delete is active when it isn't. It is currently **not applied** to the prod DB (per git history), so the repo and the live schema diverge.
- **Evidence**: `5302109` adds `deleted_at timestamptz`, `deleted_by uuid`, and partial indexes to `tickets`, `projects`, `documents`. Grep for `deleted_at|softDelete|soft.delete` across `apps/api/src` and `apps/worker/src`: **zero matches**. Git log: `2e0ea86 fix: revert soft-delete handlers (deleted_at col doesn't exist in prod)`; `15bbbcf fix: remove .is(deleted_at) from route handlers (migration not applied to prod DB yet)`.
- **Recommendation**: Either (a) delete `5302109` and the associated handler work to keep repo↔schema consistent, or (b) if soft-delete is wanted, complete the feature: add `deleted_at IS NULL` filters to all queries, add a scope, and deploy the migration. Do not leave half-implemented schema.
- **Suggested test**: Schema/usage regression check in CI — a script that flags DB columns with no corresponding application reference.

### DATA-004 — Re-definition of module tables across migrations (`sop_library`, `insurance_evidence`, `satisfaction_pulses`)

- **Severity: P2 (Medium)**
- **Location**: `5302073_edu_automation.sql` vs `5302086_sop_library_compliance.sql`; `5302073` vs `5302091_insurance_binder.sql`; `5302074_final_batch.sql` vs `5302079_satisfaction_pulse_widget.sql`
- **Impact**: Fragile schema evolution. The `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` pattern masks the fact that the "second" migration defines a **different** shape (`sop_library`: `category` in 5302073 vs `description`/`sop_category`/`compliance_framework` in 5302086; `insurance_evidence`: 5302091 adds `evidence_type`/`title` etc.; `satisfaction_pulses`: 5302079 adds `status`/`source_entity_type`/`respondent_*`). On a fresh `db reset` the second shape wins via add-columns; on an existing DB the add-columns apply. Works, but only by luck of column-name ordering.
- **Evidence**: Diff of the three table definitions (lines 1–19 of 5302086 vs table in 5302073; lines 20–29 of 5302091; lines 28–33 of 5302079). Policy names also differ between the two definitions, requiring explicit `drop policy if exists` of both name-sets in 5302100 (lines 578–587, 906–914).
- **Recommendation**: Consolidate each table's definition into the earliest migration and make later ones pure `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. Add a migration-rebase ticket; consider `supabase db diff` (already used in CI `supabase-migrations.yml:43`) to detect drift early.
- **Suggested test**: `supabase db reset` from scratch and assert the final column set matches the union of both migrations for these three tables.

### DATA-005 — `bulk_update_with_version(text, jsonb)` runs dynamic SQL on arbitrary versioned tables and is PUBLIC-executable

- **Severity: P1 (High)**
- **Location**: `supabase/migrations/5302054_bulk_update_with_results.sql` (full function); callers `apps/api/src/routes/documents.ts:478,527`, `apps/api/src/routes/tickets.ts:455`
- **Impact**: Any caller with EXECUTE (default PUBLIC in Postgres unless revoked; no `REVOKE` exists in migrations) can call the RPC through PostgREST with an arbitrary `table_name`. The function uses `format('%I', table_name)` (identifier quoting — not injectable) and checks the target has a `version` column, but it still exposes a generic write primitive over **any** versioned table, including tables whose per-row RLS is permissive. Per-item results (`{"success": false, "error": …}`) mean partial success is by design but the caller chooses the table.
- **Evidence**: No `revoke execute on function bulk_update_with_version … from public` anywhere; only 2 explicit grants exist in the entire migration set (for `approve_project_task`/`add_project_task_comment`, which are `SECURITY DEFINER` + `SET search_path = public` and RLS-checked). `bulk_update_with_version` is `LANGUAGE plpgsql` **without** `SECURITY DEFINER` — so it runs as invoker and RLS applies to the invoker's role, which is the only real mitigation.
- **Recommendation**: `REVOKE ALL ON FUNCTION public.bulk_update_with_version(text, jsonb) FROM PUBLIC;` then `GRANT EXECUTE … TO service_role;`. Also consider restricting to a whitelist of tables inside the function.
- **Suggested test**: As `authenticated`, attempt `select bulk_update_with_version('profiles', '…')` and assert it is denied (permission denied) after the revoke.

### DATA-006 — Sparse CHECK constraint coverage on bounded numeric / version columns

- **Severity: P2 (Medium)**
- **Location**: `5302103_add_check_constraints.sql` (6 constraints, each in `DO $$ … IF EXISTS` blocks); inline in `5302041` (`metric in (…)`), `5302104` (`status in (…)`), `5302105` (`status in (…)`)
- **Impact**: Data written via worker tasks, RPCs, seeds, or future bulk paths bypass the API's Zod validation entirely. Columns like `sla_logs.target_minutes`, `satisfaction_pulses.rating`, `score_history.score`, `patch_compliance.compliance_pct`, `endpoint_security.coverage_pct`, `vendor_contracts.contract_value` are unconstrained in most module tables created by 5302058–5302093 (they only got constraints if they are the 6 named tables). `version` columns have no `>= 1` check anywhere.
- **Evidence**: Full constraint inventory (grep `check (` across migrations, excluding RLS `with check`): only the 9 rows listed above. 279 FK + 266 indexes vs 9 CHECKs.
- **Recommendation**: Add CHECKs for the remaining bounded fields using the same idempotent `DO $$` pattern; add `CHECK (version >= 1)` to versioned tables; keep constraint definitions in dedicated `*_add_check_constraints` migrations.
- **Suggested test**: Insert `rating = 11` into `satisfaction_pulses` under service role and assert rejection.

### DATA-007 — Migration numbering gaps (`5302027`, `5302039`, `5302040`, `5302044–5302049`, `5302084`)

- **Severity: P3 (Low)**
- **Location**: `supabase/migrations/` directory listing
- **Impact**: Non-contiguous numbering is a maintainability smell (strongly suggests squashed/renumbered migrations). `supabase db push` only cares about ordering by filename, so it is not a runtime failure, but it makes `supabase migration list` and rollback auditing harder and invites accidental duplicate numbers from parallel work.
- **Evidence**: File listing shows no files for those numbers.
- **Recommendation**: Adopt a strict naming convention (e.g., `date-based` as recommended in `docs/migrations/naming-guide.md`) or document the gaps. Avoid renumbering history that may already be applied to environments.
- **Suggested test**: CI check that migration filenames are monotonically increasing with no duplicates.

### DATA-008 — `public_interactions` RLS toggled on/off/on across 4 migrations before being disabled

- **Severity: P2 (Medium)**
- **Location**: `5302033` (RLS on + anon INSERT), `5302036` (service_role INSERT), `5302037` (idempotent anon+service_role), `5302038` (DISABLE RLS)
- **Impact**: Churn indicates an unsettled decision; the net state is RLS **disabled** on a public-submission table. For an MSP contact form this is intentional (public data), but the flip-flopping obscures the current posture and could be re-enabled accidentally by future policy work. The webhook + JSM integration and audit logging are the actual spam guards.
- **Evidence**: `5302038: ALTER TABLE public.public_interactions DISABLE ROW LEVEL SECURITY;`
- **Recommendation**: Add a comment block to `5302038` explaining why RLS is disabled (public data, INSERT-only via service role, spam guarded by webhook rate-limit/CAPTCHA), and add a verification query in `verify_seed.sql`.
- **Suggested test**: Assert `relrowsecurity = false` for `public_interactions` post-apply.

### DATA-009 — Seeds reference tables/columns that no longer exist after cleanup

- **Severity: P2 (Medium)** (currently masked because prod seeds are applied against a schema where these tables still exist or are skipped)
- **Location**: `supabase/seeds/02_schema_aligned_seed.sql`, `04_test_seed.sql`, `03_local_portal_extra_demo_seed.sql`
- **Impact**: `supabase db reset` (used by local dev and CI E2E) applies seeds on top of the full migration chain. If any seed INSERTs target dropped tables (`appointments`, `contracts`, `chat_*`, `comments`, `onboarding_submissions`, `project_members`, `document_permissions`) or re-defined columns, reset fails or silently aligns to an older shape.
- **Evidence**: Seed files reference document version/visibility/permission alignment concepts; `verify_seed.sql` documents "document permission rows" as a verification target, but `document_permissions` is dropped by 5302055 — the verification checklist cannot pass for that item.
- **Recommendation**: Audit all 5 seeds against the final schema union; remove or rewrite permission-row seeding; update `verify_seed.sql` checklist.
- **Suggested test**: `supabase db reset` in CI (already in `e2e.yml`) asserting exit 0 on the full chain.

### DATA-010 — Transactional integrity is mostly single-statement; multi-step handlers (storage + DB) are not atomic

- **Severity: P2 (Medium)**
- **Location**: `apps/api/src/routes/documents.ts` create/upload flow (insert row → storage upload → version record), `apps/api/src/routes/tickets.ts` transitions, `apps/api/src/routes/webhooks.ts` insert + delivery log
- **Impact**: A failure between steps (e.g., DB row inserted but storage upload fails; delivery logged but payload insert fails) leaves orphaned rows / half-state. These are not wrapped in a single transaction or compensated.
- **Evidence**: `bulk_update_with_version` is the one properly transactional multi-row primitive; per-item success/failure is returned intentionally (documented as "partial success intentional"). The document upload flow performs separate `insert` then `storage.from(...).upload(...)` calls; there is no rollback of the row on storage failure.
- **Recommendation**: For create flows, invert the order (storage first, then row insert; delete storage object if insert fails) or add compensating cleanup in the catch block; for webhook deliveries, insert delivery log and payload within the same RPC or accept at-least-once with idempotency key (already added — see `5302053`).
- **Suggested test**: Simulate storage upload failure (mock `storage.upload` to reject) and assert the documents table has no orphan row.

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Applying `develop` migration set to prod breaks document reads at the DB layer (DATA-001) | Medium | Critical | Re-create table/function/policy in a forward-fix migration; gate behind prod approval + db diff |
| R2 | `bulk_update_with_version` abused via PostgREST if RLS stays permissive on module tables (DATA-005 + 37 RLS findings) | Medium | High | REVOKE from PUBLIC; tighten module RLS (report 37) |
| R3 | Soft-delete migration applied to prod without handler support → silent data misreads (DATA-003) | Medium | Medium | Remove or complete the feature; add CI schema↔code reference check |
| R4 | Seed drift breaks `db reset` for future devs / CI (DATA-009) | Medium | Medium | Seed audit against final schema; run reset in CI |
| R5 | Module-table re-definition churn causes a future `CREATE TABLE` (not `IF NOT EXISTS`) to fail mid-chain (DATA-004) | Low | High | Consolidate; enforce naming/ordering conventions |

## Recommendations

1. **(P0)** Create forward-fix migration restoring `document_permissions` + `can_read_document()` + `documents_select_visibility_aligned`; add an `authenticated`-role RLS resolution test.
2. **(P1)** `REVOKE ALL ON FUNCTION bulk_update_with_version(text, jsonb) FROM PUBLIC;` + grant to `service_role` only.
3. **(P1)** Decide soft-delete: remove `5302109` or complete the feature end-to-end; add CI check that every DB column/table is referenced by app code or explicitly whitelisted.
4. **(P2)** Consolidate the 3 re-defined tables into earliest migrations; add `version >= 1` CHECKs; expand bounded-field CHECK coverage.
5. **(P2)** Audit all 5 seed files against the final schema; fix permission-row seeds; update `verify_seed.sql`.
6. **(P2)** Add compensating cleanup to document upload (and similar multi-step) flows.
7. **(P3)** Fix migration numbering gaps / adopt date-based naming; document gaps if historical.

## Quick Wins

- REVOKE PUBLIC on `bulk_update_with_version` (one migration, high payoff).
- Add the 3 missing RLS objects for documents in a forward-fix migration (unblocks DATA-001).
- Add `version >= 1` CHECKs (one idempotent migration).
- Comment the RLS-disable rationale in `5302038`.

## Hardening Backlog

| # | Item | Effort |
| --- | --- | --- |
| 1 | Restore document permissions model (table + fn + policy) | Medium |
| 2 | Whitelist tables inside `bulk_update_with_version` | Small |
| 3 | Compensating cleanup for multi-step storage+DB flows | Medium |
| 4 | Schema↔code reference check in CI | Small |
| 5 | Seed verification against final schema | Small |
| 6 | Consolidate re-defined module tables | Medium |
| 7 | Expand CHECK constraint coverage | Medium |
| 8 | Adopt date-based migration naming | Small |

## Suggested Tests

- RLS resolution: `SET ROLE authenticated; SELECT count(*) FROM documents;` on full migration chain (DATA-001).
- PostgREST/RPC denial: authenticated `bulk_update_with_version` call after REVOKE (DATA-005).
- Constraint rejection: insert out-of-range `rating`/`score`/`target_minutes` under service role (DATA-006).
- Schema↔code drift: script flagging unreferenced columns (DATA-003).
- Orphan-cleanup: storage upload failure leaves no orphan document row (DATA-010).
- `db reset` from scratch (CI) exercising full seed set (DATA-009).

## Open Questions

- Has `5302055` (and everything after it) been applied to the **production** Supabase project? If the prod DB still has `document_permissions`, DATA-001 currently exists only in repo-new-environment form; the forward-fix must be idempotent for both states.
- Are `contracts`, `appointments`, `chat_*` intended to return (e.g., CRM/scheduling modules planned)? If so, 5302055 should be reverted/neutralized, not re-created piecemeal.
- What is the intended product posture for soft-delete (hard delete today)? Decision gates DATA-003.

## Evidence Index (temp files)

- `mct_sql_inventory.txt` — full migration table/RLS/policy/index inventory (2012 lines)
- `api_usage.txt` — per-route `.from()`/`.rpc()` calls
- `config_tables.txt`, `config_objs.txt` — config-driven table references (`edu-automation.ts`, `final.ts`)
- `service_usage.txt` — services-layer table usage
- `patch_patterns.txt` — `checkVersionMatch` context per handler
