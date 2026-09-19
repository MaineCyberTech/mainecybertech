# Phase 5 — Safe Phased Alignment Roadmap

**Date:** 2026-07-02
**Audit Run:** Run2
**Reference Repo (Chat):** `C:\temp\chat`
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`

---

## 1. Roadmap Summary

This roadmap describes 14 actionable changes that bring beneficial patterns from the Chat repo into MCT while preserving everything that works.

**Guiding principles:**

- MCT is the more mature codebase (774 tests, stronger auth, better operations). The goal is selective borrowing, not convergence.
- Every change is classified by adoption style: **copy as-is** (Chat file verbatim or near-verbatim), **adapt conceptually** (borrow idea, adapt to MCT context), or **skip** (keep current approach).
- Nothing in this roadmap touches route handlers, API contracts, auth flows, env schemas, or the supabase migration history.

### Risk Profile of All Changes

| Risk Level                   | Count        | Total Effort            |
| ---------------------------- | ------------ | ----------------------- |
| No-risk (Phase 1)            | 6 items      | ~60 min                 |
| Low-risk (Phase 2)           | 4 items      | ~3 hrs                  |
| Medium-risk (Phase 3)        | 2 items      | ~4 hrs                  |
| Optional strategic (Phase 4) | 2 items      | ~2 days                 |
| Future cleanup (Phase 5)     | 3 items      | ~1 hr                   |
| **Total**                    | **17 items** | **~3 engineering days** |

### What Changes Are NOT on This Roadmap

The following patterns from Chat are explicitly excluded (see Phase 3 §8 for rationale):

| Chat Pattern                      | Exclusion Reason                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Move env schema to shared package | Per-app schemas are simpler; API and worker have genuinely different env needs   |
| Create shared DB package          | MCT's architecture (no Supabase client in web) is deliberate and more secure     |
| Adopt Socket.io                   | SSE is sufficient for MCT's notification-only real-time needs                    |
| Migrate from Jest to vitest       | 774 working tests — no value in swapping test runners                            |
| Add feature flags                 | No gradual-rollout use case in MSP context                                       |
| Add PWA                           | Desktop-first portal; offline support is irrelevant                              |
| Separate RLS policy files         | Migration-embedded RLS is more atomic and prevents deployment ordering bugs      |
| Root-level Playwright config      | MCT's E2E tests are scoped to web app; adding root config would create confusion |

---

## 2. Phase 0: Observation Only (No Code Changes)

These areas should be monitored before deciding whether to act. No changes, no effort.

### O-1: Circuit breaker timeout enforcement in production

| Field               | Value                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What to observe** | Are there scenarios where `circuitBreaker.execute()` is called directly (not through `HttpClient`)? Monitor for hangs on Supabase calls during network issues.                 |
| **Why**             | The verified timeout gap (Phase 3 §2.4) is mitigated by `HttpClient`'s AbortController for external API calls. The risk is limited to Supabase calls that bypass `HttpClient`. |
| **Duration**        | 2-4 weeks of production monitoring                                                                                                                                             |
| **Decision gate**   | If no direct `breaker.execute()` calls are observed, defer Opossum migration to Phase 2. If hangs are detected, escalate to Phase 2 priority.                                  |
| **Measurement**     | Look for stalled Supabase queries in pino logs that exceed 30s without error.                                                                                                  |

### O-2: Webhook delivery volume

| Field               | Value                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **What to observe** | Count of outbound webhook deliveries per minute (`metrics.ts` counters).                                                    |
| **Why**             | Inline webhook delivery is acceptable below ~100/min (Phase 3 §2.9). Worker offload is only justified above this threshold. |
| **Duration**        | Ongoing (record baseline in production)                                                                                     |
| **Decision gate**   | If volume exceeds 100/min sustained over 1 week, escalate to Phase 3.                                                       |

### O-3: Cache staleness incidents

| Field               | Value                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **What to observe** | User reports of stale data in org/doc/project/roles lists.                                                                            |
| **Why**             | Cache invalidation completeness is not verified (Phase 4 §MR-2). Current behavior is likely correct, but production will reveal gaps. |
| **Duration**        | Ongoing                                                                                                                               |
| **Decision gate**   | If stale data is reported more than once per month, escalate cache invalidation audit to Phase 2.                                     |

---

## 3. Phase 1: Immediate Low-Risk Wins

These changes carry **zero or near-zero regression risk**. They are pure additions, configuration changes, or documentation updates. No behavior changes for existing code paths. **Total effort: ~60 minutes.**

### 1.1 Add Pino Redact Paths

| Field                 | Value                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add `redact.paths` to `apps/api/src/lib/logger.ts` — block passwords, secrets, tokens, auth headers, cookies from appearing in logs                                       |
| **Why it matters**    | Closes a verified secret-leakage vector (Phase 3 §4.1, Phase 4 §HR-3). Any error that bubbles with sensitive data in message or context is currently logged in plaintext. |
| **Chat pattern**      | `packages/config/logger.ts` lines 34-43 — copy verbatim                                                                                                                   |
| **Preserve**          | All existing logger API calls (`.info()`, `.error()`, `.warn()`, `.fatal()`) — no function signatures change                                                              |
| **Prerequisites**     | None                                                                                                                                                                      |
| **Test requirements** | None (configuration only)                                                                                                                                                 |
| **Rollback**          | Revert the 5-line addition                                                                                                                                                |
| **Adoption style**    | **copy as-is**                                                                                                                                                            |

**Implementation:** Add to `pino()` options:

```typescript
redact: {
  paths: [
    "*.password", "*.secret", "*.token", "*.authorization",
    "req.headers.authorization", "req.headers.cookie",
  ],
  censor: "[REDACTED]",
},
```

---

### 1.2 Copy `date.ts` to `@mct/config`

| Field                 | Value                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Copy Chat's `packages/config/date.ts` (72 lines, 12 pure functions) to `packages/config/src/date.ts`. Add re-export to `packages/config/index.ts`.                                          |
| **Why it matters**    | Eliminates ad-hoc date manipulation across 25+ route files (Phase 3 §2.3, §5.1). Centralizes common operations: `now()`, `addDays()`, `diffInHours()`, `isPast()`, `formatDuration()`, etc. |
| **Chat pattern**      | `packages/config/date.ts` — copy verbatim                                                                                                                                                   |
| **Preserve**          | All existing `new Date()` / `Date.now()` calls. This is additive — no code is removed.                                                                                                      |
| **Prerequisites**     | None                                                                                                                                                                                        |
| **Test requirements** | None (pure functions, trivially correct by inspection)                                                                                                                                      |
| **Rollback**          | Remove the file and revert the re-export                                                                                                                                                    |
| **Adoption style**    | **copy as-is**                                                                                                                                                                              |

**Note:** Do not migrate existing inline date calls in this phase. That's a Phase 3 refactoring task. Phase 1 is just making the utility available.

---

### 1.3 Add Idempotency In-Memory Map Size Limit

| Field                 | Value                                                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | In `apps/api/src/lib/idempotency.ts`, add a size check before `IN_MEMORY_FALLBACK.set()`. When `size > 10_000`, delete the oldest entries (by `expiresAt`) until size drops below 8_000. |
| **Why it matters**    | Prevents OOM under sustained Redis failure (Phase 3 §4.3, Phase 4 §HR-4). The Map grows unboundedly with 24h TTL entries.                                                                |
| **Chat pattern**      | Same vulnerability — both repos need the fix. Adapt conceptually.                                                                                                                        |
| **Preserve**          | All existing idempotency behavior (lookup, TTL, cleanup interval). Only the `set()` path changes when Map exceeds threshold.                                                             |
| **Prerequisites**     | None                                                                                                                                                                                     |
| **Test requirements** | Unit test: insert 10,001 entries, verify 11th triggers eviction and old entries are removed first                                                                                        |
| **Rollback**          | Remove the size-check block                                                                                                                                                              |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                   |

---

### 1.4 Add `activeUsers` / `activeOrgs` Prometheus Gauges

| Field                 | Value                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add two Prometheus gauges to `apps/api/src/lib/metrics.ts`: `activeUsers` (users with activity in last 24h) and `activeOrgs` (orgs with activity in last 24h). Expose via existing `/metrics` endpoint. |
| **Why it matters**    | Closes an observability gap (Phase 3 §2.8, Phase 4 §MR-3). Critical for monitoring platform health.                                                                                                     |
| **Chat pattern**      | `activeWorkspaces` and `activeUsers` gauges — adapt the concept to MCT's domain model                                                                                                                   |
| **Preserve**          | All existing 7 counters (ticketsCreatedTotal, projectsCreatedTotal, etc.) — no changes to their collection                                                                                              |
| **Prerequisites**     | Prometheus client must already be registered (it is — `metrics.ts` creates a registry)                                                                                                                  |
| **Test requirements** | None (metrics are write-only; Prometheus scrapes them)                                                                                                                                                  |
| **Rollback**          | Remove the `register.gauge()` calls                                                                                                                                                                     |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                  |

**Implementation detail:** The gauges should be updated by a periodic function (setInterval or cron) that queries `users` and `organizations` tables for recent activity, rather than on every request.

---

### 1.5 Update Migration Naming Convention Documentation

| Field                 | Value                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Update `docs/migrations/naming-guide.md` to recommend ISO-date format (`YYYYMMDDHHMMSS_description.sql`) for all NEW migrations. Existing `5302xxx` files are left unchanged. |
| **Why it matters**    | Prevents naming conflicts in multi-developer workflows (Phase 3 §2.7). Sequential numbering guarantees conflicts when two branches each add a migration.                      |
| **Chat pattern**      | `20260625000001_create_workspaces.sql` — adapt the convention                                                                                                                 |
| **Preserve**          | All 22 existing `5302xxx` migrations — **do not rename** (breaks `supabase migration list` history)                                                                           |
| **Prerequisites**     | None                                                                                                                                                                          |
| **Test requirements** | None (documentation only)                                                                                                                                                     |
| **Rollback**          | Revert the doc change                                                                                                                                                         |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                        |

---

### 1.6 Use `logger.child()` for Request ID Injection

| Field                 | Value                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What changes**      | In `apps/api/src/middleware/request-id.ts`, after generating `req.id`, create `req.log = logger.child({ requestId: req.id })`. Migrate call sites from `logger.info(...)` to `req.log.info(...)` where request context is available. |
| **Why it matters**    | Eliminates manual requestId passing in log calls (Phase 3 §4.5). Pino's `child()` auto-injects the field into every log line.                                                                                                        |
| **Chat pattern**      | Both repos lack this — neither has solved it. Adapt the pino child pattern.                                                                                                                                                          |
| **Preserve**          | All existing `logger.*()` calls (module-level logger still works). `req.log` is additive — existing calls continue to work.                                                                                                          |
| **Prerequisites**     | Request-ID middleware must exist (it does)                                                                                                                                                                                           |
| **Test requirements** | None (pino's `child()` is well-tested; no logic change)                                                                                                                                                                              |
| **Rollback**          | Remove the `child()` line and revert call-site changes                                                                                                                                                                               |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                               |

---

## 4. Phase 2: Low-Risk Similarity Improvements

These changes involve adding new code or replacing internal implementations. They carry **low risk** because they are isolated to non-route files and do not change API contracts. **Total effort: ~3 hours.**

### 2.1 Add Typed Error Subclasses

| Field                 | Value                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add 9 typed error classes (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `TooManyRequestsError`, `InternalServerError`, `ServiceUnavailableError`) extending `AppError` to `apps/api/src/types/index.ts`. Update `middleware/error.ts` to catch typed subclasses before generic `AppError`. |
| **Why it matters**    | Enables `catch (err instanceof NotFoundError)` pattern for route / service logic (Phase 3 §2.1). The current single `AppError` with `string` code makes this impossible without string comparison.                                                                                                                                        |
| **Chat pattern**      | 9 typed subclasses in `packages/config/errors.ts` — adapt conceptually (keep MCT's `success()`/`failure()` envelope; add subclasses for internal use)                                                                                                                                                                                     |
| **Preserve**          | The `success()`/`failure()` API response envelope. These subclasses are for internal error handling only — error handler converts them to the same `{ success: false, error: {...} }` shape.                                                                                                                                              |
| **Prerequisites**     | Phase 1.6 (optional, but helpful for error context logging)                                                                                                                                                                                                                                                                               |
| **Test requirements** | Unit: each subclass serializes correctly (extends AppError, has correct statusCode). Integration: error handler catches subclasses in correct order.                                                                                                                                                                                      |
| **Rollback**          | Revert subclass definitions and error handler ordering change                                                                                                                                                                                                                                                                             |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                                                                                                                                    |

---

### 2.2 Fix Circuit Breaker Timeout Gap (Switch to Opossum)

| Field                       | Value                                                                                                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**            | Replace MCT's custom `CircuitBreaker` class (124 lines) with Chat's Opossum-based implementation. Import `opossum` npm package. Update `circuit-breaker.ts` factory to return Opossum breakers. Update call sites (`http-client.ts`, `services/supabase.ts`) to use the new API. |
| **Why it matters**          | The current `CircuitBreaker.execute()` does NOT enforce its declared `timeout` — the AbortController in `HttpClient` handles timing (Phase 3 §2.4, Phase 4 §HR-2). Opossum correctly enforces timeouts and fires the "open" transition on timeout events.                        |
| **Chat pattern**            | `apps/api/src/lib/circuit-breaker.ts` using Opossum — adapt the integration pattern                                                                                                                                                                                              |
| **Preserve**                | All factory function signatures that create named breakers. The breaker registry pattern (Map-based). The configuration points (timeout, resetTimeout, errorThreshold).                                                                                                          |
| **Prerequisites**           | None                                                                                                                                                                                                                                                                             |
| **Test requirements**       | New circuit breaker tests (currently 0 CB tests in MCT): open-close-halfopen cycle, timeout enforcement, stats tracking, shutdown                                                                                                                                                |
| **Rollback**                | Revert to custom implementation — swap import                                                                                                                                                                                                                                    |
| **Adoption style**          | **adapt conceptually**                                                                                                                                                                                                                                                           |
| **Deployment coordination** | Add `opossum` to `apps/api/package.json` dependencies. Pin version. Build-time dependency only — no runtime config changes.                                                                                                                                                      |

**Risk mitigation:** Run existing API tests (182) after the switch. If any breaker-dependent code behaves differently, the tests will catch it (breaker failures should return 503, which existing error-handler tests should verify).

---

### 2.3 Enrich `@mct/config` with Logger Factory

| Field                 | Value                                                                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add a shared pino logger factory to `@mct/config/src/logger.ts` with: redact config (from Phase 1.1), env-based log level, service name parameter. Update `apps/api/src/lib/logger.ts` and `apps/worker/src/logger.ts` to import from the shared factory. |
| **Why it matters**    | Eliminates Logger configuration duplication between API and worker (Phase 3 §2.2, §5.5). Ensures consistent redact paths, level handling, and formatting across all apps.                                                                                 |
| **Chat pattern**      | `packages/config/logger.ts` — adapt conceptually (Chat does not use a factory pattern; this is MCT-specific)                                                                                                                                              |
| **Preserve**          | The per-app logger files remain as thin wrappers that call the shared factory with the service name. All existing `logger.*()` call sites are unchanged.                                                                                                  |
| **Prerequisites**     | Phase 1.1 (logger redact configuration — will move into shared factory)                                                                                                                                                                                   |
| **Test requirements** | Import resolution tests in API and worker. Verify redact paths are inherited.                                                                                                                                                                             |
| **Rollback**          | Revert the wrapper files to their current standalone implementations                                                                                                                                                                                      |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                                                    |

**Do NOT move env schema into `@mct/config`** (Phase 3 §8.1). Per-app env schemas are better — API needs Stripe/JSM vars, worker doesn't.

---

### 2.4 Add CSRF Middleware (Coordinated Deploy)

| Field                 | Value                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add `apps/api/src/middleware/csrf.ts` implementing double-submit cookie pattern: generate random CSRF token on session creation, set as non-HttpOnly cookie, require matching `X-CSRF-Token` header on mutation requests. Register in `app.ts`. Add token endpoint or embed in auth response for frontend. Update frontend to read token from cookie and include in mutation requests. |
| **Why it matters**    | Closes a verified CSRF gap (Phase 3 §6.6, Phase 4 §HR-5). MCT uses cookie-based auth without CSRF tokens. `SameSite=Lax` mitigates top-level navigation CSRF but does not cover cross-site form POST, subdomain attacks, or GET-based mutations.                                                                                                                                       |
| **Chat pattern**      | `apps/api/src/middleware/csrf.ts` (double-submit cookie pattern) — adapt conceptually                                                                                                                                                                                                                                                                                                  |
| **Preserve**          | All existing `Authorization: Bearer` clients (SDK, API keys, external integrations) are unaffected — CSRF middleware only applies to cookie-based auth. All existing mutation endpoint signatures.                                                                                                                                                                                     |
| **Prerequisites**     | Frontend coordination (token distribution in auth response or dedicated endpoint)                                                                                                                                                                                                                                                                                                      |
| **Test requirements** | Unit: token generation, parsing, validation, timing-safe comparison. Integration: request lifecycle with valid CSRF → 200, missing CSRF → 403, mismatched CSRF → 403.                                                                                                                                                                                                                  |
| **Rollback**          | Remove middleware from `app.ts` — all other code reverts atomically                                                                                                                                                                                                                                                                                                                    |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                                                                                                                                                                                 |

**Deployment coordination:** Ship frontend CSRF token distribution and middleware in the same deploy. Add the CSRF token to the auth response payload so the frontend gets it automatically on login.

**SDK consideration:** The SDK uses `Authorization: Bearer` exclusively — it will never receive CSRF errors. No SDK changes needed.

---

## 5. Phase 3: Medium-Risk Convergence Candidates

These changes involve refactoring across multiple files or touching production data flows. They require more careful sequencing, additional tests, and staging verification. **Total effort: ~4 hours.**

### 3.1 Cache Invalidation Audit

| Field                 | Value                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What changes**      | Audit all `cache.set()` call sites against all mutation endpoints. Verify every cached entity type (orgs list, docs list, projects list, roles list) has `invalidateCache()` called on every mutation that affects it. Add missing invalidation calls. |
| **Why it matters**    | Stale data visibility is a user-facing correctness issue (Phase 4 §MR-2). The no-renew pattern means stale data persists for the full TTL (60s orgs, 30s docs/projects) if invalidation is missed.                                                     |
| **Chat pattern**      | Chat has no caching at all — this is an MCT improvement, not a Chat pattern adoption                                                                                                                                                                   |
| **Preserve**          | The no-renew cache pattern (cache set once on MISS, never rewritten on HIT). The cache backend (Redis + in-memory Map). The existing TTLs.                                                                                                             |
| **Prerequisites**     | None                                                                                                                                                                                                                                                   |
| **Test requirements** | Integration test per cached entity: set cached value ⇒ mutate underlying data ⇒ verify cache is invalidated by reading fresh data                                                                                                                      |
| **Rollback**          | Revert any added invalidation calls                                                                                                                                                                                                                    |
| **Adoption style**    | **adapt conceptually** (this is self-audit, not Chat pattern adoption)                                                                                                                                                                                 |

**Verification matrix to produce:**

| Cached Endpoint                          | TTL | Mutation Endpoints                                                             | Invalidation Present?   |
| ---------------------------------------- | --- | ------------------------------------------------------------------------------ | ----------------------- |
| `GET /api/v1/organizations`              | 60s | `POST /organizations`, `PATCH /organizations/:id`, `DELETE /organizations/:id` | ✅ (AGENTS.md confirms) |
| `GET /api/v1/documents`                  | 30s | `POST /documents`, `PATCH /documents/:id`, `DELETE /documents/:id`             | ✅ (AGENTS.md confirms) |
| `GET /api/v1/projects`                   | 30s | `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`                | ✅ (AGENTS.md confirms) |
| `GET /roles` + `/roles/with-permissions` | 60s | `PUT /roles/:id/permissions`                                                   | ✅ (AGENTS.md confirms) |
| Any others?                              | —   | —                                                                              | Must verify             |

---

### 3.2 Add Cross-Origin Isolation Headers (COEP/COOP/CORP)

| Field                 | Value                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add three security headers to `apps/api/src/middleware/security-headers.ts` and the web middleware: `Cross-Origin-Embedder-Policy: credentialless`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`. |
| **Why it matters**    | Protects against Spectre-type attacks by isolating the origin (Phase 4 §3 in security headers comparison). Chat has these; MCT does not.                                                                                                    |
| **Chat pattern**      | Security headers middleware — copy the cross-origin header values                                                                                                                                                                           |
| **Preserve**          | All existing security headers (CSP, HSTS, XFO, XCTO, XSS, Referrer-Policy, Permissions-Policy). These are additive — only new headers are set.                                                                                              |
| **Prerequisites**     | Verify no cross-origin resource loading that would break under `same-origin` CORP (e.g., CDN scripts, external images, font CDNs). If any exist, use `crossorigin` attribute or relax CORP.                                                 |
| **Test requirements** | E2E test: verify headers are present in all responses. Integration test: verify browser does not report cross-origin isolation errors.                                                                                                      |
| **Rollback**          | Remove the three header lines                                                                                                                                                                                                               |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                                      |

