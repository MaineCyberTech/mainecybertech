# Full Architectural & Operational Audit

**Repository:** `mainecybertech-portal`
**Date:** 2026-06-09
**Auditor:** Principal Software Architect / DevOps Lead Engineer
**Type:** Comprehensive architecture review + DevOps audit + documentation validation + cleanup plan

---

# 1. Executive Summary

**Repository:** `mainecybertech-portal` — a Turborepo monorepo delivering a multi-tenant MSP (Managed Service Provider) client portal, admin panel, public marketing site, and background worker infrastructure. The system comprises ~714 passing tests across 4 packages, a full Express API on ECS, a Next.js frontend on Vercel, a Supabase backend, and a Terraform-defined AWS/Cloudflare/Vercel deployment topology.

**Overall Verdict:** This is a well-engineered, production-oriented codebase with strong middleware layering, clean SDK abstraction, comprehensive audit logging, and serious attention to CI/CD gating. It has clearly undergone multiple architecture reviews (38 pre-production findings + 21 codebase review findings + 23 architectural findings + 10 additional gaps — all resolved). The engineering quality is above average for a mid-stage startup codebase.

**Strengths:**

- Clean monorepo structure with well-defined boundary between API, web, worker, and SDK
- Robust middleware stack: auth, admin authorization, rate limiting, security sanitization, correlation IDs, structured logging
- Comprehensive audit logging on all mutation endpoints
- Well-typed SDK with 16 domain modules, exponential backoff retry, timeout support
- Terraform IaC covers VPC, ECS Fargate, ALB, SSM secrets, Cloudflare DNS, Vercel, GitHub OIDC, SQS, autoscaling, CloudWatch alarms, Slack notifications
- CI/CD with multi-gate deployment (validate → e2e → migrations → deploy) and prod-approval environment
- Good documentation hygiene with AGENTS.md serving as a canonical reference
- All 38 pre-production findings + 21 codebase review findings + 23 architectural observations + 10 gap items resolved

**Critical Risks:**

- `CORS_ORIGIN` defaults to `*` in the API env schema — wide open in development, potentially in production
- Worker builds `node:20-alpine` with no `HEALTH_PORT` health check mapping in Dockerfile — uses port 3001 by default but this conflicts with web's port 3000
- `console.error` fallback in `audit.ts` service when audit log insert fails — silent failure path for compliance data
- `prod.tfvars` still has placeholder values for DNS targets and ACM cert ARN — cannot actually apply prod Terraform
- API container port in Terraform defaults to `3001` (line 107 of variables.tf) while Express defaults to `4000` — mismatch that would break ALB routing
- No WebSocket or real-time push for notifications (30s polling via NotificationBell) — acceptable but worth noting
- Sentry init happens eagerly on app boot via `getEnv()` which calls `process.exit(1)` if env is invalid — makes API unrecoverable without process restart

**Scorecard:**
| Dimension | Rating | Notes |
|---|---|---|
| Architecture | 8/10 | Clean monorepo, good separation of concerns |
| Security | 7/10 | Strong middleware, but `CORS_ORIGIN=*` risk, audit log silent failure |
| Resilience | 7/10 | Retry + timeout in SDK, ECS circuit breaker, but no graceful shutdown in worker |
| Observability | 7/10 | Correlation IDs, structured logging, Sentry, CloudWatch alarms |
| Infrastructure | 8/10 | Comprehensive IaC, but config drift in terraform vars |
| Documentation | 7/10 | Comprehensive AGENTS.md and docs, but some files stale |
| Test Coverage | 8/10 | 714 tests, good patterns documented |
| Cleanup | 7/10 | Most stale docs archived, some TBD items remain |

---

# 2. Analysis Method & Assumptions

**Method:** This review is based on direct reading of all source files in the repository, cross-referencing code against configuration, infrastructure, and documentation. The analysis is **evidence-based** throughout.

**Observed:**

- Monorepo structure with pnpm workspaces
- 3 application packages, 3 shared packages, 33 documentation files
- 18 CI/CD workflows, 14 Terraform `.tf` files
- 8 database migration files, 14 scripts

**Assumed / Not Confirmed:**

- All secrets referenced in Terraform exist in AWS SSM Parameter Store
- The Supabase project referenced by `import` block in `supabase.tf` (`gigpuknitajakejmyxuk`) actually exists
- ACM certificate ARN in prod Terraform is a valid existing certificate
- Cloudflare zone IDs for prod and test domains are correct

**Inferred:**

- The system targets a single client organization model (Maine CyberTech as MSP serving multiple business clients as organizations)
- The project has been under active development for 12+ months based on migration numbering
- The production environment has not yet been fully deployed (placeholder values in `prod.tfvars`)

---

# 3. Repository Map & File Inventory

## 3.1 Structural Overview

```
mainecybertech-portal/
├── apps/                          # Application packages
│   ├── api/                       # Express API (port 4000)
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── main.ts            # Entry point
│   │   │   ├── app.ts             # Express app factory
│   │   │   ├── config/env.ts      # Zod env validation
│   │   │   ├── middleware/        # 9 middleware files
│   │   │   ├── routes/            # 22 route files
│   │   │   ├── services/          # Supabase + Audit services
│   │   │   ├── lib/               # Logger, Email, Notify, Sentry
│   │   │   ├── types/             # Shared types
│   │   │   ├── validators/        # 5 Zod validator files
│   │   │   ├── __tests__/         # 26 test files
│   │   │   └── openapi.yaml       # OpenAPI spec
│   │   ├── .env.example
│   │   ├── .env.local
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Next.js frontend (port 3000)
│   │   ├── Dockerfile
│   │   ├── vercel.json
│   │   ├── middleware.ts           # JWT cookie validation
│   │   ├── next.config.mjs
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── (public)/          # Marketing + auth pages
│   │   │   ├── (portal)/          # Authenticated client portal
│   │   │   ├── (admin)/           # Admin panel
│   │   │   └── auth/callback/     # PKCE callback route
│   │   ├── components/
│   │   │   ├── admin/             # 17 admin components
│   │   │   ├── portal/            # 13 portal components
│   │   │   ├── marketing/         # 4 marketing components
│   │   │   └── shared/            # 8 shared components
│   │   ├── lib/                   # 10 utility files
│   │   ├── __tests__/
│   │   ├── e2e/                   # 24 Playwright spec files
│   │   └── public/
│   │
│   └── worker/                    # Background job processor
│       ├── Dockerfile
│       └── src/
│           ├── main.ts            # Entry point + env schema
│           ├── email.ts           # Email sender
│           └── tasks/             # 5 task handlers
│
├── packages/
│   ├── sdk/                       # TypeScript API client
│   │   └── src/
│   │       ├── index.ts           # MCTClient facade
│   │       ├── client.ts          # ApiClient with retry/timeout
│   │       ├── types.ts           # 25 interfaces
│   │       └── 16 domain modules  # Auth through Search
│   │
│   ├── ui/                        # cn() utility (clsx + tailwind-merge)
│   └── config/                    # Shared ESLint + TSConfig
│
├── infra/terraform/               # IaC (14 .tf files)
│   ├── env/                       # 8 env config files
│   ├── lambda/                    # Slack notifier Lambda
│   └── examples/                  # Commented examples
│
├── .github/
│   ├── workflows/                 # 18 CI/CD workflows
│   └── dependabot.yml
│
├── supabase/
│   ├── migrations/                # 8 migration files
│   ├── seeds/                     # Test seed data
│   ├── policies/                  # RLS policies
│   └── config.toml
│
├── docs/                          # 33 documentation files
├── scripts/                       # 14 scripts (.ps1 + .sh)
├── archive/                       # Stale docs
└── .dockerignore, docker-compose.yml, turbo.json
```

