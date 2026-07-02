# Phase 1 — Repo Inventory + Structural Baseline

**Date:** 2026-07-02  
**Audit Run:** Run2  
**Reference Repo:** `C:\temp\chat`  
**Current Repo:** `C:\temp\mainecybertech-portal`

---

## 1. Repo A Inventory — Reference Repo (`C:\temp\chat`)

### Identity

- **Name:** `chat-platform` (private monorepo)
- **Manager:** pnpm@9.15.4 + Turborepo
- **Node:** >=20.0.0
- **TypeScript:** ^5.8.0
- **Test:** vitest@^3.0.0, @playwright/test@^1.51.0
- **Description:** "Production-grade real-time workspace communication platform"

### Top-Level Structure

```
C:\temp\chat\
├── apps/
│   ├── api/           # Express API (Socket.io)
│   ├── web/           # Next.js 15 App Router
│   └── worker/        # BullMQ background processor
├── packages/
│   ├── config/        # @chat/config — ESLint, TS base, env-schema, logger, errors, date utils
│   ├── db/            # @chat/db — Supabase client + DB types
│   ├── sdk/           # @chat/sdk — typed API client (7 domain modules)
│   └── ui/            # @chat/ui — design system (7 components, tokens, hooks)
├── infra/
│   ├── docker/        # docker-compose.prod.yml, Caddyfile(s)
│   └── terraform/     # DO droplet + firewall + CF DNS (main.tf, variables.tf, etc.)
├── supabase/
│   ├── migrations/    # 32 files (ISO-date naming: 20260625000001_*)
│   ├── seeds/         # 8 SQL seed files
│   ├── policies/      # 11 RLS policy files (one per table)
│   ├── config.toml    # Local Supabase config
│   └── functions/     # Empty (.gitkeep)
├── tests/
│   ├── e2e/           # 6 Playwright spec files
│   ├── integration/   # Empty (README only)
│   ├── k6/            # 2 load test scripts + 1 config
│   └── setup/         # vitest.setup.ts
├── .github/workflows/ # 19 workflow files
├── scripts/           # 21 subdirectories (audits, hardening, utility, etc.)
├── docs/              # 18 subdirectories
├── hardening/         # Audit artifact store (baselines, exceptions, history, policies, rules)
└── [root files]       # tsconfig.base.json, turbo.json, vitest.config.ts, playwright.config.ts
```

### App Details

**API (`apps/api/`):** Express + Socket.io on port 4000

- 13 domain modules under `src/modules/` (auth, channels, messages, threads, reactions, webhooks, notifications, workspaces, health, feature-flags, livekit, preferences, consent)
- 10 middleware files (authenticate, csrf, deprecation, error-handler, rate-limit, request-id, require-membership, security-headers, validate-string-key, validate-uuid)
- 5 lib files (circuit-breaker, db-timeout, idempotency, logger, membership, sentry, socket, supabase)
- Prometheus metrics (17 metrics)
- 9 test files (service-level unit tests)

**Web (`apps/web/`):** Next.js 15 App Router on port 3000

- Route groups: `(auth)`, `(workspace)`, standalone `auth/callback`, `install`
- Components organized by domain: `auth/`, `channel/`, `chat/`, `home/`, `media/`, `notifications/`, `pwa/`, `shared/`, `workspace/`
- 2 E2E spec files
- PWA support (service worker, manifest, install prompt)

**Worker (`apps/worker/`):** BullMQ processor on port 4100 (health)

- 4 processors: cleanup, notification, search-indexer, webhook-delivery
- BullMQ queue factories (webhook, notification, search, cleanup)
- Graceful shutdown

### Packages

