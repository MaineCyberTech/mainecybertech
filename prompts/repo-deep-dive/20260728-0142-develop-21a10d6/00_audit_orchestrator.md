# Audit Orchestrator

## Audit Metadata

- **Audit name:** `repo-deep-dive`
- **Run:** `20260728-0142-develop-21a10d6`
- **Repository:** `C:\temp\mainecybertech-portal`
- **Branch:** `develop`
- **Commit SHA:** `21a10d6f3eed3b691d6e81a7332c3f988925304a`
- **Generated at:** 2026-07-28T01:42:00Z
- **Auditor:** AI Agent (Prompt 00 - Audit Orchestrator)
- **Area code:** ORCH
- **Output path:** `docs/audits/repo-deep-dive/20260728-0142-develop-21a10d6/00_audit_orchestrator.md`
- **Scope limitations:**
  - No source code modifications during audit
  - No secret values printed in reports
  - Evidence drawn from repository files only
  - No runtime/deployed environment testing (static analysis only)
  - 66 Supabase migration files reviewed at schema level only (no live DB inspection)

---

## Scope

This audit covers the entire `mainecybertech-portal` monorepo across 8 audit domains (Security, Data Integrity, Resilience, Observability, Supply Chain, Privacy, CI/CD, Evolution/Platform). The orchestrator run spans 41 prompts (00-40) executed in the order defined in `RUN_ORDER.md`. All findings must cite repository evidence and use the P0/P1/P2/P3 severity scheme.

### In Scope

- All 6 packages (3 apps + 3 shared)
- All 52 API route files
- All 66 Supabase migration files
- All 52 SDK module files
- All 15 CI/CD workflow files
- Infrastructure: Docker, docker-compose, Terraform (DO), Caddy
- Testing: Jest (API 583, Web 700, SDK 223, Worker 24), Playwright E2E (26 spec files)
- Documentation: 48 files in `docs/`
- All security middleware (auth, org-access, CSP, rate-limiting, CSRF, idempotency, optimistic locking)
- Secrets management pattern
- Container build and runtime configuration

### Out of Scope

- Production/deployed infrastructure state (static analysis only)
- Third-party API behavior (Stripe, Jira, JSM, M365, Supabase Cloud)
- Browser-level security beyond CSP headers
- Physical infrastructure security
- Load testing (scripts exist as placeholder only)
- Chat platform reference repo (`C:\temp\chat`)

---

## Evidence Reviewed

| Evidence                                | Type          | Why relevant                                            | Notes                                               |
| --------------------------------------- | ------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `AGENTS.md`                             | Documentation | Full architecture context, audit history, test patterns | 1,530 lines; canonical agent context                |
| `package.json` (root)                   | Config        | Workspace definition, scripts, dependency overrides     | pnpm@10.34.3, Turborepo v2.9.18                     |
| `turbo.json`                            | Config        | Task orchestration pipeline                             | build, dev, lint, test, typecheck                   |
| `pnpm-workspace.yaml`                   | Config        | Workspace boundaries                                    | `apps/*`, `packages/*`                              |
| `apps/api/src/main.ts`                  | Source        | API entry point (35 lines)                              | Graceful shutdown, unhandledRejection handler       |
| `apps/api/src/app.ts`                   | Source        | Express app factory (184 lines)                         | 50+ route mounts, middleware stack                  |
| `apps/web/middleware.ts`                | Source        | Next.js middleware (115 lines)                          | Domain routing, JWT exp check, CSP nonce            |
| `apps/web/app/layout.tsx`               | Source        | Root layout (47 lines)                                  | ThemeProvider, VersionBadge, skip-to-content        |
| `apps/worker/src/main.ts`               | Source        | Worker entry point (31 lines)                           | Sentry init, task registry, health server           |
| `apps/api/src/config/env.ts`            | Source        | Zod env schema                                          | 30+ validated env vars                              |
| `apps/api/src/routes/`                  | Directory     | 52 route files                                          | 44 module routes + 8 core service routes            |
| `apps/api/src/middleware/`              | Directory     | 13 middleware files                                     | auth, org-access, security, cache, rate-limit, etc. |
| `apps/api/src/lib/`                     | Directory     | 10 library files                                        | circuit-breaker, http-client, idempotency, etc.     |
| `apps/worker/src/tasks/`                | Directory     | 8 task files                                            | stripe-reconcile, jira-sync, jsm-sync, etc.         |
| `supabase/migrations/`                  | Directory     | 66 migration files                                      | 5302026 through 5302101                             |
| `.github/workflows/`                    | Directory     | 15 workflow files                                       | deploy-do, validate, terraform-do, e2e, etc.        |
| `infra/digitalocean/docker-compose.yml` | Config        | Production stack                                        | 5 services: redis, api, worker, web, caddy          |
| `infra/terraform/digitalocean/`         | Directory     | DO Terraform                                            | providers, droplet, firewall, DNS, env              |
| `packages/sdk/src/`                     | Directory     | 52 SDK module files                                     | Typed API client factory                            |
| `packages/ui/src/`                      | Directory     | UI component library                                    | Button, Input, Badge, Dialog, etc.                  |
| `packages/config/`                      | Directory     | Shared config                                           | ESLint, TypeScript base, date utils                 |
| `apps/web/e2e/`                         | Directory     | Playwright tests                                        | 26 spec files across admin/auth/marketing/portal    |
| `docs/INDEX.md`                         | Documentation | Canonical doc index                                     | 108 lines, 100+ doc references                      |
| `docs/audits/repo-deep-dive/`           | Directory     | Audit output directory                                  | README.md, RUN_ORDER.md, templates                  |

