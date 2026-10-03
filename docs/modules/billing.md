# Billing

**Category:** Portal + Admin
**API Routes:** `apps/api/src/routes/billing.ts`
**SDK:** `packages/sdk/src/billing.ts`

## Overview

Stripe-backed billing: invoices, subscriptions, payments, billing customer lookup, manual sync, and the Stripe customer portal session. Amounts are stored in Stripe minor units (cents) — no manual `*100` conversion (fixed in the 2026-08-01 audit).

## Key Features

- Invoice list + detail (org-scoped)
- Subscription list
- Payment list
- Billing customer lookup
- Manual Stripe sync (admin)
- Stripe billing portal session creation (redirect URL)
- Webhook-driven updates (`checkout.session.completed`, etc.) with signature verification

## Endpoints

| Method | Path                             | Description                       |
| ------ | -------------------------------- | --------------------------------- |
| GET    | /api/v1/billing/summary          | Billing summary for the org       |
| GET    | /api/v1/billing/invoices         | List invoices (org-scoped)        |
| GET    | /api/v1/billing/invoices/:id     | Get invoice by ID (org-scoped)    |
| GET    | /api/v1/billing/subscriptions    | List subscriptions                |
| GET    | /api/v1/billing/payments         | List payments                     |
| GET    | /api/v1/billing/billing-customer | Get billing customer              |
| POST   | /api/v1/billing/sync             | Manual Stripe sync (admin)        |
| POST   | /api/v1/billing/create-portal-session | Create Stripe billing portal URL |

## Data Model

Key tables: `billing_customers` (organization_id, stripe_customer_id, billing_email), `invoices`, `subscriptions`, `payments` (stripe objects mirrored with org scoping). Requires `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` env vars.

## Access Control

- All billing routes: `requireAuth` + `requireOrgAccess` (org-scoped by `organization_id`)
- Manual sync: `requireAdmin`
