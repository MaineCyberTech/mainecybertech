# API Contracts, Realtime, and Integrations Audit — MCT Portal

## Audit Metadata

- Audit: `repo-deep-dive`
- Run: `20260801-0233-develop-a585f1d`
- Branch / SHA: `develop` / `a585f1d` (git)
- Target: `C:\temp\mainecybertech-portal`
- Date: 2026-08-01
- Scope prompts: `08_api_contracts_realtime_integrations.md`, `29_billing_payments_reconciliation_audit.md`, `31_search_indexing_privacy_audit.md`
- Auditor: principal-level repository audit (evidence-based, no source modifications)

## Scope

- Response envelope consistency (`ApiResponse<T>`, `success()`/`failure()`, `AppError`, `PaginatedResult<T>`)
- Route-level Zod validation coverage and error contract
- Pagination contract (`items/total/page/limit`) vs actual list responses
- SDK ↔ route ↔ OpenAPI spec drift (54 route files vs 51 SDK modules vs `openapi/spec.ts`)
- Webhook security, signature verification, idempotency (Stripe, Jira, JSM, M365)
- Stripe billing sync / reconciliation correctness
- Search org scoping and indexing/privacy behavior
- Realtime (SSE `/notifications/stream`) existence and consumption
- Outbound HTTP retries/timeouts/circuit breakers
- API versioning strategy

## Evidence Reviewed

- `apps/api/src/app.ts` (global middleware + full router mount list lines 140–191)
- `apps/api/src/types/index.ts` (envelope, success/failure, AppError, PaginatedResult)
- `apps/api/src/middleware/auth.ts`, `org-access.ts`, `require-active-subscription.ts`, `csrf.ts`, `idempotency.ts`, `cache.ts`, `webhook-signature.ts` (full reads)
- `apps/api/src/lib/idempotency.ts`, `apps/api/src/error.ts`
- Routes: `auth.ts`, `billing.ts`, `webhooks.ts`, `search.ts`, `search-portal.ts`, `notifications.ts`, `dashboard.ts`, `organizations.ts`, `business-os.ts`, `documents.ts`, `tickets.ts`, `projects.ts`, `profiles.ts`, `store.ts`, `roles.ts`, `admin.ts`, `sla.ts`, `api-keys.ts`, `ai.ts`, `final.ts`, `dmarc-coach.ts`, `file-requests.ts`, `memberships.ts` (full or key-segment reads)
- `openapi/builder.ts`, `openapi/spec.ts` (lines 1–175)
- SDK: `packages/sdk/src/client.ts`, `auth.ts`, `search.ts`, `index.ts`; web wrappers `apps/web/lib/client-api.ts`, `apps/web/lib/api.ts`, `apps/web/lib/auth/auth-actions.ts`, `apps/web/lib/cookie-domain.ts`
- Web consumers: `NotificationBell.tsx`, `NotificationsPageClient.tsx`, `RolePermissionsEditor.tsx`, `OrgBrandingForm.tsx`, `NewWebhookForm.tsx`, `BulkInviteForm.tsx`, `BillingPageClient.tsx`, `NotificationPreferencesClient.tsx`, `WebhookDetailClient.tsx`, `ProfileClient.tsx`, `AdminBillingClient.tsx`, `PortalGlobalSearch.tsx`, `forgot-password/page.tsx`, `password-reset/page.tsx`
- Greps: `getClientApi()...` mutation calls (22 sites), `.eq("id", req.params.id)` (100+ matches), `responseCache*` (21 sites), `requireActiveSubscription` (13 matches), `EventSource|notifications/stream|text/event-stream` (0 in apps/web), `router.<verb>` in auth.ts

## Executive Summary

The API is a large (51 mounted routers) but consistent surface: nearly every handler returns the `ApiResponse` envelope via `success()`/`failure()`, mutation routes are Zod-validated, and webhook signature verification (HMAC-SHA256 + `timingSafeEqual`) and Redis-backed idempotency exist. However, the audit found **1 P0, 4 P1, 10 P2, and 4 P3 findings**. The P0 is a tokenless password-reset endpoint (`POST /api/v1/auth/reset-password` accepts `email` + `password` with no verification step) that is wired end-to-end in the SDK and web UI — a direct account-takeover vector. High-priority correctness gaps: incomplete tenant scoping on several by-ID sub-resources, a cross-origin CSRF design that blocks ~22 client-side mutation call sites in production, and a Stripe amount unit bug that stores invoice amounts 100× too large.

Domain scores (0–5, see Scoring rules):

