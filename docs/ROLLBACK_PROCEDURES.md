# Rollback Procedures

## 1. Docker Rollback (Automated via workflow_dispatch)

Trigger an automated rollback from GitHub Actions:

1. Navigate to **Actions → deploy-do → Run workflow**
2. Set **deploy_target** to `dev` or `prod`
3. Set **rollback_sha** to the 7–40 char lowercase-hex SHA of the previous working commit
4. Run the workflow

The workflow will deploy the images already published under the `rollback_sha` tag. **Builds are skipped when `rollback_sha` is set** (`build-api`/`build-worker`/`build-web` are gated on `rollback_sha == ''`), so the target image tag must already exist in GHCR — otherwise the pull on the droplet fails. Then it SSHes in and runs:

```bash
cd /opt/mct-portal
IMAGE_TAG=<rollback_sha> docker compose -p mct-portal up -d --remove-orphans
```

Health checks run automatically (API, Worker and Web). If any fail, the deploy step fails and previous containers remain running. Note the workflow also runs `git reset --hard origin/<branch>` for the selected `deploy_target`; if the rollback SHA is on a different branch, first merge that SHA into the target branch or cherry-pick it.

## 2. Docker Rollback (Manual - SSH into droplet)

SSH into the droplet and manually set IMAGE_TAG:

```bash
ssh root@<droplet-ip>

# List available image tags on the droplet
docker images --format '{{.Repository}}:{{.Tag}}' | grep mct

# Or pull a specific tag from GHCR
docker login ghcr.io -u <user> --password-stdin < ~/ghcr-token
docker pull ghcr.io/mainecybertech/mainecybertech/mct-api:<sha>
docker pull ghcr.io/mainecybertech/mainecybertech/mct-worker:<sha>
docker pull ghcr.io/mainecybertech/mainecybertech/mct-web:<sha>

# Deploy with the previous SHA
cd /opt/mct-portal
IMAGE_TAG=<previous-sha> docker compose -p mct-portal up -d --remove-orphans

# Verify all containers are healthy
docker compose -p mct-portal ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'
curl -sf https://api.mainecybertech.com/health
curl -sf https://app.mainecybertech.com/login

# Clean up old images (keep current + rollback target)
docker images --format '{{.Repository}}:{{.Tag}}' | grep mct- | grep -v $(docker inspect --format '{{.Image}}' mct-portal-api-1 | cut -d: -f2) | xargs docker rmi 2>/dev/null || true
```

### Droplet IP lookup

```bash
# Via DO API (requires DO_API_TOKEN)
curl -sf -H "Authorization: Bearer $DO_API_TOKEN" \
  "https://api.digitalocean.com/v2/droplets?page=1&per_page=200" | \
  jq -r --arg name "mct-portal-dev" '[.droplets[] | select(.name==$name)] | sort_by(.created_at) | last | .networks.v4[0].ip_address'

# Via DO Dashboard
# https://cloud.digitalocean.com/droplets → mct-portal-dev / mct-portal-prod
```

## 3. Supabase Rollback

### Option A: Reverse migration

```bash
# Identify the last migration applied
supabase migration list --project-ref $SUPABASE_PROJECT_REF
# Or: npx supabase migration list --project-ref $SUPABASE_PROJECT_REF

# Write a reverse migration manually
# Create supabase/migrations/<timestamp>_revert_<name>.sql with
# the ALTER TABLE/ALTER POLICY/etc statements that undo the last migration
# Re-run all migrations (including the reverse)
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase db push --project-ref $SUPABASE_PROJECT_REF
```

### Option B: Point-in-Time Recovery (PITR)

Supabase Pro plan includes PITR with 7-day retention:

1. Open **Supabase Dashboard → Database → Backups**
2. Select a restore point before the bad migration
3. Confirm — Supabase creates a new database instance at that point
4. Update `SUPABASE_URL` in the droplet's `/opt/mct-portal/.env`
5. Restart containers: `cd /opt/mct-portal && docker compose -p mct-portal down && docker compose -p mct-portal up -d`

### Option C: Manual SQL undo

```bash
# Connect directly and run SQL
ssh root@<droplet-ip>
docker exec -it mct-portal-api-1 psql $SUPABASE_URL

# Or via Supabase dashboard SQL editor
# Write and execute the reverse DDL/DML manually
```

## 3a. Database restore (from S3 backup) and verification

Use this path for data loss that is beyond the PITR window, or when PITR is not
available. Backups are written by `scripts/backup-database.sh` (daily, via
`.github/workflows/db-backup.yml`).

### Backup location contract (audit DR-P1-002 / IR-P1-005)

Both the write path and every read path resolve the same two variables:

| Variable    | Shape                        | Default                  |
| ----------- | ---------------------------- | ------------------------ |
| `S3_BUCKET` | bucket **name** (no `s3://`) | `mainecybertech-backups` |
| `S3_PREFIX` | key prefix (no leading `/`)  | `database-backups`       |

Object path: `s3://${S3_BUCKET}/${S3_PREFIX}/<file>`. The backup script, backup
workflow, restore-test workflow, storage-backup workflow and
`scripts/restore-database.sh` all use these names. A legacy full-URI
`S3_BACKUP_BUCKET` secret is still accepted for the bucket name and normalised,
but prefer `S3_BUCKET`. When set, `S3_OFFSITE_BUCKET` receives a second copy.

### Restore steps