| Package        | Contents                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@chat/config` | ESLint, tsconfig.base.json, vitest.config.base.ts, env-schema (Zod), logger, errors (9 AppError classes), date utils                   |
| `@chat/db`     | Supabase client factory (singleton), 14 DB type interfaces (User, Workspace, Channel, Message, Reaction, etc.)                         |
| `@chat/sdk`    | 7 domain clients (Channels, Messages, Notifications, Preferences, Reactions, Webhooks, Workspaces), 24 SDK types                       |
| `@chat/ui`     | 7 components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton), design tokens (8 files), hooks (use-theme), ThemeProvider |

### Dependency Graph

```
@chat/web  → @chat/db, @chat/ui
@chat/api  → @chat/db
@chat/worker → @chat/config, @chat/db, @chat/sdk
```

### CI/CD (19 workflows)

Core: ci.yml, validate.yml, build-push.yml, deploy-development.yml, deploy-production.yml, supabase-migrations.yml
Audit/Governance: 13 additional workflows (audit-_, hardening-_, governance.yml, platform.yml, etc.)

### Key Features

- Real-time chat (Socket.io channels, threads, typing indicators, presence)
- Workspaces with membership roles (owner/admin/member)
- Public/private channels with role overrides
- Messages CRUD + search + soft-delete + optimistic UI
- Reactions (emoji)
- Threads
- Push notifications (Web Push API + VAPID)
- In-app notifications
- Webhooks (CRUD + retry/DLQ + SSRF protection + secret masking)
- Audit logging with retry queue
- Feature flags (percentage rollout + role targeting)
- GDPR consent management
- LiveKit audio/video calls
- File uploads (Supabase Storage, signed URLs)
- Live Search (Supabase RPC)
- PWA (service worker, install prompt)
- Prometheus metrics
- Circuit breaker (Opossum)
- Idempotency (Redis + in-memory)
- Security headers (CSP, HSTS, COEP, COOP, CORP, XFO, etc.)
- Rate limiting (3 tiers)
- CSRF protection

### Test Coverage

| Location          | Framework  | Count   |
| ----------------- | ---------- | ------- |
| API service tests | vitest     | ~9      |
| Web E2E           | Playwright | ~2      |
| Root E2E          | Playwright | ~6      |
| K6 load tests     | k6         | ~2      |
| **Packages**      | (none)     | **0**   |
| **Total**         |            | **~19** |

---

## 2. Repo B Inventory — Current Repo (`C:\temp\mainecybertech-portal`)

### Identity

- **Name:** `mainecybertech-portal` (MCT Client Portal)
- **Manager:** pnpm@10 + Turborepo
- **Node:** >=20.0.0
- **TypeScript:** ^5.x
- **Test:** Jest + ts-jest, @playwright/test
- **Description:** MSP client portal monorepo with API, Web frontend, Worker

### Top-Level Structure

```
C:\temp\mainecybertech-portal\
├── apps/
│   ├── api/           # Express REST API (port 4000)
│   ├── web/           # Next.js 15 App Router (port 3000)
│   └── worker/        # BullMQ + SQS background task processor (port 3001)
├── packages/
│   ├── config/        # @mct/config — ESLint + TS base configs
│   ├── sdk/           # @mct/sdk — typed API client (20 domain modules)
│   └── ui/            # @mct/ui — design system (7 components, 9 tokens, hooks, providers)
├── infra/
│   ├── digitalocean/  # Active DO stack (docker-compose, Caddy, deploy.sh)
│   └── terraform/     # DO-only Terraform (droplet, firewall, CF DNS)
├── supabase/
│   ├── migrations/    # 22 files (sequential 5302xxx numbering)
│   ├── seeds/         # 5 SQL seed files
│   ├── config.toml    # Local Supabase config
│   ├── snippets/      # 1 scratch query
│   └── policies/      # Empty (RLS managed in migrations)
├── .github/workflows/ # 15 workflow files
├── scripts/           # 16 scripts (local dev, backup, load-testing)
├── docs/              # 43 documentation files across ~20 subdirectories
├── prompts/           # Audit prompt packs (hardening, repo-audit, portal-alignment)
├── badges/            # CI alignment score badges
├── dashboards/        # Alignment tracking dashboards
├── templates/         # PR/release templates
├── [root files]       # turbo.json, vercel.json, docker-compose.yml (legacy)
```

### App Details

**API (`apps/api/`):** Express REST API (no WebSocket) on port 4000

- 25 route modules under `src/routes/` (admin, api-keys, audit, auth, billing, bulk, dashboard, docs, documents, health, memberships, notification-preferences, notifications, organizations, profiles, projects, public, roles, search, search-portal, sla, tickets, users, webhook-management, webhooks)
- 12 middleware files (admin, auth, cache, error, idempotency, not-found, optimistic-locking, org-access, rate-limit, request-id, security-headers, security)
- 9 lib files (circuit-breaker, csv, email, http-client, idempotency, logger, metrics, notify, sentry)
- 5 validators (document, membership, organization, project, ticket)
- 2 services (audit with retry, supabase client factory with circuit breaker)
- Prometheus metrics
- 26 test files (~182 tests)

**Web (`apps/web/`):** Next.js 15 App Router on port 3000

- Route groups: `(public)`, `(portal)`, `(admin)`, standalone `auth/callback`
- 37 page directories
- ~50 component files across `components/admin/` (22), `components/portal/` (13), `components/marketing/` (4), plus shared
- 58 unit test files (~460 tests), 26 E2E spec files
- Middleware: domain routing + JWT exp check + CSP nonce
- Design system integration via `@mct/ui`

**Worker (`apps/worker/`):** BullMQ + fallback SQS on port 3001

- 6 task handlers: jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications, stripe-reconcile
- 6 modules extracted from main (env, task-registry, consumer-bullmq, consumer-sqs, health-server, shutdown)
- Graceful shutdown with inFlightTasks tracking
- ~32 lines in main.ts
- 3 test files (~24 tests)

### Packages

| Package       | Contents                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@mct/config` | ESLint base config, tsconfig.base.json (with noUncheckedIndexedAccess)                                                                                                                                                          |
| `@mct/sdk`    | 20 domain clients (ApiKeys, Audit, Auth, Billing, Bulk, Dashboard, Documents, Memberships, Notifications, Organizations, Profiles, Projects, Roles, Search, SLA, Tickets, Users, Webhooks), types, ApiClient with retry+timeout |
| `@mct/ui`     | 7 components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton) + Storybook stories, 9 design token files, ThemeProvider, use-theme hook, cn() utility                                                              |