---

## Executive Summary

The **Maine CyberTech Portal** is a mature, production-ready **Hybrid Platform Monorepo** serving as an MSP client and admin portal. It operates as a modular monolith with 3 services (API, Web, Worker) deployed on a single DigitalOcean droplet behind Caddy reverse proxy, using hosted Supabase for database/auth.

**Key metrics:**

- **1,530 tests** all passing (API 583, SDK 223, Worker 24, Web 700) + 26 E2E spec files
- **66 database migrations** covering 60 modules worth of schema
- **52 API route files** and **52 SDK module files** — full CRUD for 60 business modules
- **15 CI/CD workflow files** with gated deployments, approval environments, and rollback
- **Zero ESLint errors**, TypeScript clean across all 6 packages
- **48 documentation files** — comprehensive operator, developer, and architecture docs
- **Previous audits resolved:** 89 hardening findings (12 P0, 28 P1, 49 P2), 30 architecture review findings, 38 pre-production findings, 21 codebase review findings

**Current state:** Post-DO migration, post-60-module expansion, post-89-item hardening. The repository is well-structured with strong security layering (CSP, tenant isolation via `requireOrgAccess`, local JWT verification, circuit breakers, graceful shutdown). Remaining risk areas include: SSO/OIDC not implemented, i18n not implemented, SDK return types loosely typed as `any`, and some doc drift from the rapid 60-module expansion.

---

## Inventory

| Item                | Path / symbol                           | Purpose                     | Current state      | Risk   | Notes                                                 |
| ------------------- | --------------------------------------- | --------------------------- | ------------------ | ------ | ----------------------------------------------------- |
| API                 | `apps/api/src/main.ts`                  | Express server port 4000    | Stable, hardened   | Low    | Graceful shutdown, Sentry, unhandledRejection         |
| Web                 | `apps/web/app/layout.tsx`               | Next.js App Router frontend | Stable             | Low    | CSP nonce, domain routing middleware                  |
| Worker              | `apps/worker/src/main.ts`               | BullMQ/SQS consumer         | Stable, refactored | Low    | 31 lines, Sentry, 8 task handlers                     |
| SDK                 | `packages/sdk/src/index.ts`             | Typed API client            | Complete           | Medium | Return types are `any`                                |
| @mct/ui             | `packages/ui/src/`                      | Shared UI components        | Active             | Low    | Button, Input, Badge, Theme, etc.                     |
| @mct/config         | `packages/config/`                      | ESLint/TS configs           | Active             | Low    | `noUncheckedIndexedAccess` enabled                    |
| Supabase migrations | `supabase/migrations/`                  | 66 migration files          | Complete           | Medium | Rapid expansion may have gaps                         |
| DO Terraform        | `infra/terraform/digitalocean/`         | Droplet, firewall, DNS      | Deployed           | Low    | `prevent_destroy` on droplet                          |
| CI/CD workflows     | `.github/workflows/`                    | 15 workflow files           | Mature             | Low    | Gated prod, approval envs, rollback                   |
| Docker Compose      | `infra/digitalocean/docker-compose.yml` | Production stack            | Deployed           | Low    | 256MB mem limits, healthchecks                        |
| Documentation       | `docs/`                                 | 48 files                    | Comprehensive      | Medium | Some stale/lost-sync with 60-module expansion         |
| Tests               | Across all packages                     | 1,530 tests + 26 E2E        | Comprehensive      | Low    | Strong coverage                                       |
| Auth                | `apps/api/src/middleware/auth.ts`       | JWT + Supabase auth         | Hardened           | Low    | Local JWT fast path, cookie flags                     |
| Tenant isolation    | `apps/api/src/middleware/org-access.ts` | `requireOrgAccess`          | Hardened           | Low    | All entity routers covered                            |
| Marketing site      | `apps/web/app/(public)/`                | 4 phases complete           | Stable             | Low    | Domain-routed via middleware                          |
| 60 Modules          | `apps/api/src/routes/*.ts`              | 52 route files              | Complete           | Medium | Rapid expansion, some missing portal pages/wasm tests |

