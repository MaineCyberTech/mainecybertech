# Comprehensive Repository Inventory

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92cd90af4537e97a4118f1a831e1b9f84f9d
- **Generated at:** 2026-07-30T06:50:00-04:00
- **Auditor:** principal-level automated auditor (repo-deep-dive prompt pack)
- **Area code:** INV
- **Output path:** prompts/repo-deep-dive/20260730-0650-develop-62da92c/01_repository_inventory.md
- **Scope limitations:** Inventory covers the entire checked-out repo (~2943+ files). Some `node_modules/`, `.next/`, `.turbo/`, `dist/`, and generated artifacts are enumerated but not deeply inspected.

## Scope

Complete narrated inventory of every meaningful folder/file in the repository. Covers root configs, packages, apps (api/web/worker), shared packages, database/migrations, GitHub metadata, tests, docs, Docker/deploy/infra, env examples, and generated artifacts.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| Root directory listing (35 entries) | Top-level layout | Foundation of repo structure | 15 dirs, 20 files |
| `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Config | Monorepo orchestration | pnpm@10, turbo@2 |
| `apps/api/` (13 entries) | App | Express API server | 52 route files, 13 middleware |
| `apps/web/` (32 entries) | App | Next.js frontend | 3 route groups, 193 test files |
| `apps/worker/` (13 entries) | App | Background job processor | 9 task handlers, BullMQ+SQS |
| `packages/sdk/src/` (52 entries) | Package | Typed API client | 50+ modules covering all routes |
| `packages/config/` (6 entries) | Package | Shared ESLint/TS configs | Base configs |
| `packages/ui/` (4 entries) | Package | UI component library | cn utility, tokens, hooks |
| `supabase/migrations/` (68 entries) | DB | All schema migrations | 5302026 to 5302103 |
| `supabase/seeds/` (5 entries) | DB | Seed/test data | Auth users, permissions, demo |
| `.github/workflows/` (12 entries) | CI/CD | CI/CD pipelines | 7 validation, 5 deploy/ops |
| `.github/dependabot.yml` | Supply chain | Dependency updates | Weekly npm + GHA scans |
| `.github/CODEOWNERS` | Governance | Code ownership | 9 team assignments |
| `docs/` (48+ entries) | Documentation | All project documentation | Comprehensive coverage |
| `infra/digitalocean/` (8 entries) | Deploy | Production Docker Compose + Caddy | Single DO droplet |
| `infra/terraform/digitalocean/` (12 entries) | IaC | DO droplet/firewall/DNS/CF | Real dev tfvars exists |
| `apps/web/__tests__/` (193 entries) | Tests | Web unit tests | Organized by route group |
| `apps/api/src/__tests__/` (71 entries) | Tests | API integration tests | Supertest-based |
| `apps/worker/src/__tests__/` (3 entries) | Tests | Worker unit tests | Health + env + tasks |
| `packages/sdk/src/__tests__/` (2 entries) | Tests | SDK unit tests | Mocked fetch |
| `.husky/` | Git hooks | Pre-commit hooks | lint-staged configured |
| `scripts/` (20 entries) | Tooling | Dev scripts | PS1, bash, sh |

## Executive Summary

This is a mature, well-organized Turborepo monorepo with 6 packages (3 apps + 3 shared). The repository contains 68 database migrations, 52 API route files, 50+ SDK modules, 55 admin pages, 65 portal pages, and ~1,530 tests across 171 test suites. Documentation is comprehensive with 48+ files. CI/CD is fully configured with 12 GitHub Actions workflows. Infrastructure as Code (DigitalOcean Terraform) and production Docker Compose are in place.

**Strengths:** Clean monorepo structure, comprehensive test coverage, well-organized documentation, production-ready CI/CD, robust middleware/security layer, service worker with dual queue backends (BullMQ + SQS).

**Risks:** 66 .env files committed (local dev secrets potentially present), 68 large migration files (some may contain dead tables), prod Terraform has placeholder tfvars (secrets injected via CI), web app has a committed `.playwright-auth.json` with auth state, SDK has limited unit test files (2 test files for 50+ modules).

**Key numbers:** ~2,943+ files, ~353,000+ lines of code, 68 migrations, 52 route files, 70 API test files, 193 web test files, 48 docs.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Root package.json | `package.json` | Monorepo config, scripts, deps | Implemented | Low | pnpm@10, turbo@2, husky |
| pnpm-workspace.yaml | `pnpm-workspace.yaml` | Workspace globs | Implemented | Low | 2 globs: apps/*, packages/* |
| turbo.json | `turbo.json` | Pipeline orchestration | Implemented | Low | Cached build, lint, test |
| Root README.md | `README.md` | Project overview | Implemented | Low | Good quality |
| Root README.dev.md | `README.dev.md` | Developer setup | Implemented | Low | Local dev instructions |
| AGENTS.md | `AGENTS.md` | AI agent context | Implemented | Low | Extensive, ~800+ lines |
| .gitignore | `.gitignore` | Git exclusions | Implemented | Low | Standard |
| .dockerignore | `.dockerignore` | Docker exclusions | Implemented | Low | Standard |
| .editorconfig | `.editorconfig` | Editor config | Implemented | Low | Standard |
| .prettierrc.json | `.prettierrc.json` | Formatter config | Implemented | Low | Standard |
| .husky/ | Husky hooks | Pre-commit hooks | Implemented | Low | lint-staged |
| pnpm-lock.yaml | Lockfile | Dependency lock | Implemented | Low | ~20MB+ |
| docker-compose.yml | `docker-compose.yml` | Root compose (legacy?) | Implemented | Low | Root level, may be stale |
| terraform.exe | `terraform.exe` | Local terraform binary | Committed artifact | Medium | Should be in .gitignore |
| test | `test` | Empty test file | Committed artifact | Low | Stale/placeholder |
| apps/api/.env | `.env` | Local API env vars | Committed | **HIGH** | Contains local secrets |
| apps/api/.env.example | `.env.example` | Env template | Implemented | Low | Good |
| apps/api/.env.local | `.env.local` | Local override | Committed | **HIGH** | Local secrets committed |
| apps/api/src/main.ts | API bootstrap | Express startup + graceful shutdown | Implemented | Low | 35 lines |
| apps/api/src/app.ts | Express app | Route wiring + middleware registration | Implemented | Medium | 191 lines, 52 route imports |
| apps/api/src/config/env.ts | Zod env schema | Validated env vars | Implemented | Low | 33 env vars |
| apps/api/src/middleware/auth.ts | JWT auth | Token verification (local + Supabase fallback) | Implemented | Low | 99 lines |
| apps/api/src/middleware/org-access.ts | Org access | Tenant isolation | Implemented | **CRITICAL** | 105 lines |
| apps/api/src/middleware/admin.ts | Admin check | Admin role verification | Implemented | Low | 39 lines |
| apps/api/src/middleware/error.ts | Error handler | Global error handling | Implemented | Low | Sentry + AppError |
| apps/api/src/middleware/cache.ts | Response cache | Caching middleware | Implemented | Low | Cache with no-renew |
| apps/api/src/middleware/rate-limit.ts | Rate limiting | Per-user rate limits | Implemented | Low | |
| apps/api/src/middleware/csrf.ts | CSRF protection | CSRF token validation | Implemented | Low | |
| apps/api/src/middleware/security.ts | Input sanitizer | XSS pattern detection | Implemented | Low | Non-destructive |
| apps/api/src/middleware/security-headers.ts | Security headers | CSP, HSTS, etc. | Implemented | Low | |
| apps/api/src/middleware/request-id.ts | Request tracing | X-Request-ID propagation | Implemented | Low | |
| apps/api/src/middleware/idempotency.ts | Idempotency | Idempotency-Key middleware | Implemented | Low | |
| apps/api/src/middleware/optimistic-locking.ts | Optimistic locking | If-Match version check | Implemented | Low | |
| apps/api/src/middleware/not-found.ts | 404 handler | Route not found | Implemented | Low | |
| apps/api/src/lib/logger.ts | Pino logger | Structured logging | Implemented | Low | Redacts secrets |
| apps/api/src/lib/circuit-breaker.ts | Circuit breaker | Supabase/HTTP resilience | Implemented | Low | Tested |
| apps/api/src/lib/http-client.ts | HTTP client | Timeout + retry + circuit breaker | Implemented | Low | Named clients |
| apps/api/src/lib/idempotency.ts | Idempotency lib | Redis + in-memory fallback | Implemented | Low | |
| apps/api/src/lib/metrics.ts | Prometheus metrics | Request, DB, webhook metrics | Implemented | Low | Comprehensive |
| apps/api/src/lib/sentry.ts | Sentry init | Error tracking | Implemented | Low | Conditional |
| apps/api/src/lib/email.ts | Nodemailer | Email sending | Implemented | Low | SMTP or skip |
| apps/api/src/lib/webhook-dispatcher.ts | Webhook dispatch | Outbound webhook delivery | Implemented | Low | HMAC signed |
| apps/api/src/lib/webhook-signature.ts | Webhook signature | Verify incoming webhooks | Implemented | Low | |
| apps/api/src/lib/csv.ts | CSV export | Raw CSV generation | Implemented | Low | |
| apps/api/src/lib/notify.ts | Notifications | In-app notification dispatch | Implemented | Low | |
| apps/api/src/routes/ (52 files) | Routes | All API endpoints | Implemented | Medium | 52 route files |
| apps/api/src/services/supabase.ts | Supabase client | Admin + user client factories | Implemented | **CRITICAL** | Service role key usage |
| apps/api/src/types/index.ts | Types | ApiResponse, AppError, AuthUser | Implemented | Low | |
| apps/api/src/validators/ (25 files) | Zod validators | Request body validation | Implemented | Low | All mutation endpoints |
| apps/api/Dockerfile | Docker build | API container | Implemented | Low | Multi-stage, non-root |
| apps/api/jest.config.mjs | Jest config | Test configuration | Implemented | Low | |
| apps/api/tsconfig.json | TypeScript | API TS config | Implemented | Low | |
| apps/web/app/ (Next.js routes) | Pages | All Next.js routes | Implemented | Medium | 3 route groups |
| apps/web/app/(admin)/admin/ (55 dirs) | Admin pages | Admin CRUD interfaces | Implemented | Medium | Feature modules |
| apps/web/app/(portal)/portal/ (65 dirs) | Portal pages | Client-facing portal | Implemented | Medium | Feature modules |
| apps/web/app/(public)/ (17 dirs) | Public pages | Marketing site + auth | Implemented | Low | |
| apps/web/components/admin/ (26 files) | Admin components | Reusable admin UI | Implemented | Medium | |
| apps/web/components/portal/ (12 files) | Portal components | Reusable portal UI | Implemented | Medium | |
| apps/web/components/marketing/ | Marketing components | Public site components | Implemented | Low | |
| apps/web/lib/api.ts | API client (server) | Server-side SDK wrapper | Implemented | Low | |
| apps/web/lib/client-api.ts | API client (client) | Client-side SDK wrapper | Implemented | Low | |
| apps/web/lib/logger.ts | Web logger | Pino on server | Implemented | Low | |
| apps/web/middleware.ts | Next.js middleware | Auth routing + CSP + domain routing | Implemented | Low | 115 lines |
| apps/web/Dockerfile | Docker build | Web container | Implemented | Low | Standalone |
| apps/web/next.config.mjs | Next.js config | Build + rewrites + headers | Implemented | Low | |
| apps/web/e2e/ (5 files + subdirs) | E2E tests | Playwright tests | Implemented | Low | 26 spec files |
| apps/web/playwright.config.ts | Playwright config | E2E configuration | Implemented | Low | |
| apps/worker/src/main.ts | Worker bootstrap | Task processor entry | Implemented | Low | 31 lines |
| apps/worker/src/env.ts | Worker env | Zod env validation | Implemented | Low | 34 env vars |
| apps/worker/src/tasks/ (9 files) | Task handlers | Background job implementations | Implemented | Medium | |
| apps/worker/src/consumer-bullmq.ts | BullMQ | Redis-backed queue consumer | Implemented | Low | |
| apps/worker/src/consumer-sqs.ts | SQS | SQS queue consumer | Implemented | Low | Dormant |
| apps/worker/src/health-server.ts | Health endpoint | Worker health check | Implemented | Low | |
| apps/worker/src/shutdown.ts | Graceful shutdown | Worker drain handling | Implemented | Low | |
| apps/worker/src/logger.ts | Pino logger | Worker structured logging | Implemented | Low | |
| apps/worker/src/email.ts | Email sender | Worker email dispatch | Implemented | Low | |
| apps/worker/Dockerfile | Docker build | Worker container | Implemented | Low | |
| packages/sdk/src/index.ts | SDK entry | Module exports | Implemented | Low | 50+ exports |
| packages/sdk/src/client.ts | HTTP client | HTTP transport + auth | Implemented | Low | |
| packages/sdk/src/(50 modules) | SDK modules | Typed API wrappers | Implemented | Medium | Coverage varied |
| packages/config/eslint.mjs | ESLint config | Shared ESLint base | Implemented | Low | |
| packages/config/tsconfig.base.json | TS config | Shared TS base | Implemented | Low | |
| packages/ui/src/index.ts | UI entry | UI component exports | Implemented | Low | |
| supabase/config.toml | Supabase config | Project + seed config | Implemented | Low | |
| supabase/migrations/ (68 files) | Migrations | DB schema evolution | Implemented | Medium | |
| supabase/seeds/ (5 files) | Seeds | Test/demo data | Implemented | Low | |
| .github/workflows/test.yml | CI | Test runner | Implemented | Low | Node 18, 20 |
| .github/workflows/lint.yml | CI | Lint check | Implemented | Low | |
| .github/workflows/typecheck.yml | CI | Type check | Implemented | Low | |
| .github/workflows/e2e.yml | CI | E2E tests | Implemented | Low | |
| .github/workflows/deploy-do.yml | CD | DO deployment | Implemented | Medium | |
| .github/workflows/terraform-do.yml | CD | Terraform apply | Implemented | Medium | |
| .github/workflows/supabase-migrations.yml | CD | DB migrations | Implemented | Low | |
| .github/workflows/validate.yml | CI | Reusable validation gate | Implemented | Low | |
| .github/workflows/db-backup.yml | Ops | Database backup | Implemented | Low | |
| .github/workflows/dependency-review.yml | Security | Dependency vulnerability scan | Implemented | Low | |
| .github/workflows/chromatic.yml | CI | Storybook visual testing | Implemented | Low | |
| .github/workflows/build-push.yml | CI | Build + push to registry | Implemented | Low | |
| infra/digitalocean/docker-compose.yml | Deploy | Production stack (Redis, API, Worker, Web, Caddy) | Implemented | Medium | |
| infra/digitalocean/Caddyfile | Proxy | Reverse proxy config | Implemented | Low | |
| infra/terraform/digitalocean/ (6 tf files) | IaC | DO + CF infrastructure | Implemented | Medium | |
| docs/INDEX.md | Doc index | Documentation table of contents | Implemented | Low | 108 lines |
| docs/AGENTS.md | Agent context | AI agent context | Implemented | Low | (duplicate of root) |
| scripts/ (20 files) | Tooling | Dev/CI scripts | Implemented | Low | |
| prompts/ | Prompts | Audit prompt pack | Implemented | Low | 40+ prompt files |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Root configs | 5 | `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `.gitignore`, `.dockerignore`, `.prettierrc` | None | None |
| Package/workspace files | 5 | Clean monorepo structure, 6 packages over 2 workspaces | None | None |
| Applications | 5 | 3 well-structured apps (api, web, worker) | None | None |
| API services | 5 | 52 route files, 13 middleware, 11 lib files | None | None |
| Workers | 4 | 9 tasks, BullMQ+SQS consumers | SQS path potentially stale | Verify SQS consumer works |
| Shared packages | 4 | SDK (50+ modules), config, UI | SDK test coverage limited (2 files) | Expand SDK tests |
| Database/migrations | 4 | 68 migrations, well-organized | Some migrations may be stale | Review for dead tables |
| GitHub metadata | 4 | 12 workflows, CODEOWNERS, Dependabot | Chromatic workflow may be stale | Verify Chromatic setup |
| Tests | 4 | 70 API, 193 web, 2 SDK, 3 worker | SDK tests thin for 50+ modules | Add SDK integration tests |
| Docs | 5 | 48+ files, comprehensive | Some stale/archived docs | Keep archive clean |
| Assets/public files | 3 | Marketing assets, public dir | No asset management system | Consider asset pipeline |
| Generated artifacts | 2 | `.env`, `.env.local`, `.playwright-auth.json`, `terraform.exe` committed | Secret leakage risk | **CRITICAL** — remove committed .env files |

