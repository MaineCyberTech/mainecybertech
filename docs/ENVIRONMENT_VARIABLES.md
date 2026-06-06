# Environment Variables Reference

> All environment variables across all services in the MCT monorepo.
>
> See `apps/api/.env.example`, `apps/web/.env.example`, `apps/worker/.env.example` for minimal starter configs.

## Web (`apps/web`)

| Variable                 | Required | Default       | Description                                                   |
| ------------------------ | -------- | ------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`    | Yes      | —             | URL of the API server (e.g. `http://localhost:4000`)          |
| `NODE_ENV`               | No       | `development` | Node environment                                              |
| `NEXT_PUBLIC_GA_ID`      | No       | —             | Google Analytics measurement ID (e.g. `G-XXXXXXXXXX`)         |
| `NEXT_PUBLIC_TAWKTO_ID`  | No       | —             | Tawk.to widget ID (e.g. `66898d27e1e4f70f24ee3260/1i24kuosn`) |
| `NEXT_PUBLIC_SENTRY_DSN` | No       | —             | Sentry DSN for error tracking                                 |
| `SENTRY_ORG`             | No       | —             | Sentry org slug (for source maps)                             |
| `SENTRY_PROJECT`         | No       | —             | Sentry project slug (for source maps)                         |

> **Note:** The web app no longer requires `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Auth is proxied through the API via `POST /api/v1/auth/callback`.

## API (`apps/api`)

| Variable                     | Required | Default                      | Description                                                    |
| ---------------------------- | -------- | ---------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`                   | No       | `development`                | Node environment                                               |
| `API_PORT`                   | No       | `4000`                       | Port the API server listens on                                 |
| `SUPABASE_URL`               | Yes      | —                            | Supabase project URL (e.g. `http://127.0.0.1:54321` for local) |
| `SUPABASE_ANON_KEY`          | Yes      | —                            | Supabase publishable/anon key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes      | —                            | Supabase service role key (admin access)                       |
| `JWT_SECRET`                 | No       | —                            | JWT signing secret (optional; Supabase handles JWT by default) |
| `CORS_ORIGIN`                | Yes      | `*`                          | Allowed CORS origin (e.g. `http://localhost:3000`)             |
| `LOG_LEVEL`                  | No       | `info`                       | Logging level (`debug`, `info`, `warn`, `error`)               |
| `SMTP_HOST`                  | No       | —                            | SMTP host for email sending                                    |
| `SMTP_PORT`                  | No       | `587`                        | SMTP port                                                      |
| `SMTP_USER`                  | No       | —                            | SMTP username                                                  |
| `SMTP_PASS`                  | No       | —                            | SMTP password                                                  |
| `EMAIL_FROM`                 | No       | `noreply@mainecybertech.com` | From address for outgoing emails                               |
| `SENTRY_DSN`                 | No       | —                            | Sentry DSN for error tracking                                  |
| `PUBLIC_TRAFFIC_WEBHOOK_URL` | No       | —                            | Teams webhook URL for visitor notifications (marketing site)   |
| `PUBLIC_LEAD_WEBHOOK_URL`    | No       | —                            | Teams webhook URL for new lead notifications (marketing site)  |
| `JSM_DOMAIN`                 | No       | —                            | JSM domain for auto-ticket creation from web leads             |
| `JSM_EMAIL`                  | No       | —                            | JSM user email for API auth                                    |
| `JSM_API_TOKEN`              | No       | —                            | JSM API token                                                  |
| `JSM_SERVICEDESK_ID`         | No       | —                            | JSM service desk ID                                            |
| `JSM_REQUEST_TYPE_ID`        | No       | —                            | JSM request type ID                                            |
| `STRIPE_WEBHOOK_SECRET`      | No       | —                            | Stripe webhook signing secret for signature verification       |
| `API_BASE_URL`               | No       | —                            | Public API base URL for notification links (in .env.example)   |

## Worker (`apps/worker`)

| Variable                    | Required | Default                      | Description                                    |
| --------------------------- | -------- | ---------------------------- | ---------------------------------------------- |
| `NODE_ENV`                  | No       | `development`                | Node environment                               |
| `LOG_LEVEL`                 | No       | `info`                       | Logging level                                  |
| `SUPABASE_URL`              | Yes      | —                            | Supabase project URL                           |
| `SUPABASE_ANON_KEY`         | No       | —                            | Supabase publishable/anon key                  |
| `SUPABASE_SERVICE_ROLE_KEY` | No       | —                            | Supabase service role key (for task DB access) |
| `WORKER_CONCURRENCY`        | No       | `10`                         | Max concurrent jobs                            |
| `WORKER_TIMEOUT`            | No       | `30000`                      | Job timeout in ms                              |
| `SQS_QUEUE_URL`             | No       | —                            | SQS queue URL for task processing              |
| `STRIPE_SECRET_KEY`         | No       | —                            | Stripe API key for billing reconciliation      |
| `JIRA_BASE_URL`             | No       | —                            | Jira instance base URL                         |
| `JIRA_EMAIL`                | No       | —                            | Jira user email                                |
| `JIRA_API_TOKEN`            | No       | —                            | Jira API token                                 |
| `JSM_BASE_URL`              | No       | —                            | Jira Service Management base URL               |
| `JSM_EMAIL`                 | No       | —                            | JSM user email                                 |
| `JSM_API_TOKEN`             | No       | —                            | JSM API token                                  |
| `M365_TENANT_ID`            | No       | —                            | Microsoft 365 tenant ID                        |
| `M365_CLIENT_ID`            | No       | —                            | Microsoft 365 app client ID                    |
| `M365_CLIENT_SECRET`        | No       | —                            | Microsoft 365 app client secret                |
| `SMTP_HOST`                 | No       | —                            | SMTP host for email notifications              |
| `SMTP_PORT`                 | No       | `587`                        | SMTP port                                      |
| `SMTP_USER`                 | No       | —                            | SMTP username                                  |
| `SMTP_PASS`                 | No       | —                            | SMTP password                                  |
| `EMAIL_FROM`                | No       | `noreply@mainecybertech.com` | From address for outgoing emails               |
| `API_BASE_URL`              | No       | —                            | Public API base URL for notification links     |
| `HEALTH_PORT`               | No       | `3001`                       | Health check server port                       |

## E2E Tests (`apps/web/e2e`)

| Variable             | Required | Default                 | Description                   |
| -------------------- | -------- | ----------------------- | ----------------------------- |
| `E2E_BASE_URL`       | No       | `http://localhost:3000` | Base URL for Playwright tests |
| `E2E_ADMIN_EMAIL`    | Yes      | —                       | Admin email for login         |
| `E2E_ADMIN_PASSWORD` | Yes      | —                       | Admin password for login      |

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