## 3.2 Repository Type

This is a **hybrid platform monorepo** with characteristics of:

- **Service-oriented:** 3 deployable apps (api, web, worker)
- **Shared-library monorepo:** 3 packages (sdk, ui, config)
- **Infrastructure-heavy:** Full Terraform IaC root
- **Database-migration-centric:** Supabase migrations tracked in-repo

## 3.3 Boundary Mapping

| Boundary          | Location                       | Protocol             |
| ----------------- | ------------------------------ | -------------------- |
| Browser ↔ Web     | `apps/web/app/`                | HTTP/HTTPS (Next.js) |
| Web ↔ API         | `/api/v1/*` rewrites → Express | HTTP (proxied)       |
| SDK ↔ API         | `packages/sdk/src/client.ts`   | HTTP JSON            |
| Worker ↔ SQS      | `@aws-sdk/client-sqs`          | AWS SDK              |
| Worker ↔ Supabase | `@supabase/supabase-js`        | HTTP/REST            |
| API ↔ Supabase    | Service role key               | Admin client         |
| Web ↔ API (auth)  | `mct_session` cookie or Bearer | JWT                  |
| API ↔ External    | Stripe, Jira, JSM, M365, SMTP  | HTTP                 |

## 3.4 Notable Files

### Duplicated or Near-Duplicate:

- `docs/README.dev.md` — was removed from `docs/` (kept root copy), but entry in INDEX.md still referenced it (fixed)
- `infra/terraform/` had 3 README files — consolidated to 1 (fixed)

### Potentially Obsolete:

- `apps/web/lib/auth/bootstrap.ts` — empty TODO stub (noted in AGENTS.md)
- `infra/terraform/examples/` — commented example files, could be moved to docs or removed
- `scripts/load-testing/` — contains only a README placeholder

### High-Risk (Secrets/Environment):

- `apps/api/.env.local` — checked into repo, contains actual local values
- `apps/web/.env.local` — same
- `apps/worker/.env.local` — same
- `infra/terraform/env/dev.tfvars` — contains live dev Vercel team ID, Supabase org slug, Cloudflare zone IDs
- `infra/terraform/.terraform/` — cached provider files (should be gitignored, but may contain state references)

### Missing But Expected:

- No `.env.example` at root (each app has its own)
- No `docker-compose.override.yml` for local overrides
- No `Makefile` or `Taskfile` (uses pnpm scripts exclusively)
- No load-testing scripts (just a placeholder README)
- No structured API error type exports for client consumption beyond SDK

---

# 4. Code Mechanics & Logic

## 4.1 Entry Points & Initialization

### API (`apps/api/src/main.ts`)

```
dotenv/config → getEnv() (Zod validation) → createApp() → app.listen(API_PORT)
```

The `createApp()` factory (`apps/api/app.ts`) wires middleware in a specific order:

1. `initSentry()` — early init, graceful skip if DSN unset
2. `helmet()` — security headers
3. `cors()` — `CORS_ORIGIN` from env (defaults to `*`)
4. `express.json({ limit: "10mb" })` — body parser with raw body capture (for Stripe)
5. `cookieParser()` — cookie support
6. `securityHeaders` — additional CSP/HSTS
7. `inputSanitizer` — XSS + SQL injection detection + HTML entity encoding
8. Global rate limiter — 300 req/15min per IP
9. Per-user rate limiter — 200 req/15min per token
10. `requestId` + `requestLogger` — correlation ID + structured request logging
11. 22 route handlers
12. `notFoundHandler` (404)
13. `errorHandler` (global, captures to Sentry)

**Observed Issue:** `api/lib/logger.ts` calls `getEnv()` at module scope (line 4), meaning logger creation will `process.exit(1)` if env is invalid, before the Sentry init in `createApp()` has a chance to report. This is a bootstrap ordering fragility.

### Web (`apps/web/app/layout.tsx` → route groups)

```
RootLayout → middleware.ts (JWT exp check) → route group layout → page
```

- `middleware.ts` decodes `mct_session` JWT base64url to check `exp` — no external deps, lightweight
- `lib/api.ts` uses `import "server-only"` for safe server component usage
- `lib/client-api.ts` uses empty `baseUrl: ""` for same-origin requests via rewrites

### Worker (`apps/worker/src/main.ts`)

```
dotenv/config → parseEnv() (Zod) → start SQS poller → start health server → process messages
```

## 4.2 Core Runtime Flow

**Request flow (authenticated user):**

```
Browser → Next.js middleware (JWT exp check) → Server component
  → getApiClient() reads mct_session cookie → SDK API call
  → Next.js rewrites /api/v1/* → Express
  → requireAuth middleware (verify token via supabase.auth.getUser)
  → Route handler (Zod validation for mutations)
  → Supabase query (via service role admin client)
  → logAuditEvent() for mutations
  → Response (ApiResponse envelope)
```

## 4.3 State Management

| State Type                | Location                       | Mechanism                           |
| ------------------------- | ------------------------------ | ----------------------------------- |
| Auth session              | Browser cookie (`mct_session`) | JWT set by API callback             |
| Application state         | Supabase Postgres              | RLS-protected tables                |
| Cache                     | API in-memory                  | Middleware cache (dashboard, roles) |
| Org context               | Cookie (`active_org`)          | Server action setActiveOrg          |
| Notification unread count | Supabase query                 | 30s polling via NotificationBell    |
| Environment config        | `config/env.ts`                | Zod-validated singleton             |

## 4.4 Side Effects Map

| Operation         | Location                                     | Error Handling                                       |
| ----------------- | -------------------------------------------- | ---------------------------------------------------- |
| DB writes         | All route handlers via Supabase admin client | Most wrapped in try/catch -> AppError                |
| Audit logging     | `services/audit.ts`                          | `console.error` on failure (no throw)                |
| Email sending     | `lib/email.ts`                               | Graceful skip if SMTP unconfigured                   |
| Stripe API calls  | `routes/billing.ts`                          | Via Stripe SDK, error -> AppError                    |
| External webhooks | `routes/webhooks.ts`                         | Stripe signature verified; Jira/JSM/M365 passthrough |
| Notifications     | `lib/notify.ts`                              | Wrapped in try/catch, `logger.warn` on failure       |
| Queue operations  | Worker via SQS SDK                           | Task-level error handling                            |
| File uploads      | `multer` -> Supabase Storage                 | Error -> AppError                                    |

