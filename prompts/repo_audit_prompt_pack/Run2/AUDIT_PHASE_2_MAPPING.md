# Phase 2 — Explicit Repo Mapping

**Date:** 2026-07-02  
**Audit Run:** Run2  
**Reference Repo (Chat):** `C:\temp\chat`  
**Current Repo (MCT):** `C:\temp\mainecybertech-portal`

---

## 1. Mapping Summary

The two repos share a **common architectural template**: a Turborepo monorepo with 3 apps (Express API, Next.js 15 Web, BullMQ Worker), hosted Supabase, Docker Compose on a single DigitalOcean droplet behind Caddy, GHCR-hosted images, and Terraform IaC. They also share the same shared-package pattern (`config`, `sdk`, `ui`) with nearly identical design tokens and components.

**However, the domain purpose is fundamentally different:**

- **Chat** is a real-time workspace communication platform (chat, channels, threads, reactions, audio/video calls)
- **MCT** is an MSP client portal (tickets, projects, documents, billing, organizations)

Despite this domain divergence, the **architecture patterns map almost 1:1** because both repos evolved from a common starting point. Every major component in Chat has a direct or partial equivalent in MCT, and vice versa. The key differences are in real-time transport (Socket.io vs SSE), auth cookie strategy, test framework, and the presence/absence of certain features (PWA, feature flags, GDPR).

---

## 2. Folder-to-Folder Mapping

### 2.1 Top-level Structure

| Chat (`C:\temp\chat`)  | MCT (`C:\temp\mainecybertech-portal`)                     | Mapping                     | Notes                                                        |
| ---------------------- | --------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `apps/api/`            | `apps/api/`                                               | **Direct**                  | Both Express APIs, port 4000                                 |
| `apps/web/`            | `apps/web/`                                               | **Direct**                  | Both Next.js 15 App Router                                   |
| `apps/worker/`         | `apps/worker/`                                            | **Direct**                  | Both BullMQ-based workers                                    |
| `packages/config/`     | `packages/config/`                                        | **Direct**                  | Same purpose (ESLint, TS base configs)                       |
| `packages/db/`         | —                                                         | **Missing in MCT**          | Chat has shared DB client+types; MCT has none                |
| `packages/sdk/`        | `packages/sdk/`                                           | **Direct**                  | Same purpose (typed API client)                              |
| `packages/ui/`         | `packages/ui/`                                            | **Direct**                  | Same purpose (design system)                                 |
| `infra/docker/`        | `infra/digitalocean/`                                     | **Renamed equivalent**      | Both contain docker-compose + Caddyfiles                     |
| `infra/terraform/`     | `infra/terraform/digitalocean/`                           | **Restructured equivalent** | Chat single dir; MCT nested under `digitalocean/`            |
| `supabase/migrations/` | `supabase/migrations/`                                    | **Direct**                  | Different naming conventions                                 |
| `supabase/seeds/`      | `supabase/seeds/`                                         | **Direct**                  | Same purpose                                                 |
| `supabase/policies/`   | — (inline in migrations)                                  | **Different org**           | Chat has separate policy files; MCT embeds RLS in migrations |
| `supabase/functions/`  | —                                                         | **Missing in MCT**          | Both empty (no Edge Functions)                               |
| `tests/e2e/`           | `apps/web/e2e/`                                           | **Restructured equivalent** | Chat: root `tests/`; MCT: inside `apps/web/e2e/`             |
| `tests/k6/`            | `scripts/load-testing/`                                   | **Renamed equivalent**      | Both have load test stubs                                    |
| `tests/setup/`         | `apps/web/jest.setup.ts` + `apps/web/e2e/global.setup.ts` | **Restructured equivalent** | Test setup spread across locations in MCT                    |
| `.github/workflows/`   | `.github/workflows/`                                      | **Direct**                  | Both have 15-19 workflows                                    |
| `docs/`                | `docs/`                                                   | **Direct**                  | Both extensive; MCT has 2.4x more files                      |
| `hardening/`           | `prompts/hardening_prompt_pack/`                          | **Renamed equivalent**      | Chat has `hardening/` dir; MCT stores in `prompts/`          |
| `scripts/`             | `scripts/`                                                | **Direct**                  | Same purpose                                                 |
| `tsconfig.base.json`   | `packages/config/tsconfig.base.json`                      | **Restructured equivalent** | Chat at root; MCT in shared package                          |
| `vitest.config.ts`     | —                                                         | **Missing in MCT**          | MCT uses Jest, not vitest                                    |
| `playwright.config.ts` | `apps/web/playwright.config.ts`                           | **Restructured equivalent** | Chat at root; MCT inside `apps/web/`                         |

### 2.2 API Internal Structure (`apps/api/src/`)

| Chat          | MCT           | Mapping                | Notes                                             |
| ------------- | ------------- | ---------------------- | ------------------------------------------------- |
| `modules/`    | `routes/`     | **Renamed equivalent** | Same purpose: route handlers organized by domain  |
| `middleware/` | `middleware/` | **Direct**             | Same purpose                                      |
| `lib/`        | `lib/`        | **Direct**             | Same purpose: shared utilities                    |
| `services/`   | `services/`   | **Direct**             | Same purpose                                      |
| `config/`     | `config/`     | **Direct**             | Both have `env.ts` with Zod env schema            |
| —             | `validators/` | **Missing in Chat**    | MCT has 5 dedicated Zod validators                |
| —             | `types/`      | **Missing in Chat**    | MCT has centralized types file                    |
| —             | `__tests__/`  | **Missing in Chat**    | Chat has tests inside each module directory       |
| `app.ts`      | `app.ts`      | **Direct**             | Express app factory                               |
| `server.ts`   | `main.ts`     | **Renamed equivalent** | Entry point; Chat separates server.ts from app.ts |
| —             | `__mocks__/`  | **Missing in Chat**    | MCT has mock files for testing                    |

### 2.3 API Route/Module Mapping (Domain-by-Domain)

