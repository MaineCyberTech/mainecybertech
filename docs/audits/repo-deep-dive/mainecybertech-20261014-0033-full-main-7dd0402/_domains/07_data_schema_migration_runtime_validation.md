# Data, Schema, Migration, and Runtime Validation — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261011-0426-full-main-8d299b8`)
- Area code: DATA
- Scope limitations: read-only static verification in a worktree; no database or hosted-Supabase access. Dependency-free repo scripts were executed with the container's Node 18; jest/pnpm suites were not run (no `node_modules`).

## Scope

Re-verified all 20 previous DATA findings (`8d299b8`) against `7dd0402`, then scanned for new schema/migration/validation issues. Not reviewed live DB state, RLS runtime behaviour (prompt 37), or product retention modules owned by other prompts.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `node scripts/verify-rls.mjs` | Executed | PASS — 140 tables, 140 RLS-enabled, 1031 policies, 0 failures, 1 baseline warning (see RLS domain) |
| `node scripts/check-rls-predicate.mjs` | Executed | PASS — 30 migrations newer than baseline `5302430` clean |
| `sh scripts/ci/check-migration-transactions.sh` | Executed | PASS — 158 files checked; negative fixture flagged |
| `node scripts/generate-db-types.js --check` | Executed | `database types up to date` (digest-bound) |
| `node scripts/check-docs-counts.mjs` | Executed | `docs counts OK` |
| `apps/worker/src/tasks/{retention,orphan-cleanup}.ts` + `lib/purge.ts`, `lib/retention-policy.ts` | Read | Batching, archive-before-delete, registry-driven windows |
| `supabase/migrations/5302432/5302434/5302442/5302443/5302447/5302448/5302451/5302457/5302459` | Read | Current schema/RLS state |
| `docs/migrations/README.md`, `docs/PRIVACY.md`, `docs/runbooks/backup-restore-drill-ledger.md` | Read | Policy + residual evidence |

## Executive Summary

The DATA domain is in materially better shape than at the previous audit: 16 of 20 previous findings are verified fixed at this commit, with executed guard scripts as evidence (migration transactions, RLS predicate, types digest, docs counts). The four remaining partials are honest, documented residuals rather than silent gaps: the pre-baseline notifications INSERT policy still lacks an `approved` filter (shared with RLS), three PII stores still have no purge window, production backup is capable but unexercised, and migration version gaps remain undocumented. One new low-severity issue was found: governance CRUD schemas still accept free-text statuses that the new CHECK constraints reject with a 500.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| DATA-P0-001 | P0 | verified-fixed | Orphan cleanup can recursively delete a bucket's contents | Folder-entry/folder-like rejection + abort-on-unsafe-path in `orphan-cleanup.ts:52-67,227-235`; tests `:369-445` |
| DATA-P1-001 | P1 | partially-fixed | Approved-membership RLS predicate reintroduced six times | Guard PASS; residual `notifications_insert_system_or_admin` (`5302057:41-55`) has no `status='approved'` filter and is still live |
| DATA-P1-002 | P1 | verified-fixed | `retention` task unbounded deletes / false success | `retention.ts:35-57,59-89,149-164,224-239` + `lib/purge.ts` |
| DATA-P1-003 | P1 | verified-fixed | Soft-delete columns dead schema | `5302432` drops columns; no references remain |
| DATA-P2-001 | P2 | verified-fixed | Blanket `anon` DML grant + default privileges | `5302434` revokes blanket/default, re-grants allowlist |
| DATA-P2-002 | P2 | verified-fixed | Destructive migrations not transaction-wrapped | Guard wired (`action.yml:134`), executed PASS |
| DATA-P2-003 | P2 | verified-fixed | Orphan cleanup truncated listing | Paginated recursive listing + 10k cap (`orphan-cleanup.ts:10-17,97-127`) |
| DATA-P2-004 | P2 | verified-fixed | Migration CI dry-run non-blocking | Post-push drift check fails closed (`supabase-migrations.yml`) |
| DATA-P2-005 | P2 | verified-fixed | `audit_logs` cascade/purge destroys history | `5302442` archive + RPCs; `5302451` BEFORE DELETE trigger fails closed |
| DATA-P2-006 | P2 | partially-fixed | Several stores lack a retention policy/owner | Registry wired, but `docs/PRIVACY.md:56` still lists `store_quote_requests`, `store_leads`, `impersonation_log` as “No automated purge — gap” |
| DATA-P2-007 | P2 | verified-fixed | Generated DB types can drift | Digest-bound generator; `--check` executed clean |
| DATA-P2-008 | P2 | verified-fixed | Orphan cleanup reference query unbounded | 200-key chunking + test (`orphan-cleanup.test.ts:227-248`) |
| DATA-P2-009 | P2 | verified-fixed | `updated_at` frozen on 69 module tables | `5302443` trigger loop; PATCH sets it server-side |
| DATA-P2-010 | P2 | partially-fixed | Prod long-term backup unproven | `db-backup.yml` prod target behind `prod-approval`/`PROD_BACKUP_ENABLED`; drill ledger: “no drill executed yet”, secrets unprovisioned |
| DATA-P3-001 | P3 | verified-fixed | Pre-baseline policies without `drop policy if exists` | 1088 drop guards; verify-rls rule 3 PASS |
| DATA-P3-002 | P3 | partially-fixed | Migration version gaps undocumented | Counts guarded (158); gaps `5302027,5302039-40,5302044-49,5302084,5302136-5302401,5302429` still undocumented |
| DATA-P3-003 | P3 | verified-fixed | Retention purge boundary untested | Age-aware boundary tests (`retention.test.ts:288-315`; `public-interaction-retention.test.ts:180-210`) |
| DATA-P3-004 | P3 | verified-fixed | Status-like text columns unconstrained | `5302457` guarded CHECK NOT VALID for 20 columns (supersets of app vocabularies) |
| DATA-P3-005 | P3 | verified-fixed | No down-migrations / rollback notes | `-- Rollback:` headers on all six destructive migrations; policy doc `docs/migrations/README.md` |
| DATA-P3-006 | P3 | verified-fixed | Generated DB types unbound | Digest in `database.types.ts:3` + `--check` |
| DATA-P3-007 | P3 | open (new) | Governance CRUD free-text status vs CHECK constraints | `validators/governance.ts:78,90` allow any string; `5302457` CHECK now rejects invalid values as 500 `DB_ERROR` instead of 400 |