---

## Domain Scorecard

| Category       | Score      | Evidence                                                                | Gap                                                                 | Recommended action                        |
| -------------- | ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| Architecture   | 8.5/10     | Clear modular monolith layering, 3-service split, hosted Supabase       | 60-module expansion adds surface area; N+1 compound endpoints fixed | Periodic architecture review              |
| Code Quality   | 8/10       | ESLint 0 errors, TypeScript clean, Zod validation on all mutations      | SDK return types are `any` (130+ usages)                            | Add strict return types to SDK            |
| Security       | 8.5/10     | CSP nonce, tenant isolation, local JWT, circuit breaker, cookie flags   | SSO/OIDC not implemented; service role key used (by-design)         | Implement SSO; monitor service role usage |
| Testing        | 9/10       | 1,530 unit/integration + 26 E2E; all passing                            | Some module portal pages lack tests                                 | Add tests for 20 new portal pages         |
| Infrastructure | 8.5/10     | DO Terraform, Cloudflare DNS, Caddy reverse proxy, GHCR images          | `prod.tfvars` uses placeholders (secrets injected via CI)           | Daily drift check on infra                |
| CI/CD          | 9/10       | 15 workflows, prod-approval gates, validate gates, rollback             | Dependabot alerts: 11 (low/medium)                                  | Triage and remediate Dependabot alerts    |
| Documentation  | 8.5/10     | 48 files across all domains                                             | Some docs stale from rapid 60-module expansion                      | Audit doc freshness against code          |
| DevOps         | 9/10       | Sentry, pino logging, health endpoints, graceful shutdown, X-Request-ID | No PagerDuty/Opsgenie integration                                   | Consider incident alerting integration    |
| UI/UX          | 7/10       | Theme system, loading skeletons, empty states, error boundaries         | Some subnav missing entries; 130+ `any` types                       | Polish navigation, reduce `any`           |
| **OVERALL**    | **8.4/10** | Production-ready with strong security and testing foundation            | Moderate gaps in type safety and expansion-era doc freshness        | Release gate should pass with conditions  |

---

## Detailed Review

### 1. Repository Type and Boundaries

The repository is a **Turborepo monorepo** using pnpm workspaces. Workspace boundaries defined in `pnpm-workspace.yaml` (`apps/*`, `packages/*`). It contains 6 packages:

**Applications (3):**

- `apps/api` — Express server (port 4000), ESM, 583 tests
- `apps/web` — Next.js 15 App Router, Turbopack, 700 tests
- `apps/worker` — Background job processor (BullMQ/SQS), 24 tests

**Shared Packages (3):**

- `packages/sdk` — `@mct/sdk`: Typed API client, 223 tests
- `packages/ui` — `@mct/ui`: UI component library (Button, Input, Badge, Dialog, Theme, etc.)
- `packages/config` — `@mct/config`: Shared ESLint + TypeScript configs + date utils

### 2. App/Service/Entry Points

| Service | Type       | Entry Point               | Port          | Build        | Dependencies                                   |
| ------- | ---------- | ------------------------- | ------------- | ------------ | ---------------------------------------------- |
| API     | Express    | `apps/api/src/main.ts`    | 4000          | tsup → dist/ | Express, Supabase, Stripe, Redis, Pino, Sentry |
| Web     | Next.js    | `apps/web/app/layout.tsx` | 3000          | next build   | React 19, Next 15, Sentry, Pino, Tailwind      |
| Worker  | Background | `apps/worker/src/main.ts` | 3001 (health) | tsup → dist/ | BullMQ, Redis, Supabase, Sentry, Nodemailer    |

### 3. Middleware Stack (API)

The Express middleware chain (`apps/api/src/app.ts`):

### 4. Infrastructure

**Production Stack:** Single DO droplet (`s-1vcpu-512mb-10gb`) behind Caddy reverse proxy

- 5 containers: redis, api, worker, web, caddy
- Hosted Supabase (cloud.supabase.com)
- GHCR image registry with SHA-tagged immutable images
- Cloudflare DNS with proxied A records

**Terraform** (`infra/terraform/digitalocean/`):

- `providers.tf` — DO + Cloudflare (S3 backend in DO Spaces)
- `droplet.tf` — `mct-portal-${environment}` with `prevent_destroy`
- `firewall.tf` — Ports 22/80/443/2376
- `dns.tf` — A records per zone (www/app/api), .com for prod, .us for dev

**Docker Compose** (`infra/digitalocean/docker-compose.yml`):