| Domain | Score | Evidence |
| --- | --- | --- |
| Response envelope consistency | 3 | Consistent `success()/failure()` everywhere except idempotency middleware (raw `{error}`) and SSE stream (non-envelope). |
| Zod validation coverage | 3 | All mutation endpoints validated per route scan; `store.ts` catches `ZodError` locally (3 sites) duplicating the global handler; a few handlers use manual checks. |
| Pagination contract | 2 | `PaginatedResult<T>` type exists; most list endpoints return raw arrays; only a subset paginate (`items/total/page/limit`). |
| OpenAPI / versioning | 2 | Spec covers a small subset of 51 routers; 5+ documented routes don't match implementation (reset-password, business-os method, dashboard/activity-feed, store quotes `{id}`, sop-library mount). |
| Realtime / SSE | 1 | `/notifications/stream` exists but is cookie-auth-incompatible and has zero web consumers (30s polling remains). |
| Webhooks / Stripe | 3 | Signature verify + idempotency present; non-atomic dedup; Stripe amount unit bug (BILL-P1-001); deterministic dedup keys drop legitimate repeated Jira/JSM/M365 events. |
| SDK coverage / drift | 2 | 18 endpoints unwrapped (store/analytics/admin), ~29 methods unused in web, `PortalSearchResult.documents` mismatch. |
| Retries / timeouts / circuit breakers | 3 | `HttpClient` with retry+timeout+circuit breaker applied to Stripe/JSM/Teams; Supabase client wrapped with circuit breaker (per AGENTS). |
| Search scoping / privacy | 2 | Portal search scoped by approved memberships; admin organizations + user-fallback searches are unscoped; every global search writes an audit row. |

## Inventory

### Routers mounted (`apps/api/src/app.ts:140-191`) — 51 total

`docs`, `auth`, `organizations`, `memberships`, `users`, `profiles`, `tickets`, `projects`, `documents`, `dashboard`, `audit`, `webhooks`, `roles`, `search`, `search/portal`, `public`, `notifications`, `notification-preferences`, `billing`, `webhook-endpoints`, `sla`, `api-keys`, `admin`, `bulk`, `approvals`, `business-os`, `proposals`, `findings`, `assets`, `domain-monitors`, `qbr`, `file-requests`, `ai`, `vendors`, `service-catalog`, `batch`, `security-ops`, `security-suite`, `governance`, `field-services`, `edu-automation`, `final`, `client-onboarding`, `satisfaction-pulse`, `dynamic-forms`, `license-optimizer`, `dmarc-coach`, `training-hub`, `insurance-binder`, `status-page`, `uptime-monitor`, `store`, `analytics`.

Note: no `sop-library` router is mounted despite being documented in `openapi/spec.ts`.

### SDK modules (`packages/sdk/src`) — 51 source files

Full CRUD surface for the modules above plus `business-os`, `webhooks` (management + test), `notifications`, `notification-preferences`, `bulk`, `search`, `sla`, `api-keys`. **No SDK module for** `store.ts` (promotions/quotes/products/categories), `analytics.ts`, or `admin.ts` (dashboard/health/test-email).

## Findings

### Finding ID: API-P0-001 - Tokenless password reset (account takeover)

- Severity: P0
- Confidence: High
- Area: Auth / API contract
- Evidence:
  - `apps/api/src/routes/auth.ts`
  - Route / endpoint: `POST /api/v1/auth/reset-password` (line 294)
  - SDK: `packages/sdk/src/auth.ts` (resetPassword sends `{ email, password }`)
  - Web: `apps/web/app/(public)/password-reset/page.tsx` (line 29), `apps/web/app/(portal)/portal/profile/ProfileClient.tsx` (line 88)
  - OpenAPI: `openapi/spec.ts` (line 10, documents `{ token, password }`)
- What is happening: The reset-password handler reads `email` + `password` from the body, performs no token/code verification, and directly calls `supabaseAdmin.auth.admin.updateUserById(...)`. The SDK and both web UIs call this exact shape. `forgot-password` only emails a link; the reset page then posts `email` + `password` with no code.
- Why it matters: This is not a password-reset flow — it is an unauthenticated admin force-reset. The OpenAPI spec documents a token-based contract that does not match the implementation.
- User / business impact: Any attacker who knows (or can guess) a user's email can silently reset that account's password and log in. No ownership proof is required. `rateLimitAuth` + `rateLimitEmail` (lines 294, 269) only slow the attack.
- Security / privacy / reliability impact: Complete account takeover of any account (including admins) for any email known to the attacker.
- Recommended fix: Require a one-time reset token (issued in `forgot-password`, stored with expiry) and verify it before updating the password; align SDK + both web pages + OpenAPI spec to the token contract. Never allow an unauthenticated direct email+password update.
- Suggested validation: Integration test asserting `POST /auth/reset-password` without a valid token returns 400/401; E2E full forgot→reset flow; confirm spec matches implementation.
- Owner suggestion: Auth/backend + product (define token email UX).
- Effort estimate: Medium (auth flow + 3 files + spec).
- Dependencies: None.
- Status: Open

### Finding ID: API-P1-002 - Incomplete tenant isolation on by-ID entity sub-resources

