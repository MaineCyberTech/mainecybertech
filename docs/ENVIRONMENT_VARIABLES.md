# Environment Variables Reference

> All environment variables across all services in the MCT monorepo.
>
> See `apps/api/.env.example`, `apps/web/.env.example`, `apps/worker/.env.example` for minimal starter configs.
>
> All three apps load **`.env.local`** for local development (API/Worker via explicit `dotenv.config()`, Web via Next.js convention). Docker Compose also references `.env.local` via `env_file`. Run `pwsh scripts/sync_supabase_env.auto.v2.ps1` to populate local Supabase connection values.

## Web (`apps/web`)

| Variable                                | Required | Default                | Description                                                                                 |
| --------------------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                   | Yes      | —                      | URL of the API server (e.g. `http://localhost:4000`)                                        |
| `NODE_ENV`                              | No       | `development`          | Node environment                                                                            |
| `NEXT_PUBLIC_GA_ID`                     | No       | —                      | Google Analytics measurement ID (e.g. `G-XXXXXXXXXX`)                                       |
| `NEXT_PUBLIC_TAWKTO_ID`                 | No       | —                      | Tawk.to widget ID (e.g. `66898d27e1e4f70f24ee3260/1i24kuosn`)                               |
| `NEXT_PUBLIC_SENTRY_DSN`                | No       | —                      | Sentry DSN for error tracking                                                               |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | No       | `0.2` prod / `0` other | Client-side Sentry trace sample rate (0–1); invalid values use the default                  |
| `NEXT_PUBLIC_SENTRY_RELEASE`            | No       | `NEXT_PUBLIC_GIT_SHA`  | Client-side Sentry release identifier                                                       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`        | No       | —                      | Cloudflare Turnstile site key (contact form captcha)                                        |
| `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED`     | No       | `false`                | Show the `/test-accounts` dev login page (localhost/`.us` only)                             |
| `NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD`     | No       | `1`                    | Password used by the `/test-accounts` dev login page; **never set in production or CI**     |
| `NEXT_PUBLIC_APP_VERSION`               | No       | `0.0.0-dev`            | App version string shown by the web app (injected as a build arg by `deploy-do.yml`)        |
| `NEXT_PUBLIC_GIT_SHA`                   | No       | `local`                | Git commit SHA of the build (shown in version info)                                         |
| `NEXT_PUBLIC_BUILD_TIME`                | No       | version.json           | Build timestamp persisted to `public/version.json` (`apps/web/scripts/generate-version.js`) |
| `NEXT_PUBLIC_LOG_LEVEL`                 | No       | `info`                 | Minimum client-side log level (`debug`, `info`, `warn`, `error`, `silent`)                  |
| `NEXT_PUBLIC_LOG_ENDPOINT`              | No       | —                      | Optional POST endpoint receiving client-side log entries                                    |
| `SENTRY_ORG`                            | No       | —                      | Sentry org slug (for source maps)                                                           |
| `SENTRY_PROJECT`                        | No       | —                      | Sentry project slug (for source maps)                                                       |
| `SENTRY_TRACES_SAMPLE_RATE`             | No       | `0.2` prod / `0` other | Server-side Sentry trace sample rate (0–1)                                                  |
| `SENTRY_RELEASE`                        | No       | `NEXT_PUBLIC_GIT_SHA`  | Server-side Sentry release identifier                                                       |

> **Note:** The web app no longer requires `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Auth is proxied through the API via `POST /api/v1/auth/callback`.

## API (`apps/api`)

