# Backup and Restore Drill Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: DR
- Scope limitations: GitHub Actions history was read through the public API (read-only, no logs — log download requires admin); no live Spaces/Supabase restore was executed; secrets were neither read nor printed. Live bucket/project state and environment secret values remain out of scope.

## Scope

Re-verified all 23 previous DR findings at `6b7aa1a`, plus the 3 new findings from the prior run (DR-P2-009, DR-P3-006, DR-P3-007). Reviewed database/storage backups, restore drills, encryption/offsite copies, RTO/RPO, migration rollback, staleness detection, the platform heartbeat, Terraform state restore and the drill ledger. The `7dd0402..6b7aa1a` diff was reviewed for the storage prod target, the `S3_STORAGE_CLASS` fix, the staleness token change and the PowerShell retirement.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| Public GitHub Actions API | Read-only | Backup/restore run history | Latest runs and 0 successes cited |
| `.github/workflows/{db-backup,db-restore-test,storage-backup,storage-restore-test,backup-staleness-check}.yml` | Read | Schedules, environments, assertions, notifiers | Current at `6b7aa1a` |
| `scripts/{backup-database,backup-storage,restore-database,restore-storage}.sh` | Read | Encryption, pagination, restore assertions | Current at `6b7aa1a` |
| `scripts/terraform-state-restore.sh`, `scripts/ci/test-terraform-state-restore.sh` | Read | State restore + CI test | Current |
| `docs/RTO_RPO.md`, `docs/runbooks/backup-restore-drill-{plan,ledger}.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | Read | Documented contract and evidence | Updated in this diff |
| `.github/restore-test-baseline.env` | Read | Committed floors | 120 tables / 1 row / 1 migration / 2 days / 0 no-RLS |

## Executive Summary

Twenty of the 26 prior DR rows are `verified-fixed`; five are `partially-fixed`; **DR-P0-001 remains open**. Four findings were closed in this diff: surface storage workflows are now prod-capable (DR-P2-009), the PowerShell duplicate is deleted (DR-P3-002), the staleness check no longer prefers the retired PAT (DR-P3-006), and the drill plan uses the real `S3_BUCKET`/`S3_PREFIX` contract (DR-P3-007).

The blocker is still operational, not architectural: **no backup or restore run has ever succeeded**. All four workflows failed on 2026-11-02 (db-backup 41440899317 at "Run database backup script", storage-backup 41448770549 at "Run storage backup script", db-restore-test 41471860987 and storage-restore-test 41484522284 at "Find latest backup", exit 254), and the GitHub Actions `is:success` search returns no results for Database Backup (52 runs), Storage Backup (30), Database Restore Test (5) or Storage Restore Test (3). The new `S3_STORAGE_CLASS=STANDARD` default targets the DigitalOcean Spaces upload rejection, but it has not been exercised at `6b7aa1a`; the operator secrets remain unprovisioned (AGENTS.md:124). One new P3 (DR-P3-008) records that the restore tests fail opaquely at “Find latest backup”, so the operator cannot distinguish an empty bucket from a credentials/endpoint failure.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| DR-P0-001 | P0 | open | No successful backup has ever run | 0 green runs; latest four failed 2026-11-02; secrets unprovisioned |
| DR-P0-002 | P0 | verified-fixed | Backup workflows absent from default branch | All five workflows on `main`; schedules fire |
| DR-P0-003 | P0 | verified-fixed | Restore test never asserts integrity | `db-restore-test.yml:196-293`; committed floors |
| DR-P1-001 | P1 | verified-fixed | Weekly restore test fails at baseline load | `db-restore-test.yml:80-87` grep-filter; no post-fix green yet |
| DR-P1-002 | P1 | verified-fixed | No storage backup/restore path | `storage-backup.yml`, `storage-restore-test.yml`, scripts, `validate.yml:74` |
| DR-P1-003 | P1 | verified-fixed | Backup location contract undocumented | Matrix:130-136; script headers; shared fallback/normalisation |
| DR-P1-004 | P1 | partially-fixed | Backups unencrypted / single location | Encryption + offsite code; 0 objects ever produced |
| DR-P1-005 | P1 | verified-fixed | Restore test has no failure alert | `db-restore-test.yml:302-326`; ntfy-first/Slack fallback |
| DR-P1-006 | P1 | partially-fixed | No reverse-migration/bad-migration drill | Dry-run artifact + drift gate; D4 still `planned` |
| DR-P1-007 | P1 | partially-fixed | RPO/RTO documented but unvalidated | `RTO_RPO.md:11,59-71`; no measured exercise |
| DR-P2-001 | P2 | verified-fixed | Storage listing truncated at 1000 / empty accepted | `backup-storage.sh:62-79,105-117,132-143` |
| DR-P2-002 | P2 | verified-fixed | Storage restores never tested | `storage-restore-test.yml:73-85`; `restore-storage.sh:114-137,166-171` |
| DR-P2-003 | P2 | verified-fixed | No independent staleness alarm | `backup-staleness-check.yml:20-115`; fails as designed |
| DR-P2-004 | P2 | verified-fixed | Backup-failure alerting untrusted | ntfy-first notifiers in all five workflows |
| DR-P2-005 | P2 | verified-fixed | Terraform state versioning not backed by resource | `state-bucket.tf` versioning/import/prevent_destroy |
| DR-P2-006 | P2 | verified-fixed | DR docs describe the wrong product | `docs/modules/backup-dr.md` rewritten |
| DR-P2-007 | P2 | partially-fixed | Manual restore has no guard; plaintext temp | Guard at `restore-database.sh:54-63`; plaintext `/tmp/restore.sql.gz` at :97-118 |
| DR-P2-008 | P2 | verified-fixed | `backup_status` not wired to a heartbeat | `platform_backup_heartbeats` + `record-backup-heartbeat.sh` + worker check |
| DR-P3-001 | P3 | partially-fixed | Plan in dated folder; ledger empty | Plan/ledger relocated; every row still `planned` |
| DR-P3-002 | P3 | verified-fixed | Duplicate bash/PowerShell backup logic | `scripts/backup-database.ps1` deleted; drill plan:35 says retired |
| DR-P3-003 | P3 | verified-fixed | Unpinned Postgres / tool versions | Digest pin; tool-version steps |
| DR-P3-004 | P3 | verified-fixed | Documented export endpoints do not exist | `docs/modules/backup-dr.md:21-40` |
| DR-P3-005 | P3 | verified-fixed | Terraform state restore untested | Script + `scripts/ci/test-terraform-state-restore.sh`; live drill pending |
| DR-P2-009 | P2 | verified-fixed | Prod uploaded files had no backup/restore target | `storage-backup.yml:35-54`, `storage-restore-test.yml:38-57`; docs updated |
| DR-P3-006 | P3 | verified-fixed | Staleness check preferred retired PAT | `backup-staleness-check.yml:34-36,53` uses GITHUB_TOKEN with `actions: read` |
| DR-P3-007 | P3 | verified-fixed | Drill plan used legacy full-URI `S3_BACKUP_BUCKET` | `backup-restore-drill-plan.md:66,78` uses `S3_BUCKET`/`S3_PREFIX` |
| DR-P3-008 | P3 | open (new) | Restore tests fail opaquely at “Find latest backup” (exit 254) | `db-restore-test.yml:106-126`; `storage-restore-test.yml:88-103`; no error distinction |

Counts: **20 verified-fixed / 5 partially-fixed / 0 regressed / 2 open** (DR-P0-001 carried, DR-P3-008 new). Four previous rows moved to fixed in this diff.

## Residual detail

### DR-P0-001 — the only release-blocking fact

The repository-side chain is complete enough to run: scheduled workflows on `main`, encryption, an offsite copy option, paginated storage mirroring, deep restore assertions, a platform heartbeat and an independent staleness check. It has still never produced a green run. The latest failures are all on `main@4199ce8c` (2026-11-02): db-backup 41440899317 failed at "Run database backup script", storage-backup 41448770549 at "Run storage backup script", and both restore tests at "Find latest backup" (exit 254), i.e. before any integrity assertion. `AGENTS.md:124` records the concrete cause: `SUPABASE_DB_URL` is not set and `BACKUP_ENCRYPTION_KEY` is unset; the storage job correctly refuses an empty backup.

The `S3_STORAGE_CLASS` change (`scripts/backup-database.sh:29,112`, `scripts/backup-storage.sh:34,166`, `db-backup.yml:94`, `storage-backup.yml:85`) addresses DigitalOcean Spaces rejecting `STANDARD_IA`. It is plausible but **unverified** because no run exists at `6b7aa1a`. Do not mark this fixed on code inspection alone.

Cross-domain note: `docs/SECRETS_ROTATION.md:33` still describes the backup/restore workflows as “(dev only)” even though DR-P2-009 made them prod-capable; that documentation drift is tracked in the SECRET domain, not re-scored here.

### DR-P3-008 — the restore tests cannot say why they found no backup

The latest db-restore-test (41471860987) and storage-restore-test (41484522284) both stop at “Find latest backup” with exit 254. The step runs `aws s3 ls` inside `LATEST=$(...)` under `set -euo pipefail` (`db-restore-test.yml:106-126`, `storage-restore-test.yml:88-103`); an access/credential/endpoint error aborts the pipeline before the explicit “No backups found” branch, and the annotation is only “Process completed with exit code 254”. Operators cannot tell an empty bucket from a wrong key.

Fix: capture the listing status, print a redacted `::error::` naming the endpoint and bucket plus whether the AWS key variables are populated, and give “no objects” versus “list failed” distinct messages. Add a negative fixture with a stubbed failing `aws s3 ls`.

### DR-P1-004 / DR-P1-007 — encryption and RPO are still claims

The code path is real (`backup-database.sh:85-118` AES-256-CBC + PBKDF2, fail-closed `REQUIRE_BACKUP_ENCRYPTION`, optional offsite), but no encrypted object or offsite copy has ever been produced. `docs/RTO_RPO.md:59-71` correctly separates PITR (5 min) from the daily dump (≤24 h) and says the PITR RPO is not yet proven; there is no measured restore duration or freshness date. The machine checks exist but have never run green.

### DR-P2-007 — plaintext dump still lands on the operator host

`restore-database.sh:54-63` refuses a non-local target unless `ALLOW_PROD_RESTORE=yes`, but the encrypted object is decrypted to `/tmp/restore.sql.gz` (:97-101) and piped to `psql` (:115); removal happens only after the restore (:118). A failed restore leaves tenant data unencrypted on disk. Fix: stream `openssl enc -d | gunzip | psql` or use a `trap` that shreds the temp file on every exit.

### DR-P3-001 — drill evidence is still empty

The plan and ledger now live at stable paths, but `docs/runbooks/backup-restore-drill-ledger.md:12-26` records every D1-D7 row as `planned` and states no drill has run. The first green automated restore is the prerequisite for D1; D2 (PITR), D4 (bad migration), D5 (storage), D6 (Terraform state) and D7 (droplet loss) remain unexercised.

## Recommendations

### Immediate / release blocking

1. Provision `SUPABASE_DB_URL`, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_ENCRYPTION_KEY` and the Spaces keys in the `dev` environment (and `prod-backup` before any prod run); dispatch db-backup and db-restore-test; record both green run URLs in `docs/RELEASE_GATE.md` and the drill ledger.
2. Keep `backup-staleness-check.yml` failing until then — it is the honest signal.
3. After the first green run, restore into a throwaway Postgres and record duration vs the 1-hour RTO (D1).