- Severity: P1
- Confidence: High
- Area: Authorization / tenant isolation
- Evidence:
  - `apps/api/src/routes/billing.ts` (GET `/api/v1/billing/invoices/:id`, lines 95-108 — no `organization_id` filter, admin client)
  - `apps/api/src/routes/tickets.ts` (GET `/api/v1/tickets/:id/comments`, lines 274-288; PATCH `/api/v1/tickets/:id`, lines 228-234 — update has no org filter)
  - `apps/api/src/routes/documents.ts` (PATCH `/api/v1/documents/:id`, lines 381-387 — update has no org filter)
  - `apps/api/src/middleware/org-access.ts` (`extractOrgId` reads `organization_id` from query/body only)
  - Grep: 100+ `.eq("id", req.params.id)` patterns across `api-keys.ts`, `ai.ts`, `documents.ts`, `final.ts`, `billing.ts`, `file-requests.ts`, `dmarc-coach.ts` and others
- What is happening: `requireOrgAccess` validates membership of the org supplied in the request, but several handlers read entities by `id` without filtering by that org. If a client omits `organization_id`, the org check is effectively skipped and the entity is fetched directly.
- Why it matters: The tenancy model relies on every handler applying the org filter; the pattern is applied inconsistently, so cross-tenant read/write is possible on the listed endpoints.
- User / business impact: A user in org A could read another org's invoice, comments, or mutate another org's ticket/document where the id is known or enumerable.
- Security / privacy / reliability impact: Cross-tenant data exposure and mutation; the primary isolation boundary is incomplete.
- Recommended fix: Apply org filtering in every by-ID handler (add `.eq("organization_id", orgId)`), or add a shared resolver that injects the required filter; enforce that `organization_id` is required (not optional) on org-scoped routes.
- Suggested validation: Integration tests attempting cross-org read/write with and without `organization_id`; expect 403/404.
- Owner suggestion: API backend + security.
- Effort estimate: Medium (additive filters across ~15-20 handlers).
- Dependencies: `org-access.ts` semantics.
- Status: Open

### Finding ID: API-P1-003 - Cross-origin client-side mutations blocked by CSRF design

- Severity: P1
- Confidence: High
- Area: Security / integration
- Evidence:
  - `apps/api/src/middleware/csrf.ts` (host-only `csrf_token` cookie, no `Domain`, `sameSite: strict`, requires `X-CSRF-Token` header on unsafe methods)
  - `packages/sdk/src/client.ts` (lines 141-142: CSRF header set only if `getCsrfToken()` returns a token; default undefined)
  - `apps/web/lib/client-api.ts` (`getCsrfToken` reads `document.cookie` on the app origin)
  - 22 confirmed unsafe call sites via `getClientApi()`: `NotificationBell.tsx:144,154,165`; `RolePermissionsEditor.tsx:108`; `OrgBrandingForm.tsx:35,53`; `NewWebhookForm.tsx:35`; `BulkInviteForm.tsx:39`; `NotificationsPageClient.tsx:79,86`; `BillingPageClient.tsx:93,104`; `NotificationPreferencesClient.tsx:90`; `WebhookDetailClient.tsx:47,64,77`; `ProfileClient.tsx:61,88,107`; `AdminBillingClient.tsx:113`; `password-reset/page.tsx:29`; `forgot-password/page.tsx:20`
- What is happening: The CSRF cookie is host-only on the API origin (`api.*`) and therefore invisible to `document.cookie` on the app origin (`app.*`). The SDK only sends the `X-CSRF-Token` header when it can read that cookie, so cross-origin POST/PUT/PATCH/DELETE calls from the app send no header and are rejected by the API's CSRF middleware.
- Why it matters: The deployment is intentionally cross-origin (`app.*` frontend → `api.*` backend, AGENTS `NEXT_PUBLIC_API_URL`). The CSRF design assumes a single origin, so these client-side features fail in production (they work on localhost where cookies are shared).
- User / business impact: Notification read/mark-all, preferences toggles, role permission edits, org branding, webhook CRUD/test, bulk invite, billing sync/portal-session, profile update, avatar upload, and in-profile password change all 403 in production.
- Security / privacy / reliability impact: Availability loss of core client-side features; also masks the CSRF protections themselves.
- Recommended fix: Either set the `csrf_token` cookie with the shared parent domain (`Domain=.mainecybertech.us`, read `document.cookie` cross-subdomain), or serve the API and app on the same origin behind Caddy, or use a cookie-independent CSRF token fetch. Re-verify cookie flags after the change.
- Suggested validation: E2E cross-origin test performing a client-side mutation; assert 200 not 403.
- Owner suggestion: API backend + DevOps (Caddy/origin topology).
- Effort estimate: Small-Medium.
- Dependencies: Deployment topology decision.
- Status: Open

### Finding ID: BILL-P1-001 - Stripe invoice amounts stored 100x too large (unit bug)

- Severity: P1
- Confidence: High
- Area: Billing / data integrity
- Evidence:
  - `apps/api/src/routes/billing.ts` (POST `/api/v1/billing/sync`, lines 219-221: `subtotal_cents: Math.round(inv.subtotal * (inv.currency === "usd" ? 100 : 100))`, `tax_cents: Math.round((inv.tax ?? 0) * 100)`, `total_cents: Math.round(inv.total * 100)`)
  - `apps/api/src/routes/webhooks.ts` (POST `/api/v1/webhooks/stripe`, lines 121-123: same `* 100` on `subtotal`/`tax`/`total`)
  - Contrast: same files store `amount_cents: price?.unit_amount` for subscriptions with no multiplier (billing.ts:252, webhooks.ts:166)