- All 5 services with health checks and memory limits
- Cloudflare origin certificates mounted
- Deployed via image piping over SSH (`docker save | gzip | ssh | docker load`)

### 5. CI/CD Pipeline

**15 workflow files** in `.github/workflows/`:

| Workflow                  | Trigger                | Gate          | Purpose                          |
| ------------------------- | ---------------------- | ------------- | -------------------------------- |
| `test.yml`                | push/PR main,develop   | —             | Unit/integration tests           |
| `lint.yml`                | push/PR main,develop   | —             | ESLint check                     |
| `typecheck.yml`           | push/PR main,develop   | —             | TypeScript check                 |
| `e2e.yml`                 | push/PR, workflow_call | —             | Playwright E2E                   |
| `validate.yml`            | workflow_call          | Required      | test+lint+typecheck parallel     |
| `deploy-do.yml`           | push main,develop      | prod-approval | Build 3 GHCR images + SSH deploy |
| `terraform-do.yml`        | push main,develop      | prod-approval | DO infra plan/apply              |
| `supabase-migrations.yml` | push main,develop      | environment   | `supabase db push`               |
| `chromatic.yml`           | PR                     | —             | Storybook visual testing         |
| `alignment-*.yml`         | PR/push                | —             | 4 workflow alignment checks      |
| `build-push.yml`          | workflow_dispatch      | —             | Manual image build               |
| `pr-status.yml`           | PR                     | —             | Status check aggregation         |

**Dependabot:** `.github/dependabot.yml` — npm + GHA weekly scans with grouped updates

### 6. Security Architecture

**Layered defense:**

1. **Edge:** Cloudflare CDN/WAF
2. **Request:** Next.js middleware (JWT exp check, domain routing, CSP nonce)
3. **API:** JWT verification (local fast path + Supabase fallback) → `requireOrgAccess()` → RLS
4. **Data:** Supabase RLS policies + service role key (by-design mitigation via org-access middleware)
5. **Output:** CSP headers (nonce-based, no `unsafe-eval`)

**Key security features:**

- `mct_session` cookie: HttpOnly, Secure, SameSite=Lax
- Stripe webhook: verified via `constructEvent()` with raw body
- Webhook idempotency: Redis dedup + deterministic keys
- Optimistic locking: `If-Match` / `ETag` for documents, projects, organizations
- Circuit breaker: On Supabase client to prevent cascading failure
- HTTP client: Timeout + retry + circuit breaker for outbound calls (JSM, Stripe, Teams)
- Rate limiting: 300 req/15min global + per-user limiter

### 7. Database

**66 migration files** from `5302026` through `5302101`:

- `5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql` — 2,377-line bootstrap
- Full schema: organizations, users, memberships, tickets, projects, documents, notifications, audit_logs, webhooks, plus 50+ module tables
- Seeds: `supabase/seeds/04_test_seed.sql` with comprehensive test data
- Migration naming: timestamp pattern `5302XXX_descriptive_name.sql`

---

## Scenario / Control Matrix

| ID   | Scenario or control                           | Evidence                                        | Current control                                 | Gap                              | Severity | Recommendation                            |
| ---- | --------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | -------------------------------- | -------- | ----------------------------------------- |
| S-01 | Unauthenticated user accesses protected route | `apps/web/middleware.ts:95-99`                  | Redirect to `/login`                            | None                             | N/A      | Already implemented                       |
| S-02 | Cross-tenant data access via entity ID        | `apps/api/src/middleware/org-access.ts`         | `requireOrgAccess()` on all entity routers      | None                             | N/A      | Already hardened                          |
| S-03 | Stale JWT reuse after logout                  | `apps/web/middleware.ts:5-14`                   | Exp check via base64url decode                  | None                             | N/A      | Already implemented                       |
| S-04 | Stripe webhook replay attack                  | `apps/api/src/routes/billing.ts`                | `constructEvent()` with raw body + idempotency  | None                             | N/A      | Already hardened                          |
| S-05 | Concurrent edit conflict                      | `apps/api/src/middleware/optimistic-locking.ts` | `requireIfMatch` + `checkVersionMatch`          | Documents/projects/orgs only     | P2       | Extend to tickets, users                  |
| S-06 | Bulk operation partial failure                | `apps/api/src/routes/tickets.ts`                | Per-item via RPC, partial success intentional   | By-design                        | P2       | Monitoring on partial failures            |
| S-07 | Secrets in CI logs                            | `deploy-do.yml:196-229`                         | SSH heredoc writing .env file                   | None                             | N/A      | Already fixed                             |
| S-08 | Terraform prod apply without gate             | `terraform-do.yml:118-127`                      | `prod-approval` environment                     | None                             | N/A      | Already gated                             |
| S-09 | Worker crash without recovery                 | `apps/worker/src/main.ts:26-30`                 | Sentry capture + exit(1), Docker restart policy | None                             | N/A      | Already implemented                       |
| S-10 | CSP bypass via `unsafe-eval`                  | `apps/web/middleware.ts:39-44`                  | Nonce-based CSP, no `unsafe-eval` in prod       | Dev mode still has `unsafe-eval` | P3       | Consider removing dev mode eval exception |
| S-11 | SSO/OIDC authentication                       | Not implemented                                 | None                                            | Full gap                         | P1       | Implement SAML/OAuth login flow           |
| S-12 | Internationalization (i18n)                   | Not implemented                                 | None                                            | Full gap                         | P3       | Planning stage only                       |
| S-13 | API key management                            | `apps/api/src/routes/api-keys.ts`               | CRUD endpoints exist, no admin page             | Admin page missing               | P2       | Add API key management UI                 |

