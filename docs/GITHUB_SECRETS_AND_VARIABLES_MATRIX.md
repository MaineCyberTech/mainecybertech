# GitHub Secrets and Variables Matrix

## Recommended GitHub Environments

- `dev` — Dev deploys, Terraform dev apply, dev migrations (no protection rules)
- `prod` — Read-only prod jobs only: `deploy-do`'s `resolve-ip` job and
  `terraform-do`'s `terraform-plan` job. No required reviewers are needed here
  because nothing under `prod` mutates.
- `prod-approval` — **The single approval gate for every production mutation**
  (BP-P3-003): the `deploy-do` `deploy` job (prod), the `terraform-do`
  `terraform-apply-prod` job, and `supabase-migrations.yml` on `main`
  (`supabase db push` against production). **Required reviewers (1+) must be
  configured in GitHub** (Settings → Environments → `prod-approval`); none are
  configured yet, so the approval gate is not yet in force. The migration
  secrets/vars (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) must be
  available to `prod-approval` (scoped to it or repo-wide).

Use environment-scoped values wherever possible. Rotation and emergency
procedures — including the environment each secret must be set on — are in
[`SECRETS_ROTATION.md`](SECRETS_ROTATION.md); its consuming-environment table
is the source of truth for `gh secret set --env`. A value set on an environment
the consuming job does not attach is a silent no-op.

## Secrets required by Terraform workflows

| Secret                        | Dev | Prod | Purpose                                        |
| ----------------------------- | --- | ---- | ---------------------------------------------- |
| `DO_API_TOKEN`                | yes | yes  | DigitalOcean API token for Terraform provider  |
| `DO_SSH_FINGERPRINT`          | yes | yes  | SSH key fingerprint for DigitalOcean droplet   |
| `DO_SPACES_ACCESS_KEY_ID`     | yes | yes  | DO Spaces access key (Terraform backend state) |
| `DO_SPACES_SECRET_ACCESS_KEY` | yes | yes  | DO Spaces secret key (Terraform backend state) |
| `CLOUDFLARE_API_TOKEN`        | yes | yes  | Cloudflare provider authentication             |
| `CLOUDFLARE_ZONE_ID`          | yes | yes  | Cloudflare zone ID for .com domain             |
| `CLOUDFLARE_ZONE_ID_US`       | yes | yes  | Cloudflare zone ID for .us domain              |

## Secrets required by deployment workflows (`deploy-do.yml`)

