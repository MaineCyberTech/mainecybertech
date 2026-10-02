# Billing, Payments, and Reconciliation Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: mainecybertech (monorepo: `apps/api`, `apps/web`, `apps/worker`, `packages/sdk`)
- Branch: develop
- Commit SHA: 6286137017c4b7c77e83ee420ec11382d984f263 (short `6286137`)
- Generated at: 2026-10-02 03:44 (run directory timestamp)
- Auditor: repo-deep-dive auditor subagent (prompt 29)
- Area code: BILL
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/29_billing_payments_reconciliation_audit.md
- Scope limitations:
  - Static, read-only audit of the working tree at the audited commit. No git client was required; commit/branch were confirmed via the Git CLI at `C:\Program Files\Git\cmd\git.exe` against `C:\temp\mainecybertech`.
  - No connection to Stripe or any payment provider was made. No billing operation was executed. No network calls to `api.stripe.com`.
  - No tests were executed in this run; findings are from source, schema, docs, and test-file review. Where a claim could only be reproduced by running code, the verification result is `not reproducible` (audit role) and stated as such.
  - This prompt cross-references but does not duplicate: `08_api_contracts_realtime_integrations.md` (API-*), `27` webhook audit (WH-*), and `07_data_schema_migration_runtime_validation.md` (DATA-*) in the same run folder.
  - Prior-run continuity checked against `prompts/repo-deep-dive/20260728-0142-develop-21a10d6/29_billing_payments_reconciliation_audit.md`; findings were re-derived at the current commit, not copied.

## Scope

Reviewed (in scope):

- Billing pages: `apps/web/app/(portal)/portal/billing/page.tsx`, `BillingPageClient.tsx`; `apps/web/app/(admin)/admin/organizations/[orgId]/billing/page.tsx`, `AdminBillingClient.tsx`.
- Subscription/plan models: `public.subscriptions`, `public.billing_customers`, `public.invoices`, `public.payments`, `public.invoice_status` (bootstrap migration `5302026_...corrected.v3.sql`).
- Entitlement checks: `apps/api/src/routes/client-portal.ts` (`DEFAULT_ENABLED_MODULES`, `SUBSCRIPTION_ENABLED_MODULES`, `deriveEnabledModules`, `client_portal_entitlements`).
- Billing APIs: `apps/api/src/routes/billing.ts` (all routes).
- Payment provider integration: Stripe SDK usage, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, raw REST calls and `httpClients.stripe`.
- Webhooks: `apps/api/src/routes/webhooks.ts` (`POST /stripe`).
- Invoices/status records: invoice upsert paths (webhook + sync), enum mapping.
- Reconciliation jobs: `apps/worker/src/tasks/stripe-reconcile.ts`, `schedule-config.ts`, `tasks/index.ts`, `main.ts`.
- Failed payments: `invoice.payment_failed` handling and dunning behavior.
- Refund/cancel/trial states: subscription status handling, absence of refund events.
- Seat counts / usage billing: absence search across schema and code.
- Admin/customer UI: portal and admin billing clients.
- Sensitive data: payment-method and customer-id handling.
- Audit logs: `logAuditEvent` usage in billing paths.
- Tests/docs: `apps/api/src/__tests__/billing.test.ts`, `webhooks.test.ts`, `client-portal.test.ts`, `apps/worker/src/__tests__/tasks/task-handlers.test.ts`, `apps/web/e2e/portal/billing.spec.ts`, `docs/BILLING.md`, `docs/modules/billing.md`.

Not reviewed (out of scope / deferred):

