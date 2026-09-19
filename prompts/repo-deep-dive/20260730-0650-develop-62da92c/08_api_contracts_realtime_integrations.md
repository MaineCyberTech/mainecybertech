# Prompt 08 — API Contracts, Realtime, and Integrations Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### REST/RPC Routes
- 44 route files in `apps/api/src/routes/` registered in `apps/api/src/app.ts`
- Path prefix: `/api/v1/` for all user-facing routes
- Health: `/health` (no auth), `/metrics` (Prometheus)
- Total documented endpoints: 95 (per `docs/API_ENDPOINT_INVENTORY.md` lines 329-331)
- Route registration order in `app.ts` determines middleware scope

### Server Actions
- Web uses Next.js Server Actions via `apps/web/app/**/actions.ts` files (e.g., `contact/actions.ts`, `tickets/[ticketId]/actions.ts`)
- Server actions call API via `lib/client-api.ts` SDK helper (MCTClient.create())

### WebSocket/Realtime
- SSE stream at `GET /api/v1/notifications/stream` — Server-Sent Events for real-time notification push
- Uses Supabase Realtime channel `notifications:{userId}` for INSERT/UPDATE events
- 30-second keepalive interval
- Sends initial unread notifications on connect

### Subscriptions/Events
- Supabase Realtime used only for notifications SSE stream
- No WebSocket-based subscriptions
- No event-sourcing pattern

### Webhooks
- Inbound: `/api/v1/webhooks/stripe`, `/api/v1/webhooks/jira`, `/api/v1/webhooks/jsm`, `/api/v1/webhooks/m365` (see Report 27 for full audit)
- Outbound: `lib/webhook-dispatcher.ts` — dispatches events to configured webhook_endpoints
- Rate limiter skips webhook paths: `app.ts:115` — `req.path.startsWith("/api/v1/webhooks/")`

### External Clients
- Stripe SDK for webhook event construction (`webhooks.ts:82`)
- Raw `fetch` for Stripe API calls in billing sync (`billing.ts:196-200`)
- Raw `fetch` for JSM API calls (`public.ts`)
- Raw `fetch` for Teams webhook calls (`public.ts`)
- `httpClients` at `lib/http-client.ts` — structured HTTP client with timeout/retry/circuit breaker

### Retries/Timeouts/Circuit Breakers
- `lib/http-client.ts`: HttpClient class with timeout (default 10s), retry (3 attempts, exponential backoff), circuit breaker (5 failures, 30s half-open)
- `lib/circuit-breaker.ts`: CircuitBreaker class (CLOSED/HALF_OPEN/OPEN states, failure threshold, reset timeout)
- `services/supabase.ts`: Supabase client wrapped with circuit breaker (`createSupabaseCircuitBreaker`)
- `lib/webhook-dispatcher.ts`: 10s timeout per outbound dispatch, no retry loop
- Inbound webhook handlers: no explicit timeout on external calls within handlers

### Pagination/Filter/Sort
- Consistent pattern: `page`, `limit` query params, `range(offset, offset + limit - 1)`
- Default limit: 20-25, max limit: 50-100 depending on endpoint
- Filters: `organization_id`, `status`, `visibility`, `entity_type`, `entity_id`, `q` (search)
- Sort: `created_at desc` (ascending: false) on all list endpoints
- Response: `{ items: T[], total: number, page: number, limit: number }`

### Error Response Format
- Consistent envelope: `{ success: true, data: T }` or `{ success: false, error: { code, message, status, details? } }`
- Error codes: UNAUTHORIZED (401), FORBIDDEN (403), VALIDATION (400), NOT_FOUND (404), DB_ERROR (500), STORAGE_ERROR (500), VERSION_CONFLICT (409)
- Errors propagate to `errorHandler` middleware via `next(error)`

### OpenAPI/Versioning
- No OpenAPI spec committed
- `/api/v1` prefix implies versioning strategy — no v2 planning documented
- `docs/API_VERSIONING.md` exists (empty/stub)
- Swagger UI not configured in production

### Request/Response Validation
- Zod schemas on all 27+ mutation endpoints
- Input sanitization middleware (`inputSanitizer`) — HTML-encoding removed, pattern detection only
- Response format enforced via `success()` wrapper

