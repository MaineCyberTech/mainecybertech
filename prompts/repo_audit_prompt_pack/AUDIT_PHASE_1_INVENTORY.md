# Phase 1 — Repo Inventory + Structural Baseline

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat-platform — real-time workspace communication)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT client portal — IT services management platform)

---

## 1. Repo A Inventory — Reference Repo (`C:\temp\chat` chat-platform)

### 1.1 Top-Level Structure

```
chat/
├── .github/workflows/       # 19 workflow files
├── .husky/                  # pre-commit hook
├── apps/
│   ├── api/                 # Express + Socket.io API (port 4000)
│   ├── web/                 # Next.js 15 App Router frontend (port 3000)
│   └── worker/              # Background worker
├── docs/                    # 16 subdirectories with extensive docs
├── hardening/               # Governance baselines, policies, rules, exceptions, history
├── infra/
│   ├── docker/              # Docker Compose dev + prod, Caddyfiles
│   └── terraform/           # DO single-file terraform (main.tf, variables.tf, outputs.tf, locals.tf, versions.tf)
├── packages/
│   ├── config/              # Shared config (env-schema, logger, errors, date, eslint, tsconfig, vitest)
│   ├── db/                  # Supabase client, config, types, migration runners
│   ├── sdk/                 # Typed API client (7 domain modules, tree-shakeable via subpath exports)
│   └── ui/                  # Design system (8 components, 7 token files, styles.css, use-theme hook)
├── scripts/                 # 18 subdirectories (ai, audits, automation, bot, compliance, dashboard, engine, etc.)
├── supabase/
│   ├── config.toml
│   ├── migrations/          # 22 migration SQL files
│   └── seeds/               # 8 seed SQL files
├── tests/
│   ├── e2e/                 # 4 Playwright spec files (home, auth, messaging, file-upload)
│   ├── integration/         # Integration test setup (README only)
│   └── setup/               # vitest.setup.ts
├── .env.local / .env.local.example
├── eslint.config.mjs        # Root ESLint flat config
├── playwright.config.ts
├── turbo.json
├── tsconfig.base.json
├── vitest.config.ts
├── package.json             # pnpm@9.15.4, vitest, turbo, typescript@~5.8
├── pnpm-workspace.yaml      # apps/*, packages/*
├── AGENTS.md                # Comprehensive architecture guide (~300 lines)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── FINAL_RECONCILED_REPO_AUDIT.md
├── FINAL_RECONCILIATION_EXECUTION_SUMMARY.md
├── FINAL_RECONCILIATION_REPO_AUDIT_PROMPT.md
├── README.md
├── SECURITY.md
├── run_all_migrations.sql
└── test-workspace.json
```

### 1.2 App: `@chat/api` (Express + Socket.io API)

