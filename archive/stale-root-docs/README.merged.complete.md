# Maine CyberTech Portal — Consolidated README

> **⚠️ Historical document.** This was written during the initial build-out. Key metrics have changed significantly since then. See `AGENTS.md` for current test counts, `docs/README.dev.md` for current setup, and `AGENTS.md` for the complete architecture summary. Major differences:
> - **Tests**: 618 → **695** (API 155, SDK 89, Worker 24, Web 427)
> - **Workflows**: 19 → **17** (build.yml removed, replaced by validate.yml + env-specific files)
> - **Worker tasks**: Not yet implemented → **5 task handlers** active (stripe-reconcile, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications)
> - **Terraform**: Minimal → **12 .tf files** including secrets.tf and vercel.tf
> - **Security**: Basic → **XSS sanitization, CSP headers, per-user rate limiting, request ID middleware**
> - **Docs**: Planned → **6 operational docs** (rollback, monitoring, secrets rotation, rate limiting, env vars, dev guide)
> - **packages/types/**: Planned → **Removed** (empty package)
> - **packages/sdk/**: Empty → **Fully built** with retry logic and 11 resource classes
> - **getSupabaseAnon()**: Existed → **Removed** (dead code)

---

## Table of Contents

1. [Project Goal](#project-goal)
2. [Constraints & Preferences](#constraints--preferences)
3. [Current Status Summary](#current-status-summary)
4. [Repository Structure](#repository-structure)
5. [System Architecture](#system-architecture)
6. [Authentication & Request Flow](#authentication--request-flow)
7. [Testing Status & Coverage](#testing-status--coverage)
8. [Docker, Local Stack, and Runtime Packaging](#docker-local-stack-and-runtime-packaging)
9. [CI/CD and Deployment](#cicd-and-deployment)
10. [Infrastructure as Code](#infrastructure-as-code)
11. [Operational / Security Context](#operational--security-context)
12. [Documentation Audit & Cleanup Findings](#documentation-audit--cleanup-findings)
13. [Technical Debt, Risks, and Recommendations](#technical-debt-risks-and-recommendations)
14. [Next Steps](#next-steps)
15. [Relevant Files](#relevant-files)

---

## Project Goal

Add comprehensive tests and finalize CI, Docker, configuration, and supporting architecture for the **Maine CyberTech (MCT) client portal monorepo**.

This repository is a **Turborepo monorepo** built around:
- **API**: Express + Supabase Admin
- **Web**: Next.js App Router with server components and server actions
- **Worker**: asynchronous/background processing service
- **SDK**: typed internal API client classes
- **Infrastructure**: Terraform + GitHub Actions + Vercel + AWS + Cloudflare + Supabase

---

## Constraints & Preferences

### Architecture / Platform Constraints
- API uses **Express + Supabase Admin** for DB/internal auth.
- SDK uses **typed client classes**.
- Web app uses **Next.js App Router**, **server components**, and **server actions**.
- Auth token is stored in the **`mct_session` HTTP-only cookie**.
- Minimize remaining direct Supabase surface area.
- No new dependencies.

### Testing Preferences
- API tests use **Jest + supertest**.
- SDK tests use **mocked `fetch`**.
- Web tests use **`@testing-library/react`** with **`fireEvent` / `userEvent`**.
- Async server components are tested by:
  1. calling the async component function directly,
  2. awaiting the returned JSX,
  3. then passing it to `render()`.
- For custom text matchers using `c.includes(...)`, parent/child DOM nesting can cause ambiguous matches, so prefer:
  - `getAllByText(...).length`
  - instead of `getByText(...)`
  - especially when text appears in nested DOM nodes.

---

## Current Status Summary

### High-Level Completion
- **Phases 1–12** complete:
  - SDK
  - API
  - pages
  - library utilities
  - server actions
  - auth
  - storage
  - callback flow
  - cleanup
  - initial tests
- **Phase 13** completed across Docker, CI, deployment, worker, gitignore, migrations, Dockerfile optimization, and environment handling.
- **Phase 14** completed across route tests, SDK tests, worker tests, component tests, page rendering tests, and Playwright E2E setup.

### Overall Test Status
All monorepo tests pass via:

```bash
pnpm run test
```

**Total passing tests: `618`**
- API: **111**
- SDK: **78**
- Worker: **7**
- Web: **422**

All component files now have test coverage.

---

## Repository Structure

```text
mainecybertech-portal/ (Turborepo monorepo)
├── Root Configuration
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── .gitignore
│   ├── .editorconfig
│   ├── .dockerignore
│   ├── docker-compose.yml
│   └── .turbo/
│
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.ts
│   │   │   ├── config/
│   │   │   ├── lib/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   ├── validators/
│   │   │   └── __tests__/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── jest.config.js
│   │   └── tsconfig.json
│   │
│   ├── web/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── auth/callback/
│   │   │   ├── (public)/
│   │   │   ├── (admin)/
│   │   │   └── (portal)/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── __tests__/
│   │   ├── e2e/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── next.config.mjs
│   │   ├── jest.config.js
│   │   ├── jest.setup.ts
│   │   ├── playwright.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── middleware.ts
│   │   ├── .env.example
│   │
│   └── worker/
│       ├── src/
│       │   ├── main.ts
│       │   └── __tests__/
│       ├── package.json
│       ├── Dockerfile
│       ├── .env.example
│       ├── jest.config.js
│       └── tsconfig.json
│
├── packages/
│   ├── sdk/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── organizations.ts
│   │   │   ├── memberships.ts
│   │   │   ├── profiles.ts
│   │   │   ├── projects.ts
│   │   │   ├── tickets.ts
│   │   │   ├── documents.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── audit.ts
│   │   │   ├── roles.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   ├── types/
│   │   ├── src/index.ts
│   │   └── package.json
│   │
│   ├── ui/
│   │   └── package.json
│   │
│   └── config/
│       └── package.json
│
├── infra/
│   └── terraform/
│       ├── backend.tf
│       ├── providers.tf
│       ├── variables.tf
│       ├── compute.tf
│       ├── network.tf
│       ├── runtime.tf
│       ├── dns.cloudflare.tf
│       ├── vercel.tf
│       ├── github-oidc.tf
│       ├── supabase.tf
│       ├── outputs.tf
│       ├── env/
│       │   ├── backend.dev.hcl
│       │   ├── backend.prod.hcl
│       │   ├── dev.tfvars
│       │   └── prod.tfvars
│       ├── examples/
│       └── old/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── .github/workflows/
│   ├── test.yml
│   ├── lint.yml
│   ├── typecheck.yml
│   ├── build.yml
│   ├── e2e.yml
│   ├── supabase-migrations.yml
│   ├── web-prod-vercel.yml
│   ├── web-dev-vercel.yml
│   ├── web-preview.yml
│   ├── api-deploy-ecs.yml
│   ├── api-deploy-ecs.dev.yml
│   ├── api-deploy-ecs.prod.yml
│   ├── worker-deploy-ecs.yml
│   ├── worker-deploy-ecs.dev.yml
│   ├── worker-deploy-ecs.prod.yml
│   ├── terraform-plan.dev.yml
│   ├── terraform-plan.prod.yml
│   ├── terraform-apply.dev.yml
│   └── terraform-apply.prod.yml
│
├── sql/
├── scripts/
├── docs/
├── README.md
├── README.dev.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

---

## System Architecture

### Core Services

| Service | Entry Point | Purpose |
|---------|-------------|---------|
| API | `apps/api/src/main.ts` | Express server listening on `API_PORT` |
| Web | `apps/web/app/layout.tsx` | Next.js App Router frontend root |
| Worker | `apps/worker/src/main.ts` | Environment parsing and async worker entry point |
| SDK | `packages/sdk/src/index.ts` | Typed API client factory |

### Primary Architectural Roles
- **Web** handles UI, server actions, route rendering, and admin/portal experiences.
- **API** centralizes authentication verification, data access, admin checks, storage/document operations, and business logic.
- **SDK** provides typed resource classes that mirror API domains.
- **Worker** is intended to handle async jobs and integrations.
- **Supabase** is used for auth, data, and storage-related backend capabilities.
- **Terraform + CI/CD** provision and deliver the stack across dev/testing and production.

### Patterns Present
- Factory Pattern: `MCTClient.create()`, `createApp()`
- Middleware Chain: Express middleware ordering for CORS, Helmet, rate limiting, errors
- Resource/API Classes: SDK entity wrappers
- Server Actions: Next.js server-side mutations
- Repository-like abstraction: SDK over API
- Singleton usage: Supabase admin client/env loaders
- Error wrapper objects: `ApiError`, `AppError`
- Constructor/dependency injection patterns where useful

### Cohesion / Coupling Assessment

**Strong cohesion**
- SDK resources are organized cleanly by domain.
- API routes are separated by resource domain.
- Web layouts and component areas are reasonably separated.

**Tight coupling risks**
- Web and SDK are tightly aligned to API endpoint shapes.
- API is tightly coupled to Supabase.
- Worker directly uses Supabase instead of a more abstracted job/data layer.
- Web auth callback flow remains aware of Supabase PKCE internals.

---

## Authentication & Request Flow

### Session / Auth Model
- Token is stored in **`mct_session`** as an **HTTP-only cookie**.
- Cookie is set in:
  - `loginAction`
  - `auth/callback/route.ts` on the web side
- API verifies session tokens using:
  - `supabase.auth.getUser(token)`
- API admin authorization uses:
  - `memberships` + `roles`
- Web admin access check uses:
  - `users.me()` + `memberships.list()` through the SDK

### Callback / Auth Flow
- Added **`POST /api/v1/auth/callback`** to API.
- Web callback was simplified to proxy through API.
- Removed direct web public Supabase variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- These were removed from `apps/web/.env.example` and skipped by the sync scripts for `nextjs` usage.

### End-to-End Flow

```text
User Browser
  ↓
Login form submission
  ↓
loginAction() (server action)
  ↓
Supabase Auth REST / PKCE exchange
  ↓
Browser redirects to /auth/callback?code=...
  ↓
Web callback forwards to API POST /api/v1/auth/callback
  ↓
API exchanges code for session and sets mct_session cookie
  ↓
User is redirected into protected app routes
  ↓
Web uses SDK with Bearer token / cookie-backed auth context
  ↓
API requireAuth verifies token with Supabase
  ↓
API requireAdmin resolves memberships + roles
  ↓
Supabase/PostgreSQL data access occurs
```

---

## Testing Status & Coverage

## Summary
- **API route tests**: `111` tests across `13` files — all passing
- **SDK tests**: `78` tests across all `11` resource classes — all passing
- **Worker tests**: `7` tests for env schema validation — all passing
- **Web tests**: `422` tests — all passing
- **Total**: `618` tests — all passing

### API Testing
API tests use **Jest + supertest**.

Coverage includes route-level integration for major API domains and auth/callback handling.

### SDK Testing
SDK tests use **mocked `fetch`** across all typed resource classes.

Coverage spans:
- `auth`
- `users`
- `organizations`
- `memberships`
- `profiles`
- `projects`
- `tickets`
- `documents`
- `dashboard`
- `audit`
- `roles`

### Worker Testing
Worker coverage currently includes **environment schema validation** and env parsing behavior.

Important implementation note:
- `main.ts` runs `runWorkerTasks().catch(...)` at module scope.
- Tests mock `pino` and `dotenv/config` to isolate env parsing.

### Web Unit / Component / Page Testing
Web Jest configuration includes:
- `moduleNameMapper` for `@/` alias
- `transform` via `ts-jest` with `jsx: 'react-jsx'`
- `jest-environment-jsdom`
- `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`
- installed and configured `@testing-library/user-event`

### Test Fixes / Stabilization Changes
- Added `--passWithNoTests` to worker/web test scripts so `turbo run test` passes for all packages.
- Fixed `admin.test.ts` redirect mock to throw `"NEXT_REDIRECT"` like real `next/navigation`.
- Fixed `login/page.test.tsx` by changing `getByText("Secure Login")` to `getByRole("heading", ...)`.
- Added `File.prototype.arrayBuffer` polyfill to `documents/actions.test.ts` for jsdom.
- Fixed component tests for:
  - `AdminBreadcrumbs` (`<span>` last item handling)
  - `AdminSubnav`
  - `PortalSubnav`
  - avoiding false positives from hover-style text such as `emerald`
- Removed stale `.next` build directory.

### Component Tests Completed
Covered components include:
- `ConfirmDangerButton`
- `AdminPageShell`
- `PortalBreadcrumbs`
- `AdminHeaderActions`
- `PortalHeaderActions`
- `TaskOrderEditor`
- `SupportCenterClient`
- `AdminTicketCenterClient`
- `AdminDocumentsBulkControls`
- `AvatarPill`
- `AdminBreadcrumbs`
- `AdminSubnav`
- `PortalSubnav`
- `PortalAdminQuickSwitch`
- `ConfirmIntentButton`

### Complex Client Components Fully Tested

#### `ProjectTaskListV5` (317 lines)
**22 tests**, including:
- initial render
- task cards
- status pill
- owner avatar
- due date
- empty state
- multiple cards
- search filter
- status filter
- owner filter
- card expand behavior
- created-by info
- form submission
- approval badge
- comment count
- unread badge
- empty details
- save order indicator
- sort order display

#### `AdminDocumentsCenterClient` (1,293 lines)
**41 tests**, including:
- initial render in list/table/grid views
- stats cards
- search/filter/sort
- empty state
- filter chips
- visibility/type pills
- inline rename
- inline visibility updates
- quick edit panel
- drawer with 4 tabs
- create modal
- selection behavior
- bulk controls visibility
- toast container
- load more behavior
- localStorage persistence
- keyboard shortcuts (`Cmd+N`, `Escape`)

### Admin Page Rendering Tests
Coverage includes:
- `admin/page.test.tsx`
  - dashboard with stat cards, recent activity, pending approvals, quick actions, empty states
- `admin/audit/page.test.tsx`
  - filter form, search param pre-fill, audit log entries, actor/org resolution, metadata display, empty state
- `admin/tickets/page.test.tsx`
  - breadcrumbs, subnav, `AdminTicketCenterClient` props pass-through, server action existence
- `admin/documents/page.test.tsx`
  - breadcrumbs, subnav, `AdminDocumentsCenterClient` props, org name, preview kind inference, signed URL resolution, display name fallbacks, bulk action functions
- `admin/users/page.test.tsx`
  - 8 tests for title, breadcrumbs, membership count, empty state, cards, badges, links, unknown profile
- `admin/organizations/page.test.tsx`
  - 7 tests for title, breadcrumbs, empty state, org cards, null domain, links, null response
- `admin/projects/page.test.tsx`
  - 9 tests for title, breadcrumbs, project count, create form, empty state, cards, description fallback, unknown org, status classes
- `admin/approvals/page.test.tsx`
  - 7 tests for title, zero counts, empty states, pending orgs, memberships, unknown profile/org
- `admin/users/[userId]/page.test.tsx`
  - not-found error, breadcrumbs, page shell, form fields, memberships, badges, billing/security flags
- `admin/organizations/[orgId]/page.test.tsx`
  - not-found error, breadcrumbs, org basics form, domains, memberships, badges
- `admin/projects/[projectId]/page.test.tsx`
  - not-found error, breadcrumbs, pills, action links, `ProjectTaskListV5` props, comments, empty tasks
- `admin/tickets/[ticketId]/page.test.tsx`
  - not-found error, breadcrumbs, view/edit/delete-confirm modes, comments, add-comment form, deleted restore, title prefix stripping
- `admin/users/[userId]/activity/page.test.tsx`
  - title, back link, audit log entries, empty state, fallback title, missing org
- `admin/organizations/[orgId]/activity/page.test.tsx`
  - title, back link, audit log entries, empty state, fallback title, hidden actor email/type

---

## Playwright E2E Coverage

Playwright has been installed and configured for the web app.

### Configured Files
- `apps/web/playwright.config.ts`
  - chromium project
  - auth setup
  - HTML reporter
  - trace / screenshot / video support
- `apps/web/e2e/fixtures.ts`
  - `LoginPage` and `AdminPage` page object helpers
- `apps/web/e2e/global.setup.ts`
  - authenticates admin via login page and saves `.playwright-auth.json`

### E2E Specs
- `apps/web/e2e/auth/login.spec.ts`
  - login/signup/pending page flows
- `apps/web/e2e/admin/dashboard.spec.ts`
  - dashboard heading, stat cards, activity, navigation links
- `apps/web/e2e/admin/users.spec.ts`
  - list/detail/not-found
- `apps/web/e2e/admin/organizations.spec.ts`
  - list/detail/not-found
- `apps/web/e2e/admin/projects.spec.ts`
  - list/create/detail/not-found
- `apps/web/e2e/admin/tickets.spec.ts`
  - tickets center/not-found
- `apps/web/e2e/admin/documents.spec.ts`
  - document center, search/filter, view modes, create modal, audit log, approvals
- `apps/web/e2e/portal/dashboard.spec.ts`
  - portal dashboard, documents, support center

### E2E Commands
Root:

```bash
pnpm e2e
```

Web package:

```bash
pnpm --filter web e2e
pnpm --filter web e2e:ui
pnpm --filter web e2e:debug
```

### E2E CI
- `.github/workflows/e2e.yml`
  - builds web
  - installs Playwright
  - runs tests
  - uploads report on failure

---

## Docker, Local Stack, and Runtime Packaging

### Docker Progress Completed
- Added `.dockerignore`
- Added / updated `docker-compose.yml`
- Added `.vscode/extensions.json`, `launch.json`, `settings.json`
- Optimized Dockerfiles
- Verified successful builds for all three service images

### Docker Verification Results
All three images built successfully:
- **web**: `331 MB`
- **api**: `287 MB`
- **worker**: `278 MB`

### Dockerfile Fixes Applied
- Fixed all Dockerfiles:

```bash
corepack enable && corepack prepare pnpm@10 --activate
```

replacing the broken form:

```bash
corepack enable pnpm@10
```

- Removed `COPY packages ./packages` from API / worker Dockerfiles where redundant.
- Fixed `apps/web/Dockerfile` by:
  - adding `packages/` copy for workspace deps
  - removing `public/` copy because that directory does not exist
- Added `output: "standalone"` to `next.config.mjs`
- Added `outputFileTracingRoot` in web Next config for monorepo support
- Added `export const dynamic = "force-dynamic"` to admin + portal layouts to avoid prerender build failures
- Removed `--dts` from `api/worker` `tsup` build because it triggered `TS2742` in the `.pnpm` constrained environment
- Updated `.dockerignore` with explicit `**/node_modules/` and `.pnpm/` patterns for Windows / pnpm compatibility

### Web Dockerfile
- `apps/web/Dockerfile`
  - multi-stage
  - standalone output
  - runs as non-root `nextjs` user

### Compose Services
`docker-compose.yml` includes:
- `api` (port `4000`)
- `web` (port `3000`)
- `worker`
- `e2e` (Playwright container)

Health checks are configured for web and API.

---

## CI/CD and Deployment

### Phase 13 CI Work Completed
- Added `typecheck.yml`
- Fixed:
  - `test.yml`
  - `lint.yml`
  - `web-prod-vercel.yml`
  - `web-dev-vercel.yml`
  - `web-preview.yml`
- Standardized workflows on **`pnpm@10`** and corrected action ordering

### Phase 13 Deploy Work Completed
- Fixed `build.yml`
  - corrected `amazon-ecr-login@v2` registry output handling
- Removed redundant:
  - `ci.yml`
  - `web-deploy.yml`
  - stub `api-deploy.yml`

### Supabase Migration Workflow
- `supabase-migrations.yml` now runs:
  - `supabase link`
  - `supabase db push`

### Current Workflow Inventory

#### Validation / Build / Deploy
- `test.yml`
- `lint.yml`
- `typecheck.yml`
- `build.yml`
- `e2e.yml`
- `supabase-migrations.yml`
- `web-prod-vercel.yml`
- `web-dev-vercel.yml`
- `web-preview.yml`
- `api-deploy-ecs.yml`
- `api-deploy-ecs.dev.yml`
- `api-deploy-ecs.prod.yml`
- `worker-deploy-ecs.yml`
- `worker-deploy-ecs.dev.yml`
- `worker-deploy-ecs.prod.yml`
- `terraform-plan.dev.yml`
- `terraform-plan.prod.yml`
- `terraform-apply.dev.yml`
- `terraform-apply.prod.yml`

### Trigger Model
- **Push to `main`**
  - tests
  - lint
  - typecheck
  - Docker build/push
  - ECS deployment
  - Vercel production web deployment
  - Terraform prod apply
- **Push to `develop`**
  - tests
  - lint
  - typecheck
  - Vercel staging/development deployment
  - Terraform dev apply
- **PRs**
  - tests
  - lint
  - typecheck
  - E2E
  - Vercel preview
  - Terraform planning

### Pipeline Strengths
- clear environment separation
- validation before build
- OIDC-based AWS auth
- preview deploys for PRs
- Terraform plan/apply split per environment

### Pipeline Risks / Gaps
- deployment workflow redundancy around API / worker ECS deploy workflows
- no explicit production approval gate documented
- no documented rollback automation
- Supabase migrations are not clearly described as hard deployment blockers
- E2E appears primarily as validation and may not fully block deployment in all flows

---

## Infrastructure as Code

### Terraform Structure
The Terraform root includes:
- `backend.tf`
- `providers.tf`
- `variables.tf`
- `compute.tf`
- `network.tf`
- `runtime.tf`
- `dns.cloudflare.tf`
- `vercel.tf`
- `github-oidc.tf`
- `supabase.tf`
- `outputs.tf`

Environment-specific state separation is configured via:
- `infra/terraform/env/backend.dev.hcl`
- `infra/terraform/env/backend.prod.hcl`

Environment-specific variables are expected in:
- `infra/terraform/env/dev.tfvars`
- `infra/terraform/env/prod.tfvars`

### IaC Cleanup Already Performed
- Removed redundant generic `terraform-plan.yml` and `terraform-apply.yml`
- Kept environment-specific Terraform workflows
- Created backend files for explicit state separation between dev and prod

### IaC Strengths
- environment-separated state
- AWS + Vercel + Cloudflare coverage
- GitHub OIDC integration
- repo appears prepared for ECS-based API and worker deployment plus Vercel-hosted web

### IaC Gaps / Risks
- Supabase remains partly manual operationally
- monitoring / alerting configuration is not described here
- auto-scaling policies are not clearly documented
- backup / DR procedures are not described

---

## Operational / Security Context

### Critical Runtime Context
- `mct_session` is the core session cookie.
- API `requireAuth` validates the token via Supabase.
- API `requireAdmin` resolves permissions via `memberships` and `roles`.
- Web `requireAdminAccess()` uses SDK methods to verify elevated access.
- Worker currently focuses on env parsing coverage and intended task bootstrap.
- `next/headers`, `next/navigation`, `next/cache`, `next/link`, `@mct/sdk`, `@/lib/api`, `@/lib/auth/membership`, and `@/lib/auth/admin` are mocked in web tests.

### Security / Resilience Strengths
- HTTP-only cookie session storage
- Helmet in API
- rate limiting on API
- health check endpoints
- non-root container runtime for web
- strong test coverage across the monorepo

### Known Security / Operations Gaps
- no documented secrets rotation policy
- no clearly documented rollback playbook in this merged README
- no distributed tracing / telemetry called out
- resilience improvements such as retries/circuit breakers are still recommendations, not completed work

---

## Documentation Audit & Cleanup Findings

### Documentation Situation
The repo contains a large documentation footprint (50+ markdown files). Some are current and useful, while others appear historical, overlapping, or archive-worthy.

### Primary Documentation Assessment

**Current / useful**
- `README.md`
- `README.dev.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

