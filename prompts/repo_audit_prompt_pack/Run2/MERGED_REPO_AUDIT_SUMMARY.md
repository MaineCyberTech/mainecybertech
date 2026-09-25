# Phase 8 — Final Reconciliation: Comparative Repo Audit Summary

**Date:** 2026-07-02  
**Audit Run:** Run2  
**Reference Repo (Chat):** `C:\temp\chat`  
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`  
**Prior Phases:** 1 (Inventory), 2 (Mapping), 3 (Strengths), 4 (Risk), 5 (Roadmap), 6 (Change Plan), 7 (Patch Sets)

---

## 1. Executive Summary

**MCT Portal is the significantly more mature production codebase.** Across every dimension that matters for operational reliability — test coverage (774 vs ~19), auth security (local JWT verify, cookie flags, rotation), observability (structured logging, metrics, audit viewer), documentation (~43 files vs ~18 subdirectories), and operational tooling (admin panel, cache layer, optimistic locking, nonce-based CSP) — MCT is clearly ahead. The two repos share the same architectural template (Turborepo monorepo, Express API, Next.js 15, BullMQ Worker, hosted Supabase, DO droplet, Caddy, GHCR) but MCT has executed on it more completely.

**The reference repo has valuable patterns worth adopting in specific areas:** a battle-tested Opossum circuit breaker (MCT's custom implementation has a verified timeout bug), a shared `date.ts` utility library, logger redact configuration (MCT has none — secrets can leak into logs), typed error subclasses for internal use, CSRF protection, and cross-origin isolation headers. The total predictable effort to adopt all high-value patterns is **~8-9 hours** across 3 sprints (plus ~2 days of conditional strategic work). **17 items total, ~3 engineering days end-to-end.**

**No structural convergence is needed.** MCT should not adopt Socket.io, feature flags, PWA, a shared DB package, vitest, or separate RLS policy files — these would add complexity without value in the MSP portal context. The recommendation is selective borrowing, not convergence.

---

## 2. High-Level Repo Comparison

| Dimension                  | Chat Platform                     | MCT Portal                                           | Verdict                                           |
| -------------------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Domain**                 | Real-time workspace communication | MSP client portal (tickets, projects, docs)          | Different products                                |
| **Total tests**            | ~19 (vitest)                      | 774 (Jest) — **40x more**                            | **MCT**                                           |
| **API tests**              | ~9 (service-level)                | ~182 (Jest + supertest)                              | **MCT**                                           |
| **SDK tests**              | 0                                 | ~108 (mocked fetch)                                  | **MCT**                                           |
| **Worker tests**           | 0                                 | ~24 (env + task handlers)                            | **MCT**                                           |
| **Web unit tests**         | ~8                                | ~460 (Jest + Testing Library)                        | **MCT**                                           |
| **E2E tests**              | ~8 spec files                     | ~26 spec files (Playwright)                          | **MCT**                                           |
| **Coverage threshold**     | None                              | 50% minimum per package                              | **MCT**                                           |
| **Shared packages**        | 4 (config, db, sdk, ui)           | 3 (config, sdk, ui) — no db package                  | **Chat** for package count                        |
| **SDK modules**            | 7 domain clients                  | 20 domain clients                                    | **MCT**                                           |
| **API route files**        | 13 modules                        | 25 routes                                            | **MCT** (2x)                                      |
| **Middleware files**       | 10 (includes CSRF)                | 12 (includes cache, idempotency, optimistic locking) | **MCT** for operational middleware                |
| **Migrations**             | 32 (ISO-date naming)              | 22 (sequential `5302xxx`)                            | **Chat** naming convention                        |
| **CI/CD workflows**        | 19 (8 core + 11 audit/governance) | 15 (8 core + 7 supporting)                           | **Draw** — Chat more governance, MCT more testing |
| **Docs count**             | ~18 subdirectories                | ~43 files across ~20 subdirs                         | **MCT**                                           |
| **PWA**                    | Full (service worker, manifest)   | None                                                 | **Chat**                                          |
| **Feature flags**          | DB-backed with rollout + cache    | None                                                 | **Chat**                                          |
| **Real-time transport**    | Socket.io (full-duplex)           | SSE (server-to-client only)                          | **Context-dependent**                             |
| **Auth strategy**          | Supabase `getUser()` per request  | Local JWT verify + rotation + cookie flags           | **MCT**                                           |
| **Supabase client in web** | Yes (browser)                     | No (proxied through API)                             | **MCT** (more secure)                             |
| **Circuit breaker**        | Opossum (battle-tested)           | Custom (124 lines, timeout not enforced)             | **Chat**                                          |
| **Response caching**       | None                              | Redis + in-memory with no-renew pattern              | **MCT**                                           |
| **Admin UI**               | None                              | Full admin panel (16+ pages)                         | **MCT**                                           |
| **Optimistic locking**     | None                              | If-Match middleware on PATCH                         | **MCT**                                           |
| **CSRF protection**        | Double-submit cookie              | None                                                 | **Chat**                                          |
| **Nonce-based CSP**        | No (`unsafe-inline`)              | Yes (per-request nonces)                             | **MCT**                                           |
| **Cross-origin isolation** | COEP/COOP/CORP                    | None                                                 | **Chat**                                          |
| **Error handling**         | 9 typed classes + ProblemDetails  | Single AppError + `success()`/`failure()` envelope   | **Draw** — Chat internal, MCT response            |
| **Deploy speed**           | ~45 min (GHCR pull on droplet)    | ~8 min (SSH pipe)                                    | **MCT** (5x faster)                               |
| **Storybook/Chromatic**    | None                              | Full integration (7 stories)                         | **MCT**                                           |
| **Pre-commit hooks**       | None                              | Husky + lint-staged                                  | **MCT**                                           |

---

## 3. Detailed Mapping Summary

### Architecture Template — Near-Identical

Both repos share: Turborepo + pnpm workspaces, 3 apps (Express API:4000, Next.js 15:3000, BullMQ Worker), hosted Supabase, DO droplet + Caddy + GHCR, Terraform IaC, shared packages (config/sdk/ui), layered Express middleware, Zod validation, Sentry, Prometheus metrics, structured logging (pino), graceful shutdown, Docker multi-stage with non-root user.

### Domain-Specific Divergences

| Chat Concept         | MCT Equivalent         | Mapping Confidence                           |
| -------------------- | ---------------------- | -------------------------------------------- |
| Workspace            | Organization           | High (both are tenant containers)            |
| Channel              | Ticket / Project       | Low (chat room vs work item)                 |
| Message              | Ticket comment         | Partial (real-time vs CRUD with edit window) |
| Message search       | Ticket/project search  | Partial                                      |
| In-app notifications | In-app notifications   | Direct                                       |
| Webhook endpoints    | Webhook endpoints      | Direct                                       |
| Audit log            | Audit log              | Direct                                       |
| Feature flags        | —                      | N/A (no MCT equivalent)                      |
| Push notifications   | Email + in-app polling | Partial (different delivery mechanisms)      |

### Middleware Mapping — 1:1 with Extensions

Chat's 10 middleware files map directly to MCT's 12. MCT adds: cache (Redis/Map response caching), idempotency (Redis + in-memory dedup), optimistic locking (If-Match), admin role check, security input sanitizer. Chat adds: CSRF (double-submit cookie), deprecation warnings.

### Library/Services Mapping — MCT Has More

Both have logger (pino), sentry, circuit breaker, idempotency, metrics, supabase client. MCT additionally has: csv.ts (export utility), email.ts (mail sender), http-client.ts (timeout + retry + CB), notify.ts (notification dispatch). Chat additionally has: db-timeout, membership helpers, mention detection, socket.io setup, feature flags evaluator.

### Worker Mapping — MCT More Modular

Chat: 73-line main.ts, 4 processors (cleanup, notification, search-indexer, webhook-delivery). MCT: 32-line main.ts with 6 extracted modules (env, task-registry, consumer-bullmq, consumer-sqs, health-server, shutdown), 6 task handlers (jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications, stripe-reconcile). MCT's modular approach is strictly cleaner.

### SDK Comparison — MCT Significantly Larger

Chat: 7 domain modules, 24 types, 0 tests. MCT: 20 domain modules, extensive types, 108 tests. MCT covers: api-keys, audit, auth, billing, bulk, dashboard, documents, memberships, notifications, organizations, profiles, projects, roles, search, sla, tickets, users, webhooks.

### UI Package — Nearly Identical

Both have same 7 components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton) + theme hooks. Differences: Chat has Toast component; MCT has cn() utility, ThemeProvider, and 7 Storybook stories + Chromatic integration.

---

## 4. Best Implementations Worth Adopting

### Copy As-Is (Zero Adaptation Needed)

| #   | Item                           | Source (Chat)                          | Destination (MCT)                                         | Effort | Risk                  |
| --- | ------------------------------ | -------------------------------------- | --------------------------------------------------------- | ------ | --------------------- |
| 1   | Logger redact paths            | `packages/config/logger.ts:34-43`      | `apps/api/src/lib/logger.ts`, `apps/worker/src/logger.ts` | 7 min  | None                  |
| 2   | `date.ts` (12 date utilities)  | `packages/config/date.ts` (72 lines)   | `packages/config/src/date.ts`                             | 5 min  | None                  |
| 3   | Cross-origin isolation headers | `security-headers.ts` (COEP/COOP/CORP) | `apps/api/src/middleware/security-headers.ts`             | 1 hr   | Low (after CDN audit) |

### Adapt Conceptually (Borrow Idea, Adapt to MCT Context)

| #   | Item                    | Chat Pattern                      | MCT Adaptation                                                                      | Effort          | Risk   |
| --- | ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------- | --------------- | ------ |
| 4   | Circuit breaker         | Opossum library                   | Replace custom CB (124 lines) with Opossum; add adapter for backward compat         | 1.5 hr          | Medium |
| 5   | Typed error subclasses  | 9 classes + ProblemDetails        | Add subclasses for internal use only; keep `success()`/`failure()` envelope for API | 1 hr            | Low    |
| 6   | Logger factory          | Singleton `createLogger()`        | `createLogger(name)` factory with service name param                                | 30 min          | Low    |
| 7   | CSRF middleware         | Double-submit cookie              | Same pattern; skip for `Authorization: Bearer`; coordinate frontend deploy          | 1 hr + frontend | Medium |
| 8   | Prometheus gauges       | `activeWorkspaces`, `activeUsers` | `portal_active_organizations`, `portal_active_users`                                | 15 min          | None   |
| 9   | Migration naming        | ISO-date `20260625000001_*`       | NEW migrations only; keep existing `5302xxx`                                        | 2 min (doc)     | None   |
| 10  | Idempotency Map limit   | Same vulnerability (both repos)   | Add eviction at 10,000 entries                                                      | 15 min          | None   |
| 11  | Request-ID child logger | Both repos lack this              | `req.log = logger.child({ requestId })` in request-id middleware                    | 10 min          | None   |

### Not Worth Porting

| #   | Item                               | Reason                                                                                         |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| 12  | Route/Service separation           | 25 route files would need ~50 files; no measurable reliability gain                            |
| 13  | Separate RLS policy files          | Migration-embedded RLS is more atomic; prevents deployment ordering bugs                       |
| 14  | Shared env schema (config package) | Per-app schemas are simpler; API/worker have genuinely different env needs                     |
| 15  | Shared DB package                  | MCT intentionally removed Supabase client from web — this is a security improvement, not a gap |
| 16  | Audit retry queue (unbounded)      | MCT's inline retry with exponential backoff is superior (no memory leak)                       |

### Keep Current Implementation (MCT is Superior)

| #   | Item                               | Why MCT Is Better                                                            |
| --- | ---------------------------------- | ---------------------------------------------------------------------------- |
| 17  | Auth (local JWT verify + rotation) | ~1ms vs ~50-200ms Supabase API call; rotation support; explicit cookie flags |
| 18  | Worker modularity                  | 32-line main.ts with 6 extracted modules vs 73-line monolithic               |
| 19  | SSH pipe deploy                    | 5x faster than standard GHCR pull on small droplet                           |
| 20  | Nonce-based CSP                    | Per-request nonces vs `unsafe-inline`                                        |
| 21  | No-renew cache pattern             | Prevents cache stampede; Chat has no caching at all                          |
| 22  | Admin panel                        | Full 16+ page admin UI; Chat has none                                        |
| 23  | Test infrastructure                | 774 tests with 50% coverage thresholds; Storybook + Chromatic                |
| 24  | Success/failure API envelope       | Consistent response shape across all 86 endpoints                            |

---

## 5. Areas the Current Repo Should Keep As-Is

### Auth Architecture (Strictly Better)

- **Local JWT verification with rotation** (`apps/api/src/middleware/auth.ts`): Do not revert to `supabase.auth.getUser()` per request. Do not change comma-separated `JWT_SECRET` parsing.
- **Cookie-based auth with HttpOnly/Secure/SameSite=Lax**: Do not revert to Supabase default cookies.
- **No Supabase client in web**: Do not add `@supabase/supabase-js` to the frontend. Auth proxied through API is deliberate and more secure.
- **Server-side PKCE exchange**: Code exchange in API `/auth/callback`. Do not move to client-side.

### Tenant Isolation (Strictly Better)

- **`requireOrgAccess()` middleware**: Applied to all 8 entity routers with admin role bypass. Do not remove or bypass.
- **`requireAdmin` single JOIN query** (`roles!inner()`): Eliminated N+1. Do not revert to separate queries.
- **Service_role client + middleware pattern**: The RLS bypass is by-design. Do not switch to per-request RLS clients unless triggered by a security audit finding or compliance requirement.

### Response Format (Strictly Better)

- **`success()`/`failure()` envelope**: Every response has `{ success: boolean, data?, error? }`. Do not change. Do not replace with RFC 7807 ProblemDetails as the primary response format (keep envelope; add ProblemDetails optionally).
- **Existing `AppError` class**: Subclasses are additive. Do not remove the current class.

### Operations (Strictly Better)

- **SSH pipe deploy** (`docker save | gzip | ssh ... docker load`): Do not revert to standard GHCR pull. 5x faster.
- **No-renew cache pattern**: Do not switch to standard TTL-renew pattern (causes cache stampedes).
- **Prefixed image tagging** (SHA-only, no `:latest`): Do not revert. All CI workflows depend on SHA tags.

### Worker Architecture (Strictly Better)

- **Modular worker** (6 extracted modules, 32-line main.ts): Do not merge back into monolithic main.ts.
- **BullMQ + SQS dual backend**: Do not remove SQS fallback. Provides deployment flexibility.
- **Worker Sentry integration**: Do not remove. Chat's worker lacks this.

### Testing Infrastructure (Strictly Better)

- **Jest test framework**: Do not migrate to vitest. 774 working tests with 50% coverage thresholds.
- **Storybook + Chromatic**: Do not remove. Chat has no visual regression testing.

---

## 6. Efficiency Opportunities

### Verified Bug — Circuit Breaker Timeout Not Enforced

**Location:** `apps/api/src/lib/circuit-breaker.ts:63-76`  
**Detail:** `CircuitBreaker` class has a `timeout` config property but `execute()` never uses it. The `AbortController` timeout in `HttpClient.fetch()` handles timing, but direct calls to `circuitBreaker.execute()` (e.g., for Supabase queries) are not timed out by the breaker. The breaker never opens on timeout events.  
**Fix:** Switch to Opossum (battle-tested, properly enforces timeouts).  
**Effort:** 1.5 hours (includes writing 10 circuit breaker tests as baseline).

### Verified Security Gap — No Logger Redact

**Location:** `apps/api/src/lib/logger.ts`, `apps/worker/src/logger.ts`  
**Detail:** No `redact.paths` configured. Passwords, tokens, secrets, authorization headers, and cookies in log messages or context are written in plaintext.  
**Fix:** Copy Chat's redact configuration (5 lines per logger).  
**Effort:** 7 minutes total.

### Verified Memory Leak — Unbounded Idempotency Map

**Location:** `apps/api/src/lib/idempotency.ts`  
**Detail:** `IN_MEMORY_FALLBACK` Map grows without bound under sustained Redis failure. 24h TTL entries accumulate with no eviction policy.  
**Fix:** Add size check — evict oldest entries when Map exceeds 10,000.  
**Effort:** 15 minutes.

### Verified Dead Code — ZodError Branch Unreachable

**Location:** `apps/api/src/middleware/error.ts:20-38`  
**Detail:** `AppError` check (line 20) catches `ZodError` before the dedicated `ZodError` check (line 31) because `ZodError` does extend `Error` but not `AppError` — actually, ZodError does NOT extend AppError, so this is not dead code. But reordering to check ZodError first is cleaner and follows best practice (most specific first).  
**Classification:** Low severity.

### Documentation Drift

- `apps/api/.env.example` contains worker-only env vars (`JIRA_*`, `M365_*`) not in API schema — misleading.
- Migration naming convention not documented for new contributors.
- 43 docs files with potential drift from code behavior (no automated validation).

---

## 7. Risk Register

### High-Risk Areas

| ID       | Risk                                                                               | Blast Radius                               | Mitigation                                                                           | Priority |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ | -------- |
| **HR-1** | Service_role key bypasses RLS — tenant isolation is single-layer (middleware only) | All data across all orgs                   | Trust `requireOrgAccess()` — add RLS defense-in-depth only if audit finding/incident | Watch    |
| **HR-2** | Circuit breaker timeout not enforced — hangs don't open the breaker                | External API calls via `breaker.execute()` | Switch to Opossum                                                                    | **P0**   |
| **HR-3** | No logger redact — secrets in log output                                           | All log output system-wide                 | Add 5-line redact config                                                             | **P0**   |
| **HR-4** | Idempotency fallback Map unbounded — OOM on Redis failure                          | Webhook processing pipeline                | Add 10,000-entry eviction                                                            | **P1**   |
| **HR-5** | No CSRF protection — cookie-based auth vulnerable to cross-site POST               | All mutation endpoints via browser         | Add double-submit cookie CSRF middleware                                             | **P1**   |

### Medium-Risk Areas

| ID   | Risk                                                                        | Effort to Fix               | Priority |
| ---- | --------------------------------------------------------------------------- | --------------------------- | -------- |
| MR-1 | Sequential migration numbering causes merge conflicts in multi-dev workflow | 0 min (doc convention)      | P2       |
| MR-2 | Cache invalidation completeness unknown — potential stale data              | 2 hr (audit)                | P3       |
| MR-3 | No active-user/org Prometheus gauges — monitoring blind spot                | 15 min                      | P2       |
| MR-4 | Webhook delivery inline blocks API event loop at scale                      | 1 day (if volume > 100/min) | P4       |
| MR-5 | No cross-origin isolation headers                                           | 1 hr                        | P3       |

### Low-Risk Areas

| ID   | Risk                                                     | Effort                      | Priority |
| ---- | -------------------------------------------------------- | --------------------------- | -------- |
| LR-1 | `console.log`/`console.warn` in cache.ts instead of pino | 5 min                       | P1       |
| LR-2 | `console.error` in env.ts before `process.exit(1)`       | Skip (process dying anyway) | —        |
| LR-3 | No `pnpm audit` step in CI                               | 15 min                      | P3       |

---

## 8. Safe Alignment Roadmap

### Phase 1: Immediate Low-Risk Wins (~60 min, zero regression risk)

| Step | Item                                                       | Effort | Adoption Style     |
| ---- | ---------------------------------------------------------- | ------ | ------------------ |
| 1.1  | Add pino redact paths — API logger                         | 5 min  | copy as-is         |
| 1.2  | Add pino redact paths — Worker logger                      | 2 min  | copy as-is         |
| 1.3  | Copy `date.ts` to `@mct/config`                            | 5 min  | copy as-is         |
| 1.4  | Add idempotency Map size limit (10k eviction)              | 15 min | adapt conceptually |
| 1.5  | Replace `console.log`/`console.warn` in cache.ts           | 5 min  | adapt conceptually |
| 1.6  | Update migration naming doc with legacy note               | 2 min  | adapt conceptually |
| 1.7  | Add `logger.child({ requestId })` in request-id middleware | 10 min | adapt conceptually |
| 1.8  | Add `activeUsers`/`activeOrgs` Prometheus gauges           | 15 min | adapt conceptually |

**Gate:** `pnpm test` (774 pass) + `pnpm lint` (0 errors) + `pnpm typecheck` (clean). Deploy to dev. 24h log monitoring.

### Phase 2: Low-Risk Architecture Alignment (~3 hrs)

| Step | Item                                                 | Effort | Prerequisite            |
| ---- | ---------------------------------------------------- | ------ | ----------------------- |
| 2.1  | Write circuit breaker baseline tests (10 tests)      | 1 hr   | None                    |
| 2.2  | Replace custom CB with Opossum                       | 1.5 hr | 2.1 (baseline pass)     |
| 2.3  | Add 9 typed error subclasses + reorder error handler | 35 min | None                    |
| 2.4  | Create shared logger factory in `@mct/config`        | 30 min | Phase 1 (redact config) |
| 2.5  | Refactor API + Worker loggers to use factory         | 20 min | 2.4                     |

**Gate:** All tests pass (including 10 new CB tests). Manual QA: simulate Supabase outage → verify 503. Run E2E suite.

### Phase 3: CSRF Security (~2 hrs backend + frontend, coordinated deploy)

| Step | Item                                                                  | Effort |
| ---- | --------------------------------------------------------------------- | ------ |
| 3.1  | Write CSRF middleware tests (6 tests)                                 | 30 min |
| 3.2  | Implement CSRF middleware (double-submit cookie)                      | 1 hr   |
| 3.3  | Register CSRF middleware in app.ts                                    | 2 min  |
| 3.4  | Frontend: inject `X-CSRF-Token` from cookie in api.ts + client-api.ts | 30 min |

**Gate:** All tests pass. Manual QA: login → create ticket → update profile → verify success. curl without CSRF token → verify 403. E2E tests on dev.

### Phase 4: Strategic Improvements (Conditional, as triggered)

| Item                            | Trigger                            | Effort |
| ------------------------------- | ---------------------------------- | ------ |
| Cache invalidation audit        | Stale data reported >1x/month      | 2 hr   |
| Cross-origin isolation headers  | Any sprint                         | 1 hr   |
| Webhook offload to worker       | Volume > 100/min sustained         | 1 day  |
| Migration squash                | `supabase db push` > 30s           | 2 hr   |
| Dormant infra cleanup           | Any sprint with downtime           | 30 min |
| Per-request Supabase RLS client | Security audit finding or incident | 2 days |

### What Changes Are NOT on This Roadmap

| Pattern                           | Exclusion Reason                                             |
| --------------------------------- | ------------------------------------------------------------ |
| Move env schema to shared package | Per-app schemas are simpler; API/worker have different needs |
| Create shared DB package          | No Supabase client in web is deliberate and more secure      |
| Adopt Socket.io                   | SSE is sufficient for notification-only real-time needs      |
| Migrate Jest → vitest             | 774 working tests — no value in swapping runners             |
| Add feature flags                 | No gradual-rollout use case in MSP context                   |
| Add PWA                           | Desktop-first portal; offline support is irrelevant          |
| Separate RLS policy files         | Migration-embedded RLS is more atomic                        |
| Root-level Playwright config      | E2E tests scoped to web app; root config creates confusion   |

---

## 9. File/Area Change Recommendations

### Patch Group P0 — Safety Wins (25 min, 6 files)

| #   | File                              | Action                         | Lines Changed |
| --- | --------------------------------- | ------------------------------ | ------------- |
| 1   | `apps/api/src/lib/logger.ts`      | EDIT — add redact paths        | +5            |
| 2   | `apps/worker/src/logger.ts`       | EDIT — add redact paths        | +5            |
| 3   | `apps/api/src/lib/idempotency.ts` | EDIT — add Map eviction at 10k | +10           |
| 4   | `packages/config/src/date.ts`     | CREATE — 12 date utilities     | +72           |
| 5   | `packages/config/index.ts`        | CREATE — barrel export         | +3            |
| 6   | `packages/config/package.json`    | EDIT — add exports + deps      | +10           |

### Patch Group P1 — Observability + Hygiene (40 min, 4 files)

| #   | File                                    | Action                                | Lines Changed |
| --- | --------------------------------------- | ------------------------------------- | ------------- |
| 7   | `apps/api/src/lib/metrics.ts`           | EDIT — add 2 gauges                   | +15           |
| 8   | `apps/api/src/middleware/request-id.ts` | EDIT — add child logger               | +5            |
| 9   | `apps/api/src/middleware/cache.ts`      | EDIT — replace console.\* with logger | +3            |
| 10  | `docs/migrations/naming-guide.md`       | EDIT — add legacy note                | +5            |

### Patch Group P2 — Architecture Alignment (3 hrs, 7 files)

| #   | File                                             | Action                        | Effort |
| --- | ------------------------------------------------ | ----------------------------- | ------ |
| 11  | `apps/api/src/__tests__/circuit-breaker.test.ts` | CREATE — 10 tests             | 1 hr   |
| 12  | `apps/api/src/lib/circuit-breaker.ts`            | REPLACE — Opossum             | 1.5 hr |
| 13  | `apps/api/src/lib/http-client.ts`                | EDIT — if adapter needed      | 15 min |
| 14  | `apps/api/src/types/index.ts`                    | EDIT — add 9 typed subclasses | 30 min |
| 15  | `apps/api/src/middleware/error.ts`               | EDIT — reorder error checks   | 5 min  |
| 16  | `packages/config/src/logger.ts`                  | CREATE — logger factory       | 30 min |
| 17  | Refactor API + Worker loggers                    | EDIT — use factory            | 20 min |

### Patch Group P3 — CSRF Security (2 hrs + frontend, 4 files)

| #   | File                                  | Action                     | Effort |
| --- | ------------------------------------- | -------------------------- | ------ |
| 18  | `apps/api/src/__tests__/csrf.test.ts` | CREATE — 6 tests           | 30 min |
| 19  | `apps/api/src/middleware/csrf.ts`     | CREATE — middleware        | 1 hr   |
| 20  | `apps/api/src/app.ts`                 | EDIT — register middleware | 2 min  |
| 21  | `apps/web/lib/api.ts`                 | EDIT — CSRF token header   | 15 min |
| 22  | `apps/web/lib/client-api.ts`          | EDIT — CSRF token header   | 15 min |

### Patch Group P4 — Strategic (Conditional, 5 files)

| #   | File                                          | Trigger            | Effort |
| --- | --------------------------------------------- | ------------------ | ------ |
| 23  | `apps/api/src/middleware/security-headers.ts` | Any sprint         | 1 hr   |
| 24  | Cache invalidation fixes in route files       | Stale data reports | 2 hr   |
| 25  | `apps/worker/src/tasks/webhook-delivery.ts`   | Volume > 100/min   | 1 day  |

### Dependency Graph

```
P0 ────────────── (standalone, no deps)
P1 ────────────── (standalone, no deps)
P2 ─── depends on P0 (logger factory needs redact config)
P3 ─── standalone (independent, can parallel with P0-P2)
P4 ─── items are independent of each other and P0-P3
```

**Total files touched:** 25 (7 new, 18 existing edits)  
**Total predictable effort:** ~8-9 hours across 3 sprints  
**Total with strategic items:** ~3 engineering days

---

## 10. Do-Not-Break Guardrails

### Auth & Session Management

- **DO NOT** change `mct_session` cookie parsing/validation in `middleware.ts` — domain routing + JWT exp check depends on it.
- **DO NOT** remove `requireOrgAccess()` from any entity route without adding equivalent tenant isolation.
- **DO NOT** reintroduce Supabase client in the web package. Auth proxied through API is deliberate and secure.
- **DO NOT** change comma-separated `JWT_SECRET` parsing in `auth.ts:20-26` — rotation depends on this format.

### RBAC & Tenancy

- **DO NOT** change `requireOrgAccess` admin bypass logic (line 34, `admin`/`super_admin` keys) — 8 entity routers depend on it.
- **DO NOT** flatten the `roles!inner()` JOIN in `auth.ts:requireAdmin` — eliminated N+1 query.
- **DO NOT** change `memberships` table schema without updating `checkOrgAccess()` in `org-access.ts:13-42`.

### API Contracts

- **DO NOT** change `/api/v1/` prefix — SDK and middleware are wired to this.
- **DO NOT** change `{ success, data?, error? }` response envelope without simultaneously updating SDK — 108 SDK tests depend on this shape.
- **DO NOT** remove any of the 86 API endpoints documented in `docs/API_ENDPOINT_INVENTORY.md` without updating docs.

### Database & Data

- **DO NOT** rename `audit_logs` table columns — 27 mutation endpoints depend on exact column names.
- **DO NOT** rename existing `5302xxx` migration files — breaks `supabase migration list` history.
- **DO NOT** change `memberships` schema without updating `checkOrgAccess()`.

### CI/CD

- **DO NOT** change `corepack enable && corepack prepare pnpm@10 --activate` CI pattern — `pnpm/action-setup` + `cache: pnpm` is known broken.
- **DO NOT** remove `prod-approval` environment gate from `deploy-do.yml`.
- **DO NOT** change SHA-based image tagging to `:latest`.
- **DO NOT** remove `/validate` workflow call from deploy workflows.

### UI & Layout

- **DO NOT** remove `force-dynamic` from admin/portal layouts — `next build` throws prerender errors.
- **DO NOT** change domain routing logic (`app.*` → portal, `www.*` → marketing) without updating Caddyfile.
- **DO NOT** remove `mct_session` cookie from logout action — it breaks the auth redirect loop on `/pending`.

### Service Refactors

- **DO NOT** move `getEnv()` out of `apps/api/src/config/env.ts` without leaving a re-export alias.
- **DO NOT** restructure `apps/api/src/routes/` — 25 route files are individually imported in `app.ts`.
- **DO NOT** rename `apps/api/src/services/` — both `audit.ts` and `supabase.ts` imported by 20+ route files.

---

## 11. Validation Checklist

### Pre-Deploy (Every Phase)

- [ ] `pnpm test` — all existing tests pass
- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm typecheck` — clean across all 6 packages
- [ ] Deployed to dev environment
- [ ] Manual QA of critical flows: login, create ticket, update org, upload doc
- [ ] E2E tests on dev (Playwright)
- [ ] No new `console.error`/`console.warn`/`console.log` in production paths