| Aspect | Detail |
|--------|--------|
| **Port** | 4000 |
| **Entry** | `src/server.ts` → `src/app.ts` |
| **Build** | `tsc` → `dist/server.js` |
| **Runtime** | ESM (`"type": "module"`) |
| **Package scope** | `@chat/api` |
| **Dependencies** | express, socket.io, @socket.io/redis-adapter, @supabase/supabase-js, helmet, cors, cookie-parser, express-rate-limit, opossum (circuit breaker), pino, prom-client, ioredis, zod, dompurify, jsdom, web-push, @sentry/node |
| **Dev deps** | eslint, tsx, vitest, pino-pretty, typescript@~5.8, @types/* |
| **Test runner** | Vitest |

**Source structure:**
```
src/
├── server.ts              # HTTP + Socket.io server init
├── app.ts                 # Express app factory (+ middleware chain, route mounting, CORS)
├── config/
│   ├── env.ts             # Zod env schema
│   └── validators.ts      # Shared validation helpers
├── lib/
│   ├── circuit-breaker.ts # opossum-based circuit breaker (factory + per-name instances)
│   ├── feature-flags.ts   # Feature flag service
│   ├── idempotency.ts     # Idempotency key store (Redis Map)
│   ├── logger.ts          # Pino logger
│   ├── membership.ts      # Membership verification utility
│   ├── metrics.ts         # Prometheus metrics (PromClient)
│   ├── sentry.ts          # Sentry initialization
│   ├── socket.ts          # Socket.io setup + event handlers
│   └── supabase.ts        # Supabase admin client factory
├── middleware/
│   ├── authenticate.ts         # JWT/session authentication
│   ├── csrf.ts                 # Double-submit cookie CSRF
│   ├── error-handler.ts        # Global error handler
│   ├── rate-limit.ts           # Rate limiting
│   ├── request-id.ts           # X-Request-ID correlation IDs
│   ├── require-membership.ts   # Workspace membership check
│   ├── security-headers.ts     # CSP/HSTS/X-Frame-Options
│   ├── validate-string-key.ts  # String key param validation
│   ├── validate-uuid.ts        # UUID param validation
│   └── __tests__/             # Middleware tests
├── modules/                   # Domain modules (not flat routes)
│   ├── auth/                  # Auth routes + service
│   ├── channels/              # Channel CRUD + membership
│   ├── feature-flags/         # Feature flag management
│   ├── health/                # Health check endpoint
│   ├── messages/              # Message CRUD + search
│   ├── notifications/         # Notification CRUD + push subscriptions
│   ├── preferences/           # User preferences
│   ├── reactions/             # Message reactions
│   ├── webhooks/              # Outbound webhook management
│   └── workspaces/            # Workspace CRUD
└── services/
    └── audit.ts               # Audit event logger
```

**Middleware stack order:** helmet → cors → securityHeaders → json/urlencoded parser → cookieParser → csrf → requestId → apiLimiter → metricsMiddleware → routes

### 1.3 App: `@chat/web` (Next.js 15 Frontend)

| Aspect | Detail |
|--------|--------|
| **Port** | 3000 |
| **Entry** | `app/layout.tsx` |
| **Build** | `next build` |
| **Runtime** | Node (next start) |
| **Package scope** | `@chat/web` |
| **Dependencies** | next@^15.2, react@^19, react-dom@^19, @sentry/nextjs, socket.io-client, @supabase/supabase-js, @chat/db, @chat/ui, @next/bundle-analyzer, zod |
| **Dev deps** | eslint, vitest, @testing-library/react, @testing-library/jest-dom, tailwindcss@^4, @tailwindcss/postcss, typescript@~5.8 |
| **Test runner** | Vitest |
| **Config** | next.config.ts, postcss.config.js, tailwindcss v4 with @tailwindcss/postcss |

**Route groups:**
- `(auth)/` — Login, signup, password reset
- `(home)/` — Main home/dashboard
- `(channels)/` — Channel browsing/detail
- `(chat)/` — Real-time messaging
- `(notifications)/` — Notification center
- `(settings)/` — User settings + workspace settings
- `(workspace)/` — Workspace management

**Key files:**
- `middleware.ts` — Auth check + redirect
- `instrumentation.ts` — Sentry initialization
- `lib/supabase/server.ts`, `lib/supabase/client.ts` — Supabase helpers
- `lib/socket.ts` — Socket.io client
- `lib/pwa/install-state.ts`, `lib/pwa/push-client.ts` — PWA + push notifications
- `public/icons/` — PWA icons
- `components/` — 8 component directories (auth, channel, chat, home, notifications, pwa, shared, workspace)

### 1.4 App: `@chat/worker` (BullMQ Background Worker)

| Aspect | Detail |
|--------|--------|
| **Entry** | `src/main.ts` |
| **Build** | `tsc` → `dist/main.js` |
| **Package scope** | `@chat/worker` |
| **Dependencies** | bullmq, ioredis, @sentry/node, pino, @chat/config, @chat/db, @chat/sdk |
| **Dev deps** | eslint, tsx, typescript@~5.8, rimraf |

**Source structure:**
```
src/
├── main.ts           # Worker init, queue setup
├── lib/              # Worker-specific lib
└── processors/
    ├── cleanup/          # Cleanup jobs
    ├── notification/     # Notification dispatch
    ├── search-indexer/   # Search indexing
    └── webhook-delivery/ # Webhook delivery
└── queues/           # Queue definitions
```

**Registered processors:** cleanup, notification, search-indexer, webhook-delivery

### 1.5 Package: `@chat/db` (Database Package)

| Aspect | Detail |
|--------|--------|
| **Entry** | `src/index.ts` |
| **Exports** | `.` (Supabase client), `./config` (DB config) |
| **Dependencies** | @supabase/supabase-js, zod |
| **Purpose** | Shared Supabase client factory, config, DB types, migration runner |

### 1.6 Package: `@chat/sdk` (Typed API Client)

| Aspect | Detail |
|--------|--------|
| **Entry** | `src/index.ts` |
| **Exports** | Subpath exports for tree-shaking: `.`, `./workspaces`, `./channels`, `./messages`, `./webhooks`, `./notifications`, `./preferences`, `./reactions` |
| **Source files** | client.ts, types.ts + 7 domain modules |
| **Build** | `tsc` → `dist/` |

### 1.7 Package: `@chat/ui` (Design System)

**Components:** Button, Input, Badge, Avatar, Dialog, SidebarGroup, Skeleton, ThemeToggle
**Tokens:** colors, semantic-colors, typography, spacing, borders, motion, focus
**Hook:** use-theme
**Styles:** styles.css — cyber-themed base styles

### 1.8 Package: `@chat/config` (Shared Config)

**Files:** env-schema.ts, logger.ts, errors.ts, date.ts, eslint.config.mjs, tsconfig.base.json, vitest.config.base.ts

### 1.9 Infrastructure

**Docker:** Compose files for dev and prod, Caddyfile, Caddyfile.prod
**Terraform:** Single DigitalOcean terraform config (main.tf, variables.tf, outputs.tf, locals.tf, versions.tf) — droplet + firewall + Cloudflare DNS

### 1.10 CI/CD (19 workflows)

**Validation:** ci.yml, validate.yml, build-push.yml
**Deployment:** deploy-development.yml, deploy-production.yml, infra-development.yml
**Audit/Governance:** audit-ci.yml, audit-badges-autocommit.yml, audit-ci-autocommit.yml, audit-pr-gate.yml, audit-release-certification.yml, governance.yml, hardening.yml, hardening-automation-runner.yml
**Platform:** platform.yml, environment-promotion-audit.yml, feature-rollout-checkpoint.yml, executive-stakeholder-pack.yml
**Data:** supabase-migrations.yml

### 1.11 Database (22 migration files + 8 seed files)

Migration namespace: `20260625` through `20260626` — likely a single-day migration set. Seeds include workspace, channel, user, message test data.

### 1.12 Documentation (16 directories)

`architecture/`, `audits/`, `compliance/`, `contributing/`, `environments/`, `legal/`, `runbooks/`, `security/`, plus executive/hardening/stakeholder editions.

### 1.13 Testing

- **Unit:** Vitest (web + api + ui packages)
- **E2E:** Playwright (4 spec files: home, auth, messaging, file-upload)
- **Setup:** tests/setup/vitest.setup.ts

---

## 2. Repo B Inventory — Current Repo (`C:\temp\mainecybertech-portal` MCT Portal)

### 2.1 Top-Level Structure

```
mainecybertech-portal/
├── .continue/               # Continue.dev AI config
├── .github/dependabot.yml
├── .github/workflows/       # 14 workflow files
├── .husky/                  # pre-commit hook (lint-staged)
├── .storybook/              # Storybook config (main.ts + preview.tsx)
├── .vscode/
├── apps/
│   ├── api/                 # Express API Gateway (port 4000)
│   ├── web/                 # Next.js 15 App Router frontend (port 3000)
│   └── worker/              # Background Worker (BullMQ/SQS, port 3001)
├── badges/                  # 7 SVG badges (alignment audit results)
├── dashboards/              # Grafana dashboard JSON files
├── docs/                    # 37 documentation files + ADRs
├── infra/
│   ├── digitalocean/        # DO production deployment config (docker-compose, Caddyfile)
│   └── terraform/           # Active DO terraform + dormant AWS terraform
├── packages/
│   ├── config/              # Shared ESLint + TSConfig configs
│   ├── sdk/                 # Typed API Client (18 domain modules)
│   └── ui/                  # Design system (8 components, 8 token files, ThemeProvider)
├── prompts/                 # Audit/alignment prompt packs (hardening, repo audit)
├── scripts/                 # 15 local dev & CI scripts
├── supabase/
│   ├── config.toml
│   ├── migrations/          # ~40 migration SQL files
│   └── seeds/               # 4 seed SQL files
├── templates/               # Scaffolding templates
├── .dockerignore
├── .editorconfig
├── .gitignore (137-line)
├── AGENTS.md (116KB, ~3000 lines)
├── alignment-audit-results.json
├── docker-compose.yml       # Local dev stack (api+web+worker+e2e)
├── LICENSE
├── package.json             # pnpm@10.34.3, turbo, prettier, husky, lint-staged
├── pnpm-lock.yaml (548KB)
├── pnpm-workspace.yaml      # apps/*, packages/*
├── README.dev.md / README.md
├── SECURITY.md
├── turbo.json               # Turborepo pipeline config
└── vercel.json              # { framework: "nextjs" } (dormant)
```

### 2.2 App: `@mct/api` (Express API Gateway)

| Aspect | Detail |
|--------|--------|
| **Port** | 4000 |
| **Entry** | `src/main.ts` → `src/app.ts` |
| **Build** | `tsup` → `dist/` |
| **Runtime** | ESM (`"type": "module"`) |
| **Package scope** | `@mct/api` |
| **Dependencies** | express, @supabase/supabase-js, jsonwebtoken, zod, pino, stripe, ioredis, redis, helmet, cors, cookie-parser, express-rate-limit, multer, nodemailer, zxcvbn, prom-client, @sentry/node, ws |
| **Dev deps** | tsup, tsx, ts-jest, supertest, jest, typescript@~5.9 |
| **Test runner** | Jest + supertest |
| **Test files** | 26 test files, 182 tests |

**Source structure (51 source files):**
```
src/
├── main.ts              # Express server init, graceful shutdown (SIGTERM/SIGINT + 10s drain)
├── app.ts               # Express app factory, middleware chain, route mounting
├── config/
│   └── env.ts           # Zod-validated env schema (32 vars)
├── lib/
│   ├── circuit-breaker.ts   # Custom CircuitBreaker class (closed/open/half-open)
│   ├── csv.ts               # CSV export helper
│   ├── email.ts             # Nodemailer email sender
│   ├── http-client.ts       # HTTP client with retry + timeout + circuit breaker
│   ├── idempotency.ts       # Redis + in-memory idempotency key store
│   ├── logger.ts            # Pino logger (pretty in dev)
│   ├── metrics.ts           # Prometheus metrics (10+ metrics)
│   ├── notify.ts            # In-app + email notification dispatch
│   └── sentry.ts            # Sentry init
├── middleware/
│   ├── admin.ts             # requireAdmin (roles!inner JOIN)
│   ├── auth.ts              # requireAuth (JWT verify → Supabase fallback)
│   ├── cache.ts             # Redis-backed response cache (renew + no-renew)
│   ├── error.ts             # Global error handler (Sentry capture)
│   ├── idempotency.ts       # Idempotency-Key header middleware
│   ├── not-found.ts         # 404 handler
│   ├── optimistic-locking.ts # If-Match version checking
│   ├── org-access.ts        # requireOrgAccess + requireOrgAccessByParam
│   ├── rate-limit.ts        # rateLimitByUser (200/15min) + rateLimitAuth (10/15min)
│   ├── request-id.ts        # X-Request-ID correlation + request logging
│   ├── security-headers.ts  # CSP, HSTS, X-Frame-Options
│   └── security.ts          # XSS/SQL injection pattern detection
├── routes/                  # Flat route files (not modules)
│   ├── admin.ts, api-keys.ts, audit.ts, auth.ts, billing.ts, bulk.ts
│   ├── dashboard.ts, docs.ts, documents.ts, health.ts, memberships.ts
│   ├── notification-preferences.ts, notifications.ts, organizations.ts
│   ├── profiles.ts, projects.ts, public.ts, roles.ts
│   ├── search-portal.ts, search.ts, sla.ts, tickets.ts, users.ts
│   └── webhook-management.ts
├── services/
│   ├── supabase.ts          # Supabase admin/client factories + circuit breaker wrapper
│   └── audit.ts             # Audit event logger (retry + backoff)
├── types/
│   ├── index.ts             # ApiResponse, AppError, AuthUser
│   └── json.d.ts
├── validators/              # Zod validators per domain
│   ├── document.ts, membership.ts, organization.ts, project.ts, ticket.ts
├── __tests__/               # 26 test files
└── __mocks__/
```

**Middleware stack order:** helmet → cors → securityHeaders → json/urlencoded parser (10mb, Stripe raw) → cookieParser → inputSanitizer (pattern detection) → global rate limiter (300/15min) → rateLimitByUser (200/15min) → requestId → requestLogger → idempotencyMiddleware → routes → sentryErrorHandler → errorHandler

### 2.3 App: `@mct/web` (Next.js 15 Frontend)

| Aspect | Detail |
|--------|--------|
| **Port** | 3000 |
| **Entry** | `app/layout.tsx` |
| **Build** | `next build` (`output: "standalone"`) |
| **Output** | Standalone for Docker |
| **Package scope** | `@mct/web` |
| **Dependencies** | next@^15.1, react@^19, react-dom@^19, @sentry/nextjs, pino, @mct/sdk, @mct/ui, zod, clsx, tailwind-merge, lucide-react |
| **Dev deps** | jest, @testing-library/react, @testing-library/jest-dom, playwright, tailwindcss@^3.4, @tailwindcss/postcss, @next/bundle-analyzer |
| **Test runner** | Jest + Testing Library (455 tests) + Playwright E2E (24 spec files) |
| **Config** | next.config.mjs, tailwind.config.ts, postcss.config.js, playwright.config.ts |

**Route groups:**
- `(public)/` — Marketing homepage, login, signup, forgot-password, password-reset, pending, contact, services/[slug]
- `(portal)/` — Client portal: dashboard, billing, documents, notifications, profile, projects, support, timeline
- `(admin)/` — Admin panel: dashboard, approvals, audit, bulk-invite, documents, health, notifications, organizations, projects, roles, settings, tickets, users, webhooks

**Key configs:**
- `middleware.ts` — JWT base64url exp check + domain routing (app.* vs www.*) + auth redirects
- `next.config.mjs` — standalone output, rewrites to API, CSP headers, bundle analyzer, Sentry
- `tailwind.config.ts` — Extends with @mct/ui/tokens (cyber colors, typography, spacing, shadows)
- `sentry.*.config.ts` — Per-runtime Sentry config
- `instrumentation.ts` + `instrumentation-client.ts` — Sentry per runtime

**Component count:** ~39 components across marketing (4), portal (13), admin (20), shared (8)

### 2.4 App: `@mct/worker` (Background Worker)

| Aspect | Detail |
|--------|--------|
| **Port** | 3001 (health) |
| **Entry** | `src/main.ts` |
| **Build** | `tsup` → `dist/main.js` |
| **Package scope** | `@mct/worker` |
| **Dependencies** | bullmq, ioredis, @supabase/supabase-js, @sentry/node, @aws-sdk/client-sqs, nodemailer, pino, zod |
| **Dev deps** | tsup, tsx, jest, ts-jest, typescript@~5.7 |

**Tasks (6):** ping, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications, stripe-reconcile
**Queue:** BullMQ (default, Redis) with SQS fallback

### 2.5 Package: `@mct/sdk` (Typed API Client)

| Aspect | Detail |
|--------|--------|
| **Name** | `@mct/sdk` |
| **Entry** | `src/index.ts` |
| **Files** | 18 domain modules (auth, organizations, memberships, tickets, projects, documents, dashboard, users, profiles, audit, roles, notifications, billing, webhooks, bulk, api-keys, sla, search) |
| **Types** | 25+ interfaces in `types.ts` |
| **Client** | ApiClient with retry (exponential backoff) + timeout + token injection |
| **Tests** | 108 tests in single `sdk.test.ts` |

### 2.6 Package: `@mct/ui` (Design System)

**Components:** Button, Input/Textarea, Badge, Avatar, Dialog, Skeleton (Text/Card/Table), SidebarGroup, ThemeToggle
**Tokens:** colors, semantic-colors, typography, spacing, borders, shadows, motion, focus (8 files — shadows is extra vs chat)
**Hook:** use-theme
**Provider:** ThemeProvider
**Utility:** cn() (clsx + tailwind-merge)
**Styles:** styles.css — cyber-themed base styles
**Storybook:** Stories for 7 components

### 2.7 Package: `@mct/config` (Shared Config)

**Files:** `eslint.mjs` (base ESLint config), `tsconfig.base.json` (ES2022, bundler module resolution)

### 2.8 Infrastructure

**Docker:** 3 Dockerfiles (api, web, worker) with standalone Next.js output
**Docker Compose:** `infra/digitalocean/docker-compose.yml` — Caddy + Redis + API + Worker + Web
**Caddy:** `infra/digitalocean/Caddyfile` — routes www.* + app.* → web:3000, api.* → api:4000
**Terraform:** Active DO terraform (providers.tf, variables.tf, droplet.tf, firewall.tf, dns.tf, outputs.tf) + dormant AWS terraform at `infra/terraform/aws/`

### 2.9 CI/CD (14 workflows)

**Validation:** test.yml, lint.yml, typecheck.yml, e2e.yml, validate.yml (reusable gate)
**Deployment:** deploy-do.yml, terraform-do.yml, supabase-migrations.yml
**Other:** chromatic.yml, alignment-badges.yml, alignment-engine.yml, alignment-full.yml, alignment-pr-comment.yml, pr-status.yml

### 2.10 Database (~40 migration files + 4 seed files)

**Migrations:** 5302020 through 5302038 namespace — incremental migrations over time.
**Seeds:** 4 SQL seed files (test data, permissions, Jira/JSM, etc.)

### 2.11 Documentation (37 files)

Comprehensive docs covering: admin features, API endpoints (86 documented), rate limiting, versioning, architecture, billing, CICD, environment variables, deployment, gap analysis, GitHub secrets, marketing integration, monitoring, onboarding, org branding, rollback procedures, secrets rotation, ADRs (7 records), portal admin permissions guide, and more.

### 2.12 Testing

- **API:** 182 tests (Jest + supertest, 26 test files)
- **Web:** 455 tests (Jest + Testing Library, ~60 test files)
- **SDK:** 108 tests (Jest, 1 file)
- **Worker:** 24 tests (Jest, 3 files)
- **E2E:** 24 Playwright spec files (auth, admin, portal, marketing)
- **Total:** 769 tests

---

## 3. Structural Similarities

| Aspect | Both Repos |
|--------|-----------|
| **Monorepo structure** | Turborepo + pnpm workspaces with `apps/*` and `packages/*` |
| **App count** | 3 apps each (api, web, worker) |
| **API framework** | Express with helmet, cors, cookie-parser, rate limiting |
| **Frontend framework** | Next.js 15 App Router |
| **Real-time** | Both have real-time (chat: Socket.io, MCT: SSE notifications) |
| **Background processing** | BullMQ with Redis |
| **Auth** | JWT + Supabase Auth (PKCE flow) |
| **Circuit breaker** | Both have circuit breaker patterns (chat: opossum, MCT: custom) |
| **Idempotency** | Both have idempotency key support |
| **Security headers** | Both have security-headers middleware |
| **Correlation IDs** | Both have X-Request-ID middleware |
| **Supabase** | Both use Supabase for DB + Auth + Storage |
| **Sentry** | Both use Sentry for error tracking |
| **Prometheus metrics** | Both have prom-client metrics |
| **Pino logging** | Both use pino for structured logging |
| **Design system** | Both have UI packages with similar components (Button, Badge, Avatar, Dialog, Input, SidebarGroup, Skeleton, ThemeToggle + theme tokens) |
| **Worker pattern** | Both use BullMQ with Redis |
| **Husky pre-commit** | Both have husky hooks |
| **Docker** | Both have Dockerfiles for all 3 apps |
| **DigitalOcean** | Both deploy to DO (docker-compose + Caddy) |
| **Terraform** | Both have DO terraform (droplet + firewall + DNS) |
| **pnpm** | Both use pnpm (chat@9.15.4, MCT@10.34.3) |
| **Zod** | Both use Zod for validation |
| **AGENTS.md** | Both have AGENTS.md architecture guidance |

---

## 4. Structural Differences

| Aspect | Reference Repo (chat) | Current Repo (MCT) | Significance |
|--------|----------------------|-------------------|-------------|
| **Domain focus** | Real-time workspace communication | IT services management (MSP portal) | Fundamental (different product) |
| **Package namespace** | `@chat/*` | `@mct/*` | Cosmetic |
| **Shared DB package** | `packages/db` (Supabase client wrapper) | No shared DB package (Supabase clients created per-service) | MCT duplicates Supabase init across api/worker |
| **API routing pattern** | `modules/` (feature folders with routes + service) | `routes/` (flat files) | Architectural |
| **Build tool** | `tsc` (TypeScript compiler) | `tsup` (esbuild bundler) | Tooling preference |
| **Test runner** | Vitest | Jest | Tooling preference |
| **API real-time** | Socket.io (WebSocket, bidirectional) | SSE (server-sent events, unidirectional) | Different real-time approach |
| **API event transport** | `@socket.io/redis-adapter` for multi-instance | `ws` library (not used for notifications — SSE via HTTP) | Different scale target |
| **Circuit breaker library** | opossum (third-party) | Custom CircuitBreaker class | MCT wrote from scratch |
| **API routing structure** | Module-based (auth/, channels/, workspace/, etc.) | Flat route files (tickets.ts, auth.ts, etc.) | MCT is more granular |
| **CSRF protection** | Double-submit cookie CSRF | No CSRF (relies on SameSite cookies) | MCT relies on browser cookie model |
| **Input sanitizer** | dompurify + jsdom (HTML sanitization) | Custom XSS/SQL injection pattern detection | Different sanitization approach |
| **Admin panel** | None (chat has workspace admin via routes) | Full admin panel route group (15+ pages) | MCT has a dedicated admin UI |
| **Marketing site** | None (chat is logged-in app only) | Full marketing site (5 service pages, contact form, GA, Tawk.to) | MCT has a public-facing site |
| **Multi-tenancy** | Workspace membership model | Organization-based tenancy with `requireOrgAccess()` | Different tenant model |
| **API versioning** | `v1/` prefix in routes | `v1/` prefix in routes | Similar |
| **Tailwind version** | v4 (with `@tailwindcss/postcss`) | v3.4 (with `tailwind.config.ts`) | Version difference |
| **Storybook** | No Storybook | Yes (`.storybook/` config, Chromatic CI) | MCT has visual regression |
| **PWA support** | Yes (push notifications, install state, icons) | No PWA | Chat has progressive web app |
| **Feature flags** | Dedicated middleware + route module | No feature flag system | Chat has dynamic toggles |
| **Web push** | web-push library + push subscriptions | No push (in-app notifications only) | Chat has browser push |
| **Package manager** | pnpm@9.15.4 | pnpm@10.34.3 | Version difference |
| **pnpm override count** | Minimal | Several overrides for security vulns | MCT has more overrides |
| **Docker compose** | Separate dev/prod compose files | Single production DO compose + local dev compose | Similar pattern |
| **CI/CD workflow count** | 19 worklows (incl. audit, governance, hardening) | 14 workflows (more focused, less governance) | Chat has more processes |
| **Migration naming** | `20260625*` (date-based, single-day) | `530203*` (sequential numbering) | Different schema |
| **Migration count** | 22 | ~40 | MCT has more DB evolution |
| **E2E test files** | 4 spec files | 24 spec files | MCT has broader coverage |
| **Unit test framework** | Vitest | Jest | Different runners |
| **Auth verification** | Authentication via Supabase + middleware | JWT local verify (fast path) + Supabase fallback | MCT has performance optimization |
| **API body limit** | 1mb | 10mb | MCT handles larger payloads (uploads) |
| **Email service** | No email dependency | nodemailer + SMTP config | MCT sends transactional emails |
| **Password validation** | Not evident | zxcvbn with min score 3 | MCT has password strength |
| **Billing integration** | No billing dependency | Stripe SDK + webhooks | MCT processes payments |
| **Stripe SDK** | None | Full Stripe integration (webhooks, billing) | MCT has ecommerce |
| **SLA tracking** | None | SLA metrics API + SDK | MCT tracks service levels |
| **Document management** | None (file upload via messaging) | Full document CRUD, versions, share links, signed URLs | MCT has document management |
| **API key management** | Not evident | API key CRUD + SDK | MCT has self-serve API keys |
| **Tenant isolation middleware** | `require-membership` (workspace-level) | `requireOrgAccess` + `requireOrgAccessByParam` (org-level) | Similar concept, different model |
| **Optimistic locking** | Not evident | If-Match header + version checking | MCT has concurrency control |
| **Response caching** | Not evident | Redis-backed responseCache + responseCacheNoRenew | MCT has caching layer |
| **Transpilation** | MCT uses `tsup` (fast esbuild) | Chat uses `tsc` (slower but full type checking) | Build speed vs strictness |
| **Dependabot** | True (config in `.github/dependabot.yml`) | Not found in chat; MCT has it | Both have it or need it |
| **Prettier config** | `.prettierrc.json` + `.prettierignore` | Not in MCT (uses ESLint only) | Different formatting approach |

---

## 5. Likely Core Systems

### Reference Repo (chat)
1. **Real-time messaging** — Socket.io with Redis adapter, message CRUD, reactions, channels
2. **Workspace management** — Workspace CRUD, membership, roles
3. **Notification system** — In-app + push (web-push), preferences
4. **Auth system** — JWT + Supabase Auth
5. **Feature flags** — Dynamic toggle management
6. **Webhook management** — Outbound webhook delivery
7. **PWA support** — Offline capability, push notifications
8. **Search indexing** — Background search indexer processor
9. **Cleanup jobs** — Background data cleanup processor
10. **Audit logging** — Structured event logging

### Current Repo (MCT)
1. **Ticket management** — CRUD, comments, bulk operations, export
2. **Project management** — CRUD, tasks, timeline, calendar views
3. **Document management** — CRUD, versions, share links (signed URLs), bulk operations
4. **Organization/tenant system** — Multi-org with membership, `requireOrgAccess`
5. **Auth system** — JWT local verify + Supabase fallback, cookie-based sessions
6. **Notification system** — In-app (SSE stream), email, preferences per module
7. **Billing/Stripe** — Invoices, subscriptions, payments, webhook sync
8. **Admin panel** — Full admin UI (users, orgs, audit, roles, webhooks, health)
9. **Marketing site** — Public homepage, services, contact form
10. **SLA tracking** — Ticket response/resolution metrics
11. **API key management** — Self-serve keys with CRUD
12. **Audit logging** — All mutation endpoints log to `audit_logs`
13. **Worker tasks** — Jira sync, JSM sync, M365 calendar, scheduled notifications, Stripe reconcile
14. **Response caching** — Redis-backed for organizations, documents, projects

---

## 6. Likely Fragile / High-Risk Areas

### Reference Repo (chat)
1. **Socket.io scaling** — Redis adapter for multi-instance (untested in single-droplet dev)
2. **Real-time message ordering** — Consistency across distributed Socket.io instances
3. **PWA push notifications** — Service worker lifecycle, push subscription management
4. **Feature flag toggle consistency** — Runtime flag changes without restart
5. **Search indexer** — Background indexing consistency with live data
6. **CSRF double-submit cookie** — Cookie parity across subdomains
7. **Dompurify/HTML sanitization** — XSS prevention in rich messages
8. **Single terraform file** — `main.tf` monolithic (harder to maintain as infra grows)

### Current Repo (MCT)
1. **Tenant isolation** — `requireOrgAccess` on all entity routers (complex multi-org edge cases)
2. **Auth/JWT verification** — Dual-path (local JWT → Supabase fallback) has fallback timing edge cases
3. **Stripe webhook integrity** — Signature verification, idempotency, subscription sync
4. **Bulk operations** — Transactional atomicity across bulk ticket/document updates
5. **Document share links** — Signed URL expiry, storage access control
6. **Real-time SSE** — Connection management, reconnection, flush_interval on Caddy
7. **Multi-service orchestration** — API → Worker (BullMQ), timing, error handling, retries
8. **Circuit breaker** — Custom implementation (not battle-tested like opossum)
9. **Optimistic locking** — If-Match version checking (not widely tested across all routes)
10. **Audit logging** — Retry with backoff (critical compliance path)
11. **Domain routing middleware** — base64url JWT parse (no library), app vs www routing
12. **Multi-org role edges** — `PATCH /users/:id/role` with optional organizationId
13. **Caddy SSE flush_interval** -1 — Non-standard Caddy config for real-time
14. **Two-queue backend** — BullMQ + SQS dormant path (maintenance burden)
15. **Custom circuit breaker vs opossum** — Chat uses production-tested opossum; MCT has a homemade version

---

## 7. Unknowns / Areas Needing Deeper Inspection

### Reference Repo (chat)
1. Test count and coverage metrics — not yet inspected
2. Environment variable schema completeness
3. Middleware test coverage (unit tests for authenticate.ts, csrf.ts, etc.)
4. Supabase RLS policy completeness
5. Terraform backend state configuration (S3/DynamoDB vs local)
6. Process manager for production (PM2, systemd, or Docker)
7. Worker task handler test coverage
8. Migration rollback strategy
9. Auth flows — password reset flow completeness
10. Email configuration (SMTP setup if any)
11. Rate limit configuration values
12. CORS configuration (origin matching)
13. Dockerfile HEALTHCHECK directives
14. Cookie security flags (HttpOnly, Secure, SameSite)
15. Sentry DSN setup per environment

### Current Repo (MCT)
1. Wire `@mct/config` TypeScript config into apps (tsconfig incompatibility)
2. JSM ticket creation still not firing (Teams webhook works) — unknown if JSM env vars are correct
3. No unit tests for webhooks, bulk-invite, health, billing admin pages (zero coverage)
4. Prod terraform blocks — `prod.tfvars` is still `.example` only (real values not filled)
5. Database backup automation — scheduled cron exists but not verified working end-to-end
6. Load testing scripts — placeholder only, no real baseline data
7. Pre-commit hooks (husky) — installed but lint-staged behavior not verified beyond config
8. PWA support — explicitly absent (mentioned as future item)
9. Feature flags — absent (mentioned as future item)
10. Storybook component test coverage — unknown if stories match current component props
11. Chromatic visual regression CI — not verified to actually run correctly
12. Terraform DO droplet `prevent_destroy` — ensures safety but complicates updates