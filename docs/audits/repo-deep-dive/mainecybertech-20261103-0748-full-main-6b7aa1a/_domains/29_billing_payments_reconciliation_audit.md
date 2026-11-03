# Billing, Payments and Reconciliation — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: BILL
- Scope limitations: read-only static review; no live Stripe API calls, no hosted database, no payment-provider traffic.

## Scope

Re-verified all 20 previous BILL findings at `6b7aa1a`: plan/entitlement derivation and enforcement, the `payments` mirror and Stripe webhook lifecycle, refund/void/trial/cancel handling, sync pagination, reconciliation drift and alerting, dunning, billing read scoping and audit, PII handling of billing email/payment-method ids, timestamp handling and docs. Billing code itself is unchanged in this diff except `middleware/entitlement.ts`; the Stripe webhook file moved line numbers because of the webhook hardening in this release.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Plan gate | `middleware/entitlement.ts` | Enforce subscription modules | Working | Low | Fail-open now metered/alerts |
| Entitlements | `lib/entitlements.ts` | Derive plan + overrides | Working | Low | All-disabled override honoured |
| Billing reads | `routes/billing.ts` GETs | Summary/subscriptions/payments/customer | Working | Low | Org scoping + cross-tenant audit |
| Sync | `routes/billing.ts:404` `POST /billing/sync` | Stripe -> mirror backfill | Working | Low | Paginated; 502 on partial |
| Stripe webhooks | `routes/webhooks.ts` | Lifecycle mirror + dunning | Working | Low | Signature, dedup, terminal guards |
| Reconcile job | `apps/worker/src/tasks/stripe-reconcile.ts` | Nightly drift detect/repair | Working | Low | Status/count/sum only |
| Billing UI | `BillingPageClient.tsx` | Portal billing page | Working | Low | Gate, seats, overdue, masked PM |
| Lifecycle schema | `5302444_billing_lifecycle_fields.sql` | Trial/interval/cancel/void/refund | Working | Low | Migrated |
| Payments schema | `payments` (bootstrap) | Payment history | Working | Low | Unique Stripe PI id |
| Billing docs | `docs/BILLING.md`, `docs/modules/billing.md` | Operator/developer contract | Working | Low | Matches code; single-item note missing |

