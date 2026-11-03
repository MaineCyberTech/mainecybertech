# Data, Schema, Migration, and Runtime Validation — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: DATA
- Scope limitations: read-only static verification in a worktree; no hosted-Supabase or production database access. Dependency-free repo scripts were executed with Node 18; jest/pnpm suites were not run (no `node_modules`). The duplicate-migration behaviour was reproduced against a throwaway `postgres:16-alpine` container in `/tmp`.

## Scope

Re-verified all 21 previous DATA findings at `6b7aa1a`, then scanned the migrations, retention workers, generated types, validation guards and backup/rollback controls for new defects. The prompt-37 RLS runtime behaviour is covered separately; this report only uses RLS evidence where it is part of a DATA control.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `sh scripts/ci/check-migration-transactions.sh` | Executed | PASS — 162 migration files checked; negative fixture flagged |
| `node scripts/verify-rls.mjs` | Executed | PASS — 140/140 tables RLS-enabled, 1035 policies, 0 failures, 0 warnings |
| `node scripts/check-rls-predicate.mjs` | Executed | PASS — no raw status-unfiltered membership predicate in 34 migrations newer than 5302430 |
| `node scripts/generate-db-types.js --check` | Executed | `database types up to date` (162 migrations, digest-bound) |
| `node scripts/check-docs-counts.mjs` | Executed | `docs counts OK` |
| `node scripts/check-permission-catalog.mjs` | Executed | PASS — 206 `requirePermission` + 46 live-policy references vs 338 catalog keys |
| `bash scripts/preflight-check.sh` | Executed | FAILS after the first check; duplicate-version assertion at `:50-51` never runs (DATA-P2-011) |
| Supabase CLI 2.107.0 `db push --include-all` against throwaway Postgres 16 | Executed | Reproduced the 5302463 collision (DATA-P1-004) |
| `supabase/migrations/5302460`, `5302461`, `5302462`, the two `5302463` files | Read | Current migration state |
| `apps/worker/src/tasks/{retention,orphan-cleanup}.ts`, `lib/{purge,retention-policy}.ts` | Read | Batching, archive-before-delete, registry windows, deadline aborts |
| `docs/migrations/README.md`, `docs/PRIVACY.md`, `docs/runbooks/backup-restore-drill-ledger.md` | Read | Policy and residual evidence |

## Executive Summary

The DATA domain remains close to the previous state: 18 of 21 prior findings are verified fixed with executed guards, two are honest documented residuals (`store_leads`/`impersonation_log`/`task_dead_letters` have no purge; production backup is capable but unexercised), and one finding **regressed**: the new `5302460_drop_portal_module_settings.sql` drops a table without the `-- Rollback:` header that `docs/migrations/README.md` requires.