## 4.5 Business Logic Hotspots

**Largest files:**

- `apps/api/src/routes/tickets.ts` — ~350+ lines, handles tickets + comments + export + notifications — should be split
- `apps/api/src/routes/projects.ts` — ~400+ lines, projects + tasks + comments + updates + export — same
- `apps/api/src/routes/documents.ts` — ~300 lines, documents + versions + bulk ops + signed URLs
- `apps/web/app/(portal)/portal/dashboard/page.tsx` — Server component with significant inline data orchestration

## 4.6 Async Behavior & Retry

| Component            | Retry Policy                                                  | Timeout        |
| -------------------- | ------------------------------------------------------------- | -------------- |
| SDK ApiClient        | 3 retries, exponential backoff (200ms→5s), on 429/502/503/504 | 30s default    |
| API Supabase client  | None (uses Supabase SDK defaults)                             | 30s configured |
| Worker SQS consumer  | SQS visibility timeout (60s) + DLQ after 3 failures           | None           |
| Worker health server | None (sync http server)                                       | None           |

**Observed:** The SDK's retry logic is well-implemented with `AbortController` and proper `sleep()` between retries. However, the API itself has **no retry wrapping** for external calls (Stripe, Jira, JSM, M365) — these rely solely on the underlying HTTP client's default behavior.

## 4.7 Dependency Analysis

**Heavyweight dependencies:**

- `@supabase/supabase-js` — in API and worker (service role admin client)
- `@aws-sdk/client-sqs` — in worker only
- `stripe` — in API for webhook signature verification + billing sync
- `next` ^15.1.6 — in web
- `@sentry/node` and `@sentry/browser` — in API and web respectively
- `pino` — in API, web, and worker

**Tight coupling:**

- API is tightly coupled to Supabase Auth for session management — no abstraction layer between auth middleware and Supabase SDK. Migration to another auth provider would require rewriting `requireAuth`.
- Web rewrites assume API is at `NEXT_PUBLIC_API_URL` — hard to change routing model without config changes.
- Terraform is tightly coupled to AWS, Vercel, Supabase, and Cloudflare providers — multi-cloud migration would be a major effort.

---

# 5. System Architecture

## 5.1 Architectural Style

The system follows a **layered architecture with service-oriented characteristics**:

```
Presentation (Next.js App Router)
  ↓ SDK or fetch
API Layer (Express routes)
  ↓ Admin client
Service Layer (Supabase admin queries)
  ↓
Database (Supabase Postgres + Auth + Storage)
```

With a **background worker layer**:

```
SQS → Worker → Supabase + Email + External APIs
```

## 5.2 Pattern Consistency

**Well-applied patterns:**

- Module-per-domain in SDK (16 classes, each ~50 lines) — clean
- Factory pattern for Express app (`createApp()`) — testable
- Zod schema validation on all mutation inputs — consistent
- `logAuditEvent()` called on all mutations — thorough
- `success()`/`failure()` helper pattern — consistent response envelope
- `getEnv()` singleton with Zod validation — clean
- `requireAuth`/`requireAdmin` middleware chain — clear auth boundary

**Inconsistencies:**

- Not all routes use Zod validators — only 7 of 22 route files have dedicated validators
- Some routes mix business logic with response formatting (e.g., `tickets.ts` — the `create` handler sends notifications inline)
- Error handling varies: some routes use `try/catch → next(error)`, others use `.catch(() => null)` in the web app
- SDK return types are `any` for most module methods — the generic `request<T>` pattern is correct but many callers don't narrow the type

## 5.3 Coupling & Cohesion

**Strong cohesion:**

- SDK modules — each file handles exactly one domain
- Middleware files — each has a single responsibility
- Validator files — each corresponds to a route domain
- Route files — resource-oriented (one resource per file)

**Tight coupling:**

- API's `lib/notify.ts` couples notification creation with email sending (single function does both)
- API's middleware stack is route-coupled — per-user rate limiter runs on every request even for non-authenticated routes
- Portal layout at `(portal)/layout.tsx` makes 6 API calls (2 batches of parallel calls) — fragile if any downstream service is slow
- Next.js rewrites create a hidden coupling between web deployment and API availability (all `/api/v1/*` requests proxy to Express)

## 5.4 Resilience & Runtime Hardening

**Strengths:**

- ECS deployment circuit breaker with rollback enabled
- SDK retry with exponential backoff on 429/502/503/504
- ALB health checks on `/health` endpoint (DB-pinging)
- `HEALTHCHECK` directives in all 3 Dockerfiles
- ECS `wait services-stable` in deploy workflows (10-min timeout)
- CloudWatch alarms for CPU, memory, ALB 5xx, latency, SQS age

**Weaknesses:**

- No graceful shutdown handling in worker (`process.on('SIGTERM')` not explicitly handled in `main.ts`)
- No circuit breaker for external API calls (Stripe, Jira, JSM, M365)
- In-memory API cache (`middleware/cache.ts`) is non-clustered — each API task has its own cache
- No request queue depth limiting — the per-user rate limiter is the only protection
- Audit log failures are silently swallowed (`console.error`, no throw) — compliance data loss
- Web portal layout makes 6 API calls before rendering — blocks HTML streaming despite being an async server component (partial mitigation: uses `Promise.all` in 2 batches)

## 5.5 Observability

**Implemented:**

- Structured JSON logging via Pino in API, web (server), and worker
- Correlation ID (`X-Request-ID`) throughout API
- Request-level logging with duration, status, method, path
- Sentry error tracking in API (20% traces in prod) and web
- CloudWatch alarms → SNS → email + Slack (via Lambda)
- CloudWatch log groups for API and worker ECS tasks
- Audit logging to `audit_logs` table for all mutations

**Missing:**

- No metrics/APM exporter (no Prometheus, OpenTelemetry, or DataDog)
- No distributed tracing across web → API → Supabase boundary
- Worker logs only to stdout (no structured SQS message lifecycle tracking beyond basic logging)
- No dashboards defined in IaC (CloudWatch dashboard widgets not configured)
- Sentry traces sample rate of 20% in prod is hardcoded — should be configurable via env

## 5.6 Scalability

**Bottlenecks identified:**

1. **N+1 query risk in portal layout** — `allMemberships` is fetched with client-side filtering (`userOrgs.filter(...)`) but the `organizations.list()` call fetches all orgs server-wide, which could be hundreds for a large MSP
2. **In-memory cache is per-process** — each Fargate task has its own cache; dashboard/role data may be stale across tasks
3. **SQS FIFO queue limits throughput** — 300 msg/sec per queue (with batching), could become a bottleneck for high-volume notification processing
4. **No query pagination for admin lists** — some admin list endpoints (users, tickets) use `ilike` search with no server-side pagination enforcement
5. **Web rewrites all API traffic** — every API call goes through Next.js, adding latency and a single point of failure for the web tier