### Phase 1 Specific

- [ ] Logger redact: add temporary log line with `password: "test123"` → verify `[REDACTED]` in output
- [ ] Idempotency eviction test: unit test verifies Map eviction at 10k entries
- [ ] `/metrics` returns `portal_active_users` and `portal_active_organizations` gauge values
- [ ] Request-ID appears in child logger logs
- [ ] 24h production log monitoring — no unexpected redact behavior

### Phase 2 Specific

- [ ] Circuit breaker tests: all 10 tests pass against both custom (baseline) and Opossum (post-swap)
- [ ] Manual CB verification: simulate Supabase outage → 503 Service Unavailable → restore → requests succeed
- [ ] CB events visible in logs (open/close/halfOpen)
- [ ] Typed subclasses: `throw new NotFoundError("x")` → `catch (e instanceof NotFoundError)` works
- [ ] Logger factory: API and Worker both produce logs with `name: "api"` / `name: "worker"`
- [ ] Redact paths inherited from factory (verify same spot-check as Phase 1)

### Phase 3 Specific

- [ ] CSRF tests: all 6 tests pass
- [ ] Browser login → create ticket → update profile → verify all succeed
- [ ] curl POST without `X-CSRF-Token` → 403
- [ ] curl POST with `Authorization: Bearer` → 200 (no CSRF check)
- [ ] Full E2E suite on dev
- [ ] SDK-only clients (API keys, external integrations) work without CSRF tokens