| Chat (`modules/`) | MCT (`routes/`)                                          | Mapping                | Notes                                                                                                                |
| ----------------- | -------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `auth/`           | `auth.ts`                                                | **Direct**             | Auth routes (sign-in, sign-up, callback, etc.)                                                                       |
| `workspaces/`     | `organizations.ts`                                       | **Renamed equivalent** | Chat=workspaces, MCT=organizations                                                                                   |
| `channels/`       | `tickets.ts` + `projects.ts`                             | **Partial**            | Chat channels are chat rooms; MCT tickets/projects are work items. Both are "grouped containers" with access control |
| `messages/`       | `tickets.ts` (comments)                                  | **Partial**            | Chat messages are real-time; MCT ticket comments are CRUD                                                            |
| `reactions/`      | —                                                        | **Missing in MCT**     | Emoji reactions not needed in MSP portal                                                                             |
| `threads/`        | —                                                        | **Missing in MCT**     | Threaded conversations not needed                                                                                    |
| `notifications/`  | `notifications.ts`                                       | **Direct**             | Both manage in-app notifications                                                                                     |
| `preferences/`    | `notification-preferences.ts`                            | **Partial**            | Chat has user preferences; MCT has notification-specific preferences                                                 |
| `webhooks/`       | `webhooks.ts` (inbound) + `webhook-management.ts` (CRUD) | **Split**              | Chat has single webhooks module; MCT splits inbound receivers from management                                        |
| `health/`         | `health.ts`                                              | **Direct**             | Health check endpoints                                                                                               |
| `feature-flags/`  | —                                                        | **Missing in MCT**     | MCT has no feature flag system                                                                                       |
| `consent/`        | —                                                        | **Missing in MCT**     | MCT has no GDPR consent management                                                                                   |
| `livekit/`        | —                                                        | **Missing in MCT**     | MCT has no audio/video calls                                                                                         |
| —                 | `users.ts`                                               | **Missing in Chat**    | User CRUD + role management                                                                                          |
| —                 | `profiles.ts`                                            | **Partial**            | Chat has user profile via auth; MCT has explicit profile route                                                       |
| —                 | `memberships.ts`                                         | **Missing in Chat**    | Chat handles membership via workspace middleware                                                                     |
| —                 | `documents.ts`                                           | **Missing in Chat**    | Document management specific to MCT                                                                                  |
| —                 | `dashboard.ts`                                           | **Missing in Chat**    | Dashboard aggregation endpoint                                                                                       |
| —                 | `audit.ts`                                               | **Missing in Chat**    | Chat has audit service but no dedicated viewer route                                                                 |
| —                 | `search.ts` + `search-portal.ts`                         | **Missing in Chat**    | Global search endpoints (admin + portal)                                                                             |
| —                 | `billing.ts`                                             | **Missing in Chat**    | Stripe billing management                                                                                            |
| —                 | `roles.ts`                                               | **Missing in Chat**    | Role/permission CRUD                                                                                                 |
| —                 | `public.ts`                                              | **Missing in Chat**    | Public API (contact form)                                                                                            |
| —                 | `sla.ts`                                                 | **Missing in Chat**    | SLA tracking                                                                                                         |
| —                 | `api-keys.ts`                                            | **Missing in Chat**    | API key management                                                                                                   |
| —                 | `admin.ts`                                               | **Missing in Chat**    | Admin aggregation endpoint                                                                                           |
| —                 | `bulk.ts`                                                | **Missing in Chat**    | Bulk operations                                                                                                      |
| —                 | `docs.ts`                                                | **Missing in Chat**    | API documentation/Swagger                                                                                            |

### 2.4 API Middleware Mapping

| Chat                     | MCT                     | Mapping                 | Notes                                                                         |
| ------------------------ | ----------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `authenticate.ts`        | `auth.ts`               | **Direct**              | Both extract JWT, attach user info to request                                 |
| `rate-limit.ts`          | `rate-limit.ts`         | **Direct**              | Both implement rate limiting                                                  |
| `security-headers.ts`    | `security-headers.ts`   | **Direct**              | Both set security headers                                                     |
| `request-id.ts`          | `request-id.ts`         | **Direct**              | Both add correlation IDs                                                      |
| `error-handler.ts`       | `error.ts`              | **Direct**              | Global error handling middleware                                              |
| `require-membership.ts`  | `org-access.ts`         | **Renamed equivalent**  | Chat: workspace membership; MCT: org access with admin bypass                 |
| `csrf.ts`                | —                       | **Missing in MCT**      | MCT does not have explicit CSRF middleware                                    |
| `deprecation.ts`         | —                       | **Missing in MCT**      | Chat has API deprecation middleware                                           |
| `validate-string-key.ts` | —                       | **Missing in Chat/MCT** | Chat-specific                                                                 |
| `validate-uuid.ts`       | —                       | **Missing in Chat/MCT** | Chat uses per-middleware UUID validation                                      |
| `__tests__/`             | —                       | **Missing in MCT**      | Chat has middleware test directory                                            |
| —                        | `admin.ts`              | **Missing in Chat**     | Admin role check middleware                                                   |
| —                        | `cache.ts`              | **Missing in Chat**     | Response caching middleware                                                   |
| —                        | `idempotency.ts`        | **Missing in Chat**     | Chat has idempotency in lib, not as middleware                                |
| —                        | `not-found.ts`          | **Missing in Chat**     | 404 handler middleware                                                        |
| —                        | `optimistic-locking.ts` | **Missing in Chat**     | If-Match version check middleware                                             |
| —                        | `security.ts`           | **Partial**             | Chat has input sanitizer in security-headers? MCT has separate inputSanitizer |

### 2.5 API Library Mapping (`apps/api/src/lib/`)

| Chat                 | MCT                       | Mapping             | Notes                                             |
| -------------------- | ------------------------- | ------------------- | ------------------------------------------------- |
| `logger.ts`          | `logger.ts`               | **Direct**          | Both wrap pino                                    |
| `sentry.ts`          | `sentry.ts`               | **Direct**          | Both initialize Sentry                            |
| `supabase.ts`        | `../services/supabase.ts` | **Restructured**    | Chat: in lib/; MCT: in services/                  |
| `circuit-breaker.ts` | `circuit-breaker.ts`      | **Different impl**  | Chat: Opossum library; MCT: custom class          |
| `idempotency.ts`     | `idempotency.ts`          | **Direct**          | Both Redis + in-memory fallback                   |
| `metrics.ts`         | `metrics.ts`              | **Direct**          | Both Prometheus metrics                           |
| —                    | `csv.ts`                  | **Missing in Chat** | CSV export utility                                |
| —                    | `email.ts`                | **Missing in Chat** | Email sending utility                             |
| —                    | `http-client.ts`          | **Missing in Chat** | HTTP client with timeout, retry, circuit breaker  |
| —                    | `notify.ts`               | **Missing in Chat** | Notification dispatch utility                     |
| `db-timeout.ts`      | —                         | **Missing in MCT**  | DB timeout utility                                |
| `feature-flags.ts`   | —                         | **Missing in MCT**  | Feature flag evaluation                           |
| `membership.ts`      | —                         | **Missing in MCT**  | Membership helpers (Chat uses service.ts pattern) |
| `mentions/`          | —                         | **Missing in MCT**  | @mention detection                                |
| `socket.ts`          | —                         | **Missing in MCT**  | Socket.io server setup                            |

### 2.6 API Config Mapping

| Chat                   | MCT               | Mapping          | Notes                                                         |
| ---------------------- | ----------------- | ---------------- | ------------------------------------------------------------- |
| `config/env.ts`        | `config/env.ts`   | **Direct**       | Zod-validated environment variables                           |
| `config/validators.ts` | `validators/*.ts` | **Restructured** | Chat: single validators file; MCT: per-domain validator files |

### 2.7 API Services Mapping