| Variable                     | Required | Default                      | Description                                                                                                                                                                                                         |
| ---------------------------- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                   | No       | `development`                | Node environment                                                                                                                                                                                                    |
| `API_PORT`                   | No       | `4000`                       | Port the API server listens on                                                                                                                                                                                      |
| `APP_BASE_URL`               | No       | `http://localhost:3000`      | Public-facing base URL for email notification links                                                                                                                                                                 |
| `SUPABASE_URL`               | Yes      | —                            | Supabase project URL (e.g. `http://127.0.0.1:54321` for local)                                                                                                                                                      |
| `SUPABASE_ANON_KEY`          | Yes      | —                            | Supabase publishable/anon key                                                                                                                                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes      | —                            | Supabase service role key (admin access)                                                                                                                                                                            |
| `JWT_SECRET`                 | Yes      | —                            | JWT signing secret (required; multi-secret rotation via comma-separated values)                                                                                                                                     |
| `CORS_ORIGIN`                | No       | `http://localhost:3000`      | Allowed CORS origin; comma-separated for multiple (deploy includes `app.*` + `www.*`)                                                                                                                               |
| `APP_DOMAIN`                 | No       | `app.mainecybertech.com`     | Public app domain (used by Caddy reverse proxy and APP_BASE_URL)                                                                                                                                                    |
| `API_DOMAIN`                 | No       | `api.mainecybertech.com`     | Public API domain (used by Caddy reverse proxy and worker API_BASE_URL)                                                                                                                                             |
| `LOG_LEVEL`                  | No       | `info`                       | Logging level (`debug`, `info`, `warn`, `error`)                                                                                                                                                                    |
| `SMTP_HOST`                  | No       | —                            | SMTP host for email sending                                                                                                                                                                                         |
| `SMTP_PORT`                  | No       | `587`                        | SMTP port                                                                                                                                                                                                           |
| `SMTP_USER`                  | No       | —                            | SMTP username                                                                                                                                                                                                       |
| `SMTP_PASS`                  | No       | —                            | SMTP password                                                                                                                                                                                                       |
| `EMAIL_FROM`                 | No       | `noreply@mainecybertech.com` | From address for outgoing emails                                                                                                                                                                                    |
| `SENTRY_DSN`                 | No       | —                            | Sentry DSN for error tracking                                                                                                                                                                                       |
| `SENTRY_TRACES_SAMPLE_RATE`  | No       | `0.2` prod / `0` otherwise   | Sentry trace sample rate (0–1)                                                                                                                                                                                      |
| `SENTRY_RELEASE`             | No       | `GIT_SHA`                    | Sentry release identifier (defaults to `process.env.GIT_SHA`)                                                                                                                                                       |
| `PUBLIC_TRAFFIC_WEBHOOK_URL` | No       | —                            | Teams webhook URL for visitor notifications (marketing site)                                                                                                                                                        |
| `PUBLIC_LEAD_WEBHOOK_URL`    | No       | —                            | Teams webhook URL for new lead notifications (marketing site)                                                                                                                                                       |
| `JSM_DOMAIN`                 | No       | —                            | JSM domain for auto-ticket creation from web leads                                                                                                                                                                  |
| `JSM_EMAIL`                  | No       | —                            | JSM user email for API auth                                                                                                                                                                                         |
| `JSM_API_TOKEN`              | No       | —                            | JSM API token                                                                                                                                                                                                       |
| `JSM_SERVICEDESK_ID`         | No       | —                            | JSM service desk ID                                                                                                                                                                                                 |
| `JSM_REQUEST_TYPE_ID`        | No       | —                            | JSM request type ID                                                                                                                                                                                                 |
| `STRIPE_SECRET_KEY`          | No       | —                            | Stripe secret key for API calls and sync endpoint                                                                                                                                                                   |
| `STRIPE_WEBHOOK_SECRET`      | No       | —                            | Stripe webhook signing secret for signature verification                                                                                                                                                            |
| `REDIS_URL`                  | No       | —                            | Redis URL for caching, idempotency, and BullMQ (required in production)                                                                                                                                             |
| `REDIS_PASSWORD`             | No       | —                            | Redis password (required in production; used by docker-compose and worker)                                                                                                                                          |
| `TURNSTILE_SECRET_KEY`       | No       | —                            | Cloudflare Turnstile secret; when set, `POST /public/submit` requires a valid captcha token                                                                                                                         |
| `TASK_QUEUE_ENABLED`         | No       | `false`                      | When `true`, API enqueues background tasks instead of running them inline                                                                                                                                           |
| `RLS_READS_ENABLED`          | No       | —                            | Comma-separated module keys that use the user-scoped (RLS) Supabase client for reads (see `docs/RLS-rollout.md`)                                                                                                    |
| `RLS_WRITES_ENABLED`         | No       | —                            | Comma-separated module keys that use the user-scoped (RLS) client for writes                                                                                                                                        |
| `JIRA_WEBHOOK_SECRET`        | No       | —                            | Jira webhook secret for HMAC signature verification                                                                                                                                                                 |
| `JSM_WEBHOOK_SECRET`         | No       | —                            | JSM webhook secret for HMAC signature verification                                                                                                                                                                  |
| `MFA_ENFORCEMENT_ENABLED`    | No       | `false`                      | When `true`, an `aal1` session that has a verified TOTP factor is rejected with `403 MFA_REQUIRED` on non-`/auth/*` routes. Users without a factor are never blocked. Requires MFA enabled on the Supabase project. |
| `FIELD_ENCRYPTION_KEY`       | No       | —                            | AES-256-GCM key for encrypted PII fields (`profiles.encrypted_pii`). Falls back to a dev `plain:` marker when unset.                                                                                                |
| `METRICS_TOKEN`              | No       | —                            | When set, `GET /metrics` requires `Authorization: Bearer <token>` (returns 404 otherwise).                                                                                                                          |
| `M365_CLIENT_STATE`          | No       | —                            | Shared clientState validated on inbound M365 change notifications. This is the only M365 webhook credential; Graph does not HMAC-sign payloads, so there is no `M365_WEBHOOK_SECRET`.                              |