- What is happening: Stripe already returns invoice `subtotal`/`tax`/`total` in the smallest currency unit (cents). Multiplying by 100 stores amounts 100× too large in `invoices.subtotal_cents`/`tax_cents`/`total_cents`. Subscriptions use the raw `unit_amount` (correct), confirming the invoice multiplication is unintended.
- Why it matters: Billing/invoice data is silently corrupted on every sync and every Stripe webhook, polluting the reconciliation feed and any downstream invoicing UI.
- User / business impact: Clients and internal staff see invoice totals 100× inflated; reconciliation against Stripe fails.
- Security / privacy / reliability impact: Financial data integrity breach (not financial loss to MCT, but incorrect client-facing billing records).
- Recommended fix: Store `inv.subtotal`, `inv.tax`, `inv.total` directly (they are already in minor units); drop the `* 100`. Also simplify the `usd ? 100 : 100` no-op ternary.
- Suggested validation: Unit test with a fixture invoice (e.g., `total: 5000` → expect `total_cents: 5000`); integration test on `/sync` and `/webhooks/stripe`.
- Owner suggestion: Billing backend.
- Effort estimate: Small (2 files).
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-004 - Webhook idempotency is check-then-set and dedup keys drop legitimate events

- Severity: P2
- Confidence: Medium
- Area: Resilience / webhooks
- Evidence:
  - `apps/api/src/lib/idempotency.ts` (read-then-write; TTL 24h; 10k in-memory cap)
  - `apps/api/src/routes/webhooks.ts` (`dedupWebhook`, `storeIdempotencyKey` written via `logWebhookDelivery` only at completion; Jira key `jira-${event}-${issueKey}`, JSM `jsm-${event}-${issueKey}`, M365 `m365-${resource}-${changeType}`; Stripe uses `evt.id`)
- What is happening: The dedup check and the write are not atomic. Concurrent duplicate deliveries (Stripe retries can overlap) can both pass the check and both process. Separately, Jira/JSM/M365 keys are deterministic per event, so any legitimate repeat of the same event within 24h is dropped even when the webhook payload is genuinely different (e.g., Jira re-sends on state churn).
- Why it matters: Idempotency was a stated 2026-06-26 hardening goal; the implementation is only partially effective and can also cause silent data loss.
- User / business impact: Duplicate Jira/JSM/M365 syncs, or missed syncs for legitimate repeat events.
- Security / privacy / reliability impact: Reliability and data-consistency gaps in the sync pipeline.
- Recommended fix: Make dedup atomic (SET NX on the Redis key at check time); use event-level unique keys for Jira/JSM/M365 (e.g., include webhook delivery id or timestamp) while keeping idempotency for true retries.
- Suggested validation: Concurrency test issuing two identical webhook deliveries; assert single processing; test repeat events with different payloads are not dropped.
- Owner suggestion: Worker/API backend.
- Effort estimate: Small-Medium.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-005 - Invalid HTTP status code 40101 on expired JWT

- Severity: P2
- Confidence: High
- Area: API contract / errors
- Evidence:
  - `apps/api/src/middleware/auth.ts` (line 57: `AppError("UNAUTHORIZED", "Token expired", 40101)`)
  - Grep for 5-digit statuses: only this site
- What is happening: 40101 is not a valid HTTP status code. `res.status(40101)` in the error handler throws `RangeError`, converting a clean 401 into a 500.
- Why it matters: Expired-token clients get a 500 and a stack trace instead of a 401; breaks any client that relies on the 401 path.
- User / business impact: Intermittent opaque failures for stale sessions.
- Security / privacy / reliability impact: Error-handling correctness; masks auth failures.
- Recommended fix: Use 401.
- Suggested validation: Unit test expired-token request asserts HTTP 401 + envelope.
- Owner suggestion: API backend.
- Effort estimate: Trivial.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-006 - SSE /notifications/stream unusable with cookie auth and has no consumers

- Severity: P2
- Confidence: High
- Area: Realtime / integrations
- Evidence:
  - `apps/api/src/routes/notifications.ts` (GET `/api/v1/notifications/stream`, lines 28+; auth revalidation at lines 50-58 reads `req.headers.authorization` only)
  - Grep `EventSource|notifications/stream|text/event-stream` in `apps/web`: 0 matches
  - `apps/web/components/NotificationBell.tsx` (30s polling)