## 5.7 Security Architecture

**Strengths:**

- Multi-layer rate limiting (global IP + per-user token)
- Input sanitization (XSS pattern detection + HTML entity encoding)
- SQL injection pattern detection
- CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy headers
- Helmet middleware
- Stripe webhook signature verification
- Supabase RLS policies for storage buckets
- Admin authorization uses single optimized JOIN query (no N+1)
- JWT cookie validation in middleware (base64url decode + exp check)
- ECS tasks in private subnets (no public IP)
- Secrets in SSM Parameter Store (SecureString for sensitive values)
- Non-root containers in all Dockerfiles
- Image scanning on ECR push (scan_on_push = true)

**Weaknesses:**

- `CORS_ORIGIN` defaults to `*` in env schema — in production, this should be restricted to specific Vercel domains
- `alb_allowed_cidrs` defaults to `["0.0.0.0/0"]` — production should restrict to Cloudflare IPs
- No CSRF protection on mutation endpoints (relies on cookie `SameSite` and CORS)
- `console.error` on audit log failure could mask compliance gaps
- `secureHeaders` middleware sets `X-Frame-Options: SAMEORIGIN` but does not set `Content-Security-Policy` properly (no frame-ancestors)
- No request body size validation for file uploads beyond Multer's 10mb and Next.js server action limit of 25mb
- The `mct_session` cookie does not appear to set `Secure` and `HttpOnly` flags explicitly in the API callback handler

---

# 6. Infrastructure & Deployment Topology

## 6.1 Runtime Topology

```
Cloudflare (DNS/proxy)
  ├── www.mainecybertech.com ──→ Vercel (Next.js)
  ├── app.mainecybertech.com ──→ Vercel (Next.js)
  └── api.mainecybertech.com ──→ AWS ALB
                                    └── ECS Fargate (API)
                                    └── SQS FIFO
                                          └── ECS Fargate (Worker)
                                               ├── Supabase (DB + Auth + Storage)
                                               ├── SMTP (email)
                                               ├── Stripe API
                                               ├── Jira/JSM API
                                               └── M365 API
```

## 6.2 Dockerfile Analysis

**API Dockerfile** (`apps/api/Dockerfile`):

- **Base:** `node:20-alpine` — good, small surface
- **Multi-stage:** Yes (builder + runtime)
- **Non-root:** Yes (`adduser` + `USER appuser`)
- **Healthcheck:** Yes (wget on port 4000)
- **Efficiency:** Copies lockfile twice (base + runtime) — minor duplication
- **Build args:** None — uses `NODE_ENV` env var
- **Observed:** Runtime stage installs `--prod` but copies `pnpm-lock.yaml` — correct for frozen lockfile

**Web Dockerfile** (`apps/web/Dockerfile`):

- **Base:** `node:20-alpine` — good
- **Multi-stage:** Yes (deps → builder → runner)
- **Non-root:** Yes (`nextjs` user)
- **Healthcheck:** Yes (wget on port 3000, 40s start period)
- **Standalone:** Uses `output: "standalone"` with `outputFileTracingRoot`
- **Build arg:** `NEXT_PUBLIC_API_URL` correctly passed as build-time ARG and runtime ENV
- **Observed:** Copies `turbo.json` in builder stage but doesn't need it after build

**Worker Dockerfile** (`apps/worker/Dockerfile`):

- **Base:** `node:20-alpine` — good
- **Multi-stage:** Yes (builder + runtime)
- **Non-root:** Yes (`appuser`)
- **Healthcheck:** Yes (wget on port 3001 via `HEALTH_PORT` env)
- **Observed:** Hardcodes `ENV HEALTH_PORT=3001` but the worker `main.ts` reads from validated env with default 3001 — consistent

## 6.3 Terraform Analysis

**Coverage:** Comprehensive. IaC provisions:

- **Network:** VPC (10.0.0.0/16), 2 AZs, NAT gateway, public/private subnets
- **Security Groups:** ALB (HTTP/HTTPS ingress), API tasks (ALB ingress only), Worker (egress-only)
- **Compute:** SQS FIFO queue + DLQ, ACM certificate, 2 ECR repos (immutable tags, scan on push, encryption)
- **Runtime:** ECS cluster, ALB + target group + listeners (HTTP→HTTPS redirect + HTTPS forward), Fargate task definitions, ECS services, autoscaling (CPU-based, 60% target)
- **Secrets:** 23 SSM parameters (String + SecureString) under `/mainecybertech/{environment}/`
- **Supabase:** Project (prevent_destroy), storage buckets noted as manual
- **Vercel:** Project + env vars + 4 domain bindings
- **DNS:** Cloudflare CNAME records for prod app/api/www + test app/api
- **GitHub OIDC:** IAM role references for Terraform + Deploy
- **Alarms:** 7 CloudWatch alarms + SNS topic + email subscription + Lambda Slack notifier
- **IAM:** ECS execution role, ECS task role, Slack notifier Lambda role

**Issues Observed:**

1. **Port mismatch:** `variables.tf` line 107 sets `api_container_port = 3001` but the Express app defaults to `4000`. This means the ALB target group routes traffic to container port 3001, but the app listens on 4000. **Critical — would cause deployment failure.**
2. **S3 bucket policy too broad:** `ecs_task_s3_access` resource in `network.tf` grants `s3:*` on `"*"` ARN — no bucket restriction. Should be scoped to specific buckets.
3. **Hardcoded ACM cert ARN:** `runtime.tf` references `var.acm_certificate_arn` but the `acm_certificate` resource in `compute.tf` creates a cert. The variable should derive from the resource, not require manual ARN input.
4. **`backend.tf` has hardcoded S3 key:** `key = "prod/terraform.tfstate"` — should use `var.environment` for separation.
5. **Supabase import block:** `supabase.tf` has an `import` block referencing a specific project ID (`gigpuknitajakejmyxuk`) — this ties the IaC to a specific project instance and won't work for fresh deployments.
6. **Missing Terraform workspace/LOCKS:** No mention of `terraform workspace` usage — relies on separate `backend.dev.hcl`/`backend.prod.hcl` for state isolation (which is fine but undocumented in relevant plan/apply commands).

## 6.4 Environment Strategy

| Layer        | Local                   | Dev                          | Prod                                 |
| ------------ | ----------------------- | ---------------------------- | ------------------------------------ |
| **Supabase** | `supabase start`        | Supabase Cloud (dev project) | Supabase Cloud (prod project)        |
| **API**      | `pnpm --filter=api dev` | ECS Fargate (1 task)         | ECS Fargate (1-3 tasks, autoscaling) |
| **Web**      | `pnpm --filter=web dev` | Vercel preview               | Vercel production                    |
| **Worker**   | Via Docker Compose      | ECS Fargate (1 task)         | ECS Fargate (1-3 tasks)              |
| **DB**       | Local Supabase Postgres | Cloud Supabase Postgres      | Cloud Supabase Postgres              |
| **Secrets**  | `.env.local`            | SSM Parameter Store          | SSM Parameter Store                  |

