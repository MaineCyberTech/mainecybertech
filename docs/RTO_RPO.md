# RTO/RPO Targets

## Service Tiers

| Service | RTO (Recovery Time) | RPO (Recovery Point) | Notes |
|---------|--------------------|--------------------|-------|
| **API** | 15 minutes | 0 (stateless) | New container replaces old; no data loss |
| **Web** | 15 minutes | 0 (stateless) | Next.js standalone; no data loss |
| **Worker** | 15 minutes | 0 (stateless) | Queue-based; in-flight tasks retry |
| **Postgres (Supabase)** | 1 hour | 5 minutes (PITR) / ≤24 h (pg_dump) | RPO depends on the method: Supabase PITR (7-day retention) meets 5 min; the daily S3 dump can only meet ≤24 h. See Backup Strategy. |
| **Storage (uploads)** | 1 hour | ≤24 h (daily mirror) | `documents` / `avatars` / `logos` mirrored to S3/Spaces by `storage-backup.yml` |
| **Redis** | 30 minutes | 24 hours | RDB snapshot only (default `dump.rdb` on the `redis-data` volume; no AOF); recreated from DB on loss, and in-flight queue work is re-driven by producers/retries |
| **DNS (Cloudflare)** | 5 minutes | N/A | Managed DNS; instant failover via API |

## Recovery Procedures

- **Application rollback**: See `docs/ROLLBACK_PROCEDURES.md` — Docker rollback via `workflow_dispatch` (manual) or `deploy-do.yml` rollback input.
- **Database recovery**: Supabase PITR (point-in-time recovery) for last 7 days. S3 pg_dump backups (encrypted, optionally offsite) retained for 30 days for long-term recovery; restore and verification steps in `docs/ROLLBACK_PROCEDURES.md` §3a.
- **Storage recovery**: `scripts/restore-storage.sh` restores uploaded files from the storage archive; pair it with a database restore so document links resolve (`docs/ROLLBACK_PROCEDURES.md` §3b).
- **Infrastructure recovery**: Terraform state stored in DO Spaces (versioned). `terraform apply` can recreate the droplet, firewall, and DNS records; restore a previous state version with `scripts/terraform-state-restore.sh` (`docs/ROLLBACK_PROCEDURES.md` §4). The live state-restore drill is recorded in `docs/PLATFORM_FAILURE_RUNBOOKS.md` §6.

## Backup Strategy

- **Database**: Daily `pg_dump` to S3 (30-day retention, STANDARD_IA, AES-256-CBC encrypted when `BACKUP_ENCRYPTION_KEY` is set, optional offsite copy via `S3_OFFSITE_BUCKET`). Supabase PITR (7-day). Scheduled runs target **dev** by default — see Production backup coverage below.
- **Storage**: Daily mirror of `documents`/`avatars`/`logos` to S3/Spaces (`storage-backup.yml`, encrypted, same 30-day retention).
- **Terraform state**: DO Spaces (S3-compatible) with versioning enabled — now enforced in code by `digitalocean_spaces_bucket.terraform_state` (`versioning { enabled = true }` in `infra/terraform/digitalocean/state-bucket.tf`, DR-P2-005), not a manual bucket setting. The S3 native lock file (`use_lockfile`) lives in the same bucket (`terraform.tfstate.tflock`), so versioning covers the state and lock objects; this backend does not use DynamoDB locking.
- **Docker images**: GHCR with SHA-tagged immutable images. Rollback by redeploying a previous SHA tag.

### Production backup coverage (DATA-P2-010)

`db-backup.yml` and `db-restore-test.yml` are prod-capable:

- **Manual prod run**: dispatch `environment: prod` **from `main`**. The job attaches the approval-gated `prod-approval` environment (required reviewers must be configured in GitHub for the gate to be real).
- **Scheduled prod run**: set the `PROD_BACKUP_ENABLED` repository variable to `true`. The daily backup / weekly restore test then attach `prod-backup` instead of `dev` (one schedule target at a time; dispatch `environment: dev` manually to keep the dev runs). Create `prod-backup` with the prod backup secrets and **no** required reviewers — an approval-gated environment would leave the unattended run waiting for a human.
- **Operator dependency (cannot be set from the repo)**: `SUPABASE_DB_URL` (prod), `BACKUP_ENCRYPTION_KEY`, `AWS_*`/`DO_SPACES_*` and `S3_BUCKET`/`S3_PREFIX` must be provisioned in the environment the job attaches — see `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`. Until then, S3 dumps cover dev only and this section is the record of that gap.

### Platform backup heartbeat (DR-P2-008)

Each successful `db-backup` run upserts `public.platform_backup_heartbeats` via
`scripts/record-backup-heartbeat.sh`. The worker `backup-dr-check` fails — and
the `MCTWorkerTaskFailures` alert fires — when the heartbeat is missing or older
than 30 hours. This is the platform's own signal; the `backup_status` module is
client-facing product data and is deliberately separate.
`backup-staleness-check.yml` independently watches the GitHub run history for
all backup/restore workflows.

> **Operator actions required to activate encryption/offsite (audit DR-P1-003):**
> the code affordance is in place, but the following must be provisioned by an
> operator and cannot be set from the repo: (1) create the
> `BACKUP_ENCRYPTION_KEY` secret (a strong passphrase — see
> `docs/SECRETS_ROTATION.md` for the rotation caveat); (2) create the second
> bucket and set the `S3_OFFSITE_BUCKET` variable (plus `S3_OFFSITE_PREFIX`) to
> enable the offsite copy; (3) run `db-backup` manually once to confirm an
> encrypted object lands in both buckets, and run `db-restore-test` to confirm
> it decrypts. Until (1) is set, CI uploads fail (the workflows set
> `REQUIRE_BACKUP_ENCRYPTION=1`) rather than silently writing plaintext.

### Validating RPO/RTO

Targets are only meaningful when exercised. The weekly `db-restore-test.yml`
asserts structural completeness **and freshness** (newest `audit_logs` row
within `RESTORE_MAX_DATA_AGE_DAYS`), which is the machine check that the dump
path is meeting its ≤24 h RPO. The worker `backup-dr-check` additionally fails
when the latest successful `db-backup` heartbeat is older than 30 h (DR-P2-008),
and `backup-staleness-check.yml` fails when any backup or restore-test workflow
has no recent successful run. The storage restore path is exercised two ways:
`storage-restore-test.yml` weekly against the newest real archive, and
`scripts/exercise-storage-restore.sh` on every validate run against synthetic
valid/corrupt/encrypted archives (FILE-P3-004), so the restore assertions run
even when no backup has landed yet. The 5-minute PITR RPO is **not** yet proven
by an automated drill; a dated PITR exercise must be recorded before that
target is claimed as achieved.

## Incident Response

1. **Detect** — Health checks (30s interval), Sentry alerts, deploy success/failure notifications
2. **Respond** — SSH into droplet, check logs (`docker compose logs --tail=100`)
3. **Recover** — Rollback via `workflow_dispatch` with `rollback_sha` input (see `ROLLBACK_PROCEDURES.md`)
4. **Restore** — Database restore from S3 backup or Supabase PITR
5. **Verify** — Health endpoint returns 200, E2E smoke tests pass