- What is happening: The SSE endpoint revalidates the user by reading only the `Authorization` header. Browser clients authenticate via the `mct_session` cookie (no header), so `getUser("")` fails and the stream terminates with an auth error every 5 minutes. No web component consumes the stream at all.
- Why it matters: The realtime path is dead code; the product still polls on a 30s interval (an acknowledged limitation).
- User / business impact: No realtime notification delivery; no benefit from the SSE surface.
- Security / privacy / reliability impact: Stale/summary; no current risk beyond unused code.
- Recommended fix: Support cookie auth in the SSE revalidation (resolve the cookie session), and either wire a web consumer (EventSource client) or remove the endpoint and document polling as the contract.
- Suggested validation: E2E opening the stream with cookie auth; assert keepalive beyond 5 minutes.
- Owner suggestion: API backend + web frontend.
- Effort estimate: Small-Medium.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-007 - OpenAPI spec drift (documented-but-missing routes + undocumented surface)

- Severity: P2
- Confidence: Medium
- Area: API documentation / contracts
- Evidence:
  - `openapi/spec.ts` (line 10 reset-password `{token, password}` vs impl `{email, password}`; `POST /api/v1/business-os` documented but impl is `GET /summary`; `/api/v1/dashboard/activity-feed` documented but `dashboard.ts` only has `/summary`; `/api/v1/store/quotes/{id}` documented but `store.ts` has no such route; `/api/v1/sop-library` documented but not mounted in `app.ts:140-191`)
  - `apps/api/src/app.ts:140-191` (51 mounted routers)
- What is happening: The spec (≈290 lines) documents a subset of the 51 mounted routers and 5+ entries do not match the implementation. Roughly 25 mounted routers have no spec entries (final, batch, ai, governance, security-suite, security-ops, field-services, edu-automation, client-onboarding, satisfaction-pulse, dynamic-forms, license-optimizer, dmarc-coach, training-hub, insurance-binder, status-page, uptime-monitor, file-requests, vendors, proposals, findings, assets, domain-monitors, qbr, service-catalog, approvals, store, analytics).
- Why it matters: The spec cannot be used to generate clients, tests, or external integrations reliably; it actively misleads on the password-reset contract (P0).
- User / business impact: Misleading API documentation for any external or internal consumer.
- Security / privacy / reliability impact: Contract drift hides the reset-password flaw and undocumented endpoints from review.
- Recommended fix: Generate the spec from route metadata (single source of truth) or audit `spec.ts` against all 51 routers; fix reset-password, business-os, dashboard, store, sop-library entries.
- Suggested validation: Script comparing spec paths vs extracted `router.<verb>` paths across all route files.
- Owner suggestion: API backend.
- Effort estimate: Medium.
- Dependencies: P0 reset-password fix.
- Status: Open

### Finding ID: API-P2-008 - SDK coverage gaps and ~29 unused SDK wrappers

- Severity: P2
- Confidence: High
- Area: SDK / integration
- Evidence:
  - `packages/sdk/src/index.ts` (module exports) vs `apps/api/src/app.ts:140-191` (mounts)
  - `apps/web` full scan of module-qualified SDK usages
- What is happening: No SDK module exists for `/api/v1/store/*` (promotions CRUD, quotes list/create, products, categories), `/api/v1/analytics/*`, or `/api/v1/admin/*` (dashboard, health, test-email). Conversely, ~29 SDK methods are never called anywhere in `apps/web` (e.g., `billing.*`, `organizations.addDomain`, `projects.getDetail`, `memberships.mine`, `auth.exchangeCode`, `tickets.listComments`, `documents.listShares`, `ai.copilotReplyDraft`, `ai.copilotSummarize`, `notifications.remove`, `webhooks.listDeliveries`, `webhooks.test`, `projects.reorderTasks`, `documents.bulkFolder`, `proposals.publish`, `sla.get`, `sla.overview`, `qbr.get`, `fileRequests.getPublic`, `dmarcCoach.analyze`, `assets.stats`, `approvals.stats`, `domainMonitors.exportData`, `insuranceBinder.coverageReport`, `uptimeMonitor.getUptime`).
- Why it matters: The SDK is meant to be the sole typed client; server-only routes and dead wrappers fragment the client surface and hide untested paths.
- User / business impact: New features must use raw fetch for store/analytics/admin; unused wrappers invite drift.
- Security / privacy / reliability impact: Undocumented/unwrapped endpoints are harder to audit.
- Recommended fix: Add SDK modules for store/analytics/admin or document them as server-only; prune or exercise the unused wrappers.
- Suggested validation: SDK coverage test asserting every mounted router has a wrapper.
- Owner suggestion: SDK package owner.
- Effort estimate: Small-Medium.
- Dependencies: None.
- Status: Open

### Finding ID: SEARCH-P2-001 - Global search scoping gaps and audit-log bloat

- Severity: P2
- Confidence: Medium
- Area: Search / privacy
- Evidence:
  - `apps/api/src/routes/search.ts` (organizations search lines 91-95 has no org scoping despite comment; user fallback line 50 returns all profiles when admin has orgs but no matching members; every query logged to `audit_logs` lines 107-112)
  - `apps/api/src/routes/search-portal.ts` (scoped by approved memberships — correct)
