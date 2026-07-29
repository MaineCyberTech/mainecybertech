# Secrets Rotation Policy

## Overview

All secrets must be rotated periodically to limit exposure from credential leaks. Secrets are stored as **GitHub Environment Secrets** (`dev` / `prod` scopes) and injected into the DO droplet `.env` file at deploy time by the `deploy-do.yml` workflow. This document defines the rotation schedule, procedures, and rollback steps.

## Secrets Inventory

| #   | Secret                        | Used By                      | Rotation Frequency                              | Source                                                    |
| --- | ----------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| 1   | `SUPABASE_URL`                | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 2   | `SUPABASE_ANON_KEY`           | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 3   | `SUPABASE_SERVICE_ROLE_KEY`   | API, Worker                  | Every 90 days                                   | Supabase Dashboard → Settings → API                       |
| 4   | `JWT_SECRET`                  | API                          | Every 90 days (see zero-downtime procedure)     | `openssl rand -base64 32`                                 |
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

## Rotation Procedures

### JWT_SECRET — Zero-Downtime Multi-Secret Rotation

The API supports comma-separated `JWT_SECRET` values. The **first secret** is used for signing; **all secrets** are tried for verification. See `docs/JWT_ROTATION.md` for full details.

1. **Generate new secret:**

   ```
   openssl rand -base64 32
   ```

2. **Prepend to existing value** in GitHub Environment Secret (`dev` / `prod`):

   ```
   Before: JWT_SECRET=old-secret
   After:  JWT_SECRET=new-secret,old-secret
   ```

3. **Trigger deployment** — run `deploy-do.yml` (push or workflow_dispatch). New tokens signed with `new-secret`; old tokens still valid.

4. **Wait for token expiry** — default 24h (`JWT_EXPIRY`). After expiry, all clients have received new tokens signed with `new-secret`.

5. **Remove old secret** from GitHub Secret value:

   ```
   JWT_SECRET=new-secret
   ```

6. **Trigger deployment** again to finalize.

### SUPABASE Keys (URL, ANON_KEY, SERVICE_ROLE_KEY)

1. **Supabase Dashboard** → Settings → API → Regenerate key
2. **Update GitHub Environment Secrets** (`dev` / `prod`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. **Trigger `deploy-do.yml`** — the `.env` file on the droplet is rewritten with new values
4. **Verify** — check `/health` endpoint and application functionality
5. **Note:** Service role key change may briefly affect admin operations until deploy completes

### Stripe Keys (SECRET_KEY, WEBHOOK_SECRET)

1. **Stripe Dashboard** → Developers → API Keys → Roll secret key
2. **Stripe Dashboard** → Developers → Webhooks → endpoint → Roll signing secret
3. **Update GitHub Environment Secrets** (`dev` / `prod`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
4. **Trigger `deploy-do.yml`**
5. **Revoke old keys** in Stripe Dashboard after successful deploy
6. **Verify** — create a test invoice / subscription

### SMTP Credentials (HOST, PORT, USER, PASS, EMAIL_FROM)

1. **Email provider dashboard** → Generate new app password or API key
2. **Update GitHub Environment Secrets** (`dev` / `prod`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
3. **Trigger `deploy-do.yml`**
4. **Verify** — use the admin "Send Test Email" button on the notification preferences page
5. **Revoke old password** in email provider dashboard

### SSH Keys (CI_SSH_PRIVATE_KEY, DO_SSH_FINGERPRINT)

1. **Generate new key pair:**
   ```
   ssh-keygen -t ed25519 -f mct-deploy-key -C "github-actions-deploy"
   ```
2. **Add public key** to the droplet:
   ```
   ssh root@<droplet-ip> "echo 'PUBLIC_KEY_CONTENT' >> ~/.ssh/authorized_keys"
   ```
3. **Update GitHub Environment Secrets** (`dev` / `prod`): `CI_SSH_PRIVATE_KEY` (private key contents)
4. **Update GitHub Environment Secrets** (`dev` / `prod`): `DO_SSH_FINGERPRINT` (`ssh-keygen -lf mct-deploy-key.pub`)
5. **Trigger `deploy-do.yml`** to verify connectivity
6. **Remove old public key** from `~/.ssh/authorized_keys` on droplet after successful deploy

## Standard Rotation Steps (for all other secrets)

1. **Generate new secret** in the source system
2. **Update GitHub Environment Secret** (`dev` then `prod`):
   ```
   gh secret set SECRET_NAME --env dev --body "NEW_VALUE"
   gh secret set SECRET_NAME --env prod --body "NEW_VALUE"
   ```
3. **Trigger `deploy-do.yml`** for the affected environment
4. **Verify** the application works (health check, affected functionality)
5. **Revoke old secret** in the source system
6. **Log the rotation** in the Rotation Log table below

## Emergency Rotation

If a secret is suspected compromised:

1. **Revoke immediately** in the source system (Stripe Dashboard, Supabase Dashboard, etc.)
2. **Generate new secret**
3. **Update GitHub Environment Secret:**
   ```
   gh secret set JWT_SECRET --env prod --body "new-emergency-secret,old-secret"
   ```
4. **Trigger emergency deploy** — push to `main` or run `deploy-do.yml` via `workflow_dispatch`:
   ```
   gh workflow run deploy-do.yml --ref main -f deploy_target=prod
   ```
5. **Wait for deploy** (~8 min) and health check pass
6. **Force logout all users** (if JWT compromised): clear Supabase auth sessions or rotate `SUPABASE_SERVICE_ROLE_KEY`
7. **Check application logs** for unauthorized access patterns (Sentry, Caddy logs)
8. **Notify team** via Slack/email
9. **Document** the incident in the Rotation Log with incident details

### Emergency rollback

If a deploy fails after emergency rotation:

- **Revert** the GitHub Secret to the previous value (if still valid in source system)
- Or **restore** the old secret in the source system (if revokable)
- **Trigger re-deploy** with the restored value

## Automation

### Scheduled Rotation Reminder

A GitHub Actions scheduled workflow creates an issue quarterly:

```yaml
# .github/workflows/secret-rotation-reminder.yml
name: Secret Rotation Reminder
on:
  schedule:
    - cron: "0 9 1 */3 *" # Every 3 months on the 1st at 9am UTC
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create reminder issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Quarterly Secrets Rotation Due',
              body: 'Quarterly secrets rotation is due. See docs/SECRETS_ROTATION.md for the full inventory and procedures.',
              labels: ['ops', 'security']
            })
```

## Rotation Log

| Date                 | Secret(s) Rotated | Rotated By | Incident? | Environment |
| -------------------- | ----------------- | ---------- | --------- | ----------- |
| (Initial deployment) | All               | —          | No        | dev, prod   |

Update this table after each rotation event. Include the GitHub Actions run URL if applicable. The `JWT_SECRET` field supports comma-separated multi-secret values, so note only the primary secret when recording a standard rotation.