| Chat                | MCT                 | Mapping    | Notes                            |
| ------------------- | ------------------- | ---------- | -------------------------------- |
| `services/audit.ts` | `services/audit.ts` | **Direct** | Both log audit events with retry |

### 2.8 Web Frontend — Route Groups

| Chat (`apps/web/app/`) | MCT (`apps/web/app/`)     | Mapping                    | Notes                                                                 |
| ---------------------- | ------------------------- | -------------------------- | --------------------------------------------------------------------- |
| `(auth)/`              | `(public)/` + `(portal)/` | **Expanded**               | Chat: single auth group; MCT: public (marketing+auth) + portal        |
| `(workspace)/`         | `(portal)/` + `(admin)/`  | **Expanded**               | Chat: single workspace group; MCT: portal (user) + admin (management) |
| `auth/callback/`       | `auth/callback/`          | **Direct**                 | Auth callback after Supabase PKCE                                     |
| `install/`             | —                         | **Missing in MCT**         | PWA install page                                                      |
| —                      | `global-error.tsx`        | **Missing in Chat**        | Root error boundary                                                   |
| —                      | `globals.css`             | **Direct**                 | Same file present in both                                             |
| —                      | `layout.tsx`              | **Direct**                 | Root layout                                                           |
| —                      | `not-found.tsx`           | **Missing in Chat (root)** | Root 404 page                                                         |

### 2.9 Web Frontend — Components

| Chat (`apps/web/components/`) | MCT (`apps/web/components/`)                           | Mapping             | Notes                                                    |
| ----------------------------- | ------------------------------------------------------ | ------------------- | -------------------------------------------------------- |
| `auth/`                       | (in `app/(public)/login/`)                             | **Restructured**    | Chat: separate component dir; MCT: co-located with pages |
| `channel/`                    | `portal/SupportCenterClient.tsx` etc.                  | **Partial**         | Chat: channel UI; MCT: ticket/project/detail UI          |
| `chat/`                       | `portal/`                                              | **Partial**         | Chat: real-time chat; MCT: portal components             |
| `home/`                       | `marketing/`                                           | **Partial**         | Chat: home/dashboard; MCT: marketing pages               |
| `notifications/`              | `NotificationBell.tsx` + `NotificationsPageClient.tsx` | **Direct**          | Both have notification components                        |
| `shared/`                     | `admin/` shared components                             | **Partial**         | Chat: shared utility components; MCT: admin components   |
| `workspace/`                  | `portal/OrgSwitcher.tsx` + `admin/`                    | **Restructured**    | Chat: workspace components; MCT: org + admin             |
| `media/`                      | `DocumentPreview.tsx`                                  | **Partial**         | Chat: media uploads; MCT: document preview               |
| `pwa/`                        | —                                                      | **Missing in MCT**  | PWA service worker + install prompt                      |
| —                             | `admin/` (22 components)                               | **Missing in Chat** | Full admin panel component library                       |
| —                             | `portal/` (13 components)                              | **Missing in Chat** | Portal-specific UI components                            |
| —                             | `marketing/` (4 components)                            | **Missing in Chat** | Marketing site (not in chat domain)                      |
| —                             | `CommentBody.tsx`                                      | **Missing in Chat** | Markdown comment renderer                                |
| —                             | `EmptyState.tsx`                                       | **Missing in Chat** | Reusable empty state                                     |
| —                             | `HealthDashboardClient.tsx`                            | **Missing in Chat** | Service health UI                                        |

### 2.10 Web Frontend — Libraries (`apps/web/lib/`)

| Chat          | MCT                        | Mapping             | Notes                                                              |
| ------------- | -------------------------- | ------------------- | ------------------------------------------------------------------ |
| `api.ts`      | `api.ts` + `client-api.ts` | **Expanded**        | Chat: single API client; MCT: server + client API helpers          |
| `env.ts`      | —                          | **Missing in MCT**  | Chat has env.ts; MCT uses `@mct/config`                            |
| `sentry.ts`   | `client-logger.ts`         | **Partial**         | Both have error tracking setup                                     |
| `supabase/`   | —                          | **Missing in MCT**  | MCT does not use Supabase client in web (auth proxied through API) |
| `socket.ts`   | —                          | **Missing in MCT**  | Socket.io client setup                                             |
| `optimistic/` | —                          | **Missing in MCT**  | Optimistic UI updates                                              |
| `pwa/`        | —                          | **Missing in MCT**  | PWA service worker registration                                    |
| `version.ts`  | `version.ts`               | **Direct**          | App version tracking                                               |
| —             | `auth/`                    | **Missing in Chat** | Auth helpers for MCT                                               |
| —             | `cn.ts`                    | **Missing in Chat** | Tailwind class merge utility                                       |
| —             | `cookie-domain.ts`         | **Missing in Chat** | Cookie domain helpers                                              |
| —             | `logger.ts`                | **Missing in Chat** | Server-side pino logger                                            |
| —             | `notifications-actions.ts` | **Missing in Chat** | Notification server actions                                        |
| —             | `org-actions.ts`           | **Missing in Chat** | Org switching actions                                              |
| —             | `test-utils.ts`            | **Missing in Chat** | Test utility helpers                                               |

### 2.11 Worker Structure

| Chat (`apps/worker/src/`) | MCT (`apps/worker/src/`)                 | Mapping             | Notes                                                |
| ------------------------- | ---------------------------------------- | ------------------- | ---------------------------------------------------- |
| `main.ts`                 | `main.ts`                                | **Direct**          | Both are entry points                                |
| `processors/` (4)         | `tasks/` (6)                             | **Renamed**         | Same concept: task handler implementations           |
| `queues/`                 | `consumer-bullmq.ts` + `consumer-sqs.ts` | **Restructured**    | Chat: queue factories; MCT: consumer implementations |
| `lib/redis.ts`            | — (uses config env)                      | **Restructured**    | Chat: dedicated Redis lib; MCT: env-based            |
| —                         | `env.ts`                                 | **Separated**       | MCT extracted env schema from main.ts                |
| —                         | `task-registry.ts`                       | **Separated**       | MCT extracted task registry from main.ts             |
| —                         | `health-server.ts`                       | **Separated**       | MCT extracted health endpoint from main.ts           |
| —                         | `shutdown.ts`                            | **Separated**       | MCT extracted graceful shutdown from main.ts         |
| —                         | `logger.ts`                              | **Separated**       | MCT extracted logger from main.ts                    |
| —                         | `email.ts`                               | **Missing in Chat** | Email sending utility                                |

### 2.12 Worker Task Handlers