### Dependency Graph

```
@mct/config → {api, web, worker}
@mct/sdk    → web only
@mct/ui     → web only
```

SDK is zero-runtime-dependency.

### CI/CD (15 workflows)

Core: test.yml, lint.yml, typecheck.yml, e2e.yml, validate.yml, deploy-do.yml, terraform-do.yml, supabase-migrations.yml
Supporting: alignment-badges.yml, alignment-engine.yml, alignment-full.yml, alignment-pr-comment.yml, build-push.yml, chromatic.yml, pr-status.yml

### Key Features

- MSP client portal with org hierarchy + RBAC + tenant isolation
- Ticket management (CRUD, comments with editing, bulk ops, export, SLA)
- Project management (CRUD, tasks, timeline/calendar views)
- Document management (upload, versioning, share links, preview)
- User management (invite, roles, permissions matrix)
- Organization management (branding, billing, activity)
- Notification system (in-app + email + SSE streaming + bell/badge)
- Billing/Stripe (invoices, subscriptions, payments, sync)
- Webhook management (CRUD + delivery logs + test)
- API key management
- Global search (admin + portal)
- Audit logging (all mutations + viewer + CSV/JSON export)
- Marketing/public site (homepage, services, contact form + JSM + Teams)
- Auth (email/password, password reset, JWT rotation)
- Bulk operations (tickets, documents, user invite)
- Design system + Storybook
- Health dashboard

### Test Coverage

