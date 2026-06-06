# Billing & Invoicing

> Stripe-powered billing with invoice management, subscription tracking, and payment history.

## Architecture

```
Stripe API ──→ POST /api/v1/webhooks/stripe ──→ billing_customers / invoices / subscriptions
     ↑                                                   │
     │                                                   ↓
     └────── worker stripe-reconcile (batch) ←──── memberships (suspend on inactive)
```

## Database Schema

### `billing_customers`

| Column                   | Type   | Description                 |
| ------------------------ | ------ | --------------------------- |
| `id`                     | UUID   | PK                          |
| `organization_id`        | UUID   | FK → organizations (unique) |
| `stripe_customer_id`     | text   | Stripe customer ID (unique) |
| `billing_email`          | citext | Billing contact email       |
| `default_payment_method` | text   | Stripe payment method ID    |

### `subscriptions`

| Column                   | Type        | Description                                |
| ------------------------ | ----------- | ------------------------------------------ |
| `id`                     | UUID        | PK                                         |
| `organization_id`        | UUID        | FK → organizations                         |
| `stripe_subscription_id` | text        | Stripe sub ID (unique)                     |
| `plan_name`              | text        | Plan display name                          |
| `status`                 | text        | active, trialing, past_due, canceled, etc. |
| `current_period_start`   | timestamptz | Billing period start                       |
| `current_period_end`     | timestamptz | Billing period end                         |
| `amount_cents`           | bigint      | Amount in cents                            |
| `currency`               | text        | ISO currency code (default `usd`)          |

### `invoices`

| Column               | Type                  | Description                                     |
| -------------------- | --------------------- | ----------------------------------------------- |
| `id`                 | UUID                  | PK                                              |
| `organization_id`    | UUID                  | FK → organizations                              |
| `stripe_invoice_id`  | text                  | Stripe invoice ID (unique)                      |
| `invoice_number`     | text                  | Display number (e.g. `MCT-ACME-1001`)           |
| `status`             | `invoice_status` enum | draft, open, paid, void, uncollectible, overdue |
| `subtotal_cents`     | bigint                | Subtotal in cents                               |
| `tax_cents`          | bigint                | Tax in cents                                    |
| `total_cents`        | bigint                | Total in cents                                  |
| `currency`           | text                  | ISO currency code                               |
| `hosted_invoice_url` | text                  | Stripe hosted invoice page                      |
| `invoice_pdf_url`    | text                  | Invoice PDF download link                       |
| `due_at`             | timestamptz           | Payment due date                                |
| `paid_at`            | timestamptz           | Payment date                                    |

### `payments`

| Column                     | Type        | Description                |
| -------------------------- | ----------- | -------------------------- |
| `id`                       | UUID        | PK                         |
| `organization_id`          | UUID        | FK → organizations         |
| `invoice_id`               | UUID        | FK → invoices              |
| `stripe_payment_intent_id` | text        | Stripe PI ID (unique)      |
| `amount_cents`             | bigint      | Amount in cents            |
| `currency`                 | text        | ISO currency code          |
| `status`                   | text        | succeeded, failed, pending |
| `paid_at`                  | timestamptz | Payment timestamp          |

## API Endpoints

All endpoints at `/api/v1/billing/*`, require authentication.

| Method | Path                | Description                                                          |
| ------ | ------------------- | -------------------------------------------------------------------- |
| `GET`  | `/summary`          | Active subs, overdue/paid/total counts + recent 5 invoices           |
| `GET`  | `/invoices`         | Paginated invoice list, filterable by `organization_id` and `status` |
| `GET`  | `/invoices/:id`     | Single invoice detail                                                |
| `GET`  | `/subscriptions`    | All subscriptions, filterable by `organization_id`                   |
| `GET`  | `/payments`         | Paginated payment list with joined invoice data                      |
| `GET`  | `/billing-customer` | Single billing customer by `organization_id`                         |
| `POST` | `/sync`             | Admin-only: pulls latest invoices + subscriptions from Stripe API    |

## Webhook Handler

**File:** `apps/api/src/routes/webhooks.ts`

Stripe webhook `POST /api/v1/webhooks/stripe` handles:

- `invoice.paid` / `invoice.payment_failed` → upserts invoice to DB
- `customer.subscription.*` → upserts subscription to DB
- `checkout.session.completed` → creates/updates `billing_customers` via `client_reference_id`

Requires `stripe-signature` header (validated for presence).

## Worker Task: `stripe-reconcile`

**File:** `apps/worker/src/tasks/stripe-reconcile.ts`

Periodic batch task that:

1. Queries approved `memberships` with `stripe_subscription_id`
2. Fetches subscription status from Stripe API
3. Suspends memberships where subscription is no longer active

Configurable: `organizationId`, `dryRun`, `batchSize`.

## Portal Billing Page

**Route:** `/portal/billing`

Shows:

- Stat cards: Active Plans, Overdue, Paid, Total Invoices
- Active Plan section: plan name, price, billing period, status badge
- Billing Details: billing email, payment method
- Invoice table: number, date, amount (formatted currency), status pill, PDF/View links
- "Sync from Stripe" button

## SDK

**File:** `packages/sdk/src/billing.ts`

```typescript
client.billing.summary()                    // BillingSummary
client.billing.listInvoices(params?)         // PaginatedResult<Invoice>
client.billing.getInvoice(id)               // Invoice
client.billing.listSubscriptions(params?)    // Subscription[]
client.billing.listPayments(params?)         // PaginatedResult<Payment>
client.billing.getBillingCustomer(params?)   // BillingCustomer | null
client.billing.syncFromStripe(data?)         // { synced: number }
```

## Env Vars

| Variable            | Service | Required          | Description           |
| ------------------- | ------- | ----------------- | --------------------- |
| `STRIPE_SECRET_KEY` | Worker  | For reconcile     | Stripe secret API key |
| `STRIPE_SECRET_KEY` | API     | For sync endpoint | Stripe secret API key |

The `STRIPE_SECRET_KEY` env var is now defined in the **API** env schema (`apps/api/src/config/env.ts`) and validated via `getEnv()`. The API's `POST /billing/sync` endpoint uses the validated env var. For production, `STRIPE_SECRET_KEY` is stored in SSM Parameter Store and injected into the API ECS task definition via Terraform secrets.

## Permissions

Seeded in `5302028_seed_permissions.sql`:

- `billing.view` — View billing & invoices
- `billing.manage` — Manage billing settings

Super Admin gets all billing permissions. Admin gets view + manage.

## Migrations

| Migration                                                                 | Description                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql` | Base: `billing_customers`, `subscriptions`, `invoices`, `payments` tables + `invoice_status` enum + RLS |
| `5302028_seed_permissions.sql`                                            | Seeds `billing.view` + `billing.manage` permissions                                                     |
| `5302031_org_branding.sql`                                                | Adds `billing_email` on organizations (if not present)                                                  |
