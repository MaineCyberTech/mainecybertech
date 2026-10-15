# Backup and Restore Drill Audit (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: DR
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (23 DR findings)
- Scope limitations: GitHub Actions run history was read through the public API (read-only, no logs — log download requires admin); no live Spaces/Supabase restore was executed; secrets were neither read nor printed.

## Scope

Re-verified all 23 DR findings from the previous run against `main@7dd0402`, plus new DR issues in the same lens (database/storage backups, restore drills, migration rollback, RTO/RPO, DR runbooks, state restore, guardrails). Everything reviewed is listed in the JSON companion; the live bucket/project state and the GitHub environment secret values are out of scope by design.

## Executive Summary

The **repository-side DR program is now essentially complete**: encrypted and offsite-capable backups, paginated/verified storage mirrors, deep restore assertions, an independent staleness detector, a platform heartbeat that the worker actually alerts on, a prod-capable DB backup target, a versioned Terraform state bucket, and a tested state-restore script all exist at this commit. Of the 23 previous findings, 16 are `verified-fixed`, 6 are `partially-fixed`, and **DR-P0-001 remains `open`**; three new findings were raised.

The one blocking fact is unchanged and is now purely operational: **no backup has ever succeeded**. The latest `db-backup` run (2026-10-13, on the fixed code) still fails in `Run database backup script`; the latest `db-restore-test` failed at baseline load on the *pre-fix* commit. `backup-staleness-check.yml` is doing its job — it fails daily because nothing is fresh. Until the operator provisions the backup secrets and a green run is recorded, the platform has no long-term database backup, no storage mirror, and no validated RPO/RTO, and the drill ledger stays empty.