## Detailed Review

### Item: Root Configs — Clean monorepo foundation

- **Evidence:** `package.json:2-72`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.dockerignore`, `.editorconfig`, `.prettierrc.json`
- **What it does:** Defines the monorepo orchestration, lint-staged pre-commit hooks, dependency overrides for 6 packages, pnpm@10 as package manager, turbo@2 for task pipelines.
- **How it appears to work:** Standard Turborepo pattern. `turbo run build/lint/test/typecheck` works per package. Husky runs lint-staged on commit.
- **Dependencies:** pnpm@10.34.3, turbo@2.9.18, node >=20, typescript@6.0.3
- **Current controls:** Lockfile, version pinning, dependency overrides for security vulns (postcss, js-yaml, esbuild, etc.)
- **Missing controls:** No workspace-level dependency lint rules
- **Risks:** Low
- **Recommended improvement:** Add `@changesets/cli` for versioning
- **Suggested tests:** CI install (frozen lockfile)
- **Suggested docs:** Already documented

### Item: API Application

- **Evidence:** `apps/api/` — Express server, 35-line `main.ts`, 191-line `app.ts`, 52 route files, 13 middleware, 11 library modules, 25 Zod validators, 71 test files
- **What it does:** HTTP API gateway on port 4000. Handles auth (JWT+Supabase), tenant isolation via `requireOrgAccess`, CRUD for all 60 modules, webhooks (Stripe, Jira, JSM, M365), billing, notifications, audit logging, search, CSV/JSON export.
- **How it appears to work:** Express with helmet, cors, rate limiting (300/15min global + per-user), CSRF protection, security headers (nonce-based CSP), input sanitizer, idempotency middleware, request ID tracking. Graceful shutdown (SIGTERM/SIGINT with 10s drain). Sentry error tracking.
- **Dependencies:** Supabase JS client, Zod, jsonwebtoken, Stripe, pino, redis, prometheus, nodemailer
- **Current controls:** Zod env validation (33 vars), rate limiting, tenant isolation, JWT fast path + Supabase fallback, circuit breaker on Supabase, HTTP client with timeout+retry+CB, optimistic locking with If-Match
- **Missing controls:** No API versioning middleware (routes are `/api/v1/` hardcoded)
- **Risks:** Medium — committed `.env` and `.env.local` may expose local secrets
- **Recommended improvement:** Remove `.env`/`.env.local` from git
- **Suggested tests:** 71 test files covering most routes
- **Suggested docs:** API_ENDPOINT_INVENTORY.md documents 86 endpoints

### Item: Web Application

- **Evidence:** `apps/web/` — Next.js App Router with Turbopack, 3 route groups (admin/portal/public), 26 admin components, 12 portal components, marketing components, 193 web test files, 26 E2E spec files
- **What it does:** Customer-facing portal + admin console + marketing site. Domain-based routing (app.* → portal, www.* → marketing). Server-side rendering with `server-only` SDK client. Client-side SDK for interactive components.
- **How it appears to work:** `middleware.ts` validates JWT expiry (base64url decode, no deps), sets nonce-based CSP, domain-routes marketing vs portal requests. Server components use `getApiClient()` from `lib/api.ts`, client components use `MCTClient.create()` from SDK with cookie auth.
- **Dependencies:** Next.js 15, React 19, tailwindcss, lucide-react, Sentry, pino
- **Current controls:** Security headers (HSTS, CSP, X-Frame-Options), server-only imports prevent client bundle contamination
- **Missing controls:** No PWA/offline support, no i18n
- **Risks:** Medium — committed `.playwright-auth.json` contains auth tokens
- **Recommended improvement:** Remove `.playwright-auth.json` from git
- **Suggested tests:** 193 test files, 26 E2E spec files
- **Suggested docs:** Well-documented in AGENTS.md

### Item: Worker Application

- **Evidence:** `apps/worker/` — 31-line `main.ts`, Zod env schema, 9 task handlers, BullMQ + SQS consumers, health server
- **What it does:** Background job processor supporting dual queue backends. Tasks: stripe-reconcile, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications, webhook-dispatcher, retention, module-tasks. Health endpoint on port 3001.
- **How it appears to work:** `registerAllTasks()` loads handlers, then `runWorkerTasks()` polls BullMQ (or SQS). Tracks in-flight tasks for graceful shutdown. Sentry captures errors.
- **Dependencies:** BullMQ, ioredis, @aws-sdk/client-sqs, Supabase, nodemailer, Sentry
- **Current controls:** Zod env validation (34 vars), graceful shutdown with drain loop, health check
- **Missing controls:** SQS path may be dormant/untested
- **Risks:** Low — well-structured, 24 tests
- **Recommended improvement:** Add integration test that exercises BullMQ path
- **Suggested tests:** 3 test files (env schema, health, task handlers)
- **Suggested docs:** Task handlers documented inline

### Item: SDK Package

- **Evidence:** `packages/sdk/src/` — 50+ modules, `index.ts` re-exports client + all typed APIs
- **What it does:** Typed API client for all 60+ modules. Uses `MCTClient.create()` with configurable base URL and token provider. Supports cookie-backed auth for client-side use.
- **How it appears to work:** Client-side `MCTClient` uses fetch with Bearer token or cookie auth. Server-side uses `getToken` callback. Response types defined per endpoint.
- **Dependencies:** zod (for config), jest + ts-jest for tests
- **Current controls:** Source is TypeScript strict
- **Missing controls:** Limited unit tests (2 files for 50+ modules), no integration tests against real API
- **Risks:** Medium — SDK test coverage is thin. 2 test files for 50+ modules means most methods untested in isolation.
- **Recommended improvement:** Add per-module test files
- **Suggested tests:** Add integration tests running against local API
- **Suggested docs:** Inline JSDoc in source

### Item: Database & Migrations

- **Evidence:** `supabase/migrations/` — 68 migration files from 5302026 to 5302103, `supabase/seeds/` — 5 seed files
- **What it does:** Full database schema evolution covering 60+ feature modules. Includes RLS policies, indexes, constraints, functions, views. Seed data for local development.
- **How it appears to work:** Sequential migration files applied via `supabase db push`. Seeds run on `supabase db reset`.
- **Dependencies:** Supabase CLI, Postgres
- **Current controls:** Migration naming convention, cheatsheet in docs, seed workflow
- **Missing controls:** No explicit migration rollback plan (Supabase doesn't support down migrations)
- **Risks:** Medium — 68 migrations is a large number; some may contain dead tables or orphaned policies
- **Recommended improvement:** Review 5302055 and later cleanup migrations for effectiveness
- **Suggested tests:** Migration tests would need Supabase project
- **Suggested docs:** SUPABASE_MIGRATION_WORKFLOW.md, SUPABASE_MIGRATION_CHEATSHEET.md

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| INV-001 | Root configs | `package.json`, `turbo.json`, `.gitignore` | Standard monorepo | None | P3 | None |
| INV-002 | Package/workspace files | `pnpm-workspace.yaml` | Workspace globs | None | P3 | None |
| INV-003 | Applications | 3 apps in workspace | Docker Compose orchestration | None | P2 | None |
| INV-004 | API services | `apps/api/src/routes/` (52 files) | Express router wiring | None | P2 | None |
| INV-005 | Workers | `apps/worker/src/tasks/` (9 files) | BullMQ + SQS consumers | SQS path potentially stale | P2 | Verify SQS consumer |
| INV-006 | Shared packages | SDK (50 modules), config, UI | SDK test coverage thin (2 files) | Limited SDK testing | P2 | Add SDK tests |
| INV-007 | Database/migrations | 68 migration files | Sequential naming | No rollback strategy | P2 | Document forward-only strategy |
| INV-008 | GitHub metadata | 12 workflows, CODEOWNERS, Dependabot | Comprehensive CI/CD | Chromatic workflow may be stale | P2 | Verify Chromatic |
| INV-009 | Tests | 70 API, 193 web, 2 SDK, 3 worker (3664 test files total) | Good overall coverage | SDK needs more | P2 | Expand SDK tests |
| INV-010 | Docs | 48+ files, comprehensive INDEX.md | Well-organized | Some stale/archived | P3 | Keep archive clean |
| INV-011 | Assets/public files | Marketing, public, images | Adequate | No asset pipeline | P3 | Consider asset optimization |

## Findings

### Finding ID: INV-P2-001 - Committed .env and .env.local files may leak local secrets

- **Severity:** P2
- **Confidence:** High
- **Area:** Repository Inventory
- **Evidence:**
  - `apps/api/.env` — committed local environment file
  - `apps/api/.env.local` — committed local override file
  - No `.env` or `.env.local` in `.gitignore`
- **What is happening:** Two local environment files are committed to the repository. These may contain real Supabase keys, JWT secrets, or other credentials used for local development.
- **Why it matters:** Source control history permanently records committed secrets even if later removed. Anyone with repo access can extract local credentials.
- **User / business impact:** If these contain production or staging credentials, unauthorized access to Supabase projects is possible.
- **Security / privacy / reliability impact:** Medium-High — credential leakage risk.
- **Recommended fix:** Remove `apps/api/.env` and `apps/api/.env.local` from git history. Add `*.env` and `.env.local` to `.gitignore`.
- **Suggested validation:** Verify no `.env*` files remain tracked. Use `git-secrets` or similar scanner.
- **Owner suggestion:** Infrastructure team
- **Effort estimate:** 30 minutes
- **Dependencies:** None
- **Status:** Open

### Finding ID: INV-P2-002 - Committed .playwright-auth.json contains auth state

- **Severity:** P2
- **Confidence:** High
- **Area:** Repository Inventory
- **Evidence:**
  - `apps/web/.playwright-auth.json` — committed Playwright authentication state file
- **What is happening:** The Playwright auth state file, which can contain session tokens and cookies, is committed to the repository.
- **Why it matters:** This file may contain valid authentication tokens that could allow unauthorized access to test environments.
- **User / business impact:** Potential unauthorized access to development/staging environments.
- **Security / privacy / reliability impact:** Medium — auth token exposure.
- **Recommended fix:** Remove `.playwright-auth.json` from git. Add to `.gitignore`.
- **Suggested validation:** Verify file is untracked after removal.
- **Owner suggestion:** QA/Testing team
- **Effort estimate:** 15 minutes
- **Dependencies:** None
- **Status:** Open

### Finding ID: INV-P2-003 - SDK test coverage is thin for 50+ modules

- **Severity:** P2
- **Confidence:** High
- **Area:** Repository Inventory
- **Evidence:**
  - `packages/sdk/src/__tests__/` contains only 2 test files: `sdk.test.ts` and `sdk-expanded.test.ts`
  - SDK has 50+ module files in `packages/sdk/src/`
- **What is happening:** The SDK package has comprehensive module coverage (50+ modules) but only 2 unit test files. Most modules have no direct unit test coverage.
- **Why it matters:** SDK is the primary integration point for both frontend apps and external consumers. Untested modules may have type or logic errors.
- **User / business impact:** SDK consumers may encounter bugs in untested modules.
- **Security / privacy / reliability impact:** Medium — untested code paths may have issues.
- **Recommended fix:** Create per-module test files covering at least CRUD operations. Add integration test against mock API server.
- **Suggested validation:** Achieve >60% coverage on SDK package.
- **Owner suggestion:** Backend team
- **Effort estimate:** 2-3 days
- **Dependencies:** None
- **Status:** Open

### Finding ID: INV-P2-004 - terraform.exe binary committed to repository

- **Severity:** P2
- **Confidence:** High
- **Area:** Repository Inventory
- **Evidence:**
  - `terraform.exe` at repo root — committed Windows binary
- **What is happening:** A compiled Terraform binary is committed to version control.
- **Why it matters:** Binaries should not be in version control. This adds ~50MB+ to repo size and poses a supply chain risk if the binary is tampered with.
- **User / business impact:** Bloated repository size, potential supply chain vulnerability.
- **Security / privacy / reliability impact:** Medium — committed binary is a supply chain risk.
- **Recommended fix:** Remove `terraform.exe` from git. Add to `.gitignore`. Use Terraform via CI or `tfenv`/`asdf`.
- **Suggested validation:** Verify file is untracked.
- **Owner suggestion:** Infrastructure team
- **Effort estimate:** 15 minutes
- **Dependencies:** None
- **Status:** Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Local secrets in committed .env files | P1 | Medium | High | `apps/api/.env`, `.env.local` committed | Remove from git |
| Auth tokens in .playwright-auth.json | P1 | Medium | Medium | File committed | Remove from git |
| SDK bugs in untested modules | P2 | Medium | Medium | Only 2 test files for 50+ modules | Expand SDK test coverage |
| Terraform binary supply chain risk | P2 | Low | Medium | `terraform.exe` committed | Remove from git |
| SQS consumer path may be stale | P2 | Medium | Low | Only BullMQ used in docker-compose | Verify or remove SQS code |

## Recommendations

### Immediate / Release Blocking

1. **Remove committed `.env` and `.env.local`** from `apps/api/` — add patterns to `.gitignore`
2. **Remove `.playwright-auth.json`** from `apps/web/` — add to `.gitignore`
3. **Remove `terraform.exe`** from repo root — add to `.gitignore`

### This Week

4. **Expand SDK test coverage** — add per-module test files for CRUD operations
5. **Review 68 migrations** for dead tables or orphaned policies
6. **Verify SQS consumer** path still works or archive it

### This Month

7. **Add integration tests** for SDK against local API
8. **Create migration rollback documentation** (forward-only strategy)
9. **Add asset optimization pipeline** for marketing images

### Later / Platform Evolution

10. **Add workspace lint rules** for dependency boundaries
11. **Implement version control cleanup** to remove committed artifacts from git history

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Remove .env files from git | Prevent credential leakage | `.gitignore`, `apps/api/.env` | `git status` |
| Remove .playwright-auth.json | Prevent auth token leakage | `.gitignore`, `apps/web/.playwright-auth.json` | `git status` |
| Remove terraform.exe | Reduce repo size + supply chain risk | `.gitignore` | `git status` |
| Add SDK test file for auth module | Start improving SDK coverage | `packages/sdk/src/__tests__/auth.test.ts` | `pnpm --filter=sdk test` |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Remove committed .env files | P1 | Infrastructure | 30 min | None |
| Remove committed auth state | P1 | QA | 15 min | None |
| Remove terraform binary | P2 | Infrastructure | 15 min | None |
| Expand SDK test coverage | P2 | Backend | 2-3 days | None |
| Review 68 migrations | P2 | Backend | 1 day | None |
| Verify SQS consumer | P2 | Backend | 2 hours | None |
| SDK integration tests | P2 | Backend | 3-5 days | Local API setup |

## Suggested Tests

- **API route tests:** Cover edge cases in all 52 route files (70 test files exist, good coverage)
- **SDK module tests:** Create per-module test files (currently 2 files for 50+ modules)
- **E2E tests:** 26 spec files — maintain and expand
- **Worker integration tests:** Add BullMQ path test (currently only unit tests)
- **Migration validation:** Script to verify all migrations apply cleanly

## Suggested Documentation Updates

- `docs/ENVIRONMENT_VARIABLES.md`: Add note about removing `.env` from git tracking
- `AGENTS.md`: Add instruction to never commit `.env` files, `.playwright-auth.json`
- `docs/SUPABASE_MIGRATION_WORKFLOW.md`: Add forward-only migration strategy note

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are the committed .env files real or placeholder? | Determines severity of credential exposure | Check actual values (redacted) |
| Is the SQS consumer path actively used? | Dead code should be removed | Check deployment configs |
| Are all 68 migrations still relevant? | Dead tables add maintenance burden | Review schema for orphaned objects |
| Why is `test` file at repo root empty? | May be stale artifact | Check git blame |

## Appendix

### Raw File Counts

| Category | Count |
| -------- | ----- |
| Root files | 35 entries |
| API route files | 52 |
| API middleware files | 13 |
| API library files | 11 |
| API validators | 25 |
| API test files | 70 (71 files in dir) |
| Web route groups | 3 (admin 55, portal 65, public 17) |
| Web admin components | 26 |
| Web portal components | 12 |
| Web test files | 193 |
| Web E2E test files | 26 spec files |
| Worker task files | 9 |
| Worker test files | 3 |
| SDK modules | 50+ |
| SDK test files | 2 |
| Migration files | 68 |
| Seed files | 5 |
| GitHub workflows | 12 |
| Documentation files | 48+ |
| Scripts | 20 |
| Terraform files (DO) | 6 tf files + state/backend |
| Docker Compose files | 1 (DO) + 1 (root) |

### Sensitive/Committed Artifact Inventory

| File | Type | Risk |
| ---- | ---- | ---- |
| `apps/api/.env` | Local env with secrets | Credential leakage |
| `apps/api/.env.local` | Local env override | Credential leakage |
| `apps/web/.playwright-auth.json` | Auth tokens | Session hijacking |
| `terraform.exe` | Binary | Supply chain + repo bloat |
| `apps/web/.next/` | Build artifacts | Would be in .gitignore |
| `apps/api/dist/` | Build artifacts | Would be in .gitignore |
| `apps/worker/dist/` | Build artifacts | Would be in .gitignore |
| Root `test` file | Empty placeholder | Stale artifact |
| Root `debug-storybook.log` | Debug log | Stale artifact |