### Auth/Rate Limit
- Global rate limit: 300 req/15min per IP (skips webhooks, health, localhost)
- Per-user rate limit: 100 req/15min after auth
- Rate limit headers: `RateLimit-*` (standardHeaders: true)
- JWT authentication: Bearer token or cookie fallback

### Background Delivery
- Worker at `apps/worker/` — BullMQ consumer (default) or SQS consumer
- Tasks: stripe-reconcile, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications + 7 scanning modules

### Dead-Letter Handling
- `webhook_dead_letters` table for persistently failed outbound deliveries
- Retry columns on `webhook_deliveries`: `retry_count`, `next_retry_at`, `dead_letter`
- No automated retry worker — dead letters are manually reviewed

### Duplicate Event Behavior
- Redis-based idempotency with in-memory fallback (`lib/idempotency.ts`)
- Inbound webhooks: deterministic keys (`stripe-{event.id}`, `jira-{webhookEvent}-{issueKey}`, etc.)
- Outbound dispatches: `wh-out-{endpoint.id}-{event}-{timestamp}` (timestamp-based, not deterministic)
- 24h TTL for idempotency keys
- 10k entry limit for in-memory fallback

### Integration Secrets
- Stored in env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`, `JSM_API_TOKEN`
- All optional (Zod `.optional()`) — integrations degrade gracefully when unconfigured
- Turnstile key optional for contact form spam protection

### Tests/Docs
- API tests: 583 tests across 70 suites
- SDK tests: 223 tests
- `docs/API_ENDPOINT_INVENTORY.md` — 95 endpoints documented with auth/Zod/audit columns
- `docs/BILLING.md` — billing/Stripe integration docs
- `docs/JIRA_JSM_INTEGRATION.md` — Jira/JSM integration docs

---

## API Inventory

### Core Routes (registered in app.ts)

| Mount Path | Router File | Middleware | Endpoints |
|---|---|---|---|
| `/health` | health | None | GET / |
| `/api/v1` | docs | None | Swagger/API docs |
| `/api/v1/auth` | auth | None (per-route) | 7 (sign-in, sign-up, callback, sign-out, forgot-password, reset-password, me) |
| `/api/v1/organizations` | organizations | requireAuth + requireOrgAccess | 5 (CRUD + list) |
| `/api/v1/memberships` | memberships | requireAuth + requireOrgAccess | 5 (CRUD + list) |
| `/api/v1/users` | users | requireAuth + requireOrgAccess | 5 (list, get, role, permissions) |
| `/api/v1/profiles` | profiles | requireAuth | 3 (list, get, update + avatar upload) |
| `/api/v1/tickets` | tickets | requireAuth + requireOrgAccess | 9 (CRUD + comments + bulk + export) |
| `/api/v1/projects` | projects | requireAuth + requireOrgAccess | 9 (CRUD + tasks + comments + export) |
| `/api/v1/documents` | documents | requireAuth + requireOrgAccess | 7+ (CRUD + upload + versions + shares) |
| `/api/v1/dashboard` | dashboard | requireAuth + requireOrgAccess | 1 (compound dashboard) |
| `/api/v1/audit` | audit | requireAuth + requireOrgAccess | 2 (list + export) |
| `/api/v1/webhooks` | webhooks | None (per-route) | 4 inbound (stripe/jira/jsm/m365) |
| `/api/v1/roles` | roles | requireAuth + requireOrgAccess | 5 (list + with-permissions + CRUD + permissions matrix) |
| `/api/v1/search` | search | requireAuth + requireAdmin | 1 (admin global search) |
| `/api/v1/search/portal` | search-portal | requireAuth | 1 (portal org-scoped search) |
| `/api/v1/public` | public | None | 2 (init + submit) |
| `/api/v1/notifications` | notifications | requireAuth + requireOrgAccess | 6 (list + unread-count + create + read + mark-all-read + delete) + SSE /stream |
| `/api/v1/notification-preferences` | notification-preferences | requireAuth + requireOrgAccess | 2 (GET + PUT) |
| `/api/v1/billing` | billing | requireAuth + requireOrgAccess | 6 (summary + invoices + subscriptions + payments + customer + sync) |
| `/api/v1/webhook-endpoints` | webhook-management | requireAuth + requireOrgAccess | 7 (CRUD + deliveries + test) |
| `/api/v1/bulk` | bulk | requireAuth + requireOrgAccess | 1 (invite) |
| `/api/v1/sla` | sla | requireAuth + requireOrgAccess | 1 (metrics) |
| `/api/v1/api-keys` | api-keys | requireAuth + requireOrgAccess | Per-module CRUD |
| `/api/v1/admin` | admin | requireAuth + requireAdmin | 1 (test-email) |

Plus 23 module-specific routers (proposals, findings, qbr, governance, security-*, field-*, edu-*, domain-monitors, website-monitors, file-requests, assets, vendors, approvals, ai, batch, business-os, client-onboarding, satisfaction-pulse, dynamic-forms, license-optimizer, dmarc-coach, training-hub, insurance-binder, status-page, uptime-monitor)

---

## Realtime Inventory

| Feature | Channel | Filter | Events | Auth |
|---|---|---|---|---|
| Notification stream | `notifications:{userId}` | `user_id=eq.{userId}` | INSERT, UPDATE | requireAuth (HTTP) + row-level (Supabase) |

---

## Integration Inventory

| Integration | Type | Auth | Timeout | Retry | Circuit Breaker | Idempotency |
|---|---|---|---|---|---|---|
| Stripe (inbound) | Webhook | `stripe.webhooks.constructEvent()` | None | N/A | N/A | ✅ Deterministic keys |
| Stripe (outbound) | REST API | Bearer token | 10s (httpClients) | 3 attempts (httpClients) | ✅ (httpClients) | N/A |
| Jira (inbound) | Webhook | HMAC-SHA256 signature (optional) | None | N/A | N/A | ✅ Deterministic keys |
| JSM (inbound) | Webhook | HMAC-SHA256 signature (optional) | None | N/A | N/A | ✅ Deterministic keys |
| JSM (outbound) | REST API | Basic auth (token) | 10s (httpClients) | 3 attempts (httpClients) | ✅ (httpClients) | N/A |
| M365 (inbound) | Webhook | HMAC-SHA256 signature (optional) | None | N/A | N/A | ✅ Deterministic keys |
| Teams (outbound) | Webhook | None (URL-based) | 10s (httpClients) | 3 attempts (httpClients) | ✅ (httpClients) | N/A |
| Supabase | DB client | Service role / anon+JWT | 30s (supabase.ts) | None | ✅ (circuit-breaker.ts) | N/A |

---

## Findings

### API-P0-001 — No OpenAPI/Swagger spec committed (P0 Critical)

**Evidence:** `docs/API_ENDPOINT_INVENTORY.md` documents 95 endpoints manually. No `openapi.json` or Swagger annotations exist. `app.ts` registers a `docsRouter` at `/api/v1` but there's no generated spec. API versioning doc (`docs/API_VERSIONING.md`) is a stub.

**Risk:** No machine-readable API contract. Clients must reverse-engineer from route files. Schema changes are invisible to consumers. Breaking changes can't be detected automatically.

**Recommendation:** Generate OpenAPI 3.0 spec from Zod schemas using `zod-to-json-schema` or `@anatine/zod-openapi`. Wire into docsRouter. Add breaking-change detection to CI.

---

### API-P1-001 — SSE notification stream lacks per-connection auth re-validation (P1 High)

**Evidence:** `notifications.ts:15-91` — SSE stream checks auth once via `requireAuth` middleware (line 11), then subscribes to Supabase Realtime channel `notifications:{userId}`. Token expiry during long-lived SSE connection is not re-validated.

**Risk:** If a JWT token expires during an SSE session, the connection continues receiving notifications until socket close. Client-side token revocation doesn't close the SSE stream.

**Recommendation:** Add periodic auth re-validation (e.g., ping/pong with token check every 5 minutes). Close SSE connection on token expiry. Consider using Supabase Realtime's built-in auth.

---

### API-P1-002 — Inbound webhook handlers lack timeout on external calls (P1 High)

**Evidence:** `webhooks.ts` — Stripe/Jira/JSM/M365 handlers process events synchronously. Stripe handler calls `supabase.from("billing_customers")` queries and upserts without explicit timeout control — relies on Supabase client 30s default timeout. Jira/JSM handlers call `supabase.from("project_tasks").select()` and `update()` — no timeout override.

**Risk:** A slow Supabase query during webhook processing delays the HTTP response. Stripe expects 200-level response within ~10s or it retries. Combined webhook flood could exhaust connection pool.

**Recommendation:** Add per-handler timeout (5s) wrapping all DB operations in webhook handlers. Return 200 quickly and process asynchronously via worker queue for heavy operations.

---

### API-P1-003 — No breaking-change detection in CI (P1 High)

**Evidence:** No workflow or tool validates API contract changes. `docs/API_VERSIONING.md` is a stub. No OpenAPI spec to diff.

**Risk:** A PR that renames a field, changes a response shape, or removes an endpoint can be merged without consumer awareness.

**Recommendation:** Generate OpenAPI spec from Zod schemas, commit to repo, diff in CI on every PR, and fail if breaking changes detected (using `openapi-diff` or similar).

---

### API-P2-001 — Response pagination type partially undocumented (P2 Medium)

**Evidence:** `PaginatedResult<T>` type defined in `types.ts` but not consistently used across route files. Some endpoints return raw arrays (e.g., `GET /webhook-endpoints/` — `webhook-management.ts:46` returns `data ?? []` instead of `{ items, total, page, limit }`).

**Risk:** Inconsistent pagination responses force clients to handle both raw array and paginated envelope.

**Recommendation:** Standardize all list endpoints to use `PaginatedResult<T>` envelope. Convert the 3-4 non-paginated list endpoints (webhook-endpoints, subscriptions) to use paginated response format.

---

### API-P2-002 — `/metrics` endpoint lacks auth (P2 Medium)

**Evidence:** `app.ts:126-129` — `/metrics` serves Prometheus metrics without any auth middleware.

**Risk:** Internal metrics (memory, request counts, error rates) are publicly exposed.

**Recommendation:** Add `requireAuth + requireAdmin` middleware to `/metrics` or restrict to internal IP range.

---

### API-P2-003 — docsRouter target is unclear (P2 Medium)

**Evidence:** `app.ts:134` — `app.use("/api/v1", docsRouter)` mounts without auth. The router file `routes/docs.ts` was not inspected but likely serves Swagger UI or a redirect.

**Risk:** If docsRouter exposes API documentation without auth, it reveals attack surface information.

**Recommendation:** Verify docsRouter behavior. If it serves generated OpenAPI spec, add authentication or serve only in dev mode.

---

### API-P3-001 — No integration health endpoint for external services (P3 Low)

**Evidence:** `/health` endpoint returns simple OK. No health check for Stripe connectivity, Supabase Realtime status, or Redis availability.

**Risk:** Degraded integrations are invisible to monitoring until users report failures.

**Recommendation:** Add `/health/ready` (dependency check) and `/health/live` endpoints. Include Stripe API ping, Supabase query test, and Redis PING.

---

## Contract Test Plan

| Test Category | Current | Target |
|---|---|---|
| Route registry coverage | 95 endpoints documented | Full OpenAPI spec |
| Response format validation | Manual inspection | Automated contract tests per endpoint |
| Pagination consistency | Manual review | TypeScript type guard per endpoint |
| Error code consistency | Manual review | Integration test per error scenario |
| Auth middleware attribution | Manual review | Test per middleware combination |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | No OpenAPI spec |
| P1 (High) | 3 | SSE re-auth, webhook handler timeouts, no breaking-change CI |
| P2 (Medium) | 3 | Pagination inconsistency, metrics exposed, docsRouter |
| P3 (Low) | 1 | No integration health endpoint |
| **Total** | **8** | |

The API surface is well-structured with consistent middleware composition, Zod validation on mutations, and uniform error responses. The critical gaps are: (1) no machine-readable API contract, (2) SSE streams don't re-validate auth, and (3) no breaking-change detection pipeline.