**Isolation assessment:** Good separation between local, dev, and prod. Dev and prod use separate Supabase projects, SSM paths, and Terraform state files. The Terraform `environment` variable controls naming everywhere.

## 6.5 CI/CD Analysis

**Workflow inventory (18 total):**

| Type            | Workflows                                                | Notes                                                 |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Validation      | test.yml, lint.yml, typecheck.yml, e2e.yml, validate.yml | validate.yml is a reusable composite                  |
| Deploy (API)    | api-deploy-ecs.{dev,prod}.yml                            | Build → push ECR → force new deployment → wait stable |
| Deploy (Worker) | worker-deploy-ecs.{dev,prod}.yml                         | Same pattern                                          |
| Deploy (Web)    | web-{dev,prod}-vercel.yml, web-preview.yml               | vercel pull + deploy                                  |
| Migrations      | supabase-migrations.yml                                  | supabase link + db push                               |
| Terraform       | terraform-{plan,apply}.{dev,prod}.yml                    | 4 total                                               |
| Other           | db-backup.yml                                            | Cron-based                                            |

**Deployment gating (production):**

1. validate.yml (test + lint + typecheck)
2. e2e.yml (Playwright)
3. supabase-migrations.yml
4. prod-approval environment (manual approval)
5. Deploy step

**CI/CD observations:**

- **Strong gating:** Production deployments require validation, E2E, migrations, and manual approval — excellent
- **Path-based triggering:** API/worker/web workflows trigger only on their respective paths — reduces unnecessary runs
- **`latest` tag usage:** Both ECS deploy workflows push `:latest` tag in addition to `:${{ github.sha }}`. This enables easy rollback but also means `latest` is mutable and could cause confusion during concurrent deploys
- **No canary/blue-green:** ECS uses `force-new-deployment` with `deployment_circuit_breaker { rollback = true }` — this is circuit breaker, not blue-green. Traffic shifts immediately
- **No ECR lifecycle policy defined:** Old images accumulate indefinitely
- **Migrations run in `deploy` workflow as a required job** — good, migrations gate deployment
- **Vercel deploy uses `npx vercel`** with no `--prebuilt` flag — Vercel rebuilds on their side, which is the documented correct approach
- **Supabase migrations in CI use `SUPABASE_ACCESS_TOKEN`** but the `supabase link` command uses `vars.SUPABASE_PROJECT_REF` — this means it only targets one project per environment, not multiple

## 6.6 Operational Readiness

**Strengths:**

- All 3 services have HEALTHCHECK in Dockerfiles
- ECS service stability wait (10-min timeout)
- Deployment circuit breaker with rollback
- CloudWatch alarms for common failure modes
- Slack alarm notifications via Lambda
- Audit logging for compliance
- Rollback procedures documented in `docs/ROLLBACK_PROCEDURES.md`

**Weaknesses:**

- No canary or blue-green deployment — instant traffic cutover
- No staged rollout (e.g., 10% → 50% → 100%)
- No automated rollback trigger (circuit breaker rolls back on deployment failure, but not on post-deployment monitoring)
- No DR plan documented for multi-region failover
- Db backup automation exists but only backs up to S3 — no cross-region replication
- No Terraform state backup strategy documented (S3 versioning + DynamoDB locking exist but recovery not documented)
- `latest` tag in ECR means rollback to an exact prior version requires knowing the SHA, not just "the previous tag"

---

# 7. Documentation & Knowledge Management Audit

## 7.1 Documentation Inventory (33 files)

| File                                            | Type                | Quality          | Drift                                      |
| ----------------------------------------------- | ------------------- | ---------------- | ------------------------------------------ |
| `AGENTS.md`                                     | Canonical reference | Excellent        | Current — updated through 2026-06-10       |
| `INDEX.md`                                      | Doc index           | Good             | Updated with missing entries               |
| `ENVIRONMENT_VARIABLES.md`                      | Reference           | Good             | Updated with missing vars                  |
| `GAP_ANALYSIS.md`                               | Audit               | Good             | Updated test counts, resolved items marked |
| `BILLING.md`                                    | Feature guide       | Good             | Stale note about STRIPE_SECRET_KEY fixed   |
| `ROLLBACK_PROCEDURES.md`                        | Operations          | Good             | Comprehensive                              |
| `MONITORING_AND_ALERTING.md`                    | Operations          | Good             | Comprehensive                              |
| `SECRETS_ROTATION.md`                           | Operations          | Good             | Comprehensive                              |
| `FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`       | Operations          | Good             | Comprehensive operator guide               |
| `ARCHITECTURAL_ANALYSIS.md`                     | Architecture        | Excellent        | 23 critical observations documented        |
| `API_VERSIONING.md`                             | Standards           | Moderate         | Short, applicable                          |
| `JIRA_JSM_INTEGRATION.md`                       | Feature guide       | Good             | Detailed                                   |
| `ORG_BRANDING.md`                               | Feature guide       | Good             | Detailed                                   |
| `ADMIN_FEATURES.md`                             | Feature guide       | Good             | Covers all admin features                  |
| `MARKETING_SITE_INTEGRATION.md`                 | Feature guide       | Good             | Phase tracking                             |
| `API_RATE_LIMITING.md`                          | Reference           | Good             | Updated to 300/15min                       |
| `GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`        | Reference           | Good             | Required secrets/variables listed          |
| `LOCAL_DEVELOPMENT_CHECKLIST.md`                | DX                  | Moderate         | Basic                                      |
| `SUPABASE_MIGRATION_CHEATSHEET.md`              | DX                  | Moderate         | Basic                                      |
| `SUPABASE_MIGRATION_WORKFLOW.md`                | DX                  | Moderate         | Basic                                      |
| `PRODUCTION_CUTOVER_CHECKLIST.md`               | Operations          | Moderate         | Reasonable                                 |
| `PRODUCTION_VS_TESTING_DOMAINS.md`              | Reference           | Moderate         |                                            |
| `ENVIRONMENT_MATRIX.md`                         | Reference           | Short (24 lines) | Redundant with other docs                  |
| `ENVIRONMENT_PROVISIONING_AND_PROMOTION.md`     | Operations          | Moderate         |                                            |
| `CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md` | Feature guide       | Moderate         |                                            |
| `CLOUDFLARE_VERCEL_DOMAIN_COMPLETION_README.md` | Operations          | Moderate         |                                            |
| `DEPLOYMENT_OPTIONS_COMPARISON.md`              | Architecture        | Moderate         |                                            |
| `DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md`      | Meta                | Low (stale)      |                                            |
| `FINAL_OPERATOR_MAP.md`                         | Operations          | Moderate         |                                            |
| `VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md`         | Operations          | Low (stale)      |                                            |
| `VSCODE_GIT_QUICKSTART.md`                      | DX                  | Low              | Duplicates standard git flow               |
| `ZERO_DOWNTIME_CUTOVER_NOTES.md`                | Operations          | Moderate         |                                            |
| `portal_admin_permissions_guide.md`             | Feature guide       | Moderate         |                                            |