- What is happening: Portal search is correctly scoped to the user's approved memberships, but the admin global search queries `organizations` without filtering to the admin's orgs and falls back to listing all profiles when no member users match. Every global search writes an audit row, inflating `audit_logs`.
- Why it matters: Admin search is an admin-only surface (mitigating factor), but the org scoping comment promises a filter that is absent, and unbounded audit writes grow a table that also powers compliance feeds.
- User / business impact: Admins may see organizations outside their scoped set; audit table growth over time.
- Security / privacy / reliability impact: Privacy exposure boundary and observability overhead.
- Recommended fix: Add the org filter to the organizations query; scope the user fallback to member users; debounce or drop audit logging for read-only search (or rate-limit it).
- Suggested validation: Unit test admin-with-orgs search returns only scoped organizations.
- Owner suggestion: API backend + security.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-009 - SDK/route contract mismatch in portal search

- Severity: P2
- Confidence: High
- Area: SDK / API contract
- Evidence:
  - `packages/sdk/src/search.ts` (lines 11-15: `PortalSearchResult` declares `documents`)
  - `apps/api/src/routes/search-portal.ts` (lines 56-59: returns only `{ tickets, projects }`)
  - `apps/web/components/portal/PortalGlobalSearch.tsx` (line 44: `search.portal(query, "")` — empty `organization_id` string)
- What is happening: The SDK type advertises a `documents` array that the route never returns, and the route ignores the `organization_id` parameter (it scopes by memberships) even though the caller sends an empty string.
- Why it matters: Type promises outrun runtime behavior; consumers could dereference `result.documents` and crash.
- User / business impact: Latent runtime break for any future portal-search consumer.
- Security / privacy / reliability impact: Minor; contract hygiene.
- Recommended fix: Align `PortalSearchResult` to `{ tickets, projects }` (or return documents), and drop the unused `organization_id` param or scope by it.
- Suggested validation: SDK unit test asserting the response shape matches the type.
- Owner suggestion: SDK package owner + API backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-010 - requireActiveSubscription imported but never applied

- Severity: P2
- Confidence: High
- Area: Billing entitlement / authorization
- Evidence:
  - `apps/api/src/middleware/require-active-subscription.ts` (definition)
  - `apps/api/src/routes/documents.ts:9`, `projects.ts:7`, `tickets.ts:7` (imports only)
  - Grep for `requireActiveSubscription(`: only the import lines + `__tests__/middleware-subscription.test.ts`
- What is happening: The middleware is imported in tickets/documents/projects routers but never attached to any route. Paid-feature gating is not enforced anywhere in the running app.
- Why it matters: Either entitlement enforcement is a planned-but-missing control or a regression from the refactor.
- User / business impact: Non-paying orgs are not blocked from tickets/documents/projects features.
- Security / privacy / reliability impact: Revenue/business-rule gap, not security.
- Recommended fix: Attach `requireActiveSubscription` to the intended routes (with admin/test bypasses as designed), or remove the dead imports and document the decision.
- Suggested validation: Integration test asserting an org with an inactive subscription receives 402/403 on protected routes.
- Owner suggestion: Billing backend + product.
- Effort estimate: Small.
- Dependencies: Billing product decision.
- Status: Open

### Finding ID: API-P2-011 - Self-renewing cache TTLs on admin endpoints

- Severity: P2
- Confidence: Medium
- Area: Performance / correctness
- Evidence:
  - `apps/api/src/middleware/cache.ts` (lines 150-174 `responseCache` renews TTL on every hit; lines 176-204 `responseCacheNoRenew` writes only on first miss; key = user/path/query, lines 138-148)
  - `apps/api/src/routes/dashboard.ts:13` and `business-os.ts:13,90,110,130` use `responseCache` (renew)
  - `apps/api/src/routes/organizations.ts:27` uses `responseCacheNoRenew(60)` (correct pattern)
- What is happening: Admin dashboard/summary and business-os endpoints use the self-renewing cache: under constant traffic the entries never expire, so admin metrics can go stale indefinitely. `requireAuth` never sets `authUser.orgId` (per `middleware/auth.ts`), so keys are `user={id}` — no cross-user leak, but admin-global data is cached once per user.
- Why it matters: The hardening session (2026-06-26) explicitly removed self-renewing caches; the pattern persists on 5 admin endpoints.
- User / business impact: Stale admin/executive dashboards under sustained load.
- Security / privacy / reliability impact: Data-freshness issue only (per-user keys are safe).
- Recommended fix: Switch these to `responseCacheNoRenew`.
- Suggested validation: Cache test asserting TTL does not renew on hits.
- Owner suggestion: API backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P2-012 - Idempotency middleware response breaks envelope contract

- Severity: P2
- Confidence: Medium
- Area: API contract / errors
- Evidence:
  - `apps/api/src/middleware/idempotency.ts` (replay returns raw `{ error: ... }` with HTTP 409; non-envelope shape)
  - Contrast: `apps/api/src/types/index.ts` envelope everywhere else
- What is happening: Replayed idempotent requests receive a 409 with a body that does not match `ApiResponse<T>`, so typed clients can't parse it.
- Why it matters: Inconsistent error contract; clients must special-case this one path.
- User / business impact: SDK consumers cannot surface replay errors gracefully.
- Security / privacy / reliability impact: Minor contract hygiene.
- Recommended fix: Return `failure()`-shaped responses from the middleware, or return the original stored response body on replay.
- Suggested validation: Unit test asserting replay body matches the envelope schema.
- Owner suggestion: API backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P3-013 - store.ts duplicates and local ZodError handling