**Potentially stale or overlapping**
- `README.local-development.md` has been removed (overlapped with `docs/README.dev.md`)
- `docs/README.final.md`
- `docs/00_DOCUMENTATION_MAP_FINAL.md`
- multiple `ANALYSIS_*`, `ACTION_PLAN`, `CLEANUP_*`, handoff, deployment, and environment docs

### Accuracy / Drift Notes
- SDK zero-runtime-dependency claim is consistent with the documented architecture.
- Total test count of **618** is internally consistent.
- Worker is tested for env schema, but deeper task implementations remain a next-step area.
- `.env.local` tracking was flagged as a cleanup/security concern.
- `apps/web/apps-web.zip` has been removed (was a stale build artifact).
- `package-lock.json` in a pnpm workspace was identified as stale / inappropriate if present.
- `lib/auth/membership.ts` and `lib/supabase/middleware.ts` have been removed (were unused placeholder stubs).

### Recommended Documentation Cleanup
- create a single canonical docs index
- archive historical handoff/cleanup docs
- document API contracts clearly
- document environment variables clearly
- document database / RLS / storage rules clearly
- document rollback and migrations clearly

---

## Technical Debt, Risks, and Recommendations

### Completed Cleanup / Hardening Items
- `.gitignore` updated to allow:
  - `.vscode/extensions.json`
  - `.vscode/launch.json`
  - `.vscode/settings.json`