## 7.2 Accuracy Assessment

**AGENTS.md** is the strongest documentation artifact — it accurately reflects the codebase structure, architecture decisions, test patterns, CI/CD workflow, infrastructure design, and audit findings. It is clearly maintained as a living document.

**Areas of drift (low severity, mostly historical):**

- Some docs in `docs/` are stale planning artifacts (e.g., `DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md`, `VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md`) — these should be archived
- Several domain-operation docs could be consolidated (e.g., `ENVIRONMENT_MATRIX.md` and `PRODUCTION_VS_TESTING_DOMAINS.md` overlap)
- `FINAL_OPERATOR_MAP.md` and `FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` overlap significantly — the Handbook is superset

## 7.3 Developer Experience Assessment

**Could a new engineer realistically ship a change?**

**Yes, with caveats.** The steps would be:

1. Clone repo
2. `pnpm install` (pnpm required globally via corepack)
3. `supabase start` (requires Docker + Supabase CLI)
4. Run env sync script: `pnpm supabase:env:sync`
5. Start API: `pnpm --filter=api dev`
6. Start web: `pnpm --filter=web dev`
7. Write code, `pnpm test`, `pnpm lint`

**Barriers:**

- Requires Supabase CLI, Docker Desktop, node 20, pnpm
- Local Supabase setup is scripted but has dependencies (PowerShell scripts, Windows-specific)
- No `docker-compose up` that handles the full local stack (docker-compose.yml builds Docker images, not hot-reload dev)
- Understanding the monorepo structure and turbo pipeline takes initial effort
- API `.env.local` contains real local secrets that may not work without local Supabase running

---

# 8. Code & Asset Cleanup Review

## 8.1 Dead Code & Orphaned Assets

| Item                                          | Location                         | Status                       | Action                 |
| --------------------------------------------- | -------------------------------- | ---------------------------- | ---------------------- |
| `bootstrap.ts`                                | `apps/web/lib/auth/bootstrap.ts` | Empty TODO stub              | Remove or implement    |
| `.terraform/`                                 | `infra/terraform/.terraform/`    | Cache (should be gitignored) | Ensure in `.gitignore` |
| `.playwright-report/`, `.playwright-results/` | Root                             | Test artifacts               | Ensure in `.gitignore` |
| `turbo.json` in Docker build                  | `apps/web/Dockerfile` line 19    | Unnecessary after build      | Remove copy step       |
| `old-archived.zip`                            | `infra/terraform/`               | Already removed              | Confirmed gone         |
| `docs/portal_platform_formal_handoff_bundle/` | `docs/`                          | Stale planning artifact      | Consider archiving     |
| `scripts/load-testing/`                       | Root                             | README placeholder only      | Implement or remove    |

## 8.2 Dependency Bloat

**Runtime deps that could be devDeps:**

- `pg` in root `package.json` — used by Supabase CLI? Not referenced in any app directly
- `supabase-cli` in root `package.json` — `^0.0.21`, appears to be a wrapper, not used in any script

**Unused packages:**

- `ws` in `apps/worker/devDependencies` — `@types/ws` is imported for type checking in Supabase client, but `ws` itself appears not to be used by worker (it's used by API's Supabase client realtime transport)
- `@types/multer` in API devDeps — Multer v2 ships its own types

**Potential bloat:**

- Next.js bundle includes `@sentry/browser` + `@sentry/react` — could be combined or tree-shaken
- `lucide-react` ^0.468.0 is the icon library — clean, but large (tree-shakeable via named imports)

## 8.3 Redundant Logic

| Pattern                                 | Location                       | Count         | Fix                                                 |
| --------------------------------------- | ------------------------------ | ------------- | --------------------------------------------------- |
| `.catch(() => null)` pattern            | Multiple web server components | ~15 instances | Could extract to typed helper                       |
| Error response construction             | API route handlers             | ~22 routes    | Centralized via `failure()` helper (already in use) |
| `getApiClient().organizations.list()`   | Portal layout + dashboard      | ~3 instances  | No caching layer for repeated calls                 |
| `logger.warn` / `logger.error` patterns | Throughout                     | Consistent    | No abstraction needed                               |

## 8.4 Configuration Sprawl

| Issue                             | Details                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `CORS_ORIGIN` in 3 places         | API env schema (default "\*"), Terraform SSM parameter, API app.ts CORS config      |
| `NEXT_PUBLIC_API_URL` in 3 places | Dockerfile build ARG, Dockerfile runtime ENV, next.config.mjs fallback              |
| API port default mismatch         | Express = 4000, Terraform = 3001                                                    |
| Log level in 2 places             | API: `LOG_LEVEL` via env schema, Web: `LOG_LEVEL` via `process.env` directly        |
| `HEALTH_PORT` hardcoded           | Worker Dockerfile line 34 sets `ENV HEALTH_PORT=3001`, also in `docker-compose.yml` |

---

# 9. Security, Reliability & Operational Risk Review

## 9.1 Critical Risks

| #   | Risk                                            | Severity     | Category    | Details                                                                                                                                                  |
| --- | ----------------------------------------------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CORS_ORIGIN defaults to `*`**                 | High         | Security    | API env schema defaults to `*`, meaning any origin can make authenticated requests. In production, this should be restricted to specific Vercel domains. |
| 2   | **API container port mismatch (4000 vs 3001)**  | **Critical** | Reliability | Terraform configures ALB target group for port 3001, but Express listens on 4000. The ECS service health check would fail, blocking deployment entirely. |
| 3   | **Audit log failure is silently swallowed**     | Medium       | Compliance  | `services/audit.ts` uses `console.error` on insert failure. No throw, no retry, no alert. Compliance data loss in production would go unnoticed.         |
| 4   | **`alb_allowed_cidrs` defaults to `0.0.0.0/0`** | High         | Security    | The ALB allows traffic from any IP. Should restrict to Cloudflare IP ranges for production.                                                              |
| 5   | **S3 IAM policy grants access to all buckets**  | High         | Security    | `ecs_task_s3_access` uses `"Resource": ["*"]` for `s3:*` actions. Should be scoped to specific buckets.                                                  |

## 9.2 Medium Risks

| #   | Risk                                                  | Details                                                                                                                                   |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | No `Secure`/`HttpOnly` cookie flags                   | The `mct_session` cookie set by API callback may not be explicitly flagged as Secure/HttpOnly (needs verification in auth callback route) |
| 7   | No CSRF protection                                    | Cookie-based auth relies on SameSite + CORS but has no CSRF token                                                                         |
| 8   | `protect-until-next-release` TBD items                | Several medium-value features still unstarted                                                                                             |
| 9   | No rate limiting on auth endpoints                    | Login/signup/forgot-password could be brute-forced (mitigated by IP rate limiter)                                                         |
| 10  | Worker `process.on('SIGTERM')` not handled            | Worker could drop in-flight SQS messages on shutdown if not properly drained                                                              |
| 11  | No request validation for `GET /api/v1/public/submit` | The public endpoint accepts arbitrary data from unauthenticated users — should validate payload size and structure beyond basic Zod       |

