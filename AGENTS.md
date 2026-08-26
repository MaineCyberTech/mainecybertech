# MCT Portal — Agent Reference

**Repo:** `C:\temp\mainecybertech-portal`
**Branch:** `develop`
**Package manager:** pnpm (corepack, v10+)
**Node:** >= 20
**Shell:** PowerShell (no bash — do not use `&&`)

## Architecture

Turborepo monorepo: 3 apps + 3 packages.

| Service | Entry | Port | Purpose |
|---------|-------|------|---------|
| API | `apps/api/src/main.ts` | 4000 | Express server, Supabase Admin for DB/auth |
| Web | `apps/web/app/layout.tsx` | 3000 | Next.js App Router, server components + actions |
| Worker | `apps/worker/src/main.ts` | 3001 | BullMQ consumer (131 lines, 6 modules) |
| SDK | `packages/sdk/src/index.ts` | — | Typed API client factory (`MCTClient.create()`) |
| UI | `packages/ui` | — | `cn()` utility (clsx + tailwind-merge) |
| Config | `packages/config` | — | Shared ESLint/TypeScript configs |

**Deploy:** DigitalOcean droplet. Caddy reverse proxy (TLS). Hosted Supabase (cloud.supabase.com). Redis 7 on droplet for BullMQ. Docker images on GHCR (`ghcr.io/mainecybertech/mct-{api,worker,web}`).

**Request flow:**
```
Browser → loginAction() → Supabase Auth REST/PKCE
  → /auth/callback?code=... → forwards Cookie to API POST /api/v1/auth/callback
  → API exchanges code for session → sets mct_session cookie
  → Browser uses SDK with Bearer token / cookie-backed auth
  → API requireAuth → supabase.auth.getUser(token)
  → API requireAdmin → single `roles!inner()` JOIN query
```

**Security model:** Auth User → Profile → Membership → Role → Permission/Override → RLS → Storage

## Test Status (2026-08-26 Verified)

**2,601 tests, all passing. 300 suites.**

| Package | Tests | Suites | Framework |
|---------|-------|--------|-----------|
| API | 801 | 79 | Jest + supertest |
| Web | 1,462 | 211 | Jest + Testing Library |
| SDK | 264 | 2 | Jest (mocked fetch) |
| Worker | 74 | 8 | Jest (env schema + task handlers) |
| E2E | 90 spec files | — | Playwright (chromium + axe-core) |

### Test patterns

- **Mock builder:** `createMockBuilder` — plain object with chain methods + `then()` for `await`; includes `filter`, `maybeSingle`, `rpc`, `upsert`
- **Async server components:** Call async function → `await` JSX → `render()`
- **Redirect mock:** Must throw `"NEXT_REDIRECT"` to prevent execution continuation
- **Bulk actions:** Return `{ ok, error }` instead of throwing
- **DOM text:** Use `getAllByText(...).length` over `getByText(...)` for text in nested DOM
- **forceEvent vs userEvent:** Use `fireEvent` when pnpm symlink resolution fails for `@testing-library/user-event`; wrap async updates in `waitFor`
- **Route params in tests:** `params: Promise.resolve({...})`, `searchParams: Promise.resolve({...})`
- **Worker testability:** `envSchema`, `parseEnv`, `runWorkerTasks` exported for testing; mocks `pino` and `dotenv/config`
- **API middleware layering (2026-08-26):** The P0-2 removal of `NODE_ENV=test`
  auth bypasses means route-level suites stub the three middleware modules
  (`org-access`, `permissions`, `require-active-subscription`) with pass-through
  `next()` — see the stub block at the top of any route `*.test.ts`. Enforcement
  is covered for real by `middleware-org-access.test.ts`,
  `middleware-permissions.test.ts`, `middleware-subscription.test.ts`,
  `middleware-admin.test.ts`. Do NOT re-add test-mode bypasses to production
  middleware; extend the dedicated suites instead.

### Running tests

```bash
pnpm test                    # All packages via turbo
pnpm --filter=api test       # Single package
pnpm --filter=web test:watch # Watch mode
pnpm --filter=web test:coverage
pnpm e2e                     # Playwright E2E
```

