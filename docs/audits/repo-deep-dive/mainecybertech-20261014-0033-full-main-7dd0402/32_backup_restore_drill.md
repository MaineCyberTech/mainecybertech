# 32_backup_restore_drill — Prompt 32 - Backup and Restore Drill Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `32_backup_restore_drill.md` (area DR, prompt)

## Verification Performed

Domain subagent produced 26 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| DR-P0-001 | P0 | No successful backup has ever run: every db-backup, storage-backup and db-restore-test CI run fails |
| DR-P0-002 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch |
| DR-P0-003 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup |
| DR-P1-001 | P1 | The weekly restore test fails at baseline load (invalid GITHUB_ENV format) so no restore verification ever executes |
| DR-P1-002 | P1 | No backup or restore path exists for uploaded files in Supabase Storage |
| DR-P1-003 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script |
| DR-P1-004 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy |
| DR-P1-005 | P1 | The restore test has no failure alert |
| DR-P1-006 | P1 | No automated migration reverse/rollback and no bad-migration drill |
| DR-P1-007 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump |
| DR-P2-001 | P2 | Storage backups can be silently partial or empty: listings are truncated at 1000 objects and a zero-object archive is accepted |
| DR-P2-002 | P2 | Storage backups are never restore-tested and the restore script asserts nothing |
| DR-P2-003 | P2 | No independent backup-staleness alarm; notifier delivery failures are swallowed |
| DR-P2-004 | P2 | Backup-failure alerting is present but cannot be trusted to deliver |
| DR-P2-005 | P2 | Terraform state bucket versioning is claimed but not backed by any resource |
| DR-P2-006 | P2 | The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale |
| DR-P2-007 | P2 | Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp` |
| DR-P2-008 | P2 | The product `backup_status` module is not wired to any real platform backup heartbeat |
| DR-P3-001 | P3 | Platform DR drill plan is only in a dated audit folder and the drill ledger is empty |
| DR-P3-002 | P3 | Duplicate backup-script logic in bash and PowerShell risks drift |
| DR-P3-003 | P3 | Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job |
| DR-P3-004 | P3 | Documented backup/DR export endpoints do not exist |
| DR-P3-005 | P3 | Terraform state restore guidance lacks a tested procedure |
| DR-P2-009 | P2 | Production uploaded files have no backup or restore target: storage workflows attach the dev environment only |
| DR-P3-006 | P3 | Backup staleness check still prefers the retired SCHEDULE_DISPATCH_TOKEN over GITHUB_TOKEN |
| DR-P3-007 | P3 | New DR drill plan's restore dependency table still documents the legacy full-URI S3_BACKUP_BUCKET |