## Domain scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Billing pages | 4 | Portal/admin billing pages | Multi-item totals invisible | Fix BILL-P3-010 |
| Subscription/plan models | 3 | First subscription item only | Add-ons dropped | Item-level model |
| Entitlement checks | 5 | Gate on six routers; metric/alert | Fail-open accepted | Bounded fail-open later |
| Billing APIs | 4 | Scoped, paginated, audited | No subscription amount drift check | Extend reconcile |
| Payment provider integration | 4 | Signature + raw bytes + terminal guards | — | Keep tests |
| Webhooks | 5 | Idempotent, error-checked, dunning | — | — |
| Invoices/status records | 4 | Lifecycle + void + refunds | — | — |
| Reconciliation jobs | 4 | Drift + alert + tests | Amount/subscription drift | Add checks |
| Failed payments | 4 | Dunning notifications + portal visibility | — | — |
| Refund/cancel/trial states | 4 | Columns + writers + terminal guards | — | — |
| Seat counts | 3 | Quantity persisted/displayed | First item only | BILL-P3-010 |
| Usage billing | 1 | Absent | No metered usage | Future readiness only |

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/middleware/entitlement.ts`, `apps/api/src/lib/entitlements.ts` | Read | Plan gate + fail-open counter | `recordBillingLookupFailure` added at :92-94 |
| `apps/api/src/routes/billing.ts` | Read | Read endpoints, sync, pagination, secrets | Scoping, sync page cap, decrypt/mask |
| `apps/api/src/routes/webhooks.ts` | Read | Stripe lifecycle mirror | Payment, refund, void, subscription, dunning |
| `apps/api/src/lib/billing-dunning.ts`, `billing-timestamps.ts` | Read | Dunning + date handling | Preference-aware notify; ISO fallback |
| `apps/worker/src/tasks/stripe-reconcile.ts` | Read | Nightly drift detection | Status/count/sum drift + write-back |
| `supabase/migrations/5302444_billing_lifecycle_fields.sql` | Read | Lifecycle schema | interval/trial/cancel/quantity/void/refund |
| `apps/web/app/(portal)/portal/billing/BillingPageClient.tsx` | Read | Customer UI | Gate, seats, overdue, masked method |
| `infra/digitalocean/prometheus.rules.yml` | Executed | Billing alerts | `promtool check rules` 26 SUCCESS; `test rules` SUCCESS |
| `docs/BILLING.md`, `docs/modules/billing.md` | Read | Doc/code parity | Claims match implementation |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `promtool check rules` / `test rules` (prom/prometheus:v3.5.1) | Executed | Billing/dunning/reconcile alert syntax and behaviour | 26 rules SUCCESS; rule tests SUCCESS |
| `git diff 7dd0402..6b7aa1a -- apps/api/src/middleware/entitlement.ts` | Read | Only billing-adjacent code change | Adds failure counter + test |
| Webhook handler walk-through | Read | Every mirror write error-checked | `assertMirrorWrite` at 6 call sites |
| Read-only SQL/index inspection | Read | Unique keys for upserts | `stripe_payment_intent_id`, `stripe_subscription_id` unique |

## Executive Summary

All 20 previous BILL findings are **verified fixed** at this commit, including the last open P3. The entitlement fail-open path is now metered and alerted (`portal_billing_lookup_failures_total` → `MCTBillingLookupFailures`), so a billing-mirror outage can no longer silently disable the plan gate for every module.

One **new P3** was identified: every subscription mirror writer reads only the first Stripe subscription item, so a multi-item subscription (base plan + add-on) understates amount/quantity in the portal, and reconciliation only compares status — not amount — so the drift stays invisible. Stripe remains the billing source of truth, so this is a reporting/portal correctness issue rather than a charging error.

No regressions were found. The notification dedup migration collision (`5302463` used twice) is tracked under `INV-P1-001`/`DATA-P1-004` and does not affect billing migrations.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| BILL-001 | Plan gate on subscription modules | `middleware/entitlement.ts` + six routers | 402 + admin bypass | Fail-open during outage | P3 | Keep alert; bounded fail-open |
| BILL-002 | Payment history populated | `payments` upsert + sync | Webhook + backfill | — | — | Keep tests |
| BILL-003 | Refund/void terminal states | `TERMINAL_*` + `readMirrorStatus` | Monotonic guards | — | — | Keep |
| BILL-004 | Webhook authenticity | `constructEvent` on raw bytes | Signature required | — | — | Keep |
| BILL-005 | Sync completeness | `fetchStripePages` + 502 | Page cap + error fail | — | — | Keep |
| BILL-006 | Reconciliation drift | `stripe-reconcile` + alert | Status/count/sum | Amount/item drift | P3 | Extend checks |
| BILL-007 | Dunning visibility | `billing-dunning.ts` + portal | Preference-aware notify | — | — | Keep |
| BILL-008 | Cross-tenant billing reads | `applyOrgScope` + audit | Scope + audit | — | — | Keep |
| BILL-009 | PII in billing email/PM | `encryptField` + mask | Encrypted/masked | — | — | Keep |
| BILL-010 | Multi-item subscriptions | `items.data[0]` | First item only | Add-ons invisible | P3 | BILL-P3-010 |
| BILL-011 | Seat counts | `quantity` mirrored/displayed | Per first item | Multi-item seats | P3 | BILL-P3-010 |
| BILL-012 | Usage billing | No code | Absent | Not offered | P3 | Future readiness |

## Findings

| ID | Sev | Status | Title |
|---|---|---|---|
| BILL-P1-001 | P1 | verified-fixed | Module entitlements are derived but not enforced server-side |
| BILL-P1-002 | P1 | verified-fixed | `payments` table is never populated; payment history is silently empty |
| BILL-P1-003 | P1 | verified-fixed | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded |
| BILL-P2-001 | P2 | verified-fixed | No refund and incomplete trial/cancel state handling |
| BILL-P2-002 | P2 | verified-fixed | `POST /billing/sync` does not paginate Stripe results |
| BILL-P2-003 | P2 | verified-fixed | Reconciliation job has no drift detection, alerting, or tests |
| BILL-P2-004 | P2 | verified-fixed | Failed payments produce no notification or dunning visibility |
| BILL-P2-005 | P2 | verified-fixed | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields |
| BILL-P2-006 | P2 | verified-fixed | Stripe webhook DB writes ignore errors and still mark the event processed |
| BILL-P2-007 | P2 | verified-fixed | Out-of-order or late-retried Stripe events can overwrite terminal payment states |
| BILL-P2-008 | P2 | verified-fixed | Billing read endpoints fall back to all-tenant scope for cross-tenant roles without an admin-scope guard or audit |
| BILL-P3-001 | P3 | verified-fixed | Webhook raw body typed as `string` but consumed as `Buffer` |
| BILL-P3-002 | P3 | verified-fixed | Billing email stored in plaintext and raw Stripe payment-method id rendered to users |
| BILL-P3-003 | P3 | verified-fixed | `invoice.paid` paid_at handling writes epoch dates (sync) or throws when `status_transitions` is missing (webhook) |
| BILL-P3-004 | P3 | verified-fixed | Payments list uses an inner join, hiding payments not linked to an invoice |
| BILL-P3-005 | P3 | verified-fixed | Entitlement override cannot revoke all modules (all-disabled falls back to the subscription set) |
| BILL-P3-006 | P3 | verified-fixed | Subscription mirror ignores seat quantity and the billing summary excludes trialing plans |
| BILL-P3-007 | P3 | verified-fixed | Portal 'Sync from Stripe' button is shown to client roles that lack `billing:manage` |
| BILL-P3-008 | P3 | verified-fixed | Billing docs contradict the implementation (sync gate, webhook verification, reconcile source, payment statuses) |
| BILL-P3-009 | P3 | verified-fixed | Entitlement enforcement fails open on billing-state lookup errors with no metric or alert |
| BILL-P3-010 | P3 | open | Subscription mirror reads only the first Stripe subscription item, so multi-item plans and add-ons are invisible |

Counts: **20 verified-fixed, 0 partially-fixed, 0 regressed, 0 open among previous findings; 1 new P3 open.**

## Key fix verified in this diff

### BILL-P3-009 — fail-open entitlement lookup is now observable

`resolveForOrg` catches the billing-mirror read failure and still allows the request by design (`middleware/entitlement.ts:83-101`). It now also calls `recordBillingLookupFailure(moduleKey)` (`:92-94`), backed by `portal_billing_lookup_failures_total` (`lib/metrics.ts:360-369`). `MCTBillingLookupFailures` fires on any increase over 15 minutes (`infra/digitalocean/prometheus.rules.yml:371-388`). A regression test (`apps/api/src/__tests__/middleware-entitlement.test.ts:241-262`) asserts the counter increments on the fail-open path.

## New finding

### BILL-P3-010 — only the first subscription item is mirrored (P3, open)

- Evidence: `apps/api/src/routes/webhooks.ts:455`, `apps/api/src/routes/billing.ts:543`, `apps/worker/src/tasks/stripe-reconcile.ts:370` all use `sub.items.data[0]`; the reconcile comparison only checks status (`stripe-reconcile.ts:352-357`).
- What is happening: `plan_name`, `amount_cents`, `quantity` and `interval` come from the first Stripe subscription item. Add-on items are dropped from the local mirror.
- Why it matters: the portal's plan total/seat display is wrong for multi-item subscriptions, and the nightly reconciliation will not flag it because it compares only status, invoice totals and payment totals.
- Impact: reporting/portal correctness; no charge is created from the mirror.
- Recommended fix: persist per-item rows (or a JSON item breakdown) and include the summed amount/quantity in the mirror; extend reconciliation to compare subscription amount/quantity.
- Suggested validation: seed a Stripe subscription with two items in the sync test double and assert the mirror stores both amounts; assert reconcile raises drift when an item amount differs.
- Owner: billing/backend · Effort: M · Target: next quarter.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Multi-item subscription totals understated in portal/reporting | P3 | Medium (add-ons plausible) | Wrong customer-facing totals; billing support noise | BILL-P3-010 | Item-level mirror + amount reconciliation |
| Billing-state outage still fails open | P3 (accepted) | Low with alert | Modules remain accessible during outage | BILL-P3-009, `entitlement.ts:83-101` | Alert now pages; consider bounded fail-open later |
| Stripe API partial sync | P2 | Low | Mirror incomplete until retry | `billing.ts:656-670` | Sync fails 502; operator re-runs |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Decide whether multi-item subscriptions are in the commercial model. If yes, schedule BILL-P3-010; if not, document the single-item constraint and add an assertion/log when `items.data.length > 1`.

### This Month

2. Add a sync test fixture with two subscription items to lock the expected behaviour.
3. Add a reconciliation check for subscription amount/quantity so mirror drift is visible even when status matches.

### Later / Platform Evolution

4. Consider storing subscription items in a child table if add-ons become sellable; the current single-row schema forces the first-item choice.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Warn when `items.data.length > 1` | Surfaces unsupported subscriptions before they confuse support | `routes/webhooks.ts`, `routes/billing.ts`, `stripe-reconcile.ts` | Log assertion test |
| Document single-item assumption in `docs/BILLING.md` | Prevents future readers assuming add-ons are mirrored | `docs/BILLING.md` | Doc review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Item-level subscription mirror + amount drift detection (BILL-P3-010) | P3 | billing/backend | M | Stripe multi-item decision |
| Bounded fail-open (deny after N minutes) for entitlement lookups | P3 | API/security | S | Owner decision |
| Subscription amount reconciliation alert | P3 | worker/billing | S | BILL-P3-010 |
| Finance-record retention statement | P3 | finance/compliance | S | Legal input |

## Suggested Tests

- **Unit:** `fetchStripePages` stops on `has_more=false`, errors on a bad page, reports truncation at the cap.
- **Integration:** webhook `customer.subscription.updated` with two items → decide/assert expected mirror; terminal status cannot be downgraded.
- **Regression:** `invoice.voided` after `invoice.paid` stays void; late `payment_intent.succeeded` after `charge.refunded` stays refunded.
- **Alerting:** `promtool test rules` case for `MCTBillingLookupFailures` and `MCTStripeReconcileDrift`.
- **Manual:** Stripe test-mode sync on an org with an unpaid invoice → 502 `STRIPE_SYNC_INCOMPLETE`, no false success.

## Suggested Documentation Updates

- `docs/BILLING.md`: state that only the first subscription item is mirrored today (or document the item-level model after the fix).
- `docs/modules/billing.md`: note the reconciliation coverage (status/invoice/payment, not subscription amount).
- `docs/PRIVACY.md`/`docs/SUBPROCESSORS.md`: unchanged; billing email remains encrypted/masked.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are multi-item Stripe subscriptions part of the commercial model? | Decides whether BILL-P3-010 is a bug or a documented constraint | Product/pricing decision |
| Does Stripe send `payment_intent.*` for every invoice payment (manual/out-of-band)? | The payments mirror depends on it; sync backfills but with delay | Stripe account event log |
| Should fail-open become deny-after-N-minutes? | Availability vs plan enforcement trade-off | Owner/security decision |

## Appendix — commands executed

```
docker run --rm -v "$PWD/infra/digitalocean:/cfg:ro" --entrypoint /bin/promtool \
  prom/prometheus:v3.5.1 check rules /cfg/prometheus.rules.yml
  -> SUCCESS: 26 rules found

docker run --rm -v "$PWD/infra/digitalocean:/cfg:ro" --entrypoint /bin/promtool \
  prom/prometheus:v3.5.1 test rules /cfg/prometheus.rules.test.yml
  -> SUCCESS
```

No live Stripe or database calls were made.
