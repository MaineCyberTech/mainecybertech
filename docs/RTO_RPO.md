# RTO/RPO Targets

## Service Tiers

| Service | RTO (Recovery Time) | RPO (Recovery Point) | Notes |
|---------|--------------------|--------------------|-------|
| **API** | 15 minutes | 0 (stateless) | New container replaces old; no data loss |
| **Web** | 15 minutes | 0 (stateless) | Next.js standalone; no data loss |
| **Worker** | 15 minutes | 0 (stateless) | Queue-based; in-flight tasks retry |
| **Postgres (Supabase)** | 1 hour | 5 minutes (PITR) / ≤24 h (pg_dump) | RPO depends on the method: Supabase PITR (7-day retention) meets 5 min; the daily S3 dump can only meet ≤24 h. See Backup Strategy. |
| **Storage (uploads)** | 1 hour | ≤24 h (daily mirror) | `documents` / `avatars` / `logos` mirrored to S3/Spaces by `storage-backup.yml` |
| **Redis** | 30 minutes | 24 hours | AOF persistence; recreated from DB on loss |
| **DNS (Cloudflare)** | 5 minutes | N/A | Managed DNS; instant failover via API |

## Recovery Procedures

- **Application rollback**: See `docs/ROLLBACK_PROCEDURES.md` — Docker rollback via `workflow_dispatch` (manual) or `deploy-do.yml` rollback input.
- **Database recovery**: Supabase PITR (point-in-time recovery) for last 7 days. S3 pg_dump backups (encrypted, optionally offsite) retained for 30 days for long-term recovery; restore and verification steps in `docs/ROLLBACK_PROCEDURES.md` §3a.
- **Storage recovery**: `scripts/restore-storage.sh` restores uploaded files from the storage archive; pair it with a database restore so document links resolve (`docs/ROLLBACK_PROCEDURES.md` §3b).
- **Infrastructure recovery**: Terraform state stored in DO Spaces. `terraform apply` can recreate the droplet, firewall, and DNS records.

## Backup Strategy

- **Database**: Daily `pg_dump` to S3 (30-day retention, STANDARD_IA, AES-256-CBC encrypted when `BACKUP_ENCRYPTION_KEY` is set, optional offsite copy via `S3_OFFSITE_BUCKET`). Supabase PITR (7-day).
- **Storage**: Daily mirror of `documents`/`avatars`/`logos` to S3/Spaces (`storage-backup.yml`, encrypted, same 30-day retention).
- **Terraform state**: DO Spaces (S3-compatible) with versioning enabled.
- **Docker images**: GHCR with SHA-tagged immutable images. Rollback by redeploying a previous SHA tag.

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
path is meeting its ≤24 h RPO. The 5-minute PITR RPO is **not** yet proven by an
automated drill; a dated PITR exercise must be recorded before that target is
claimed as achieved.

## Incident Response

1. **Detect** — Health checks (30s interval), Sentry alerts, deploy success/failure notifications
2. **Respond** — SSH into droplet, check logs (`docker compose logs --tail=100`)
3. **Recover** — Rollback via `workflow_dispatch` with `rollback_sha` input (see `ROLLBACK_PROCEDURES.md`)
4. **Restore** — Database restore from S3 backup or Supabase PITR
5. **Verify** — Health endpoint returns 200, E2E smoke tests pass