- Severity: P3
- Confidence: Medium
- Area: Cleanup / consistency
- Evidence:
  - `apps/api/src/routes/store.ts` (duplicate `/promotions` and `/promotions/active` handlers, lines 41-73; three handlers catch `ZodError` locally, lines 123-126, 161-164, 221-224)
- What is happening: `/promotions` and `/promotions/active` are functionally identical; three handlers re-implement the global error mapping for `ZodError` that `apps/api/src/error.ts` already handles.
- Why it matters: Redundant code increases drift and review burden.
- User / business impact: None direct.
- Security / privacy / reliability impact: None.
- Recommended fix: Remove the duplicate route or give it distinct semantics; drop local ZodError catches.
- Suggested validation: Route tests still pass.
- Owner suggestion: API backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P3-014 - Webhook timestamp validation unit ambiguity and M365 no-op

- Severity: P3
- Confidence: Medium
- Area: Webhooks / resilience
- Evidence:
  - `apps/api/src/lib/webhook-signature.ts` (`validateWebhookTimestamp` compares numeric timestamp to `Date.now()` ms; returns true when no timestamp present)
- What is happening: Numeric timestamps are compared to millisecond `Date.now()` without a documented unit; Jira/JSM payloads include ms timestamps (correct today). M365 payloads carry no top-level timestamp, so the check silently no-ops for that source.
- Why it matters: A unit drift (provider switching to seconds) would reject all webhooks; a silent skip is the opposite risk.
- User / business impact: Possible wholesale webhook rejection or no replay protection for M365.
- Security / privacy / reliability impact: Replay-protection coverage gap.
- Recommended fix: Normalize timestamps to ms explicitly (detect seconds vs ms), and require or derive a timestamp for M365 (e.g., use payload metadata).
- Suggested validation: Unit tests for seconds/ms/missing-timestamp cases.
- Owner suggestion: API backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: BILL-P2-002 - billing_customer lookups use .single() without uniqueness guarantee

- Severity: P3
- Confidence: Medium
- Area: Billing / robustness
- Evidence:
  - `apps/api/src/routes/billing.ts` (lines 286-290)
  - `apps/api/src/routes/webhooks.ts` (lines 104-108, 146-150)
- What is happening: Lookups by `stripe_customer_id` use `.single()`; if duplicate rows ever exist for a customer/org, the query errors instead of resolving deterministically.
- Why it matters: Low-probability robustness gap in the reconciliation path.
- User / business impact: Sync/webhook failures if data is duplicated.
- Security / privacy / reliability impact: Minor.
- Recommended fix: Use `.maybeSingle()` with an explicit duplicate-handling path or a unique constraint.
- Suggested validation: Test with a duplicated billing_customer row.
- Owner suggestion: Billing backend.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open

### Finding ID: API-P3-015 - mct_session cookie shared across all subdomains