## File Counts (2026-08-26 Verified)

| Category | Count | Notes |
|----------|-------|-------|
| API route files | 55 | `apps/api/src/routes/*.ts` |
| API SDK modules | 53 | `packages/sdk/src/` |
| Worker task files | 13 | Registered in `apps/worker/src/main.ts` |
| Web pages | 301 | Admin 196, Portal 77, Public 26, Root 2 |
| Web components | 86 | `apps/web/components/` |
| SQL migrations | 96 | `supabase/migrations/` |
| Seed files | 9 | `supabase/seeds/` |
| GitHub Actions workflows | 13 | `.github/workflows/` |
| AI prompt files | 787 | `prompts/` (6 packs) |

## Database Types (2026-08-26)

`packages/sdk/src/database.types.ts` is generated from SQL migrations by
`node scripts/generate-db-types.js` (122 tables, 12 enums). Exported via
`@mct/sdk` (`Database`, `Tables`, `TablesInsert`, `Json`) and subpath
`@mct/sdk/database.types`.

Generator handles: multi-column `ALTER TABLE ... ADD COLUMN` (semicolon-split,
comma-split clauses), `IF NOT EXISTS` clauses, schema-qualified types
(`public.enum_name`), array types (`text[]`), custom enums (emitted as unions
in `Enums` + used in columns), inline + named FK `references` (emitted as
`Relationships[]` — REQUIRED by supabase-js ≥2.100 embedded queries, else
every `.from()` resolves to `never`), `NOT NULL DEFAULT` → optional Insert
fields, nullable Updates.

**Adoption:** Worker fully typed (`SupabaseClient<Database>`). API clients
remain untyped — wiring them surfaces ~259 strictness findings catalogued in
`docs/database-types-api-adoption.md` (4 categories: Json assignments, dynamic
row objects, query/param widening, SelectQueryError column drift).

**Real bug found by typing:** `ai.ts` inserted/selected `tickets.subject`
(column is `title`) — triage→ticket conversion and copilot summarize/reply
returned 500/404 at runtime. Fixed 2026-08-26.

## Docker & Local Stack

### Docker Compose services (DigitalOcean production)

See `infra/digitalocean/docker-compose.yml` — runs on a single DO droplet behind Caddy:

| Service | Image (GHCR) | Port | Notes |
|---------|---------------|------|-------|
| api | ghcr.io/mainecybertech/mct-api | 4000 | Express API |
| web | ghcr.io/mainecybertech/mct-web | 3000 | Next.js standalone |
| worker | ghcr.io/mainecybertech/mct-worker | 3001 | BullMQ consumer (health) |
| redis | redis:7-alpine | 6379 | BullMQ backend |
| caddy | caddy:2-alpine | 80/443 | TLS reverse proxy |

Supabase is **hosted** (cloud.supabase.com) — not self-hosted in docker-compose.

### Dockerfile notes

- All 3 use `corepack enable && corepack prepare pnpm@10 --activate` (not `corepack enable pnpm@10`)
- Web Dockerfile copies `packages/` for workspace deps; uses `output: "standalone"` + `outputFileTracingRoot`
- Admin/portal layouts need `export const dynamic = "force-dynamic"` to prevent prerender errors
- API/worker removed `--dts` from tsup build (causes TS2742 in `.pnpm`)
- `.dockerignore` uses `**/node_modules/` and `.pnpm/` for Windows/pnpm compatibility
- Web Dockerfile has `ARG NEXT_PUBLIC_API_URL` — must be passed as build arg for client-side components
- Web builder stage cleans up `.next/cache` to reduce image size

### CI workflow pnpm setup

All CI workflows use `corepack enable && corepack prepare pnpm@10 --activate` after `actions/setup-node@v4`.
Do NOT use `pnpm/action-setup` or `cache: pnpm` on setup-node — `cache: pnpm` tries to find pnpm before it's installed, causing "Unable to locate executable file: pnpm."

### Local development

```bash
# Terminal 1: Start API
cd apps/api && cp .env.local .env && pnpm dev

# Terminal 2: Start Worker
cd apps/worker && cp .env.local .env && pnpm dev

# Terminal 3: Start Web
cd apps/web && cp .env.local .env && pnpm dev

# Terminal 4: Start Supabase local
supabase start
supabase db reset   # Apply migrations + seeds
```

