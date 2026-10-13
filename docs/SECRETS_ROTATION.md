# Secrets Rotation Policy & Runbook

**Owner:** platform/security · **Last reviewed:** 2026-10-12 · **Review cadence:** quarterly (see [Automation](#automation))

## Overview

All secrets must be rotated periodically to limit exposure from credential
leaks. Secrets live as **GitHub Environment Secrets** and are injected into the
DO droplet `.env` file at deploy time by `deploy-do.yml`; backup, migration and
Terraform jobs read them directly from their environment.

> **Environment secrets do not inherit.** A secret set on one GitHub
> environment is invisible to a job attached to another environment. Setting a
> value on `prod` when the consuming job runs under `prod-approval` (or the
> reverse) is a **silent no-op** — the job keeps reading the old value, which is
> exactly what an emergency rotation must not do. Always set the value on the
> environment the consuming job actually attaches (table below), then run the
> [post-rotation verification](#post-rotation-verification). Since BP-P3-003
> every prod mutation (deploy, Terraform apply, DB migrations) runs under
> `prod-approval`; `prod` is read-only.

> **Emergency revocation / break-glass:** the IT-level runbook (revocation
> points per credential, break-glass paths, escrow requirements and the drill
> record) is [`SECRET_ROTATION_RUNBOOK.md`](SECRET_ROTATION_RUNBOOK.md).

### Consuming environments (source of truth)

| Consuming job(s)                                                                          | Workflow                                                                                    | Prod environment | Dev environment |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------- | --------------- |
| App deploy (`deploy`)                                                                     | `deploy-do.yml`                                                                             | `prod-approval`  | `dev`           |
| Droplet IP resolve (`resolve-ip`, read-only)                                              | `deploy-do.yml`                                                                             | `prod`           | `dev`           |
| Terraform plan                                                                            | `terraform-do.yml`                                                                          | `prod`           | `dev`           |
| Terraform apply                                                                           | `terraform-do.yml`                                                                          | `prod-approval`  | `dev`           |
| Prod DB migrations                                                                        | `supabase-migrations.yml`                                                                   | `prod-approval`  | `dev`           |
| Backups / restore tests / staleness check                                                 | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml`, `storage-restore-test.yml`, `backup-staleness-check.yml` | — (dev only)     | `dev`           |
| Alert-path exercise                                                                       | `alert-path-exercise.yml`                                                                   | `prod-approval`  | `dev`           |
| Image build/publish                                                                       | `build-push.yml`                                                                            | repo scope       | repo scope      |

A secret may instead be provisioned **repo-wide** (visible to every job); then
no `--env` flag is needed and `gh secret set NAME` is correct. These procedures
name the environment the consuming job attaches — if the secret is repo-wide,
set it repo-wide and record that in the Rotation Log.

The environment/provisioning steps for each scope are in
[`GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md).

## Secrets Inventory

| #   | Secret                        | Used By                      | Rotation Frequency                              | Source                                                    |
| --- | ----------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| 1   | `SUPABASE_URL`                | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 2   | `SUPABASE_ANON_KEY`           | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 3   | `SUPABASE_SERVICE_ROLE_KEY`   | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 4   | `JWT_SECRET`                  | API (verification only — Supabase signs) | Every 90 days (see zero-downtime procedure)     | API verification copy of the Supabase project JWT signing secret, HS256 (see `docs/JWT_ROTATION.md`) |
| 5   | `STRIPE_SECRET_KEY`           | API                          | Every 90 days                                   | Stripe Dashboard → Developers → API Keys                  |
| 6   | `STRIPE_WEBHOOK_SECRET`       | API                          | Every 90 days                                   | Stripe Dashboard → Developers → Webhooks → endpoint       |
| 7   | `SENTRY_DSN`                  | API, Worker, Web             | Every 180 days                                  | Sentry Dashboard → Settings → Client Keys                 |
| 8   | `SMTP_HOST`                   | API, Worker                  | Every 180 days                                  | Email provider dashboard                                  |
| 9   | `SMTP_PORT`                   | API, Worker                  | Every 180 days                                  | Email provider dashboard                                  |
| 10  | `SMTP_USER`                   | API, Worker                  | Every 180 days                                  | Email provider dashboard                                  |
| 11  | `SMTP_PASS`                   | API, Worker                  | Every 180 days                                  | Email provider dashboard                                  |
| 12  | `EMAIL_FROM`                  | API, Worker                  | Every 180 days                                  | Determined by org — rarely rotated                        |
| 13  | `JIRA_BASE_URL`               | Worker                       | Every 180 days                                  | Jira instance URL — rarely changes                        |
| 14  | `JIRA_EMAIL`                  | Worker                       | Every 180 days                                  | Jira user email — rarely changes                          |
| 15  | `JIRA_API_TOKEN`              | Worker                       | Every 90 days                                   | Jira → Profile → Security → API tokens                    |
| 16  | `JSM_BASE_URL`                | API                          | Every 180 days                                  | JSM instance URL — rarely changes                         |
| 17  | `M365_TENANT_ID`              | Worker                       | Never (infrastructure)                          | Azure tenant ID — static                                  |
| 18  | `M365_CLIENT_ID`              | Worker                       | Every 180 days                                  | Azure Portal → App registrations                          |
| 19  | `M365_CLIENT_SECRET`          | Worker                       | Every 180 days                                  | Azure Portal → App registrations → Certificates & secrets |
| 20  | `PUBLIC_TRAFFIC_WEBHOOK_URL`  | API                          | As needed (compromise only)                     | Teams Incoming Webhook connector                          |
| 21  | `PUBLIC_LEAD_WEBHOOK_URL`     | API                          | As needed (compromise only)                     | Teams Incoming Webhook connector                          |
| 22  | `JSM_DOMAIN`                  | API                          | Every 180 days                                  | Atlassian cloud domain — rarely changes                   |
| 23  | `JSM_EMAIL`                   | API                          | Every 180 days                                  | JSM user email — rarely changes                           |
| 24  | `JSM_API_TOKEN`               | API                          | Every 90 days                                   | Atlassian → API tokens                                    |
| 25  | `JSM_SERVICEDESK_ID`          | API                          | Never (infrastructure)                          | JSM project ID — static                                   |
| 26  | `JSM_REQUEST_TYPE_ID`         | API                          | Never (infrastructure)                          | JSM request type ID — static                              |
| 27  | `CI_SSH_PRIVATE_KEY`          | Deploy                       | Every 90 days                                   | `ssh-keygen -t ed25519` — add public key to DO droplet    |
| 28  | `DO_API_TOKEN`                | Terraform, Deploy            | Every 180 days                                  | DigitalOcean → API → Tokens                               |
| 29  | `DO_SSH_FINGERPRINT`          | Terraform                    | Every 90 days (when CI_SSH_PRIVATE_KEY rotates) | `ssh-keygen -lf` of the new key                           |
| 30  | `CF_ORIGIN_CERT`              | Deploy                       | Every 180 days                                  | Cloudflare → SSL/TLS → Origin Server                      |
| 31  | `CF_ORIGIN_KEY`               | Deploy                       | Every 180 days                                  | Cloudflare → SSL/TLS → Origin Server                      |
| 32  | `CLOUDFLARE_API_TOKEN`        | Terraform                    | Every 180 days                                  | Cloudflare → My Profile → API Tokens                      |
| 33  | `CLOUDFLARE_ZONE_ID`          | Terraform                    | Never (infrastructure)                          | Cloudflare zone ID — static                               |
| 34  | `CLOUDFLARE_ZONE_ID_US`       | Terraform                    | Never (infrastructure)                          | Cloudflare zone ID — static                               |
| 35  | `DO_SPACES_ACCESS_KEY_ID`     | Terraform                    | Every 180 days                                  | DigitalOcean → Spaces → Access Keys                       |
| 36  | `DO_SPACES_SECRET_ACCESS_KEY` | Terraform                    | Every 180 days                                  | DigitalOcean → Spaces → Access Keys                       |
| 37  | `SUPABASE_DB_URL`             | db-backup workflow           | On password rotation                            | Supabase Dashboard → Settings → Database                  |
| 38  | `SUPABASE_ACCESS_TOKEN`       | supabase-migrations workflow | Every 90 days                                   | Supabase → Account → Access Tokens                        |
| 39  | `AWS_ACCESS_KEY_ID`           | db-backup workflow           | Every 180 days                                  | AWS IAM User → Security Credentials                       |
| 40  | `AWS_SECRET_ACCESS_KEY`       | db-backup workflow           | Every 180 days                                  | AWS IAM User → Security Credentials                       |
| 41  | `BACKUP_ENCRYPTION_KEY`       | db-backup, db-restore-test, storage-backup | Only with a re-encryption plan (see below) | `openssl rand -base64 48`                                 |
| 42  | `JIRA_WEBHOOK_SECRET`         | API                          | Every 90 days                                   | Jira → Webhooks → secret                                  |
| 43  | `JSM_WEBHOOK_SECRET`          | API                          | Every 90 days                                   | JSM → Webhooks → secret                                   |
| 44  | `M365_CLIENT_STATE`           | API                          | Every 90 days                                   | `openssl rand -hex 16` (single authoritative M365 secret; `M365_WEBHOOK_SECRET` is retired) |
| 45  | `TURNSTILE_SECRET_KEY`        | API                          | Every 180 days                                  | Cloudflare Turnstile → Settings → Secret Key              |
| 46  | `METRICS_TOKEN`               | API                          | Every 90 days                                   | `openssl rand -hex 32` (optional `/metrics` gate)         |
| 47  | `FIELD_ENCRYPTION_KEY`        | API                          | Only with a re-encryption plan (see below)      | `openssl rand -hex 32`                                    |
| 48  | `SCHEDULE_DISPATCH_TOKEN`     | retired (was backup-dispatch) | — (retired)                                     | Retired with `backup-dispatch.yml` (CI-P2-010); revoke or let any provisioned token expire |
| 49  | Outbound webhook signing secret (`webhook_endpoints.secret`, per endpoint) | API, Worker | Every 90 days (advisory `secret_expires_at`) | Admin UI or `PATCH /api/v1/webhook-endpoints/:id` (generate with `openssl rand -hex 32`) |
| 50  | `GHCR_TOKEN`                  | Deploy (image pull on droplet) | Never on a schedule (ephemeral `secrets.GITHUB_TOKEN`) | Automatic per-run token; if ever replaced by a PAT, rotate in GitHub → Developer settings → Personal access tokens |
| 51  | `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` | Deploy (Alertmanager dead-man's switch) | Every 180 days or on provider rotation | External heartbeat provider console (e.g. Healthchecks.io check URL) |
| 52  | `ALERTMANAGER_CRITICAL_WEBHOOK_URL` | Deploy (critical alerts) | Every 180 days                                   | ntfy `portal-alerts` topic (or the receiver provider)     |
| 53  | `ALERTMANAGER_DEFAULT_WEBHOOK_URL` | Deploy (default alerts) | Every 180 days                                  | ntfy `portal-alerts` topic (or the receiver provider)     |
| 54  | `ALERTMANAGER_SLACK_API_URL`  | Deploy (Slack fallback receiver) | Every 180 days                              | Slack app → Incoming Webhooks                             |
| 55  | `ALERTMANAGER_WEBHOOK_USER`   | Deploy (basic auth for critical/default webhooks) | Every 180 days (with PASS)      | ntfy relay account (`portal-relay`)                       |
| 56  | `ALERTMANAGER_WEBHOOK_PASS`   | Deploy (basic auth for critical/default webhooks) | Every 180 days                  | ntfy relay account (`portal-relay`)                       |
| 57  | `NTFY_ALERTS_URL`             | Backups, restore tests, staleness check, alert-path exercise | Every 180 days             | ntfy topic URL (`portal-alerts` or a dedicated alerts topic) |
| 58  | `NTFY_ALERTS_USER`            | Same as 57 (write-only relay) | Every 180 days                                 | ntfy relay account                                        |
| 59  | `NTFY_ALERTS_PASS`            | Same as 57 (write-only relay) | Every 180 days                                 | ntfy relay account                                        |
| 60  | `DO_SSH_HOST_KEY`             | Deploy (post-deploy smoke, rollback) | When the droplet is rebuilt or its host key changes | `ssh-keyscan -t ed25519 <droplet-ip>`            |

## Rotation Procedures

### BACKUP_ENCRYPTION_KEY — Handle with care (backups depend on it)

`BACKUP_ENCRYPTION_KEY` is the openssl passphrase that encrypts database and
storage backup objects at rest (audit DR-P1-003). It is a GitHub Environment
Secret in **`dev`** (the backup/restore workflows attach `dev`; audit
SECRET-P1-003); it is never printed and must never be committed.

**Rotating this key immediately makes every existing `.enc` backup
undecryptable** unless the new key is introduced in a way that keeps the old
key available. Do **not** rotate on a schedule like other secrets.

Safe rotation procedure:

1. Set the new key under a second name and re-encrypt existing objects, **or**
   keep the previous passphrase available to the restore tooling during a
   transition (e.g. decrypt with the old key, re-upload encrypted with the new).
2. Only after all retained backup objects (database **and** storage, primary
   **and** offsite) have been re-encrypted may the old passphrase be discarded.
3. Run `db-restore-test.yml` after rotation and confirm it decrypts and passes.

**Loss of this key means permanent loss of encrypted backups.** Store a
break-glass copy of the current key in the agreed escrow location (see
[`DATA_BREACH_RESPONSE.md`](DATA_BREACH_RESPONSE.md) / emergency rotation)
before relying on it.

### FIELD_ENCRYPTION_KEY — Handle with care (PII depends on it)

`FIELD_ENCRYPTION_KEY` is the AES-256-GCM key that encrypts `profiles.encrypted_pii`
and outbound webhook signing secrets (`webhook_endpoints.secret`) at rest
(`apps/api/src/lib/field-encryption.ts`). Rotating it **immediately makes every
existing `encrypted_pii` value and `v1:` webhook secret undecryptable** unless
the rows are re-encrypted. Webhook deliveries whose secret cannot be decrypted
fail closed (recorded failed + dead-lettered, never sent unsigned).

Safe rotation procedure:

1. Generate the new key (`openssl rand -hex 32`) and keep the old one available
   during the transition.
2. Re-encrypt existing rows with the new key using the backfill script
   (`node scripts/backfill-profile-pii.mjs` — it reads the plaintext columns and
   writes a fresh `encrypted_pii` copy).
3. Re-set each outbound webhook endpoint secret (`PATCH /api/v1/webhook-endpoints/:id`
   with the same secret value) so it is re-encrypted under the new key.
4. Verify a sample of profiles decrypt correctly and a webhook test delivery
   (`POST /api/v1/webhook-endpoints/:id/test`) succeeds, then discard the old key.
5. Store a break-glass copy of the current key in the agreed escrow location.

### Outbound webhook signing secrets (`webhook_endpoints.secret`)

Per-endpoint HMAC signing secrets are stored **encrypted at rest** (AES-256-GCM,
`v1:` payloads) and carry `secret_rotated_at` / `secret_expires_at` metadata
(default expiry: rotated_at + 90 days; override with `secretExpiresAt` on
create/update). Expiry is advisory — it does not gate delivery.

Rotate one endpoint (no deploy required):

```
curl -X PATCH https://api.mainecybertech.com/api/v1/webhook-endpoints/<id> \
  -H "Authorization: Bearer <session>" -H "If-Match: <version>" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<new 32-byte hex>"}'
```

Update the receiver to the new secret first (or in the same change window), then
PATCH. Find secrets due/overdue for rotation:

```sql
select id, organization_id, name, secret_rotated_at, secret_expires_at
from public.webhook_endpoints
where secret is not null
  and (secret_expires_at is null or secret_expires_at < now())
order by secret_expires_at nulls first;
```

Endpoints created before the encryption rollout store legacy plaintext secrets;
re-encrypt them by re-setting the secret once via the PATCH above.

### Supabase project JWT signing secret (the actual signer)

Sessions are **signed by Supabase**, not by this repository (`grep -rn "jwt.sign" apps packages`
has no matches). The Supabase project JWT signing secret is the authoritative
credential; `JWT_SECRET` in GitHub is only the API's verification copy.

1. Record the time and the operator.
2. Supabase Dashboard → **Project Settings → JWT Keys** (older dashboards:
   Settings → API → JWT Settings) → rotate the signing secret/key material.
   This immediately invalidates every access token signed with the old secret.
3. Update the API verification copy — `JWT_SECRET` on the consuming environment
   (`prod-approval` for prod, `dev` for dev) — to the new value (see the
   zero-downtime procedure below when you can pre-stage the new value).
4. Deploy `deploy-do.yml` to the affected environment and confirm health.
5. Revoke refresh sessions for a full force-logout (rotating the signing secret
   invalidates access tokens; refresh tokens are separate):
   per user via the Supabase Auth admin API (`auth.admin.signOut(jwt, 'global')`),
   or in bulk for the affected users by removing their rows from
   `auth.refresh_tokens`/`auth.sessions` in the SQL editor.
6. Verify: an access token signed with the old secret is rejected; a fresh login
   works; record the rotation in the [Rotation Log](#rotation-log) with evidence.

Full procedure and overlap-window guidance:
[`JWT_ROTATION.md`](JWT_ROTATION.md).

### JWT_SECRET — Zero-Downtime Multi-Secret Rotation (API verification copy)

The API supports comma-separated `JWT_SECRET` values and **only verifies** HS256
tokens against them (first entry tried first); Supabase signs. Keep the list in
sync with the Supabase signing secret — the comma list is only the overlap
window, not a second signer. See [`JWT_ROTATION.md`](JWT_ROTATION.md).

Scheduled rotation (pre-stage the new value, then switch the signer):

1. **Generate the new secret** in Supabase (do not apply it yet) or with
   `openssl rand -base64 32` if your Supabase project uses the legacy symmetric
   secret.
2. **Pre-stage the API copy**: `gh secret set JWT_SECRET --env prod-approval --body "<new>,<old>"`
   (prod) / `--env dev --body "<new>,<old>"` (dev), then deploy
   (`gh workflow run deploy-do.yml --ref main -f deploy_target=prod`). No token
   is signed with `<new>` yet.
3. **Switch the signer**: rotate the Supabase project JWT signing secret to
   `<new>` (see above). New tokens are signed with `<new>`; tokens signed with
   `<old>` still verify against the second list entry.
4. **Wait past the Supabase access-token lifetime** (configured in Supabase →
   Auth; do **not** assume a `JWT_EXPIRY` variable — it does not exist in this
   repository).
5. **Remove the old value** from `JWT_SECRET` (`<new>` only) and deploy again.
6. **Verify**: a token signed with `<old>` is rejected; new logins work.

Emergency rotation must **not** keep the compromised value in the list — see
[Emergency Rotation](#emergency-rotation).

### SUPABASE Keys (URL, ANON_KEY, SERVICE_ROLE_KEY)

1. **Supabase Dashboard** → Settings → API → regenerate the key(s)
2. **Update GitHub Environment Secrets** on the consuming environment:
   `gh secret set SUPABASE_URL --env prod-approval` (prod) / `--env dev` (dev);
   same for `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
3. **Trigger `deploy-do.yml`** — the `.env` file on the droplet is rewritten with new values
4. **Verify** — check `/health` endpoint and application functionality
5. **Note:** service role key change may briefly affect admin operations until deploy completes

### Stripe Keys (SECRET_KEY, WEBHOOK_SECRET)

1. **Stripe Dashboard** → Developers → API Keys → Roll secret key
2. **Stripe Dashboard** → Developers → Webhooks → endpoint → Roll signing secret
3. **Update GitHub Environment Secrets** on the consuming environment
   (`--env prod-approval` for prod, `--env dev` for dev): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
4. **Trigger `deploy-do.yml`**
5. **Revoke old keys** in Stripe Dashboard after successful deploy
6. **Verify** — create a test invoice / subscription

### SMTP Credentials (HOST, PORT, USER, PASS, EMAIL_FROM)

1. **Email provider dashboard** → Generate new app password or API key
2. **Update GitHub Environment Secrets** on the consuming environment
   (`--env prod-approval` for prod, `--env dev` for dev): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
3. **Trigger `deploy-do.yml`**
4. **Verify** — use the admin "Send Test Email" button on the notification preferences page
5. **Revoke old password** in email provider dashboard

### SSH Keys (CI_SSH_PRIVATE_KEY, DO_SSH_FINGERPRINT, DO_SSH_HOST_KEY)

1. **Generate new key pair:**
   ```
   ssh-keygen -t ed25519 -f mct-deploy-key -C "github-actions-deploy"
   ```
2. **Add public key** to the droplet:
   ```
   ssh root@<droplet-ip> "echo 'PUBLIC_KEY_CONTENT' >> ~/.ssh/authorized_keys"
   ```
3. **Update GitHub Environment Secrets** on the consuming environment
   (`--env prod-approval` for prod, `--env dev` for dev): `CI_SSH_PRIVATE_KEY`
   (private key contents)
4. **Update `DO_SSH_FINGERPRINT`** (Terraform's DO-registered SSH key) on the
   consuming environment **if the rotated keypair is the one registered with
   DigitalOcean**: `ssh-keygen -lf mct-deploy-key.pub`
5. **Update `DO_SSH_HOST_KEY`** (the pinned droplet host key used by the
   post-deploy smoke check and `scripts/rollback.sh`) on the consuming
   environment when the droplet is rebuilt:
   ```
   ssh-keyscan -t ed25519 <droplet-ip>
   ```
6. **Trigger `deploy-do.yml`** to verify connectivity (the deploy pins
   `DO_SSH_HOST_FINGERPRINT`; a mismatch fails the run)
7. **Remove old public key** from `~/.ssh/authorized_keys` on droplet after successful deploy

### GHCR image-pull token (GHCR_TOKEN)

`deploy-do.yml` forwards `GHCR_TOKEN` (`${{ secrets.GITHUB_TOKEN }}`, the
per-run ephemeral token) to `docker login ghcr.io` on the droplet. It is not a
long-lived credential and is **not rotated on a schedule**.

1. Leave it as the automatic token; it is regenerated every workflow run.
2. If the deploy is ever changed to a long-lived PAT, rotate it in GitHub →
   Developer settings → Personal access tokens and update the secret on the
   consuming environment (`--env prod-approval` for prod, `--env dev` for dev).
3. On compromise of a PAT: revoke it in GitHub immediately, set the replacement,
   redeploy, and record the incident in the Rotation Log.

### Alertmanager / ntfy webhook credentials

The deployed Alertmanager delivers through `ALERTMANAGER_CRITICAL_WEBHOOK_URL` /
`ALERTMANAGER_DEFAULT_WEBHOOK_URL` (ntfy `portal-alerts`, basic auth via
`ALERTMANAGER_WEBHOOK_USER` / `ALERTMANAGER_WEBHOOK_PASS`) with
`ALERTMANAGER_SLACK_API_URL` as a Slack fallback; the backup/restore workflows
and the alert-path exercise use the separate `NTFY_ALERTS_*` credentials. See
[`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9.

1. **Rotate at the source first**:
   - ntfy relay account password (e.g. `portal-relay`) — if
     `ALERTMANAGER_WEBHOOK_USER` and `NTFY_ALERTS_USER` point at the same
     account, rotate the password once and update both secrets.
   - Slack incoming webhook → re-create the app webhook (Slack does not
     re-issue an existing URL).
   - Watchdog/heartbeat URL → regenerate the check URL at the provider.
2. **Set the secrets on the consuming environments** (prod deploy job reads
   `prod-approval`; backups and the dev exercise read `dev`):
   ```
   gh secret set ALERTMANAGER_WEBHOOK_PASS --env prod-approval --body "<new>"
   gh secret set NTFY_ALERTS_PASS          --env dev           --body "<new>"
   ```
   (same pattern for the other `ALERTMANAGER_*` / `NTFY_ALERTS_*` names that changed)
3. **Redeploy prod** (`gh workflow run deploy-do.yml --ref main -f deploy_target=prod`)
   so the droplet `.env` is rewritten; backup workflows pick the new value up on
   their next run.
4. **Verify** — run the alert-path exercise
   (`gh workflow run alert-path-exercise.yml -f environment=dev`) and confirm a
   notification is observed; confirm Alertmanager logs show no receiver failures
   (`docker compose logs alertmanager | grep -i fail`).
5. **Revoke the old credential** at the source and record the rotation with the
   run URL in the Rotation Log.

## Standard Rotation Steps (for all other secrets)

1. **Generate new secret** in the source system.
2. **Set the GitHub Environment Secret on the consuming environment** — use the
   [consuming-environment table](#consuming-environments-source-of-truth), not a
   reflexive `--env prod`:
   ```
   # prod app/integration/migration secrets (deploy, prod migrations, terraform apply):
   gh secret set SECRET_NAME --env prod-approval --body "NEW_VALUE"
   # dev app/integration secrets, backups, dev deploy:
   gh secret set SECRET_NAME --env dev --body "NEW_VALUE"
   # Read-only prod jobs (Terraform plan / resolve-ip; no mutation):
   gh secret set SECRET_NAME --env prod --body "NEW_VALUE"
   ```
3. **Trigger the consuming workflow** for the affected environment
   (`deploy-do.yml` for app secrets; the matching backup/terraform/migration
   workflow otherwise).
4. **Verify** per [Post-rotation verification](#post-rotation-verification).
5. **Revoke old secret** in the source system.
6. **Record** the rotation in the [Rotation Log](#rotation-log) with the
   evidence fields below.

## Emergency Rotation

If a secret is suspected compromised — break-glass access paths, per-credential
revocation points and the drill record are in
[`SECRET_ROTATION_RUNBOOK.md`](SECRET_ROTATION_RUNBOOK.md):

1. **Revoke immediately** in the source system (Stripe Dashboard, Supabase
   Dashboard, ntfy relay, GitHub PATs, etc.) — revocation preserves the audit trail.
2. **Generate new secret** at the source.
3. **Set it on the consuming environment** (see the
   [consuming-environment table](#consuming-environments-source-of-truth)) —
   `--env prod-approval` for the prod deploy, prod migrations and Terraform
   apply jobs, `--env prod` for the read-only plan/resolve jobs, `--env dev`
   for backups. A value set on an environment the job does not attach is a
   silent no-op:
   ```
   gh secret set SECRET_NAME --env prod-approval --body "NEW_VALUE"
   ```
4. **JWT/session material: rotate the Supabase project JWT signing secret
   first** (Supabase Dashboard → Project Settings → JWT Keys) — the API only
   verifies; Supabase signs. Do **not** retain the compromised value in the
   `JWT_SECRET` list during an incident. See [`JWT_ROTATION.md`](JWT_ROTATION.md)
   §Emergency.
5. **Trigger emergency deploy** — push to `main` or run `deploy-do.yml` via `workflow_dispatch`:
   ```
   gh workflow run deploy-do.yml --ref main -f deploy_target=prod
   ```
6. **Wait for deploy** (~8 min) and health check pass.
7. **Force logout all users** (if JWT/session material is involved): rotating the
   Supabase signing secret invalidates access tokens; also revoke refresh
   sessions (`auth.admin.signOut(jwt, 'global')` per user, or remove the
   affected rows from `auth.refresh_tokens`/`auth.sessions`). Rotating
   `SUPABASE_SERVICE_ROLE_KEY` does **not** invalidate user sessions.
8. **Check application logs** for unauthorized access patterns (Sentry, Caddy logs).
9. **Run the full-history secret scan** (`.github/workflows/secret-history-scan.yml`)
   to catch any other exposed material.
10. **Notify team** via Slack/email.
11. **Document** the incident and the rotation in the Rotation Log with the
    [evidence fields](#what-a-completed-rotation-records) (incident flag = Yes,
    incident issue linked).

### Emergency rollback

If a deploy fails after emergency rotation:

- **Revert** the GitHub Secret to the previous value (if still valid in source system)
- Or **restore** the old secret in the source system (if revokable)
- **Trigger re-deploy** with the restored value

## Rotation Evidence

The control is only delivered when a rotation leaves a record. `SECRET-P2-006`
is exactly the "documented but never exercised" gap; treat a rotation without a
log row (and its evidence) as a failed control.

**Current evidence state (2026-10-12, recorded honestly — SECRET-P3-004):** no
production secret has been rotated since initial deployment. The Rotation Log
contains the initial-deployment row and one dated environment-mapping dry-run;
there is no `gh secret list` timestamp or run URL showing a value change.
Expectations from here on:

- every real rotation adds a dated row with the fields below (run URL, operator
  handle, verification result) **before** the quarterly reminder issue is
  closed;
- the first stronger exercise is a live rotation of a non-critical `dev` secret
  (rotate → confirm the old value is rejected → record); a dry-run row alone
  does not close `SECRET-P2-006`;
- emergency revocations are recorded with `Incident? = Yes` and the incident
  link, following [`SECRET_ROTATION_RUNBOOK.md`](SECRET_ROTATION_RUNBOOK.md).

### What a completed rotation records

| Field              | What to record                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Date (UTC)         | When the new value was set                                                                         |
| Secret name(s)     | Exact GitHub secret name(s) — **never the value**                                                  |
| Environment(s)     | Consuming environment(s): `prod-approval`, `prod`, `dev`, or `repo-wide`                           |
| Operator           | GitHub handle of the person who ran the rotation                                                   |
| Run URL            | Link to the deploy/backup/terraform run that consumed the new value                                |
| Verification       | What was checked (health check, feature check, restore test, alert delivery) and the observed result |
| Old value revoked  | Yes/No + where it was revoked at the source                                                        |
| Incident flag      | `No` for scheduled; `Yes` + the incident issue link for emergency                                  |

### Post-rotation verification

Every rotation ends with proof the new value reached the consumer:

1. `gh secret list --env <consuming-env>` — confirm the secret's updated
   timestamp moved (and that the job's environment is the one you set).
2. Trigger the consuming workflow and confirm it succeeds with the new value:
   - App secrets → `deploy-do.yml` run is green, `https://api.mainecybertech.com/health`
     is healthy, and the affected feature works.
   - `BACKUP_ENCRYPTION_KEY` → `db-restore-test.yml` passes.
   - Terraform/Spaces secrets → the plan/apply run succeeds.
   - Alertmanager/ntfy → the alert-path exercise observes a notification.
3. For JWT material: a token signed with the removed/old secret must be
   rejected (negative check), and a fresh login must work.

### Dry-run exercise record

A **dry-run** walks the procedure without changing any value and records the
mapping check — the cheapest way to keep the runbook exercised between real
rotations. First recorded dry-run: **2026-10-12** (remediation PR
`fix/secrets-governance`; no secret value was read, printed, or changed):

- Checked every `gh secret set --env <env>` target in this document against the
  `environment:` of the workflow job that consumes the secret
  (`grep -n "environment:" .github/workflows/*.yml`).
- Classes exercised: Supabase JWT signing secret vs `JWT_SECRET` (API
  verification copy), GHCR (`GHCR_TOKEN`), `CI_SSH_PRIVATE_KEY` +
  `DO_SSH_FINGERPRINT` / `DO_SSH_HOST_KEY`, Stripe, SMTP, Alertmanager/ntfy
  webhooks.
- Result: every documented target matches the consuming job's environment; no
  `gh secret set` command was executed and no value changed.

Repeat the dry-run quarterly (same cadence as the reminder issue) and add the
result to the Rotation Log as a `dry-run` row. A real rotation in `dev` on a
non-critical secret is the stronger exercise — run one per quarter when an
operator is available (`SECRET-P2-006`).

## Automation

### Scheduled Rotation Reminder

`.github/workflows/secret-rotation-reminder.yml` creates a
`secret-rotation`-labeled issue on the 1st of Jan/Apr/Jul/Oct (09:00 UTC), or on
manual dispatch (`gh workflow run secret-rotation-reminder.yml`). It skips when
a reminder issue is already open, and the issue body carries the review
checklist and a link back to this document. Update the Rotation Log below as
part of closing it.

## Rotation Log

| Date                 | Secret(s) Rotated | Rotated By | Incident? | Environment | Evidence |
| -------------------- | ----------------- | ---------- | --------- | ----------- | -------- |
| (Initial deployment) | All               | —          | No        | dev, prod   | —        |
| 2026-10-12           | Environment-mapping dry-run: `JWT_SECRET`/Supabase signing secret, `GHCR_TOKEN`, `CI_SSH_PRIVATE_KEY`, `DO_SSH_FINGERPRINT`, `DO_SSH_HOST_KEY`, `STRIPE_*`, `SMTP_*`, `ALERTMANAGER_*`, `NTFY_ALERTS_*` (no values changed) | remediation dry-run (`fix/secrets-governance`) | No | dev, prod, prod-approval | This document, §Dry-run exercise record |

Update this table after each rotation event. Include the GitHub Actions run URL
in the Evidence column, the operator handle, and the verification performed; for
emergency rotations link the incident issue. Never paste secret values anywhere —
record names, environments and run links only. The `JWT_SECRET` field supports
comma-separated multi-secret values, so note only the primary secret when
recording a standard rotation.