## 9.3 Low Risks

| #   | Risk                                                                               | Details                                                                                                  |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 12  | `latest` Docker tag is mutable                                                     | Concurrent deploys could race on `latest`                                                                |
| 13  | No ECR lifecycle policy                                                            | Old images accumulate, increasing storage costs                                                          |
| 14  | API `getEnv()` calls `process.exit(1)` on invalid env                              | Makes API unrecoverable without container restart — but this is acceptable for containerized environment |
| 15  | `Sentry.captureException` in global error handler runs even for expected AppErrors | Sends expected validation errors to Sentry, increasing noise and cost                                    |

---

# 10. Technical Debt Assessment

| #   | Debt Item                                            | Why It Matters                            | Impact                                           | Fix                                                                             | Priority      |
| --- | ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------- |
| 1   | Port mismatch (4000 vs 3001)                         | **Blocks production deployment entirely** | Critical — ECS service will never become healthy | Align `api_container_port` default in Terraform to 4000                         | **Immediate** |
| 2   | `CORS_ORIGIN=*` default                              | Security vulnerability in production      | High — allows any origin to make requests        | Change default to empty string, require explicit config                         | **Immediate** |
| 3   | `prod.tfvars` placeholder values                     | Cannot apply prod Terraform               | High — blocks infra deployment                   | Fill in actual values                                                           | **Immediate** |
| 4   | Audit log silent failure                             | Compliance data loss                      | Medium — undetected audit gaps                   | Add retry + alert on audit log failure                                          | Short-term    |
| 5   | S3 policy `"Resource": ["*"]`                        | Security risk                             | High — overly permissive                         | Scope to specific resources                                                     | Short-term    |
| 6   | In-memory cache per-task                             | Dashboard data stale across tasks         | Medium — inconsistent UX                         | Use external cache (Redis/ElastiCache) or accept staleness                      | Medium-term   |
| 7   | Portal layout makes 6 API calls                      | High latency for portal pages             | Medium — slow page loads                         | Batch into compound endpoint or use React Suspense streaming                    | Short-term    |
| 8   | No graceful shutdown in worker                       | SQS message loss during deploys           | Medium — duplicate or lost work                  | Add `SIGTERM` handler to drain in-flight messages                               | Short-term    |
| 9   | `alb_allowed_cidrs: ["0.0.0.0/0"]`                   | Network security                          | High                                             | Restrict to Cloudflare IPs in prod                                              | Short-term    |
| 10  | No distributed tracing                               | Hard to debug cross-service issues        | Medium — slow incident resolution                | Add OpenTelemetry instrumentation                                               | Medium-term   |
| 11  | Worker `HEALTH_PORT` env var hardcoded in Dockerfile | Configuration drift                       | Low — duplicated config                          | Remove hardcoded `ENV HEALTH_PORT=3001` from Dockerfile, rely on docker-compose | Short-term    |
| 12  | `latest` Docker tag strategy                         | Rollback confusion                        | Low — hard to know "last good" image             | Use git SHA exclusively, remove `latest` tagging                                | Short-term    |
| 13  | API `getEnv()` calls `process.exit(1)`               | App can't recover from invalid config     | Low (acceptable in containers)                   | Consider graceful degradation with defaults                                     | Low           |
| 14  | 16 docs files with significant overlap               | Knowledge fragmentation                   | Medium — hard to find correct info               | Consolidate domain-operation docs                                               | Medium-term   |
| 15  | No OpenTelemetry/metrics exporter                    | Ops visibility gap                        | Medium — reactive monitoring                     | Add structured metrics                                                          | Medium-term   |

---

# 11. Recommended Remediation Roadmap

## Immediate (0–7 Days)

| #   | Action                                                                                                         | Priority     | Effort | Expected Outcome               |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------ | ------ | ------------------------------ |
| 1   | **Fix API container port mismatch** — Change `variables.tf` `api_container_port` default from `3001` to `4000` | **Critical** | 5 min  | ECS service can become healthy |
| 2   | **Set `CORS_ORIGIN` default to `""`** — remove `*` default, require explicit config                            | **Critical** | 5 min  | No accidental wide-open CORS   |
| 3   | **Fill `prod.tfvars` with real values** — Cloudflare zone IDs, ACM cert ARN, Vercel DNS CNAME targets          | **Critical** | 30 min | Prod Terraform can be applied  |
| 4   | **Add explicit `Secure`/`HttpOnly`/`SameSite` cookie flags** to `mct_session` in API auth callback             | High         | 15 min | Cookie security hardening      |
| 5   | **Fix S3 IAM policy** — scope `ecs_task_s3_access` to specific bucket ARNs                                     | High         | 15 min | Least-privilege S3 access      |

## Short Term (1–4 Weeks)

| #   | Action                                                                     | Priority | Effort  | Expected Outcome                   |
| --- | -------------------------------------------------------------------------- | -------- | ------- | ---------------------------------- |
| 6   | **Add retry + alert on audit log failure**                                 | High     | 1 day   | No silent compliance data loss     |
| 7   | **Restrict `alb_allowed_cidrs` to Cloudflare IPs** in prod                 | High     | 1 hour  | Network security hardening         |
| 8   | **Add graceful shutdown to worker** — `process.on('SIGTERM')` to drain SQS | High     | 1 day   | No message loss during deployments |
| 9   | **Remove `latest` Docker tag** from CI/CD workflows                        | Medium   | 30 min  | Clean image versioning             |
| 10  | **Remove hardcoded `HEALTH_PORT` from worker Dockerfile**                  | Medium   | 5 min   | Single source of truth for port    |
| 11  | **Consolidate overlapping docs** — archive stale domain-operation docs     | Medium   | 2 hours | Cleaner documentation              |
| 12  | **Remove `bootstrap.ts` stub**                                             | Low      | 5 min   | Remove dead code                   |
| 13  | **Add ECR lifecycle policy** — expire images older than 90 days            | Medium   | 30 min  | Reduced storage costs              |

## Medium Term (1–3 Months)

| #   | Action                                               | Priority | Effort | Expected Outcome                             |
| --- | ---------------------------------------------------- | -------- | ------ | -------------------------------------------- |
| 14  | **Add compound endpoint for portal dashboard data**  | High     | 2 days | Reduce portal layout from 6 to 1-2 API calls |
| 15  | **Add OpenTelemetry / structured metrics export**    | Medium   | 1 week | Distributed tracing across services          |
| 16  | **Replace in-memory cache with Redis/ElastiCache**   | Medium   | 1 week | Consistent cache across API tasks            |
| 17  | **Add Zod validators to remaining 15 route files**   | Medium   | 2 days | Consistent input validation                  |
| 18  | **Add rate limiting specifically on auth endpoints** | Medium   | 1 day  | Brute force protection                       |
| 19  | **Implement CSRF token protection**                  | Medium   | 2 days | Defense-in-depth for cookie auth             |