---

## Findings

### Finding ID: ORCH-P2-001 — SDK Return Types Use `any`

- **Severity:** P2 (Medium)
- **Evidence:** `packages/sdk/src/client.ts`, `packages/sdk/src/types.ts`
- **Description:** The SDK client returns `Promise<any>` for all API calls. This defeats TypeScript type checking on the client side. There are 130+ `any` annotations in the web app (`AGENTS.md` notes this as "Noted" — doesn't block runtime).
- **Impact:** Medium — runtime-safe but type-unsafe. Can mask API contract violations until runtime.
- **Recommendation:** Define strict return types for all SDK methods. Use Zod inference from API schemas.

### Finding ID: ORCH-P2-002 — Documentation Drift from 60-Module Expansion

- **Severity:** P2 (Medium)
- **Evidence:** `docs/INDEX.md`, comparison with 52 route files in `apps/api/src/routes/`
- **Description:** The 60-module expansion (19 new modules on 2026-07-26) created feature docs for all modules, but some core docs (ENVIRONMENT_VARIABLES.md, GAP_ANALYSIS.md, API_ENDPOINT_INVENTORY.md) may be stale relative to the expanded surface area.
- **Impact:** Medium — operators and developers may reference outdated information.
- **Recommendation:** Run a comprehensive doc freshness audit against current source code.

### Finding ID: ORCH-P2-003 — Dependabot Alerts Not Triage-Documented

- **Severity:** P2 (Medium)
- **Evidence:** `AGENTS.md` line: "11 vulnerabilities remain"
- **Description:** 11 Dependabot alerts are acknowledged but not formally tracked with remediation SLAs.
- **Impact:** Medium — supply chain risk accepted without formal documentation.
- **Recommendation:** Create a vulnerability management policy document; track alerts with remediation deadlines.

### Finding ID: ORCH-P2-004 — No Load-Testing Scripts

- **Severity:** P2 (Medium)
- **Evidence:** `scripts/load-testing/` — README placeholder only
- **Description:** Load testing scripts exist as a placeholder with no actual implementation.
- **Impact:** Medium — no performance baselines before production traffic.
- **Recommendation:** Implement k6/artillery load tests for critical API endpoints and portal pages.

### Finding ID: ORCH-P3-005 — Dev Mode CSP Contains `unsafe-eval`

- **Severity:** P3 (Low)
- **Evidence:** `apps/web/middleware.ts:34-37`
- **Description:** Local development CSP allows `'unsafe-inline' 'unsafe-eval'` for script-src.
- **Impact:** Low — development-only, not deployed to production.
- **Recommendation:** No action needed; document the exception.

### Finding ID: ORCH-P1-006 — Missing SSO/OIDC Authentication

- **Severity:** P1 (High)
- **Evidence:** No SSO-related files found in routes, middleware, or config
- **Description:** SSO/OIDC (SAML/OAuth) login is listed as a medium-priority future feature but has no implementation started.
- **Impact:** High — enterprise clients may require SSO for compliance.
- **Recommendation:** Prioritize SSO implementation for enterprise readiness.

---

## Risks

| Risk                                 | Severity | Likelihood | Impact | Evidence                                     | Mitigation                     |
| ------------------------------------ | -------- | ---------- | ------ | -------------------------------------------- | ------------------------------ |
| SDK type drift from API              | Medium   | Medium     | Medium | SDK return types are `any` (130+ usages)     | Add strict typed return types  |
| Docs stale after 60-module expansion | Medium   | Medium     | Medium | 48 doc files; module expansion on 2026-07-26 | Run doc freshness audit        |
| Dependabot alerts accumulate         | Medium   | High       | Low    | 11 known vulnerabilities                     | Weekly triage cadence          |
| No SSO for enterprise clients        | High     | Medium     | High   | No SSO implementation                        | Prioritize SAML/OAuth          |
| No load-testing baselines            | Medium   | Low        | Medium | Placeholder only                             | Implement k6/artillery tests   |
| Dev mode CSP `unsafe-eval`           | Low      | Low        | Low    | middleware.ts dev path                       | Document exception             |
| Terraform state drift                | Low      | Low        | Medium | State in DO Spaces S3                        | Daily drift check              |
| Rapid module expansion quality gaps  | Medium   | Medium     | Medium | 60 modules added quickly                     | Prioritize portal page testing |

---

## Recommendations

### Immediate / Release Blocking

1. **SDK return type hardening** — Replace `any` return types with Zod-inferred types across all SDK methods. (Effort: Medium, Risk: P2)
2. **Doc freshness audit** — Cross-reference `docs/INDEX.md` and all core docs against current source code for the 60-module expansion. (Effort: Small, Risk: P2)

### This Week

3. **Implement load testing** — Create k6/artillery scripts for critical endpoints. (Effort: Medium, Risk: P2)
4. **Dependabot alert triage** — Formally document remediation SLAs for the 11 known alerts. (Effort: Small, Risk: P2)
5. **Extend optimistic locking** — Add `requireIfMatch` to ticket and user PATCH handlers. (Effort: Small, Risk: P2)

### This Month

6. **Implement SSO/OIDC login** — SAML/OAuth integration for enterprise clients. (Effort: Large, Risk: P1)
7. **Add API key management UI** — Admin page for self-serve API keys. (Effort: Medium, Risk: P2)
8. **Portal page test coverage** — Add tests for 20 new portal pages from 60-module expansion. (Effort: Medium, Risk: P2)

### Later / Platform Evolution

9. **Internationalization (i18n)** — Low priority, planning stage only. (Effort: Large, Risk: P3)
10. **PWA / offline support** — Service worker, push notifications. (Effort: Medium, Risk: P3)
11. **Real-time WebSocket/SSE** — Replace 30s polling for notifications. (Effort: Medium, Risk: P3)

---

## Quick Wins

| #   | Action                                          | Effort    | Impact | Evidence                        |
| --- | ----------------------------------------------- | --------- | ------ | ------------------------------- |
| 1   | Document Dependabot alert triage SLA            | 15 min    | Medium | 11 known alerts                 |
| 2   | Extend optimistic locking to tickets/users      | 1-2 hours | Medium | Only docs/projects/orgs have it |
| 3   | Run doc freshness check                         | 1 hour    | Medium | 48 docs, recent expansion       |
| 4   | Remove `unsafe-eval` from dev CSP (or document) | 10 min    | Low    | middleware.ts dev path          |
| 5   | Verify `prod.tfvars` secret injection           | 30 min    | Low    | Placeholder values exist        |

---

## Hardening Backlog

| Item                             | Source                           | Priority | Status           |
| -------------------------------- | -------------------------------- | -------- | ---------------- |
| SSO/OIDC login                   | AGENTS.md, Feature list          | P1       | Open             |
| API key management UI            | AGENTS.md, Feature list          | P2       | Open             |
| SDK strict return types          | Code review finding (130+ `any`) | P2       | Open             |
| i18n                             | AGENTS.md, Feature list          | P3       | Open             |
| PWA / offline                    | AGENTS.md, Feature list          | P3       | Open             |
| Real-time WebSocket              | AGENTS.md, Feature list          | P3       | Open             |
| Load testing                     | scripts/load-testing/            | P2       | Placeholder only |
| Alerting integration (PagerDuty) | Not implemented                  | P3       | Open             |
| Mobile responsiveness polish     | AGENTS.md notes                  | P3       | Mostly done      |

---

## Suggested Tests

| Test area                      | Description                                                   | Priority |
| ------------------------------ | ------------------------------------------------------------- | -------- |
| SDK type safety                | Add tests that verify return types match expected Zod schemas | P2       |
| Optimistic locking conflict    | Test concurrent PATCH on documents/projects/orgs              | P2       |
| CSP header enforcement         | Test that all routes return correct CSP headers               | P2       |
| Tenant isolation bypass        | Attempt cross-org access on every entity router               | P2       |
| Webhook idempotency            | Replay same webhook payload; verify single processing         | P2       |
| Graceful shutdown              | Send SIGTERM/SIGINT; verify connections drain                 | P2       |
| Rate limit exhaustion          | Trigger rate limit; verify 429 response                       | P2       |
| Portal page rendering          | Add tests for 20 new portal pages                             | P2       |
| Bulk operation partial failure | Verify error detail surfaces in UI                            | P2       |
| SSE notification stream        | Test server-sent events delivery                              | P3       |

---

## Suggested Documentation Updates

| Document                         | Gap                                                      | Priority |
| -------------------------------- | -------------------------------------------------------- | -------- |
| `docs/ENVIRONMENT_VARIABLES.md`  | Verify all 60 module env vars documented                 | P2       |
| `docs/API_ENDPOINT_INVENTORY.md` | Add 40+ new module endpoints                             | P2       |
| `docs/GAP_ANALYSIS.md`           | Update status of resolved items from 60-module expansion | P2       |
| `docs/modules/`                  | Ensure all 60 modules have feature docs                  | P2       |
| `docs/JWT_ROTATION.md`           | Verify current rotation schedule is accurate             | P2       |
| `docs/ROLLBACK_PROCEDURES.md`    | Verify DO-specific rollback steps are complete           | P2       |

---

## Open Questions

1. **TF state backend:** Is the DO Spaces S3-compatible backend sufficient for team collaboration, or should a more robust locking mechanism be considered?
2. **Alert routing:** No formal alert routing (PagerDuty/Opsgenie) exists. Is this acceptable for the current deployment scale?
3. **Load testing baseline:** What throughput/QPS should the single `s-1vcpu-512mb-10gb` droplet handle before scaling is needed?
4. **Migration naming:** Current pattern `5302XXX_descriptive_name.sql` works but may eventually hit conflicts. Is a date-based scheme (`YYYYMMDD_description.sql`) preferred for future migrations?
5. **Billing/entitlements:** Are Stripe subscription metadata synced to Supabase on each webhook call, or is there a reconciliation gap for edge cases?
6. **Service role key usage:** The by-design mitigation (`requireOrgAccess` before service role key usage) is documented. Should a periodic audit of service key usage be automated?

---

## Appendix

### A. Finding ID Scheme

All findings in this orchestrator use prefix `ORCH-`. Downstream prompt reports will use their respective area codes:

| Area Code | Domain                 |
| --------- | ---------------------- |
| ORCH      | Audit Orchestrator     |
| INV       | Repository Inventory   |
| ARCH      | Architecture/Topology  |
| FEAT      | Feature Map            |
| SEC       | Security/Authz/Tenancy |
| ACM       | Access Control Matrix  |
| MTI       | Multi-Tenant Isolation |
| ADM       | Admin Console Abuse    |
| DATA      | Data/Schema/Migration  |
| RLS       | RLS Policy             |
| API       | API Contracts          |
| WH        | Webhook Delivery       |
| FILE      | File Upload            |
| BILL      | Billing                |
| NOTIF     | Notifications          |
| SRC       | Search/Indexing        |
| CICD      | CI/CD                  |
| BRANCH    | Branch Protection      |
| SPLY      | Supply Chain           |
| SBOM      | SBOM/License           |
| CTNR      | Container Security     |
| ENV       | Environment/Secrets    |
| INFRA     | Infrastructure         |
| TEST      | Testing/Quality        |
| RES       | Resilience             |
| BKP       | Backup/Restore         |
| INC       | Incident Response      |
| OBS       | Observability          |
| PERF      | Performance            |
| UX        | Usability              |
| UI        | UI/Accessibility       |
| MOB       | Mobile/PWA             |
| PRIV      | Privacy/Compliance     |
| ANL       | Analytics              |
| DOCS      | Documentation          |
| PLAT      | Platform Evolution     |
| AI        | AI Readiness           |
| HYG       | Repo Hygiene           |
| FINAL     | Final Risk Register    |
| EXEC      | Executive Summary      |
| RN        | Release Notes          |

### B. Do-Not-Touch Safety Zones

The following areas must NOT be modified during audit:

1. **Application source code** — `apps/api/src/`, `apps/web/app/`, `apps/web/components/`, `apps/worker/src/`, `packages/sdk/src/`, `packages/ui/src/`
2. **Database migrations** — `supabase/migrations/`
3. **Production configuration** — `infra/digitalocean/`, `infra/terraform/digitalocean/`
4. **CI/CD workflows** — `.github/workflows/`
5. **Git config** — `.husky/`, `.gitattributes`, `.gitignore`

### C. Expected Output Inventory

All reports will be written to `docs/audits/repo-deep-dive/20260728-0142-develop-21a10d6/`:

| File                                                | Purpose                               |
| --------------------------------------------------- | ------------------------------------- |
| `00_audit_orchestrator.md`                          | This file                             |
| `01_repository_inventory.md`                        | Comprehensive narrated inventory      |
| `02_architecture_runtime_topology.md`               | Architecture and runtime audit        |
| `03_feature_implementation_map.md`                  | Feature implementation gap map        |
| `04_usability_workflow_audit.md`                    | Usability and workflow audit          |
| `05_ui_ux_accessibility_audit.md`                   | UI/UX, design system, accessibility   |
| `06_security_authz_tenancy_audit.md`                | Security, authz, tenancy audit        |
| `07_data_schema_migration_runtime_validation.md`    | Data/schema/migration audit           |
| `08_api_contracts_realtime_integrations.md`         | API contracts and integrations audit  |
| `09_testing_quality_release_confidence.md`          | Testing, quality, release confidence  |
| `10_github_actions_cicd_governance.md`              | CI/CD and governance audit            |
| `11_supply_chain_dependency_secrets.md`             | Supply chain and secrets audit        |
| `12_infra_deployment_environment_drift.md`          | Infrastructure and deployment audit   |
| `13_resilience_recovery_failure_modes.md`           | Resilience and failure modes audit    |
| `14_observability_monitoring_incident_readiness.md` | Observability and monitoring audit    |
| `15_performance_scalability_cost.md`                | Performance, scalability, cost audit  |
| `16_documentation_devex_operator_readiness.md`      | Documentation and operator readiness  |
| `17_mobile_pwa_responsive_access.md`                | Mobile and PWA audit                  |
| `18_privacy_compliance_data_governance.md`          | Privacy and compliance audit          |
| `19_platform_evolution_extensibility.md`            | Platform evolution and extensibility  |
| `20_ai_automation_agent_readiness.md`               | AI and automation readiness           |
| `21_repo_hygiene_maintainability.md`                | Repository hygiene and code health    |
| `22_final_risk_register_roadmap.md`                 | Final risk register and roadmap       |
| `23_executive_summary_release_gate.md`              | Executive summary and release gate    |
| `24_access_control_matrix_audit.md`                 | Access control matrix                 |
| `25_multi_tenant_isolation_attack_simulation.md`    | Multi-tenant attack simulation        |
| `26_admin_console_abuse_case_audit.md`              | Admin console abuse cases             |
| `27_webhook_delivery_replay_idempotency_audit.md`   | Webhook delivery audit                |
| `28_file_upload_download_security_audit.md`         | File upload security audit            |
| `29_billing_payments_reconciliation_audit.md`       | Billing and payments audit            |
| `30_notification_email_push_delivery_audit.md`      | Notification delivery audit           |
| `31_search_indexing_privacy_audit.md`               | Search and privacy audit              |
| `32_backup_restore_drill.md`                        | Backup and restore drill              |
| `33_incident_tabletop_exercise.md`                  | Incident response tabletop            |
| `34_branch_protection_required_checks.md`           | Branch protection audit               |
| `35_sbom_license_policy.md`                         | SBOM and license policy audit         |
| `36_container_runtime_security.md`                  | Container runtime security audit      |
| `37_supabase_rls_policy_deep_dive.md`               | RLS policy deep-dive                  |
| `38_env_secret_rotation.md`                         | Environment and secret rotation audit |
| `39_analytics_tracking_privacy.md`                  | Analytics and tracking audit          |
| `40_release_notes_changelog_generator.md`           | Release notes and changelog           |
| `INDEX.md`                                          | Master index of all audit outputs     |
| `risk_register.md`                                  | Consolidated risk register            |
| `roadmap.md`                                        | Remediation roadmap                   |
| `patch_plan.md`                                     | Patch plan                            |

---

## Operator Handoff

**For operators executing downstream prompts:**

1. **Start with Prompt 01** (`01_repository_inventory.md`) after this orchestrator is confirmed.
2. **Follow RUN_ORDER.md** execution order precisely — foundation/security first, then data/API, then CI/CD/supply chain, then operations/UX, then governance/platform, then final aggregation.
3. **All output files** must be written to `docs/audits/repo-deep-dive/20260728-0142-develop-21a10d6/`.
4. **Use the Finding ID scheme** from Appendix A — each prompt uses its area code prefix.
5. **Do not modify application code** — this is a read-only audit.
6. **Do not print secret values** — mask or reference them by env var name only.
7. **Evidence must be file-path specific** — cite exact file paths and line numbers.
8. **Severity levels:** P0=Critical (immediate data loss/security breach), P1=High (blocking for production), P2=Medium (significant risk), P3=Low (minor polish/dev only).
9. **Cross-reference with prior audits** — the AGENTS.md documents 89 hardening findings (12 P0, 28 P1) — all resolved. Do not re-report resolved findings.
10. **If evidence is unclear or missing**, mark it as `Unknown` rather than guessing.
11. **Final aggregation in prompts 22-23** will consolidate all findings into risk_register.md, roadmap.md, patch_plan.md, and EXECUTIVE_SUMMARY.md.
12. **Refer to this orchestrator (00)** for scope boundaries, finding schemes, and global context.
