# RTO/RPO Targets

## Service Tiers

| Service | RTO (Recovery Time) | RPO (Recovery Point) | Notes |
|---------|--------------------|--------------------|-------|
| **API** | 15 minutes | 0 (stateless) | New container replaces old; no data loss |
| **Web** | 15 minutes | 0 (stateless) | Next.js standalone; no data loss |
| **Worker** | 15 minutes | 0 (stateless) | Queue-based; in-flight tasks retry |
| **Postgres (Supabase)** | 1 hour | 5 minutes | PITR via Supabase; 7-day retention |
| **Redis** | 30 minutes | 24 hours | AOF persistence; recreated from DB on loss |
| **DNS (Cloudflare)** | 5 minutes | N/A | Managed DNS; instant failover via API |

## Recovery Procedures

- **Application rollback**: See `docs/ROLLBACK_PROCEDURES.md` — Docker rollback via `workflow_dispatch` (manual) or `deploy-do.yml` rollback input.
- **Database recovery**: Supabase PITR (point-in-time recovery) for last 7 days. S3 pg_dump backups retained for 30 days for long-term recovery.
- **Infrastructure recovery**: Terraform state stored in DO Spaces. `terraform apply` can recreate the droplet, firewall, and DNS records.

## Backup Strategy

- **Database**: Daily `pg_dump` to S3 (30-day retention, STANDARD_IA). Supabase PITR (7-day).
- **Terraform state**: DO Spaces (S3-compatible) with versioning enabled.
- **Docker images**: GHCR with SHA-tagged immutable images. Rollback by redeploying a previous SHA tag.

## Incident Response

1. **Detect** — Health checks (30s interval), Sentry alerts, deploy success/failure notifications
2. **Respond** — SSH into droplet, check logs (`docker compose logs --tail=100`)
3. **Recover** — Rollback via `workflow_dispatch` with `rollback_sha` input (see `ROLLBACK_PROCEDURES.md`)
4. **Restore** — Database restore from S3 backup or Supabase PITR
5. **Verify** — Health endpoint returns 200, E2E smoke tests pass