| Secret                       | Dev | Prod | Purpose                                              |
| ---------------------------- | --- | ---- | ---------------------------------------------------- |
| `CI_SSH_PRIVATE_KEY`         | yes | yes  | Private SSH key for droplet access (root@droplet-ip) |
| `DO_API_TOKEN`               | yes | yes  | DigitalOcean API token (to resolve droplet IP)       |
| `CF_ORIGIN_CERT`             | yes | yes  | Cloudflare Origin CA certificate (fullchain.pem)     |
| `CF_ORIGIN_KEY`              | yes | yes  | Cloudflare Origin CA private key (privkey.pem)       |
| `SUPABASE_URL`               | yes | yes  | Supabase project URL                                 |
| `SUPABASE_ANON_KEY`          | yes | yes  | Supabase anon key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`  | yes | yes  | Supabase service role key                            |
| `JWT_SECRET`                 | yes | yes  | API JWT verification secret list (Supabase signs sessions; see `docs/JWT_ROTATION.md`) |
| `STRIPE_SECRET_KEY`          | yes | yes  | Stripe secret key for billing                        |
| `STRIPE_WEBHOOK_SECRET`      | yes | yes  | Stripe webhook signing secret                        |
| `REDIS_PASSWORD`             | yes | yes  | Redis/BullMQ password written to the droplet `.env`  |
| `FIELD_ENCRYPTION_KEY`       | yes | yes  | AES-256-GCM key for encrypted profile PII            |
| `TURNSTILE_SECRET_KEY`       | yes | yes  | Cloudflare Turnstile captcha secret (contact form)   |
| `MALWARE_SCANNER_URL`        | opt | opt  | Upload malware-scan endpoint (FILE-P2-003); unset = no-op. Point at a ClamAV sidecar or a VirusTotal proxy |
| `MALWARE_SCANNER_API_KEY`    | opt | opt  | Optional `x-apikey` header for `MALWARE_SCANNER_URL` (e.g. VirusTotal proxy) |
| `VAPID_PUBLIC_KEY`           | opt | opt  | Web Push (NOTIF-P2-001) base64url P-256 public key; set all three VAPID values to enable push, unset = no-op |
| `VAPID_PRIVATE_KEY`          | opt | opt  | Web Push base64url P-256 private key (worker); signs the VAPID JWT           |
| `VAPID_SUBJECT`              | opt | opt  | Web Push VAPID contact, e.g. `mailto:ops@mainecybertech.com`                 |
| `RLS_READS_ENABLED`          | yes | yes  | Module keys using the RLS (user-scoped) client reads |
| `RLS_WRITES_ENABLED`         | yes | yes  | Module keys using the RLS client for writes          |
| `SENTRY_DSN`                 | —   | yes  | Sentry DSN for error tracking                        |
| `SMTP_HOST`                  | yes | yes  | SMTP host for email                                  |
| `SMTP_PORT`                  | yes | yes  | SMTP port (default 587)                              |
| `SMTP_USER`                  | yes | yes  | SMTP username                                        |
| `SMTP_PASS`                  | yes | yes  | SMTP password                                        |
| `EMAIL_FROM`                 | yes | yes  | From address for outgoing email                      |
| `JIRA_BASE_URL`              | —   | yes  | Jira instance URL (worker sync)                      |
| `JIRA_EMAIL`                 | —   | yes  | Jira user email (worker sync)                        |
| `JIRA_API_TOKEN`             | —   | yes  | Jira API token (worker sync)                         |
| `JSM_BASE_URL`               | —   | yes  | JSM instance URL (worker sync)                       |
| `M365_TENANT_ID`             | —   | yes  | Microsoft 365 tenant ID (worker sync)                |
| `M365_CLIENT_ID`             | —   | yes  | M365 app client ID (worker sync)                     |
| `M365_CLIENT_SECRET`         | —   | yes  | M365 app client secret (worker sync)                 |
| `PUBLIC_TRAFFIC_WEBHOOK_URL` | —   | yes  | Teams webhook for traffic leads                      |
| `PUBLIC_LEAD_WEBHOOK_URL`    | —   | yes  | Teams webhook for contact form leads                 |
| `JSM_DOMAIN`                 | —   | yes  | JSM domain (cloud.atlassian.net)                     |
| `JSM_EMAIL`                  | —   | yes  | JSM user email                                       |
| `JSM_API_TOKEN`              | —   | yes  | JSM API token                                        |
| `JSM_SERVICEDESK_ID`         | —   | yes  | JSM service desk ID                                  |
| `JSM_REQUEST_TYPE_ID`        | —   | yes  | JSM request type ID                                  |
| `JIRA_WEBHOOK_SECRET`        | —   | yes  | Inbound Jira webhook signature verification (API)    |
| `JSM_WEBHOOK_SECRET`         | —   | yes  | Inbound JSM webhook signature verification (API)     |
| `M365_CLIENT_STATE`          | —   | yes  | Inbound M365 webhook validation state (API)          |
| `METRICS_TOKEN`              | yes | yes  | Bearer gate for `GET /metrics`; **required for the Prometheus scrape** (an empty token makes the scrape 404 and false-fires `MCTServiceDown`) |
| `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` | yes | yes | External **dead-man's-switch** heartbeat URL, not on the droplet (IR-P0-003); prod deploys fail closed when empty, dev warns |
| `ALERTMANAGER_CRITICAL_WEBHOOK_URL` | yes | yes | Critical-alert webhook — the ntfy `portal-alerts` topic in the deployed environment (deploy warns, does not fail, when empty: NOTIF-P2-011) |
| `ALERTMANAGER_DEFAULT_WEBHOOK_URL` | opt | opt | Catch-all webhook for non-critical alerts — ntfy `portal-alerts` in the deployed environment |
| `ALERTMANAGER_SLACK_API_URL` | opt | opt | Slack incoming-webhook URL used by the default/critical receivers (fallback) |
| `ALERTMANAGER_WEBHOOK_USER`  | yes | yes  | Basic-auth user for the critical/default webhooks (ntfy relay user `portal-relay`) |
| `ALERTMANAGER_WEBHOOK_PASS`  | yes | yes  | Basic-auth password for the above (secret)           |

`M365_WEBHOOK_SECRET` is retired — inbound M365 webhooks validate with
`M365_CLIENT_STATE` (the single authoritative M365 secret).

## Secrets required by the database backup / restore workflows

`db-backup.yml` and `db-restore-test.yml` attach `environment: dev` for
scheduled runs. DATA-P2-010 adds prod targets: a dispatch with
`environment: prod` (from `main` only) attaches the approval-gated
`prod-approval` environment, and when the operator sets the
`PROD_BACKUP_ENABLED` variable the schedule attaches `prod-backup` instead of
`dev` (create it with the prod rows below and **no** required reviewers — an
approval-gated environment would leave the unattended run waiting).
`storage-backup.yml`, `storage-restore-test.yml` and
`backup-staleness-check.yml` still attach `environment: dev`.

`operator` in the Prod column means the secret must be provisioned by an
operator in the environment the prod job attaches before prod backups can run.

| Secret                    | Dev | Prod | Purpose                                               |
| ------------------------- | --- | ---- | ----------------------------------------------------- |
| `SUPABASE_DB_URL`         | yes | operator | Direct database connection string for `pg_dump`; also the write path for the DR-P2-008 platform heartbeat |
| `AWS_ACCESS_KEY_ID`       | yes | operator | S3/Spaces key for backup upload and restore download; falls back to `DO_SPACES_ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY`   | yes | operator | S3/Spaces secret for backup upload and restore; falls back to `DO_SPACES_SECRET_ACCESS_KEY` |
| `BACKUP_ENCRYPTION_KEY`   | yes | operator | openssl passphrase encrypting/decrypting backup objects (`db-backup.yml`, `db-restore-test.yml`, storage backup) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | —  | Supabase Storage REST access for `scripts/backup-storage.sh` |
| `S3_BACKUP_BUCKET`        | yes | operator | **Legacy** full-URI/bucket name holding backups; prefer the `S3_BUCKET` variable. Accepted (normalised) by the restore paths for backwards compatibility |
| `NTFY_ALERTS_URL`         | yes | operator | ntfy topic URL for backup/storage-backup/restore-test failure notifications (primary channel) |
| `NTFY_ALERTS_USER`        | yes | operator | ntfy basic-auth user for the above (write-only relay user) |
| `NTFY_ALERTS_PASS`        | yes | operator | ntfy basic-auth password for the above (secret)      |
| `SLACK_WEBHOOK_URL`       | yes | operator | Slack webhook for backup/restore failure notifications (fallback; ntfy is primary) |

### Backup location contract

The write path and every read path use the same two names (audit
DR-P1-002 / IR-P1-005):

| Name        | Shape                        | Default                  |
| ----------- | ---------------------------- | ------------------------ |
| `S3_BUCKET` | bucket **name** (no `s3://`) | `mainecybertech-backups` |
| `S3_PREFIX` | key prefix (no leading `/`)  | `database-backups`       |

