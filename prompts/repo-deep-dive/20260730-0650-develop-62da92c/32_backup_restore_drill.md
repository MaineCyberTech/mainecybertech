# Backup, Restore, and Disaster Recovery Drill

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92c
- **Generated at:** 2026-07-30T06:50:00Z
- **Auditor:** principal-level repository auditor
- **Area code:** DR
- **Scope limitations:** Code/documentation analysis only; no actual backup/restore execution performed. No access to production Supabase project or DO droplet to verify backup schedules.

## Scope

Full audit of backup infrastructure: Supabase database backups, Docker volume persistence, migration recovery path, backup scripts, disaster recovery procedures, RTO/RPO documentation, Terraform state backup, and restore verification.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `scripts/backup-database.sh` | Backup script | Supabase DB backup via pg_dump | gzip compression, timestamped files |
| `scripts/backup-database.ps1` | Backup script | Windows-equivalent pg_dump backup | Same logic as sh version |
| `.github/workflows/db-backup.yml` | CI backup | Scheduled Supabase DB backup | Cron weekly, manual dispatch |
| `supabase/migrations/` | Schema recovery | 47 versioned migrations | Sequential, reproducible schema |
| `docs/ROLLBACK_PROCEDURES.md` | Rollback docs | Supabase, Docker, Terraform rollback | Step-by-step procedures |
| `infra/digitalocean/docker-compose.yml` | Volume persistence | Redis data volume | Named volume: redis-data |
| `infra/terraform/digitalocean/` | IaC state | Terraform state for infrastructure | Not backed up to S3/remote |
| `apps/api/src/lib/supabase.ts` | DB connection | Supabase client config | Uses hosted Supabase URL |
| `.github/workflows/deploy-do.yml` | Deploy workflow | Post-deploy verification | Health check after deploy |
| `docs/MONITORING_AND_ALERTING.md` | Monitoring docs | Backup monitoring recommendations | No specific backup alerting |

## Executive Summary

**Backup/DR score: 2.5/5.** The platform has essential backup foundations: a weekly scheduled Supabase pg_dump via GitHub Actions, versioned database migrations for schema recovery, and documented rollback procedures for Docker, Supabase, and Terraform. However, critical gaps exist: no RTO/RPO targets are documented, Terraform state is not backed up to remote storage, backup restoration is never tested or verified, and the weekly backup frequency may result in up to 7 days of data loss for the audit_logs and notifications tables.

### Strengths

- **Scheduled backups** — `db-backup.yml` runs every Sunday at 02:00 UTC, supports manual dispatch.
- **Versioned schema** — 47 sequential migrations in `supabase/migrations/` allow full schema reconstruction from scratch.
- **Rollback documentation** — `docs/ROLLBACK_PROCEDURES.md` has step-by-step instructions for Supabase schema rollback (using `supabase db diff`) and Docker container rollback (reverting image tags).
- **Backup scripts** — Both bash (`backup-database.sh`) and PowerShell (`backup-database.ps1`) scripts support pg_dump with gzip compression and timestamped filenames.

### Major Risks