---

## 6. Phase 4: Optional Strategic Improvements

These are higher-effort changes that provide meaningful benefit but are not urgent. They should be prioritized based on production monitoring data and team capacity. **Total effort: ~2 engineering days.**

### 4.1 Offload Webhook Delivery to Worker

| Field                       | Value                                                                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**            | Create a `webhook-delivery` queue in BullMQ. Move outbound webhook `HttpClient.fetch()` calls from `routes/webhook-management.ts` to a new worker task handler (`tasks/webhook-delivery.ts`). API enqueues delivery jobs instead of executing inline. |
| **Why it matters**          | Prevents slow webhook targets from blocking the API event loop (Phase 3 §2.9). Critical if webhook volume exceeds 100/min.                                                                                                                            |
| **Chat pattern**            | `processors/webhook-delivery.ts` — adapt conceptually                                                                                                                                                                                                 |
| **Preserve**                | All webhook management CRUD endpoints (unchanged). Webhook delivery retry logic (moves to worker). Webhook delivery log entries (still created by worker).                                                                                            |
| **Prerequisites**           | Phase 0 observation shows volume > 100/min. BullMQ already configured in worker (it's the default queue backend).                                                                                                                                     |
| **Test requirements**       | Unit: webhook delivery queue consumer. Integration: API enqueues job ⇒ worker processes it ⇒ delivery log is created.                                                                                                                                 |
| **Rollback**                | Revert to inline delivery — change the API route to call `HttpClient.fetch()` directly instead of enqueuing                                                                                                                                           |
| **Adoption style**          | **adapt conceptually**                                                                                                                                                                                                                                |
| **Deployment coordination** | Worker must be deployed first (so it can process the queue), then API (which starts producing jobs).                                                                                                                                                  |

---

### 4.2 Add Per-Request Supabase User Client (RLS Defense-in-Depth)

| Field                 | Value                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Add optional per-request Supabase client creation using the user's JWT token, similar to Chat's `getSupabaseForUser(jwt)`. Use it in parallel with existing service_role client for read operations. Service_role client remains for mutations (admin bypass required). |
| **Why it matters**    | RLS provides a secondary defense layer if `requireOrgAccess` has a bug (Phase 4 §1 HR-1). Currently all queries run as service_role — RLS is completely bypassed.                                                                                                       |
| **Chat pattern**      | Per-request `getSupabaseForUser(jwt)` — adapt conceptually                                                                                                                                                                                                              |
| **Preserve**          | The service_role admin client for all current operations (backward compatible). The `requireOrgAccess` middleware (primary tenant isolation). The `requireAdmin` bypass for admin/super_admin roles.                                                                    |
| **Prerequisites**     | Significant — requires adding `createSupabaseClient(jwt)` function, modifying each route to choose user-scoped vs admin client, and ensuring RLS policies cover all queries.                                                                                            |
| **Test requirements** | Every route that switches to user-scoped client: integration test verifying RLS enforcement. Existing requireOrgAccess tests must continue to pass.                                                                                                                     |
| **Rollback**          | Revert to service_role-only client — swap the import                                                                                                                                                                                                                    |
| **Adoption style**    | **adapt conceptually**                                                                                                                                                                                                                                                  |

**Risk assessment:** This is the single highest-effort change in the roadmap (estimated 1-2 engineering days). It touches all 25 route files. The current by-design approach (service_role + middleware) is functional. Only pursue this if:

- A security audit flags the RLS bypass as a finding
- Production monitoring reveals a `requireOrgAccess` bypass incident
- Customer compliance requirements demand defense-in-depth

---

## 7. Phase 5: Future-State Cleanup / Standardization

These are "nice to have" items that improve codebase hygiene but deliver no direct user value. They should be done opportunistically (e.g., during a slow sprint). **Total effort: ~1 hour.**

### 5.1 Supabase Migration Squash

| Field                 | Value                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Create a consolidated migration file that represents the current schema as a single migration. Replace the 22 sequential `5302xxx` migrations with the squashed file. |
| **Why it matters**    | Speeds up `supabase db push` for local development and CI. Reduces migration chain from 22 steps to 1.                                                                |
| **Chat pattern**      | Chat's 32 migrations are also unsquashed — both repos benefit                                                                                                         |
| **Preserve**          | The resulting schema must be identical to running all 22 migrations in order. Production data must not be affected.                                                   |
| **Prerequisites**     | Access to a fully migrated Supabase project for `pg_dump`                                                                                                             |
| **Test requirements** | Spin up a fresh Supabase project, apply the squashed migration, run all API tests against it                                                                          |
| **Rollback**          | Keep the 22 original migration files as a backup; can always re-apply them                                                                                            |
| **Adoption style**    | **keep current** (both repos need this; not a Chat adoption)                                                                                                          |

---

### 5.2 Dormant Infra Cleanup

| Field                 | Value                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What changes**      | Remove the root `docker-compose.yml` (legacy AWS-era file). Remove `vercel.json` (Vercel is dormant — MCT deploys to DO). Remove any remaining AWS `.tf` references in documentation. |
| **Why it matters**    | Reduces clutter and eliminates confusion about the current deployment target (DO droplet via Terraform).                                                                              |
| **Chat pattern**      | Chat has `infra.zip` (52MB) — both repos have dormant artifacts                                                                                                                       |
| **Preserve**          | Take a backup of removed files to `archive/` before deletion                                                                                                                          |
| **Prerequisites**     | None                                                                                                                                                                                  |
| **Test requirements** | None (no code references these files)                                                                                                                                                 |
| **Rollback**          | Restore from archive                                                                                                                                                                  |
| **Adoption style**    | **keep current** (not a Chat adoption; clean up MCT's own stale infra)                                                                                                                |

---

### 5.3 Sequential Migration Numbering Convention (Optional Rename)

| Field                 | Value                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What changes**      | If the team decides to standardize on ISO-date naming, rename existing `5302xxx` migrations to ISO-date format (requires re-creating the migration history). |
| **Why it matters**    | Consistent naming across all migrations. Eliminates the "old convention vs new convention" split.                                                            |
| **Chat pattern**      | ISO-date naming — adapt if needed                                                                                                                            |
| **Preserve**          | Migration order must be preserved. After rename, `supabase migration list` must show the same sequence.                                                      |
| **Prerequisites**     | Phase 1.5 (naming guide doc). A scheduled maintenance window.                                                                                                |
| **Test requirements** | `supabase db push` against a fresh Supabase project — verify all tables/indexes/policies match.                                                              |
| **Rollback**          | Keep the original files with their original names                                                                                                            |
| **Adoption style**    | **adapt conceptually**                                                                                                                                       |

**Recommendation:** Skip this unless naming inconsistency causes real problems. ISO-date naming for NEW migrations (Phase 1.5) is sufficient.

---

## 8. What Must Stay As-Is

The following patterns are **strictly better in MCT** than in Chat. Do not change them:

### Auth Architecture

- **Local JWT verification with rotation** (`apps/api/src/middleware/auth.ts`): ~1ms vs Supabase API call (~50-200ms), key rotation support, Supabase fallback. Chat should adopt this from MCT.
- **Cookie-based auth with explicit security flags** (`HttpOnly`, `Secure`, `SameSite=Lax`): Defense-in-depth for browser sessions.
- **No Supabase client in web**: Auth proxied through API. Chats's approach (Supabase client in browser) is less secure.
- **Server-side PKCE exchange**: Code exchange happens in API `/auth/callback`, not in browser.

### Tenant Isolation

- **`requireOrgAccess()` middleware**: Applied to all 8 entity routers with admin role bypass. Chat's `requireWorkspaceMembership` is similar but lacks the admin bypass pattern.
- **`requireAdmin` single JOIN query**: `SELECT roles!inner(id, key)` — eliminated N+1. Chat still has separate queries.

### Response Format

- **`success()`/`failure()` envelope**: Every response has `{ success: boolean, data?, error? }`. Chat has ad-hoc response shapes.
- **`AppError` with string code**: Simpler than 9 typed subclasses for most use cases. Typed subclasses (Phase 2.1) are additive, not a replacement.

### Operations

- **SSH pipe deploy** (`docker save | gzip | ssh ... docker load`): 5x faster than standard GHCR pull on small droplets. Chat should adopt this.
- **Nonce-based CSP**: Per-request nonces for scripts. Chat uses `'unsafe-inline'`.
- **No-renew cache pattern**: Prevents cache stampede. Chat has no caching at all.

### Worker Architecture

- **Modular worker** (6 extracted modules, 32-line main.ts): Chat's worker is monolithic (73 lines). MCT pattern is strictly better.
- **BullMQ + SQS dual backend**: More deployment flexibility. Chat has BullMQ only.
- **Worker Sentry integration**: Chat's worker lacks Sentry.

### Testing

- **774 tests** with 50% coverage thresholds: Chat has ~19 tests with no thresholds. No changes needed.
- **Storybook + Chromatic**: Chat has no visual regression testing.

### Specific Code Files to Never Touch

| File                                                                   | Reason                                                          |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/src/middleware/auth.ts`                                      | Local JWT verify + rotation logic. Auth flow dependency.        |
| `apps/api/src/middleware/org-access.ts`                                | Primary tenant isolation barrier.                               |
| `apps/api/src/config/env.ts`                                           | Zod env schema for API. Do not move to shared package.          |
| `apps/api/src/services/supabase.ts`                                    | Supabase client factory with circuit breaker.                   |
| `apps/web/middleware.ts`                                               | Domain routing + JWT exp check + CSP nonce. Auth redirect flow. |
| `apps/web/app/(admin)/layout.tsx` + `apps/web/app/(portal)/layout.tsx` | `force-dynamic` prevents prerender errors.                      |
| `infra/digitalocean/docker-compose.yml`                                | Production stack. Do not merge with root-level legacy compose.  |

---

## 9. Recommended Execution Order

### Sprint 1 (~1 day)

| Step | Item                                  | Phase   | Time   | Dependency           |
| ---- | ------------------------------------- | ------- | ------ | -------------------- |
| 1.1  | Add pino redact paths                 | Phase 1 | 5 min  | None                 |
| 1.2  | Copy `date.ts` to `@mct/config`       | Phase 1 | 5 min  | None                 |
| 1.3  | Add idempotency Map size limit        | Phase 1 | 15 min | None                 |
| 1.5  | Update migration naming doc           | Phase 1 | 5 min  | None                 |
| 1.6  | Use `logger.child()` for request ID   | Phase 1 | 15 min | None                 |
| —    | Deploy Phase 1 items                  | —       | —      | All Phase 1 complete |
| 1.4  | Add `activeUsers`/`activeOrgs` gauges | Phase 1 | 15 min | None                 |
| —    | Deploy gauges                         | —       | —      | Done                 |

**Validation gate before Sprint 2:** `pnpm test` (all 774 tests pass), `pnpm lint`, `pnpm typecheck`. Deploy to dev environment. Monitor logs for 1 day to verify redact behavior and gauge output.

### Sprint 2 (~2 days)

| Step | Item                                     | Phase   | Time   | Dependency                                 |
| ---- | ---------------------------------------- | ------- | ------ | ------------------------------------------ |
| 2.1  | Add typed error subclasses               | Phase 2 | 1 hr   | None                                       |
| 2.2  | Switch circuit breaker to Opossum        | Phase 2 | 1.5 hr | None                                       |
| —    | Deploy Phase 2 items                     | —       | —      | Both complete                              |
| 2.3  | Enrich `@mct/config` with logger factory | Phase 2 | 1 hr   | Phase 1.1 (redact config moves to factory) |
| —    | Deploy logger factory                    | —       | —      | Done                                       |

**Validation gate before Sprint 3:** `pnpm test` (all 774 tests pass). Circuit breaker-specific tests pass. Deploy to dev. Manual QA: trigger circuit breaker events (simulate Supabase timeout), verify 503 responses. Run E2E tests.

### Sprint 3 (~1-2 days, coordinated deploy)

| Step | Item                                      | Phase   | Time   | Dependency                    |
| ---- | ----------------------------------------- | ------- | ------ | ----------------------------- |
| 2.4  | Add CSRF middleware                       | Phase 2 | 1 hr   | Frontend coordination         |
| —    | Update frontend to distribute CSRF token  | Phase 2 | 2-4 hr | Backend CSRF middleware ready |
| —    | Deploy CSRF (backend + frontend together) | —       | —      | Both ready                    |

**Validation gate before Sprint 4:**

- Verify all mutation endpoints work in browser (portal + admin login → create ticket → edit profile → delete document)
- Verify SDK-based clients (API keys, external integrations) work WITHOUT CSRF tokens (they use `Authorization: Bearer`)
- Verify CSRF errors for missing/mismatched tokens return 403
- Run full E2E suite

### Sprint 4 (~1 day, as needed)

| Step | Item                               | Phase   | Time | Dependency         |
| ---- | ---------------------------------- | ------- | ---- | ------------------ |
| 3.1  | Cache invalidation audit           | Phase 3 | 2 hr | None               |
| 3.2  | Add cross-origin isolation headers | Phase 3 | 1 hr | CDN resource audit |
| —    | Deploy Phase 3 items               | —       | —    | Both complete      |

**Validation gate:** Verify no cross-origin resource loading errors. Manual QA of portal pages that load external resources (CDN scripts, font CDNs, etc.).

### Future Sprints (As Prioritized)

| Item | Phase                              | Gate    |
| ---- | ---------------------------------- | ------- | --------------------------------------------- |
| 4.1  | Webhook delivery offload to worker | Phase 4 | Webhook volume > 100/min                      |
| 4.2  | Per-request Supabase user client   | Phase 4 | Security audit finding or incident            |
| 5.1  | Migration squash                   | Phase 5 | Slow local migrations                         |
| 5.2  | Dormant infra cleanup              | Phase 5 | Any sprint with downtime                      |
| 5.3  | Full migration rename              | Phase 5 | Only if naming inconsistency causes conflicts |

---

## 10. Minimum Validation Gate Before Each Phase

| Gate                    | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
| ----------------------- | ------- | ------- | ------- | ------- | ------- |
| `pnpm test` passes      | ✅      | ✅      | ✅      | ✅      | ✅      |
| `pnpm lint` passes      | ✅      | ✅      | ✅      | ✅      | ✅      |
| `pnpm typecheck` passes | ✅      | ✅      | ✅      | ✅      | ✅      |
| Deployed to dev         | ✅      | ✅      | —       | —       | —       |
| 24h log monitoring      | ✅      | —       | —       | —       | —       |
| Manual QA on dev        | —       | ✅      | ✅      | ✅      | ✅      |
| E2E tests on dev        | —       | ✅      | ✅      | ✅      | ✅      |
| Production canary       | —       | —       | ✅      | ✅      | —       |
| Security review         | —       | —       | —       | ✅      | —       |

- **Phase 1 → 2:** All Phase 1 items deployed to dev. 24h of production logs reviewed for redact behavior and gauge output.
- **Phase 2 → 3:** All Phase 2 items deployed to dev. Manual QA of circuit breaker behavior (simulated Supabase outage → 503). Full E2E suite passes.
- **Phase 3 → 4:** All Phase 3 items on dev. CDN resource audit for cross-origin headers. Cache invalidation tests pass.
- **Phase 4 → 5:** Strategic decision based on production monitoring data. Phase 4 items are optional.

---

## 11. Rollback Strategy Summary

| Change                      | Rollback Action                             | Time to Rollback |
| --------------------------- | ------------------------------------------- | ---------------- |
| Logger redact               | Remove 5 lines from `logger.ts`             | 2 min            |
| `date.ts`                   | Remove file, revert index.ts export         | 2 min            |
| Map size limit              | Remove size-check block                     | 5 min            |
| Prometheus gauges           | Remove `register.gauge()` calls             | 5 min            |
| Migration naming doc        | Revert doc file                             | 1 min            |
| `logger.child()`            | Remove child() call, revert call sites      | 10 min           |
| Typed error subclasses      | Revert class definitions + error handler    | 15 min           |
| Opossum switch              | Revert `require('opossum')` to custom class | 10 min           |
| Logger factory              | Revert wrapper files to standalone logger   | 10 min           |
| CSRF middleware             | Remove from app.ts                          | 5 min            |
| Cache invalidation          | Revert added invalidation calls             | 10 min           |
| Cross-origin headers        | Remove 3 header lines                       | 3 min            |
| Webhook worker offload      | Revert API to inline delivery               | 30 min           |
| Per-request Supabase client | Revert to service_role-only import          | 30 min           |

All rollbacks are **reversible in under 30 minutes** for Phase 1-3 items. Phase 4 items may require up to 30 minutes due to the number of files touched.

---

## 12. Effort Summary by Persona

| Role                  | Phase 1         | Phase 2                        | Phase 3             | Phase 4 | Total   |
| --------------------- | --------------- | ------------------------------ | ------------------- | ------- | ------- |
| **Backend engineer**  | 45 min          | 3 hrs                          | 3 hrs               | 2 days  | ~3 days |
| **Frontend engineer** | —               | 2-4 hrs (CSRF)                 | —                   | —       | 2-4 hrs |
| **DevOps/SRE**        | 15 min (gauges) | —                              | 1 hr (headers)      | —       | ~1 hr   |
| **QA**                | —               | 2 hrs (circuit breaker + CSRF) | 2 hrs (cache audit) | —       | ~4 hrs  |

**Total engineering time:** ~3 engineering days, spread across 4 sprints.

---

_End of Phase 5 roadmap. All items are cross-referenced against Phase 1-4 findings, risk assessments, and do-not-break guardrails._
