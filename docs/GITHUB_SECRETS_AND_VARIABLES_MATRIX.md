# GitHub Secrets and Variables Matrix

## Recommended GitHub Environments

- `dev` — Dev deployments (no approval required)
- `prod` — Prod Terraform and Supabase migrations
- `prod-approval` — Prod deployment approval gate (requires 1+ reviewers)

Use environment-scoped values wherever possible.

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
| `JWT_SECRET`                 | yes | yes  | JWT signing secret                                   |
| `STRIPE_SECRET_KEY`          | yes | yes  | Stripe secret key for billing                        |
| `STRIPE_WEBHOOK_SECRET`      | yes | yes  | Stripe webhook signing secret                        |
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

## Secrets required by database backup workflow

| Secret              | Dev | Prod | Purpose                                         |
| ------------------- | --- | ---- | ----------------------------------------------- |
| `AWS_ROLE_ARN`      | —   | yes  | AWS OIDC role for S3 backup uploads             |
| `SUPABASE_DB_URL`   | —   | yes  | Direct database connection string for `pg_dump` |
| `SLACK_WEBHOOK_URL` | —   | yes  | Slack webhook for backup failure notifications  |

## Repository or environment variables required by deployment workflows

| Variable               | Dev | Prod | Purpose                                   |
| ---------------------- | --- | ---- | ----------------------------------------- |
| `SUPABASE_PROJECT_REF` | yes | yes  | Supabase project reference for migrations |

## GitHub Environment Configuration Steps

1. **Create environments** in GitHub Settings → Environments:
   - `dev` — no protection rules
   - `prod` — no protection rules
   - `prod-approval` — add Required reviewers (1+)

2. **Add secrets** to the appropriate environment scopes (or repo-wide):
   - `DO_API_TOKEN` — from DigitalOcean dashboard
   - `DO_SSH_FINGERPRINT` — from DigitalOcean SSH keys page
   - `DO_SPACES_ACCESS_KEY_ID` / `DO_SPACES_SECRET_ACCESS_KEY` — from DO Spaces
   - `CLOUDFLARE_API_TOKEN` — from Cloudflare dashboard
   - `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_ZONE_ID_US` — from Cloudflare dashboard
   - `CI_SSH_PRIVATE_KEY` — private key (e.g. `cat ~/.ssh/id_rsa`) for droplet SSH access
   - `CF_ORIGIN_CERT` / `CF_ORIGIN_KEY` — from Cloudflare Origin CA
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard
   - `JWT_SECRET` — generate a secure random string
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard
   - Integration secrets as needed (Jira, JSM, M365, SMTP, Sentry, Teams webhooks)

3. **Add variables** to the appropriate environment scopes (or repo-wide):
   - `SUPABASE_PROJECT_REF` — Supabase project reference for migrations