- **No RTO/RPO defined** — Unknown acceptable data loss and recovery time. Weekly backup means potential 7-day data loss for high-volume tables (audit_logs, notifications).
- **Terraform state not backed up** — State is stored locally on the CI runner or developer machine. Loss of state means loss of infrastructure management capability.
- **No restore verification** — Backup restore is never tested. A corrupted or failed backup goes undetected until a real disaster.
- **Supabase backup is full only** — No WAL archiving or point-in-time recovery capability via the backup scripts. Only a full pg_dump at the scheduled time.
- **No backup alerting** — If the weekly backup fails (e.g., credentials expired, disk full), there is no notification. The failure would go undetected until the next scheduled run.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Backup script (bash) | `scripts/backup-database.sh` | pg_dump backup via cron | ✅ Implemented | Low | gzip, timestamped, .sql.gz |
| Backup script (PS1) | `scripts/backup-database.ps1` | pg_dump backup via scheduled task | ✅ Implemented | Low | Windows equivalent |
| CI scheduled backup | `.github/workflows/db-backup.yml` | Weekly backup via GitHub Actions | ✅ Implemented | Low | Cron weekly, manual dispatch |
| Backup restore test | — | Verify backup integrity | ❌ Absent | High | No restore testing anywhere |
| RTO/RPO doc | — | Recovery time/point objectives | ❌ Absent | High | Not defined in any doc |
| Terraform state backup | `infra/terraform/digitalocean/` | State file | ❌ Not backed up | High | Local state only |
| Supabase built-in backup | Supabase dashboard | Daily backup (on Pro plan) | ✅ Present | Low | Hosted Supabase includes daily backup |
| Migration-based recovery | `supabase/migrations/` | Schema reconstruction | ✅ Implemented | Low | 47 versioned files |
| Docker volume backup | `docker-compose.yml` | Redis data volume | ⚠️ Named volume | Medium | Redis data backed up only if container stopped |
| Rollback procedures | `docs/ROLLBACK_PROCEDURES.md` | DR procedures | ✅ Implemented | Low | Covers Docker, Supabase, Terraform |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Database backup | 4 | Weekly pg_dump via CI | No point-in-time recovery | Enable WAL archiving or Supabase PITR |
| Backup schedule | 3 | Weekly cron | Up to 7 days data loss | Increase to daily backup |
| Backup scripts | 4 | bash + PowerShell | No backup retention policy | Add retention (e.g., 30-day rotation) |
| Restore testing | 0 | None | Never verified | Add quarterly restore drill |
| RTO/RPO definition | 0 | None | No targets | Document RTO=4h, RPO=24h or similar |
| Infrastructure backup | 1 | Terraform state only local | State loss = infra management loss | Migrate to remote state (S3/DO Spaces) |
| Schema recovery | 4 | 47 migrations | No migration test in CI | Add `supabase db push --dry-run` to CI |
| Volume persistence | 3 | Named Redis volume | No backup for Redis data | Add volume backup to weekly script |
| Rollback documentation | 4 | Comprehensive DR docs | No DR drill schedule in docs | Add annual DR drill to docs |
| Backup alerting | 1 | None | Silent failure of backup | Add Sentry alert or GitHub notification |

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| DR-001 | Database corruption | `docs/ROLLBACK_PROCEDURES.md` | Supabase restore from pg_dump | No restore verification | P1 |
| DR-002 | Accidental schema change | `supabase/migrations/` | Rollback via `supabase db diff` | No migration dry-run in CI | P2 |
| DR-003 | Terraform state lost | — | No remote state | Full infra management loss | P1 |
| DR-004 | Droplet failure | `docs/ROLLBACK_PROCEDURES.md` | Docker rollback + Terraform recreate | No automated failover | P2 |
| DR-005 | Backup file corruption | — | No restore test | Undetected silent corruption | P1 |
| DR-006 | Backup credentials expired | — | No backup alerting | Undetected until next run | P1 |
| DR-007 | Redis data loss | `docker-compose.yml` | Named volume | No Redis data backup | P2 |
| DR-008 | Data deletion (malicious/accidental) | `docs/ROLLBACK_PROCEDURES.md` | Full restore from pg_dump | Up to 7 days data loss | P1 |

## Findings

### Finding ID: DR-P1-001 - No RTO/RPO defined for any component

- **Severity:** P1
- **Confidence:** High
- **Area:** Disaster Recovery
- **Evidence:**
  - Searched all docs: `docs/ROLLBACK_PROCEDURES.md`, `docs/MONITORING_AND_ALERTING.md`, `AGENTS.md`, `README.dev.md`
  - No mention of Recovery Time Objective (RTO) or Recovery Point Objective (RPO) in any document