- Severity: P3
- Confidence: High
- Area: Security hardening
- Evidence:
  - `apps/web/lib/cookie-domain.ts` (lines 6-11: `Domain` set to parent domain for multi-part hosts, so `mct_session` is readable by `www.*` marketing origin's cookie jar; flags HttpOnly + SameSite=Lax retained)
- What is happening: The session cookie's `Domain` covers all subdomains of the portal host, including the public marketing site served by the same web app.
- Why it matters: Any XSS on the marketing origin would see the session cookie in its jar (still HttpOnly, so JS can't read it — the exposure is limited to CSRF-style abuse, mitigated by SameSite=Lax).
- User / business impact: Minor; marketing pages are same-codebase.
- Security / privacy / reliability impact: Broadened session exposure boundary.
- Recommended fix: Restrict the cookie to the portal host only (no shared Domain) now that the app and API are same-site anyway, or keep the shared domain but document the trade-off.
- Suggested validation: Manual check of cookie scope on `www.*` vs `app.*`.
- Owner suggestion: Web frontend + DevOps.
- Effort estimate: Small.
- Dependencies: Deploy topology (same-site already).
- Status: Open

## Risks

| Risk | Severity | Likelihood | Mitigation in place | Finding |
| --- | --- | --- | --- | --- |
| Account takeover via tokenless password reset | Critical | Medium | `rateLimitAuth` + `rateLimitEmail` only | API-P0-001 |
| Cross-tenant read/write via missing org filters | High | Low-Medium | UUID entropy; `requireOrgAccess` on parent routes; super-admin-only for billing | API-P1-002 |
| Client-side mutation features 403 in production (CSRF) | High | Certain (production) | None (works only on localhost) | API-P1-003 |
| Invoice amounts 100x inflated in DB | High | Certain (on every sync/webhook) | None | BILL-P1-001 |
| Webhook dedup drops/duplicates events | Medium | Medium | Redis dedup (non-atomic, deterministic keys) | API-P2-004 |
| SSE realtime dead code | Low | — | Polling fallback | API-P2-006 |
| Spec/impl drift hides defects | Medium | Certain | — | API-P2-007 |

## Recommendations

1. **P0 — Fix `POST /api/v1/auth/reset-password` to require a verified one-time token** (API-P0-001). This is release-blocking.
2. **P1 — Add org-scoped filters to all by-ID sub-resource handlers** (API-P1-002); make `organization_id` mandatory on org-scoped routes.
3. **P1 — Resolve the CSRF cross-origin incompatibility** (API-P1-003): shared-domain CSRF cookie or same-origin deployment; re-verify flags.
4. **P1 — Fix Stripe amount units** (BILL-P1-001): remove `* 100` on `subtotal`/`tax`/`total` in `billing.ts` and `webhooks.ts`.
5. **P2 — Make webhook dedup atomic and event-unique** (API-P2-004).
6. **P2 — Replace 40101 with 401** (API-P2-005).
7. **P2 — Fix SSE cookie auth or remove the endpoint** (API-P2-006).
8. **P2 — Regenerate/fix OpenAPI spec**; fix reset-password contract (API-P2-007).
9. **P2 — Add SDK modules for store/analytics/admin; prune dead wrappers** (API-P2-008).
10. **P2 — Scope admin search and cap audit logging** (SEARCH-P2-001); align `PortalSearchResult` (API-P2-009); attach or remove `requireActiveSubscription` (API-P2-010); switch cached admin endpoints to `NoRenew` (API-P2-011).

## Quick Wins

- `middleware/auth.ts:57` → HTTP 401 (one line).
- `billing.ts:219-221` + `webhooks.ts:121-123` → drop `* 100` (two edits).
- `documents.ts`/`tickets.ts`/`billing.ts` → add `.eq("organization_id", orgId)` on the 4 confirmed handlers.
- `dashboard.ts` + `business-os.ts` → use `responseCacheNoRenew`.
- `search-portal.ts`/`search.ts` → align `PortalSearchResult` type and drop `organization_id` from portal search call.

## Hardening Backlog

- Atomic webhook idempotency (SET NX) + event-unique dedup keys.
- Single-source-of-truth OpenAPI generation from route metadata.
- SDK coverage test (every mounted router has a wrapper) and dead-wrapper pruning.
- SSE: cookie-auth support + real consumer, or removal.
- Enforce or remove `requireActiveSubscription`.
- Timestamp unit normalization + M365 replay coverage.

## Suggested Tests

- `POST /auth/reset-password` rejects requests without a valid token (401/400).
- Cross-org integration tests for tickets/comments, documents, invoices (with and without `organization_id`) expect 403/404.
- Cross-origin E2E: client-side mutation (mark notification read) succeeds in production topology.
- Billing unit test: fixture `inv.total=5000` → `total_cents=5000`.
- Webhook concurrency test: duplicate delivery processed once; repeated distinct events not dropped.
- SSE: cookie-authenticated stream stays alive past 5 minutes.
- Cache test: `NoRenew` TTL does not extend on hits.

## Suggested Documentation Updates

- `docs/API_ENDPOINT_INVENTORY.md`: add store/analytics/admin endpoints; note server-only routes.
- `docs/API_VERSIONING.md` + OpenAPI: reconcile documented routes (reset-password, business-os, dashboard/activity-feed, store quotes, sop-library).
- `docs/BILLING.md`: document invoice amount units (cents) after fix.
- AGENTS.md: record CSRF/origin topology decision and SSE status.

## Open Questions

- Is the tokenless reset-password flow intentionally a "set password for known email" convenience, or a regression? (Needs product confirmation.)
- Are `store`/`analytics`/`admin` endpoints intentionally server-only (no SDK)?
- Is `requireActiveSubscription` intended to gate tickets/documents/projects, and is the subscription feature active in production billing?
- Does production actually route all API traffic cross-origin (`app.*` → `api.*`), or is there a same-origin path behind Caddy? (Determines API-P1-003 severity.)
- Jira/JSM/M365 timestamp unit (ms vs s) at runtime — confirm provider behavior.

## Appendix

### Cache-key construction (verified, no cross-user leak)

`middleware/cache.ts:138-148`: key = `user={userId}:{path}:{JSON(query)}` (or `org=` when `authUser.orgId` set, which `requireAuth` never sets). Per-user keys mean no cross-user cache bleed; finding API-P2-011 is limited to TTL freshness and per-user duplication of admin-global data.

### SDK usage evidence (module-qualified, all `apps/web`)

Active: `NotificationBell.tsx` (`notifications.markAllRead/markRead/updatePreferences`), `NotificationsPageClient.tsx` (`notifications.markRead/markAllRead`). Unused in web: 29 methods listed in API-P2-008.

### Router mount vs spec coverage

51 routers mounted (`app.ts:140-191`); OpenAPI spec covers approximately 20 route groups; 5 documented entries mismatch implementation; 25+ mounted groups undocumented (details in API-P2-007).