```bash
# 1. Dry-run: confirm the resolved location and newest object (no restore)
S3_BUCKET=mainecybertech-backups S3_PREFIX=database-backups \
  AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  SUPABASE_DB_URL=postgresql://... ./scripts/restore-database.sh --dry-run

# 2. Restore into a scratch database first where possible; a non-local target
#    is refused unless ALLOW_PROD_RESTORE=yes.
BACKUP_ENCRYPTION_KEY=... ./scripts/restore-database.sh
```

### Restore verification checklist

`.github/workflows/db-restore-test.yml` runs these assertions weekly against the
newest backup into a throwaway Postgres, with floors from
`.github/restore-test-baseline.env`. After any manual restore, confirm the same:

- [ ] `S3_BUCKET`/`S3_PREFIX` resolved to the location the backup wrote to.
- [ ] Public table count ≥ `RESTORE_MIN_TABLES`.
- [ ] `supabase_migrations.schema_migrations` row count ≥ `RESTORE_MIN_MIGRATIONS`.
- [ ] Critical tables (`profiles`, `organizations`, `tickets`, `documents`,
      `audit_logs`) exist and carry rows.
- [ ] Newest `audit_logs` row is within `RESTORE_MAX_DATA_AGE_DAYS` (freshness /
      RPO canary).
- [ ] Tenant-scoped tables still carry `organization_id`.
- [ ] No restored public table has RLS disabled.

A successful `psql` exit is **not** verification. See `docs/RTO_RPO.md` for the
RPO that each method actually supports.

## 3b. Storage restore (uploaded files)

User uploads (`documents`, `avatars`, `logos`) are backed up by
`scripts/backup-storage.sh` via `.github/workflows/storage-backup.yml`.

```bash
# Dry-run: show which objects would be restored
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  ./scripts/restore-storage.sh --dry-run

# Restore the newest archive (decrypts when BACKUP_ENCRYPTION_KEY is set)
BACKUP_ENCRYPTION_KEY=... ./scripts/restore-storage.sh
```

Storage objects are keyed by path, so a database restore and a storage restore
together restore working `documents.storage_path` links. A DB-only restore
leaves those rows pointing at missing objects — always pair the two.

## 4. Terraform Rollback

### Roll back infrastructure via git revert

```bash
# On your local machine
cd infra/terraform/digitalocean

# Identify the bad commit
git log --oneline infra/terraform/digitalocean/

# Revert the offending commit (creates a new commit that undoes the changes)
git revert <bad-commit-hash>

# Push to trigger terraform-do workflow
git push origin <branch>
```

The `terraform-do.yml` workflow will run a plan on the PR/push and apply automatically (dev) or require prod-approval (main).

### Roll back a single resource

```bash
# If you need to roll back one resource without reverting the whole commit
cd infra/terraform/digitalocean
terraform plan -var-file=dev.tfvars -target=digitalocean_droplet.mct_portal
terraform apply -var-file=dev.tfvars -target=digitalocean_droplet.mct_portal
```

### Restore previous Terraform state (emergency)

```bash
# If state is corrupted, restore from DO Spaces backups
# State is stored in DO Spaces (S3-compatible):
#   bucket: mct-portal-tfstate-<env>
#   key: terraform/do/terraform.tfstate

# Restore from a prior version via DO Spaces UI or CLI
```

### Resources with `prevent_destroy`

The droplet resource has `prevent_destroy = true`. To replace it:

```bash
terraform plan -var-file=dev.tfvars -destroy -target=digitalocean_droplet.mct_portal
# This will FAIL — remove prevent_destroy temporarily, apply destroy, re-add
```

## 5. Emergency Contacts

| Service  | Issue                  | Action                                                                                          |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| API      | Health check failing   | Run Docker rollback (manual or automated); check `docker logs mct-portal-api-1`                 |
| Web      | 502 / page errors      | Run Docker rollback; check `docker logs mct-portal-web-1`                                       |
| Worker   | Not processing jobs    | Restart worker: `docker compose -p mct-portal restart worker`; check Redis connectivity         |
| Redis    | Queue backlog          | Monitor with `docker exec mct-portal-redis-1 redis-cli -a $REDIS_PASSWORD LLEN bullmq:mct:wait` |
| Database | Migration failure      | Apply reverse migration or PITR via Supabase Dashboard                                          |
| DNS      | Resolution failure     | Check Cloudflare dashboard; verify A records point to droplet IP                                |
| TLS      | Certificate expired    | Check Caddy auto-renew: `docker logs mct-portal-caddy-1 --tail 20`                              |
| Droplet  | Out of disk            | SSH in: `df -h`; run `docker system prune -af`; check `/opt/mct-portal`                         |
| CI/CD    | Deploy workflow failed | Restart workflow; if SSH key rotated, update `CI_SSH_PRIVATE_KEY` in GitHub secrets             |

### Prod-approval environment

All production deployments reference the `prod-approval` GitHub environment:
the Docker prod deploy (`deploy-do.yml`, `deploy` job) and the Terraform prod
apply (`terraform-do.yml`, `terraform-apply-prod`).

**Required reviewers are a GitHub repository setting, not workflow code:**
configure them under Settings → Environments → `prod-approval` → Required
reviewers (add 1+). Until that list is populated there is **no working
manual-approval gate** and a prod deploy will start without pausing. The prod
deploy secrets/variables must also be available to `prod-approval` (scoped to
it or repo-wide).

## Deployment Verification

After any rollback, verify:

```bash
# Health endpoint
curl -sf https://api.<domain>/health

# Web app loads
curl -sf -o /dev/null -w "%{http_code}" https://app.<domain>/login

# Worker health
curl -sf http://localhost:3001/health

# All containers running
docker compose -p mct-portal ps --format 'table {{.Name}}\t{{.Status}}'
```