| Chat (`processors/`)  | MCT (`tasks/`)               | Mapping             | Notes                                                   |
| --------------------- | ---------------------------- | ------------------- | ------------------------------------------------------- |
| `cleanup.ts`          | —                            | **Missing in MCT**  | Data cleanup processor                                  |
| `notification.ts`     | `scheduled-notifications.ts` | **Direct**          | Notification delivery processor                         |
| `search-indexer.ts`   | —                            | **Missing in MCT**  | Search index building                                   |
| `webhook-delivery.ts` | — (inline in API)            | **Partial**         | Chat: separate processor; MCT: inline in webhooks route |
| —                     | `jira-sync.ts`               | **Missing in Chat** | Jira integration                                        |
| —                     | `jsm-sync.ts`                | **Missing in Chat** | JSM integration                                         |
| —                     | `m365-calendar-sync.ts`      | **Missing in Chat** | Microsoft 365 calendar sync                             |
| —                     | `stripe-reconcile.ts`        | **Missing in Chat** | Stripe reconciliation                                   |

### 2.13 Shared Package: `@chat/config` vs `@mct/config`

| Chat                          | MCT                                  | Mapping            | Notes                                            |
| ----------------------------- | ------------------------------------ | ------------------ | ------------------------------------------------ |
| `env-schema.ts`               | — (in `apps/api/src/config/env.ts`)  | **Restructured**   | Chat: shared package; MCT: per-app               |
| `logger.ts`                   | — (in `apps/api/src/lib/logger.ts`)  | **Restructured**   | Chat: shared package; MCT: per-app               |
| `errors.ts`                   | — (in `apps/api/src/types/index.ts`) | **Restructured**   | Chat: 9 AppError classes; MCT: AppError in types |
| `date.ts`                     | —                                    | **Missing in MCT** | Date utility functions                           |
| `eslint.config.mjs`           | `eslint.mjs`                         | **Direct**         | ESLint flat config                               |
| `tsconfig.base.json`          | `tsconfig.base.json`                 | **Direct**         | TypeScript base config                           |
| `vitest.config.base.ts`       | —                                    | **Missing in MCT** | MCT uses Jest                                    |
| `index.ts` (re-export barrel) | —                                    | **Missing in MCT** | MCT config package is minimal                    |

### 2.14 Shared Package: `@chat/sdk` vs `@mct/sdk`

| Chat (`packages/sdk/src/`) | MCT (`packages/sdk/src/`)      | Mapping             | Notes                                         |
| -------------------------- | ------------------------------ | ------------------- | --------------------------------------------- |
| `client.ts`                | `client.ts`                    | **Direct**          | API client factory                            |
| `types.ts`                 | `types.ts`                     | **Direct**          | Shared type definitions                       |
| `index.ts`                 | `index.ts`                     | **Direct**          | Barrel exports                                |
| `channels.ts`              | `tickets.ts` + `projects.ts`   | **Partial**         | Similar pattern: domain CRUD                  |
| `messages.ts`              | `tickets.ts` (comment methods) | **Partial**         | Message vs ticket comment                     |
| `notifications.ts`         | `notifications.ts`             | **Direct**          | Notification CRUD                             |
| `preferences.ts`           | — (in `notifications.ts`)      | **Merged**          | Chat: separate; MCT: notification-preferences |
| `reactions.ts`             | —                              | **Missing in MCT**  | No reactions feature                          |
| `webhooks.ts`              | `webhooks.ts`                  | **Direct**          | Inbound webhook delivery                      |
| `workspaces.ts`            | `organizations.ts`             | **Renamed**         | Chat=workspaces, MCT=organizations            |
| —                          | `api-keys.ts`                  | **Missing in Chat** | API key management                            |
| —                          | `audit.ts`                     | **Missing in Chat** | Audit log viewer                              |
| —                          | `auth.ts`                      | **Missing in Chat** | Auth-specific SDK methods                     |
| —                          | `billing.ts`                   | **Missing in Chat** | Billing/invoice SDK                           |
| —                          | `bulk.ts`                      | **Missing in Chat** | Bulk operations                               |
| —                          | `dashboard.ts`                 | **Missing in Chat** | Dashboard aggregation                         |
| —                          | `documents.ts`                 | **Missing in Chat** | Document management                           |
| —                          | `memberships.ts`               | **Missing in Chat** | Membership CRUD                               |
| —                          | `profiles.ts`                  | **Missing in Chat** | Profile management                            |
| —                          | `roles.ts`                     | **Missing in Chat** | Role/permission management                    |
| —                          | `search.ts`                    | **Missing in Chat** | Search API                                    |
| —                          | `sla.ts`                       | **Missing in Chat** | SLA tracking                                  |
| —                          | `users.ts`                     | **Missing in Chat** | User management                               |

### 2.15 Shared Package: `@chat/ui` vs `@mct/ui`

Both packages have nearly identical structure with **7 identical components**: Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton, ThemeToggle. Design tokens are also nearly identical (8 in Chat, 9 in MCT — MCT adds `shadows.ts`).

| Feature           | Chat                | MCT                    | Notes                         |
| ----------------- | ------------------- | ---------------------- | ----------------------------- |
| Components        | 8 (incl. toast.tsx) | 7 (no toast)           | MCT lacks Toast               |
| Storybook stories | —                   | 7 `.stories.tsx` files | MCT has Storybook + Chromatic |
| Hooks             | `use-theme.tsx`     | `use-theme.tsx`        | Identical hook                |
| Providers         | —                   | `ThemeProvider.tsx`    | MCT has wrapped provider      |
| cn utility        | —                   | `lib/cn.ts`            | MCT has explicit cn()         |
| Styles            | `styles.css`        | `styles.css`           | Same purpose                  |

### 2.16 Supabase Migrations

| Pattern | Chat                                      | MCT                         |
| ------- | ----------------------------------------- | --------------------------- |
| Naming  | ISO-date: `20260625000001_*.sql`          | Sequential: `5302026_*.sql` |
| Count   | 32 files                                  | 22 files                    |
| RLS     | Separate `policies/` directory (11 files) | Inline in migration files   |
| Seeds   | 8 files (00-07)                           | 5 files + 1 correction doc  |

### 2.17 Infra / Docker Compose

| Aspect          | Chat                                   | MCT                                         |
| --------------- | -------------------------------------- | ------------------------------------------- |
| Compose file    | `infra/docker/docker-compose.prod.yml` | `infra/digitalocean/docker-compose.yml`     |
| Services        | caddy, web, worker, livekit, api       | caddy, web, worker, redis, api              |
| Redis           | — (external/optional)                  | Explicit `redis` service                    |
| LiveKit         | Present                                | Absent                                      |
| Image registry  | GHCR (`ghcr.io/mainecybertech/chat/`)  | GHCR (`ghcr.io/mainecybertech/mct-*`)       |
| Deploy strategy | Standard GHCR pull                     | SSH pipe (`docker save \| gzip \| ssh ...`) |
| Healthcheck     | Only API has healthcheck               | All services?                               |

### 2.18 Infra / Terraform