New findings this run: production **storage** backups have no prod target even though the database path was made prod-capable (P2), the staleness workflow still prefers the retired `SCHEDULE_DISPATCH_TOKEN` (P3), and the new drill plan still documents the legacy `S3_BACKUP_BUCKET` shape (P3).

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| DR-P0-001 | P0 | No successful backup has ever run: every db-backup, storage-backup and db-restore-test CI run fails | **open** | 0 successful runs; latest db-backup 38389756631 failed 2026-10-13; RELEASE_GATE.md:69; drill-ledger.md:12-15 |
| DR-P0-002 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch | verified-fixed | workflows on `main`; schedules fire 2026-10-06..13; dispatcher retired |
| DR-P0-003 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup | verified-fixed | `db-restore-test.yml:196-293`; baseline `.github/restore-test-baseline.env:23-27` |
| DR-P1-001 | P1 | The weekly restore test fails at baseline load (invalid GITHUB_ENV format) so no restore verification ever executes | verified-fixed | `db-restore-test.yml:80-87` (grep filter, commit 054c19cf); no post-fix run yet |
| DR-P1-002 | P1 | No backup or restore path exists for uploaded files in Supabase Storage | verified-fixed | `storage-backup.yml`, `storage-restore-test.yml`, `backup-storage.sh`, `restore-storage.sh`, `validate.yml:74` |
| DR-P1-003 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script | verified-fixed | matrix:127-138; script headers; shared fallback + URI normalisation |
| DR-P1-004 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy | partially-fixed | code present (`backup-database.sh:80-115`); 0 encrypted/offsite objects ever produced |
| DR-P1-005 | P1 | The restore test has no failure alert | verified-fixed | `db-restore-test.yml:302-326`; notify step observed green on failed run |
| DR-P1-006 | P1 | No automated migration reverse/rollback and no bad-migration drill | partially-fixed | dry-run artifact + drift gate (`supabase-migrations.yml:67-127`); D4 still `planned` |
| DR-P1-007 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump | partially-fixed | `RTO_RPO.md:11,40-47` accurate; no measured exercise |
| DR-P2-001 | P2 | Storage backups can be silently partial or empty: listings are truncated at 1000 objects and a zero-object archive is accepted | verified-fixed | `backup-storage.sh:62-79,105-117,132-143` |
| DR-P2-002 | P2 | Storage backups are never restore-tested and the restore script asserts nothing | verified-fixed | `storage-restore-test.yml:73-85`; `restore-storage.sh:114-137,166-171`; `validate.yml:74` |
| DR-P2-003 | P2 | No independent backup-staleness alarm; notifier delivery failures are swallowed | verified-fixed | `backup-staleness-check.yml:20-113`; already failing as designed (run 38422872427) |
| DR-P2-004 | P2 | Backup-failure alerting is present but cannot be trusted to deliver | verified-fixed | ntfy-first notifiers in all 5 workflows; observed delivery steps green |
| DR-P2-005 | P2 | Terraform state bucket versioning is claimed but not backed by any resource | verified-fixed | `state-bucket.tf` (versioning + import + prevent_destroy) |
| DR-P2-006 | P2 | The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale | verified-fixed | `docs/modules/backup-dr.md` rewritten to real routes + scope banner |
| DR-P2-007 | P2 | Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp` | partially-fixed | guardrail `restore-database.sh:54-63`; plaintext `/tmp/restore.sql.gz` still staged (:97-115) |
| DR-P2-008 | P2 | The product `backup_status` module is not wired to any real platform backup heartbeat | verified-fixed | `platform_backup_heartbeats` (migration 5302450) + `record-backup-heartbeat.sh` + worker `backupDrCheck` |
| DR-P3-001 | P3 | Platform DR drill plan is only in a dated audit folder and the drill ledger is empty | partially-fixed | plan/ledger relocated; ledger still all `planned` |
| DR-P3-002 | P3 | Duplicate backup-script logic in bash and PowerShell risks drift | partially-fixed | `backup-database.ps1:18-24` header only; duplicate logic remains |
| DR-P3-003 | P3 | Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job | verified-fixed | digest pins + tool-version steps |
| DR-P3-004 | P3 | Documented backup/DR export endpoints do not exist | verified-fixed | `docs/modules/backup-dr.md:21-40` |
| DR-P3-005 | P3 | Terraform state restore guidance lacks a tested procedure | verified-fixed | `terraform-state-restore.sh` + `scripts/ci/test-terraform-state-restore.sh`; live drill pending |
| DR-P2-009 | P2 | Production uploaded files have no backup or restore target: storage workflows attach the dev environment only | **open (new)** | `storage-backup.yml:19-31`, `storage-restore-test.yml:20-32`; matrix:103-104 |
| DR-P3-006 | P3 | Backup staleness check still prefers the retired SCHEDULE_DISPATCH_TOKEN over GITHUB_TOKEN | **open (new)** | `backup-staleness-check.yml:50` vs matrix:157 |
| DR-P3-007 | P3 | New DR drill plan's restore dependency table still documents the legacy full-URI S3_BACKUP_BUCKET | **open (new)** | `backup-restore-drill-plan.md:66` vs the S3_BUCKET/S3_PREFIX contract |

Counts: 16 verified-fixed / 6 partially-fixed / 0 regressed / 4 open (DR-P0-001 carried plus the 3 new rows DR-P2-009, DR-P3-006, DR-P3-007).

## Recommendations

### Immediate / Release blocking

1. **Provision the backup secrets** (`SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY`, Spaces keys / `S3_BUCKET`) in the `dev` environment (and `prod-backup` before any prod backup), then run `db-backup` and `db-restore-test` manually and record both green run URLs in `docs/RELEASE_GATE.md` and the drill ledger. This is the only thing standing between the platform and a working DR path.
2. Keep `backup-staleness-check.yml` failing until then — it is the honest signal.

### This week

3. Run `db-restore-test` on the fixed code as soon as the secrets exist; confirm the baseline step loads the floors (DR-P1-001) and the freshness/RLS assertions execute.
4. Record the first drill (D1) in `docs/runbooks/backup-restore-drill-ledger.md` with an artifact.

### This month

5. Make the storage backup/restore workflows prod-capable like the DB ones (new DR-P2-009), or explicitly owner-accept dev-only storage coverage in `docs/RTO_RPO.md`.
6. Remove the `SCHEDULE_DISPATCH_TOKEN` preference from the staleness check (new DR-P3-006) and revoke the token.
7. Exercise the alert path and the PITR (D2) before claiming the 5-minute RPO; update `docs/RTO_RPO.md` "Last real restore exercise".
8. Stream the decrypted dump into `psql` (or shred the temp copy) to close DR-P2-007.

### Later / Platform evolution

9. Retire or delegate `scripts/backup-database.ps1` to the bash script (DR-P3-002).
10. Author a reverse-migration template and run the D4 bad-migration drill (DR-P1-006).
11. Fix the drill plan's dependency row (DR-P3-007).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Record the green run URLs in RELEASE_GATE + ledger | Converts "configured" to "exercised" | `docs/RELEASE_GATE.md`, `docs/runbooks/backup-restore-drill-ledger.md` | run URL resolves and is green |
| Drop the retired token preference | Removes a false-alarm/failure mode in the detector | `.github/workflows/backup-staleness-check.yml:50` | staleness check still passes/fails correctly on a dispatch |
| Point the drill plan at S3_BUCKET/S3_PREFIX | Operators follow the real contract | `docs/runbooks/backup-restore-drill-plan.md:66` | doc/code consistency read-through |
| Add a prod input to storage-backup.yml | Closes the prod storage gap | `.github/workflows/storage-backup.yml` | dispatch `environment: prod` attaches `prod-backup` |

## Suggested Tests

- **CI**: assert the baseline file contains only KEY=VALUE lines before the append step (regression test for DR-P1-001).
- **CI**: a guard that fails when a backup/restore workflow is not on the default branch (DR-P0-002 regression).
- **Script**: run `restore-storage.sh --verify-only` against synthetic corrupt/partial/encrypted archives (already exists: `scripts/exercise-storage-restore.sh`); extend with a >1000-object synthetic listing test for the pagination loop.
- **Drill**: D1 restore into a throwaway Postgres; record duration vs RTO; D2 PITR fork.
- **Manual**: confirm `ALLOW_PROD_RESTORE` refuses a remote host and that no plaintext dump remains after a failed restore.

## Suggested Documentation Updates

- `docs/RTO_RPO.md`: add the "Last real restore exercise" line once D1 is green; state the storage coverage gap or its closure.
- `docs/runbooks/backup-restore-drill-plan.md`: fix the `S3_BACKUP_BUCKET` dependency row.
- `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`: drop the retired token reference if the workflow keeps it (or vice versa).
- `docs/RELEASE_GATE.md`: update the DR gate rows once green runs exist.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which secret is missing in the `dev` environment today (SUPABASE_DB_URL, BACKUP_ENCRYPTION_KEY, or the Spaces keys)? | Determines the exact operator action | The failing step's log (admin-only) or an operator run with `ACTIONS_STEP_DEBUG` |
| Does the Supabase Storage list endpoint cap `limit` below 1000? | If so the pagination loop's `page_size < 1000` break could still truncate silently | API behavior or a >1000-object bucket test |
| Is prod storage actually receiving uploads today? | Sets the urgency of DR-P2-009 | Prod bucket object counts / upload metrics |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-10-14): db-backup 0 successes (latest failure 38389756631 @2026-10-13T11:22Z, step 'Run database backup script'); storage-backup 0 successes (38396241752); db-restore-test 38267851116 @2026-10-12 used pre-fix commit 8d299b8d (check-run annotation "Invalid format '# Baseline thresholds...'"); storage-restore-test 0 runs; backup-staleness-check 38422872427 failed as designed with a successful notify step.
- 16/23 previous findings `verified-fixed`, 7 `partially-fixed`, 0 regressed; 3 new findings (DR-P2-009, DR-P3-006, DR-P3-007).