## Worker (`apps/worker`)

| Variable                    | Required | Default                      | Description                                                                     |
| --------------------------- | -------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`                  | No       | `development`                | Node environment                                                                |
| `LOG_LEVEL`                 | No       | `info`                       | Logging level                                                                   |
| `SUPABASE_URL`              | Yes      | —                            | Supabase project URL (required for task DB access)                              |
| `SUPABASE_ANON_KEY`         | Yes      | —                            | Supabase publishable/anon key                                                   |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | —                            | Supabase service role key (for task DB access)                                  |
| `WORKER_CONCURRENCY`        | No       | `10`                         | Max concurrent jobs                                                             |
| `WORKER_TIMEOUT`            | No       | `30000`                      | Job timeout in ms                                                               |
| `QUEUE_BACKEND`             | No       | `inline`                     | Queue backend (`inline`, `sqs`, or `bullmq`; set to `bullmq` in docker-compose) |
| `SQS_QUEUE_URL`             | No       | —                            | SQS queue URL for task processing                                               |
| `STRIPE_SECRET_KEY`         | No       | —                            | Stripe API key for billing reconciliation                                       |
| `JIRA_BASE_URL`             | No       | —                            | Jira instance base URL                                                          |
| `JIRA_EMAIL`                | No       | —                            | Jira user email                                                                 |
| `JIRA_API_TOKEN`            | No       | —                            | Jira API token                                                                  |
| `JSM_BASE_URL`              | No       | —                            | Jira Service Management base URL                                                |
| `JSM_EMAIL`                 | No       | —                            | JSM user email                                                                  |
| `JSM_API_TOKEN`             | No       | —                            | JSM API token                                                                   |
| `M365_TENANT_ID`            | No       | —                            | Microsoft 365 tenant ID                                                         |
| `M365_CLIENT_ID`            | No       | —                            | Microsoft 365 app client ID                                                     |
| `M365_CLIENT_SECRET`        | No       | —                            | Microsoft 365 app client secret                                                 |
| `SMTP_HOST`                 | No       | —                            | SMTP host for email notifications                                               |
| `SMTP_PORT`                 | No       | `587`                        | SMTP port                                                                       |
| `SMTP_USER`                 | No       | —                            | SMTP username                                                                   |
| `SMTP_PASS`                 | No       | —                            | SMTP password                                                                   |
| `EMAIL_FROM`                | No       | `noreply@mainecybertech.com` | From address for outgoing emails                                                |
| `API_BASE_URL`              | No       | —                            | Public API base URL for notification links                                      |
| `HEALTH_PORT`               | No       | `3001`                       | Health check server port                                                        |
| `REDIS_URL`                 | No       | —                            | Redis URL for BullMQ (`QUEUE_BACKEND=bullmq`)                                   |
| `REDIS_PASSWORD`            | No       | —                            | Redis password (production)                                                     |
| `TASK_QUEUE_ENABLED`        | No       | `false`                      | When `true`, API enqueues tasks instead of inline                               |
| `SENTRY_DSN`                | No       | —                            | Sentry DSN for worker error tracking                                            |
| `SENTRY_TRACES_SAMPLE_RATE` | No       | `0.2` prod / `0` otherwise   | Sentry trace sample rate (0–1)                                                  |
| `SENTRY_RELEASE`            | No       | `GIT_SHA`                    | Sentry release identifier (defaults to `process.env.GIT_SHA`)                   |
| `APP_BASE_URL`              | No       | —                            | Public app base URL for notification links                                      |

## E2E Tests (`apps/web/e2e`)

| Variable             | Required | Default                 | Description                   |
| -------------------- | -------- | ----------------------- | ----------------------------- |
| `E2E_BASE_URL`       | No       | `http://localhost:3000` | Base URL for Playwright tests |
| `E2E_ADMIN_EMAIL`    | Yes      | —                       | Admin email for login         |
| `E2E_ADMIN_PASSWORD` | Yes      | —                       | Admin password for login      |