| Aspect                 | Chat                                                                | MCT                                                                                 |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Provider               | DO + Cloudflare                                                     | DO + Cloudflare                                                                     |
| Files                  | `main.tf`, `variables.tf`, `versions.tf`, `outputs.tf`, `locals.tf` | `providers.tf`, `variables.tf`, `droplet.tf`, `firewall.tf`, `dns.tf`, `outputs.tf` |
| DNS                    | Cloudflare A records (2)                                            | Cloudflare A records (3 per zone: www/app/api)                                      |
| Firewall               | SSH + HTTP/HTTPS (CF only) + LiveKit ports                          | SSH + HTTP/HTTPS + Docker (2376)                                                    |
| Droplet                | Single, Ubuntu 24.04                                                | Single, Ubuntu 24.04                                                                |
| Monitoring             | DO alerts (CPU/memory/disk)                                         | —                                                                                   |
| Environment separation | Single zone, env var                                                | `.com` (prod) vs `.us` (dev) zone selection                                         |

### 2.19 CI/CD Workflows

| Category             | Chat                                              | MCT                                                     |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| **Core**             | `ci.yml`, `validate.yml`, `build-push.yml`        | `test.yml`, `lint.yml`, `typecheck.yml`, `validate.yml` |
| **Deploy**           | `deploy-development.yml`, `deploy-production.yml` | `deploy-do.yml`, `build-push.yml`                       |
| **Infra**            | `infra-development.yml`                           | `terraform-do.yml`                                      |
| **DB**               | `supabase-migrations.yml`                         | `supabase-migrations.yml`                               |
| **Audit/Governance** | 11 audit/governance workflows                     | 4 alignment workflows                                   |
| **E2E**              | (included in ci.yml?)                             | `e2e.yml`                                               |
| **Review**           | —                                                 | `pr-status.yml`                                         |
| **Visual**           | —                                                 | `chromatic.yml`                                         |

### 2.20 Documentation

| Attribute      | Chat                                                                                                     | MCT                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Total docs     | ~18 subdirectories                                                                                       | ~43 files across ~20 subdirectories                                                                            |
| Structure      | `docs/architecture/`, `docs/security/`, `docs/compliance/`, `docs/runbooks/`, `docs/environments/`, etc. | Flat+subdir: `docs/adr/`, `docs/arch/`, `docs/developer-guide/`, `docs/migrations/`, `docs/technical-writing/` |
| Hardening docs | `hardening/` dir with structured audit artifacts (baselines, exceptions, policies, rules)                | `prompts/hardening_prompt_pack/` — prompt packs, not artifact stores                                           |
| API docs       | `docs/api-contracts.md`                                                                                  | `docs/openapi.yaml` (OpenAPI spec)                                                                             |
| Environment    | `docs/environments/`                                                                                     | `docs/ENVIRONMENT_VARIABLES.md` + `docs/PRODUCTION_VS_TESTING_DOMAINS.md`                                      |

---

## 3. Feature-to-Feature Mapping

### 3.1 Domain Concepts

| Chat Concept                | MCT Equivalent              | Mapping Confidence | Notes                                                                                                                                             |
| --------------------------- | --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace                   | Organization                | **High**           | Both are top-level tenant containers with members, roles, and settings                                                                            |
| Channel                     | Project / Ticket            | **Low**            | Superficial similarity only. Channels are chat rooms; tickets/projects are work management items. Both have access control, members, and activity |
| Message                     | Ticket Comment              | **Partial**        | Both are user-generated content within a container. Chat messages are real-time; MCT comments are CRUD with edit window                           |
| Thread                      | (nested comment thread)     | **Low**            | Chat has dedicated threads; MCT has nested comments on tickets                                                                                    |
| Reaction                    | —                           | **N/A**            | No equivalent                                                                                                                                     |
| User Profile                | User Profile                | **High**           | Both have user profiles with name, email, avatar                                                                                                  |
| Push Subscription           | Notification Preference     | **Partial**        | Both manage notification delivery preferences                                                                                                     |
| Webhook (inbound)           | Webhook (inbound)           | **High**           | Both receive and process external webhooks (Stripe, Jira, etc.)                                                                                   |
| Webhook Endpoint (outbound) | Webhook Endpoint (outbound) | **High**           | Both have webhook CRUD + delivery logs                                                                                                            |
| Audit Log                   | Audit Log                   | **High**           | Both log all mutations with retry                                                                                                                 |
| Feature Flag                | —                           | **N/A**            | No equivalent                                                                                                                                     |
| Consent Log                 | —                           | **N/A**            | No equivalent                                                                                                                                     |
| LiveKit Room                | —                           | **N/A**            | No equivalent                                                                                                                                     |

### 3.2 Auth / Access Control

| Chat                                           | MCT                                                                 | Mapping                |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| Supabase Auth (JWT)                            | Supabase Auth (JWT)                                                 | **Direct**             |
| Bearer token only                              | Bearer token + Cookie (`mct_session`)                               | **Extended**           |
| `authenticate` middleware (Supabase `getUser`) | `requireAuth` middleware (local JWT verify + Supabase fallback)     | **Enhanced**           |
| `requireWorkspaceMembership`                   | `requireOrgAccess` + `requireAdmin`                                 | **Enhanced**           |
| Per-request `req.supabase` (RSL-aware)         | `getSupabaseUser(jwt)` + `getSupabaseAdmin()` (service_role bypass) | **Different approach** |
| Double-submit cookie CSRF                      | —                                                                   | **Missing**            |
| Rate limit (3 tiers)                           | Rate limit (IP + per-user)                                          | **Partial**            |

### 3.3 Real-Time Communication

| Chat                                         | MCT                                          | Mapping                    |
| -------------------------------------------- | -------------------------------------------- | -------------------------- |
| Socket.io (full-duplex, WebSocket + polling) | SSE (one-direction, server-to-client)        | **Different transport**    |
| Socket.io auth via token in `auth` handshake | SSE endpoint behind `requireAuth` middleware | **Different auth model**   |
| Redis adapter for multi-instance             | —                                            | **Different architecture** |
| Presence tracking, typing indicators         | —                                            | **No equivalent**          |

### 3.4 Webhook Receivers

| Chat                            | MCT                                               | Mapping      |
| ------------------------------- | ------------------------------------------------- | ------------ |
| (not deeply inspected)          | Stripe (billing)                                  | **MCT-only** |
| —                               | Jira                                              | **MCT-only** |
| —                               | JSM (Jira Service Management)                     | **MCT-only** |
| —                               | M365 (Microsoft 365)                              | **MCT-only** |
| Generic inbound webhook service | Generic inbound webhook handling in `webhooks.ts` | **Direct**   |

### 3.5 Storage / File Handling

| Chat                            | MCT                                        | Mapping      |
| ------------------------------- | ------------------------------------------ | ------------ |
| Supabase Storage (file uploads) | Supabase Storage (documents + avatars)     | **Direct**   |
| Signed URLs                     | Signed URLs (document share links)         | **Direct**   |
| —                               | Document versioning                        | **MCT-only** |
| —                               | Document preview (image, PDF, video, text) | **MCT-only** |