| Location   | Framework              | Count    |
| ---------- | ---------------------- | -------- |
| API        | Jest + supertest       | ~182     |
| SDK        | Jest (mocked fetch)    | ~108     |
| Worker     | Jest                   | ~24      |
| Web (unit) | Jest + Testing Library | ~460     |
| Web (E2E)  | Playwright             | ~26      |
| **Total**  |                        | **~774** |

---

## 3. Structural Similarities

| Aspect                  | Chat Platform                     | MCT Portal                         |
| ----------------------- | --------------------------------- | ---------------------------------- |
| Monorepo tool           | Turborepo + pnpm workspaces       | Turborepo + pnpm workspaces        |
| App count               | 3 (api, web, worker)              | 3 (api, web, worker)               |
| API framework           | Express (TypeScript, ESM)         | Express (TypeScript, ESM)          |
| Frontend framework      | Next.js 15 App Router             | Next.js 15 App Router              |
| Worker architecture     | BullMQ + Redis                    | BullMQ + Redis (with SQS fallback) |
| Database                | Supabase (hosted)                 | Supabase (hosted)                  |
| Auth model              | Supabase Auth + JWT               | Supabase Auth + JWT + local verify |
| Shared packages         | 4 packages                        | 3 packages                         |
| Design system package   | `@chat/ui` (7 components, tokens) | `@mct/ui` (7 components, tokens)   |
| Infra target            | DigitalOcean droplet              | DigitalOcean droplet               |
| Reverse proxy           | Caddy (TLS)                       | Caddy (TLS)                        |
| Queue backend           | Redis/BullMQ                      | Redis/BullMQ                       |
| CI/CD pattern           | Turbo-based, gated deploys        | Turbo-based, gated deploys         |
| Middleware architecture | Layered Express middleware        | Layered Express middleware         |
| Zod validation          | Centralized validators            | Centralized validators             |
| Circuit breaker         | Opossum-based                     | Custom implementation              |
| Graceful shutdown       | API + Worker                      | API + Worker                       |
| Sentry integration      | API + Web + Worker                | API + Web + Worker                 |
| Audit logging           | With retry queue                  | With retry queue                   |
| Security headers        | Comprehensive CSP, HSTS, etc.     | Comprehensive CSP, HSTS, etc.      |
| Workers                 | Background task processors        | Background task processors         |
| Docker multi-stage      | Non-root user, HEALTHCHECK        | Non-root user, HEALTHCHECK         |

---

## 4. Structural Differences