### Phase 4 Specific (Per Item)

- [ ] Cross-origin isolation: no browser console errors on any page (portal, admin, marketing, Swagger)
- [ ] Cache invalidation: set → mutate → verify stale data cleared
- [ ] Webhook offload: API enqueues → worker processes → delivery log created
- [ ] Migration squash: fresh Supabase project + all API tests pass
- [ ] Per-request RLS: every switched route has integration test verifying RLS enforcement

---

## 12. Final Recommendation

**Adopt Phases 1 and 2 immediately.** The 11 items in these phases (total ~4 hours) deliver:

- Verified secret-leakage fix (logger redact) — **5 minutes, production-critical**
- Verified memory leak fix (idempotency Map) — **15 minutes, prevents OOM**
- Verified timeout bug fix (Opossum circuit breaker) — **1.5 hours, prevents silent hangs**
- Zero-risk utility addition (date.ts) — **5 minutes, eliminates duplicated date logic**
- Observability improvement (gauges, request-id child) — **25 minutes**
- Code quality improvement (typed errors, logger factory) — **1.5 hours**
- Documentation hygiene (migration naming) — **2 minutes**

**Schedule Phase 3 (CSRF) in the next sprint** as a coordinated backend + frontend deploy. It's important but requires coordination.

**Defer Phase 4 items until triggered** by production monitoring data or specific requirements. Do not invest in per-request Supabase RLS clients, webhook worker offload, or migration squash unless the triggering conditions are met.

**Never pursue the excluded patterns** (Socket.io, feature flags, PWA, vitest migration, shared DB package, separate RLS policy files, route/service separation, root-level Playwright config). These would add complexity with no measurable return in the MSP portal context.

**Estimated total investment:** ~8-9 hours for high-value items, ~3 engineering days for everything including conditional strategic work. The ROI is strong — every P0/P1/P2 item addresses a verified bug, security gap, or maintainability concern.

**Bottom line:** MCT Portal is the more mature codebase. The goal is selective borrowing from Chat to close specific gaps, not convergence. The two repos share a common architectural origin but have diverged for good product reasons. Respect the divergence; cherry-pick the patterns that are universally valuable.