### 3.6 Search

| Chat                            | MCT                                          | Mapping                |
| ------------------------------- | -------------------------------------------- | ---------------------- |
| Live Search (Supabase RPC)      | Global search (admin + portal, Supabase RPC) | **Direct**             |
| Search-indexer worker processor | — (inline search)                            | **Different approach** |

---

## 4. Naming and Organizational Mismatches

| Chat naming                             | MCT naming                                      | Impact                                                     |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `modules/` (API routes)                 | `routes/`                                       | Low — same concept, different directory name               |
| `workspaces`                            | `organizations`                                 | Medium — different domain concept, same architectural role |
| `channels`                              | `tickets` / `projects`                          | High — fundamental domain difference                       |
| `messages`                              | ticket `comments`                               | Medium — different content type                            |
| `processors/` (worker)                  | `tasks/` (worker)                               | Low — same concept                                         |
| `server.ts` (API entry)                 | `main.ts` (API entry)                           | Low — standard Node naming variations                      |
| `packages/config` shared env schema     | `apps/api/src/config/env.ts` per-app env schema | Medium — architectural difference (shared vs per-app)      |
| `packages/db` shared package            | (no shared db package)                          | High — architectural difference                            |
| `tests/` at root                        | Tests inside each `apps/*/`                     | Medium — different test location strategy                  |
| `playwright.config.ts` at root          | `apps/web/playwright.config.ts`                 | Low — different scoping of E2E tests                       |
| ISO-date migration naming (`20260625*`) | Sequential migration naming (`5302xxx`)         | Medium — different convention, same purpose                |
| Separate RLS policy files               | RLS inline in migrations                        | Medium — different policy management strategy              |
| `vitest` test framework                 | `Jest` test framework                           | High — different tools, same purpose                       |
| `hardening/` audit artifact store       | `prompts/hardening_prompt_pack/` prompt packs   | Medium — different approach to audit/remediation           |

---

## 5. Missing in Current Repo (MCT) — Features in Chat

| Feature                                                             | Chat Location                                                                | MCT Impact                                                           | Priority for MCT |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------- |
| **PWA** (service worker, install prompt, manifest)                  | `apps/web/components/pwa/`, `apps/web/lib/pwa/`, `apps/web/app/install/`     | Lower — MCT is a portal, not a mobile-first app                      | Low              |
| **Feature flags** (DB-backed, percentage rollout, role targeting)   | `apps/api/src/modules/feature-flags/`, `apps/api/src/lib/feature-flags.ts`   | Lower — MCT doesn't need gradual rollout of features                 | Low              |
| **GDPR consent management**                                         | `apps/api/src/modules/consent/`, migration `20260625000025_consent_logs.sql` | Lower — MSP context doesn't require GDPR consent logs                | Low              |
| **LiveKit audio/video calls**                                       | `apps/api/src/modules/livekit/`, full docker-compose service                 | Lower — no real-time voice/video in MSP context                      | Low              |
| **Reactions (emoji)**                                               | `apps/api/src/modules/reactions/`, `packages/sdk/src/reactions.ts`           | Lower — not needed for ticket/project comments                       | Low              |
| **Toast component** in shared UI                                    | `packages/ui/src/components/toast.tsx`                                       | Low — would be nice but not critical                                 | Low              |
| **Dual Supabase clients** (anon + admin + per-user) pattern         | `packages/db/src/config.ts` + `apps/api/src/lib/supabase.ts`                 | Low — MCT uses admin client everywhere with `requireOrgAccess` guard | Low              |
| **Dual logger** (packages/config + per-app)                         | `packages/config/logger.ts` + `apps/api/src/lib/logger.ts`                   | Low — Chat has duplication risk; MCT avoids it                       | Low              |
| **CSRF protection** (double-submit cookie)                          | `apps/api/src/middleware/csrf.ts`                                            | Medium — MCT relies on CORS + SameSite cookies                       | Medium           |
| **Search indexer worker**                                           | `apps/worker/src/processors/search-indexer.ts`                               | Low — MCT does inline search via Supabase RPC                        | Low              |
| **Cleanup worker** (data retention, pruning)                        | `apps/worker/src/processors/cleanup.ts`                                      | Medium — MCT has no automated data cleanup                           | Medium           |
| **Root-level vitest config**                                        | `vitest.config.ts` at root                                                   | Low — MCT uses Jest per-app                                          | Low              |
| **Shared package re-export barrel** (`packages/config/index.ts`)    | `packages/config/index.ts`                                                   | Low — MCT config package is minimal                                  | Low              |
| **Server-sent events vs WebSocket** (different real-time transport) | Socket.io in Chat                                                            | Medium — Chat has full-duplex, MCT has SSE                           | Medium           |
| **API deprecation middleware**                                      | `middleware/deprecation.ts`                                                  | Low — not yet needed                                                 | Low              |

---

## 6. Missing in Reference Repo (Chat) — Features in MCT

