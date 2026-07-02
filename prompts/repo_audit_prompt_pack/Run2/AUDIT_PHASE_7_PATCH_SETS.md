# Phase 7 — Patch Set Design for Safe Implementation

**Date:** 2026-07-02
**Audit Run:** Run2
**Reference Repo (Chat):** `C:\temp\chat`
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`

---

## Table of Contents

1. Patch Set 1: No-Risk Cleanup / Organization / Docs
2. Patch Set 2: Low-Risk Shared Utility & Component Alignment
3. Patch Set 3: Low-Risk UI Consistency Improvements
4. Patch Set 4: Medium-Risk Internal Refactors with Tests
5. Patch Set 5: Optional Strategic Convergence Work
6. Top 20 Prioritized Recommendations
7. Quick Wins List
8. Needs-Tests-First List
9. Copy-from-Reference List
10. Adapt-Don't-Copy List
11. Leave-Alone List
12. Best Order of Execution

---

## Patch Set 1: No-Risk Cleanup / Organization / Docs

### Objective

Address verified safety gaps (secret leakage in logs, idempotency memory leak), add a zero-risk shared utility (date library), and fix documentation drift. These are pure additions/config changes — no behavior changes for existing code paths.

### Exact Areas Likely Touched

| File                               | Action                                                       | Lines     |
| ---------------------------------- | ------------------------------------------------------------ | --------- |
| `apps/api/src/lib/logger.ts`       | EDIT — add pino redact paths                                 | ~5 lines  |
| `apps/worker/src/logger.ts`        | EDIT — add pino redact paths                                 | ~5 lines  |
| `apps/api/src/lib/idempotency.ts`  | EDIT — add Map eviction when >10,000 entries                 | ~10 lines |
| `packages/config/src/date.ts`      | CREATE — 72-line file, 12 pure date utilities                | 72 lines  |
| `packages/config/index.ts`         | CREATE — barrel re-export for date module                    | ~3 lines  |
| `packages/config/package.json`     | EDIT — add `exports` entries + `pino`/`pino-pretty` deps     | ~10 lines |
| `apps/api/src/middleware/cache.ts` | EDIT — replace `console.log`/`console.warn` with pino logger | ~3 lines  |
| `docs/migrations/naming-guide.md`  | EDIT — add legacy migration note                             | ~5 lines  |

### Why This Patch Set Belongs Together

All items are:

- **Zero-regression risk** — configuration changes, pure additions, or documentation
- **Isolated to non-route files** — no route handlers, middleware logic, or API contracts touched
- **Validation-gated** — standard `pnpm test` + `pnpm lint` + `pnpm typecheck` is sufficient
- **Easily rollbackable** — each change is 1-5 lines, revert in under 5 minutes

### Expected Benefit

1. **Logger redact:** Eliminates secret-leakage vector in production logs (password, token, authorization headers, cookies now `[REDACTED]`)
2. **Idempotency Map limit:** Prevents OOM under sustained Redis failure (unbounded Map growing with 24h TTL entries)
3. **`date.ts`:** Centralizes 12 date operations currently duplicated ad-hoc across 25+ route files
4. **Cache.ts cleanup:** Removes `console.log` (unstructured, no request context) from production middleware — replaces with structured pino logging
5. **Migration doc:** Prevents future merge conflicts by documenting ISO-date naming convention for new migrations

### Risk Level: **None / Near-Zero**

- Logger redact: Pino `redact.paths` is configuration-only, well-tested in pino
- Idempotency eviction: Only triggers when Map exceeds 10,000 entries (requires prolonged Redis outage)
- `date.ts`: Pure functions, zero dependencies, trivially correct by inspection
- Cache.ts: `import logger` + replace `console.*` — no functional change
- All changes are additive — no existing code is removed or modified

### Prerequisites

- None. These are standalone changes with no cross-dependencies.

### Validation Steps (Exact Commands)

```powershell
# Standard validation gate
pnpm test; if ($?) { pnpm lint }; if ($?) { pnpm typecheck }

# Verify redact behavior (spot-check):
# Add temporary log line: logger.info({ password: "test123", req: { headers: { authorization: "Bearer x" } } }, "test");
# Verify log output shows [REDACTED] for both values
# Remove temporary line before commit

# Verify idempotency eviction:
pnpm --filter=api test -- --testPathPattern="idempotency"

# Verify /metrics endpoint still works:
curl http://localhost:4000/metrics | Select-String -Pattern "portal_"
```

### Rollback Approach (Exact Git Commands)

```powershell
# If Patch Set 1 is a single commit:
git revert HEAD --no-edit; if ($?) { git push }

# If individual commits:
git revert <hash-logger-redact> --no-edit
git revert <hash-idempotency> --no-edit
git revert <hash-datets> --no-edit
# ... etc
git push

