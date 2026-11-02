# 07_data_schema_migration_runtime_validation — Prompt 07 - Data, Schema, Migration, and Runtime Validation Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `07_data_schema_migration_runtime_validation.md` (area DATA, prompt)

## Verification Performed

Read-only re-verification at `7dd0402` (worktree of `origin/main`); no database access. 16 of 20 previous DATA rows are verified fixed with executed guards, 4 remain partially fixed, 0 regressed, 1 new P3. Executed evidence: `node scripts/verify-rls.mjs` (140/140 tables RLS, 1031 policies, 0 failures), `node scripts/check-rls-predicate.mjs` (PASS, 30 migrations newer than 5302430), `sh scripts/ci/check-migration-transactions.sh` (PASS, 158 files), `node scripts/generate-db-types.js --check` (up to date, digest-bound), `node scripts/check-docs-counts.mjs` (OK). Key code: `apps/worker/src/tasks/{retention,orphan-cleanup}.ts` + `lib/{purge,retention-policy}.ts`; migrations 5302432/5302434/5302442/5302443/5302451/5302457. Residuals: notifications INSERT policy still lacks `status='approved'` (5302057:41-55); `store_quote_requests`/`store_leads`/`impersonation_log` still have no purge (docs/PRIVACY.md:56); prod backup capable but unexercised (drill ledger: no drill executed); migration version gaps undocumented. New: DATA-P3-007 (free-text governance status vs new CHECK → 500).

## Findings

| ID | Severity | Title |
|---|---|---|
| DATA-P0-001 | P0 | Orphan cleanup can recursively delete a bucket's contents |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete |
| DATA-P2-001 | P2 | Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it |
| DATA-P2-002 | P2 | Destructive table-replacement migrations are not transaction-wrapped |
| DATA-P2-003 | P2 | `orphan-cleanup` deletes storage objects based on a truncated listing |
| DATA-P2-004 | P2 | Migration CI dry-run diff is non-blocking; drift is never gated |
| DATA-P2-005 | P2 | `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive |
| DATA-P2-006 | P2 | Several stores lack a retention policy and owner |
| DATA-P2-007 | P2 | Generated DB types / schema can drift from migration intent |
| DATA-P2-008 | P2 | Orphan cleanup reference query is unbounded in the object list |
| DATA-P2-009 | P2 | `updated_at` is frozen on 69 module tables (no trigger; generic PATCH drops it) |
| DATA-P2-010 | P2 | Scheduled database dump and restore test target the dev environment only; production long-term backup is unproven |
| DATA-P3-001 | P3 | Pre-baseline policies created without a preceding `drop policy if exists` |
| DATA-P3-002 | P3 | Migration version gaps undocumented; brief states 141 migrations, tree has 127 |
| DATA-P3-003 | P3 | Retention purge boundary behaviour is untested; the mock ignores the age cutoff and the PII purge has no tests |
| DATA-P3-004 | P3 | Status-like text columns are not constrained by CHECK/enum, so app vocabulary is not enforced by the DB |
| DATA-P3-005 | P3 | No down-migrations and destructive migrations lack rollback notes despite the repo's own naming guide |
| DATA-P3-006 | P3 | Generated DB types carry no commit/version binding |
| DATA-P3-007 | P3 | Governance CRUD accepts free-text statuses that the new CHECK constraints reject with a 500 |