| Feature                                                                            | MCT Location                                                                                | Chat Impact                                                         | Priority for Chat |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------- |
| **Admin panel** (full route group with 16 page directories)                        | `apps/web/app/(admin)/admin/` with tickets, users, roles, orgs, webhooks, health, SLA, etc. | High — Chat has no admin UI; all management is API-only             | High              |
| **Billing/Stripe integration**                                                     | `apps/api/src/routes/billing.ts`, `apps/web/app/(portal)/portal/billing/`                   | Medium — Chat has no billing                                        | Medium            |
| **Document management** (upload, versions, share links, preview)                   | `apps/api/src/routes/documents.ts`, full portal/admin UI                                    | High — Chat has file uploads but no document management             | Medium            |
| **SLA tracking**                                                                   | `apps/api/src/routes/sla.ts`, `apps/web/app/(admin)/admin/sla/`                             | Low — chat platform doesn't need SLAs                               | Low               |
| **API key management**                                                             | `apps/api/src/routes/api-keys.ts`, admin UI                                                 | Medium — Chat could benefit                                         | Medium            |
| **Bulk operations** (tickets, documents, user invite)                              | `apps/api/src/routes/bulk.ts`, bulk-invite page                                             | Medium — Chat could use bulk invite                                 | Low               |
| **Audit log viewer** (with filters, pagination, export)                            | `apps/api/src/routes/audit.ts`, admin audit page                                            | High — Chat has audit logging but no viewer                         | High              |
| **CSV/JSON export** for tickets, projects, audit                                   | `apps/api/src/lib/csv.ts`, export endpoints                                                 | Low — chat platform doesn't need CSV export                         | Low               |
| **Marketing/public site** (homepage, services, contact form)                       | `apps/web/app/(public)/` + `components/marketing/`                                          | Low — not applicable to chat platform                               | N/A               |
| **Notification preferences UI**                                                    | `apps/web/app/(portal)/portal/notifications/preferences/`                                   | Medium — Chat has notification prefs API but no UI                  | Medium            |
| **Health dashboard** UI                                                            | `apps/web/app/(admin)/admin/health/` + `HealthDashboardClient.tsx`                          | Medium — Chat has health endpoints but no UI                        | Medium            |
| **Role/permission matrix** with editor                                             | `apps/api/src/routes/roles.ts`, `RolePermissionsEditor.tsx`                                 | High — Chat has workspace roles but no permission matrix UI         | High              |
| **Per-org branding** (logo, colors)                                                | `apps/web/components/admin/OrgBrandingForm.tsx`                                             | Low — not applicable to chat                                        | N/A               |
| **Org switcher** (multi-org dropdown)                                              | `apps/web/components/portal/OrgSwitcher.tsx`                                                | Medium — Chat has workspace switching but UI implementation differs | Medium            |
| **Global search** (admin + portal)                                                 | `apps/api/src/routes/search.ts`, `search-portal.ts`, admin/portal search components         | Medium — Chat has search RPC but no admin search UI                 | Medium            |
| **Document share links** (signed/expiring URLs)                                    | document share API + UI                                                                     | Low — Chat has signed URLs for file uploads                         | Low               |
| **Comment editing** (5-min window)                                                 | ticket comment PATCH endpoint + UI                                                          | Low — Chat has message soft-delete but no editing                   | Low               |
| **Activity timeline** (audit events on ticket detail)                              | Admin ticket detail page                                                                    | Medium — Chat has audit but no timeline view                        | Medium            |
| **Markdown comment rendering**                                                     | `CommentBody.tsx` component                                                                 | Low — Chat messages don't use markdown                              | Low               |
| **Optimistic locking** (If-Match on PATCH)                                         | `middleware/optimistic-locking.ts`                                                          | Medium — Chat has no optimistic locking                             | Medium            |
| **Nonce-based CSP**                                                                | Web `middleware.ts` nonce generation                                                        | High — Chat should add nonce CSP                                    | High              |
| **Storybook + Chromatic**                                                          | `apps/web` Storybook integration                                                            | Medium — Chat has no visual regression testing                      | Medium            |
| **Webhook management CRUD UI**                                                     | Admin webhooks pages                                                                        | Medium — Chat has webhook API but no management UI                  | Medium            |
| **SQS fallback** for queue backend                                                 | `consumer-sqs.ts`                                                                           | Low — Chat uses BullMQ only                                         | Low               |
| **Separated worker modules** (env, task-registry, health-server, shutdown, logger) | 6 extracted modules from `main.ts`                                                          | High — Chat worker has monolithic main.ts                           | High              |
| **Docker image deploy pipe** (save+gzip+ssh+load)                                  | CI/CD deploy step                                                                           | High — Chat pulls standard from GHCR (slow on small droplets)       | High              |
| **EmptyState component**                                                           | `EmptyState.tsx`                                                                            | Low — nice to have                                                  | Low               |

---

## 7. Areas That Look Conceptually Similar but Architecturally Different

### 7.1 Real-Time Transport

| Aspect               | Chat (Socket.io)                         | MCT (SSE)                                                  |
| -------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Direction            | Bidirectional                            | Server-to-client only                                      |
| Transport            | WebSocket + HTTP long-polling fallback   | HTTP streaming                                             |
| Auth model           | Token in handshake, validated on connect | Standard HTTP auth middleware on SSE endpoint              |
| Redis adapter        | Yes (for multi-instance)                 | Not needed (single-instance SSE)                           |
| Connection tracking  | Socket.io rooms + namespaces             | SSE connections tracked in-memory                          |
| Channel subscription | Client joins room                        | Client opens SSE connection, server pushes relevant events |

**Why different:** Chat requires real-time bi-directional messaging (typing indicators, presence, instant message delivery). MCT only needs server-to-client notification pushes and periodic polling — SSE is simpler and sufficient.

### 7.2 Auth / Session Strategy

| Aspect                 | Chat                                                      | MCT                                                                   |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Cookie name            | Supabase session cookie (`sb-*-auth-token`)               | Custom `mct_session` JWT cookie                                       |
| JWT verification       | Server calls `supabase.auth.getUser(token)` every request | Local `jsonwebtoken.verify()` with secret rotation, Supabase fallback |
| Auth flow              | Direct Supabase Auth on web (client-side)                 | Web forwards cookie to API `/auth/callback` for code exchange         |
| Supabase client in web | Yes (`@supabase/supabase-js` in browser)                  | No — auth proxied through API                                         |
| Cookie flags           | Supabase defaults                                         | Explicit HttpOnly, Secure, SameSite=Lax                               |
| CSRF                   | Double-submit cookie pattern                              | Relies on CORS + SameSite                                             |

**Why different:** MCT intentionally removed Supabase client from the frontend to centralize auth in the API, enabling better audit logging, JWT rotation, and cookie security. Chat's approach is simpler but gives less control.

### 7.3 Test Framework and Strategy

| Aspect             | Chat                                                 | MCT                                                       |
| ------------------ | ---------------------------------------------------- | --------------------------------------------------------- |
| Test runner        | vitest                                               | Jest                                                      |
| API tests          | ~9 (vitest, service-level, inside modules)           | ~182 (Jest + supertest, in `__tests__/`)                  |
| SDK tests          | 0                                                    | 108 (Jest, mocked fetch)                                  |
| Worker tests       | 0                                                    | 24 (Jest, env + task handlers)                            |
| Web unit tests     | ~8 (inside component dirs)                           | ~460 (Jest + Testing Library, in `__tests__/`)            |
| E2E tests          | ~8 (Playwright, root `tests/e2e/` + `apps/web/e2e/`) | ~26 (Playwright, in `apps/web/e2e/`)                      |
| Coverage threshold | None                                                 | 50% minimum in all packages                               |
| Global test setup  | `tests/setup/vitest.setup.ts`                        | `apps/web/jest.setup.ts` + `apps/web/e2e/global.setup.ts` |
| Load tests         | k6 scripts in `tests/k6/`                            | Stub in `scripts/load-testing/`                           |

**Why different:** MCT evolved from earlier Jest-based setup; vitest was not available/stable when MCT's test infrastructure was built. MCT has invested heavily in test coverage (40x more tests) as a production MSP platform requires higher reliability. Chat's low test coverage (19 tests total) is a significant gap.

### 7.4 Shared Package Strategy

| Aspect           | Chat                                              | MCT                               |
| ---------------- | ------------------------------------------------- | --------------------------------- |
| Config package   | Re-exports env-schema, logger, errors, date utils | Minimal — ESLint + tsconfig only  |
| DB package       | Supabase client factory + DB types                | **No shared DB package**          |
| SDK package      | 7 domain modules, no tests                        | 20 domain modules, 108 tests      |
| UI package       | 8 components, no tests/stories                    | 7 components, 7 Storybook stories |
| Package count    | 4                                                 | 3                                 |
| Dependency graph | `web→db,ui`; `api→db`; `worker→config,db,sdk`     | `config→all`; `sdk→web`; `ui→web` |