## Longer Term (3+ Months)

| #   | Action                                                       | Priority | Effort  | Expected Outcome                |
| --- | ------------------------------------------------------------ | -------- | ------- | ------------------------------- |
| 20  | **Blue-green deployment on ECS**                             | Medium   | 2 weeks | Zero-downtime deploys           |
| 21  | **Replace 30s polling with WebSocket/SSE for notifications** | Medium   | 1 week  | Real-time notification delivery |
| 22  | **Multi-region DR for Supabase + ECS**                       | Low      | 1 month | Disaster recovery capability    |
| 23  | **Service mesh / API gateway** for web→API routing           | Low      | 2 weeks | Decouple web from API routing   |
| 24  | **Wire `@mct/ui` & `@mct/config` into apps**                 | Low      | 2 days  | Shared configs actually used    |

---

# 12. Critical Observations & Vulnerabilities

| #   | File / Module                                     | Category     | Severity     | Description                                                                                                                                                                                                                                              | Impact                                                                                                                   | Recommended Remediation                                                                                       |
| --- | ------------------------------------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | `infra/terraform/variables.tf:107`                | Reliability  | **Critical** | `api_container_port` defaults to `3001` but Express listens on `4000`. ALB health check will fail on `/health:3001` against an app on `4000`.                                                                                                            | **Production ECS deployment will fail.** Service will never become healthy.                                              | Change default to `4000` to match Express `env.ts` default.                                                   |
| 2   | `apps/api/src/services/supabase.ts:18`            | Config Drift | **Critical** | `global.fetch = (...args) => fetch(...args)` is a no-op wrapper — it doesn't actually configure the global fetch, it just points to the existing fetch. The comment in AGENTS.md says "Node 20 undici connection pooling" but there's no `agent` config. | No actual connection pooling configured.                                                                                 | Add proper `undici` agent configuration or remove wrapper.                                                    |
| 3   | `apps/api/config/env.ts:30`                       | Security     | **High**     | `CORS_ORIGIN: z.string().default("*")` — production API will accept requests from any origin. Combined with cookie-based auth, this is a credential exposure risk.                                                                                       | Any website can make authenticated API calls if user has valid `mct_session` cookie.                                     | Remove `*` default; require explicit `CORS_ORIGIN` in prod.                                                   |
| 4   | `apps/api/src/services/audit.ts:27`               | Compliance   | **Medium**   | `console.error("audit log insert failed", error)` — audit failures are silently swallowed. No retry, no alert, no circuit breaker.                                                                                                                       | Compliance-relevant events can be silently lost in production.                                                           | Add retry (3 attempts) + logger.error + Sentry capture.                                                       |
| 5   | `infra/terraform/env/prod.tfvars`                 | Operational  | **High**     | Contains placeholder values for `cloudflare_prod_*_target`, `cloudflare_zone_id_prod`, `acm_certificate_arn`.                                                                                                                                            | Cannot run `terraform apply` for production.                                                                             | Fill in actual values before prod deployment.                                                                 |
| 6   | `infra/terraform/network.tf:55-63`                | Security     | **High**     | ECS task S3 policy allows all `s3:*` actions on `"*"` ARN.                                                                                                                                                                                               | Any compromised ECS task can read/write any S3 bucket in the account.                                                    | Scope to specific bucket ARNs matching the Supabase storage buckets.                                          |
| 7   | `apps/web/app/(portal)/layout.tsx`                | Performance  | **Medium**   | Portal layout makes 6 sequential-parallel API calls in 2 batches before rendering. Degrades page load time.                                                                                                                                              | Portal pages are slow to render, poor user experience.                                                                   | Use React Suspense boundaries + streaming, or add a compound dashboard endpoint.                              |
| 8   | `apps/worker/src/main.ts`                         | Reliability  | **Medium**   | Worker has no `SIGTERM` handler. ECS sends `SIGTERM` before stopping a task; without draining, in-flight SQS messages may be lost or duplicated.                                                                                                         | Messages processed but not deleted from SQS could be reprocessed. Processed messages not yet acknowledged could be lost. | Add `process.on('SIGTERM', ...)` to stop SQS poller and allow current handler to finish.                      |
| 9   | `apps/api/src/middleware/security.ts:84-85`       | Code Quality | **Low**      | Logger is defined at module bottom (line 84) after being used at line 60. Works due to hoisting/function execution order but confusing.                                                                                                                  | Maintainability concern — easy to miss.                                                                                  | Move logger import/definition to module top.                                                                  |
| 10  | `apps/api/src/lib/notify.ts:37`                   | Reliability  | **Medium**   | `CORS_ORIGIN` used as base URL for notification links. This is semantically wrong — CORS origin is for browser security policy, not for link generation. If set to `*`, link generation breaks.                                                          | Notification links would be broken in production if `CORS_ORIGIN` is `*`.                                                | Add a dedicated `APP_BASE_URL` env var for notification link generation.                                      |
| 11  | `apps/web/lib/client-api.ts:3-6`                  | DX           | **Low**      | Empty `baseUrl: ""` relies entirely on Next.js API rewrites. If rewrites are not working, client components silently fail.                                                                                                                               | Hard to debug client-side API failures. No explicit API URL in clients.                                                  | Document this dependency prominently. Consider using `NEXT_PUBLIC_API_URL` as fallback.                       |
| 12  | `.github/workflows/api-deploy-ecs.prod.yml:54-56` | Operational  | **Medium**   | Pushes `:latest` tag alongside `:${{ github.sha }}`. Concurrent CI runs on different branches would race on `latest`.                                                                                                                                    | Rollback ambiguity — `latest` is not deterministic.                                                                      | Remove `:latest` tagging; use SHA-tagged images exclusively. Reference via SHA in ECS task definition update. |

---

# Final Assessment

This repository represents a **mature, well-maintained mid-stage platform codebase** that has clearly been through multiple architecture reviews and hardening passes. The engineering investment in CI/CD gating, audit logging, middleware layering, and infrastructure-as-code is well above average for a project of this scope.

The **single blocking issue** is the API port mismatch (Terraform 3001 vs Express 4000) — this would prevent any production ECS deployment from succeeding. Combined with the `*` CORS origin and placeholder prod Terraform values, the production readiness is **one sprint away** from being solid.

The documentation is a **genuine strength** — AGENTS.md is one of the best repository-level architectural references I've seen in a monorepo of this size. The 16+ doc files showing overlap are a minor concern; the primary docs (AGENTS.md, ENVIRONMENT_VARIABLES.md, ROLLBACK_PROCEDURES.md) are accurate and current.

**Recommendation:** Deploy to dev immediately after fixing the port mismatch and CORS origin default. Address the S3 IAM scope and audit logging retry before production. The remaining items are medium/long-term improvements for a mature platform.