Two new issues are material. First, **two migrations share version 5302463**. I reproduced the failure with the pinned Supabase CLI: `db push --include-all` applies `5302463_client_portal_ai_and_visibility.sql`, then aborts on `5302463_fix_notification_key_dedup_index.sql` with `schema_migrations_pkey` 23505; only the first is recorded, so the notification `ON CONFLICT` fix (42P10) never lands. Second, the repository's only duplicate-version guard lives in `scripts/preflight-check.sh`, which exits on its first `((PASS++))` and is not referenced by any workflow — so no gate can catch the collision.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| DATA-P0-001 | P0 | verified-fixed | Orphan cleanup can recursively delete a bucket's contents | Folder detection/recursion/folder-like guard `orphan-cleanup.ts:59-76,108-147,262-266` |
| DATA-P1-001 | P1 | verified-fixed | Approved-membership predicate reintroduced six times | `5302461:29-37` uses `user_has_role` (approved-only, `5302026:684-700`); predicate guard PASS |
| DATA-P1-002 | P1 | verified-fixed | `retention` unbounded deletes / false success | `retention.ts:189-230,308-321`; `lib/purge.ts:65-100`; boundary tests |
| DATA-P1-003 | P1 | verified-fixed | Soft-delete columns dead schema | `5302432:23-31`; no remaining references |
| DATA-P1-004 | P1 | open (new) | Duplicate migration version 5302463 | Reproduced: `db push` 23505, dedup-index fix never recorded |
| DATA-P2-001 | P2 | verified-fixed | Blanket `anon` DML grant | `5302434`; no later re-grant beyond the allowlist |
| DATA-P2-002 | P2 | verified-fixed | Destructive migrations not transaction-wrapped | Guard PASS (162 files) |
| DATA-P2-003 | P2 | verified-fixed | Orphan cleanup truncated listing | `orphan-cleanup.ts:10-24,108-147`; 10k fail-closed ceiling |
| DATA-P2-004 | P2 | verified-fixed | Migration CI drift non-blocking | Post-push `db diff` fails on DDL (`supabase-migrations.yml:96-133`) |
| DATA-P2-005 | P2 | verified-fixed | `audit_logs` cascade/purge destroys history | `5302442` archive + `5302451` BEFORE DELETE guard |
| DATA-P2-006 | P2 | partially-fixed | Several stores lack retention/owner | `store_quotes`/`store_quote_requests` fixed; residual `store_leads`, `impersonation_log`, `task_dead_letters` |
| DATA-P2-007 | P2 | verified-fixed | Generated DB types can drift | `--check` executed clean; digest in `database.types.ts:3` |
| DATA-P2-008 | P2 | verified-fixed | Orphan cleanup reference query unbounded | 200-key chunking `orphan-cleanup.ts:33,204-209` |
| DATA-P2-009 | P2 | verified-fixed | `updated_at` frozen on 69 tables | `5302443` trigger loop; PATCH sets it server-side |
| DATA-P2-010 | P2 | partially-fixed | Prod long-term backup unproven | Prod target exists; drill ledger still “no drill executed” |
| DATA-P2-011 | P2 | open (new) | Preflight aborts before duplicate gate | `preflight-check.sh:2,16,50-51`; unreferenced by CI |
| DATA-P3-001 | P3 | verified-fixed | Pre-baseline policies without drop guard | verify-rls 0 failures/0 warnings |
| DATA-P3-002 | P3 | verified-fixed | Migration version gaps undocumented | Gaps table in `docs/migrations/README.md:22-37` |
| DATA-P3-003 | P3 | verified-fixed | Retention boundary untested | `retention.test.ts:339-362`; public-interaction test |
| DATA-P3-004 | P3 | verified-fixed | Status columns unconstrained | `5302457` (20) + `5302462` (SOP); validator parity |
| DATA-P3-005 | P3 | **regressed** | Destructive migrations lack rollback notes | New `5302460:17` drops a table with no `-- Rollback:` |
| DATA-P3-006 | P3 | verified-fixed | Generated types unbound | Digest header + `--check` |
| DATA-P3-007 | P3 | verified-fixed | Governance free-text status vs CHECK | `validators/governance.ts:77-102` enum; `5302462` |

Counts: 18 verified-fixed, 2 partially-fixed, 1 regressed, 2 new/open.

## New and regressed finding detail

### DATA-P1-004 — Duplicate migration version 5302463 blocks the push and skips the notification dedup-index fix

- Evidence: `supabase/migrations/5302463_client_portal_ai_and_visibility.sql`; `supabase/migrations/5302463_fix_notification_key_dedup_index.sql`.
- Reproduction (read-only, throwaway Postgres 16): `supabase db push --db-url postgres://… --include-all` listed both files, applied `5302463_client_portal_ai_and_visibility.sql`, then failed applying `5302463_fix_notification_key_dedup_index.sql` with `ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"`, `Key (version)=(5302463) already exists` (SQLSTATE 23505), and exited 1. `schema_migrations` contained only `5302463 | client_portal_ai_and_visibility`; the second file’s table was rolled back.
- Why it matters: the dedup-index fix is the 42P10 repair for every `ON CONFLICT (notification_key)` insert (`apps/api/src/lib/notify.ts:105-120`, `apps/worker/src/notification-store.ts:166-172`). On this ordering it will never be recorded, so the in-app notification failure persists; on a rerun the version is considered applied and the file is skipped. The same collision also means the deploy job fails the first time.
- Fix: rename the second file to the next unused version (e.g. `5302464_fix_notification_key_dedup_index.sql`), regenerate DB types/docs counts, and add a CI check that parses the numeric prefix and fails duplicates before `db push`.
- Validation: the reproduction above plus `supabase db push --include-all --dry-run` on a staging project; `schema_migrations` must contain distinct versions for both files and `idx_notifications_key` must be non-partial/unique.
- Cross-reference: INV-P1-001 records the same repository-inventory defect.