Full object path: `s3://${S3_BUCKET}/${S3_PREFIX}/<file>`. Set these as
repository **variables** (Settings → Secrets and variables → Actions →
Variables). Optional offsite copy: `S3_OFFSITE_BUCKET` /
`S3_OFFSITE_PREFIX`. See `docs/ROLLBACK_PROCEDURES.md` §3a.

The backup/restore workflows attach the **`dev` environment**, so
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` resolve from it, and the `AWS_*`
credentials fall back to its `DO_SPACES_*` keys (Spaces is S3-compatible).
`S3_ENDPOINT` (variable) overrides the default Spaces endpoint
(`https://nyc3.digitaloceanspaces.com`) for real AWS S3 or another region.

## Secrets required by other workflows

| Secret                    | Dev | Prod | Purpose                                                                       |
| ------------------------- | --- | ---- | ----------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`   | yes | yes  | Supabase CLI auth for `supabase link` / `db push` (`supabase-migrations.yml`) |
| `CHROMATIC_PROJECT_TOKEN` | yes | yes  | Chromatic visual-regression upload (`chromatic.yml`; the job fails on a broken Storybook build or a visual change once a baseline exists) |
| `E2E_JWT_SECRET`          | opt | opt  | Optional E2E JWT secret; `e2e.yml` falls back to a built-in test value        |
| `BRANCH_PROTECTION_READ_TOKEN` | yes | yes | Repo-wide fine-grained PAT with `Administration: read` (+ `Contents`/`Pull requests`/`Checks: read`) for `branch-protection-audit.yml` (BP-P2-002/003); the default `GITHUB_TOKEN` cannot read classic branch protection |
| `LOAD_TEST_AUTH_TOKEN`    | opt | opt  | JWT for the authenticated k6 scenarios (`tickets`/`sse` in `load-test.yml`); required when dispatching those scenarios |
| `LOAD_TEST_TEST_EMAIL`    | opt | opt  | Test-account email for the `auth` k6 scenario (`load-test.yml`)               |
| `LOAD_TEST_TEST_PASSWORD` | opt | opt  | Test-account password for the `auth` k6 scenario (`load-test.yml`)            |
| `CODEOWNERS_READ_TOKEN`   | opt | opt  | Optional fine-grained PAT with **Organization → Members: read**; lets `scripts/ci/check-codeowners.sh` resolve every `@org/team` handle in `.github/CODEOWNERS` via the API. Without it the guard runs the documented syntax-only fallback (BP-P3-005) |
| `SMOKE_EMAIL` / `SMOKE_PASSWORD` | opt | opt | Dedicated read-only, non-MFA smoke account for `smoke-check.yml` (TEST-P3-002); until provisioned the authenticated read is reported skipped. Set on `dev` (the smoke job's environment) or repo-wide |

> `SCHEDULE_DISPATCH_TOKEN` was retired with `backup-dispatch.yml`
> (CI-P2-010): the backup workflows are scheduled on the default branch, so
> no dispatcher token is needed. Revoke any token provisioned for it.

## Repository or environment variables required by workflows

| Variable                         | Dev | Prod | Purpose                                                       |
| -------------------------------- | --- | ---- | ------------------------------------------------------------- |
| `SUPABASE_PROJECT_REF`           | yes | yes  | Supabase project reference for migrations                     |
| `DROPLET_IP`                     | opt | opt  | Optional droplet IPv4 fallback when the DO API/Terraform fail |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes | yes  | Turnstile site key baked into the web image build arg         |
| `NEXT_PUBLIC_SENTRY_DSN`         | opt | opt  | Web Sentry DSN (public by design) baked into the web image build arg and passed to the web service env; falls back to the `SENTRY_DSN` secret when unset (OBS-P2-011) |
| `ALERTMANAGER_SLACK_CHANNEL`     | opt | opt  | Slack channel name for Alertmanager receivers (non-secret; e.g. `#alerts`) |
| `S3_BUCKET`                      | —   | yes  | Backup bucket **name** (see contract above)                   |
| `S3_PREFIX`                      | —   | yes  | Backup key prefix (default `database-backups`)                |
| `S3_OFFSITE_BUCKET`              | opt | opt  | Second destination for an offsite/cross-region backup copy    |
| `S3_OFFSITE_PREFIX`              | opt | opt  | Prefix on the offsite bucket (defaults to `S3_PREFIX`)        |
| `PROD_BACKUP_ENABLED`            | —   | opt  | Set to `true` to point the scheduled `db-backup` / `db-restore-test` runs at production (attaches `prod-backup`; DATA-P2-010) |
| `STORAGE_BUCKETS`                | yes | —    | Storage buckets to back up (default `documents avatars logos`) |
| `LOAD_TEST_API_URL`              | opt | opt  | Override the load-test API base URL for all runs (defaults: dev `https://api.mainecybertech.us`, prod `https://api.mainecybertech.com`) |
| `UPTIME_PROBE_TARGETS`           | opt | opt  | JSON target list overriding `scripts/uptime/probe-targets.json` for the external uptime probe |
| `UPTIME_PROBE_ENABLED`           | opt | opt  | Set to `false` to pause the scheduled external uptime probe (manual dispatch still runs) |
| `SMOKE_PROD_ENABLED`             | —   | opt  | Set to `true` to include prod in the scheduled `smoke-check.yml` run (once the prod environment exists); dispatch can always choose the target (TEST-P3-002) |
| `SMOKE_DEV_API_BASE` / `SMOKE_DEV_WEB_BASE` / `SMOKE_PROD_API_BASE` / `SMOKE_PROD_WEB_BASE` | opt | opt | Optional base-URL overrides for the smoke check |