- **What is happening:** The platform has no defined targets for how quickly recovery must happen (RTO) or how much data loss is acceptable (RPO). This makes it impossible to validate whether the backup frequency, restore procedures, and infrastructure are adequate.
- **Recommended fix:** Define and document RTO/RPO targets. Recommended initial targets: RTO=4 hours (acceptable downtime for a full restore), RPO=24 hours (daily backups acceptable for this platform). Increase backup frequency to daily to match RPO.
- **Status:** Open

### Finding ID: DR-P1-002 - Backup restoration never tested or verified

- **Severity:** P1
- **Confidence:** High
- **Area:** Disaster Recovery
- **Evidence:**
  - `scripts/backup-database.sh` — creates backup but no restore step
  - `scripts/backup-database.ps1` — same, no restore
  - `.github/workflows/db-backup.yml` — backup only, no restore verification
  - `docs/ROLLBACK_PROCEDURES.md` — describes how to restore but no evidence of execution
- **What is happening:** Backups are created every week but never tested. A corrupted backup, expired credentials, or schema mismatch between backup and current schema would only be discovered during an actual emergency.
- **Recommended fix:** Add a quarterly restore drill (runbook + execution) that restores the most recent backup to a staging Supabase project and verifies data integrity (row counts, recent entries, key records).
- **Status:** Open

### Finding ID: DR-P1-003 - Terraform state stored only locally

- **Severity:** P1
- **Confidence:** High
- **Area:** Infrastructure/DR
- **Evidence:**
  - `infra/terraform/digitalocean/` — no `backend.tf` or `terraform { backend "s3" {} }` block
  - State stored in local `terraform.tfstate` file
  - No remote state backend configured (S3, DO Spaces, Terraform Cloud)
- **What is happening:** Terraform state is lost when the CI runner or developer machine is cleaned up. Loss of state makes it impossible to manage or destroy existing infrastructure.
- **Recommended fix:** Add a `backend "s3"` block (or DO Spaces backend) to `providers.tf`. Migrate existing state to remote backend. Add state locking.
- **Status:** Open

### Finding ID: DR-P1-004 - No backup alerting on failure

- **Severity:** P1
- **Confidence:** High
- **Area:** Disaster Recovery
- **Evidence:**
  - `.github/workflows/db-backup.yml` — no `if: failure()` step for notification
  - No Sentry capture, Slack webhook, or GitHub issue creation on backup failure
- **What is happening:** If the weekly backup fails (e.g., Supabase connection string rotated, runner disk full, pg_dump version mismatch), the failure is silent. Operators are unaware until the next successful backup (or until a disaster requires a restore).
- **Recommended fix:** Add a `if: failure()` notification step to the backup workflow (Slack webhook, GitHub issue, or email).
- **Status:** Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Unacceptable data loss | P1 | Medium | Critical | No RPO defined | Define RPO, increase backup frequency |
| Corrupt backup undetected | P1 | Low | Critical | No restore test | Quarterly restore drill |
| Terraform state loss | P1 | Medium | High | Local state only | Remote state backend |
| Silent backup failure | P1 | Low | High | No backup alert | Add notification on failure |
| Redis data loss | P2 | Low | Medium | Named volume only | Add Redis data backup to weekly script |
| Migration mismatch during restore | P2 | Low | Medium | 47 migrations, no CI dry-run | Add dry-run to migration CI |

## Recommendations

### Immediate / Release Blocking

1. Add remote Terraform state backend (DO Spaces or S3) — blocks safe infra management
2. Add failure notification to db-backup.yml (Slack webhook or GitHub issue)
3. Define and document RTO/RPO in `docs/ROLLBACK_PROCEDURES.md`

### This Week

4. Increase backup frequency from weekly to daily in `db-backup.yml`
5. Add backup retention policy (keep last 30 daily backups, auto-clean old ones)

### This Month

6. Create quarterly restore drill runbook in `docs/DR_DRILL_RUNBOOK.md`
7. Execute first restore drill: restore latest backup to staging Supabase project, verify data integrity

### Later / Platform Evolution