### This week

4. Confirm the `S3_STORAGE_CLASS=STANDARD` fix actually clears the Spaces upload step; if not, capture the failing step and adjust.
5. Run the storage backup/restore pair once with a non-empty dev bucket (the dev buckets were empty per AGENTS.md).

### This month

6. Stream the decrypted dump into `psql` or trap-shred it (DR-P2-007).
7. Author a reverse-migration template and run the D4 bad-migration drill (DR-P1-006).
8. Exercise PITR (D2) before claiming the 5-minute RPO (DR-P1-007).

### Later / Platform evolution

9. Record D5-D7 (storage, Terraform state, droplet loss) with dated artifacts.
10. Keep the drill ledger current; never mark a row passed without a run URL.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Provision the four backup secrets | Unblocks the entire DR chain | GitHub `dev` environment | db-backup green |
| Record the green run URLs | Converts “configured” to “exercised” | `docs/RELEASE_GATE.md`, ledger | URL resolves |
| Trap-shred `/tmp/restore.sql.gz` | Removes a plaintext-data residual | `scripts/restore-database.sh` | failed-restore test |
| Run storage backup once on a non-empty bucket | Proves pagination/encryption/offsite | `storage-backup.yml` | green run + object count |

## Suggested Tests

- **CI**: assert the baseline file contains only KEY=VALUE lines (regression for DR-P1-001).
- **Script**: run `restore-storage.sh --verify-only` against synthetic corrupt/partial/encrypted archives; add a >1000-object synthetic listing.
- **Drill**: D1 restore into a throwaway Postgres, record duration and assertion output; D2 PITR fork.
- **Manual**: confirm `ALLOW_PROD_RESTORE` refuses a remote host and that no plaintext dump remains after a failed restore.