- `.next` stale build output removed
- auto env sync scripts updated to skip deprecated `NEXT_PUBLIC_SUPABASE_*` variables for Next.js

### Known Gaps / Incomplete Areas
1. **Worker task implementations**
   - env validation exists
   - actual async jobs / integrations remain the major unfinished functional area

2. **Shared package consolidation**
   - `@mct/config`
   - `@mct/ui`
   - `@mct/types`
   - consolidation remains a next-step objective

3. **Docs fragmentation**
   - too many overlapping markdown files
   - canonical ownership is unclear

4. **Operational maturity gaps**
   - approval gates
   - rollback automation
   - telemetry / monitoring documentation
   - migration blocking guarantees

### Cleanup Candidates (Completed)
- ~~`apps/web/apps-web.zip`~~ — removed (stale build artifact)
- ~~historical docs under `docs/`~~ — 31 stale docs archived and removed
- ~~`infra/terraform/old/`~~ — archived to `old-archived.zip`, directory removed
- ~~tracked `.env.local` files~~ — confirmed in `.gitignore` (`.env.*` pattern excludes them)
- ~~stray `package-lock.json` files in pnpm workspace~~ — removed, `package-lock.json` added to `.gitignore`
- ~~placeholder / unused modules `lib/auth/membership.ts`, `lib/supabase/*`~~ — `lib/` directory removed entirely

