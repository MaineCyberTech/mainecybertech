# Billing, Payments, and Reconciliation Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** BILL

## Executive Summary

**Risk Score: 55/100.** Solid architectural foundation (Stripe-mirror pattern, cents-based storage, webhook signature verification, circuit breakers, RLS). **One critical bug:** reconciliation worker queries nonexistent columns. Missing webhook events, no immediate subscription enforcement, pinned unstable API version.

**14 findings** (1 Critical, 3 High, 8 Medium, 2 Low)

## Critical Finding

### BILL-F001: Worker Reconciliation Queries Nonexistent Columns

**Severity:** CRITICAL
**Evidence:** `stripe-reconcile.ts:74` selects `stripe_subscription_id` and `stripe_customer_id` from `memberships` table — these columns don't exist on `memberships`. They only exist on `billing_customers` and `subscriptions`.
**Impact:** Every membership is skipped (line 97 checks `if (!membership.stripe_subscription_id) continue;`). Reconciliation is a complete no-op.
**Recommendation:** Join against `billing_customers` and `subscriptions` tables.

## High Findings

- **BILL-F002:** Stripe webhook missing `invoice.created`, `invoice.voided`, `invoice.marked_uncollectible` events
- **BILL-F003:** No immediate subscription state enforcement — users retain access after cancellation
- **BILL-F004:** `POST /sync` endpoint lacks CSRF protection

## Medium Findings

- **BILL-F005:** Stripe API version pinned to `"2025-03-31.basil" as any` — preview/staff-only version
- **BILL-F006:** Sync endpoint doesn't paginate Stripe results — only fetches first 20 invoices and 10 subscriptions
- **BILL-F007:** `default_payment_method` stored as plain text Stripe ID
- **BILL-F008:** No notification on `invoice.payment_failed`
- **BILL-F009:** Subscriptions endpoint has no pagination
- **BILL-F010:** Portal billing page displays raw Stripe PaymentMethod ID to users
- **BILL-F014:** No scheduler for `stripe-reconcile` task

## Good Practices

- Webhook signature verification via `stripe.webhooks.constructEvent()`
- Redis-backed idempotency with deterministic keys (`stripe-${event.id}`)
- Cents-based storage (no floating point)
- Audit logging on all billing mutations
- Circuit breaker on Stripe HTTP calls (15s timeout, 2 retries)
- No raw card data stored
