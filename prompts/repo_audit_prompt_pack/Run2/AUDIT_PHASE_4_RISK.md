# Phase 4 — Risk, Stability & "Do Not Break" Analysis

**Date:** 2026-07-02  
**Audit Run:** Run2  
**Reference Repo (Chat):** `C:\temp\chat`  
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`

---

## Security Posture Comparison

### 1. Auth Flows

| Dimension              | MCT Portal                                                                         | Chat Platform                                                         | Verdict                                                             |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| JWT verification       | Local `jsonwebtoken.verify()` + Supabase `getUser()` fallback                      | `supabase.auth.getUser(token)` per request (REST API call, ~50-200ms) | **MCT stronger**                                                    |
| Key rotation           | Comma-separated `JWT_SECRET` — iterate all secrets, fall through                   | Single key, no rotation support                                       | **MCT stronger**                                                    |
| Session cookie         | Custom `mct_session` with explicit `HttpOnly`, `Secure`, `SameSite=Lax`            | Supabase default cookie, no explicit flags                            | **MCT stronger**                                                    |
| Cookie auth            | Web forwards cookie to API `/auth/callback` — Supabase client removed from web     | Web uses `@supabase/supabase-js` directly in browser                  | **MCT stronger**                                                    |
| PKCE exchange          | Happens server-side in API callback                                                | Happens client-side in web                                            | **MCT stronger**                                                    |
| Per-request RLS client | Uses service_role admin client everywhere, relies on `requireOrgAccess` middleware | Creates `getSupabaseForUser(jwt)` per request for RLS-aware queries   | **Chat stronger** (defense in depth — RLS at DB level + middleware) |
| CSRF protection        | None — relies on CORS + SameSite                                                   | Double-submit cookie pattern + origin/referer check                   | **Chat stronger**                                                   |

**Summary:** MCT is stronger in 5/7 auth dimensions. The single material gap is CSRF protection and the loss of per-request RLS via the service_role client. The service_role bypass is acknowledged in AGENTS.md as "by-design — mitigated by requireOrgAccess," but it means RLS cannot be a secondary defense layer.

**Classification: MCT stronger overall, but with a known gap (CSRF) and a design trade-off (service_role usage).**

---

### 2. Secrets Management

| Dimension            | MCT Portal                                                                          | Chat Platform                                                           | Verdict                            |
| -------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| Env schema location  | `apps/api/src/config/env.ts` — per-app Zod schema                                   | `packages/config/env-schema.ts` — shared base schema + per-app extend   | **Different approaches**           |
| Schema validation    | `safeParse` with `process.exit(1)` on failure, singleton pattern                    | `parse` (throws) with `loadEnv()` wrapper, singleton                    | **Equivalent**                     |
| Required vars        | 6 required (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET) | 3 required (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) | **Chat simpler, MCT more secure**  |
| Optional var count   | 11 optional (Stripe, JSM, Teams, SMTP, Sentry, Redis)                               | 10 optional (Redis, Sentry, SMTP, VAPID, upload config)                 | **Equivalent**                     |
| Logger redact        | **None** — secrets can leak into logs                                               | Redact paths for password, secret, token, authorization, cookies        | **Chat stronger**                  |
| .env.example hygiene | Contains worker-only vars (JIRA*\*, M365*\*) that aren't in API schema              | Focused on actual schema vars                                           | **Chat stronger** (less confusing) |
| App secrets in CI    | GH Actions secrets, SSH heredoc for .env on droplet                                 | GH Actions secrets                                                      | **Equivalent**                     |

**Summary:** Chat's logger redact is a security feature MCT is missing. MCT's `.env.example` has misleading entries. MCT requires `JWT_SECRET` (required in schema) which is good for security but adds setup burden.

**Classification: Chat stronger in operational secrets hygiene; Equivalent in schema rigor.**

---

### 3. HTTP Security Headers

| Header                 | MCT API                                                       | MCT Web                                   | Chat API                                                         | Verdict                              |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| CSP                    | Nonce-based for Swagger UI; `default-src 'self'` for all else | Nonce-based per-request (`middleware.ts`) | Hardcoded static CSP, no nonce, `'unsafe-inline'` on styles      | **MCT stronger** (nonce-based)       |
| HSTS                   | `max-age=63072000; includeSubDomains; preload` (2 years)      | Set via middleware                        | `max-age=31536000; includeSubDomains; preload` (1 year)          | **MCT stronger** (longer 2yr vs 1yr) |
| X-Frame-Options        | `DENY`                                                        | Set via middleware                        | `DENY`                                                           | **Equivalent**                       |
| X-Content-Type-Options | `nosniff`                                                     | Set via middleware                        | `nosniff`                                                        | **Equivalent**                       |
| X-XSS-Protection       | `1; mode=block`                                               | Set via middleware                        | `1; mode=block`                                                  | **Equivalent**                       |
| Referrer-Policy        | `strict-origin-when-cross-origin`                             | Set via middleware                        | `strict-origin-when-cross-origin`                                | **Equivalent**                       |
| Permissions-Policy     | `camera=(), microphone=(), geolocation=()`                    | Set via middleware                        | `camera=(), microphone=(), geolocation=()`                       | **Equivalent**                       |
| Cross-Origin headers   | **Not set**                                                   | Not set                                   | COEP: `credentialless`, COOP: `same-origin`, CORP: `same-origin` | **Chat stronger**                    |
| X-DNS-Prefetch-Control | `off`                                                         | Set via middleware                        | `off`                                                            | **Equivalent**                       |
| X-Powered-By removal   | Yes                                                           | N/A (Next.js)                             | Yes                                                              | **Equivalent**                       |

**Summary:** MCT leads with nonce-based CSP (critical for XSS prevention). Chat leads with Cross-Origin Isolation headers (COEP/COOP/CORP) which protect against Spectre-type attacks.

**Classification: MCT stronger for CSP; Chat stronger for COOP/COEP/CORP; Equivalent for all else.**

---

### 4. Input Validation (Zod Schema Coverage)

| Dimension             | MCT Portal                                                       | Chat Platform                                         | Verdict                                                       |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Mutation endpoints    | ~27 total — all Zod-validated                                    | 13 domain modules — validation in service files       | **MCT stronger** (confirmed audit: "Zod validation complete") |
| Validator location    | 5 dedicated validator files (`validators/*.ts`) + inline schemas | `config/validators.ts` — single file                  | **Equivalent**                                                |
| Per-endpoint coverage | 100% of mutation endpoints                                       | Estimated ~70% (some endpoints use manual validation) | **MCT stronger**                                              |
| Schema reuse          | Deduplicated via validator modules                               | Reused via shared validator functions                 | **Equivalent**                                                |
| UUID validation       | Not enforced in Zod (relaxed for test compatibility)             | Per-middleware UUID validation in some routes         | **Chat stronger** (stricter type enforcement)                 |

**Summary:** MCT has confirmed 100% Zod coverage on mutation endpoints. Chat's coverage is unclear but Phase 1 showed manual validation patterns. MCT's relaxed UUID validation is a minor gap (test compatibility commitment).

**Classification: MCT stronger overall.**

---

### 5. Rate Limiting

| Dimension                | MCT Portal                                                                                     | Chat Platform                                | Verdict                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Global limiter           | `rateLimitByUser`: 200/15min (IP-based for unauthenticated, user-token-hash for authenticated) | `apiLimiter`: 100/1min (global)              | **MCT stronger** (larger window, per-user keys)           |
| Auth limiter             | `rateLimitAuth`: 10/15min (IP-based)                                                           | `authLimiter`: 20/1min (composite IP+userId) | **Chat stronger** (per-user tracking after auth)          |
| Search limiter           | None                                                                                           | `searchLimiter`: 30/1min (composite key)     | **Chat stronger**                                         |
| Health/doc bypass        | Yes (skips: /health, /docs, /openapi.json, localhost)                                          | Not applicable                               | **MCT stronger** (avoids rate-limiting infra endpoints)   |
| Auth endpoint protection | Rate-limited as part of global; separate auth rate limit exists                                | Separate auth limiter with composite key     | **Chat stronger** (composite key tracks both IP and user) |
| Rate limit tiers         | 2 tiers (general + auth)                                                                       | 3 tiers (general + auth + search)            | **Chat stronger** (more granular)                         |

**Summary:** MCT has better per-user tracking for general rate limiting (using truncated token as key). Chat has better auth rate limiting (composite key tracks user+IP) and a dedicated search limiter.

**Classification: MCT stronger for general rate limiting; Chat stronger for auth and granularity.**

---

### 6. Dependency Vulnerabilities

| Dimension                  | MCT Portal                                                                                                     | Chat Platform                                                      | Verdict                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Dependabot grouped updates | Yes (sentry, typescript-eslint, testing, aws-sdk groups)                                                       | Yes (minor-patch group only)                                       | **MCT stronger** (more granular grouping)                                 |
| Dependabot schedule        | Weekly, Monday                                                                                                 | Weekly                                                             | **Equivalent**                                                            |
| GHA dependency monitoring  | Yes                                                                                                            | Yes                                                                | **Equivalent**                                                            |
| Lockfile                   | pnpm-lock.yaml (frozen install)                                                                                | pnpm-lock.yaml                                                     | **Equivalent**                                                            |
| Dependency count (API)     | ~30 direct deps (Express, pino, Zod, jsonwebtoken, ioredis, stripe, opossum? — actually custom CB, no opossum) | ~30 direct deps (Express, pino, Zod, opossum, Socket.io, @livekit) | **Equivalent** (but Chat has Socket.io + LiveKit = larger attack surface) |
| npm audit / CI scanning    | Not in CI (no explicit `pnpm audit` step)                                                                      | Not in CI                                                          | **Both missing**                                                          |
| OSV/Dependabot alerts      | Via Dependabot PRs                                                                                             | Via Dependabot PRs                                                 | **Equivalent**                                                            |

**Summary:** Both have Dependabot configured. Neither has explicit `pnpm audit` in CI. MCT's grouped updates are slightly better organized.

**Classification: Equivalent, with minor edge to MCT for grouped update configuration.**

---

### 7. Database Access (RLS + Tenant Isolation)

| Dimension                   | MCT Portal                                                                                                    | Chat Platform                                                                                                       | Verdict                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| RLS management              | Inline in migrations (22 files)                                                                               | Separate `policies/` directory (11 files)                                                                           | **Different — MCT: atomic, Chat: auditable**                              |
| RLS coverage                | All entity tables have RLS                                                                                    | All entity tables have RLS                                                                                          | **Equivalent**                                                            |
| Service role key usage      | Used for ALL operations (bypasses RLS). Tenant isolation enforced at middleware level (`requireOrgAccess`)    | Used for admin operations only. User operations go through per-request `getSupabaseForUser(jwt)` which enforces RLS | **Chat stronger** (RLS provides secondary defense layer)                  |
| Tenant isolation middleware | `requireOrgAccess`: checks membership table for org access, with admin bypass for `admin`/`super_admin` roles | `requireWorkspaceMembership`: checks workspace membership table                                                     | **MCT stronger** (admin bypass logic is explicit)                         |
| User context in DB          | None — all queries run as service_role                                                                        | `auth.uid()` is available via user's JWT in RLS policies                                                            | **Chat stronger** (RLS can filter by user identity)                       |
| Row-level filtering         | Application-level via middleware and query filters                                                            | RLS-level via supabase client with user JWT                                                                         | **Chat stronger** (cannot bypass RLS even if middleware is misconfigured) |

**Summary:** This is the most significant architectural difference. MCT's service_role client bypasses RLS entirely — tenant isolation is purely application-level. Chat uses per-request user-scoped clients so RLS acts as a secondary defense. If MCT's `requireOrgAccess` has a bug, there is no DB-level safety net.

**Classification: Chat stronger (defense in depth). MCT's approach is acknowledged as by-design but represents a genuine risk.**

---

### 8. Audit Logging

| Dimension         | MCT Portal                                                                      | Chat Platform                                                     | Verdict                                               |
| ----------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Mutation coverage | 27/27 mutation endpoints log audit events                                       | All mutation endpoints (inferred from service pattern)            | **MCT stronger** (verified complete)                  |
| Retry strategy    | Inline: exponential backoff (100ms × 2^attempt), max 3 retries, drop on failure | In-memory queue: unbounded array, retries every 5s, max 3 retries | **MCT stronger** (no unbounded queue, no memory leak) |
| PII exposure      | `actor_user_id`, `entity_id`, `metadata` — generic, no PII fields in schema     | Same pattern — `actor_user_id`, `entity_id`, `metadata`           | **Equivalent**                                        |
| Viewer            | Dedicated `GET /api/v1/audit` endpoint with pagination + filters                | None — no audit viewer endpoint                                   | **MCT stronger**                                      |
| Export            | CSV/JSON export via `GET /api/v1/audit/export`                                  | None                                                              | **MCT stronger**                                      |
| Retention policy  | No explicit retention (depends on Supabase project settings)                    | No explicit retention                                             | **Equivalent** (both missing)                         |

**Summary:** MCT has superior audit infrastructure — complete mutation coverage, leak-free retry strategy, and a viewer with export. Chat's unbounded in-memory queue is a material stability risk.

**Classification: MCT significantly stronger.**

---

### 9. Error Handling

| Dimension                   | MCT Portal                                                              | Chat Platform                                                         | Verdict                                                    |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Error envelope              | `{ success: boolean, data?, error? }` — consistent across all endpoints | Ad-hoc `{ error: { code, message } }` — no standard envelope          | **MCT stronger**                                           |
| Error hierarchy             | Single `AppError` class with string code parameter                      | 9 typed error subclasses (NotFoundError, etc.) + `toProblemDetails()` | **Chat stronger** (typed errors enable filter/catch logic) |
| RFC 7807 ProblemDetails     | No                                                                      | Yes (via `toProblemDetails()`)                                        | **Chat stronger**                                          |
| Stack traces in production  | Filtered by global error handler; no explicit check but uses `AppError` | Filtered; `NODE_ENV === "development"` check                          | **Equivalent**                                             |
| Sentry integration          | API + Web + Worker (initialized in each)                                | API + Web + Worker (via config package)                               | **Equivalent**                                             |
| Unhandled rejection handler | Yes (added in pre-prod audit)                                           | Not verified                                                          | **MCT stronger** (documented in AGENTS.md)                 |
| Structured error responses  | `success()`/`failure()` helpers ensure consistent shape                 | Ad-hoc `res.status().json()` calls                                    | **MCT stronger**                                           |
| Logging integration         | `logger.error()` in error middleware; pino with no redact               | `logger.error()` in error middleware; pino with redact                | **Chat stronger** (redact prevents secret leakage)         |

**Summary:** MCT's response envelope is cleaner for clients. Chat's error hierarchy is better for server-side filtering. Chat has ProblemDetails (emerging standard). MCT has `unhandledRejection` handling (operational resilience). Both have Sentry.

**Classification: MCT stronger for API response consistency; Chat stronger for internal error handling.**

---

### Security Posture Overall Classification

| Dimension                  | Classification                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Auth flows                 | **MCT stronger** (local JWT verify, rotation, cookie flags, server-side PKCE)                 |
| Secrets management         | **Chat stronger** (logger redact, cleaner .env.example)                                       |
| HTTP security headers      | **Split** — MCT stronger for CSP (nonce); Chat stronger for cross-origin isolation            |
| Input validation           | **MCT stronger** (100% Zod coverage on mutations)                                             |
| Rate limiting              | **Split** — MCT stronger for general; Chat stronger for auth granularity                      |
| Dependency vulnerabilities | **Equivalent** (both have Dependabot, both lack `pnpm audit` in CI)                           |
| Database access            | **Chat stronger** (per-request RLS via user JWT; MCT's service_role bypasses RLS)             |
| Audit logging              | **MCT significantly stronger** (complete coverage, no memory leak, viewer, export)            |
| Error handling             | **Mixed** — MCT stronger for response consistency, Chat stronger for internal error hierarchy |

**Overall: MCT leads in 4 dimensions (auth, input validation, audit logging, response consistency). Chat leads in 2 (secrets management, database access). Equivalent in 1 (deps). Split in 2 (rate limiting, security headers).**

---

## 1. High-Risk Areas

### HR-1: Service-Role Key Bypasses RLS (Security Architecture Risk)

- **Risk Level:** High
- **Blast Radius:** System-wide (all data access)
- **Dependency Chain:** `services/supabase.ts` → all 25 route files → all DB queries
- **Migration Complexity:** High (would require per-request user-scoped Supabase clients)
- **Rollback Difficulty:** Moderate (reverting to service_role is trivial; the damage is in the migration effort)
- **Likelihood of Regression:** High (27 route files would need individual rewrites)
- **Tests Needed First:** Every route's `requireOrgAccess` test — verify middleware correctly rejects cross-org access
- **Visual/Manual QA:** Not applicable (no UI changes)
- **Environment Parity Matters:** Yes — the risk is identical in dev, test, and prod
- **Deployment Behavior Change:** Yes — introducing per-request clients changes error handling and connection pool behavior
- **Auth/Routing/Data/API Impact:** API contracts unchanged, but error responses could differ (RLS errors are different from middleware errors)
- **Verdict:** Risk accepted as by-design, but trust in `requireOrgAccess` as single barrier is a material concern. Any bug in the middleware exposes all orgs' data.

### HR-2: Circuit Breaker Timeout Not Enforced (Verified Bug)

- **Risk Level:** High
- **Blast Radius:** Isolated to `CircuitBreaker.execute()` — only affects code that calls it directly
- **Dependency Chain:** `circuit-breaker.ts:63-76` → potential hangs in Supabase calls, Stripe, JSM, Teams, Geo
- **Migration Complexity:** Low (switch to Opossum: 30 min)
- **Rollback Difficulty:** Easy (revert the import change)
- **Likelihood of Regression:** Low (Opossum is battle-tested, stable API)
- **Tests Needed First:** Existing circuit breaker tests should pass. New tests for timeout enforcement.
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** Yes — if Opossum has different state machine semantics, circuit-open behavior could differ slightly
- **Auth/Routing/Data/API Impact:** None — internal behavior only

### HR-3: No Logger Redact Configuration (Secret Leakage Risk)

- **Risk Level:** High
- **Blast Radius:** System-wide — any log line that includes request headers, cookies, or error context with sensitive data
- **Dependency Chain:** `logger.ts` → all 25 route files, all middleware, all services
- **Migration Complexity:** Low (5 lines added to logger config)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low (configuration change, no logic change)
- **Tests Needed First:** None (no behavior change for non-sensitive data)
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No
- **Auth/Routing/Data/API Impact:** None — purely log hygiene

### HR-4: In-Memory Fallback Maps Are Unbounded (Memory Leak Risk)

- **Risk Level:** Medium-High (degrades to High if Redis is unreliable)
- **Blast Radius:** Isolated to `idempotency.ts` (MCT) — Map can grow without bound under sustained Redis failures
- **Dependency Chain:** `idempotency.ts` → webhook receivers, Stripe, Jira, JSM, M365 handlers
- **Migration Complexity:** Low (add size check, evict oldest entries when > 10,000)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** Unit test for Map eviction behavior
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No
- **Auth/Routing/Data/API Impact:** None — idempotency keys would be evicted earlier under sustained Redis failure, could cause duplicate webhook processing (already handled by idempotency dedup in handlers)

### HR-5: CSRF Protection Gap (Cookie-Based Auth Without CSRF Token)

- **Risk Level:** Medium-High
- **Blast Radius:** All mutation endpoints that accept cookie-based auth
- **Dependency Chain:** Not implemented — missing component
- **Migration Complexity:** Low-Medium (add CSRF middleware + distribute CSRF token to client, ~30-60 min)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low (new middleware, isolated)
- **Tests Needed First:** CSRF middleware unit tests + integration test verifying cookie+header match
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** Yes — new 403 error responses for missing/invalid CSRF tokens
- **Auth/Routing/Data/API Impact:** Yes — all mutation requests from browser must now include `x-csrf-token` header. SDK clients (which use `Authorization: Bearer` header exclusively) are unaffected. Browser-only impact.
- **Current Mitigation:** `SameSite=Lax` cookie flag covers most CSRF for state-changing requests (top-level navigation only). Does NOT cover:
  - Cross-site `POST` via `<form>` submission (e.g., phishing page that auto-submits a form to the MCT API)
  - Cross-site `GET` requests (if any mutation endpoints accept `GET` via query params)
  - Subdomain attacks (if an attacker controls a subdomain)

---

## 2. Medium-Risk Areas

### MR-1: Sequential Migration Numbering (Team Workflow Risk)

- **Risk Level:** Medium
- **Blast Radius:** Isolated to `supabase/migrations/` directory
- **Migration Complexity:** Low (adopt ISO-date naming for future migrations only)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low (no existing migrations renamed; only new files use new naming)
- **Tests Needed First:** None (file naming only)
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No
- **Auth/Routing/Data/API Impact:** None

### MR-2: Cache Invalidation Completeness Unknown

- **Risk Level:** Medium
- **Blast Radius:** Isolated per cache scope (orgs list, docs list, projects list, roles list)
- **Dependency Chain:** `cache.ts` → `invalidateCache()` call sites in route files
- **Migration Complexity:** Medium (audit all cache.set call sites vs all mutation endpoints; add invalidation calls where missing)
- **Rollback Difficulty:** Easy (removing an invalidation call)
- **Likelihood of Regression:** Medium (stale data visible if invalidation is missing)
- **Tests Needed First:** Integration test: set a cache entry, mutate the underlying data, verify cache is invalidated
- **Visual/Manual QA:** Yes — verify cached pages show fresh data after mutation
- **Environment Parity Matters:** Yes — Redis vs in-memory cache behavior could differ
- **Deployment Behavior Change:** No (caching is transparent to clients)
- **Auth/Routing/Data/API Impact:** Data staleness only — no contract changes

### MR-3: No Active-User/Org Prometheus Gauges (Observability Gap)

- **Risk Level:** Medium
- **Blast Radius:** Isolated to `metrics.ts`
- **Migration Complexity:** Low (~10 lines per gauge)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** None (metrics are write-only)
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No
- **Auth/Routing/Data/API Impact:** None

### MR-4: Env Schema Exit on Failure Is Brute Force

- **Risk Level:** Medium
- **Blast Radius:** System-wide (process exits if env vars are wrong)
- **Dependency Chain:** `config/env.ts:43-47` → `process.exit(1)` on validation failure
- **Migration Complexity:** Low
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** None
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** Yes — env var values differ between dev and prod
- **Deployment Behavior Change:** Yes — if optional env vars had wrong defaults, new defaults could change behavior
- **Verdict:** Current behavior is intentional (fail fast) — but `console.error` before exit bypasses pino. Change: use `logger.fatal()` before `process.exit(1)`.

### MR-5: Webhook Delivery Not Offloaded to Worker

- **Risk Level:** Medium
- **Blast Radius:** Isolated to `routes/webhook-management.ts` (outbound webhook delivery)
- **Dependency Chain:** Webhook management route → `HttpClient.fetch()` → slow external endpoint
- **Migration Complexity:** High (would require adding BullMQ queue + consumer for outbound webhooks)
- **Rollback Difficulty:** Moderate
- **Likelihood of Regression:** Medium
- **Tests Needed First:** Unit tests for webhook queue consumer
- **Visual/Manual QA:** Yes — verify webhook delivery completes through the worker
- **Environment Parity Matters:** Yes — queue must be configured in dev and prod
- **Deployment Behavior Change:** Yes — webhook delivery moves from API request thread to background worker
- **Current Risk:** Low — webhook delivery is on user action, not high volume. If volume exceeds 100/min, this becomes a material risk.

---

## 3. Low-Risk Areas

### LR-1: Enrich `@mct/config` with Error Types + Logger Factory

- **Risk Level:** Low
- **Blast Radius:** Isolated to `@mct/config` package + import paths in API and worker
- **Migration Complexity:** Medium (1 hour, requires updating import paths)
- **Rollback Difficulty:** Easy (revert import changes)
- **Likelihood of Regression:** Low
- **Tests Needed First:** Import tests in API and worker
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No
- **Verdict:** Safe improvement, but low priority — current per-app approach works correctly

### LR-2: Copy `date.ts` to `@mct/config`

- **Risk Level:** Low
- **Blast Radius:** Isolated to `@mct/config` + new imports
- **Migration Complexity:** Low (5 minutes)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** None (pure functions, trivially correct)
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No

### LR-3: Add `activeUsers`/`activeOrgs` Gauges

- **Risk Level:** Low
- **Blast Radius:** Isolated to `metrics.ts`
- **Migration Complexity:** Low (15 minutes)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** None
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No

### LR-4: Add Typed Error Subclasses

- **Risk Level:** Low
- **Blast Radius:** Isolated to `types/index.ts` and `middleware/error.ts`
- **Migration Complexity:** Medium (1 hour)
- **Rollback Difficulty:** Easy (revert class definition)
- **Likelihood of Regression:** Low-Medium (error handler must be updated to catch typed subclasses before generic `AppError`)
- **Tests Needed First:** Error handler tests (existing tests should continue to pass if subclasses extend `AppError`)
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No — error response format unchanged
- **Verdict:** Pure additive change; no risk to existing code paths

### LR-5: Use `logger.child()` for Request ID Injection

- **Risk Level:** Low
- **Blast Radius:** Isolated to `middleware/request-id.ts` and individual log calls
- **Migration Complexity:** Low (15 minutes)
- **Rollback Difficulty:** Easy
- **Likelihood of Regression:** Low
- **Tests Needed First:** None
- **Visual/Manual QA:** Not needed
- **Environment Parity Matters:** No
- **Deployment Behavior Change:** No

---

## 4. Changes That Need Tests First

| Change                              | Required Tests                                                                                                             | Existing Coverage                                                       | Risk if Skipped                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Switch to Opossum**               | Circuit breaker functional tests (open-close-halfopen cycle, timeout enforcement, stats, shutdown)                         | 0 CB tests in MCT                                                       | Medium — behavioral differences between custom and Opossum could cause unexpected circuit-open behavior |
| **Add CSRF middleware**             | Unit: token generation, parsing, validation, timing-safe comparison. Integration: full request lifecycle with 403 response | 0 CSRF tests                                                            | High — incorrectly implemented CSRF would block all mutations from browser clients                      |
| **Fix idempotency Map size limit**  | Unit: Map eviction on size limit, TTL-based eviction                                                                       | 0 idempotency tests                                                     | Low-Medium — edge case only triggered under sustained Redis failure                                     |
| **Enrich `@mct/config`**            | Import resolution tests in API and worker                                                                                  | 0 config package tests                                                  | Low — import resolution failures are caught by TypeScript/Node at startup                               |
| **Add logger redact**               | None needed                                                                                                                | N/A                                                                     | None — configuration only                                                                               |
| **Add typed error subclasses**      | Unit: each subclass serializes correctly. Integration: error handler catches subclasses in correct order                   | N/A (new code)                                                          | Low — existing tests cover the error handler                                                            |
| **Cache invalidation audit**        | Integration: set + mutate + verify stale data cleared                                                                      | Cache test file exists (`cache.test.ts`) but may not cover invalidation | Medium — stale data visible to users                                                                    |
| **Adopt ISO-date migration naming** | None needed                                                                                                                | N/A                                                                     | None — file naming only                                                                                 |

---

## 5. Changes That Need Manual QA / Visual QA

| Change                                 | QA Type         | What to Verify                                                                                                                      |
| -------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **CSRF middleware**                    | Manual          | Browser-based login → portal navigation → mutation (create ticket, update profile) — all must succeed with CSRF header present      |
| **Cache invalidation audit**           | Visual + Manual | Admin org list: create an org → verify it appears immediately (not from stale cache). Edit an org → verify changes appear           |
| **Webhook delivery offload** (if done) | Manual          | Create webhook endpoint → trigger delivery → verify webhook target receives payload. Check worker logs for queue processing         |
| **Opossum circuit breaker**            | Manual          | Simulate Supabase outage → verify API returns 503 instead of hanging. Restore Supabase → verify requests succeed after resetTimeout |

---

## 6. Changes That Could Affect Deployment or Environment Semantics

| Change                       | Deployment Risk                                                                                                                                                                   | Mitigation                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Switch to Opossum**        | Package dependency added (`opossum`). If npm registry is unavailable during build, image build fails                                                                              | Single build-time dependency; pin version in `package.json`                                                        |
| **Add CSRF middleware**      | New ENV var not needed, but client must send CSRF token. Existing SDK-based clients (not browser) are unaffected. Browser clients will get 403s until frontend distributes token. | Ship frontend CSRF token distribution and middleware in same deploy. Verify SDK-only clients work without headers. |
| **Enrich `@mct/config`**     | No env/dependency change                                                                                                                                                          | N/A                                                                                                                |
| **Cache invalidation fixes** | No env change                                                                                                                                                                     | N/A                                                                                                                |
| **Logger redact**            | No env change                                                                                                                                                                     | N/A                                                                                                                |
| **Idempotency Map fix**      | No env change                                                                                                                                                                     | N/A                                                                                                                |
| **ISO-date migrations**      | No env change (future migrations only)                                                                                                                                            | N/A                                                                                                                |
| **Worker webhook offload**   | New BullMQ queue configuration. Requires worker to be deployed before API starts producing webhook jobs.                                                                          | Coordination deploy: worker first, then API.                                                                       |

---

## 7. Do-Not-Break Guardrails

### Auth & Session Management

- **DO NOT** change how `mct_session` cookie is parsed or validated in `middleware.ts` (domain routing + JWT exp check). Auth redirect flow for unauthenticated users depends on this behavior.
- **DO NOT** remove `requireOrgAccess()` from any entity route without adding equivalent tenant isolation.
- **DO NOT** reintroduce Supabase client in the web package. The current architecture (auth proxied through API) is deliberate and secure.

### RBAC / Tenancy Boundaries

- **DO NOT** change `requireOrgAccess` admin bypass logic (`admin`/`super_admin` keys on line 34). It is referenced by all 8 entity routers.
- **DO NOT** change the `memberships` table query to use a non-admin Supabase client — the admin bypass requires service_role.
- **DO NOT** flatten the `roles!inner()` JOIN in `auth.ts:requireAdmin` — it's a critical performance fix that eliminated an N+1 query.

### Route Structure & API Contracts

- **DO NOT** change the `/api/v1/` prefix structure. Both SDK and middleware are wired to this prefix.
- **DO NOT** change the `{ success, data?, error? }` response envelope without simultaneously updating the SDK. All 108 SDK tests depend on this shape.
- **DO NOT** change parameter names that the SDK passes (e.g., `organizationId` vs `organization_id`). The SDK sends `organizationId`, the API expects it in body/query.
- **DO NOT** remove any of the 86 API endpoints documented in `docs/API_ENDPOINT_INVENTORY.md` without updating docs.

### Env Var Contracts

- **DO NOT** rename or remove an env var that has no default (e.g., `SUPABASE_URL`, `JWT_SECRET`). This would crash the API on startup.
- **DO NOT** change the comma-separated `JWT_SECRET` parsing in `auth.ts:20-26`. Rotation depends on this format.
- **DO NOT** remove optional env vars without adding defaults (e.g., `STRIPE_SECRET_KEY` defaults to undefined — code must check before using).

### Database / Data Assumptions

- **DO NOT** rename `audit_logs` table columns (`organization_id`, `actor_user_id`, `actor_type`, `action`, `entity_type`, `entity_id`, `metadata`). All 27 mutation endpoints depend on these exact column names.
- **DO NOT** change the `memberships` table schema without updating `checkOrgAccess()` in `org-access.ts:13-42`.
- **DO NOT** change the `5302xxx` migration numbering for existing files. Renaming them breaks `supabase migration list` history.

### CI/CD Assumptions

- **DO NOT** change the `corepack enable && corepack prepare pnpm@10 --activate` pattern in CI workflows. The `pnpm/action-setup` + `cache: pnpm` pattern is known broken.
- **DO NOT** remove the `prod-approval` environment gate from `deploy-do.yml`.
- **DO NOT** change the SHA-based image tagging to `:latest`. All workflows depend on SHA tags for reproducibility.
- **DO NOT** remove the `/validate` workflow call from deploy workflows — it fans out to test + lint + typecheck.

### UI Layouts Users Rely On

- **DO NOT** remove `force-dynamic` from admin/portal layouts. Without it, `next build` throws prerender errors for authenticated pages.
- **DO NOT** change domain routing logic (`app.*` → portal, `www.*` → marketing) without updating the Caddyfile.
- **DO NOT** remove the `mct_session` cookie from the logout action — it is what breaks the auth redirect loop on `/pending`.

### Shared Utility Refactors

- **DO NOT** move `getEnv()` out of `apps/api/src/config/env.ts` into a shared package without leaving a re-export alias. Multiple files import from the current path.
- **DO NOT** restructure `apps/api/src/routes/` directory — 25 route files are individually imported in `app.ts` by their current paths.
- **DO NOT** rename `apps/api/src/services/` — both `audit.ts` and `supabase.ts` are imported by 20+ route files.

---

## 8. Safe Areas for Early Improvement

These changes carry **low or zero risk of regression** and can be implemented immediately:

| Priority | Change                                                                     | Effort    | Phase 3 Priority | Notes                                                                                   |
| -------- | -------------------------------------------------------------------------- | --------- | ---------------- | --------------------------------------------------------------------------------------- |
| **P0**   | Add pino redact paths to logger                                            | 5 min     | P0               | Chat's redact config: copy verbatim. No behavior change for non-sensitive data          |
| **P0**   | Fix circuit breaker timeout gap (switch to Opossum or add AbortController) | 30 min    | P0               | Only affects code that calls `circuitBreaker.execute()` directly. Add tests             |
| **P1**   | Add idempotency in-memory Map size limit                                   | 15 min    | P1               | Add eviction at 10,000 entries. Low risk — only matters during sustained Redis failure  |
| **P1**   | Copy `date.ts` from Chat to `@mct/config`                                  | 5 min     | P1               | Pure additive — zero risk to existing code                                              |
| **P1**   | Add CSRF middleware                                                        | 30-60 min | P1               | Requires frontend token distribution. **Medium risk** — coordinate with frontend deploy |
| **P2**   | Add `activeUsers`/`activeOrgs` Prometheus gauges                           | 15 min    | P2               | Write-only metrics. Zero behavior change                                                |
| **P2**   | Update migration naming convention doc                                     | 5 min     | P2               | Documentation only                                                                      |
| **P3**   | Add typed error subclasses                                                 | 1 hour    | P3               | Extends `AppError` — existing catch blocks still catch it. Safe additive change         |
| **P3**   | Use `logger.child()` for request ID                                        | 15 min    | P3               | Pure scaffolding — pino child loggers are well-tested                                   |

### Recommendation: Immediate Action Items

1. **P0: Logger redact** — 5-minute fix that closes a real secret-leakage vector. No tests, no risks, no deploy coordination. **Do this first.**
2. **P0: Circuit breaker** — Fix either by switching to Opossum (recommended) or by adding AbortController to `execute()`. The bug is verified. ~30 min.
3. **P1: Idempotency Map limit** — 15-minute memory leak fix. Low risk, quick win.
4. **P1: `date.ts`** — 5 minutes to add a utility module that eliminates duplicated date logic across 25+ routes.
5. **P1: CSRF** — Important but requires medium effort and frontend coordination. Schedule for the next sprint rather than hotfix.

### Action Items to Defer

- **Enrich `@mct/config` with logger factory + errors** — Safe but takes ~1 hour and provides moderate value. Schedule after CSRF.
- **Typed error subclasses** — Pure additive, zero risk, but low urgency. The current `AppError` + `string` code works correctly.
- **Cache invalidation audit** — Medium urgency. Current behavior seems correct (AGENTS.md documents invalidation), but audit would confirm.

---

_End of Phase 4 analysis. Cross-referenced against Phase 1-3 findings, source code verification of both repos, and security posture comparison across 9 dimensions._