# Rollback time: < 5 minutes total
```

### Visual QA Required? **No**

None of these changes affect UI rendering.

### Integration Tests Required? **No**

Unit tests for idempotency eviction should be written (see Needs-Tests-First list). All other changes are configuration-only or pure functions.

---

## Patch Set 2: Low-Risk Shared Utility & Component Alignment

### Objective

Enrich `@mct/config` into a genuine shared utility package by adding a pino logger factory (with redact paths inherited from Patch Set 1). Add observability gauges and request-id child logger pattern. These changes eliminate duplication between API and worker logger configurations and improve monitoring.

### Exact Areas Likely Touched

| File                                    | Action                                                                         | Lines     |
| --------------------------------------- | ------------------------------------------------------------------------------ | --------- |
| `packages/config/src/logger.ts`         | CREATE — shared pino logger factory with redact, service name, env-based level | ~40 lines |
| `apps/api/src/lib/logger.ts`            | EDIT — refactor to `createLogger("api")` from `@mct/config`                    | ~15 lines |
| `apps/worker/src/logger.ts`             | EDIT — refactor to `createLogger("worker")` from `@mct/config`                 | ~15 lines |
| `apps/api/src/lib/metrics.ts`           | EDIT — add `activeUsers` + `activeOrgs` Prometheus gauges                      | ~15 lines |
| `apps/api/src/middleware/request-id.ts` | EDIT — add `req.log = logger.child({ requestId: req.id })`                     | ~5 lines  |

### Why This Patch Set Belongs Together

- **Logger factory** in `@mct/config` depends on the redact paths from Patch Set 1 — they move into the shared factory
- **Request-id child logger** pattern is trivial but provides a consistent logging foundation when used across route files
- **Prometheus gauges** are write-only observability with zero behavior impact
- All items are **middleware/lib layer changes** — no route logic touched

### Expected Benefit

1. **Shared logger factory:** Eliminates logger config duplication between API (19 lines) and worker (~15 lines). Ensures consistent redact paths, level handling, and formatting.
2. **`activeUsers`/`activeOrgs` gauges:** Closes observability gap — critical for monitoring platform health. Chat already has these; MCT tracks entity creation counts but not active-entity gauges.
3. **Request-ID child logger:** Enables auto-injection of `requestId` into all log lines via `req.log.info(...)` without manual parameter passing.

### Risk Level: **Low**

- Logger factory: Import path changes. If `@mct/config` exports work correctly, the logger API is identical (pino instance). Import resolution failures are caught by TypeScript/Node at startup.
- Gauges: Write-only Prometheus metrics. No behavior change.
- Request-id child: Pino's `child()` is well-tested. Additive — existing `logger.*()` calls continue to work.

### Prerequisites

- **Patch Set 1 must be complete** (logger factory depends on redact config moving into shared package)

### Validation Steps (Exact Commands)

```powershell
pnpm test; if ($?) { pnpm lint }; if ($?) { pnpm typecheck }

# Verify logger factory resolves correctly:
node -e "const { createLogger } = require('@mct/config'); const log = createLogger('test'); log.info('works');"

# Verify metrics endpoint returns new gauges:
curl http://localhost:4000/metrics | Select-String -Pattern "portal_active_users|portal_active_organizations"

# Verify request-id appears in child logger logs:
# Trigger any API request, check logs for requestId field at the root level
```

### Rollback Approach

```powershell
git revert HEAD~5..HEAD --no-edit   # revert last 5 commits as a group
# OR revert individual commits
git push
# Rollback time: < 10 minutes
```

### Visual QA Required? **No**

### Integration Tests Required? **No**

Import resolution tests are recommended but not required (startup errors are immediately visible). Metrics are write-only.

---

## Patch Set 3: Low-Risk UI Consistency Improvements

### Objective

This audit found **no UI gaps** in MCT — it has more features than Chat (admin panel, Storybook, 16+ page directories). However, two items touch the user-facing layer: cross-origin isolation headers (security, affects browser behavior) and CSRF token distribution (requires frontend changes).

Because CSRF carries medium risk and requires coordinated frontend/backend deploy, **Cross-Origin Isolation Headers** is the only item placed here. CSRF moves to Patch Set 4.

### Exact Areas Likely Touched

| File                                          | Action                                                                   | Lines    |
| --------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| `apps/api/src/middleware/security-headers.ts` | EDIT — add COEP `credentialless`, COOP `same-origin`, CORP `same-origin` | ~3 lines |

### Why This Patch Set Belongs Together

- Single file change, single responsibility (security headers)
- Three headers that work as a group — deploying them independently is incorrect
- No frontend code changes needed (COEP `credentialless` is permissive enough for MCT's CDN usage)

### Expected Benefit

- Cross-origin isolation protects against Spectre-type side-channel attacks
- Chat has these headers; MCT does not — closes a security gap identified in Phase 4 comparison
- COEP `credentialless` allows cross-origin resources without credentials (compatible with Swagger UI's unpkg resources)

### Risk Level: **Low**

- COEP `credentialless` — most permissive cross-origin isolation; no resource loading breaks
- COOP `same-origin` — may break `window.open` popups; MCT does not use these for auth flows
- CORP `same-origin` — strictest; verify no cross-origin images/fonts lack CORS headers

### Pre-Deployment Verification Required

```powershell
# Audit all CDN/external resources loaded by the web app:
# - Swagger UI (unpkg.com) — works with COEP credentialless
# - Tawk.to widget — loaded via script tag; verify cross-origin attribute
# - Google Analytics — loaded via script tag; verify cross-origin attribute
# - Font CDNs — verify CORS headers or use crossorigin attribute
# - Any img/media from external domains
```

### Prerequisites

- CDN resource audit (above) completed
- No changes to CSP or other security headers

### Validation Steps

```powershell
pnpm test; if ($?) { pnpm lint }; if ($?) { pnpm typecheck }