### Architecture / Resilience Recommendations
- add SDK retry logic for transient failures
- add clearer logging context and request correlation
- document monitoring / alerting strategy
- confirm dev/prod Supabase environment separation
- review any N+1 or repeated query patterns in admin pages
- move heavy async work into the worker as it matures

---

## Next Steps

### Primary Next Steps (already identified)
1. **Worker task implementations**
   - async jobs
   - integrations
2. **Shared package consolidation**
   - `@mct/config`
   - `@mct/ui`
   - `@mct/types`

### Recommended Practical Follow-Up
1. create a canonical `docs/INDEX.md`
2. create API contract documentation (`docs/API.md`)
3. create environment variable documentation (`docs/ENVIRONMENT_VARIABLES.md`)
4. document Supabase schema / RLS / storage model
5. document deployment rollback procedures
6. remove stale artifacts and untracked/unsafe committed local env files

---

## Relevant Files

### Testing and Web Runtime
- `apps/web/jest.config.js`
- `apps/web/jest.setup.ts`
- `apps/web/__tests__/components/admin/AdminDocumentsBulkControls.test.tsx`
- `apps/web/__tests__/components/admin/AdminTicketCenterClient.test.tsx`
- `apps/web/__tests__/components/admin/ProjectTaskListV5.test.tsx`
- `apps/web/__tests__/components/admin/AdminDocumentsCenterClient.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/audit/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/tickets/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/documents/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/users/[userId]/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/organizations/[orgId]/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/projects/[projectId]/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/tickets/[ticketId]/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/users/[userId]/activity/page.test.tsx`
- `apps/web/__tests__/app/(admin)/admin/organizations/[orgId]/activity/page.test.tsx`
- `apps/web/playwright.config.ts`
- `apps/web/e2e/fixtures.ts`
- `apps/web/e2e/global.setup.ts`
- `apps/web/e2e/auth/login.spec.ts`
- `apps/web/e2e/admin/dashboard.spec.ts`
- `apps/web/e2e/admin/users.spec.ts`
- `apps/web/e2e/admin/organizations.spec.ts`
- `apps/web/e2e/admin/projects.spec.ts`
- `apps/web/e2e/admin/tickets.spec.ts`
- `apps/web/e2e/admin/documents.spec.ts`
- `apps/web/e2e/portal/dashboard.spec.ts`
- `apps/web/Dockerfile`
- `apps/web/next.config.mjs`

### Root / CI / Compose
- `docker-compose.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/test.yml`
- `.github/workflows/lint.yml`
- `.github/workflows/typecheck.yml`
- `.github/workflows/build.yml`
- `.github/workflows/supabase-migrations.yml`
- `.github/workflows/web-prod-vercel.yml`
- `.github/workflows/web-dev-vercel.yml`
- `.github/workflows/web-preview.yml`
- `package.json`

### Infrastructure / Environment / Scripts
- `infra/terraform/env/backend.dev.hcl`
- `infra/terraform/env/backend.prod.hcl`
- `scripts/sync_supabase_env.auto.v2.ps1`
- `scripts/sync_supabase_env.auto.ps1`

---

## Final Consolidated Assessment

The MCT client portal monorepo is in a **strong, production-oriented state** across:
- monorepo organization
- typed SDK/API boundary
- extensive automated test coverage
- Docker packaging
- Playwright E2E coverage
- CI/CD workflow coverage
- environment-aware infrastructure design

The **main remaining functional gap** is the worker’s real async task implementation and the broader consolidation of shared packages and canonical documentation.

If those next steps are completed, the repository will move from **well-tested and deployment-capable** to **fully operationally mature and easier to hand off / scale**.