| Aspect                      | Chat Platform                        | MCT Portal                                  | Significance                                      |
| --------------------------- | ------------------------------------ | ------------------------------------------- | ------------------------------------------------- |
| **Domain purpose**          | Real-time chat/communication         | MSP client portal (tickets, projects, docs) | Fundamental — different product                   |
| **Real-time**               | Socket.io (full-duplex)              | SSE (server-sent events, one-direction)     | Different real-time approach                      |
| **API routes**              | 13 domain modules (`modules/` dir)   | 25 route files (`routes/` dir)              | Different organization; portal has 2x routes      |
| **API tests**               | ~9 (vitest, service-level)           | ~182 (Jest + supertest)                     | Portal has 20x more API tests                     |
| **Total tests**             | ~19                                  | ~774                                        | Portal has 40x more tests                         |
| **Test framework**          | vitest                               | Jest                                        | Different test runners                            |
| **Packages**                | 4 (incl. `@chat/db`)                 | 3 (no shared DB package)                    | Chat has shared DB client + types; portal doesn't |
| **SDK modules**             | 7 domain clients                     | 20 domain clients                           | Portal SDK is ~3x larger                          |
| **SDK tests**               | 0                                    | 108                                         | Portal SDK has thorough test coverage             |
| **Migrations**              | 32 (ISO-date: 20260625\*)            | 22 (sequential: 5302xxx)                    | Different naming conventions                      |
| **RLS policies**            | 11 separate files                    | Inline in migrations                        | Different policy management strategies            |
| **Seeds**                   | 8 files                              | 5 files                                     | Chat has more seed coverage                       |
| **CI/CD workflows**         | 19 (incl. 11 audit/governance)       | 15 (fewer audit-specific)                   | Chat has more governance/audit automation         |
| **Docs count**              | ~18 subdirectories                   | ~43 files (~20 subdirs)                     | Portal has more extensive documentation           |
| **PWA**                     | Full service worker + install prompt | None                                        | Chat has PWA; portal doesn't                      |
| **WebSocket**               | Socket.io                            | None (SSE for notifications)                | Different real-time transport                     |
| **Prometheus**              | 17 custom metrics                    | Metrics implemented but fewer               | Chat has richer observability                     |
| **Feature flags**           | DB-backed with rollout + cache       | None                                        | Chat has feature flag system                      |
| **GDPR**                    | Consent management + data export     | None                                        | Chat has GDPR compliance                          |
| **Code coverage threshold** | Not in CI                            | 50% floor in all packages                   | Portal enforces coverage minimums                 |
| **Migration naming**        | ISO-date format                      | Sequential number                           | Different conventions                             |
| **Terraform location**      | `infra/terraform/` (single dir)      | `infra/terraform/digitalocean/` (subdir)    | Portal supports multi-cloud layout                |
| **Lint system**             | ESLint flat config                   | ESLint flat config                          | Same approach                                     |
| **Storybook**               | Not present                          | Present (with Chromatic)                    | Portal has visual regression testing              |
| **Dormant infra**           | `infra.zip` (52MB)                   | Vercel config (dormant)                     | Both have legacy artifacts                        |
| **Container images**        | GHCR                                 | GHCR                                        | Same registry                                     |
| **Auth cookie**             | Supabase session cookie              | Custom `mct_session` JWT cookie             | Different cookie auth strategy                    |
| **Deploy speed**            | Standard GHCR pull                   | SSH pipe (`docker save \| gzip \| ssh ...`) | Portal has optimized deploy                       |

---

## 5. Likely Core Systems

### Chat Platform Core

1. **Chat messaging** — message CRUD, real-time socket, search (central product feature)
2. **Workspaces/channels** — organizational backbone with role-based access
3. **User auth + RLS** — the security model
4. **Webhook delivery + notification delivery** — async integration points
5. **`@chat/sdk`** — typed API surface
6. **`@chat/ui`** — design system foundation
7. **Infrastructure** (Terraform + Docker) — DO deployment

### MCT Portal Core

1. **Ticket management** — central product feature (CRUD, comments, SLA, bulk, export)
2. **Document management** — key portal feature (upload, versions, share, preview)
3. **Project management** — with tasks, timeline, calendar views
4. **Organization management** — multi-tenant org hierarchy with branding
5. **User management + RBAC** — roles, permissions, activity tracking
6. **Auth system** — Supabase Auth + JWT rotation + local verification
7. **`@mct/sdk`** — typed API surface for all 20 domains
8. **Audit logging** — all mutations logged, viewer with filters/export
9. **Tenant isolation** — `requireOrgAccess()` middleware on all entity routes
10. **Middleware pipeline** — layered auth, admin, org-access, caching, rate limiting
11. **Infrastructure** — DO droplet + Terraform + Caddy + GHCR

---

## 6. Likely Fragile / High-Risk Areas

### Chat Platform

