# 29_billing_payments_reconciliation_audit — Prompt 29 - Billing, Payments, and Reconciliation Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `29_billing_payments_reconciliation_audit.md` (area BILL, prompt)

## Verification Performed

Domain subagent produced 20 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded |
| BILL-P2-001 | P2 | No refund and incomplete trial/cancel state handling |
| BILL-P2-002 | P2 | `POST /billing/sync` does not paginate Stripe results |
| BILL-P2-003 | P2 | Reconciliation job has no drift detection, alerting, or tests |
| BILL-P2-004 | P2 | Failed payments produce no notification or dunning visibility |
| BILL-P2-005 | P2 | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields |
| BILL-P2-006 | P2 | Stripe webhook DB writes ignore errors and still mark the event processed |
| BILL-P2-007 | P2 | Out-of-order or late-retried Stripe events can overwrite terminal payment states |
| BILL-P2-008 | P2 | Billing read endpoints fall back to all-tenant scope for cross-tenant roles without an admin-scope guard or audit |
| BILL-P3-001 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` |
| BILL-P3-002 | P3 | Billing email stored in plaintext and raw Stripe payment-method id rendered to users |
| BILL-P3-003 | P3 | `invoice.paid` paid_at handling writes epoch dates (sync) or throws when status_transitions is missing (webhook) |
| BILL-P3-004 | P3 | Payments list uses an inner join, hiding payments not linked to an invoice |
| BILL-P3-005 | P3 | Entitlement override cannot revoke all modules (all-disabled falls back to the subscription set) |
| BILL-P3-006 | P3 | Subscription mirror ignores seat quantity and the billing summary excludes trialing plans |
| BILL-P3-007 | P3 | Portal 'Sync from Stripe' button is shown to client roles that lack billing:manage |
| BILL-P3-008 | P3 | Billing docs contradict the implementation (sync gate, webhook verification, reconcile source, payment statuses) |
| BILL-P3-009 | P3 | Entitlement enforcement fails open on billing-state lookup errors with no metric or alert |