# E2E tests must pass (verify no browser console errors):
pnpm e2e

# Manual QA on dev:
# 1. Load every portal page — no console errors about cross-origin isolation
# 2. Load Swagger UI — verify resources load correctly
# 3. Load marketing pages (Tawk.to, GA) — verify no breakage
# 4. Verify header presence:
Invoke-WebRequest -Uri http://localhost:4000/health | Select-Object -ExpandProperty Headers
```

### Rollback Approach

```powershell
# Revert the 3-line addition:
git revert HEAD --no-edit; git push
# Rollback time: < 2 minutes
```

### Visual QA Required? **Yes**

- Load all pages in browser — verify no layout breaks, missing resources, or console errors
- Pay special attention to pages loading external CDN resources (Swagger UI, Tawk.to, GA)

### Integration Tests Required? **Yes**

- E2E test verifying headers are present in all API responses
- E2E test verifying browser does not report cross-origin isolation errors

---

## Patch Set 4: Medium-Risk Internal Refactors with Tests

### Objective

Address the verified circuit breaker timeout bug (Phase 3 finding), add proper error subclasses for internal use, and add CSRF protection. These are the most impactful changes from the audit — they fix a verified bug, improve internal code quality, and close a security gap. **All items require new tests first.**

### Exact Areas Likely Touched

| File                                             | Action                                                                        | Lines      |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | ---------- |
| `apps/api/src/__tests__/circuit-breaker.test.ts` | CREATE — 10 tests (open/close/half-open cycle, timeout, stats, shutdown)      | ~150 lines |
| `apps/api/src/lib/circuit-breaker.ts`            | REPLACE — custom class (124 lines) with Opossum-based implementation          | ~120 lines |
| `apps/api/src/lib/http-client.ts`                | EDIT — update breaker adapter if needed                                       | ~10 lines  |
| `apps/api/src/services/supabase.ts`              | EDIT — update if type/import changes                                          | ~3 lines   |
| `apps/api/src/types/index.ts`                    | EDIT — add 9 typed error subclasses extending AppError                        | ~50 lines  |
| `apps/api/src/middleware/error.ts`               | EDIT — reorder error checks (ZodError before AppError)                        | ~5 lines   |
| `packages/config/src/logger.ts`                  | (already done in Patch Set 2)                                                 | —          |
| `apps/api/src/__tests__/csrf.test.ts`            | CREATE — 6 tests (token generation, validation, 403 on mismatch, Bearer skip) | ~80 lines  |
| `apps/api/src/middleware/csrf.ts`                | CREATE — double-submit cookie CSRF middleware                                 | ~110 lines |
| `apps/api/src/app.ts`                            | EDIT — register CSRF middleware                                               | ~3 lines   |
| `apps/web/lib/api.ts`                            | EDIT — inject `X-CSRF-Token` from `csrf_token` cookie                         | ~10 lines  |
| `apps/web/lib/client-api.ts`                     | EDIT — inject `X-CSRF-Token` header in SDK calls                              | ~10 lines  |

### Why This Patch Set Belongs Together

- **Circuit breaker and typed errors** are both internal architecture improvements that benefit from each other: typed errors enable `catch (instanceof NotFoundError)` in circuit breaker fallback logic
- **CSRF** is a security middleware addition requiring coordinated frontend changes — it belongs in the same deploy batch as other middleware changes
- All three require **tests first** — no production code changes without test coverage
- All three are **isolated to middleware/lib layer** — no route handler logic changes

### Expected Benefit

1. **Opossum circuit breaker:** Fixes verified timeout bug (custom `CircuitBreaker.execute()` does not enforce `config.timeout`). Adds event-driven logging (open/close/halfOpen events now visible in pino). Adds `shutdown()` lifecycle for graceful drain. Adds stats tracking via `breaker.stats`.
2. **Typed error subclasses:** Enables `catch (err instanceof NotFoundError)` pattern. The current single `AppError` with `string` code forces string comparison. Subclasses extend AppError so existing `instanceof AppError` catches still work.
3. **CSRF middleware:** Closes verified CSRF gap for cookie-based auth. `SameSite=Lax` covers top-level navigation CSRF but does not cover cross-site POST via form, subdomain attacks, or GET-based mutations.

### Risk Level: **Medium**

**Opossum risk:** Behavioral differences between custom and Opossum circuit breaker state machines. Mitigation: write and run CB tests against custom implementation first (baseline), then run same tests against Opossum (verify parity).

**Typed errors risk:** Near-zero — subclasses extend AppError, so all existing `instanceof AppError` checks continue to match. Error handler must reorder checks (ZodError before AppError) but this is already a pre-existing bug (ZodError branch is dead code after AppError check).

**CSRF risk:** Medium — requires coordinated frontend deploy. If frontend doesn't send `X-CSRF-Token` header, all browser-based mutations will get 403. SDK-based clients (using `Authorization: Bearer`) are unaffected. Mitigation: deploy backend + frontend changes in same commit. Verify SDK-only flows work during staging.

### Prerequisites

- **Patch Set 1** (logger redact — CB event logging depends on redact config)
- **Circuit breaker tests must be written first** (baseline before Opossum swap)
- **CSRF tests must be written first**
- Frontend changes for CSRF token distribution must be ready for coordinated deploy

### Validation Steps

```powershell
# Phase 4a: CB tests + Opossum migration
pnpm --filter=api test -- --testPathPattern="circuit-breaker"  # baseline against custom impl
# (implement Opossum swap)
pnpm --filter=api test -- --testPathPattern="circuit-breaker"  # verify parity against Opossum
pnpm test  # full suite

