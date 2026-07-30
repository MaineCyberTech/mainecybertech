# Prompt 29 — Billing, Payments, and Reconciliation Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Billing Pages
- Portal billing page: `apps/web/app/(portal)/portal/billing/page.tsx` + `BillingPageClient.tsx`
- Admin org billing viewer: `apps/web/app/(admin)/admin/organizations/[orgId]/billing/page.tsx` + `AdminBillingClient.tsx`
- Both pages display invoices, subscriptions, payments data from API

### Subscription/Plan Models
- `subscriptions` table (bootstrap migration lines 521-536): id, organization_id, stripe_subscription_id, plan_name, status, current_period_start, current_period_end, amount_cents, currency, metadata
- No local plan/price catalog — plan names come from Stripe (price.nickname)
- No seat-based or usage-based billing model in schema

### Entitlement Checks
- No entitlement check system exists
- No middleware or guard that checks subscription status before allowing access
- Organization access is based on membership status, not billing status

### Billing APIs
- `GET /api/v1/billing/summary` — aggregates: activeSubscriptions, overdueInvoices, paidInvoices, totalInvoices, recentInvoices
- `GET /api/v1/billing/invoices` — paginated invoice list, filterable by organization_id, status
- `GET /api/v1/billing/invoices/:id` — single invoice detail
- `GET /api/v1/billing/subscriptions` — subscription list, filterable by organization_id
- `GET /api/v1/billing/payments` — paginated payment list with invoice join
- `GET /api/v1/billing/billing-customer` — billing customer record
- `POST /api/v1/billing/sync` — manual Stripe reconciliation (admin-only)

### Payment Provider Integration
- Stripe SDK (`stripe` npm package) installed — used for webhook event construction only
- Raw `fetch` calls to `https://api.stripe.com/v1/` for sync operations (`billing.ts:196-200`)
- Stripe API key set via `STRIPE_SECRET_KEY` env var (optional)
- No Stripe Checkout/Customer Portal integration for self-serve billing management