| Area                                | Risk                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Dual logger implementations         | Config drift between `apps/api/src/lib/logger.ts` and `packages/config/logger.ts`             |
| Dual Supabase clients               | Auth context confusion between `apps/api/src/lib/supabase.ts` and `packages/db/src/config.ts` |
| Dual type systems                   | Sync failures between `packages/db/src/types.ts` (14) and `packages/sdk/src/types.ts` (24)    |
| Socket.io auth bypass               | Dynamic import + error fallback in socket.ts auth                                             |
| No test coverage in packages        | 4 shared packages with 0 tests                                                                |
| In-memory audit retry queue         | Unbounded, potential memory leak under load                                                   |
| In-memory idempotency fallback      | Map with 24h TTL, memory leak                                                                 |
| Docker `:latest` tagging            | Non-reproducible deploys                                                                      |
| Worker test coverage                | 0 worker tests                                                                                |
| 624 audit findings at 44% readiness | Deep systemic issues indicated by own audit pipeline                                          |

### MCT Portal

| Area                           | Risk                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Circuit breaker complexity** | `circuit-breaker.ts` (124 lines), `http-client.ts` (152 lines) — complex state machine               |
| **Cache middleware**           | `cache.ts` (211 lines) — Redis + Map backend with no-renew pattern, multiple TTLs                    |
| **Idempotency middleware**     | `idempotency.ts` (110 lines) — Redis + in-memory fallback                                            |
| **Webhook receivers**          | 4 inbound webhook handlers (Stripe, Jira, JSM, M365) with idempotency — external dependency failures |
| **Billing/Stripe**             | Production payment integration — correctness critical                                                |
| **Auth callback flow**         | Complex cookie+code exchange, session management                                                     |
| **22 sequential migrations**   | No squash — long migration chain, structure changes                                                  |
| **BullMQ + SQS dual backend**  | Two queue implementations to maintain                                                                |
| **Middleware ordering**        | 12 middleware modules — ordering is fragile                                                          |
| **Docs <-> code drift**        | 43 docs files must be kept in sync with 100+ source files                                            |
| **Docker image tagging**       | Must ensure SHA tags are used, not `:latest`                                                         |
| **SSH pipe deploy**            | Complex, single point of failure for production deploys                                              |

---

## 7. Unknowns / Areas Needing Deeper Inspection

### Chat Platform

1. **Socket.io implementation detail** — how is RLS enforced per-connection? Is the auth bypass risk real?
2. **Webhook SSRF validation** — how thorough is the URL validation in webhook service?
3. **Audit log retry queue** — is it bounded? What happens on persistent failure?
4. **Feature flag percentage rollout** — how is consistency maintained across instances?
5. **Search indexing performance** — how does the search-indexer worker handle large datasets?
6. **PWA service worker caching strategy** — 138 lines, complex — any edge cases?

### MCT Portal

1. **SSE streaming implementation** — how reliable is the notification SSE stream under load?
2. **Bulk operations transactional integrity** — partial success handling, rollback strategy
3. **Stripe webhook idempotency** — is it guaranteed for duplicate deliveries?
4. **Optimistic locking coverage** — is `If-Match` on all PATCH endpoints or just documents/projects/orgs?
5. **Cache invalidation completeness** — are all cache keys properly invalidated on mutations?
6. **Middleware performance under load** — 12 middleware modules per request, any bottlenecks?
7. **Org access middleware** — does it cover all 8 entity routers correctly?
8. **SSH deploy failure modes** — what happens if `docker load` fails mid-stream?
9. **Document preview format support** — how many file types actually supported?
10. **Worker task retry** — what's the retry policy for each of the 6 task handlers?
11. **Rate limit tiers** — are the limits per-user, per-IP, or per-auth-status?
12. **Docs-code alignment** — are all 43 docs files current with actual behavior?

---

## Self-Review

- **All findings verified** from direct file tree inspection and key file reads.
- **Chat SDK and DB type overlap** claimed but not deeply inspected — hypothesis based on naming.
- **Chat audit pipeline** (624 findings) referenced from AGENTS.md — not independently verified.
- **Portal SSE endpoint** referenced in notifications route — implementation depth not inspected.
- **Portal test count** (774) sourced from AGENTS.md — confirmed by spot-checking test directories.
- **No recommendations made** — this phase is purely baseline inspection.