### DATA-P2-011 — The only duplicate-version gate is unreachable

- Evidence: `scripts/preflight-check.sh:2` (`set -euo pipefail`), `:16` (`((PASS++))`), `:50-51` (`cut -d_ -f1 | sort | uniq -d`). Running `bash scripts/preflight-check.sh` prints the first Dockerfile check and exits 1; `bash -x` shows termination at `(( PASS++ ))` because `PASS=0` makes the arithmetic expression return a non-zero status. No workflow references the script.
- Secondary bug: `:34-37` builds `API_DISTRO`/`WORKER_DISTRO` with `grep -c` plus `echo pass`, yielding `1\npass`, so those checks would fail even if reached.
- Impact: the repository has no executable gate for duplicate migration versions; that is how DATA-P1-004 reached `main`.
- Fix: use `PASS=$((PASS+1))` (and the same for FAIL/SKIP), fix the Dockerfile predicates, and wire the script (or a dedicated `scripts/ci/check-migration-versions.sh`) into the required `unit-tests` action.
- Validation: introduce a fixture with two same-version migrations and assert exit 1; run against the real tree and assert exit 0 after renaming 5302463.

### DATA-P3-005 — Regressed rollback-note policy

- Evidence: `supabase/migrations/5302460_drop_portal_module_settings.sql:17` drops `public.portal_module_settings` with `cascade` and has no `-- Rollback:` header (`grep -c 'Rollback:'` returns 0). `docs/migrations/README.md:53-62` requires the header for every destructive migration and lists only the six older files in its table.
- Impact: recovery instructions for a dropped table are missing; the policy and the file inventory disagree.
- Fix: add a `-- Rollback:` header describing the original table shape/policies (from 5302058/5302112/5302129) and the fact that rows were demo/seed-only, then add the file to the docs table.

## Recommendations

1. **Fix the duplicate version (DATA-P1-004)** — rename the dedup-index migration, verify both versions in a staging `schema_migrations`, and confirm `idx_notifications_key` is the non-partial unique index.
2. **Repair and wire preflight (DATA-P2-011)** — fix the counter arithmetic and Dockerfile predicates; add a required CI step so duplicate/renamed versions fail before `db push`.
3. **Close DATA-P3-005** — add the rollback header to `5302460` and update the destructive-migration table.
4. **Retention owners (DATA-P2-006)** — add purges or dated owner waivers for `store_leads`, `impersonation_log` and `task_dead_letters`; add the DLQ payload retention to `docs/PRIVACY.md`.
5. **Exercise production backup (DATA-P2-010)** — provision `prod-backup`, run one green `db-backup`/`db-restore-test`, and link the run URL in the drill ledger.

## Suggested tests

- Migration versions: a CI fixture with two same-prefix files must fail; the real tree must pass after the rename.
- Notification dedup: insert a duplicate `notification_key` through the API and worker paths on a fresh DB; assert no 42P10 and one row.
- Rollback policy: a static test that every migration containing `drop table` / `drop column` / `revoke` has a `-- Rollback:` header.
- Retention: assert every store in `retention_policies` has a worker target or an explicit waiver, and that `task_dead_letters` is either purged or documented as permanent.
- Preflight: run the script in CI and assert exit 0 on `main`.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which 5302463 file is already recorded in each deployed environment? | Determines whether the dedup fix can be renamed or needs a repair + new migration | `select version, name from supabase_migrations.schema_migrations where version='5302463'` |
| Is `task_dead_letters` intentionally permanent? | Its payload can contain recipient email addresses | Owner decision / retention policy row |
| When will `prod-backup` secrets be provisioned? | DR RPO/RTO claims are unproven | Environment secrets + a green run URL |