8. Enable Supabase Point-in-Time Recovery (PITR) on Supabase Pro plan
9. Add Redis data backup to the weekly backup script (dump RDB/AOF and upload to S3/Spaces)
10. Add automated backup integrity check (pg_dump verify, checksum)

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add failure notification to backup workflow | Silent backup failure becomes visible | `db-backup.yml` | Failed workflow triggers notification |
| Increase backup to daily | Reduces max data loss from 7 to 1 day | `db-backup.yml` | Cron change: 0 2 * * * |
| Document RTO/RPO | Provides target for all DR decisions | `docs/ROLLBACK_PROCEDURES.md` | Document updated |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Remote Terraform state | P1 | Infrastructure | 1 day | DO Spaces bucket |
| Backup failure alert | P1 | CI | 0.5 day | Slack webhook or GitHub token |
| RTO/RPO documentation | P1 | Platform | 0.5 day | None |
| Daily backup | P2 | CI | 0.5 day | None |
| Restore drill runbook | P2 | Platform | 1 day | Staging Supabase project |
| First restore drill | P2 | Platform | 2 hours | Staging Supabase + backup file |
| Supabase PITR | P3 | Infrastructure | Config change | Supabase Pro plan |
| Redis backup | P3 | Scripts | 1 day | S3/Spaces credentials |

## Suggested Tests

- **DR drill:** Restore latest backup to staging Supabase → verify recent record exists
- **DR drill:** Run `terraform plan` from clean checkout using state backend → matches current infra
- **CI:** Manual `workflow_dispatch` on `db-backup.yml` → backup file appears in artifact
- **CI:** `if: failure()` notification triggers on simulated failure

## Suggested Documentation Updates

1. Add RTO/RPO section to `docs/ROLLBACK_PROCEDURES.md` (top of file, as first section)
2. Create `docs/DR_DRILL_RUNBOOK.md` — step-by-step quarterly restore drill
3. Add backup retention and schedule to `docs/MONITORING_AND_ALERTING.md`
4. Update `docs/ENVIRONMENT_VARIABLES.md` if remote state backend config is added

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Is Supabase on Pro plan? | Pro plan includes daily backups natively | Supabase dashboard |
| Are there any compliance requirements for data retention? | Defines RPO and backup retention period | Regulatory context |
| Where should backup files be stored? | Defines destination for backup upload | DO Spaces bucket availability |
| Is the backup script compatible with the current Supabase pg version? | pg_dump version must match server | Check SUPABASE_PG_VERSION |

## Appendix

### Backup Architecture

```
GitHub Actions (db-backup.yml)
  │
  │ runs every Sunday 02:00 UTC
  │ manual workflow_dispatch
  │
  ▼
Ubuntu runner
  │
  ├── PGPASSWORD=${{ secrets.SUPABASE_DB_PASSWORD }}
  │   pg_dump -h $SUPABASE_DB_HOST \
  │           -U $SUPABASE_DB_USER \
  │           -d $SUPABASE_DB_NAME \
  │           --format=custom \
  │           --compress=9 \
  │           --file=$TIMESTAMP.sql.gz
  │
  └── Uploads artifact to GitHub Actions
      (expires after 90 days default)
```

### Backup Coverage

| Data | Backup method | Frequency | Retention | RPO | Restore mechanism |
| ---- | ------------- | --------- | --------- | --- | ----------------- |
| Postgres (Supabase) | pg_dump via CI | Weekly | 90 days (GH artifact) | 7 days | pg_restore to new project |
| Postgres (built-in) | Supabase Pro daily | Daily | Unknown (Supabase managed) | 24h | Supabase dashboard restore |
| Schema | Migration files | Versioned | ∞ (git) | N/A | `supabase db push` |
| Redis | Named Docker volume | None | N/A | N/A | Redis data lost on volume delete |
| Terraform state | Local file | None | N/A | N/A | Re-create from scratch |
| Application config | GH secrets + env vars | Per-deploy | ∞ (git + secrets) | N/A | Rotate secrets, re-deploy |