- Live Stripe dashboard configuration (products, prices, webhook endpoint registration, dunning settings) — external to the repository, `Unknown`.
- Infrastructure/Terraform secret wiring beyond the doc claim in `docs/BILLING.md` (cross-ref `12_infra_deployment_environment_drift.md`).
- RLS policy correctness in depth (cross-ref `37_supabase_rls_policy_deep_dive.md`); RLS presence was noted only as it bears on billing data access.
- Runtime performance/observability of the Stripe HTTP client under load (cross-ref `13`, `14`).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `docs/BILLING.md` | Doc | Declares the intended Stripe-mirror architecture, schema, endpoints, worker, portal, permissions | Lines 1–159; claims `POST /api/v1/webhooks/stripe`, worker `stripe-reconcile`, `billing.view`/`billing.manage` |
| `apps/api/src/routes/billing.ts` | Code | All billing read APIs + sync + portal session | 377 lines; `router.use(requireAuth)`, `router.use(requireOrgAccess)` |
| `apps/api/src/routes/webhooks.ts` | Code | Stripe webhook handler | Lines 69–222; `constructEvent` over rawBody, dedup, upserts |
| `apps/api/src/routes/client-portal.ts` | Code | Entitlement derivation + admin provisioning | Lines 17–41, 82–116, 140–192 |
| `apps/worker/src/tasks/stripe-reconcile.ts` | Code | Reconciliation job | Lines 57–152; queries `billing_customers` + `subscriptions`, suspends memberships |
| `apps/worker/src/schedule-config.ts` | Code | Reconciliation scheduling | Lines 27–33; `stripe-reconcile` daily, `requiresEnv: ["STRIPE_SECRET_KEY"]` |
| `apps/api/src/config/env.ts` | Config | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` optional | Lines 24–25 |
| `apps/worker/src/env.ts` | Config | Worker `STRIPE_SECRET_KEY` optional | Line 19 |
| `supabase/migrations/5302026_...corrected.v3.sql` | Schema | Billing tables + enum + RLS | Lines 82, 510–570, 871–916, 1535–1620 |
| `supabase/migrations/5302414_client_portal_entitlements.sql` | Schema | Entitlement table + RLS | Confirmed on disk |
| `supabase/migrations/5302028_seed_permissions.sql` | Schema/seed | `billing.view`, `billing.manage` | Lines 43+ |
| `supabase/migrations/5302118_permission_matrix_full_catalog.sql` | Schema/seed | Billing permission matrix | Line 68 |
| `apps/api/src/lib/webhook-signature.ts` | Code | HMAC verification + timestamp tolerance | Lines 1–60 |
| `apps/api/src/lib/idempotency.ts` | Code | Atomic claim/delete idempotency | Lines 98–182 |
| `apps/api/src/app.ts` | Code | `express.json` rawBody capture | Lines 110–120; `req.rawBody = buf.toString()` (string) |
| `packages/sdk/src/billing.ts` | SDK | Client surface incl. `createPortalSession` | Lines 65–114 |
| `apps/web/app/(portal)/portal/billing/BillingPageClient.tsx` | UI | Customer billing page | Lines 106, 169–190; renders `default_payment_method` |
| `apps/api/src/__tests__/billing.test.ts` | Test | Billing route coverage | 249 lines; portal-session + scoping tests |
| `apps/api/src/__tests__/webhooks.test.ts` | Test | Stripe webhook coverage | Lines 93–161; cents test |
| `apps/api/src/__tests__/client-portal.test.ts` | Test | Entitlement coverage | Lines 114–156 |
| `apps/web/e2e/portal/billing.spec.ts` | Test | E2E billing smoke | 26 lines; render-only |
| `prompts/repo-deep-dive/20260728-0142-develop-21a10d6/29_...md` | Prior audit | Continuity | P0 "worker queries nonexistent columns" (BILL-F001) |
| `prompts/repo-deep-dive/20260730-0650-develop-62da92c/29_...md` | Prior audit | Continuity | BILL-P0-001 no entitlement gating; BILL-P1-001 no self-serve UI; BILL-P1-002 schedule |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `git rev-parse HEAD` → `6286137017c4b7c77e83ee420ec11382d984f263`; `git branch --show-current` → `develop` | Command | Bind audit to commit | Supported; matches requested commit/branch |
| Read `stripe-reconcile.ts:75-110` | Read | Reproduce prior P0 (BILL-F001: nonexistent membership columns) | Supported fix: worker now selects from `billing_customers` and `subscriptions`, not `memberships` columns. Prior P0 is `verified-fixed` (see BILL-P2-004) |
| Read `schedule-config.ts:27-33` | Read | Reproduce prior BILL-P1-002 (no schedule) | Supported fix: `stripe-reconcile` is scheduled daily with `requiresEnv`. Prior finding `verified-fixed` (see BILL-P3-002) |
| Read `client-portal.ts:17-41, 100-115` + `BillingPageClient.tsx:106` | Read | Reproduce prior BILL-P0-001 (no entitlement gating) | Partially supported: a module-entitlement list is now derived from subscription status and returned to the client (`enabledModules`). It is **not** enforced server-side on feature routes. Verdict: `partially supported` (see BILL-P1-001) |
| Read `billing.ts:311-375` + `BillingPageClient.tsx:95-104` + `sdk/billing.ts:111-113` | Read | Reproduce prior BILL-P1-001 (no self-serve billing UI) | Unsupported (fixed): `POST /billing/create-portal-session` + "Manage Billing" button + SDK method exist. Prior finding `verified-fixed` |
| Grep `from\("payments"\)|payments.*insert|stripe_payment_intent` in `apps/api/src` | Grep | Determine whether the `payments` table is populated | Supported: only one hit, `billing.ts:166` (a `.from("payments").select(...)` read). No insert/upsert anywhere. See BILL-P1-003 |
| Grep `refund|charge.refunded|dunning|trial_end|trial_start|cancel_at_period_end` across `apps` | Grep | Refund/trial/dunning coverage | Supported absence: only `cancel_at_period_end` (worker interface) and a code comment about dunning. No refund or trial handling. See BILL-P2-001, BILL-P2-005 |
| Grep `charge\.|payment_intent|invoice\.created|checkout\.session` across repo | Grep | Webhook event coverage | Supported: handled events are `invoice.paid`, `invoice.payment_failed`, `customer.subscription.{created,updated,deleted}`, `checkout.session.completed`. No `charge.refunded`, no `invoice.created/voided/marked_uncollectible`, no `payment_intent.*`. See BILL-P1-003, BILL-P2-001 |
| Read `app.ts:110-120` vs `webhooks.ts:85-94` | Read | Raw-body signature correctness | Partially supported: `rawBody` is written as `buf.toString()` (a **string**) but consumed as `Buffer` and passed to `stripe.webhooks.constructEvent`. This works because the Stripe SDK accepts `string | Buffer`, but the type contract is inconsistent (`rawBody?: string` at write, `rawBody?: Buffer` at read). Low-severity maintainability/type-safety risk, not a functional break today. See BILL-P3-001 |
| Read `idempotency.ts:98-133`, `webhooks.ts:40-49,105-110,214-221` | Read | Webhook idempotency | Supported: atomic `SET NX EX` claim, delete-on-failure release, deterministic key `stripe-${event.id}`. Strong control |
| Read `billing.test.ts`, `webhooks.test.ts`, `client-portal.test.ts` | Read | Test coverage of billing paths | Supported: route-level coverage exists but authz/subscription middleware is stubbed in billing tests; no test asserts entitlement *enforcement* |
| Read `billing.ts:195-262` (sync) | Read | Reconciliation completeness | Supported: sync fetches only `limit=20` invoices / `limit=10` subscriptions per customer, no pagination, no `payments` sync. See BILL-P2-002 |
| Read `5302026...sql:1535-1620` | Read | RLS on billing tables | Supported: `*_select_same_org` for authenticated approved members + `*_manage_admins` for `billing:manage`. Billing tables are RLS-enabled (`enable row level security`, lines 913–916) |

## Executive Summary

The repository has a **real, first-party Stripe billing integration** — this is not a "not applicable" case. There is a documented architecture (`docs/BILLING.md`), a full billing API (`apps/api/src/routes/billing.ts`), a signature-verified webhook (`apps/api/src/routes/webhooks.ts`), a daily reconciliation worker (`apps/worker/src/tasks/stripe-reconcile.ts` with a confirmed schedule), a customer/admin billing UI, a typed SDK surface, and seeded permissions (`billing.view`, `billing.manage`).

**Strengths.** The Stripe-mirror pattern is sound: Stripe is the source of truth and the app stores references (`stripe_customer_id`, `stripe_subscription_id`, `stripe_invoice_id`), never card data. Webhooks verify signatures via `stripe.webhooks.constructEvent` over the raw body, use an atomic Redis-backed idempotency claim keyed on `stripe-${event.id}`, release the claim on failure so retries re-process, and log PII-safe summaries. Amounts are stored in minor units (cents) with an explicit regression test against 100× inflation (`webhooks.test.ts:112-161`). The reconciliation worker was fixed since the previous audit: it now reads from `billing_customers` + `subscriptions`, prefers an active/trialing subscription, and only suspends on genuinely terminal states so `past_due` tenants are not locked out. The billing tables have RLS, scoped both to approved members (read) and `billing:manage` (write).

**Major risks.** Three gaps dominate:

1. **Entitlement is advisory, not enforced.** `client-portal.ts` derives `enabledModules` from subscription status and returns it to the client, but no server-side middleware rejects requests to gated feature routes (`findings`, `security-ops`, `governance`, `training-hub`, `service-catalog`, `qbr`) when a subscription is inactive. The gating list is a UI hint. This is the prior audit's P0, now only partially addressed.
2. **The `payments` table is never written.** It is read by `GET /billing/payments` and rendered in the portal, but no webhook or sync path inserts into it, so payment history is always empty in production. This is a silent-empty-data correctness bug.
3. **Reconciliation is incomplete and drift-blind.** `POST /billing/sync` fetches only the first 20 invoices / 10 subscriptions per customer with no pagination, and the worker only *suspends* memberships — it never detects amount/status drift, never alerts, and has no reconciliation tests. Failed payments (`invoice.payment_failed`) update invoice status but generate no notification or dunning visibility.

**Recommended next actions.** (1) Add a server-side `requireActiveSubscription`/`requireEntitlement` guard and apply it to gated routes; (2) populate `payments` from `payment_intent.succeeded`/`charge.succeeded` (or derive from paid invoices) and add the missing webhook events; (3) paginate sync and add a drift-detection alert plus reconciliation tests. Two prior findings (`BILL-F001` nonexistent columns, `BILL-P1-001` no self-serve UI) are **verified-fixed** at this commit; the prior entitlement-gating finding is **still-open/partially-fixed**.

Severity counts: **P0 = 0, P1 = 3, P2 = 4, P3 = 2** (9 findings).

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Billing routes | `apps/api/src/routes/billing.ts` | Summary/invoices/subscriptions/payments/customer/sync/portal-session | Implemented | Medium | `requireAuth` + `requireOrgAccess` at router level |
| Billing summary | `GET /billing/summary` | Active subs, overdue/paid/total, recent 5 invoices | Implemented | Low | `status = "active"` only; excludes `trialing` from "Active Plans" |
| Invoice list/detail | `GET /billing/invoices`, `/invoices/:id` | Paginated list + detail | Implemented | Low | Org scoping via query param; RLS backstop |
| Subscriptions list | `GET /billing/subscriptions` | All subs for org | Implemented | Low | No pagination (bounded by org size) |
| Payments list | `GET /billing/payments` | Paginated payments joined to invoice | Implemented (read) | High | Table never populated — see BILL-P1-003 |
| Billing customer | `GET /billing/billing-customer` | Single customer by org | Implemented | Low | Returns `default_payment_method` to UI |
| Manual sync | `POST /billing/sync` | Pull invoices + subs from Stripe | Partial | High | No pagination — see BILL-P2-002 |
| Portal session | `POST /billing/create-portal-session` | Stripe-hosted billing portal | Implemented | Low | Any org member (documented rationale lines 306–310) |
| Stripe webhook | `apps/api/src/routes/webhooks.ts` (`POST /stripe`) | Ingest Stripe events | Implemented | Medium | Event coverage gaps — see BILL-P1-003 |
| Webhook signature | `stripe.webhooks.constructEvent(rawBody, sig, secret)` | Authenticate webhooks | Implemented | Low | Raw-body type mismatch — BILL-P3-001 |
| Webhook idempotency | `claimIdempotencyKey`/`deleteIdempotencyKey` | Dedup + retry safety | Implemented | Low | Atomic claim; strong control |
| Subscription model | `public.subscriptions` | Mirror of Stripe subscription | Implemented | Medium | No trial/interval/seat columns — BILL-P2-005 |
| Billing customer model | `public.billing_customers` | Mirror of Stripe customer | Implemented | Low | `default_payment_method` text — BILL-P3-002 |
| Invoice model | `public.invoices` + `invoice_status` enum | Invoice records | Implemented | Low | `draft,open,paid,void,uncollectible,overdue` |
| Payments model | `public.payments` | Payment records | Skeleton (unused) | High | Never inserted — BILL-P1-003 |
| Entitlement table | `client_portal_entitlements` (`5302414`) | Per-tenant module provisioning | Implemented | Medium | Admin-managed override |
| Entitlement logic | `client-portal.ts` `deriveEnabledModules` | Subscription → module list | Partial | High | Advisory only — BILL-P1-001 |
| Reconciliation worker | `stripe-reconcile.ts` | Suspend memberships on terminal subs | Implemented | Medium | No drift/amount reconciliation — BILL-P2-003 |
| Worker schedule | `schedule-config.ts` | Daily `stripe-reconcile` | Implemented | Low | `requiresEnv: ["STRIPE_SECRET_KEY"]` |
| Portal billing page | `apps/web/.../portal/billing/*` | Customer billing view + Manage/Sync | Implemented | Medium | Renders raw PM id — BILL-P3-002 |
| Admin billing page | `apps/web/.../admin/organizations/[orgId]/billing/*` | Admin per-org view | Implemented | Low | Same rendering concern |
| SDK | `packages/sdk/src/billing.ts` | Typed client | Implemented | Low | Includes `createPortalSession` |
| Permissions | `billing.view`, `billing.manage` | RBAC keys | Seeded | Low | `5302028`, `5302118` |
| RLS | `*_select_same_org`, `*_manage_admins` | Row-level security | Implemented | Low | RLS enabled on all 4 billing tables |
| Audit logging | `logAuditEvent` in billing.ts/webhooks.ts | Billing audit trail | Implemented | Low | `billing.sync`, `billing.portal_session`, `stripe.*` |
| Docs | `docs/BILLING.md`, `docs/modules/billing.md` | Billing reference | Implemented (drift) | Medium | Doc lists only 2 migrations; omits 5302414, 5302051, etc.; omits portal-session endpoint |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Billing pages | 3 | `portal/billing/page.tsx` + `BillingPageClient.tsx`, admin client, `billing.spec.ts` (render-only E2E) | No entitlements/plan-change UI beyond Stripe portal; E2E is smoke-only; renders raw PM id | Add plan/trial status display; mask PM id; deepen E2E |
| Subscription/plan models | 3 | `subscriptions` table (`5302026:521-534`), sync + webhook upsert | No `trial_*`, `interval`, `plan_id`, seats; plan_name is a Stripe nickname fallback to "Unknown" | Add trial/interval/plan columns; local plan reference |
| Entitlement checks | 2 | `client-portal.ts:17-41,100-115`; `client_portal_entitlements` | Derived list returned to client, not enforced server-side | Add `requireEntitlement`/`requireActiveSubscription` middleware (BILL-P1-001) |
| Billing APIs | 3 | `billing.ts` all routes; `billing.test.ts` | `payments` empty; sync unpaginated; subscriptions unpaginated | Populate payments; paginate sync (BILL-P1-003, BILL-P2-002) |
| Payment provider integration | 3 | Stripe SDK + `httpClients.stripe` (15s timeout, 2 retries); cents storage tested | Pinned `apiVersion` cast `as any`; no refunds; secrets wiring unverified | Confirm API version; add refund handling; verify SSM wiring (cross-ref 12) |
| Webhooks | 3 | `webhooks.ts:69-222`; `constructEvent`; atomic dedup; `webhooks.test.ts` | Missing `charge.refunded`, `invoice.created/voided/marked_uncollectible`; rawBody type mismatch | Expand event coverage; fix rawBody typing (BILL-P1-003, BILL-P3-001) |
| Invoices/status records | 3 | `invoices` table + enum; webhook + sync upsert; overdue derivation | No `invoice.voided`/`marked_uncollectible` events; status derived inconsistently | Map full invoice lifecycle (BILL-P2-005) |
| Reconciliation jobs | 2 | `stripe-reconcile.ts`; daily schedule; `task-handlers.test.ts` (env-missing only) | Suspend-only; no drift detection, no reconciliation of amounts/invoices/payments, no tests | Add drift detection + reconciliation tests (BILL-P2-003) |
| Failed payments | 2 | `invoice.payment_failed` handled in `webhooks.ts:114-151` | No notification, no dunning state, no retry visibility | Notify + surface past-due (BILL-P2-004) |
| Refund/cancel/trial states | 2 | `customer.subscription.deleted` handled; `trialing` recognized in UI/bootstrap | No refund events; no trial columns; no local cancel intent | Add `charge.refunded`; add trial tracking (BILL-P2-001) |
| Seat counts | 0 | No seat columns/usage anywhere (grep) | Fully absent | Unknown requirement; document expectation |
| Usage billing | 0 | No usage/metering code or tables (grep) | Fully absent | Unknown requirement; document expectation |

## Detailed Review

### Item: Billing pages (portal + admin)

- Evidence: `apps/web/app/(portal)/portal/billing/page.tsx`, `BillingPageClient.tsx` (lines 78–325), `apps/web/app/(admin)/admin/organizations/[orgId]/billing/AdminBillingClient.tsx` (lines 45, 183–186).
- What it does: Portal shows stat cards (Active Plans, Overdue, Paid, Total Invoices), active-plan panel, billing details (email, payment method), invoice table with PDF/View links, subscription history, "Sync from Stripe" and "Manage Billing" buttons.
- How it appears to work: Server component loads via `getApiClient()` + `getApprovedMembership()`; client component calls `billing.syncFromStripe()` and `billing.createPortalSession()` and redirects to the returned Stripe URL.
- Dependencies: `@/lib/api`, `@/lib/auth/membership`, SDK `BillingApi`.
- Current controls: Page requires an approved membership; API requires `requireAuth` + `requireOrgAccess`.
- Missing controls: No display of trial end / interval; raw Stripe payment-method id rendered to the user (BILL-P3-002).
- Risks: Low-to-medium; informational leakage of a Stripe PM id (not PAN, but an opaque provider token).
- Recommended improvement: Mask PM id (e.g. show brand/last4 once available, else "Saved card"); add trial/interval display.
- Suggested tests: React component test asserting PM id is masked; E2E asserting plan panel renders a formatted price/period.
- Suggested docs: Update `docs/BILLING.md` portal section to match the added "Manage Billing" flow.

### Item: Subscription/plan models

- Evidence: `5302026_...sql:510-570`; upserts at `billing.ts:266-288` and `webhooks.ts:153-187`.
- What it does: Mirrors Stripe customers, subscriptions, invoices, payments with cents-based amounts and FK to `organizations`.
- How it appears to work: Both webhook and sync upsert on `stripe_subscription_id`/`stripe_invoice_id` conflict keys; `plan_name` from `price.nickname ?? price.product ?? "Unknown"`.
- Dependencies: Stripe price/product metadata must be populated or `plan_name` is `"Unknown"`.
- Current controls: Unique constraints on Stripe ids; `updated_at` triggers; RLS.
- Missing controls: No `trial_start`/`trial_end`, no `interval`, no `plan_id`, no seat/quantity columns; no local `plans` reference table.
- Risks: Cannot render trial countdown or billing interval without a live Stripe call; "Unknown" plan names degrade the UI.
- Recommended improvement: Add `trial_start`, `trial_end`, `interval`, `quantity` to `subscriptions`; populate from webhook/sync; add a `plans` reference table if tiers are fixed.
- Suggested tests: Migration test asserting new columns; webhook test asserting trial fields persist.
- Suggested docs: Extend `docs/BILLING.md` schema tables.

### Item: Entitlement checks

- Evidence: `client-portal.ts:17-41` (`DEFAULT_ENABLED_MODULES`, `SUBSCRIPTION_ENABLED_MODULES`, `deriveEnabledModules`), lines 82–116 (per-org overrides), lines 140–192 (admin GET/PUT `entitlements`), `client_portal_entitlements` migration `5302414`; consumers `apps/web/.../portal/client-portal/page.tsx:76-78`.
- What it does: Computes a per-membership `enabledModules` list: subscription active/trialing ⇒ full set; otherwise default set. Admin-provisioned rows override.
- How it appears to work: The list is returned in `GET /client-portal/bootstrap` and rendered by the portal UI as module tiles.
- Dependencies: `subscriptions.status`, `client_portal_entitlements`.
- Current controls: Admin provisioning endpoint is `requireAdmin` + `requireOrgAccess`; audit-logged.
- Missing controls: **No server-side enforcement.** No middleware checks `enabledModules`/entitlement before allowing access to gated feature routes (e.g. `routes/findings.ts`, `routes/qbr.ts`). Grep for `requireEntitlement`/`requireActiveSubscription`/`subscriptionActive` across `apps` returned no middleware.
- Risks: High — a canceled/past-due/no-subscription org still has full API access to gated modules; the gating is cosmetic.
- Recommended improvement: Add `requireEntitlement(moduleKey)` and/or `requireActiveSubscription` middleware that resolves the org's subscription status (with a short-lived cache) and returns 402/403 for inactive orgs; apply to gated feature routers. Add a documented grace period.
- Suggested tests: Middleware unit tests (active vs past_due vs canceled vs trialing); route integration tests asserting 402/403 when inactive.
- Suggested docs: Document enforced entitlements and grace semantics in `docs/BILLING.md` and `docs/modules/billing.md`.

### Item: Billing APIs

- Evidence: `billing.ts` (`/summary` 47–99, `/invoices` 101–123, `/invoices/:id` 125–137, `/subscriptions` 139–155, `/payments` 157–178, `/billing-customer` 180–193, `/sync` 195–304, `/create-portal-session` 311–375).
- What it does: Read APIs for invoices/subscriptions/payments/customer + summary; `POST /sync` (permission `billing:manage`); `POST /create-portal-session` (any org member).
- How it appears to work: Router-level `requireAuth` + `requireOrgAccess`; queries via `getScopedClient(req, "billing", ...)`; org scoping via optional `organization_id` query; RLS backstop.
- Dependencies: Supabase client, Stripe env, `httpClients.stripe`.
- Current controls: Auth + org access + permission on sync; audit logs on sync and portal session.
- Missing controls: `/payments` returns data from a never-populated table (BILL-P1-003); `/sync` has no pagination (BILL-P2-002); `/subscriptions` unpaginated; `/summary` counts only `status = "active"` (excludes `trialing`) for "Active Plans".
- Risks: Empty payment history misleads operators; incomplete sync silently under-reports invoices/subs.
- Recommended improvement: Populate `payments`; paginate sync; include `trialing` in active-sub count or label it distinctly.
- Suggested tests: Assert `/payments` returns rows after a `payment_intent.succeeded` webhook; sync pagination test with >20 invoices.
- Suggested docs: Note pagination limits and the payments population source.

### Item: Payment provider integration

- Evidence: `apps/api/src/lib/http-client.ts:138` (`stripe: createHttpClient({ timeout: 15_000, maxRetries: 2 })`), Stripe SDK usage in `webhooks.ts:3,85-94`, raw REST in `billing.ts:224-233,344-354`, worker `stripe-reconcile.ts:28-55`.
- What it does: Uses the Stripe Node SDK for webhook construction and raw REST (`/v1/invoices`, `/v1/subscriptions`, `/v1/billing_portal/sessions`) for sync and portal.
- How it appears to work: Bearer auth with `STRIPE_SECRET_KEY`; portal session posts form-encoded `customer` + `return_url`.
- Dependencies: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Stripe account config.
- Current controls: Timeouts/retries on the API HTTP client; idempotent upserts.
- Missing controls: `apiVersion: "2025-03-31.basil" as any` (pinned, cast to bypass typing) in `webhooks.ts:86`; no refunds; secrets wiring for production only asserted in docs (`docs/BILLING.md:142`) — unverified in repo.
- Risks: API-version drift on a cast-pinned version can silently change event field shapes; unverified secret injection is an operational risk (cross-ref 12/38).
- Recommended improvement: Centralize the Stripe client in one module with a typed, deliberate `apiVersion`; add a startup assertion that the key/secret are present in production.
- Suggested tests: Unit test that the webhook client is constructed with the expected version; a config test asserting production requires Stripe env.
- Suggested docs: Document the Stripe API version and secret-injection path.

### Item: Webhooks

- Evidence: `webhooks.ts:69-222`; `webhook-signature.ts`; `idempotency.ts`; `app.ts:110-120`; tests `webhooks.test.ts:93-161`.
- What it does: `POST /api/v1/webhooks/stripe` verifies signature, dedups, upserts invoices/subscriptions/billing_customers, logs audit + metrics.
- How it appears to work: `constructEvent(rawBody, signature, secret)`; 400 on missing/invalid; 500 on missing secret; atomic claim `stripe-${event.id}`; delete claim on error.
- Dependencies: `STRIPE_WEBHOOK_SECRET`, raw body capture, Redis (or in-memory fallback).
- Current controls: Signature verification, timestamp-agnostic (Stripe signs `t`), atomic idempotency, audit log, `recordWebhookDelivery`.
- Missing controls: Event coverage gaps (`charge.refunded`, `invoice.created/voided/marked_uncollectible`, `payment_intent.*`); rawBody typed as `string` but consumed as `Buffer`.
- Risks: Refunds/voided invoices never reflected locally; payments never recorded; type drift may break verification on a future refactor.
- Recommended improvement: Handle refund/void events and payment intents; normalize `rawBody` to a `Buffer` at capture.
- Suggested tests: Add cases for `charge.refunded` and `invoice.voided`; a regression test for the rawBody type.
- Suggested docs: Update the webhook event table in `docs/BILLING.md`.

### Item: Invoices/status records

- Evidence: `invoices` table (`5302026:538-556`), enum (`:82`), upsert status derivation (`webhooks.ts:124-127`, `billing.ts:238-241`).
- What it does: Stores invoice amounts/status/urls; derives `overdue` when `status=open` and `due_date` is past.
- How it appears to work: `onConflict: stripe_invoice_id`; paid_at from `status_transitions.paid_at`.
- Dependencies: Stripe invoice payload shape.
- Current controls: Unique Stripe invoice id; enum constraint; cents storage.
- Missing controls: `void`/`uncollectible` transitions only arrive if Stripe emits `invoice.*` events that are currently unhandled; `paid_at` for sync uses `status_transitions?.paid_at ?? 0` producing epoch 1970 if missing (minor).
- Risks: Stale invoice states; a paid invoice synced without `paid_at` could store `1970-01-01`.
- Recommended improvement: Handle invoice lifecycle events; guard `paid_at` against missing timestamps.
- Suggested tests: Sync test with a paid invoice lacking `status_transitions`.
- Suggested docs: Document status derivation rules.

### Item: Reconciliation jobs

- Evidence: `stripe-reconcile.ts:57-152`; `schedule-config.ts:27-33`; `tasks/index.ts:34`; `main.ts:58-59`.
- What it does: Daily (env-gated) batch that fetches each billing customer's preferred subscription from Stripe and suspends `approved` memberships when the subscription is terminal.
- How it appears to work: Selects `billing_customers` with a Stripe id; picks active/trialing sub else most recent; `fetchStripeSubscription` with 15s timeout + retry on 429; suspend only on `canceled|unpaid|incomplete_expired`; `dryRun` supported.
- Dependencies: `STRIPE_SECRET_KEY`, Supabase service role.
- Current controls: Terminal-state-only suspension (protects `past_due`); dry-run; per-customer error counting.
- Missing controls: No reconciliation of invoices/payments/amounts; no drift detection or alerting; no reconciling of subscriptions for customers without a `billing_customers` row; no tests beyond the env-missing case.
- Risks: Silent drift between Stripe and local mirror; no early warning of webhook loss.
- Recommended improvement: Add drift metrics (counts/sums per org vs Stripe), alert on divergence, and reconcile the `subscriptions`/`invoices` tables in addition to membership suspension.
- Suggested tests: Task test with mocked Stripe (terminal vs past_due vs active), and a drift-detection test.
- Suggested docs: Document reconciliation scope and limitations.

### Item: Failed payments

- Evidence: `webhooks.ts:114-151` (`invoice.payment_failed`), `notify.ts:12` module type includes `"billing"`.
- What it does: Upserts the invoice with derived status on failure; sets `paid_at` null.
- How it appears to work: Same path as `invoice.paid` except status remains `open`/`overdue`.
- Dependencies: Stripe events.
- Current controls: Invoice state update; audit log.
- Missing controls: No in-app/email notification for `billing` module on failure; no dunning state surfaced to the UI.
- Risks: Customers unaware of failed payments until access is suspended; churn risk.
- Recommended improvement: Emit a `billing` notification (and optional email) on `invoice.payment_failed`, linking to the Stripe portal.
- Suggested tests: Assert a notification row is created on `invoice.payment_failed`.
- Suggested docs: Document dunning/notification behavior.

### Item: Refund/cancel/trial states

- Evidence: `webhooks.ts:153-187` (`customer.subscription.{created,updated,deleted}`), `stripe-reconcile.ts:16,120-122`, UI `statusColor` (`BillingPageClient.tsx:62-76`).
- What it does: Mirrors subscription status incl. `canceled`; recognizes `trialing` in UI/bootstrap.
- How it appears to work: `customer.subscription.deleted` upserts a `canceled` row; worker then suspends.
- Dependencies: Stripe events.
- Current controls: Status mirror; terminal-state suspension.
- Missing controls: No `charge.refunded`/`charge.refund.updated` handling; no `trial_start`/`trial_end` columns; no local cancel-intent state (`cancel_at_period_end` fetched but unused).
- Risks: Refunds invisible; trials only visible via Stripe; "cancels at period end" indistinguishable from active.
- Recommended improvement: Handle refund events; persist trial and cancel-at-period-end fields.
- Suggested tests: Refund webhook test; trial-field persistence test.
- Suggested docs: Document refund and trial handling.

### Item: Seat counts / Usage billing

- Evidence: No columns (grep `seat`, `quantity`, `usage` in schema/code returned nothing billing-related); no metering tables.
- What it does: Nothing.
- Missing controls: Entire model absent.
- Risks: Low today unless the product intends seat/usage pricing — requirement `Unknown`.
- Recommended improvement: If required, add `quantity` to `subscriptions` and a usage table; otherwise document explicitly that billing is flat-rate.
- Suggested tests: N/A until requirement confirmed.
- Suggested docs: State explicitly in `docs/BILLING.md` that seat/usage billing is not supported.

### Item: Sensitive data

- Evidence: `billing_customers.default_payment_method` (text), `billing_email` (citext); `BillingPageClient.tsx:169-173`; no PAN/CVC storage anywhere.
- What it does: Stores only Stripe references + billing email; renders the PM id to users.
- Current controls: No card data stored; RLS on tables; `FIELD_ENCRYPTION_KEY` exists for profile PII (not applied to billing).
- Missing controls: PM id is shown raw in UI; billing email is not encrypted at rest (citext, plaintext).
- Risks: Minor (opaque token, not a PAN); PII-in-plaintext for billing contact.
- Recommended improvement: Mask PM id in UI; consider encrypting `billing_email` or relying on Stripe as the source.
- Suggested tests: UI test asserting masking.
- Suggested docs: Data-handling note in `docs/BILLING.md`.

### Item: Audit logs

- Evidence: `billing.ts:293-298` (`billing.sync`), `364-369` (`billing.portal_session`), `webhooks.ts:203-208` (`stripe.{type}`), `client-portal.ts:119-123,179-186`.
- What it does: Records billing mutations and webhook receipts.
- Current controls: `logAuditEvent` with actor + action + metadata.
- Missing controls: No audit event for billing *page views* (acceptable); no audit of entitlement reads (acceptable).
- Risks: Low.
- Recommended improvement: None required; optionally add `billing.portal_session` denial logging.
- Suggested tests: Assert audit rows for sync/portal-session.
- Suggested docs: Keep `docs/BILLING.md` audit section current.

### Item: Tests/docs

- Evidence: `billing.test.ts` (route-level, middleware stubbed), `webhooks.test.ts` (cents + signature), `client-portal.test.ts` (entitlement derivation), `task-handlers.test.ts` (env-missing only), `e2e/portal/billing.spec.ts` (render-only), `docs/BILLING.md`.
- Current controls: Meaningful unit coverage of cents handling and org scoping.
- Missing controls: No test proves entitlement *enforcement*; no reconciliation-drift test; no refund/void webhook test; E2E is smoke-only.
- Recommended improvement: Add the tests listed in "Suggested Tests".
- Suggested docs: Update `docs/BILLING.md` (it currently lists only 2 migrations and omits the portal-session endpoint and `520...`/`5302414`/`5302051` migrations).

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| BILL-001 | Billing pages | `portal/billing/page.tsx`, `BillingPageClient.tsx` | Approved-membership gate; Manage/Sync | PM id shown raw; E2E render-only | P3 | Mask PM; deepen tests |
| BILL-002 | Subscription/plan models | `5302026:521-534` | Stripe mirror; cents | No trial/interval/seat/plan_id | P2 | Add columns + populate |
| BILL-003 | Entitlement checks | `client-portal.ts:17-41,100-115` | Advisory `enabledModules` | Not enforced server-side | P1 | Add enforcement middleware |
| BILL-004 | Billing APIs | `billing.ts` | Auth + org access + RLS | `payments` empty; sync unpaginated | P1/P2 | Populate payments; paginate |
| BILL-005 | Payment provider integration | `http-client.ts:138`, `webhooks.ts:85-94` | Timeouts/retries; bearer auth | Pinned `as any` version; no refunds | P2 | Centralize client; add refunds |
| BILL-006 | Webhooks | `webhooks.ts:69-222` | Signature + atomic idempotency | Event coverage gaps; rawBody typing | P1/P3 | Expand events; fix typing |
| BILL-007 | Invoices/status records | `5302026:538-556`; upserts | Enum + unique ids | No void/uncollectible events; paid_at fallback | P2 | Handle lifecycle; guard paid_at |
| BILL-008 | Reconciliation jobs | `stripe-reconcile.ts`; `schedule-config.ts` | Daily suspend-only; dry-run | No drift detection; no reconciliation tests | P2 | Drift metrics + tests |
| BILL-009 | Failed payments | `webhooks.ts:114-151` | Invoice status update | No notification/dunning | P2 | Notify on failure |
| BILL-010 | Refund/cancel/trial states | `webhooks.ts:153-187` | Sub status mirror; trialing in UI | No refunds; no trial/cancel-intent fields | P2 | Add refunds + trial fields |
| BILL-011 | Seat counts | (none found) | None | Entirely absent | P2 | Document/decide requirement |
| BILL-012 | Usage billing | (none found) | None | Entirely absent | P2 | Document/decide requirement |

## Findings

### Finding ID: BILL-P1-001 - Module entitlements are derived but not enforced server-side

- Severity: P1
- Confidence: High
- Area: Entitlement checks
- Evidence:
  - `apps/api/src/routes/client-portal.ts` — `DEFAULT_ENABLED_MODULES` (lines 17–26), `SUBSCRIPTION_ENABLED_MODULES` (lines 29–37), `deriveEnabledModules` (lines 39–41), `enabledModules` returned per membership (line 115).
  - `apps/web/app/(portal)/portal/client-portal/page.tsx` (lines 76–78) — the list is rendered as UI tiles.
  - Grep for `requireActiveSubscription|requireSubscription|subscriptionActive|subscription_status` across `apps` returned only `client-portal.ts` (derivation) and a worker comment; no enforcing middleware exists.
  - Feature routers such as `apps/api/src/routes/findings.ts`, `apps/api/src/routes/qbr.ts` gate on roles/permissions (`module_key` in `permissions`, a different concept), not on subscription entitlement.
- What is happening: The server computes which modules an org may use and sends that list to the browser. Nothing on the server rejects calls to gated feature endpoints when the org has no active/trialing subscription. The gate is cosmetic.
- Why it matters: Access control that exists only in the client is not a control. The prior run (`20260730`, BILL-P0-001) flagged the total absence of gating; the current commit adds derivation but not enforcement.
- User / business impact: Non-paying, canceled, or past-due organizations retain full API access to premium modules — direct revenue leakage and a broken upgrade incentive.
- Security / privacy / reliability impact: Authorization bypass of intended plan boundaries; a tenant can consume premium compute/data without an active subscription.
- Recommended fix: Add `apps/api/src/middleware/entitlement.ts` exporting `requireEntitlement(moduleKey)` and `requireActiveSubscription`, resolving the org's subscription status (short-lived cache keyed by `organization_id`), returning `402 PAYMENT_REQUIRED`/`403` with an explicit error envelope when inactive. Apply to gated feature routers; keep admin/super-admin bypass. Reuse `deriveEnabledModules` as the single source of truth for the enabled set so client and server cannot diverge.
- Suggested validation: Middleware unit tests for `active`, `trialing`, `past_due`, `canceled`, `unpaid`; route integration tests asserting 402/403 for inactive orgs and 200 for active; a regression test that the server set equals the client `enabledModules` set.
- Owner suggestion: Billing/API platform owner
- Effort estimate: M
- Dependencies: `client-portal.ts` derivation helper; `subscriptions` status data; confirmation of desired grace-period policy.
- Status: still-open
- Endpoint / data path: Any gated feature route (e.g. `apps/api/src/routes/findings.ts`) → (missing middleware) → service-role Supabase query. Intended path: request → `requireEntitlement` → subscription lookup → allow/deny.
- Attack path: Authenticated member of an org with an expired subscription calls premium module endpoints directly (bypassing the portal UI) and receives full data/features.

### Finding ID: BILL-P1-002 - `payments` table is never populated; payment history is silently empty

- Severity: P1
- Confidence: High
- Area: Billing APIs / Invoices
- Evidence:
  - `apps/api/src/routes/billing.ts:157-178` — `GET /payments` reads `payments` with a join to `invoices`.
  - Grep `from\("payments"\)|payments.*insert|stripe_payment_intent` across `apps/api/src` returned only `billing.ts:166` (a read). No insert/upsert exists.
  - `apps/api/src/routes/webhooks.ts:114-201` — Stripe handler upserts `invoices`, `subscriptions`, `billing_customers` only; never `payments`.
  - `apps/api/src/routes/billing.ts:235-288` — sync upserts `invoices` and `subscriptions` only.
  - `supabase/migrations/5302026_...sql:558-568` — `payments` table exists (incl. `stripe_payment_intent_id`).
- What is happening: The `payments` table is read and rendered but no code path writes it. The only rows that can appear are from seed data (`supabase/migrations/5302119_demo_test_data.sql:119`, `seeds/*.sql`).
- Why it matters: A billing feature that always returns empty results is a correctness defect and a false-success UI: operators and customers see "no payments" even when invoices are paid.
- User / business impact: Admins cannot see payment-level history or reconcile received amounts; support/operations lose a key billing signal.
- Security / privacy / reliability impact: Low direct security impact; high data-integrity/reliability impact.
- Recommended fix: Populate `payments` from `payment_intent.succeeded` (or `charge.succeeded`) in `webhooks.ts`, and add a payments sync branch in `POST /sync` (fetch `/v1/payment_intents?customer=...` or derive from paid invoices), upserting on `stripe_payment_intent_id` with `invoice_id` resolved.
- Suggested validation: Webhook test asserting a `payments` upsert on `payment_intent.succeeded`; integration test that `/billing/payments` returns the inserted row; seed-independent test that a fresh org with a paid invoice shows exactly one payment.
- Owner suggestion: Billing/API platform owner
- Effort estimate: M
- Dependencies: Webhook event coverage work (BILL-P2-004); `payments` schema.
- Status: still-open
- Endpoint / data path: `GET /api/v1/billing/payments` → `getScopedClient` → `payments` (empty). Write path currently absent.
- Attack path: none identified

### Finding ID: BILL-P1-003 - Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded

- Severity: P1
- Confidence: High
- Area: Webhooks
- Evidence:
  - `apps/api/src/routes/webhooks.ts:114-201` — handles only `invoice.paid`, `invoice.payment_failed`, `customer.subscription.{created,updated,deleted}`, `checkout.session.completed`.
  - Grep `charge\.|payment_intent|invoice\.created|checkout\.session` across the repo found no handling of `charge.refunded`, `charge.refund.updated`, `invoice.created`, `invoice.voided`, `invoice.marked_uncollectible`, or `payment_intent.*`.
  - `apps/api/src/openapi/spec.ts:985-986` — the webhook is documented only as "Stripe webhook handler".
- What is happening: Refund and invoice-void/uncollectible transitions are never ingested, so a refunded or voided invoice keeps its prior local status; payments never arrive (compounds BILL-P1-002).
- Why it matters: The local mirror silently diverges from Stripe exactly in the cases that matter for money movement and revenue recognition.
- User / business impact: Incorrect revenue reporting; customers may see an invoice as "paid" after a refund; finance reconciliation cannot trust the portal.
- Security / privacy / reliability impact: Data-integrity/reliability; potential dispute-handling gaps.
- Recommended fix: Add handlers for `charge.refunded`/`charge.refund.updated` (update the linked invoice/payment), `invoice.voided` and `invoice.marked_uncollectible` (map to `void`/`uncollectible` enum values), and `payment_intent.succeeded`/`failed` (populate payments). Keep them idempotent via the existing `stripe-${event.id}` claim.
- Suggested validation: Webhook tests for each new event asserting the expected DB mutation; a status-transition regression test (`paid` → `void` on `invoice.voided`).
- Owner suggestion: Billing/API platform owner
- Effort estimate: M
- Dependencies: `invoice_status` enum already has `void`/`uncollectible`; payments population (BILL-P1-002).
- Status: still-open
- Endpoint / data path: `POST /api/v1/webhooks/stripe` → (no branch for refund/void) → no DB write.
- Attack path: none identified

### Finding ID: BILL-P2-001 - No refund and incomplete trial/cancel state handling

- Severity: P2
- Confidence: High
- Area: Refund/cancel/trial states
- Evidence:
  - Grep `refund|charge.refunded|dunning|trial_end|trial_start|cancel_at_period_end` across `apps` returned only `stripe-reconcile.ts:16` (`cancel_at_period_end` in an interface it never uses) and a code comment at line 120.
  - `supabase/migrations/5302026_...sql:521-534` — `subscriptions` has no `trial_start`, `trial_end`, `cancel_at_period_end`, or `interval`.
  - `apps/web/app/(portal)/portal/billing/BillingPageClient.tsx:62-76` — UI has a `trialing` color but no trial dates.
- What is happening: Trials are recognized as a status string but no trial window is stored; cancel-at-period-end is fetched into an interface but discarded; refunds are entirely unhandled.
- Why it matters: The product cannot show trial countdowns or "cancels on <date>", and cannot reflect refunds.
- User / business impact: Poor billing transparency; support burden; potential missed conversion prompts before trial expiry.
- Security / privacy / reliability impact: Low; correctness/UX and revenue-ops impact.
- Recommended fix: Add `trial_start`, `trial_end`, `cancel_at_period_end`, `interval` columns to `subscriptions`; persist them in webhook + sync upserts; surface trial end and cancel date in the UI; handle refund events (shared with BILL-P1-003).
- Suggested validation: Webhook test asserting trial/cancel fields persist; component test asserting the cancel date renders.
- Owner suggestion: Billing platform owner
- Effort estimate: M
- Dependencies: Schema migration; webhook expansion (BILL-P1-003).
- Status: still-open
- Endpoint / data path: Stripe `customer.subscription.updated` → upsert (fields dropped) → UI.
- Attack path: none identified

### Finding ID: BILL-P2-002 - `POST /billing/sync` does not paginate Stripe results

- Severity: P2
- Confidence: High
- Area: Billing APIs / Reconciliation
- Evidence:
  - `apps/api/src/routes/billing.ts:224-233` — `https://api.stripe.com/v1/invoices?customer=...&limit=20` and `.../subscriptions?customer=...&limit=10`.
  - No `starting_after`/`has_more` handling anywhere in `billing.ts`.
- What is happening: Sync pulls only the first page per customer; customers with >20 invoices or >10 subscriptions are partially mirrored without warning.
- Why it matters: Manual reconciliation appears to succeed (`synced` count increments) while leaving data stale — a false-success pattern.
- User / business impact: Incomplete invoice/subscription history; finance sees an inaccurate picture; the "Sync" button over-promises.
- Security / privacy / reliability impact: Data-integrity/reliability.
- Recommended fix: Loop on `has_more`/`starting_after` until exhausted (or a bounded max), and report `invoicesSynced`/`subscriptionsSynced` counts in the response. Consider syncing payments too (BILL-P1-002).
- Suggested validation: Test with a mocked Stripe returning two pages; assert all rows upserted.
- Owner suggestion: Billing/API platform owner
- Effort estimate: S
- Dependencies: None.
- Status: still-open
- Endpoint / data path: `POST /api/v1/billing/sync` → Stripe REST (single page) → upsert.
- Attack path: none identified

### Finding ID: BILL-P2-003 - Reconciliation job has no drift detection, alerting, or tests

- Severity: P2
- Confidence: High
- Area: Reconciliation jobs
- Evidence:
  - `apps/worker/src/tasks/stripe-reconcile.ts:99-139` — only suspends memberships on terminal subscriptions; no comparison of amounts, statuses, or counts.
  - `apps/worker/src/schedule-config.ts:27-33` — scheduled daily; `apps/worker/src/__tests__/tasks/task-handlers.test.ts:67-73` — the only test asserts the env-missing error.
  - No reconciliation metric/alert is emitted on drift.
- What is happening: The job is a one-way enforcement action (suspend), not a reconciliation of the mirror against Stripe.
- Why it matters: Silent drift is undetectable; if webhooks are lost, nothing surfaces the discrepancy.
- User / business impact: Operators cannot prove the portal matches Stripe; billing disputes are harder.
- Security / privacy / reliability impact: Reliability/observability gap.
- Recommended fix: Emit drift metrics (per-org invoice count/sum, subscription status mismatch, payment count) and alert when divergence exceeds a threshold; optionally auto-repair `subscriptions`/`invoices` from the fetched Stripe state; return counts in `TaskResult`.
- Suggested validation: Task test with mocked Stripe showing drift → assert metric/alert emitted; test that non-terminal (`past_due`) does not suspend.
- Owner suggestion: Worker/platform owner
- Effort estimate: M
- Dependencies: Metrics/alerting stack (cross-ref 14).
- Status: still-open
- Endpoint / data path: worker timer → `stripe-reconcile` → Stripe REST + Supabase update.
- Attack path: none identified

### Finding ID: BILL-P2-004 - Failed payments produce no notification or dunning visibility

- Severity: P2
- Confidence: High
- Area: Failed payments
- Evidence:
  - `apps/api/src/routes/webhooks.ts:114-151` — `invoice.payment_failed` updates the invoice only.
  - `apps/api/src/lib/notify.ts:12` — module union includes `"billing"`, but no billing notification is created in the webhook handler.
  - Prior run `20260730` BILL-P2-002 recorded the same gap; no notifying code exists at this commit.
- What is happening: Payment failures are recorded in the invoice table and audit log but never surfaced to the customer.
- Why it matters: Customers learn of failures only when access is suspended (via the reconcile worker), which is the worst possible moment.
- User / business impact: Higher churn, more support tickets, involuntary failures that could be avoided with an "update your card" prompt.
- Security / privacy / reliability impact: Low; UX/revenue impact.
- Recommended fix: On `invoice.payment_failed`, create a `billing`-module notification (and optional email) linking to the Stripe portal; surface a "past due — update payment" banner in the portal billing page.
- Suggested validation: Webhook test asserting a notification row is created; UI test for the past-due banner.
- Owner suggestion: Billing platform owner
- Effort estimate: S
- Dependencies: Notification service (cross-ref 30).
- Status: still-open
- Endpoint / data path: `POST /webhooks/stripe` (`invoice.payment_failed`) → invoice upsert (no notification).
- Attack path: none identified

### Finding ID: BILL-P2-005 - Subscription/invoice schema lacks trial, interval, and void-lifecycle fields

- Severity: P2
- Confidence: Medium
- Area: Subscription/plan models
- Evidence:
  - `supabase/migrations/5302026_...sql:521-534` — `subscriptions` columns only include `plan_name`, `status`, period bounds, `amount_cents`, `currency`.
  - `supabase/migrations/5302026_...sql:82` — `invoice_status` includes `void`/`uncollectible`, but those transitions are never ingested (BILL-P1-003).
  - Sync/webhook upserts never write `metadata` beyond defaults.
- What is happening: The mirror is minimally sufficient for display but cannot answer "what interval is this billed on", "when does the trial end", or "is this invoice voided".
- Why it matters: Forecloses plan-aware UI and accurate reporting without live Stripe calls.
- User / business impact: Limited billing transparency; more Stripe dashboard dependency for operators.
- Security / privacy / reliability impact: Low; maintainability/reporting.
- Recommended fix: Add `interval`, `trial_start`, `trial_end`, `cancel_at_period_end` to `subscriptions`; populate from webhook/sync; add a `plans` reference table if tiers are fixed.
- Suggested validation: Migration test; upsert test asserting fields persist.
- Owner suggestion: Data/platform owner
- Effort estimate: M
- Dependencies: Migration sequencing (cross-ref 07/DATA-*).
- Status: still-open
- Endpoint / data path: Stripe → upsert → `subscriptions` (fields absent).
- Attack path: none identified

### Finding ID: BILL-P3-001 - Webhook raw body typed as `string` but consumed as `Buffer`

- Severity: P3
- Confidence: High
- Area: Webhooks
- Evidence:
  - `apps/api/src/app.ts:116-117` — `verify: (req: express.Request & { rawBody?: string }, _res, buf) => { req.rawBody = buf.toString(); }`.
  - `apps/api/src/routes/webhooks.ts:90-94` — `stripe.webhooks.constructEvent((req as { rawBody?: Buffer }).rawBody as Buffer, signature, stripeSecret)`.
  - `apps/api/src/routes/webhooks.ts:248,343` — `Buffer.from((req as { rawBody?: Buffer }).rawBody || JSON.stringify(req.body))` for Jira/JSM.
- What is happening: The captured value is a UTF-8 string, but the Stripe call and the Jira/JSM call treat it as a `Buffer`. It works because both the Stripe SDK and `Buffer.from(string)` accept strings, but the declared types contradict each other and the cast hides it.
- Why it matters: A future refactor (e.g. switching to `express.raw`) could break signature verification silently; the type system currently cannot catch it.
- User / business impact: None today; latent maintainability/regression risk.
- Security / privacy / reliability impact: Low — verification currently works over the correct bytes because the string is a faithful UTF-8 decode of the body; a binary-incompatible refactor could weaken it.
- Recommended fix: Capture `rawBody` as a `Buffer` (`req.rawBody = buf`), type it consistently (`rawBody?: Buffer`), and update the Jira/JSM callers to use it directly without re-encoding.
- Suggested validation: A test that mutates a byte in the body and asserts signature failure; a type-check that the Jira/JSM path compiles against `Buffer`.
- Owner suggestion: API platform owner
- Effort estimate: S
- Dependencies: Cross-ref 27/WH-*.
- Status: still-open
- Endpoint / data path: `POST /webhooks/{stripe,jira,jsm}` → raw body capture → signature verification.
- Attack path: none identified

### Finding ID: BILL-P3-002 - Billing email stored in plaintext and raw Stripe payment-method id rendered to users

- Severity: P3
- Confidence: High
- Area: Sensitive data / Admin-customer UI
- Evidence:
  - `supabase/migrations/5302026_...sql:514` — `billing_email citext` (plaintext).
  - `apps/web/app/(portal)/portal/billing/BillingPageClient.tsx:169-173` and `apps/web/app/(admin)/admin/organizations/[orgId]/billing/AdminBillingClient.tsx:183-186` — render `customer.default_payment_method` verbatim.
  - `apps/api/src/config/env.ts:27` — `FIELD_ENCRYPTION_KEY` exists for profile PII but is not applied to billing.
- What is happening: The billing contact email is stored unencrypted; the Stripe payment-method id (an opaque `pm_...` token, not a PAN) is displayed in the UI.
- Why it matters: Minor PII exposure and unnecessary provider-token disclosure; no card data is at risk.
- User / business impact: Low; cosmetic/UX.
- Security / privacy / reliability impact: Low — the PM id is not a card number and cannot be used without the secret key, but it should not be shown to end users.
- Recommended fix: Mask the payment method in the UI (show "Saved card" or brand/last4 if fetched server-side); consider encrypting `billing_email` or treating Stripe as the source of truth for it.
- Suggested validation: Component test asserting the PM id is not present in rendered output.
- Owner suggestion: Web/portal owner
- Effort estimate: S
- Dependencies: None.
- Status: still-open
- Endpoint / data path: `GET /billing/billing-customer` → UI renders `default_payment_method`.
- Attack path: none identified

Also noted (no separate finding): the prior run's P0 **BILL-F001** ("worker queries nonexistent membership columns") is **verified-fixed** at this commit — `stripe-reconcile.ts:75-110` now queries `billing_customers` + `subscriptions`, and the prior BILL-P1-001 ("no self-serve billing UI") is **verified-fixed** via `create-portal-session` + "Manage Billing". The prior BILL-P1-002 ("no schedule confirmed") is **verified-fixed** by `schedule-config.ts:27-33`.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Non-paying orgs retain premium access | P1 | High | Revenue leakage; broken upgrade path | `client-portal.ts` derivation only; no enforcement middleware | BILL-P1-001 middleware |
| Payment history always empty | P1 | High (deterministic) | Operators/customers misled | `payments` never written | BILL-P1-002 |
| Refunds/voids not reflected | P1 | Medium | Incorrect revenue reporting; disputes | No refund/void webhook handling | BILL-P1-003 |
| Webhook loss corrupts mirror silently | P2 | Medium | Stale subscriptions/invoices | Suspend-only reconcile, no drift alert | BILL-P2-003 |
| Sync under-fetches large accounts | P2 | Medium | Incomplete history presented as complete | `limit=20/10`, no pagination | BILL-P2-002 |
| Failed payments invisible to customers | P2 | High | Churn; avoidable failures | No notification on `payment_failed` | BILL-P2-004 |
| Stripe API version drift | P2 | Low/Medium | Silent field-shape changes | `apiVersion ... as any` | BILL-P2-005 note; centralize client |
| PM id/email exposure | P3 | Low | Minor PII/token disclosure | UI + plaintext email | BILL-P3-002 |

## Recommendations

### Immediate / Release Blocking

- None. No P0 was identified at this commit. (Prior P0s are fixed — see note above.)

### This Week

- BILL-P1-001 — implement `requireEntitlement`/`requireActiveSubscription` server-side; apply to gated feature routers.
- BILL-P1-002 — populate the `payments` table from Stripe payment events.
- BILL-P1-003 — add refund/void/payment webhook events.

### This Month

- BILL-P2-002 — paginate `POST /billing/sync`.
- BILL-P2-003 — drift detection + alerting in `stripe-reconcile`.
- BILL-P2-004 — notify on `invoice.payment_failed`.
- BILL-P2-005 / BILL-P2-001 — add trial/interval/cancel fields + migrations.
- BILL-P3-001 / BILL-P3-002 — rawBody typing; mask PM id.

### Later / Platform Evolution

- Decide and document seat/usage billing posture (BILL-011/012 scorecard rows).
- Centralize the Stripe client with a deliberate, typed API version.
- Add a billing event timeline (payment failures, plan changes) drawn from audit logs / a `billing_events` table.
- Verify production secret injection for `STRIPE_SECRET_KEY` (cross-ref 12/38) — repo evidence is doc-only.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Paginate sync | Prevents silent under-sync | `apps/api/src/routes/billing.ts:224-233` | Mocked two-page test |
| Mask PM id in UI | Removes token disclosure | `BillingPageClient.tsx:169-173`, `AdminBillingClient.tsx:183-186` | Component test |
| Fix `rawBody` to Buffer | Removes type hazard | `apps/api/src/app.ts:116-117`, `webhooks.ts` | Byte-mutation signature test |
| Include `trialing` in "Active Plans" | Correct plan counts | `billing.ts:61-65` | Route test |
| Guard `paid_at` sync fallback | Avoids 1970 timestamps | `billing.ts:256-259` | Sync test |
| Notify on payment failure | Immediate customer value | `webhooks.ts:114-151` | Webhook test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| `requireEntitlement`/`requireActiveSubscription` middleware + route application | P1 | Billing/API | M | Grace-period policy |
| Populate `payments` from payment events | P1 | Billing/API | M | Webhook expansion |
| Refund/void/payment webhook events | P1 | Billing/API | M | None |
| Sync pagination | P2 | Billing/API | S | None |
| Reconciliation drift metrics + alerts | P2 | Worker/Platform | M | Metrics stack (14) |
| Failed-payment notification + past-due banner | P2 | Billing/Web | S | Notification service (30) |
| Trial/interval/cancel schema columns + population | P2 | Data/Platform | M | Migration (07) |
| rawBody Buffer normalization | P3 | API | S | None |
| PM masking + billing-email handling | P3 | Web/Portal | S | None |

## Suggested Tests

- Unit:
  - `requireEntitlement`/`requireActiveSubscription` for `active`, `trialing`, `past_due`, `canceled`, `unpaid` (BILL-P1-001).
  - `deriveEnabledModules` set equality between any future server guard and the client list.
  - Signature verification with a single mutated body byte (BILL-P3-001).
- Integration (Supertest, existing helpers):
  - `payment_intent.succeeded` webhook → `payments` upsert visible at `GET /billing/payments` (BILL-P1-002).
  - `charge.refunded` → linked invoice/payment status update (BILL-P1-003).
  - `invoice.voided` / `invoice.marked_uncollectible` → enum transition (BILL-P2-005).
  - Two-page Stripe sync → all rows ingested (BILL-P2-002).
  - Gated feature route returns 402/403 for an inactive org, 200 for active (BILL-P1-001).
- E2E:
  - Portal billing happy path: plan panel, invoice PDF link, "Manage Billing" redirect stub (deepen `e2e/portal/billing.spec.ts`).
  - Past-due banner appears after a `payment_failed` fixture (BILL-P2-004).
- CI:
  - Type-check must fail if `rawBody` is passed as `Buffer` while captured as `string` (BILL-P3-001).
  - Migration presence check that billing tables include the new trial/interval columns.
- Security:
  - Cross-org attempt on `GET /billing/invoices/:id` with a foreign `organization_id` returns 404 (already covered by `billing.test.ts:147-157`; keep as regression).
  - Webhook replay of the same `event.id` is deduped and mutates state once (idempotency regression).
- Manual validation:
  - Run `stripe-reconcile` in `dryRun` against a staging tenant and confirm no membership changes.
  - Confirm `POST /billing/sync` is a no-op safe when `STRIPE_SECRET_KEY` is unset (expect 500 CONFIG, already coded).

## Suggested Documentation Updates

- `docs/BILLING.md`: add the `create-portal-session` endpoint; list all billing migrations (incl. `5302414_client_portal_entitlements`, `5302051` version column, `5302056`/`5302057` indexes); add webhook event coverage (incl. gaps); document entitlement enforcement once added; state seat/usage billing posture; document the Stripe API version.
- `docs/modules/billing.md`: add an "Enforcement" section describing server-side entitlement behavior and grace period.
- New `docs/runbooks/billing-reconciliation.md`: how to interpret drift alerts, run `sync`, and use `dryRun` for the worker.
- `docs/BILLING.md` data-handling note: state that no PAN/CVC is stored, that `default_payment_method` is a Stripe token, and that `billing_email` is stored unencrypted.
- `docs/BILLING.md` "Permissions" section: note the documented rationale that `create-portal-session` is intentionally available to any org member (`billing.ts:306-310`).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is `past_due` meant to retain full access indefinitely, or is a grace period expected? | Determines `requireActiveSubscription` semantics | Product/ops decision; none in repo |
| Is seat/usage billing in the roadmap? | Decides whether BILL-011/012 are gaps or explicit non-goals | Product requirements doc |
| Which exact Stripe API version is intended? | The webhook pins `2025-03-31.basil` via an `as any` cast | Stripe account config / infra |
| Is `STRIPE_SECRET_KEY` actually injected in production ECS/SSM? | Doc asserts it; repo cannot confirm | Terraform/infra (cross-ref 12/38) |
| Should payment history be derived from invoices or from payment intents? | Drives BILL-P1-002 implementation | Billing/engineering decision |
| Is the Stripe webhook endpoint registered for refund/void events? | Missing events cannot be ingested even if handled in code | Stripe dashboard (external, `Unknown`) |

## Appendix

### A. Evidence commands recorded

- `git rev-parse HEAD` → `6286137017c4b7c77e83ee420ec11382d984f263`
- `git branch --show-current` → `develop`
- Grep `refund|charge.refunded|dunning|trial_end|trial_start|cancel_at_period_end` over `apps` → only `stripe-reconcile.ts:16,120`.
- Grep `from\("payments"\)|payments.*insert|stripe_payment_intent` over `apps/api/src` → only `billing.ts:166` (read).
- Grep `charge\.|payment_intent|invoice\.created|checkout\.session` over repo → only the events in `webhooks.ts:114,189` and tests.
- Grep `requireActiveSubscription|requireSubscription|subscriptionActive|subscription_status` over `apps` → none (only derivation + comment).

### B. Billing data-flow (as evidenced)

```mermaid
flowchart LR
  Stripe[Stripe API] -->|webhook invoice.paid / payment_failed / customer.subscription.* / checkout.session.completed| WH["POST /api/v1/webhooks/stripe<br/>constructEvent + idempotency claim"]
  WH --> INV[(invoices)]
  WH --> SUB[(subscriptions)]
  WH --> BC[(billing_customers)]
  Stripe -.->|never| PAY[(payments - never written)]
  API["POST /billing/sync<br/>(limit 20 invoices / 10 subs)"] --> INV
  API --> SUB
  Stripe -->|billing_portal/sessions| PS[create-portal-session]
  Worker["stripe-reconcile (daily)"] -->|fetch subscription status| Stripe
  Worker -->|terminal only| MEM[(memberships: suspended)]
  CP["client-portal/bootstrap"] -->|enabledModules (advisory)| UI[Portal UI]
  INV --> ROUTES["/billing/invoices|/payments|/subscriptions|/summary"]
  SUB --> ROUTES
  PAY --> ROUTES
  BC --> ROUTES
```

### C. Webhook event coverage matrix

| Stripe event | Handled? | Evidence |
|---|---|---|
| `invoice.paid` | Yes | `webhooks.ts:114` |
| `invoice.payment_failed` | Yes | `webhooks.ts:114` |
| `customer.subscription.created/updated/deleted` | Yes | `webhooks.ts:153-156` |
| `checkout.session.completed` | Yes | `webhooks.ts:189` |
| `charge.refunded` / `charge.refund.updated` | No | Grep empty |
| `invoice.created` / `invoice.voided` / `invoice.marked_uncollectible` | No | Grep empty |
| `payment_intent.succeeded` / `.failed` | No | Grep empty |

### D. Prior-run continuity summary

| Prior finding (20260728 / 20260730) | Status at 6286137 | Evidence |
|---|---|---|
| BILL-F001 worker queries nonexistent membership columns | verified-fixed | `stripe-reconcile.ts:75-110` queries `billing_customers`+`subscriptions` |
| BILL-P1-001 (20260730) no entitlement gating | still-open (partially-fixed) | `client-portal.ts` derives only; no enforcement → BILL-P1-001 |
| BILL-P1-001 (20260728) no self-serve billing UI | verified-fixed | `billing.ts:311-375`, `BillingPageClient.tsx:95-104` |
| BILL-P1-002 (20260730) no reconciliation schedule confirmed | verified-fixed | `schedule-config.ts:27-33` daily schedule |
| BILL-P2-002 (20260730) no failed-payment notification | still-open | → BILL-P2-004 |
| BILL-P2-001 (20260730) no trial/plan columns | still-open | → BILL-P2-005 / BILL-P2-001 |