## GitHub Environment Configuration Steps

1. **Create environments** in GitHub Settings → Environments:
   - `dev` — no protection rules
   - `prod` — no protection rules; read-only `resolve-ip` / `terraform-plan`
     jobs only. Nothing under `prod` mutates, so no required reviewers.
   - `prod-approval` — **add Required reviewers (1+)** to gate every prod
     mutation: app deploy, prod Terraform apply, and prod DB migrations
     (`supabase-migrations.yml` on `main`, BP-P3-003). This is the single gate
     for all production changes; it **must be configured in GitHub and cannot
     be set from the repo**. None are configured yet, so prod jobs currently
     start without pausing. The production deploy and migration secrets/vars
     below must be available to `prod-approval` (scoped to it or repo-wide).
   - `prod-backup` — used by the scheduled prod `db-backup` /
     `db-restore-test` runs when `PROD_BACKUP_ENABLED=true` (DATA-P2-010).
     Add the prod backup secrets below and **no** required reviewers: an
     unattended scheduled backup must not wait for a human. Dispatch-based prod
     runs still attach `prod-approval`, so the approval gate remains for
     manual runs.

2. **Add secrets** to the appropriate environment scopes (or repo-wide):
   - `DO_API_TOKEN` — from DigitalOcean dashboard
   - `DO_SSH_FINGERPRINT` — from DigitalOcean SSH keys page
   - `DO_SPACES_ACCESS_KEY_ID` / `DO_SPACES_SECRET_ACCESS_KEY` — from DO Spaces
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — S3/Spaces credentials for backup and restore (the backup/restore workflows also accept the `dev` environment's `DO_SPACES_*` keys as fallback)
   - `SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY` — in the **`dev`** environment,
     where the scheduled `db-backup.yml` / `db-restore-test.yml` /
     `storage-backup.yml` runs execute (DR-P0-001); also provision the prod
     copies in `prod-backup` (and make them available to `prod-approval`) to
     activate the prod backup target (DATA-P2-010)
   - `CLOUDFLARE_API_TOKEN` — from Cloudflare dashboard
   - `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_ZONE_ID_US` — from Cloudflare dashboard
   - `CI_SSH_PRIVATE_KEY` — private key (e.g. `cat ~/.ssh/id_rsa`) for droplet SSH access
   - `CF_ORIGIN_CERT` / `CF_ORIGIN_KEY` — from Cloudflare Origin CA
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard
   - `SUPABASE_ACCESS_TOKEN` — from the Supabase dashboard (CLI migrations); the prod copy must be available to `prod-approval`, where the `main` migration job runs (BP-P3-003)
   - `JWT_SECRET` — generate a secure random string
   - `REDIS_PASSWORD`, `FIELD_ENCRYPTION_KEY`, `TURNSTILE_SECRET_KEY`, `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED` — deployment/runtime config forwarded by `deploy-do.yml`
   - `METRICS_TOKEN` — bearer token shared by the API `/metrics` gate and the Prometheus scrape; required wherever the compose stack runs (dev and `prod-approval`)
   - `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` — external dead-man's-switch heartbeat URL (not on the droplet); **required for prod** (deploys fail closed without it), dev warns
   - `ALERTMANAGER_CRITICAL_WEBHOOK_URL` / `ALERTMANAGER_DEFAULT_WEBHOOK_URL` / `ALERTMANAGER_WEBHOOK_USER` / `ALERTMANAGER_WEBHOOK_PASS` — Alertmanager → ntfy `portal-alerts` delivery (see `docs/MONITORING_AND_ALERTING.md` §9)
   - `NTFY_ALERTS_URL` / `NTFY_ALERTS_USER` / `NTFY_ALERTS_PASS` — ntfy notifications for the backup / storage-backup / restore-test / staleness-check workflows (Slack remains a fallback)
   - `BRANCH_PROTECTION_READ_TOKEN` — repo-wide fine-grained PAT with **Administration: read** on this repository (plus `Contents: read`, `Pull requests: read`, `Checks: read`); used by `branch-protection-audit.yml` to compare the committed JSON with the live branch protection and to audit bypasses. The default `GITHUB_TOKEN` cannot read classic branch protection, so the drift/bypass jobs fail closed until this exists (BP-P2-002/003; see `docs/RUNBOOK_EMERGENCY_MERGE.md`)
   - `CODEOWNERS_READ_TOKEN` — optional fine-grained PAT with **Organization → Members: read**; enables the CODEOWNERS team-handle resolution in the shared unit-tests guard (BP-P3-005). Without it the guard validates syntax only
   - `SMOKE_EMAIL` / `SMOKE_PASSWORD` — optional read-only, non-MFA smoke account for `smoke-check.yml` (TEST-P3-002); set on `dev` or repo-wide
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard
   - `CHROMATIC_PROJECT_TOKEN` — from the Chromatic project (visual regression)
   - `LOAD_TEST_AUTH_TOKEN` / `LOAD_TEST_TEST_EMAIL` / `LOAD_TEST_TEST_PASSWORD` — optional; required only to dispatch the authenticated k6 scenarios in `load-test.yml`
   - Integration secrets as needed (Jira, JSM, M365, SMTP, Sentry, Teams webhooks)

3. **Add variables** to the appropriate environment scopes (or repo-wide):
   - `SUPABASE_PROJECT_REF` — Supabase project reference for migrations
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Turnstile site key baked into the web build
   - `NEXT_PUBLIC_SENTRY_DSN` — web Sentry DSN (same value as `SENTRY_DSN`;
     Sentry DSNs are public by design). Required for web error tracking in
     production (OBS-P2-011). `deploy-do.yml` prefers this variable and falls
     back to the repo-scoped `SENTRY_DSN` secret; if neither is visible to the
     `build-web` job the web build has no DSN and browser errors go unreported.
   - `DROPLET_IP` — optional droplet IPv4 fallback (dev has it set; add to `prod` when known)
   - `LOAD_TEST_API_URL` — optional override of the k6 load-test base URL
   - `UPTIME_PROBE_TARGETS` / `UPTIME_PROBE_ENABLED` — optional external-uptime-probe target override / schedule pause switch
   - `SMOKE_PROD_ENABLED` / `SMOKE_DEV_API_BASE` / `SMOKE_DEV_WEB_BASE` / `SMOKE_PROD_API_BASE` / `SMOKE_PROD_WEB_BASE` — smoke-check target enablement and base-URL overrides (TEST-P3-002)
   - `S3_BUCKET`, `S3_PREFIX`, `STORAGE_BUCKETS` — in the **`dev`** environment,
     where the backup/restore workflows read them (see the backup location
     contract above)