## New finding detail

### DATA-P3-007 — Governance CRUD accepts free-text statuses that the new CHECK constraints reject with a 500

- Evidence: `apps/api/src/validators/governance.ts:78,90` (`status: z.string()`), generic `crudRoute` POST/PATCH (`routes/governance.ts:40-110`), `supabase/migrations/5302457_status_check_constraints.sql` (`change_requests_status_check`).
- Impact: an invalid status is a DB-level failure surfaced as `DB_ERROR` 500 rather than a 400 validation error; no corruption, but the API contract is worse than the schema. Same class applies to any `crudRoute` table whose Zod schema is free text while the DB now constrains it.
- Fix: enum the status fields in the Zod schemas to the CHECK vocabularies (or add a shared catalog), and map `23514` check-violations to 400 in the error middleware.
- Validation: POST/PATCH `change-requests` with `status: "bogus"` → expect 400 `VALIDATION`.

## Recommendations

1. **Close the notifications INSERT residual (DATA-P1-001)** — rewrite `notifications_insert_system_or_admin` with `public.user_has_role(org, full platform key set)` + an approved-membership branch, then raise the `check-rls-predicate.mjs` baseline.
2. **Retention owners (DATA-P2-006)** — either add purges for `store_quote_requests`, `store_leads`, `impersonation_log` or record an explicit owner-accepted exception with a review date in `docs/PRIVACY.md`.
3. **Exercise production backup (DATA-P2-010)** — provision the backup secrets in `prod-backup`, run one green `db-backup`/`db-restore-test`, and link the run URL in the drill ledger.
4. **Document migration gaps (DATA-P3-002)** — add a short “reserved/abandoned prefixes” table to `docs/migrations/README.md`; optionally add a CI check that gaps are listed.
5. **Validation drift (DATA-P3-007)** — enum the governance/CRUD status schemas and map `23514` to 400.

## Suggested tests

- RLS predicate regression: assert a pending admin membership cannot insert a notification for the org (SQL matrix extension).
- Retention: assert each registry-backed store has a purge target or a documented waiver (`privacy-retention-doc.test.ts` extension).
- Schema: a `status` property-test that the API accepts exactly the CHECK vocabulary per constrained column.
- Migration guard: extend `check-migration-transactions.sh` to flag `create policy` without same-file `drop policy if exists` (already covered by verify-rls rule 3) and `add constraint` without a guard.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are the three unpurged stores subject to a contractual retention promise? | Data-protection compliance | Owner decision / DPA text |
| When will prod backup secrets be provisioned? | DR RPO/RTO claims | `prod-backup` environment secrets + a green run URL |