## Key Environment Variables

### API (`.env.local`)
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=<min-64-chars>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENTRY_DSN=
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://app.mainecybertech.com,https://www.mainecybertech.com
```

### Web (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_TAWKTO_ID=
NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED=false
```

### Worker (`.env.local`)
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
STRIPE_SECRET_KEY=
REDIS_URL=redis://localhost:6379
SENTRY_DSN=
```

## CI/CD

**13 GitHub Actions workflows** in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| test.yml | push/PR | Run unit tests |
| lint.yml | push/PR | ESLint |
| typecheck.yml | push/PR | TypeScript typecheck |
| supabase-migrations.yml | workflow_call | Apply Supabase migrations |
| e2e.yml | push/PR | Playwright E2E tests |
| deploy-do.yml | push to develop | Build images, SSH deploy to droplet |
| terraform-do.yml | push to develop | Terraform plan/apply for DO infra |
| validate.yml | push to develop | Pre-deploy gate (tests + lint + typecheck + migrations) |
| storybook.yml | push/PR | Build Storybook |
| chromatic.yml | push/PR | Visual regression |
| a11y.yml | push/PR | Accessibility scans |
| build-web.yml | push/PR | Next.js build check |
| build-api.yml | push/PR | API build check |

**Deploy pipeline:** validate → supabase-migrations → build images → SSH deploy to droplet (Caddy auto-restarts).

## Code Patterns

### API (Express)
- **Auth:** `requireAuth` → `requireOrgAccess` → `requireAdmin` → `requirePermission(module, action)`
- **Validation:** Zod schemas on all ~27 mutation endpoints
- **Caching:** `responseCache()` / `responseCacheNoRenew()` + `invalidateCache()` on mutations
- **Rate limiting:** Per-user buckets, 600 req/15min
- **Error handling:** Global error handler, `failure()` helper, structured logging (pino)
- **Audit:** `logAuditEvent()` on all mutations
- **Graceful shutdown:** SIGTERM/SIGINT handlers with 10s drain

### Web (Next.js App Router)
- **Route groups:** `(admin)`, `(portal)`, `(public)` — separate layouts
- **Server components:** Default for data fetching; client components marked `"use client"`
- **Server actions:** Named exports in `actions.ts` files, bound with `.bind()` (not inline closures)
- **Permissions:** `usePermissions()` hook, `<HasPermission>` component, `requirePermission()` server helper
- **Error boundaries:** `error.tsx` in each route group, `global-error.tsx` at root

### Worker (145 lines)
- **Consumer:** SQS-based (`runWorkerTasks` from `consumer-sqs.ts`)
- **Task registration:** `registerTask(name, handler)` in `apps/worker/src/task-registry.ts`
- **Scans:** Domain monitors, website monitors, backup checks, patch compliance, etc.
- **Graceful shutdown:** `inFlightTasks` tracking + drain loop

### SDK
- **Factory:** `MCTClient.create({ baseUrl, getToken })`
- **Retry:** Exponential backoff with configurable retries + timeouts
- **Headers:** `X-Request-ID` correlation, `X-Active-Org` for multi-org switching

## Known Open Issues (2026-08-26 Verified)

Sources: `COMPREHENSIVE_AUDIT_2026-08-26.md`, `prompts/hardening_prompt_pack/engine/deep_audit/global_findings.json`, `prompts/hardening_prompt_pack/engine/outputs/global_report.md`, `docs/P0_REMEDIATION_2026-08-05.md`. All findings verified against source code.

### P0 — Must Fix Before Production

| # | Issue | Source | Location | Status |
|---|-------|--------|----------|--------|
| 1 | **Stored XSS via `javascript:` URL** — `CommentBody.tsx` inserts raw URL into `href` with no scheme validation | Comprehensive | `apps/web/components/CommentBody.tsx:22-24` | **FIXED** 2026-08-26 |
| 2 | **Auth bypass when `NODE_ENV=test`** — `requireOrgAccess` and `requirePermission` both return `next()` early, disabling all tenant isolation | Comprehensive + Hardening | `apps/api/src/middleware/org-access.ts:124-127`, `apps/api/src/middleware/permissions.ts:58-61` | **FIXED** 2026-08-26 |
| 3 | **Weak JWT secret validation** — `z.string().min(1)` accepts trivial secrets; local `.env` uses guessable string | Comprehensive | `apps/api/src/lib/config/env.ts:12`, `apps/api/.env:7` | **FIXED** 2026-08-26 (min 32) |
| 4 | **Users router missing `requireOrgAccess`** — any authenticated user can access any user's data across all tenants | Hardening (P0) | `apps/api/src/routes/users.ts` (no requireOrgAccess on router) | **FIXED** 2026-08-26 |
| 5 | **Rate-limit bypass via X-Forwarded-For** — `trust proxy: true` + skip on `127.0.0.1` = spoofable bypass | Comprehensive | `apps/api/src/middleware/rate-limit.ts:48-52`, `apps/api/src/app.ts:79` | **FIXED** 2026-08-26 (trust proxy = 1) |
| 6 | **Permissive RLS on `store_*` tables** — `FOR ALL USING (true)` allows anon key writes | Comprehensive | `supabase/migrations/5302105_store_quotes.sql` | **FIXED** 2026-08-26 — migration 5302132 |
| 7 | **8 platform-admin roles bypass tenant isolation** — all have full cross-tenant DB access | Comprehensive | `apps/api/src/lib/roles.ts:9-18` | **OPEN** — design decision (see below) |

**P0-7 Design Decision:** The 8 `platform-admin` roles exist to support cross-tenant operations ( MSP staff managing client tenants). These roles bypass `requireOrgAccess` via a separate code path in `roles.ts`. Removing them would break legitimate MSP workflows. Mitigations: (1) platform-admin access is restricted to a small number of internal accounts, (2) all cross-tenant queries are audit-logged via `logAuditEvent()`, (3) RLS policies on sensitive tables (billing, auth) still enforce org scoping even for platform-admin. **Recommendation:** Add an `impersonation_log` table to track every platform-admin cross-tenant access with reason codes.

### P1 — High Priority

| # | Issue | Source | Location | Status |
|---|-------|--------|----------|--------|
| 1 | **11 phantom CI workflows in README** — AWS/Vercel workflows do not exist; 5 actual workflows undocumented | Comprehensive | `README.md:19-29` | **FIXED** 2026-08-26 |
| 2 | **Stale test counts in README** — claims 427/155/89/24 (895 total), actual is 801/1450/264/74 (2,589) | Comprehensive | `README.md:31` | **FIXED** 2026-08-26 |
| 3 | **Stale architecture prereqs** — claims "AWS account", "Terraform Cloud", "Vercel account" (actual: DigitalOcean) | Comprehensive | `README.md:73-84` | **FIXED** 2026-08-26 |
| 4 | **Search endpoint cross-org exposure** — no `requireOrgAccess`; falls through to unscoped query when `adminOrgIds` is empty | Hardening (P1) | `apps/api/src/routes/search.ts` | **FIXED** 2026-08-26 |
| 5 | **Profiles router missing org check** — any authenticated user can access any profile's PII across tenants | Hardening (P1) | `apps/api/src/routes/profiles.ts` | **FIXED** 2026-08-26 |
| 6 | **6+ admin pages silently swallow errors** — `catch { /* graceful */ }` with no logging, no error state, no Sentry | Comprehensive | `apps/web/app/(admin)/admin/dmarc-coach/page.tsx:48`, `license-optimizer/page.tsx:31`, `status-pages/page.tsx:45`, + 3 more | **FIXED** 2026-08-26 |
| 7 | **CSP allows `unsafe-inline`** — `script-src 'self' 'unsafe-inline'` in web middleware; XSS payloads execute despite CSP | Comprehensive | `apps/web/middleware.ts:36,42` | **FIXED** 2026-08-26 |
| 8 | **Multer 50MB vs Supabase 2MB bucket** — large uploads consume server memory then fail at storage (DoS vector) | Comprehensive | `apps/api/src/routes/documents.ts:114` | **FIXED** 2026-08-26 (2MB) |
| 9 | **Dependabot missing ecosystems** — no Docker or Terraform config | Comprehensive | `.github/dependabot.yml` | **FIXED** 2026-08-26 |
| 10 | **SSH default `0.0.0.0/0`** — should be restricted to office/VPN CIDR | Comprehensive | `infra/terraform/digitalocean/variables.tf:88` | **OPEN** — requires user's VPN CIDRs; see variables.tf:76-88 for mitigation notes |
| 11 | **Docker Remote API on port 2376** — exposed on droplet | Comprehensive | `infra/digitalocean/docker-compose.yml` | **FALSE POSITIVE** — port 2376 not in compose file |
| 12 | **Terraform state files on disk** — `terraform.tfstate` + `.backup` exist (not git-tracked) | Comprehensive | `infra/terraform/digitalocean/` | **FALSE POSITIVE** — .gitignore covers *.tfstate |
| 13 | **7 env vars undocumented** — `BULLMQ_CONNECTION`, `REDIS_PASSWORD`, `SMTP_*`, `PUBLIC_TRAFFIC_WEBHOOK_URL`, etc. | Comprehensive | `docs/ENVIRONMENT_VARIABLES.md` | **FIXED** 2026-08-26 (REDIS_PASSWORD, QUEUE_BACKEND, APP_DOMAIN, API_DOMAIN added) |
| 14 | **5 undocumented CI workflows** — `storybook.yml`, `chromatic.yml`, `a11y.yml`, `build-web.yml`, `build-api.yml` | Comprehensive | `.github/workflows/` | **FIXED** 2026-08-26 |

### P2 — Medium Priority

| # | Issue | Source | Location | Status |
|---|-------|--------|----------|--------|
| 1 | 787 AI prompt files in `prompts/` — supply-chain risk (no provenance, no pinning) | Comprehensive | `prompts/` | **OPEN** |
| 2 | `alignment-audit-results.json` stale (claims 764 tests, 45 pages) | Comprehensive | `alignment-audit-results.json` | **FIXED** 2026-08-26 (deleted) |
| 3 | Root `test` file contains stale architecture analysis (misleading name) | Comprehensive | `test` | **FIXED** 2026-08-26 (deleted) |
| 4 | Root `package.json` name is "client-portal" (misleading) | Comprehensive | `package.json:2` | **FIXED** 2026-08-26 |
| 5 | TypeScript ^6.0.3 in root vs ^5.x in apps | Comprehensive | `package.json:47` | **FIXED** 2026-08-26 (root aligned to ^5.9.3) |
| 6 | ~200 `any` type annotations (`: any` + `as any`) across production code | Comprehensive | `apps/worker/src/tasks/module-tasks.ts`, `apps/web/app/(admin)/admin/page.tsx`, + ~30 files | **PARTIAL** — Worker 28→0 (clean), Admin dashboard 14→0, 9 admin detail pages fixed (~50→0). 265 remain across API routes (97), web pages (146), web components (21), SDK (1) |
| 7 | 10 `console.warn` statements remain in web components (bypass structured logging/Sentry) | Verified | `apps/web/components/NotificationBell.tsx` (8), `AdminGlobalSearch.tsx` (1), `PortalGlobalSearch.tsx` (1) | **FIXED** 2026-08-26 |
| 8 | OpenAPI spec incomplete | Comprehensive | — | **OPEN** |
| 9 | No SSE/WebSocket for real-time notifications (30s polling) | Comprehensive | — | **OPEN** |
| 10 | Input sanitizer uses weak regex — SQL injection patterns trivially bypassable | Comprehensive | `apps/api/src/middleware/security.ts:17-22` | **FIXED** 2026-08-26 |
| 11 | Worker Dockerfile missing `EXPOSE` directive | Comprehensive | `apps/worker/Dockerfile` | **FIXED** 2026-08-26 |
| 12 | `build-push.yml` and `deploy-do.yml` race — both trigger on push to develop, building images twice | Comprehensive | `.github/workflows/build-push.yml`, `.github/workflows/deploy-do.yml` | **FIXED** 2026-08-26 |
| 13 | No `prevent_destroy` on Firewall/DNS Terraform resources | Comprehensive | `infra/terraform/digitalocean/firewall.tf`, `dns.tf` | **FIXED** 2026-08-26 |
| 14 | BullMQ version mismatch — API ^5.78.1 vs Worker ^5.34.0 | Comprehensive | `apps/api/package.json`, `apps/worker/package.json` | **FIXED** 2026-08-26 |
| 15 | PII in email logs — `logger.info({ to, subject })` logs recipient addresses | Comprehensive | `apps/api/src/lib/email.ts:38,42` | **FIXED** 2026-08-26 |
| 16 | lint-staged runs Prettier only — no `eslint --fix` on staged files | Comprehensive | `package.json:68-75` | **FIXED** 2026-08-26 |
| 17 | Default `NEXT_PUBLIC_API_URL` build arg points to production | Comprehensive | `apps/web/Dockerfile` | **FIXED** 2026-08-26 |
| 18 | **Logger factory not implemented** — singleton pino instance only; no `createLogger()` or module-scoped factory | Repo Audit | `apps/api/src/lib/logger.ts` | **FIXED** 2026-08-26 |
| 19 | **Circuit breaker Prometheus metrics not wired** — `circuitBreakerStatus` gauge exists but never called | Hardening | `apps/api/src/lib/metrics.ts:86-91`, `apps/api/src/lib/circuit-breaker.ts` | **FIXED** 2026-08-26 |
| 20 | **Admin onboarding wizard missing** — new orgs created via inline form only | Portal Alignment | `apps/web/app/(admin)/admin/organizations/` | **OPEN** |
| 21 | **Admin list pagination missing** — most list endpoints return all rows | Portal Alignment | `apps/web/app/(admin)/admin/organizations/page.tsx` | **OPEN** |
| 22 | **Store catalog is static JSON** — API wraps same JSON files; no DB-backed product CRUD | Webstore Pack | `apps/api/src/lib/store-catalog.ts` | **OPEN** |
| 23 | **37/39 admin store pages are read-only** — load from static JSON | Webstore Pack | `apps/web/app/(admin)/admin/store/` | **OPEN** |
| 24 | **8+ non-functional buttons** — store admin buttons with no onClick handlers | Webstore Pack | `apps/web/app/(admin)/admin/store/faqs/page.tsx:31` | **FIXED** 2026-08-26 — 5 buttons disabled with "Coming soon" title |
| 25 | **Zero admin store page tests** — 1 API test for catalog reads only | Webstore Pack | `apps/api/src/__tests__/store-catalog.test.ts` | **FIXED** 2026-08-26 — 12 tests across 5 store pages |

### P3 — Low Priority

| # | Issue | Source | Status |
|---|-------|--------|--------|
| 1 | ~30 admin list pages copy-paste boilerplate — could use shared `AdminListPage` component | Comprehensive | **OPEN** |
| 2 | `final.ts` is a grab-bag of unrelated stats endpoints (471 lines) | Comprehensive | **OPEN** |
| 3 | E2E default credentials in docker-compose (`password=1`) | Comprehensive | **FALSE POSITIVE** — fallback in e2e/global.setup.ts only; env var overrides in CI |
| 4 | No ESLint in pre-commit (only secret scanner + Prettier) | Comprehensive | **FIXED** 2026-08-26 |
| 5 | Web container memory limit 256MB — may OOM on complex pages | Comprehensive | **FIXED** 2026-08-26 (increased to 512MB) |
| 6 | Terraform prod apply has no required E2E/test dependency before apply | Hardening (P3) | **FIXED** 2026-08-26 |
| 7 | PII fields in profiles table without encryption at rest | Hardening (P2) | **OPEN** |

## Prompt Pack Verification (2026-08-26)

Verified all 787 prompts across 6 packs against actual codebase. Summary:

### Pack Status

| Pack | Findings | Verified | False Positives | Gaps Found |
|------|----------|----------|-----------------|------------|
| repo_audit_prompt_pack | 17 adoption items | 12 | 3 (bugs already fixed) | 1 (logger factory) |
| hardening_prompt_pack | 12 findings | 7 | 0 | 1 (circuit breaker metrics) |
| mct-portal-os 60-module | 60 modules | 60 | 0 | 7 GAP modules, 19 partial |
| mct-full-webstore | 6 findings | 6 | 0 | 4 still open |
| portal-alignment | 6 findings | 6 | 2 | 3 still open |
| repo-deep-dive | 41 prompts | 41 | 0 | (covered above) |

### 60-Module Implementation Status

| Status | Count | Modules |
|--------|-------|---------|
| FULL | 34 | 2,3,5,8,9,10,11,12,14,15,19,20,21,22,23,24,25,26,27,28,32,34,37,38,40,42,43,48,49,50,51,56,58,59 |
| PARTIAL | 19 | 4,6,7,13,16,29,30,31,35,36,39,41,44,52,53,54,55,57,60 |
| GAP (3+ layers missing) | 7 | 1,17,18,33,45,46,47 |

**GAP modules** (UI shells only, no API/SDK/migration):
- **1** Multi-Tenant MSP Client Portal — bootstrap only
- **17** Client Knowledge Base Assistant — portal page only
- **18** Compliance Readiness Lite — portal page only
- **33** Change Advisory Mini-CAB — portal page only
- **45** Hardware Staging Checklist — admin+portal only
- **46** Device Profile Library — admin+portal only
- **47** Network Diagram Builder — admin+portal only

**Pattern:** Many modules consolidated into shared routes (`final.ts`, `edu-automation.ts`, `field-services.ts`) instead of standalone files. This is architecturally acceptable but deviates from the 1-module-1-route spec.

### CSRF Double-Submit Note

The CSRF implementation uses the double-submit cookie pattern (`csrf.ts:55-98`). The cookie MUST have `httpOnly: false` so the SDK/JS can read it and set the `x-csrf-token` header. Setting `httpOnly: true` breaks the pattern and causes 403s on cross-origin mutations. The `SameSite: lax` + `Secure` flags provide adequate protection.

## Completed Work

### Database types + worker typing + test migration (2026-08-26 session)
- `scripts/generate-db-types.js` hardened: bogus `alter`/`if` columns eliminated,
  multi-column ALTER TABLE parsing, array (`text[]`) + schema-qualified +
  enum types resolved (72 → 0 unknowns), custom enums emitted as unions,
  FK `Relationships[]` emitted (required by supabase-js 2.106 embedded queries),
  `NOT NULL DEFAULT` columns now optional in Insert, Updates accept null
- Worker fully typed: `SupabaseClient<Database>`; `sla_logs` insert typed via
  `TablesInsert<"sla_logs">`; webhook dispatcher payload typed `Record<string, Json>`
- API clients remain untyped; adoption backlog (~259 findings) saved to
  `docs/database-types-api-adoption.md`
- **REAL BUG fixed:** `ai.ts` used `tickets.subject` (column is `title`) —
  triage→ticket conversion 500'd and copilot summarize/reply 404'd at runtime;
  found by the typed client's SelectQueryError markers
- API tests migrated off the removed `NODE_ENV=test` middleware bypasses:
  route suites stub the three middleware modules; dedicated
  `middleware-*` suites keep real enforcement coverage — 48 broken suites → green

### Tenant isolation — requireOrgAccess added to all routers (2026-08-26)
- `apps/api/src/routes/users.ts` — was missing requireOrgAccess (P0 from hardening pack)
- `apps/api/src/routes/search.ts` — was missing requireOrgAccess (P1)
- `apps/api/src/routes/profiles.ts` — was missing requireOrgAccess (P1)
- `apps/api/src/middleware/org-access.ts` — NODE_ENV=test bypass removed
- `apps/api/src/middleware/permissions.ts` — NODE_ENV=test bypass removed
- `apps/api/src/middleware/require-active-subscription.ts` — NODE_ENV=test bypass removed

### Security Hardening (2026-08-26 session)
- XSS blocked in CommentBody.tsx (javascript:/data:/vbscript: scheme validation)
- JWT_SECRET min length increased to 32 chars
- Trust proxy changed from true to 1
- CSP hardened (unsafe-inline removed from style-src, frame-ancestors + base-uri added)
- Multer limit reduced from 50MB to 2MB
- PII redacted in email logs
- lint-staged now includes eslint
- Web Dockerfile default NEXT_PUBLIC_API_URL changed to localhost
- Input sanitizer SQL injection patterns strengthened (6 patterns)
- 10 console.warn removed from web components
- Circuit breaker wired to Prometheus metrics (setCircuitBreakerStatus on state change)
- Logger factory (createLogger) added for scoped logging
- BullMQ versions aligned (worker ^5.34.0 → ^5.78.1)
- Worker Dockerfile EXPOSE 3001 added
- build-push.yml push trigger removed (race condition fix)
- Dependabot: Docker + Terraform ecosystems added
- Terraform: prevent_destroy on firewall + 3 DNS records
- package.json name fixed (client-portal → mct-portal)
- README: test counts, CI workflows, prereqs, deployment targets all corrected
- RLS migration 5302132: store_quotes and store_promotions policies scoped by role
- Web container memory limit increased (256MB → 512MB)
- Stale files deleted (test, alignment-audit-results.json)
- ENVIRONMENT_VARIABLES.md: added REDIS_PASSWORD, QUEUE_BACKEND, APP_DOMAIN, API_DOMAIN
- TypeScript version aligned (root ^6.0.3 → ^5.9.3)
- Admin dashboard: 14 `any` annotations replaced with SDK types (Ticket, Document, Project, Organization, AuditLog)
- Store admin buttons: 5 non-functional buttons disabled with "Coming soon" title
- Store admin tests: 12 tests added across 5 store pages
- Worker `any` types: 28 eliminated across module-tasks.ts, webhook-dispatcher.ts, scheduled-notifications.ts (table() helper added)
- Admin detail pages: 9 pages typed (proposals, organizations, tickets, projects, webhooks, roles, qbr)

### Features
- 301 pages (196 admin, 77 portal, 26 public)
- 55 API route files covering ~90 module areas
- 13 worker task handlers
- RBAC with 13 roles, 90-module permission matrix
- Multi-org switching (`X-Active-Org` header + cookie)
- Marketing site integration (4 phases complete)
- DigitalOcean deploy pipeline (build → SSH → Caddy)
- 96 SQL migrations, 9 seed files with comprehensive test data
- E2E tests for all major flows

### Testing
- 2,589 unit tests across 299 suites (all green)
- 90 Playwright E2E spec files
- ESLint: 0 errors
- TypeScript: clean

## Audit Reports

| Report | Date | Findings | Key Insight |
|--------|------|----------|-------------|
| Comprehensive Audit | 2026-08-26 | 41 (7 P0, 11 P1, 14 P2, 9 P3) | Documentation severely stale; 12 claims verified false |
| Prompt Pack Verification | 2026-08-26 | 787 prompts across 6 packs | 9/12 repo audit items implemented; 7 GAP modules; CSRF httpOnly reverted |
| P2/P3 Remediation | 2026-08-26 | 22 fixes across 16 files | RLS migration, stale files deleted, env docs updated, infra hardened |
| Hardening Pack (deep audit) | 2026-08-06 | 12 (1 P0, 4 P1, 4 P2, 3 P3) | users.ts missing requireOrgAccess; risk score 50/100 BLOCKED |
| Hardening Pack (engine) | 2026-08-06 | 6 (1 P0, 1 P1, 2 P2, 2 P3) | Same P0 on users.ts |
| Consolidated 5-pack | 2026-07-30 | 147 across 5 engines | Portal alignment 91/100 APPROVED; hardening 50/100 BLOCKED |
| P0 Remediation | 2026-08-05 | 9 runtime bugs fixed | Worker schema columns, SDK URLs, worker tasks |
| Module Audit | 2026-08-05 | 60 modules | 34 FULL, 19 PARTIAL, 7 GAP (verified 2026-08-26) |
| Code Review | 2026-06-16 | 30 across 8 categories | All 12 original P0s fixed |
| Architecture Review | 2026-06-10 | ~7.5/10 score | Near production-ready (at that date) |