### Webhooks
- Stripe webhook at `/api/v1/webhooks/stripe` processes: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`, `checkout.session.completed`
- Signature verification via `stripe.webhooks.constructEvent()`
- Deterministic idempotency keys (`stripe-{event.id}`)
- See Report 27 for full webhook audit details

### Invoices/Status Records
- `invoices` table (bootstrap migration lines 538-556): organization_id, stripe_invoice_id, invoice_number, status (invoice_status enum), subtotal_cents, tax_cents, total_cents, currency, hosted_invoice_url, invoice_pdf_url, due_at, paid_at
- Status enum: `draft`, `open`, `paid`, `overdue`, `void`, `uncollectible` (from migration — inferred from context)
- Upserted from Stripe webhook events and manual sync

### Reconciliation Jobs
- Manual sync endpoint: `POST /api/v1/billing/sync` — admin-triggered, iterates billing_customers, fetches Stripe invoices + subscriptions, upserts to local tables
- Worker task: `stripe-reconcile.ts` at `apps/worker/src/tasks/stripe-reconcile.ts` — scheduled reconciliation via BullMQ
- No automated periodic sync (worker exists but schedule not confirmed)

### Failed Payments
- Stripe webhook `invoice.payment_failed` triggers upsert with status "open" + overdue detection (webhooks.ts:111-113)
- No local notification creation for failed payments
- No retry logic for failed payments in the app (handled by Stripe)

### Refund/Cancel/Trial States
- No explicit refund handling — refunded invoices would have `status = 'void'` or `'uncollectible'` in Stripe
- Subscription cancellation handled via Stripe webhook (`customer.subscription.deleted`)
- No trial tracking in subscriptions table (no trial_start/trial_end columns)
- No cancellation flow UI (no self-serve cancel in portal)

### Seat Counts
- No seat-based billing model
- No usage tracking per organization

### Admin/Customer UI
- Admin: org billing detail page shows invoices, subscriptions, payments, and provides sync button
- Portal: billing page shows invoice list, subscription status

### Sensitive Data
- No credit card numbers stored locally (all handled by Stripe)
- `billing_customers` stores `stripe_customer_id` (Stripe reference, not sensitive)
- Payment method details not stored locally

### Audit Logs
- Billing sync triggers `billing.sync` audit event
- Stripe webhook events logged as `stripe.{event.type}` audit events
- No audit events for billing page views

### Tests/Docs
- Billing API tests: `apps/api/src/__tests__/billing.test.ts`
- Billing page tests: `apps/web/__tests__/app/(admin)/admin/organizations/[orgId]/billing/page.test.tsx`
- `docs/BILLING.md` — comprehensive billing/Stripe integration documentation

---

## Billing Feature Inventory

| Feature | Status | Implementation |
|---|---|---|
| Invoice listing | ✅ Complete | Paginated, filterable, Stripe-synced |
| Subscription listing | ✅ Complete | Stripe-synced, plan_name from Stripe |
| Payment listing | ✅ Complete | Paginated with invoice context |
| Billing summary | ✅ Complete | Aggregated counts per org |
| Manual sync | ✅ Complete | Admin-triggered Stripe reconciliation |
| Stripe webhook | ✅ Complete | constructEvent verification, idempotent |
| Subscription management | ❌ Absent | No self-serve upgrade/downgrade/cancel |
| Entitlement gating | ❌ Absent | No subscription status checks on features |
| Usage billing | ❌ Absent | No seat/resource tracking |
| Trial management | ❌ Absent | No trial columns or logic |
| Invoice download | ⚠️ Partial | invoice_pdf_url stored, no download button |
| Payment method management | ❌ Absent | Relies on Stripe Customer Portal |

---

## Findings

### BILL-P0-001 — No entitlement gating based on subscription status (P0 Critical)

**Evidence:** No middleware, route guard, or helper function checks subscription status before granting access to features. Org access is gated solely by membership status (`requireOrgAccess`), not billing status.

**Risk:** An organization with an expired subscription, overdue invoices, or canceled plan retains full access to all features. There is no mechanism to restrict access for non-paying customers.

**Recommendation:** Add a `requireActiveSubscription` middleware that checks the organization's subscription status. Apply to all feature routes. Add grace period logic (e.g., 7 days after subscription end). Create a subscription status cache to avoid DB queries on every request.

---

### BILL-P1-001 — No self-serve subscription management UI (P1 High)

**Evidence:** Portal billing page is read-only (invoice list, subscription status display). No upgrade/downgrade/cancel buttons. No Stripe Customer Portal integration.

**Risk:** Customers must contact support to change plans or cancel. Increases support burden. No self-serve flow for common billing operations.

**Recommendation:** Integrate Stripe Customer Portal (`stripe.billingPortal.sessions.create()`). Add a "Manage Billing" button that redirects to the Stripe-hosted portal. Add portal return URL configuration.

---

### BILL-P1-002 — No reconciliation worker schedule confirmed (P1 High)

**Evidence:** `apps/worker/src/tasks/stripe-reconcile.ts` exists but periodic schedule (cron) not confirmed in worker task registry. Manual sync is admin-triggered only.

**Risk:** If the Stripe webhook misses events (e.g., downtime, network issues), invoice/subscription data becomes stale until an admin manually triggers sync. No automated drift detection.

**Recommendation:** Schedule the stripe-reconcile worker task to run daily via BullMQ `repeat` option. Add drift detection alert if Stripe invoice counts diverge from local counts by more than 5%.

---

### BILL-P2-001 — No trial or plan columns in subscriptions table (P2 Medium)

**Evidence:** `subscriptions` table (bootstrap lines 521-536) lacks `trial_start`, `trial_end`, `plan_id`, `interval` (monthly/yearly) columns. Plan information is derived from Stripe product name only.

**Risk:** Cannot determine trial status, billing interval, or plan tier without querying Stripe API directly. Limits ability to show meaningful subscription information in the portal.

**Recommendation:** Add columns: `trial_start timestamptz`, `trial_end timestamptz`, `plan_id text`, `interval text`. Populate from Stripe webhook and sync. Create a local `plans` reference table if plan tiers are fixed.

---

### BILL-P2-002 — No failed payment notification to users (P2 Medium)

**Evidence:** Stripe webhook processes `invoice.payment_failed` but creates no local notification. The event is logged to audit_logs and the invoice status is updated, but no email or in-app notification is sent to the organization.

**Risk:** Customers are unaware of failed payments until their subscription lapses. Increases churn risk.

**Recommendation:** Create an in-app notification and (optionally) email alert when `invoice.payment_failed` is received. Provide a link to update payment method via Stripe Customer Portal.

---

### BILL-P3-001 — No billing event history in portal (P3 Low)

**Evidence:** Portal billing page shows current invoices and subscriptions but no billing event timeline (payment failures, plan changes, invoice status transitions).

**Risk:** Users cannot see billing history beyond current invoice list. Past-due resolution steps are invisible.

**Recommendation:** Add a billing event timeline component showing recent Stripe webhook events (plan changes, payment success/failure, invoice status transitions) pulled from audit_logs or a dedicated billing_events table.

---

## Entitlement Review

| Feature | Entitlement Check | Current Behavior | Recommendation |
|---|---|---|---|
| All API routes | Subscription check | None — any active membership works | Add requireActiveSubscription middleware |
| Document upload | Storage limit check | None (Supabase bucket limit applies) | Add per-org storage quota based on plan |
| Ticket creation | Ticket limit check | None | Add per-org ticket limit based on plan |
| Admin features | Admin role check | Role-based, not plan-based | Current is acceptable for admin roles |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | No entitlement gating — expired subs can access all features |
| P1 (High) | 2 | No self-serve billing UI, no automated reconciliation schedule |
| P2 (Medium) | 2 | Missing trial/plan columns, no failed payment notifications |
| P3 (Low) | 1 | No billing event history |
| **Total** | **6** | |

The billing system provides solid read-only access to Stripe-synced data (invoices, subscriptions, payments) with proper webhook integration and signature verification. The critical gap is the complete absence of entitlement gating — any organization with an active membership, regardless of billing status, has full access to all features. Adding Stripe Customer Portal integration and automated reconciliation are the highest-value improvements.