# Manual CB verification on dev:
# 1. Set SUPABASE_URL to invalid URL
# 2. Hit any API endpoint 5+ times
# 3. Verify 503 Service Unavailable (circuit open)
# 4. Check logs for "circuit breaker open" event
# 5. Restore SUPABASE_URL, wait resetTimeout
# 6. Verify requests succeed again

# Phase 4b: Typed errors
pnpm test  # all existing tests pass (subclasses extend AppError)

# Phase 4c: CSRF
pnpm --filter=api test -- --testPathPattern="csrf"
pnpm test
# Manual QA on dev:
# 1. Browser login → create ticket → should succeed
# 2. curl -X POST http://localhost:4000/api/v1/tickets -H "Cookie: ..." → 403 (no CSRF token)
# 3. curl -X POST http://localhost:4000/api/v1/tickets -H "Authorization: Bearer ..." → 200 (no CSRF check)
# 4. Full E2E suite on dev
```

### Rollback Approach

```powershell
# Opossum revert:
git revert <hash-opossum-swap> --no-edit

# Typed errors revert:
git revert <hash-typed-errors> --no-edit

# CSRF revert (backend + frontend together):
git revert <hash-csrf-backend> <hash-csrf-frontend> --no-edit

git push
# Rollback time: < 15 minutes for any single item
```

### Visual QA Required? **Yes (CSRF only)**

- Login → navigate portal → create ticket → verify success
- Login → navigate admin → update user role → verify success
- Verify no 403 errors in browser console for any mutation operation

### Integration Tests Required? **Yes (all three)**

1. **Circuit breaker:** 10 integration tests (open/close/half-open cycle, timeout, stats, shutdown)
2. **CSRF:** 6 integration tests (token lifecycle, validation, 403, Bearer skip, timing-safe comparison)
3. **Error handler:** Existing error handler tests should verify typed subclasses produce correct response shape

---

## Patch Set 5: Optional Strategic Convergence Work

### Objective

Higher-effort, conditional improvements that should only be pursued when triggered by production data or specific requirements. These are not "default" improvements — they depend on observed conditions.

### Item 5.1: Cache Invalidation Audit

| Field             | Value                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| **Trigger**       | Stale data reported more than once per month                                 |
| **Effort**        | 2 hours                                                                      |
| **Files**         | `apps/api/src/middleware/cache.ts`, all route files with `cache.set()` calls |
| **Risk**          | Low (audit only; actual invalidation fixes are additive)                     |
| **Prerequisites** | None                                                                         |
| **Validation**    | Integration test per cached entity: set cache → mutate → verify invalidation |
| **Visual QA**     | Yes — verify stale data is NOT visible after mutation                        |
| **Rollback**      | Revert any added invalidation calls                                          |

### Item 5.2: Webhook Delivery Offload to Worker

| Field             | Value                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Trigger**       | Webhook delivery volume exceeds 100/min sustained over 1 week                                         |
| **Effort**        | 1 engineering day                                                                                     |
| **Files**         | `apps/worker/src/tasks/webhook-delivery.ts` (NEW), `apps/api/src/routes/webhook-management.ts` (EDIT) |
| **Risk**          | Medium (queue processing must be reliable; worker must deploy first)                                  |
| **Prerequisites** | BullMQ already configured in worker                                                                   |
| **Validation**    | Unit: queue consumer. Integration: API enqueues → worker processes → delivery log created             |
| **Visual QA**     | Yes — verify webhook delivery completes through worker                                                |
| **Rollback**      | Revert API to inline `HttpClient.fetch()` delivery                                                    |

### Item 5.3: Supabase Migration Squash

| Field             | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| **Trigger**       | Local/CI `supabase db push` takes > 30s (22 migrations chained)    |
| **Effort**        | 2 hours                                                            |
| **Files**         | New single migration file replacing 22 `5302xxx` files             |
| **Risk**          | Medium (must produce identical schema; production data unaffected) |
| **Prerequisites** | Access to fully migrated Supabase project for `pg_dump` reference  |
| **Validation**    | Fresh Supabase project + all API tests pass                        |
| **Visual QA**     | No                                                                 |
| **Rollback**      | Keep originals; delete squashed file                               |

### Item 5.4: Dormant Infra Cleanup

| Field             | Value                                                            |
| ----------------- | ---------------------------------------------------------------- |
| **Trigger**       | Any sprint with downtime                                         |
| **Effort**        | 30 minutes                                                       |
| **Files**         | Root `docker-compose.yml`, `vercel.json`, legacy docs references |
| **Risk**          | None (files are dormant, not referenced by active CI/CD)         |
| **Prerequisites** | Verify no CI or doc references                                   |
| **Validation**    | `pnpm test`, build check                                         |
| **Rollback**      | Restore from archive                                             |

### Item 5.5: Per-Request Supabase User Client (RLS Defense-in-Depth)

| Field             | Value                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Trigger**       | Security audit finding, customer compliance requirement, or `requireOrgAccess` bypass incident              |
| **Effort**        | 2 engineering days                                                                                          |
| **Files**         | All 25 route files + `apps/api/src/services/supabase.ts`                                                    |
| **Risk**          | High (touches every route; error responses could differ)                                                    |
| **Prerequisites** | RLS policies must cover all query patterns                                                                  |
| **Validation**    | Every route: integration test verifying RLS enforcement. Existing `requireOrgAccess` tests continue to pass |
| **Visual QA**     | No                                                                                                          |
| **Rollback**      | Revert to service_role-only client                                                                          |

---

## Top 20 Prioritized Recommendations

| Rank | Recommendation                                          | Patch Set | Risk   | Effort | Value                                     |
| ---- | ------------------------------------------------------- | --------- | ------ | ------ | ----------------------------------------- |
| 1    | Add pino redact paths to API logger                     | PS1       | None   | 5 min  | High — closes secret-leakage vector       |
| 2    | Add pino redact paths to Worker logger                  | PS1       | None   | 2 min  | High — same secret-leakage vector         |
| 3    | Fix idempotency Map unbounded growth                    | PS1       | None   | 15 min | High — prevents OOM on Redis failure      |
| 4    | Copy `date.ts` to `@mct/config`                         | PS1       | None   | 5 min  | Medium — eliminates duplicated date logic |
| 5    | Replace `console.log` in cache.ts with pino             | PS1       | None   | 5 min  | Low — log hygiene                         |
| 6    | Update migration naming doc                             | PS1       | None   | 2 min  | Low — prevents future conflicts           |
| 7    | Enrich `@mct/config` with logger factory                | PS2       | Low    | 30 min | Medium — eliminates logger duplication    |
| 8    | Add `activeUsers`/`activeOrgs` Prometheus gauges        | PS2       | Low    | 15 min | Medium — monitoring blind spot            |
| 9    | Add `req.log` child logger in request-id middleware     | PS2       | Low    | 10 min | Low — scaffolding for better logging      |
| 10   | Add Cross-Origin Isolation headers (COEP/COOP/CORP)     | PS3       | Low    | 1 hr   | Medium — Spectre protection               |
| 11   | Write circuit breaker unit tests (baseline)             | PS4       | None   | 1 hr   | High — 0 CB tests currently               |
| 12   | Switch circuit breaker to Opossum                       | PS4       | Medium | 1.5 hr | High — fixes verified timeout bug         |
| 13   | Add typed error subclasses                              | PS4       | Low    | 30 min | Medium — enables typed catch patterns     |
| 14   | Reorder error handler checks (ZodError before AppError) | PS4       | Low    | 5 min  | Low — fixes dead code bug                 |
| 15   | Write CSRF middleware tests                             | PS4       | None   | 30 min | High — ensures correctness                |
| 16   | Implement CSRF middleware (backend)                     | PS4       | Medium | 1 hr   | High — closes CSRF attack vector          |
| 17   | Implement CSRF token distribution (frontend)            | PS4       | Medium | 30 min | High — required for CSRF to work          |
| 18   | Cache invalidation audit                                | PS5       | Low    | 2 hr   | Medium — ensures data freshness           |
| 19   | Webhook delivery offload to worker                      | PS5       | Medium | 1 day  | Medium — conditional on volume            |
| 20   | Per-request Supabase user client (RLS defense)          | PS5       | High   | 2 days | High — but conditional on audit finding   |

---

## Quick Wins List

Items deliverable in **under 30 minutes** with zero regression risk:

| #   | Item                                   | Time             | Patch Set | Value                                    |
| --- | -------------------------------------- | ---------------- | --------- | ---------------------------------------- |
| 1   | Add pino redact paths to API logger    | 5 min            | PS1       | Closes secret-leakage vector             |
| 2   | Add pino redact paths to Worker logger | 2 min            | PS1       | Same as #1 for worker                    |
| 3   | Copy `date.ts` to `@mct/config`        | 5 min            | PS1       | 12 date utilities available everywhere   |
| 4   | Replace `console.log` in cache.ts      | 5 min            | PS1       | Structured logging in cache middleware   |
| 5   | Update migration naming doc            | 2 min            | PS1       | Prevent future merge conflicts           |
| 6   | Fix idempotency Map size limit         | 15 min           | PS1       | Prevent OOM on Redis failure             |
| 7   | Add `activeUsers` gauge                | 8 min            | PS2       | Monitoring blind spot                    |
| 8   | Add `activeOrgs` gauge                 | 7 min            | PS2       | Monitoring blind spot                    |
| 9   | Add `req.log` child logger             | 10 min           | PS2       | Foundation for better logging            |
| 10  | Reorder error handler checks           | 5 min            | PS4       | Fix dead code bug (ZodError unreachable) |
| 11  | Add Cross-Origin Isolation headers     | 10 min (+ audit) | PS3       | Security improvement                     |

**Total quick-wins effort: ~74 minutes** for all 11 items (PS1 alone = 34 min).

---

## Needs-Tests-First List

These changes require new test coverage before any production code is modified:

| Item                                    | Tests Required                                                                                                                        | Existing Coverage                                        | Effort | Patch Set |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------ | --------- |
| **Circuit breaker Opossum swap**        | 10 tests: open/close/half-open cycle, timeout enforcement, stats tracking, shutdown, named breaker caching                            | **0 CB tests**                                           | 1 hr   | PS4       |
| **CSRF middleware**                     | 6 tests: GET sets cookie, valid CSRF→200, missing CSRF→403, mismatched CSRF→403, Bearer skip→200, timing-safe comparison              | **0 CSRF tests**                                         | 30 min | PS4       |
| **Idempotency Map eviction**            | 5 tests: 9,999 entries→no eviction, 10,001st→eviction triggered, oldest evicted first, remaining entries valid, Redis path unaffected | **0 idempotency tests**                                  | 20 min | PS1       |
| **Cache invalidation**                  | 4 integration tests: set→mutate→verify invalidated per cached entity type                                                             | Cache test file exists but invalidation coverage unknown | 30 min | PS5       |
| **Error handler with typed subclasses** | Verify each subclass produces correct response shape, error handler catches in correct order                                          | Existing error handler tests should continue to pass     | 15 min | PS4       |

**Execution rule:** Write tests, run against current implementation (baseline), then implement the change, run tests again (verify parity).

---

## Copy-from-Reference List

Items to copy from Chat **verbatim or near-verbatim** with minimal adaptation:

| #   | Item                                           | Source (Chat)                                 | Destination (MCT)                                         | Notes                                                                                        |
| --- | ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Logger redact paths                            | `packages/config/logger.ts:34-43`             | `apps/api/src/lib/logger.ts`, `apps/worker/src/logger.ts` | Copy exact redact paths and censor value                                                     |
| 2   | `date.ts` (12 date utilities)                  | `packages/config/date.ts` (72 lines)          | `packages/config/src/date.ts`                             | Copy verbatim — pure functions, zero deps                                                    |
| 3   | Logger factory (adapt from Chat's singleton)   | `packages/config/logger.ts`                   | `packages/config/src/logger.ts`                           | Adapt singleton → factory with `createLogger(name)`                                          |
| 4   | Typed error subclasses (names + status codes)  | `packages/config/errors.ts` (9 classes)       | `apps/api/src/types/index.ts`                             | Copy class signatures; keep MCT's `success()`/`failure()` envelope                           |
| 5   | Cross-origin isolation header values           | `apps/api/src/middleware/security-headers.ts` | `apps/api/src/middleware/security-headers.ts`             | Copy exact values: COEP `credentialless`, COOP `same-origin`, CORP `same-origin`             |
| 6   | CSRF middleware double-submit pattern          | `apps/api/src/middleware/csrf.ts`             | `apps/api/src/middleware/csrf.ts`                         | Adapt to MCT's auth model (Bearer skip, cookie naming)                                       |
| 7   | `activeUsers`/`activeWorkspaces` gauge concept | `apps/api/src/lib/metrics.ts`                 | `apps/api/src/lib/metrics.ts`                             | Copy gauge concept; adapt entity names to MCT domain                                         |
| 8   | Opossum circuit breaker integration pattern    | `apps/api/src/lib/circuit-breaker.ts`         | `apps/api/src/lib/circuit-breaker.ts`                     | Copy integration pattern (registry, stats, shutdown); adapt factory names to MCT conventions |

**Total copy-from-reference effort: ~4 hours** (all 8 items).

---

## Adapt-Don't-Copy List

Items where the Chat pattern should be **conceptually adapted** rather than directly copied:

| #   | Item                        | Chat Pattern                                                    | MCT Adaptation                                                                                                        | Reason                                                                                                               |
| --- | --------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Error subclasses            | Chat has 9 typed classes + `toProblemDetails()` RFC 7807 output | MCT should add subclasses for INTERNAL use only; keep `success()`/`failure()` envelope for API responses              | MCT's envelope is cleaner for SDK clients. Subclasses are for `catch (instanceof NotFoundError)` patterns internally |
| 2   | Logger factory              | Chat uses singleton `createLogger()`                            | MCT should use `createLogger(name)` factory with explicit service name                                                | MCT has API + Worker — named loggers distinguish service origin in log output                                        |
| 3   | Migration naming            | ISO-date `20260625000001_*`                                     | MCT should adopt ISO-date for NEW migrations only; keep existing `5302xxx` files                                      | Renaming existing files breaks `supabase migration list` history                                                     |
| 4   | Per-request Supabase client | Chat creates user-scoped client on every request                | MCT should consider this only if triggered by security audit; current service_role + middleware approach is by-design | MCT architecture intentionally removed per-request RLS for simplicity                                                |
| 5   | Webhooks via worker         | Chat has dedicated `processors/webhook-delivery.ts`             | MCT should only offload if volume exceeds 100/min; keep inline for now                                                | Inline delivery is acceptable for MCT's volume (user-action-triggered, not automated)                                |
| 6   | Prometheus gauges           | Chat's gauge naming: `activeWorkspaces`, `activeUsers`          | MCT naming: `portal_active_organizations`, `portal_active_users`                                                      | MCT uses `portal_` prefix convention for metrics                                                                     |

---

## Leave-Alone List

Items from Chat that MCT should **not adopt** (current approach is superior or equivalent):

| #   | Item                                             | Why MCT Should Keep Current Approach                                                                                                                    | Phase 3 Reference |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Move env schema to shared package                | Per-app schemas are simpler; API and worker have genuinely different env needs (Stripe/JSM vs none)                                                     | §8.1              |
| 2   | Create shared DB package                         | MCT's architecture (no Supabase client in web) is deliberate and more secure                                                                            | §8.2              |
| 3   | Adopt Socket.io for real-time                    | SSE is sufficient for notification-only real-time needs; Socket.io adds complexity (Redis adapter, WebSocket ports, connection tracking) with no return | §8.5              |
| 4   | Migrate from Jest to vitest                      | 774 working tests — no value in swapping test runners; risk of behavioral differences                                                                   | §8.6              |
| 5   | Add feature flags                                | No gradual-rollout use case in MSP context; would require migrations, API, UI, caching                                                                  | §8.7              |
| 6   | Add PWA / service worker                         | Desktop-first portal; offline support is irrelevant; service worker caching would confuse portal behavior                                               | §8.8              |
| 7   | Separate RLS policy files                        | Migration-embedded RLS is more atomic — prevents deployment ordering bugs                                                                               | §8.4              |
| 8   | Root-level Playwright config                     | MCT's E2E tests are scoped to web app; root config would create confusion about test ownership                                                          | §8.3              |
| 9   | Route/Service separation (routes.ts + services/) | 25 route files would need ~50 files (route+service). No measurable reliability gain for the refactor cost                                               | §2.5              |
| 10  | Dual Supabase clients (anon + per-user)          | MCT's single service_role client + middleware is simpler; Chat's approach has sync risk between two client factories                                    | §6.7              |
| 11  | Adopt Chat's audit retry queue (unbounded)       | MCT's inline retry with exponential backoff is better — no memory leak, simpler                                                                         | §4.4              |
| 12  | Dual logger (packages/config + per-app)          | Chat has duplication risk; MCT should instead enrich `@mct/config` (PS2)                                                                                | §5.5              |

---

## Best Order of Execution

### Execution Phase A: Immediate (Day 1)

| Step | Item                              | PS  | Time   | Can Parallelize? |
| ---- | --------------------------------- | --- | ------ | ---------------- |
| A1   | Logger redact — API               | PS1 | 5 min  | —                |
| A2   | Logger redact — Worker            | PS1 | 2 min  | With A1          |
| A3   | `date.ts` to `@mct/config`        | PS1 | 5 min  | With A1          |
| A4   | Idempotency Map size limit        | PS1 | 15 min | With A1          |
| A5   | Replace `console.log` in cache.ts | PS1 | 5 min  | With A1          |
| A6   | Migration naming doc              | PS1 | 2 min  | With A1          |

**Gate:** `pnpm test && pnpm lint && pnpm typecheck` — all pass.

### Execution Phase B: Quick Follow-up (Day 1-2)

| Step | Item                           | PS  | Time   | Can Parallelize? |
| ---- | ------------------------------ | --- | ------ | ---------------- |
| B1   | Prometheus gauges              | PS2 | 15 min | With B2          |
| B2   | Request-ID child logger        | PS2 | 10 min | With B1          |
| B3   | Cross-origin isolation headers | PS3 | 1 hr   | After CDN audit  |

**Gate:** Same as Phase A + verify `/metrics` returns new gauges + E2E tests pass.

### Execution Phase C: Logger Factory (Day 2)

| Step | Item                                   | PS  | Time   | Prerequisite            |
| ---- | -------------------------------------- | --- | ------ | ----------------------- |
| C1   | Create `packages/config/src/logger.ts` | PS2 | 30 min | Phase A (redact config) |
| C2   | Refactor API logger to use factory     | PS2 | 10 min | C1                      |
| C3   | Refactor Worker logger to use factory  | PS2 | 10 min | C1                      |

**Gate:** `pnpm test && pnpm lint && pnpm typecheck` + verify logger output in dev.

### Execution Phase D: Architecture Refactors + Tests (Day 2-3)

| Step | Item                                   | PS  | Time   | Prerequisite |
| ---- | -------------------------------------- | --- | ------ | ------------ |
| D1   | Write circuit breaker baseline tests   | PS4 | 1 hr   | —            |
| D2   | Swap to Opossum                        | PS4 | 1.5 hr | D1           |
| D3   | Add typed error subclasses             | PS4 | 30 min | —            |
| D4   | Reorder error handler                  | PS4 | 5 min  | D3           |
| D5   | Write CSRF tests                       | PS4 | 30 min | —            |
| D6   | Implement CSRF backend middleware      | PS4 | 1 hr   | D5           |
| D7   | Implement CSRF frontend token handling | PS4 | 30 min | D6           |

**Gate:** `pnpm test` (all passes including new CB + CSRF tests) + manual QA on dev (login→mutations succeed) + E2E suite.

### Execution Phase E: Strategic (Conditional, Future Sprints)

| Step | Item                        | PS  | Gate                     |
| ---- | --------------------------- | --- | ------------------------ |
| E1   | Cache invalidation audit    | PS5 | Stale data reported      |
| E2   | Webhook delivery offload    | PS5 | Volume > 100/min         |
| E3   | Migration squash            | PS5 | Slow local migrations    |
| E4   | Dormant infra cleanup       | PS5 | Any sprint with downtime |
| E5   | Per-request Supabase client | PS5 | Security audit finding   |

### Recommended Sprint Allocation

| Sprint       | Content                                                       | Total Effort |
| ------------ | ------------------------------------------------------------- | ------------ |
| **Sprint 1** | Phase A + Phase B (safety wins + observability)               | ~2 hours     |
| **Sprint 2** | Phase C (logger factory) + Phase D items D1-D4 (CB + errors)  | ~4 hours     |
| **Sprint 3** | Phase D items D5-D7 (CSRF) — coordinated deploy with frontend | ~2 hours     |
| **Future**   | Phase E items as triggered                                    | Variable     |

**Total predictable effort (Phases A-D): ~8-9 hours** across 3 sprints.

---

## Appendix: Dependency Graph Between All Patch Sets

```
PS1 (no-risk cleanup) ────────────────────┐
                                          │
PS2 (shared utility alignment) ───────────┤── depends on PS1 (logger factory inherits redact config)
                                          │
PS3 (UI consistency: headers) ────────────┤── independent of PS1, PS2
                                          │
PS4 (internal refactors + tests) ─────────┼── depends on PS1 (logger for CB events), independent otherwise
                                          │
PS5 (strategic convergence) ──────────────┘── items are independent; gated by production triggers
```

### Parallelization Strategy

| Workstream A                              | Workstream B                          | Max Developers |
| ----------------------------------------- | ------------------------------------- | -------------- |
| PS1 (all items)                           | PS3 (CDN audit + headers)             | 2              |
| PS2 (logger factory + gauges + requestId) | PS4 (CB tests, Opossum, typed errors) | 2              |
| PS4 (CSRF backend)                        | PS4 (CSRF frontend)                   | 2              |
| PS5 (any item)                            | —                                     | 1              |

**Maximum team velocity:** 3 developers can complete all predictable work (Phases A-D) in 1-2 sprints.

---

_End of Phase 7 patch set design. All items are cross-referenced against Phase 1-6 findings, risk assessments, do-not-break guardrails, and test requirements._