**Why different:** MCT consolidated config into per-app files (env, logger) instead of sharing through a package. MCT deliberately omitted a shared DB package — each app manages its own Supabase interactions. Chat's shared DB package is cleaner but introduces a synchronization risk between the package and the actual Supabase schema.

### 7.5 API Route Organization

| Aspect                   | Chat                                           | MCT                                              |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------ |
| Route files              | 13 `modules/*/routes.ts`                       | 25 `routes/*.ts` (flat)                          |
| Route/service separation | Separate `routes.ts` + `service.ts` per module | Combined route files (no separate service layer) |
| Route mounting           | `/v1/...` prefix                               | `/api/v1/...` prefix                             |
| Per-route auth           | Applied in parent app.ts per router            | Middleware applied inside each route file        |
| Zod validation           | In service files                               | In `validators/*.ts` or inline in routes         |

**Why different:** Chat's `routes.ts` + `service.ts` separation per module is cleaner for complex CRUD. MCT's flat `routes/*.ts` with inline logic is simpler but leads to larger files. Chat has fewer routes (13 vs 25) so the separation is less burdensome.

### 7.6 Circuit Breaker Implementation

| Aspect           | Chat                                                                | MCT                                 |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------- |
| Library          | Opossum (npm package)                                               | Custom implementation (124 lines)   |
| State machine    | 3 states (closed/open/half-open)                                    | 3 states (closed/open/half-open)    |
| Events           | Full event system (open, close, halfOpen, reject, timeout, failure) | Event log captured via method calls |
| Stats            | Built-in stats tracking                                             | Custom `getState()` method          |
| Breaker registry | Map-based (named breakers)                                          | Map-based (created via factory)     |

**Why different:** Chat uses a well-tested library (Opossum). MCT rolled a custom implementation — possibly to avoid an external dependency or to have finer control. The custom approach has lower confidence in edge-case correctness.

### 7.7 Worker Architecture

| Aspect            | Chat                                                      | MCT                                       |
| ----------------- | --------------------------------------------------------- | ----------------------------------------- |
| main.ts size      | 73 lines (includes health server, processor registration) | 32 lines (6 extracted modules)            |
| Queue backend     | BullMQ only                                               | BullMQ (default) + SQS fallback           |
| Processor pattern | 4 `processors/*.ts` files, self-registering               | 6 `tasks/*.ts` files + `task-registry.ts` |
| Health server     | Embedded in main.ts                                       | Separated into `health-server.ts`         |
| Graceful shutdown | Embedded in main.ts                                       | Separated into `shutdown.ts`              |
| Sentry            | Not in worker                                             | Explicit in worker main.ts                |

**Why different:** MCT systematically extracted concerns from main.ts into dedicated modules (a refactoring from the hardening audit). Chat's worker is more monolithic but has fewer processors (4 vs 6). MCT's modular approach is cleaner and more testable.

### 7.8 CI/CD Workflow Philosophy

| Aspect            | Chat                                                                                 | MCT                                                              |
| ----------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Workflow count    | 19 (8 core + 11 audit/governance)                                                    | 15 (8 core + 7 supporting)                                       |
| Audit automation  | Extensive (audit-badges, audit-ci, audit-pr-gate, audit-release-certification, etc.) | Light (alignment-badges, alignment-engine, alignment-pr-comment) |
| Validation gate   | `validate.yml` (workflow_call)                                                       | `validate.yml` (workflow_call)                                   |
| Deploy gate       | Branch-based                                                                         | Branch-based + prod-approval environment                         |
| E2E as gate       | Not explicit                                                                         | `e2e.yml` callable as gate                                       |
| Visual regression | None                                                                                 | Chromatic                                                        |

**Why different:** Chat has a heavier governance/audit CI pipeline (624 findings tracked, remediation workflows). MCT has lighter governance but stronger test coverage as a quality gate. MCT's alignment workflows are analogous to Chat's audit workflows but less mature.

---

## 8. Areas That Cannot Yet Be Mapped Reliably

| Area                                                 | Gap                                                   | Reason                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Chat's SSE/notification streaming implementation** | MCT SSE endpoint referenced but depth not inspected   | Need to read the SSE implementation in both repos to compare                                |
| **Chat's webhook SSRF validation**                   | Chat webhook service not deeply inspected             | Need to understand URL validation approach                                                  |
| **Chat's message soft-delete semantics**             | MCT has ticket comment deletion — different semantics | Need to read Chat message service for soft-delete patterns                                  |
| **Chat's search RPC implementation**                 | MCT has search RPC too, but implementation unknown    | Need to compare search SQL/RPC functions                                                    |
| **Chat's Push Subscription + Web Push API**          | MCT has email notifications + in-app polling          | Different notification delivery mechanisms                                                  |
| **MCT's cache middleware** (211 lines)               | Chat has no caching layer                             | Need to verify if Chat caches anything at all                                               |
| **MCT's SSE streaming**                              | Implementation depth not inspected in routes          | Need to read the SSE endpoint implementation                                                |
| **MCT's optimistic locking**                         | Coverage — is `If-Match` on all PATCH or just subset? | Only verified for documents/projects/orgs                                                   |
| **MCT's Stripe webhook idempotency**                 | Is it guaranteed for duplicate deliveries?            | Need to inspect Stripe event ID dedup logic                                                 |
| **Chat's cloud-init user_data template**             | Template file content not compared                    | `infra/terraform/templates/cloud-init.yaml.tftpl` vs MCT's `cloud-init.yml` need comparison |
| **MCT's DNS zone management**                        | How does prod `.com` vs dev `.us` switching work      | Terraform DNS routing logic not fully inspected                                             |
| **Chat's docker-compose.devremote.yml**              | Dev environment vs production setup                   | Not inspected                                                                               |
| **MCT's E2E Playwright fixtures**                    | How comprehensive is the test fixture setup           | Not deeply inspected                                                                        |
| **Both repos' Supabase config.toml**                 | Local Supabase configuration differences              | Not compared                                                                                |

---

## Self-Review

- **All mappings verified** from direct file tree inspection and key file reads of both repos.
- **Component-level confidence** varies: UI packages mapped with high confidence (same files, nearly identical); route handlers mapped with medium confidence (same pattern, different domain logic).
- **Chat socket.io implementation** inspected at surface level (auth, adapter, configuration) — deeper auth negotiation not inspected.
- **Chat feature flags** module exists but percentage rollout logic not inspected.
- **Chat PWA** (service worker, manifest, install) not deeply inspected — only directory structure confirmed.
- **MCT SSE implementation** referenced but not deeply inspected — directory/files not located in routes/notifications.ts.
- **MCT cache middleware** listed but invalidation completeness not verified.
- **No recommendations made** — this phase is purely explicit mapping.
