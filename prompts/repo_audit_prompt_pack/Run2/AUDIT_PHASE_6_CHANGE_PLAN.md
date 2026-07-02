# Phase 6 — File-by-File Change Plan

**Date:** 2026-07-02
**Audit Run:** Run2
**Reference Repo (Chat):** `C:\temp\chat`
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`

---

## 0. Execution Strategy Summary

All changes are grouped into 5 patch groups (P0–P4) that can be implemented sequentially with validation gates between each. Each patch group is independently testable, deployable, and rollbackable.

| Group                                                                                                    | Items | Effort          | Risk        | Validation Gate                |
| -------------------------------------------------------------------------------------------------------- | ----- | --------------- | ----------- | ------------------------------ |
| **P0** — Safety (logger redact, idempotency Map limit, date.ts)                                          | 3     | 25 min          | None        | `pnpm test` + lint + typecheck |
| **P1** — Observability + Hygiene (gauges, migration doc, requestId child, fix `console.log` in cache.ts) | 4     | 40 min          | None        | `pnpm test` + lint + typecheck |
| **P2** — Architecture Alignment (Opossum CB, typed errors, enrich `@mct/config`)                         | 3     | 3 hrs           | Low         | P2 validation gate (see §10)   |
| **P3** — Security (CSRF middleware)                                                                      | 1     | 1 hr + frontend | Medium      | P3 validation gate             |
| **P4** — Strategic (cache invalidation audit, cross-origin headers, webhook offload, etc.)               | 5     | 2-3 days        | Medium-High | Per-item gates                 |

**Total: ~3 engineering days, 16 items**

---

## 1. Highest-Priority Target Areas

### 1.1 Logger Redact: `apps/api/src/lib/logger.ts:6-19`

**What to change:** Add `redact.paths` configuration to the existing `pino()` call.

**From (current):**

```typescript
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { ... } } : undefined,
});
```

**To:**

```typescript
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "*.password", "*.secret", "*.token", "*.authorization", "*.cookie",
      "req.headers.authorization", "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { ... } } : undefined,
});
```

**What NOT to change:**

- All existing `logger.*()` call sites — no function signatures change
- The logger export name (`export const logger`)
- The env-based level logic
- The transport configuration for dev mode

**Source reference:** Chat's `packages/config/logger.ts:34-45` — copy verbatim

**Adoption style:** **copy as-is**

**Risk:** None — configuration only, no behavior change for non-sensitive data.

**Effort:** 5 minutes

---

### 1.2 Worker Logger Redact: `apps/worker/src/logger.ts`

**What to change:** Add same `redact.paths` to the worker's pino instance.

**From (current):**

```typescript
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: ...,
});
```

**To:** Same redact block as §1.1.

**What NOT to change:**

- The `process.env.LOG_LEVEL` fallback (no `getEnv()` in worker logger — by design, kept simple)
- The transport configuration

**Source reference:** Same as §1.1

**Adoption style:** **copy as-is**

**Effort:** 2 minutes

---

### 1.3 Idempotency Map Size Limit: `apps/api/src/lib/idempotency.ts:40-43`

**What to change:** Add a size-bound eviction check before `IN_MEMORY_FALLBACK.set()` on line 90.

**From (current, lines 90-93):**

```typescript
IN_MEMORY_FALLBACK.set(key, {
  value,
  expiresAt: Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000,
});
```

**To:**

```typescript
if (IN_MEMORY_FALLBACK.size >= 10_000) {
  const oldest = [...IN_MEMORY_FALLBACK.entries()]
    .sort(([, a], [, b]) => a.expiresAt - b.expiresAt)
    .slice(0, 2000);
  for (const [k] of oldest) IN_MEMORY_FALLBACK.delete(k);
}
IN_MEMORY_FALLBACK.set(key, {
  value,
  expiresAt: Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000,
});
```

**What NOT to change:**

- The TTL-based cleanup (the existing `expiresAt` check in `checkIdempotencyKey()` on lines 62-63)
- The Redis path (all existing Redis logic unchanged)
- The `checkIdempotencyKey()` function signature or behavior
- The `deleteIdempotencyKey()` function

**Source reference:** Adapted conceptually — neither repo has this fix. Chat has same vulnerability.

**Adoption style:** **adapt conceptually**

**Risk:** Low — eviction only triggers if Redis is unavailable for 24+ hours AND there are >10,000 idempotency keys. The evicted keys are the oldest, minimizing business impact.

**Test requirement:** Unit test: insert 10,001 entries, verify 11th triggers eviction and the oldest entry is removed.

**Effort:** 15 minutes

---

### 1.4 Add `date.ts` to `@mct/config`: `packages/config/src/date.ts` (NEW FILE)

**What to create:** New file `packages/config/src/date.ts` with 12 pure date utility functions copied verbatim from Chat.

**Contents:** Copy of `C:\temp\chat\packages\config\date.ts` (72 lines) — all functions: `toISOString`, `fromISOString`, `now`, `formatDuration`, `addDays`, `addHours`, `addMinutes`, `isPast`, `isFuture`, `startOfDay`, `endOfDay`, `diffInDays`, `diffInHours`, `diffInMinutes`.

**What to update in `@mct/config`:**

- Create `packages/config/src/date.ts` with the 72 lines
- Create `packages/config/index.ts` barrel export: `export * from "./src/date";`
- Update `packages/config/package.json` to add: `"./date": "./src/date.ts"` in the `exports` field, or simply point the main export to `./index.ts`

**What NOT to change:**

- Existing `5302xxx` migration files — do not rename
- Any existing inline `new Date()` / `Date.now()` calls — this is purely additive
- The `@mct/config` ESLint and tsconfig exports

**Source reference:** Chat's `packages/config/date.ts` — copy verbatim

**Adoption style:** **copy as-is**

**Risk:** None — pure functions with no dependencies, no side effects.

**Effort:** 5 minutes

---

## 2. Likely Files/Folders to Touch First

### First Wave (P0 — all Phase 1 items)

| Order | File                                | What                               | Effort |
| ----- | ----------------------------------- | ---------------------------------- | ------ |
| 1     | `apps/api/src/lib/logger.ts`        | Add redact paths                   | 5 min  |
| 2     | `apps/worker/src/logger.ts`         | Add redact paths                   | 2 min  |
| 3     | `apps/api/src/lib/idempotency.ts`   | Add Map eviction at 10,000 entries | 15 min |
| 4     | `packages/config/src/date.ts` (NEW) | Copy 12 date utilities             | 5 min  |
| 5     | `packages/config/index.ts` (NEW)    | Barrel re-export                   | 3 min  |
| 6     | `packages/config/package.json`      | Add exports entry for date module  | 2 min  |

### Second Wave (P1 — observability + hygiene)

| Order | File                                    | What                                                                          | Effort |
| ----- | --------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| 7     | `apps/api/src/lib/metrics.ts`           | Add `activeUsers` + `activeOrgs` gauges                                       | 15 min |
| 8     | `apps/api/src/middleware/request-id.ts` | Add `req.log = logger.child({ requestId: req.id })`                           | 5 min  |
| 9     | `apps/api/src/middleware/cache.ts`      | Replace `console.log`/`console.warn` with `logger`                            | 5 min  |
| 10    | `docs/migrations/naming-guide.md`       | Already documents ISO-date — verify and add note about existing 5302xxx files | 2 min  |

**File 9 detail:** Current `cache.ts` uses `console.log("Redis cache connected")` on line 32 and `console.warn(...)` on lines 34-36. Replace with `logger.info()` and `logger.warn()`. Import `logger` from `../lib/logger`.

---

## 3. Likely Files/Folders to Avoid Touching Early

### Never Touch (Do-Not-Break)

| File                                                      | Reason                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/api/src/middleware/auth.ts`                         | Local JWT verify + rotation logic. Core auth flow.                                                  |
| `apps/api/src/middleware/org-access.ts`                   | Primary tenant isolation barrier. All 8 entity routers depend on it.                                |
| `apps/api/src/config/env.ts`                              | Zod env schema. Do not move to shared package (Phase 3 §8.1 conclusion).                            |
| `apps/api/src/services/supabase.ts`                       | Supabase client factory with circuit breaker.                                                       |
| `apps/web/middleware.ts`                                  | Domain routing + JWT exp check + CSP nonce. Auth redirect flow.                                     |
| `infra/digitalocean/docker-compose.yml`                   | Production stack.                                                                                   |
| `apps/api/src/routes/*.ts` (all 25)                       | Route handlers — no changes needed. The alignment changes are in middleware/lib/config, not routes. |
| `packages/sdk/src/**`                                     | SDK is MCT's strength (108 tests). No alignment changes needed.                                     |
| `apps/web/app/(admin)/layout.tsx` + `(portal)/layout.tsx` | `force-dynamic` prevents prerender errors.                                                          |
| `supabase/migrations/*.sql`                               | Do not rename existing `5302xxx` files (breaks `supabase migration list`).                          |