## Suggested Documentation Updates

- `docs/RTO_RPO.md`: add the “Last real restore exercise” line once D1 is green.
- `docs/runbooks/backup-restore-drill-ledger.md`: fill the first row with the run URL.
- `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`: confirm `prod-backup` provisioning once done.
- `docs/RELEASE_GATE.md`: update the DR gate rows from configured to exercised.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which secret is missing in `dev` today? | Determines the exact operator action | Failing step log (admin-only) |
| Does the `STANDARD` storage class clear the Spaces error? | The change is untested at this SHA | First green/red run at `6b7aa1a` |
| Are the dev buckets still empty? | An empty mirror cannot prove pagination/restore | Bucket object counts |
| Is `prod-backup` provisioned with prod secrets? | The prod target is otherwise another red schedule | Environment secret list |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-11-03): db-backup 52 runs / 0 successes (Actions is:success search: no results; latest 41440899317 failure at "Run database backup script", 2026-11-02T11:58Z); storage-backup latest 41448770549 failure at "Run storage backup script" (2026-11-02T12:56Z); db-restore-test latest 41471860987 failure at "Find latest backup" (2026-11-02T15:28Z); storage-restore-test latest 41484522284 failure at "Find latest storage backup" (2026-11-02T16:45Z); backup-staleness-check 41494115157 failure as designed (2026-11-02T17:45Z).
- `scripts/backup-database.ps1` deleted in `7dd0402..6b7aa1a`; the drill plan:35 records the retirement.
- New DR-P3-008 records the opaque restore-test failure mode; the remaining blocker is still operator provisioning and the first green exercise (DR-P0-001).
