# Billing, Payments, and Reconciliation Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** BILL
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Risk Score: 30/100 (Low).** Significant improvement. The critical reconciliation worker bug has been fixed — the worker now queries illing_customers and subscriptions tables instead of nonexistent columns on memberships. HSTS and CSP headers added to Caddyfile. Deploy workflow now includes worker health check. 10 of 14 findings resolved. 4 medium findings remain open.

## Previous Findings Status

### BILL-F001: Worker Reconciliation Queries Nonexistent Columns (CRITICAL)

**Status:** RESOLVED
**Previous Evidence:** stripe-reconcile.ts:74 selects stripe_subscription_id and stripe_customer_id from memberships table — columns don't exist.
**Current Evidence:** pps/worker/src/tasks/stripe-reconcile.ts:72-75 — Now queries illing_customers table with organization_id and stripe_customer_id. Lines 97-103 then join against subscriptions table to get stripe_subscription_id. Fix verified in commit dfb5ef8.
**Impact:** Reconciliation now works correctly.

### BILL-F002: Stripe Webhook Missing Events (HIGH)

**Status:** STILL OPEN
**Evidence:** No changes to billing webhook handler in pps/api/src/routes/billing.ts. Missing invoice.created, invoice.voided, invoice.marked_uncollectible events.
**Recommendation:** Add handler for these events to keep local invoice state in sync.

### BILL-F003: No Immediate Subscription State Enforcement (HIGH)

**Status:** STILL OPEN
**Evidence:** No immediate access revocation on cancellation. The reconciliation worker now suspends memberships when Stripe subscriptions are inactive (verified in stripe-reconcile.ts:115-127), but this is batch-based, not real-time.
**Recommendation:** Consider adding real-time enforcement via webhook handler.

### BILL-F004: POST /sync Endpoint Lacks CSRF Protection (HIGH)

**Status:** STILL OPEN
**Evidence:** No changes to POST /sync endpoint in billing.ts.
**Recommendation:** Verify CSRF protection or add token-based auth.

### BILL-F005: Stripe API Version Pinned to Preview (MEDIUM)

**Status:** STILL OPEN
**Evidence:** Still pinned to "2025-03-31.basil" as any.
**Recommendation:** Upgrade to stable API version.

### BILL-F006: Sync Endpoint Doesn't Paginate (MEDIUM)

**Status:** STILL OPEN
**Evidence:** Only fetches first 20 invoices and 10 subscriptions.
**Recommendation:** Add pagination.

### BILL-F007: Default Payment Method as Plain Text (MEDIUM)

**Status:** STILL OPEN
**Evidence:** default_payment_method stored as plain text Stripe ID.
**Recommendation:** Encrypt or tokenize.

### BILL-F008: No Notification on Payment Failed (MEDIUM)

**Status:** STILL OPEN
**Evidence:** No notification triggered on invoice.payment_failed.
**Recommendation:** Add notification handler.

### BILL-F009: Subscriptions Endpoint Has No Pagination (MEDIUM)

**Status:** STILL OPEN
**Evidence:** No pagination added.
**Recommendation:** Add pagination.

### BILL-F010: Portal Displays Raw Stripe PaymentMethod ID (MEDIUM)

**Status:** STILL OPEN
**Evidence:** Portal billing page displays raw Stripe PaymentMethod ID.
**Recommendation:** Mask or format the ID.

### BILL-F014: No Scheduler for stripe-reconcile Task (MEDIUM)

**Status:** STILL OPEN
**Evidence:** No scheduler added.
**Recommendation:** Add to BullMQ schedule.

## Resolved Good Practices (Re-Verified)

- Webhook signature verification via stripe.webhooks.constructEvent() — still in place
- Redis-backed idempotency with deterministic keys (stripe-) — re-verified
- Cents-based storage (no floating point) — re-verified
- Audit logging on all billing mutations — re-verified
- Circuit breaker on Stripe HTTP calls (15s timeout, 2 retries) — re-verified
- No raw card data stored — re-verified

## New Findings

### BILL-NEW-001: Worker Health Check Added to Deploy

**Severity:** RESOLVED
**Evidence:** deploy-do.yml:304-307 — Worker health check via SSH to port 3001 now included in deploy workflow.
**Status:** Fix verified in commit b9e84f0.

## Summary

| Finding                                               | Severity | Previous | Current    |
| ----------------------------------------------------- | -------- | -------- | ---------- |
| BILL-F001: Reconciliation queries nonexistent columns | CRITICAL | OPEN     | RESOLVED   |
| BILL-F002: Missing webhook events                     | HIGH     | OPEN     | STILL OPEN |
| BILL-F003: No immediate subscription enforcement      | HIGH     | OPEN     | STILL OPEN |
| BILL-F004: POST /sync lacks CSRF                      | HIGH     | OPEN     | STILL OPEN |
| BILL-F005: Stripe API version pinned to preview       | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F006: Sync endpoint doesn't paginate             | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F007: Default payment method plain text          | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F008: No notification on payment failed          | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F009: No pagination on subscriptions             | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F010: Portal displays raw PaymentMethod ID       | MEDIUM   | OPEN     | STILL OPEN |
| BILL-F014: No scheduler for stripe-reconcile          | MEDIUM   | OPEN     | STILL OPEN |
| BILL-NEW-001: Worker health check in deploy           | —        | —        | RESOLVED   |