### Defer to P4 or Later

| File                                              | Reason                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/api/src/lib/circuit-breaker.ts`             | Switch to Opossum is P2 — needs tests first (currently 0 CB tests).                                  |
| `apps/api/src/lib/http-client.ts`                 | Updates only if Opossum migration happens (P2). Constructor signature may need Opossum breaker type. |
| `apps/api/src/middleware/csrf.ts` (NEW)           | P3 — requires frontend coordination.                                                                 |
| `apps/web/components/**` (CSRF token handling)    | P3 — only if CSRF middleware is added.                                                               |
| `apps/worker/src/tasks/webhook-delivery.ts` (NEW) | P4 — only if webhook volume exceeds 100/min.                                                         |

---

## 4. Structural Cleanup Candidates

### 4.1 Replace `console.log` in `cache.ts`: `apps/api/src/middleware/cache.ts:32,34-36`

**What to change:** Lines 32 and 34-36 use `console.log` and `console.warn` instead of the pino logger.

**From:**

```typescript
console.log("Redis cache connected"); // line 32
console.warn("Failed to connect to Redis, falling back..."); // line 34-36
```

**To:**

```typescript
logger.info("Redis cache connected");
logger.warn({ err }, "Failed to connect to Redis, falling back to in-memory cache");
```

**What NOT to change:**

- Add `import { logger } from "../lib/logger"` at top of file
- The rest of the cache logic (211 lines) — no functional changes

### 4.2 Env Schema Exit Logging: `apps/api/src/config/env.ts:43-47`

**What to change:** Replace `console.error` before `process.exit(1)` with `logger.fatal()`.

**Current pattern (lines ~43-47):**

```typescript
console.error("Invalid environment variables:", ...result.error.issues);
process.exit(1);
```

**To:**

```typescript
import { logger } from "../lib/logger";
// ... inside the validation failure:
logger.fatal({ issues: result.error.issues }, "Invalid environment variables");
process.exit(1);
```

**Note:** This has a circular-import concern — `env.ts` is imported by `logger.ts`. Solution: either (a) inline `pino` in env.ts for the fatal path, or (b) skip this change if the circular import is problematic. **Recommendation:** Skip this change — `console.error` before `process.exit(1)` is acceptable (process is dying anyway). Low priority.

### 4.3 Dormant Root Config: `vercel.json`, root `docker-compose.yml`

**What to change:** Per Phase 5 §5.2 recommendation — move to `archive/` or remove after verification.

**What to verify first:**

- Are any CI workflows referencing `vercel.json`? (Check `deploy-to-vercel*` workflows — they were archived in earlier cleanup but verify no remaining references)
- Is root `docker-compose.yml` referenced by any script or doc?

**Recommendation:** Defer to P4. No urgency — these files are dormant and harmless.

---

## 5. UI/UX Alignment Candidates

**Finding:** MCT's UI is not a gap area — it has more features than Chat (admin panel, 16+ page directories, Storybook, Chromatic). No UI alignment changes recommended.

**Exception — CSRF Token Handling (P3):** If CSRF middleware is added (P3), the frontend must read the CSRF token from the `csrf_token` cookie (set on first GET response) and include it as `X-CSRF-Token` header on all mutation requests.

**Files to modify (only if CSRF is implemented):**

- `apps/web/lib/api.ts` — add `X-CSRF-Token` header read from `document.cookie` for server actions
- `apps/web/lib/client-api.ts` — add CSRF token extraction + injection for client-side SDK calls
- `apps/web/app/auth/callback/route.ts` — CSRF token may need to be set after login

**Recommendation:** Defer CSRF frontend work until P3. No CSRF changes in P0-P2.

---

## 6. API/Service Layer Alignment Candidates

### 6.1 Opossum Circuit Breaker: `apps/api/src/lib/circuit-breaker.ts` (P2)

**What to change:** Replace the custom `CircuitBreaker` class (124 lines) with Opossum-based implementation matching Chat's pattern.

**Detailed diff:**

**From (current — custom class):**

```
File apps/api/src/lib/circuit-breaker.ts — 124 lines
- CircuitBreaker class with manual state machine
- CircuitBreakerConfig, CircuitBreakerStats interfaces
- createSupabaseCircuitBreaker() factory
- execute() method that does NOT enforce timeout
- No events, no stats tracking, no shutdown()
```

**To (Opossum-based):**

```
File apps/api/src/lib/circuit-breaker.ts — ~120 lines (restructured)
- import CircuitBreaker from "opossum"
- getCircuitBreaker(name, fn, options): CircuitBreaker — registry pattern (Map)
- executeWithCircuitBreaker(name, fn, args, options): Promise<T> — wrapper
- getCircuitBreakerStats(): CircuitBreakerStats[] — reads breaker.stats
- resetCircuitBreaker(name): boolean
- shutdownAllCircuitBreakers(): void — calls breaker.shutdown() on all
- Event listeners (open, close, halfOpen, reject, timeout, failure) — log via pino
```

**What must be preserved for backward compatibility:**

1. `createSupabaseCircuitBreaker()` factory function — callers expect it
2. The circuit breaker Gauge in `metrics.ts` (`circuitBreakerStatus.set()`) — must still update

**Caller sites that must be updated:**
| File | Current Pattern | New Pattern |
|------|----------------|-------------|
| `apps/api/src/lib/http-client.ts:52` | `this.circuitBreaker.execute(() => fetch(...))` | `executeWithCircuitBreaker("http", () => fetch(...), ...)` or keep `breaker.fire()` via stored reference |
| `apps/api/src/services/supabase.ts:10` | `createSupabaseCircuitBreaker()` | Same factory name, but now returns Opossum breaker |
| `apps/api/src/lib/http-client.ts:30` | `this.config.circuitBreaker ?? createSupabaseCircuitBreaker()` | Same pattern |

**Critical compatibility note:** `http-client.ts:52` calls `circuitBreaker.execute()` which is the custom class method. Opossum uses `breaker.fire()` instead. The `HttpClient` class stores `this.circuitBreaker` as `CircuitBreaker` type. **Strategy:** Keep Opossum breaker as the underlying implementation. Either:

- (a) Wrap Opossum in a thin adapter that exposes `.execute(fn)` — cleanest, minimal caller changes
- (b) Change `http-client.ts` to use `breaker.fire()` — more invasive

**Recommendation:** Option (a) — 15-line adapter class:

```typescript
class CircuitBreakerAdapter {
  constructor(private breaker: OpossumBreaker) {}
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.breaker.fire(fn) as Promise<T>;
  }
  isAvailable(): boolean { return !this.breaker.opened || this.breaker.halfOpen; }
  getState(): CircuitState { ... }
}
```

**Source reference:** Chat's `apps/api/src/lib/circuit-breaker.ts` (120 lines, Opossum) — adapt the integration pattern. Do NOT copy Chat's `executeWithCircuitBreaker()` function signature if it differs from MCT's factory pattern.

**Adoption style:** **adapt conceptually**

**Effort:** 1.5 hours

---

### 6.2 Typed Error Subclasses: `apps/api/src/types/index.ts` (P2)

**What to change:** Add 9 typed error subclasses extending the existing `AppError`.

**Add after the existing `AppError` class (line 22):**

```typescript
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("BAD_REQUEST", message, 400, details);
  }
}
export class UnauthorizedError extends AppError { ... }     // 401, "UNAUTHORIZED"
export class ForbiddenError extends AppError { ... }         // 403, "FORBIDDEN"
export class NotFoundError extends AppError { ... }          // 404, "NOT_FOUND"
export class ConflictError extends AppError { ... }          // 409, "CONFLICT"
export class TooManyRequestsError extends AppError { ... }   // 429, "TOO_MANY_REQUESTS"
export class InternalServerError extends AppError { ... }    // 500, "INTERNAL_SERVER_ERROR"
export class ServiceUnavailableError extends AppError { ... } // 503, "SERVICE_UNAVAILABLE"
```

**What NOT to change:**

- The `success()`/`failure()` envelope — response format stays the same
- The existing `AppError` class — subclasses extend it
- The `ApiResponse`, `AuthUser`, `PaginationParams`, `PaginatedResult`, `AuthenticatedRequest` types

**What to update in `middleware/error.ts`:**

The current error handler at line 20 catches `error instanceof AppError` which catches all subclasses (since they extend AppError). **No changes needed to error handler** — `instanceof AppError` will still match all subclasses. However, add a `ZodError` check before `AppError` on line 20 (it's already there at line 31 — it's after AppError check, move it before):

**Reorder error handler checks:**

```
1. ZodError (400)
2. AppError (uses error.code + error.status)
3. Generic Error (500)
```

The current order is: AppError → ZodError → Generic Error. Since AppError catches everything now, the ZodError branch on line 31 is dead code if a ZodError somehow extends AppError (it doesn't, but the order implies ZodError is less specific). **Fix:** Move ZodError check before AppError check.

**Source reference:** Chat's `packages/config/errors.ts:1-89` — adapt conceptually (keep MCT's `success()`/`failure()` envelope for responses; add typed subclasses for internal `throw new NotFoundError(...)` usage).

**Adoption style:** **adapt conceptually**

**Effort:** 1 hour

---

### 6.3 Enrich `@mct/config` with Logger Factory: `packages/config/src/logger.ts` (NEW) (P2)

**What to create:** `packages/config/src/logger.ts` — shared pino logger factory.

**Pattern (adapted from Chat's `packages/config/logger.ts`):**

```typescript
import pino, { LoggerOptions } from "pino";
import pretty from "pino-pretty";

let instance: ReturnType<typeof pino> | null = null;

export function createLogger(name: string, opts?: { level?: string; pretty?: boolean }) {
  const isDev = process.env.NODE_ENV !== "production";
  const level = opts?.level ?? process.env.LOG_LEVEL ?? "info";

  const options: LoggerOptions = {
    level,
    name,
    redact: {
      paths: [
        "*.password",
        "*.secret",
        "*.token",
        "*.authorization",
        "*.cookie",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  };

  if (isDev && opts?.pretty !== false) {
    return pino(
      options,
      pretty({ colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" }),
    );
  }
  return pino(options);
}
```

**What to update:**

- `apps/api/src/lib/logger.ts` — refactor to call `createLogger("api")` from `@mct/config`
- `apps/worker/src/logger.ts` — refactor to call `createLogger("worker")`

**What NOT to change:**

- Any `logger.*()` call sites — the returned pino instance has same API
- The `@mct/config` package.json — add `pino` and `pino-pretty` as dependencies
- Do NOT move env schema into shared package (Phase 3 §8.1)

**Source reference:** Chat's `packages/config/logger.ts` — adapt conceptually. Chat uses singleton pattern; MCT's factory is better (explicit service name).

**Adoption style:** **adapt conceptually**

**Effort:** 1 hour

---

### 6.4 Active-User/Org Gauges: `apps/api/src/lib/metrics.ts` (P1)

**What to change:** Add two Prometheus gauges.

**Add after line 85 (`circuitBreakerStatus`):**

```typescript
export const activeUsers = new Gauge({
  name: "portal_active_users",
  help: "Number of users with activity in the last 24 hours",
  registers: [register],
});
export const activeOrgs = new Gauge({
  name: "portal_active_organizations",
  help: "Number of organizations with activity in the last 24 hours",
  registers: [register],
});
```

**Add helper functions after `setCircuitBreakerStatus()` (line 138):**

```typescript
export function setActiveUsers(count: number) {
  activeUsers.set(count);
}
export function setActiveOrgs(count: number) {
  activeOrgs.set(count);
}
```

**What to create (optional — periodic updater):** A setInterval in `main.ts` that queries `audit_logs` for distinct `actor_user_id` and `organization_id` in the last 24h and calls `setActiveUsers()`/`setActiveOrgs()`. Or expose this as a worker task.

**What NOT to change:**

- All existing 7 counters and their `record*()` helper functions
- The `register` export
- The Prometheus metrics endpoint (`GET /metrics`)

**Source reference:** Chat's `activeWorkspaces`/`activeUsers` gauges — adapt concept to MCT's domain.

**Adoption style:** **adapt conceptually**

**Effort:** 15 minutes

---

### 6.5 Request ID via `logger.child()`: `apps/api/src/middleware/request-id.ts` (P1)

**What to change:** After `req.id` is set, create a child logger with request context.

**Add after line 15 (`req.id = ...`):**

```typescript
(req as any).log = logger.child({ requestId: req.id });
```

**Add type declaration in the global block:**

```typescript
declare global {
  namespace Express {
    interface Request {
      id: string;
      log: typeof logger;
    }
  }
}
```

**What to optionally update (low priority):** Migrate `logger.info(...)` calls in route files to `req.log.info(...)` where request context is available. **Do NOT do this in P0/P1** — it's a large refactor (25 route files). Move to P4 if desired.

**What NOT to change:**

- The `requestLogger` middleware (lines 19-41) — it uses `logger[level]({ requestId: req.id, ... }, ...)` which already passes requestId explicitly. The `logger.child()` approach would let route handlers auto-inherit requestId instead of passing it manually.
- The `logger` module-level export — still available for non-request contexts (e.g., background tasks in API)

**Source reference:** Both repos lack this — adapt pino's `child()` pattern.

**Adoption style:** **adapt conceptually**

**Effort:** 10 minutes

---

### 6.6 CSRF Middleware: `apps/api/src/middleware/csrf.ts` (NEW) (P3)

**What to create:** Double-submit cookie CSRF middleware (copy from Chat, adapt to MCT's auth model).

**Detailed implementation spec:**

1. **Token generation:** `crypto.randomBytes(32).toString("hex")`
2. **Cookie setting:** On every GET/HEAD/OPTIONS response (safe methods), set `csrf_token` cookie:
   - `httpOnly: false` (client JS must read it)
   - `secure: process.env.NODE_ENV === "production"`
   - `sameSite: "strict"`
   - `maxAge: 24 * 60 * 60 * 1000` (24h)
3. **Token validation:** On every mutation (POST/PUT/PATCH/DELETE):
   - Read `X-CSRF-Token` header
   - Read `csrf_token` cookie
   - Compare using `crypto.timingSafeEqual()`
   - If mismatch or missing → 403 `{ success: false, error: { code: "CSRF_INVALID", message: "Invalid CSRF token" } }`
4. **Safe method passthrough:** GET, HEAD, OPTIONS are always allowed
5. **SDK bypass:** Only applies to cookie-based auth requests. `Authorization: Bearer` requests are not checked (SDK clients are external/native and not susceptible to CSRF).

**Registration in `apps/api/src/app.ts`:** Add after `cookieParser()` and before route mounting:

```typescript
import { doubleSubmitCookieCsrf } from "./middleware/csrf";
app.use(doubleSubmitCookieCsrf);
```

**What NOT to change:**

- The existing `cors()` configuration — CSRF is defense-in-depth, not a replacement for CORS
- The `mct_session` cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`) — keep as-is
- Any `Authorization: Bearer` auth paths — CSRF check should conditionally skip when `Authorization` header is present
- The error handler — CSRF middleware returns 403 directly before reaching the error handler

**Source reference:** Chat's `apps/api/src/middleware/csrf.ts:1-110` — adapt conceptually. Chat has two approaches (basic `csrfProtection` and `doubleSubmitCookieCsrf`). Use the `doubleSubmitCookieCsrf` pattern as MCT already has cookie-parser wired.

**Adoption style:** **adapt conceptually**

**Effort:** 1 hour (backend) + 2-4 hours (frontend token handling)

---

## 7. Shared Utility / Abstraction Candidates

### 7.1 `@mct/config` Package Enrichment

**Current state:** `packages/config/` has only ESLint config and `tsconfig.base.json`. No `src/` directory.

**Target state after P0-P2:**

```
packages/config/
├── src/
│   ├── date.ts          # (NEW) 12 date utilities from Chat
│   └── logger.ts        # (NEW) P2 — shared pino logger factory
├── index.ts             # (NEW) barrel re-export
├── eslint.mjs           # (existing)
├── package.json         # (updated) add pino + pino-pretty deps
├── tsconfig.base.json   # (existing)
└── tsconfig.json        # (existing)
```

**What each new file provides:**

| File            | Contents                                                    | Consumers                                           |
| --------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `src/date.ts`   | 12 pure date functions                                      | API routes (25 files), web components, worker tasks |
| `src/logger.ts` | `createLogger(name, opts?)` factory                         | API `lib/logger.ts`, Worker `logger.ts`             |
| `index.ts`      | `export * from "./src/date"; export * from "./src/logger";` | All above                                           |

**Package.json changes:**

```json
{
  "exports": {
    "./eslint": "./eslint.mjs",
    "./typescript": "./tsconfig.json",
    ".": "./index.ts",
    "./date": "./src/date.ts",
    "./logger": "./src/logger.ts"
  },
  "dependencies": {
    "pino": "^9.x",
    "pino-pretty": "^13.x"
  }
}
```

**Do NOT move into `@mct/config`:**

- Env schema (`apps/api/src/config/env.ts`) — per-app schemas are better (Phase 3 §8.1)
- Error types (`apps/api/src/types/index.ts`) — API-specific, worker doesn't need them
- The route files (`routes/*.ts`) — domain-specific

---

### 7.2 Cross-Origin Isolation Headers: `apps/api/src/middleware/security-headers.ts` (P4)

**What to change:** Add 3 headers after existing security header setup (line 11).

**Add between line 11 and line 14 (before nonce generation):**

```typescript
res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
```

**What to verify before deploying:**

- No external CDN scripts that would break under `same-origin` CORP
- If Swagger UI loads external unpkg.com resources, they must have `crossorigin` attribute or use `credentialless` COEP which allows them

**Current state:** Swagger UI already loads `unpkg.com` in the CSP. COEP `credentialless` allows cross-origin loads without credentials, so this should be compatible.

**Risk:** Low — COEP `credentialless` is permissive enough for most setups. COOP `same-origin` may break window.open popups (not used in MCT's portal). CORP `same-origin` is the strictest — verify no cross-origin images/fonts are loaded without CORS headers.

**Source reference:** Chat's security headers middleware (value exact match from Chat — COEP, COOP, CORP with same values).

**Adoption style:** **adapt conceptually**

**Effort:** 1 hour (including verification)

---

## 8. Test Coverage Needed Before Refactor

### 8.1 Circuit Breaker Tests: `apps/api/src/__tests__/circuit-breaker.test.ts` (NEW)

**Required before Opossum migration (P2):**

| Test | What to Verify                                                                    |
| ---- | --------------------------------------------------------------------------------- |
| 1    | `closed` state → `execute()` succeeds and returns result                          |
| 2    | `closed` state → consecutive failures exceeding threshold → opens                 |
| 3    | `open` state → `execute()` throws immediately without calling operation           |
| 4    | `open` state → after `resetTimeout` → transitions to `half-open`                  |
| 5    | `half-open` state → success increments counter → closes after threshold           |
| 6    | `half-open` state → any failure → reverts to `open`                               |
| 7    | Timeout enforcement: operation that exceeds configured timeout triggers failure   |
| 8    | Stats tracking: `getCircuitBreakerStats()` returns correct counts                 |
| 9    | `shutdownAllCircuitBreakers()` clears registry and shuts down all breakers        |
| 10   | Named breakers are cached: `getCircuitBreaker("same-name")` returns same instance |

**These tests apply to BOTH the custom implementation AND the Opossum replacement.** Run against custom first (to establish baseline), then run against Opossum (to verify behavioral parity).

**Effort:** 1 hour to write test file (~100-150 lines)

**Existing coverage:** 0 circuit breaker tests. This is a gap regardless of the Opossum decision.

---

### 8.2 CSRF Middleware Tests: `apps/api/src/__tests__/csrf.test.ts` (NEW)

**Required before CSMR deploy (P3):**

| Test | What to Verify                                                         |
| ---- | ---------------------------------------------------------------------- |
| 1    | GET request sets `csrf_token` cookie and passes through                |
| 2    | POST with valid `X-CSRF-Token` header matching cookie → 200            |
| 3    | POST without `X-CSRF-Token` header → 403                               |
| 4    | POST with mismatched `X-CSRF-Token` vs cookie → 403                    |
| 5    | POST with `Authorization: Bearer` (not cookie auth) → 200 (skip CSRF)  |
| 6    | Timing-safe comparison: different-length tokens don't leak timing info |

**Effort:** 30 minutes to write test file (~80 lines)

---

### 8.3 Idempotency Map Eviction Tests: `apps/api/src/__tests__/idempotency.test.ts` (NEW)

**Required before P0 idempotency fix:**

| Test | What to Verify                                                         |
| ---- | ---------------------------------------------------------------------- |
| 1    | Map with 9,999 entries accepts 10,000th without eviction               |
| 2    | Map with 10,000 entries → 10,001st triggers eviction of oldest entries |
| 3    | Evicted entries are the ones with earliest `expiresAt`                 |
| 4    | Non-evicted entries still return correct values                        |
| 5    | Redis path is unaffected (if Redis mock is available)                  |

**Effort:** 20 minutes to write test file (~60 lines)

---

### 8.4 Cache Invalidation Integration Tests (P4)

**Required before cache invalidation audit closes:**

| Test | What to Verify                                                                     |
| ---- | ---------------------------------------------------------------------------------- |
| 1    | Set cached value for organizations → create new org → verify cache is invalidated  |
| 2    | Set cached value for documents → update document → verify cache is invalidated     |
| 3    | Set cached value for projects → delete project → verify cache is invalidated       |
| 4    | Set cached value for roles → update role permissions → verify cache is invalidated |

**Note:** The existing `apps/api/src/__tests__/cache.test.ts` exists but may not cover invalidation. Read it to confirm.

**Effort:** 30 minutes per test file (4 tests, ~80 lines total)

---

## 9. Documentation / Runbook Improvements

### 9.1 Update `docs/migrations/naming-guide.md` (P1)

**Current state (lines 6-9):** Already documents ISO-date format (`YYYYMMDDHHMMSS`). Good!

**What to add:** A note about existing files.

**Add after line 9 (after the format description):**

```
Note on legacy migrations: Existing `5302xxx`-named migrations (22 files) use the
legacy sequential numbering convention. These are left unchanged to preserve
`supabase migration list` history. All NEW migrations should use the ISO-date
format documented above.
```

**What NOT to change:**

- The existing examples (they're all ISO-date format, which is correct for future migrations)
- The template, guidelines, or workflow sections

### 9.2 AGENTS.md Update (Post-Implementation)

After all patch groups are applied, update AGENTS.md with final audit status. No changes needed during implementation.

---

## 10. Safe Patch Grouping Proposal

### Patch Group P0 — Safety Wins (25 min, no risk)

**Contents:**

1. Logger redact — API (`apps/api/src/lib/logger.ts:6-19`)
2. Logger redact — Worker (`apps/worker/src/logger.ts:3-16`)
3. Idempotency Map size limit (`apps/api/src/lib/idempotency.ts:90-93`)
4. `date.ts` to `@mct/config` (`packages/config/src/date.ts` + `packages/config/index.ts` + `packages/config/package.json`)

**Validation gate:**

```bash
pnpm test        # 774 tests must pass
pnpm lint        # 0 errors
pnpm typecheck   # clean across all 6 packages
```

**Rollback:** Revert all 5 files. Time: 5 minutes.

---

### Patch Group P1 — Observability + Hygiene (40 min, no risk)

**Contents:**

1. Active-user/org Prometheus gauges (`apps/api/src/lib/metrics.ts:85-142`)
2. Request ID child logger (`apps/api/src/middleware/request-id.ts:13-17`)
3. Fix `console.log` → `logger` in cache.ts (`apps/api/src/middleware/cache.ts:32,34-36`)
4. Migration naming doc update (`docs/migrations/naming-guide.md`)

**Validation gate:** Same as P0. Additionally, verify `/metrics` endpoint returns new gauge values (spot-check via curl).

**Rollback:** Revert all 4 files. Time: 5 minutes.

**Dependency:** None on P0 (fully independent). Can be done in parallel with P0.

---

### Patch Group P2 — Architecture Alignment (3 hrs, low risk)

**Contents:**

1. Circuit breaker: Opossum switch (`apps/api/src/lib/circuit-breaker.ts`)
   - Write tests first (§8.1)
   - Run tests against current implementation (baseline)
   - Replace with Opossum
   - Run tests again (verify behavioral parity)
   - Update `apps/api/src/lib/http-client.ts` if adapter used
   - Update `apps/api/src/services/supabase.ts` if type changes
2. Typed error subclasses (`apps/api/src/types/index.ts:22-30`)
   - Reorder error handler in `apps/api/src/middleware/error.ts:7-48`
3. Enrich `@mct/config` with logger factory (`packages/config/src/logger.ts`)
   - Refactor `apps/api/src/lib/logger.ts` to use factory
   - Refactor `apps/worker/src/logger.ts` to use factory
   - Update `packages/config/package.json` with pino deps

**Validation gate:**

```bash
pnpm test        # 774+ tests must pass (incl. new CB tests)
pnpm lint        # 0 errors
pnpm typecheck   # clean
# Manual QA:
# 1. Simulate Supabase timeout → verify 503 via circuit breaker
# 2. Check logs confirm redact paths still work (via factory)
```

**To verify CB behavior manually (dev environment):**

```bash
# Temporarily set SUPABASE_URL to invalid URL
# Hit any API endpoint that calls Supabase
# Expected: 503 Service Unavailable after 5 failures
# Check /metrics for portal_circuit_breaker_status{name="supabase"} = 2 (open)
```

**Dependency:** P0 (logger factory depends on redact config from P0). P1 independent.

**Rollback:** 10 minutes (revert Opossum import, revert error types, revert logger factory).

---

### Patch Group P3 — CSRF Security (1 hr backend + frontend, medium risk)

**Contents:**

1. CSRF middleware (`apps/api/src/middleware/csrf.ts` — NEW)
2. CSRF registration in `apps/api/src/app.ts`
3. Write CSRF middleware tests (§8.2)
4. Frontend CSRF token handling:
   - `apps/web/lib/api.ts` — inject `X-CSRF-Token` from cookie
   - `apps/web/lib/client-api.ts` — inject header in SDK calls
   - Verify all mutation server actions send the header

**Validation gate:**

```bash
pnpm test        # all tests pass
# Manual QA:
# 1. Login → navigate portal → create ticket → verify success
# 2. Login → navigate admin → update user role → verify success
# 3. CURL without CSRF token → 403
# 4. CURL with Authorization: Bearer → 200 (no CSRF check)
# 5. E2E tests on dev environment (login → all CRUD flows)
```

**Dependency:** None on P0-P2. Can be done independently.

**Rollback:** Remove middleware from `app.ts`. Frontend reverts header injection. Time: 5 minutes.

**Deployment coordination:** Backend + frontend must deploy together. Users will get 403s on mutations if frontend doesn't send the CSRF token.

---

### Patch Group P4 — Strategic Improvements (2-3 days, as prioritized)

**Contents (in recommended order):**

| Order | Item                               | Files                                             | Effort | Gate                                        |
| ----- | ---------------------------------- | ------------------------------------------------- | ------ | ------------------------------------------- |
| 4.1   | Cache invalidation audit           | `apps/api/src/middleware/cache.ts` + route files  | 2 hrs  | Integration tests pass                      |
| 4.2   | Cross-origin isolation headers     | `apps/api/src/middleware/security-headers.ts`     | 1 hr   | E2E tests pass, no resource loading errors  |
| 4.3   | Supabase migration squash          | New single migration file                         | 2 hrs  | Fresh Supabase project + all API tests pass |
| 4.4   | Webhook delivery offload to worker | `apps/worker/src/tasks/webhook-delivery.ts` (NEW) | 1 day  | Volume > 100/min sustained                  |
| 4.5   | Per-request Supabase user client   | All 25 route files + `services/supabase.ts`       | 2 days | Security audit finding                      |

**Validation gate per item:** Items are independent. Each has its own test requirement before deploy.

---

## Appendix A: File Change Summary

| #   | File                                             | Action                          | Group | Effort |
| --- | ------------------------------------------------ | ------------------------------- | ----- | ------ |
| 1   | `apps/api/src/lib/logger.ts`                     | EDIT — add redact paths         | P0    | 5 min  |
| 2   | `apps/worker/src/logger.ts`                      | EDIT — add redact paths         | P0    | 2 min  |
| 3   | `apps/api/src/lib/idempotency.ts`                | EDIT — add Map eviction         | P0    | 15 min |
| 4   | `packages/config/src/date.ts`                    | CREATE — 72-line date utility   | P0    | 5 min  |
| 5   | `packages/config/index.ts`                       | CREATE — barrel export          | P0    | 3 min  |
| 6   | `packages/config/package.json`                   | EDIT — add exports + deps       | P0    | 2 min  |
| 7   | `apps/api/src/lib/metrics.ts`                    | EDIT — add 2 gauges             | P1    | 15 min |
| 8   | `apps/api/src/middleware/request-id.ts`          | EDIT — add child logger         | P1    | 10 min |
| 9   | `apps/api/src/middleware/cache.ts`               | EDIT — replace console.log      | P1    | 5 min  |
| 10  | `docs/migrations/naming-guide.md`                | EDIT — add legacy note          | P1    | 2 min  |
| 11  | `apps/api/src/__tests__/circuit-breaker.test.ts` | CREATE — 10 tests               | P2    | 1 hr   |
| 12  | `apps/api/src/lib/circuit-breaker.ts`            | REPLACE — Opossum               | P2    | 1.5 hr |
| 13  | `apps/api/src/lib/http-client.ts`                | EDIT — update if adapter needed | P2    | 15 min |
| 14  | `apps/api/src/types/index.ts`                    | EDIT — add 9 typed subclasses   | P2    | 30 min |
| 15  | `apps/api/src/middleware/error.ts`               | EDIT — reorder error checks     | P2    | 5 min  |
| 16  | `packages/config/src/logger.ts`                  | CREATE — logger factory         | P2    | 30 min |
| 17  | `apps/api/src/__tests__/csrf.test.ts`            | CREATE — 6 tests                | P3    | 30 min |
| 18  | `apps/api/src/middleware/csrf.ts`                | CREATE — CSRF middleware        | P3    | 1 hr   |
| 19  | `apps/api/src/app.ts`                            | EDIT — register CSRF middleware | P3    | 2 min  |
| 20  | `apps/web/lib/api.ts`                            | EDIT — CSRF token header        | P3    | 30 min |
| 21  | `apps/web/lib/client-api.ts`                     | EDIT — CSRF token header        | P3    | 30 min |
| 22  | `apps/api/src/middleware/security-headers.ts`    | EDIT — add 3 headers            | P4    | 1 hr   |
| 23  | `apps/api/src/__tests__/cache.test.ts`           | EDIT — add invalidation tests   | P4    | 30 min |
| 24  | `apps/worker/src/tasks/webhook-delivery.ts`      | CREATE (if needed)              | P4    | 4 hrs  |

**Total files touched: 24 (6 new, 18 existing edits)**

---

## Appendix B: Dependency Graph Between Patch Groups

```
P0 ──┬──── (independent)
     │
P1 ──┤ (independent of P0)
     │
P2 ──┼── depends on P0 (logger factory uses redact config from P0)
     │
P3 ──┤ (independent of P0-P2 — can be parallel)
     │
P4 ──┼── independent items, each self-contained
```

**Parallelization:** P0 + P1 can be done simultaneously by different developers. P2 immediately after. P3 can be done in parallel with any group. P4 items are independent of each other and of P0-P3.

---

## Appendix C: Verification Checklist

Before each deploy to production:

- [ ] `pnpm test` — all existing tests pass
- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm typecheck` — clean across all 6 packages
- [ ] Deployed to dev environment
- [ ] 24h log monitoring (verify redact behavior)
- [ ] Manual QA of critical flows (login, create ticket, update org, upload doc)
- [ ] E2E tests on dev (Playwright)
- [ ] No new console.error/warn/log in production logs (from cache.ts fix)

**Post-deploy monitoring (first 24 hours):**

- [ ] No "REDACTED" appearing where sensitive data was legitimately expected
- [ ] Circuit breaker events appearing in logs (if Opossum deployed)
- [ ] /metrics returning new gauge values
- [ ] No 403 spikes from CSRF middleware (if deployed)
- [ ] No cross-origin isolation console errors in browser (if headers deployed)
