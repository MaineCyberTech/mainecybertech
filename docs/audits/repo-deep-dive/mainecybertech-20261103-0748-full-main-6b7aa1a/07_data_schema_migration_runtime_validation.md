# 07_data_schema_migration_runtime_validation — Prompt 07 - Data, Schema, Migration, and Runtime Validation Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `07_data_schema_migration_runtime_validation.md` (area DATA, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5 (worktree of origin/main); no hosted database access. 18 of 21 previous DATA rows verified fixed, 2 partially fixed, 1 regressed (P3-005: new 5302460 drop has no rollback note), and 2 new open findings: P1-004 duplicate migration version 5302463 (reproduced with Supabase CLI 2.107.0: push applies the first file, then fails with schema_migrations_pkey 23505 and never records the notification dedup-index fix) and P2-011 the preflight script aborts on its first check so the duplicate gate never runs. Executed evidence: sh scripts/ci/check-migration-transactions.sh (PASS, 162 files), node scripts/verify-rls.mjs (140/140 tables, 1035 policies, 0 failures/0 warnings), node scripts/check-rls-predicate.mjs (PASS, 34 migrations), node scripts/generate-db-types.js --check (up to date), node scripts/check-docs-counts.mjs (OK), node scripts/check-permission-catalog.mjs (PASS). Key migrations: 5302432/5302434/5302442/5302443/5302451/5302457/5302461/5302462. Residuals: store_leads + impersonation_log + task_dead_letters have no purge (docs/PRIVACY.md:56); prod backup capable but unexercised (drill ledger); 5302460 rollback-note gap.

## Findings

| ID | Severity | Title |
|---|---|---|
| DATA-P0-001 | P0 | Orphan cleanup can recursively delete a bucket's contents |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete |
| DATA-P1-004 | P1 | Two migrations share numeric version 5302463, so `supabase db push` fails and the notification dedup-index fix is never recorded |
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
| DATA-P2-011 | P2 | Preflight script aborts on its first check, so the duplicate-migration gate never runs and is not wired to CI |
| DATA-P3-001 | P3 | Pre-baseline policies created without a preceding `drop policy if exists` |
| DATA-P3-002 | P3 | Migration version gaps undocumented; brief states 141 migrations, tree has 127 |
| DATA-P3-003 | P3 | Retention purge boundary behaviour is untested; the mock ignores the age cutoff and the PII purge has no tests |
| DATA-P3-004 | P3 | Status-like text columns are not constrained by CHECK/enum, so app vocabulary is not enforced by the DB |
| DATA-P3-005 | P3 | No down-migrations and destructive migrations lack rollback notes despite the repo's own naming guide |
| DATA-P3-006 | P3 | Generated DB types carry no commit/version binding |
| DATA-P3-007 | P3 | Governance CRUD accepts free-text statuses that the new CHECK constraints reject with a 500 |
