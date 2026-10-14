# Billing, Payments, and Reconciliation Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 29) · Area code: BILL
- Scope limitations: static read-only review at 7dd0402. No database/Supabase/Stripe/live access; no test suite executed (no `node_modules`/`pnpm` in the audit environment). Live webhook delivery, RLS enforcement and Stripe API behavior are inferred from code + migrations and marked where relevant.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (19 BILL findings).

## Executive Summary

Billing is materially hardened since the previous full run. All 19 previous findings (3 P1 + 8 P2 + 8 P3) are `verified-fixed` at 7dd0402: server-side entitlement enforcement covers exactly the six subscription-tier module routers; the `payments` mirror is populated by webhook and sync with refund state; pagination, drift detection, monotonic terminal-state guards, checked webhook writes, dunning notifications and tenant-scoped billing reads are all present and code-referenced. Docs match the implementation.

One new P3 remains: entitlement enforcement deliberately fails **open** when the billing-state lookup errors (`middleware/entitlement.ts:12-24,88-94`) and that failure is logged but not metered or alerted, so a sustained billing-state outage silently relaxes the plan gate for every gated module.

Usage/metered billing remains absent by design (seat quantity is now mirrored); no PCI scope is introduced (card data stays at Stripe; `billing_email` is encrypted at rest and the payment-method id is masked).

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side | verified-fixed |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty | verified-fixed |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded | verified-fixed |
| BILL-P2-001 | P2 | No refund and incomplete trial/cancel state handling | verified-fixed |
| BILL-P2-002 | P2 | `POST /billing/sync` does not paginate Stripe results | verified-fixed |
| BILL-P2-003 | P2 | Reconciliation job has no drift detection, alerting, or tests | verified-fixed |
| BILL-P2-004 | P2 | Failed payments produce no notification or dunning visibility | verified-fixed |
| BILL-P2-005 | P2 | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields | verified-fixed |
| BILL-P2-006 | P2 | Stripe webhook DB writes ignore errors and still mark the event processed | verified-fixed |
| BILL-P2-007 | P2 | Out-of-order or late-retried Stripe events can overwrite terminal payment states | verified-fixed |
| BILL-P2-008 | P2 | Billing read endpoints fall back to all-tenant scope for cross-tenant roles without an admin-scope guard or audit | verified-fixed |
| BILL-P3-001 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` | verified-fixed |
| BILL-P3-002 | P3 | Billing email stored in plaintext and raw Stripe payment-method id rendered to users | verified-fixed |
| BILL-P3-003 | P3 | `invoice.paid` paid_at handling writes epoch dates (sync) or throws when `status_transitions` is missing (webhook) | verified-fixed |
| BILL-P3-004 | P3 | Payments list uses an inner join, hiding payments not linked to an invoice | verified-fixed |
| BILL-P3-005 | P3 | Entitlement override cannot revoke all modules (all-disabled falls back to the subscription set) | verified-fixed |
| BILL-P3-006 | P3 | Subscription mirror ignores seat quantity and the billing summary excludes trialing plans | verified-fixed |
| BILL-P3-007 | P3 | Portal 'Sync from Stripe' button is shown to client roles that lack `billing:manage` | verified-fixed |
| BILL-P3-008 | P3 | Billing docs contradict the implementation | verified-fixed |
| BILL-P3-009 | P3 | Entitlement enforcement fails open on billing-state lookup errors with no metric or alert | **open (new)** |

### Re-verification evidence (headline rows)

- **BILL-P1-001** — `apps/api/src/middleware/entitlement.ts:142-171`; `apps/api/src/lib/entitlements.ts:75-117`; gate mounted at `routes/service-catalog.ts:17`, `findings.ts:36`, `governance.ts:34`, `security-ops.ts:24`, `qbr.ts:19`, `training-hub.ts:17` — exactly the six `MODULE_REGISTRY` subscription-tier modules.
- **BILL-P1-002 / P1-003** — `routes/webhooks.ts:492-542` (payment_intent lifecycle), `:548-580` (charge.refunded), `:584-601` (void/uncollectible); sync backfill `routes/billing.ts:572-649`.
- **BILL-P2-006 / P2-007** — `webhooks.ts:174-218` (terminal-state sets + `readMirrorStatus` + `assertMirrorWrite`), claim release + failed metric at `:619-631`.
- **BILL-P2-004** — `lib/billing-dunning.ts` + `webhooks.ts:388-397`; metric `portal_billing_dunning_notifications_total` (`lib/metrics.ts:278-288`).
- **BILL-P3-009 (new)** — `middleware/entitlement.ts:12-24,88-94` (deliberate fail-open, logged only); no matching counter in `lib/metrics.ts` and no Prometheus rule.

## Recommendations

1. **This week (new P3):** emit an `entitlement_resolution_failures_total{module}` counter on the fail-open path and add a Prometheus alert; consider denying after a bounded failure window.
2. **Later:** keep the operator decision on SMTP/dunning alerts under review; no release blockers in this domain at 7dd0402.
3. **Future readiness (usage billing):** if metered plans are planned, add usage records + Stripe metered subscription items; today seat `quantity` is the only seat-count signal.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Metric + alert on entitlement resolution failure | Converts a silent plan-gate relaxation into an alertable event | `middleware/entitlement.ts`, `lib/metrics.ts`, `prometheus.rules.yml` |

## Suggested Tests

- Unit: `resolveOrgEntitlements` error → middleware allows but increments the failure counter (new).
- Integration: replayed `payment_intent.succeeded` after `charge.refunded` keeps `refunded` (existing test should cover; re-run in CI).
- Worker: `stripe-reconcile` drift/error → `ok:false` (exists in `stripe-reconcile.test.ts`).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is metered/usage billing planned? | Entire usage-billing surface absent | Product decision |
| Is the deliberate entitlement fail-open acceptable during a billing-state outage? | Determines whether the new P3 becomes a P2 | Owner decision |