## CI-only variables

Set in GitHub (repository or environment scoped), never in local `.env` files.
See [`GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)
for the full deployment/terraform secret list.

| Variable                  | Used by                                | Purpose                                                                  |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `E2E_JWT_SECRET`          | `e2e.yml`                              | Optional JWT secret for the E2E API; falls back to a built-in test value |
| `SUPABASE_ACCESS_TOKEN`   | `supabase-migrations.yml`              | Supabase CLI auth for `supabase link` / `supabase db push`               |
| `CHROMATIC_PROJECT_TOKEN` | `chromatic.yml`                        | Chromatic visual-regression upload (best-effort job)                     |
| `AWS_ACCESS_KEY_ID`       | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml` | S3/Spaces key for backup upload and restore download |
| `AWS_SECRET_ACCESS_KEY`   | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml` | S3/Spaces secret for backup upload and restore       |
| `S3_BUCKET`               | backup/restore workflows and scripts   | Backup bucket **name** (contract: `docs/ROLLBACK_PROCEDURES.md` §3a)     |
| `S3_PREFIX`               | backup/restore workflows and scripts   | Backup key prefix (default `database-backups`)                           |
| `S3_OFFSITE_BUCKET`       | `db-backup.yml`, `storage-backup.yml`  | Optional second destination for an offsite copy                          |
| `BACKUP_ENCRYPTION_KEY`   | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml` | openssl passphrase encrypting backups; secret, never printed |
| `SUPABASE_URL`            | `storage-backup.yml`                   | Supabase project URL for the Storage REST API                            |
| `SUPABASE_SERVICE_ROLE_KEY` | `storage-backup.yml`                 | Service-role key for Storage list/download/upload (already a deploy secret) |
| `SLACK_WEBHOOK_URL`       | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml` | Slack notification when a backup or restore test fails |

## CI / Docker

The deploy workflow (`deploy-do.yml`) writes the runtime env to `/opt/mct-portal/.env` on the DO droplet via SSH heredoc. `infra/digitalocean/docker-compose.yml` interpolates that file for the values it references in each service's `environment:` block.

Web `NEXT_PUBLIC_*` vars are passed as Docker build args for client-side inlining, and set as runtime env vars for server-side use.

## Docker Compose

The `docker-compose.yml` uses `.env.local` files per service:

- `apps/api/.env.local`
- `apps/web/.env.local`
- `apps/worker/.env.local`

The E2E container uses environment variables directly in the compose file.

## Local Supabase

When running Supabase locally (`supabase start`), sync env vars with:

```bash
# Sync to a specific service's .env.local
pwsh scripts/sync_supabase_env.auto.v2.ps1 -UseNpx -Framework nextjs -EnvFile apps/api/.env.local
```

Local Supabase provides these values at `http://127.0.0.1:54321`:

- `API_URL` / `PROJECT_URL`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `DB_URL`
- `STUDIO_URL`

## Notifications (`notifications` table)

| Field             | Type         | Description                                                                                                 |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `id`              | UUID         | Primary key                                                                                                 |
| `user_id`         | UUID         | Notification recipient                                                                                      |
| `organization_id` | UUID?        | Scope to organization                                                                                       |
| `title`           | Text         | Short notification title                                                                                    |
| `body`            | Text         | Notification body content                                                                                   |
| `module`          | Text         | Entity type (`tickets`, `projects`, `documents`, `billing`, `system`)                                       |
| `module_id`       | Text?        | Reference to the specific entity                                                                            |
| `action`          | Text         | Event type (`created`, `updated`, `assigned`, `due_soon`, `overdue`, `comment`, `mention`, `status_change`) |
| `read`            | Boolean      | Read status                                                                                                 |
| `read_at`         | Timestamptz? | When the notification was read                                                                              |
| `created_at`      | Timestamptz  | Creation timestamp                                                                                          |

## Jira / JSM Integration

Full documentation in [`docs/JIRA_JSM_INTEGRATION.md`](JIRA_JSM_INTEGRATION.md).

### Webhook endpoints

| Endpoint                     | Source | Action                                                    |
| ---------------------------- | ------ | --------------------------------------------------------- |
| `POST /api/v1/webhooks/jira` | Jira   | Syncs `project_tasks` status by `external_jira_issue_key` |
| `POST /api/v1/webhooks/jsm`  | JSM    | Syncs `tickets` status by `external_jsm_issue_key`        |

### Sync fields

| Table           | Jira/JSM Field                   | MCT Column |
| --------------- | -------------------------------- | ---------- |
| `project_tasks` | `external_jira_issue_key`        | PKEY       |
| `project_tasks` | `issuetype.name` → `issue_type`  |
| `project_tasks` | `priority.name` → `priority`     |
| `project_tasks` | `labels[]` → `labels`            |
| `project_tasks` | `parent.key` → `epic_key`        |
| `project_tasks` | `resolution.name` → `resolution` |
| `project_tasks` | `customfield_10007` → `sprint`   |
| `tickets`       | `external_jsm_issue_key`         | PKEY       |
| `tickets`       | `labels[]` → `labels`            |
| `tickets`       | `resolution.name` → `resolution` |

## Billing & Stripe

Full documentation in [`docs/BILLING.md`](BILLING.md).

| Variable            | Service | Required          | Description                                    |
| ------------------- | ------- | ----------------- | ---------------------------------------------- |
| `STRIPE_SECRET_KEY` | Worker  | For reconcile     | Stripe secret API key                          |
| `STRIPE_SECRET_KEY` | API     | For sync endpoint | Stripe secret API key for `POST /billing/sync` |

### Database tables

| Table               | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `billing_customers` | Maps organizations to Stripe customer IDs                   |
| `subscriptions`     | Active/past subscription records with plan + billing period |
| `invoices`          | Invoice line items with status, amounts, PDF links          |
| `payments`          | Payment records linked to invoices                          |

### Webhook endpoint

| Endpoint                       | Source | Action                                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/webhooks/stripe` | Stripe | Upserts invoices, subs, customers from `invoice.paid`, `customer.subscription.*`, `checkout.session.completed` |

## Organization Branding

Full documentation in [`docs/ORG_BRANDING.md`](ORG_BRANDING.md).

Branding columns on `organizations` table:

| Column          | Type   | Description               |
| --------------- | ------ | ------------------------- |
| `logo_url`      | text   | Public URL to org logo    |
| `brand_color`   | text   | Primary brand color (hex) |
| `accent_color`  | text   | Accent color (hex)        |
| `custom_domain` | citext | Custom portal domain      |

Storage bucket `logos` (public) for logo uploads. API endpoint `POST /api/v1/organizations/:id/logo` handles multipart uploads. PATCH `/api/v1/organizations/:id` accepts all branding fields.
