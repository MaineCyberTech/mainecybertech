# Maine CyberTech Client Portal — Full Architecture & Code Review

**Date:** 2026-06-16
**Reviewer:** Principal Software Architect / Senior Staff Engineer
**Scope:** Full codebase deep-dive covering architecture, engineering quality, infrastructure, security, UI/UX, documentation, and operational readiness.

---

## 1. Executive Summary

**System:** Maine CyberTech (MCT) Client Portal — a full-stack, multi-tenant Managed Service Provider (MSP) client and admin portal with integrated marketing site.

**What it does:** Provides organization-based user portals for ticket management, document management, project tracking, billing/invoicing, and notifications. Includes a full admin backend for user/role/permission management, audit logging, webhook management, health dashboards, and CSV export. Has a public-facing marketing site (4 phases complete) with contact forms, service pages, and JSM/Jira integration. All frontend components are built using Next.js App Router with React 19.

**Overall Maturity:** **Late-stage development / near production-ready.** The codebase has clearly been through multiple audit cycles (38 pre-production findings, 21 codebase review findings, 25 architectural findings — all resolved). Infrastructure is well-defined in Terraform with ECS Fargate, RDS/Supabase, SQS, ECR, ALB, CloudFront/Cloudflare, and Vercel frontend. CI/CD is mature with 18 workflow files, gated deployments, prod-approval environments, and OIDC-based AWS access. 714 unit/integration tests passing, 24 E2E Playwright spec files.

**Biggest Strengths:**

1. Extremely thorough documentation — 28 docs files covering everything from architecture to secrets rotation
2. Mature IaC — Terraform with 12 .tf files, proper state separation (dev/prod), SSM Parameter Store secrets management, autoscaling, monitoring alarms
3. Comprehensive testing — 714 tests across 4 packages with Playwright E2E
4. Strong security foundation — Helmet, rate limiting (IP + user-level), input sanitization, Stripe webhook validation, Zod validation on mutation endpoints, audit logging on all 27 mutation endpoints
5. Clean separation of concerns — Turbo monorepo with 4 well-defined app packages plus shared packages, clear API → SDK → Web layering

**Biggest Weaknesses:**

1. **Input sanitizer breaks valid input** — The `security.ts` input sanitizer replaces HTML special characters in _all_ string fields (including passwords, JSON content, textarea bodies) with Unicode escapes, corrupting legitimate data. This is a critical correctness bug for any field containing `>`, `<`, `"`, or `'`.
2. **API-wide `requireAuth` with no organization-scoped authorization on many routes** — Entities like tickets, projects, and documents are fetched by ID without verifying the requesting user has membership in the owning organization. Any authenticated user can access any organization's records if they know the ID.
3. **SDK `getToken` callback pattern is fragile for cookie auth** — `client-api.ts` creates an SDK client with empty `baseUrl: ""` and no `getToken` callback, relying entirely on the Next.js rewrites proxy. This means the SDK cannot be used for server-side calls that need to set the Authorization header from a cookie.
4. **Worker has no Sentry integration and limited error observability** — The worker has no Sentry SDK, no structured error reporting to an external service, and relies only on pino logging. Failed tasks that exhaust retries silently land in the DLQ without alerting.
5. **Terraform uses `:latest` tag references in task definitions** (`runtime.tf:284,318`) — despite the CI workflows using SHA-only tagging. The task definitions reference `:latest`, which means a `terraform apply` would register a task definition pointing to stale images.

**Top 5 Highest-Priority Recommendations:**

1. **Fix `security.ts` input sanitizer** — Stop mutating all string body fields; either remove the HTML-encoding entirely (Zod + RLS provide sufficient protection) or apply it only to fields headed for HTML rendering.
2. **Add tenant-scoped authorization** — Base all entity queries on `req.authUser` organization memberships (tickets, documents, projects). Currently only the `requireAdmin` middleware does a membership check.
3. **Align Terraform task definition image tags with CI** — Change `runtime.tf` to use a variable for the image tag (defaulting to `latest` for local dev but overridden by CI), or use `data.aws_ecs_image` to resolve the SHA of the deployed image.
4. **Add Sentry to the Worker** — Install `@sentry/node` and initialize in `main.ts` to capture unhandled rejections and task failures.
5. **Add a global error boundary for unhandled promise rejections in API** — The API `main.ts` doesn't have `process.on("unhandledRejection")`, meaning unhandled promise rejections silently crash nothing but are swallowed.

---

## 2. What This Project Is

**Maine CyberTech Client Portal** is a production-grade, multi-tenant MSP (Managed Service Provider) platform that serves:

- **External clients (end users):** Portal access for ticket submission, document management, project timelines, billing, and notifications
- **Internal admins (MSP staff):** Full admin panel for user management, role-based access control, permissions, organization management, audit logs, webhook configuration, health monitoring
- **Public visitors:** Marketing website with service pages, contact forms, and lead capture integrated with JSM and Teams webhooks

**Business context** (inferred): Maine CyberTech is an MSP providing cybersecurity and IT services. The platform enables self-service client portal access while giving MSP staff comprehensive management tools.

**Major capabilities:**

- Organization-based multi-tenant architecture
- Role-based access with 5+ roles and 26+ granular permissions
- Ticket management with comments, status/priority lifecycle, assignment, 5-min edit window
- Document management with version history, grid/list/table views, upload/download
- Project management with task timeline, calendar, Gantt views
- Billing/invoicing via Stripe with subscription management
- In-app notification system with email delivery (SMTP), bell badge with 30s polling
- Notification preferences per module (email/in-app toggles)
- Webhook management with delivery logs and test capability
- Audit logging on all mutation endpoints with search/filter/pagination
- Full-text search across admin and portal scopes
- CSV/JSON export for tickets and projects
- Bulk user import via CSV
- Public marketing site (homepage, 5 service detail pages, contact form)
- Jira/JSM integration for ticket sync
- M365 calendar sync (worker task)
- Stripe billing reconciliation (worker task)
- Scheduled notification digests (worker task)

---

## 3. How It Works

### Request Flow (Browser to Database)

```
Browser → Next.js (Vercel/Standalone)
  → Public routes: served directly by Next.js
  → Portal/Admin routes: Next.js middleware validates mct_session JWT
    → If expired → redirect to /login
    → If valid → render server component
      → Server component calls SDK via lib/api.ts (with cookie as Bearer token)
        → Next.js rewrites proxy: /api/v1/* → API server
          → Express middleware chain:
            1. helmet() — security headers
            2. cors() — CORS
            3. express.json(10mb) — body parsing with raw body capture for Stripe
            4. cookie-parser() — cookie parsing
            5. securityHeaders — additional headers
            6. inputSanitizer — XSS/SQLi detection + HTML encoding
            7. rateLimit (global: 300/15min IP)
            8. rateLimitByUser (200/15min per user)
            9. requestId — X-Request-ID correlation
            10. requestLogger — structured request logging
          → Route handler → requireAuth/requireAdmin as needed
            → supabase.auth.getUser(token) for auth
            → requireAdmin checks memberships.roles!inner() JOIN
          → Business logic → Supabase Admin client (bypasses RLS)
          → Audit logging via logAuditEvent()
          → Response → success()/failure() wrapper
  → Browser-side: client components use SDK via client-api.ts (cookie-backed, no token callback)
```

### Auth Flow

1. User visits /login → fills email/password → loginAction() server action
2. Server action calls API POST /api/v1/auth/sign-in
3. API uses supabase.auth.signInWithPassword() → returns access_token + user
4. Browser stores mct_session cookie (set by server action response)
5. protected route check: middleware.ts decodes JWT base64url → checks exp
6. For PKCE auth (callback): Browser → /auth/callback → forwards Cookie to API → API exchanges code → sets mct_session

### Worker Flow

1. API routes enqueue SQS FIFO messages for async work (notifications, billing sync)
2. Worker polls SQS with configurable concurrency (default 10)
3. Messages dispatched to registered task handlers (5 handlers: ping, stripe-reconcile, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications)
4. Successful messages deleted from queue; failures return to queue (max 3 retries) then DLQ
5. Graceful shutdown drains in-flight tasks

### Deployment Model

- **Frontend:** Next.js → Vercel (production) or Docker standalone (self-hosted)
- **API:** Express → Docker → ECS Fargate behind ALB
- **Worker:** Node.js → Docker → ECS Fargate (private subnets)
- **Database:** Supabase (PostgreSQL) managed via Terraform + CLI migrations
- **Queue:** SQS FIFO with DLQ
- **Storage:** Supabase Storage (documents, avatars)
- **DNS:** Cloudflare (CNAME → Vercel for web, CNAME → ALB for API)
- **Monitoring:** CloudWatch metrics + alarms → SNS → Email + Slack webhook → Lambda

---

## 4. Codebase Structure Review

### Top-Level Layout

```
mainecybertech-portal/
├── apps/                          # Application packages
│   ├── api/                       # Express API server (port 4000)
│   │   ├── src/
│   │   │   ├── config/env.ts      # Zod-validated environment schema
│   │   │   ├── lib/               # email, logger, notify, sentry
│   │   │   ├── middleware/        # auth, admin, error, rate-limit, request-id, security, security-headers, cache, not-found
│   │   │   ├── routes/            # 22 route files (auth, tickets, projects, etc.)
│   │   │   ├── services/          # audit logging, supabase admin client
│   │   │   ├── types/             # ApiResponse, AppError, success/failure helpers
│   │   │   ├── validators/        # 5 Zod schemas (document, membership, organization, project, ticket)
│   │   │   ├── app.ts             # Express app factory
│   │   │   ├── main.ts            # Entry point with graceful shutdown
│   │   │   └── __tests__/         # Jest tests
│   │   └── package.json
│   ├── web/                       # Next.js App Router frontend
│   │   ├── app/
│   │   │   ├── (public)/          # Marketing site + auth pages
│   │   │   ├── (portal)/portal/   # Client portal pages
│   │   │   ├── (admin)/admin/     # Admin pages (15 sections)
│   │   │   ├── auth/              # Auth callback handler
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── globals.css        # Global styles
│   │   │   ├── not-found.tsx      # 404 page
│   │   │   └── global-error.tsx   # Root error boundary
│   │   ├── components/
│   │   │   ├── admin/             # 20 admin components
│   │   │   ├── portal/            # 12 portal components
│   │   │   ├── marketing/         # 4 marketing components
│   │   │   └── (standalone)        # NotificationBell, NotificationsPageClient, HealthDashboardClient, DocumentPreview
│   │   ├── lib/                   # api.ts, client-api.ts, logger.ts, cn.ts, auth/, notifications-actions.ts, org-actions.ts
│   │   ├── e2e/                   # 24 Playwright spec files
│   │   ├── __tests__/             # Jest tests
│   │   └── middleware.ts           # Session JWT validation + redirect
│   └── worker/                    # Background job processor
│       ├── src/
│       │   ├── main.ts            # SQS consumer, task registry, health server
│       │   ├── email.ts            # Email sending
│       │   ├── tasks/             # 6 task handler files
│       │   └── __tests__/         # Jest tests
│       └── package.json
├── packages/                      # Shared packages
│   ├── sdk/                       # MCTClient SDK (17 API modules)
│   ├── config/                    # ESLint config + TypeScript base config
│   └── ui/                        # cn() utility (clsx + tailwind-merge)
├── infra/terraform/               # IaC (12 .tf files)
├── supabase/                      # DB migrations (9), seeds, config
├── .github/workflows/             # 18 CI/CD workflow files
├── docs/                          # 28 documentation files
├── scripts/                       # PowerShell/bash scripts
├── docker-compose.yml             # Local stack (api + web + worker + e2e)
├── turbo.json                     # Turborepo config
├── pnpm-workspace.yaml            # Monorepo config
└── vercel.json                    # Vercel project config
```

### Architecture Pattern Assessment

**Pattern:** Modular monolith with a service-oriented internal structure. The API is a single Express server with clear route modules, not microservices. The worker is a separate process but shares the same database and queue. This is appropriate for their scale.

**Strong organization choices:**

- Clear route → middleware → service layering
- Route files are single-responsibility per entity
- Zod validators separated from route logic
- Audit logging as a standalone service
- Env schema with Zod (fail-fast on misconfiguration)
- SDK package that mirrors API routes 1:1 — excellent DX pattern

**Weak organization choices:**

- `packages/ui` has only a `cn()` utility — should either be expanded or removed
- `packages/config` ESLint config is not actually wired into all apps (noted as future work in AGENTS.md)
- Root `package.json` has `pg` and `supabase-cli` in devDependencies (both noted as should be moved)
- `vercel.json` at root is unnecessary (Vercel project config is in `apps/web/vercel.json`)
- The `terraform.exe` binary checked into the repo at root is a concern (91MB binary)

---

## 5. Feature Inventory

### Fully Implemented Features

| Feature                              | Location                                | Notes                                                                         |
| ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| Email/password auth with Supabase    | `routes/auth.ts`                        | sign-in, sign-up, forgot/reset password                                       |
| PKCE auth callback                   | `routes/auth.ts:121-198`                | Code exchange + bootstrap_portal_access RPC                                   |
| JWT session validation in middleware | `middleware.ts`                         | Base64url decode, exp check                                                   |
| Organization CRUD                    | `routes/organizations.ts`               | With multer file upload for branding                                          |
| Membership management                | `routes/memberships.ts`                 | With role assignment                                                          |
| User management & profile            | `routes/users.ts`, `routes/profiles.ts` | With permission overrides                                                     |
| Ticket CRUD + comments               | `routes/tickets.ts`                     | Full lifecycle, 5-min comment editing                                         |
| Project management                   | `routes/projects.ts`                    | Task management                                                               |
| Document management                  | `routes/documents.ts`                   | Version history, upload                                                       |
| Dashboard (admin + portal)           | `routes/dashboard.ts`                   | Compound endpoints                                                            |
| Audit logging (27 endpoints)         | `services/audit.ts`                     | Retry with exponential backoff                                                |
| Notification system                  | `routes/notifications.ts`               | In-app + email, preferences, bell badge                                       |
| Billing (Stripe)                     | `routes/billing.ts`                     | Invoices, subscriptions, payments, sync                                       |
| Webhook management                   | `routes/webhook-management.ts`          | CRUD + delivery log + test                                                    |
| Role/permission management           | `routes/roles.ts`                       | Interactive toggle matrix in UI                                               |
| Global search (admin + portal)       | `routes/search.ts`, `search-portal.ts`  |                                                                               |
| Bulk user invite                     | `routes/bulk.ts`                        | CSV upload                                                                    |
| CSV/JSON export (tickets + projects) | `routes/tickets.ts:18-87`               | 10k row limit                                                                 |
| Worker tasks (5 handlers)            | `worker/src/tasks/`                     | stripe-reconcile, jira-sync, jsm-sync, m365-calendar, scheduled-notifications |
| Health check + shutdown drain        | `main.ts` (API + Worker)                | Graceful SIGTERM/SIGINT                                                       |
| Marketing site (Phase 1-4)           | `app/(public)/`                         | Homepage, 5 services, contact, GA, Tawk.to                                    |
| Rate limiting (IP + user)            | `middleware/rate-limit.ts`              | 300/IP, 200/user per 15min                                                    |
| Input sanitization                   | `middleware/security.ts`                | XSS/SQLi detection                                                            |
| Error tracking (Sentry)              | API + Web                               | DSN-configurable                                                              |
| Helm security headers                | `middleware/security-headers.ts`        |                                                                               |

### Partially Implemented Features

- **E2E path filters:** Only E2E workflow has path filters; path filters should be broader or standardized
- **Admin global search:** Present but could be more comprehensive (cross-entity results)
- **Billing UI:** Portal billing page exists but may need more detail (payment methods, invoices)
- **Worker task coverage:** 5 of ~8 potential task types implemented (email notifications done inline instead of via worker for ticket events)

### Missing / Implied But Not Implemented

- **Real-time WebSocket notifications** — currently uses 30s polling from NotificationBell, no SSE/WebSocket
- **SSO / OIDC login** — listed as medium priority in AGENTS.md, not implemented
- **Mobile app / PWA** — listed as low priority
- **Internationalization (i18n)** — listed as low priority
- **IP whitelisting / allowlisting for admin access** — no network-level restriction beyond Cloudflare
- **SLA tracking** — listed as medium priority
- **Rate limiting on the worker** — no rate limiting on outbound API calls (Jira, JSM, M365, Stripe)
- **OpenAPI spec** — listed as noted future consideration
- **API versioning strategy doc exists, but actual version header/negotiation is not implemented** — all routes are under `/api/v1/` hardcoded

### Dead Code / Stubs

- `packages/ui` — only contains `cn.ts` (clsx + tailwind-merge), could be inlined
- `bootstrap.ts` — was already removed (noted in pre-prod audit)
- `infra/terraform/old-archived.zip` — indicated as removed in AGENTS.md
- `archive/` directory — contains stale docs moved out of root

---

## 6. Engineering Quality Assessment

### Readability: 7/10

- Route files are well-structured with clear handler functions
- Middleware has clear single responsibilities
- Some route files are long (organizations.ts: 375 lines, tickets.ts: 419 lines) and would benefit from service layer extraction
- API types are clean and well-named (AppError, success, failure, ApiResponse)
- SDK is well-organized with 1:1 route mapping

### Maintainability: 7/10

- Monorepo with Turbo makes cross-package refactoring tractable
- Zod validators externalized from routes — good
- Audit logging centralized — good
- Some routes mix business logic with DB access and notification sending (tickets.ts post handler does ticket creation + audit logging + admin notification + assignment notification all in one function)
- The `security.ts` input sanitizer mutates `req.body` globally, affecting downstream middleware

### Modularity: 7/10

- Clear separation between API, Web, Worker, SDK packages
- Within API: routes, middleware, services, validators, types are well-separated
- Web: app directory groups routes by user-facing concern (public/portal/admin)
- Component library is flat (not nested by domain) — 20 admin components in a single directory

### Type Safety: 6/10

- Zod validation on env vars in all 3 apps — excellent
- Zod schemas on 7 mutation endpoints — good but only covers ~25% of endpoints
- SDK return types are `any` (noted in pre-prod audit as "noted" — acceptable for runtime but poor DX)
- 130+ `:any` annotations in web noted as "noted" (low priority)
- `noUncheckedIndexedAccess` is enabled in shared config — good
- Auth middleware declares `authUser` via global Express namespace augmentation — works but fragile
- The SDK `types.ts` exports are comprehensive but many use `any` for field values

### Validation: 8/10

- Env schema at startup for API — fail-fast on missing critical vars
- Zod on 7 mutation endpoints — good but should cover all
- Input sanitizer catches XSS/SQLi patterns — but has the critical bug of HTML-encoding legitimate data
- Rate limiting on all routes — good
- Missing: request body size validation beyond express.json(10mb), no file type validation on multer uploads

### Error Handling: 7/10

- AppError class with typed error codes — good
- Global error handler catches ZodError, AppError, and unexpected errors — good
- Sentry integration — good
- `failure()` helper ensures consistent error response shape — good
- Worker wraps task handlers in try/catch — good
- Missing: `process.on("unhandledRejection")` in API main.ts — silent swallow
- Missing: Worker operational error handling (SQS polling failures retry indefinitely on 5s loop)
- The audit logging retry loop suppresses errors silently after 3 retries — audit trail gaps are logged but not alerted

### Logging: 7/10

- pino with structured logging across all 3 apps — good
- Request logging with X-Request-ID correlation — good
- Audit events logged to DB — good
- logger.error for unexpected errors — good
- Inconsistent: Worker creates a second pino instance instead of reusing a shared module
- Missing: Some route files use `console.error` (noted as fixed in pre-prod audit for most locations)

### Performance: 6/10

- Compound endpoint pattern for dashboard (reducing N+1) — good
- Supabase admin client uses Node 20 undici with connection pooling — good
- Pagination with limit (default 25, max 100) — good
- CSV export with 10k row limit — good
- Concerns:
  - No Redis/memcached for caching (all queries hit Postgres)
  - No CDN for static assets beyond what Next.js provides
  - No database query analysis (no EXPLAIN monitoring)
  - API runs on 256 CPU / 512MB memory in production — potentially undersized
  - The `requireAdmin` middleware checks membership per-request (no caching of role assignments)
  - No database connection pooling configuration visible (default Supabase client settings)

### Scalability: 5/10

- ECS Fargate with autoscaling (1-3 tasks) — adequate for current scale
- SQS FIFO with DLQ — good async processing
- Concerns:
  - Single-region deployment (us-east-1 only)
  - Single-AZ Supabase (noted as single zone in supabase provider)
  - No read replicas for database
  - No database sharding strategy
  - Worker concurrency fixed at 10 — no adaptive scaling
  - All API traffic goes through a single ALB

### Testing: 8/10

- 714 tests across 4 packages — excellent coverage
- 24 E2E Playwright spec files across admin/auth/portal/marketing
- Jest with supertest for API integration tests
- SDK tests mock fetch — good isolation
- Worker tests cover env schema + task handlers
- Web tests use Testing Library + Jest
- E2E has global auth setup and page object fixtures
- Concerns:
  - No load/stress testing (placeholder README only)
  - No performance benchmark tests
  - Some tests likely tied to specific seed data (E2E hardcodes admin credentials)
  - No visual regression testing (snapshot/Percy/etc.)

### Developer Experience: 7/10

- Good setup scripts (PowerShell + bash)
- Clear README.dev.md with local stack instructions
- Husky pre-commit hooks with lint-staged
- Turbo cache for builds
- Concerns:
  - Setup requires Supabase local instance, multiple terminal windows
  - Windows-focused scripts (PowerShell) — Linux users need bash alternatives
  - Editor config is minimal
  - No devcontainer configuration
  - pnpm workspace yaml has suspicious `allowBuilds` entries (`/: true`, `@: true`, `c: true`, etc.) — this looks like a config mistake that allows all packages to run build scripts

---

## 7. Infrastructure / DevOps Assessment

### Hosting / Deployment Model: 8/10

- **Frontend:** Vercel (production) with optional Docker standalone — dual mode is pragmatic
- **API:** ECS Fargate with ALB — solid, serverless-friendly
- **Worker:** ECS Fargate (private subnets) — proper isolation
- **Database:** Supabase managed Postgres — reduces operational burden
- **Queue:** SQS FIFO with DLQ — proper async processing

### Terraform / IaC Quality: 8/10

- 12 well-organized `.tf` files with clear comments
- State management: S3 backend + DynamoDB locks with env separation (dev/prod)
- Providers: AWS, Vercel, Supabase, Cloudflare — comprehensive
- Secrets: SSM Parameter Store with SecureString for sensitive values
- Networking: VPC with public/private subnets, NAT gateway, ALB
- Autoscaling: CPU-based target tracking (60% threshold)
- Monitoring: 7 CloudWatch alarms → SNS → Email + Slack (Lambda)
- ECR: Immutable tags, scan on push, encryption, lifecycle policies
- Concerns:
  - Task definitions hardcode `:latest` image tag — will drift from CI-deployed images
  - API task definition references `aws_ecs_task_definition.api_runtime.arn` but doesn't use `${{ github.sha }}` pattern
  - No WAF attached to ALB
  - No VPC Flow Logs enabled
  - No EFS or persistent volume for any service
  - ALB doesn't have access logging enabled
  - No DDoS protection plan
  - `aws_sqs_queue` FIFO queues limit throughput to 3000 TPS (acceptable for scale)
  - CloudWatch log retention at 30 days — could be longer for compliance

### CI/CD Pipeline Maturity: 8/10

- 18 workflow files — very comprehensive
- Gated production deploys: validate -> e2e -> migrations -> prod-approval -> deploy
- OIDC-based AWS access (no long-lived keys)
- Path filters on E2E and some deploy workflows
- Reusable `validate.yml` called from production workflows
- ECS `services-stable` wait with 10min timeout
- Concerns:
  - `validate.yml` runs test + lint + typecheck in parallel but each installs dependencies separately — 3x dependency install per run
  - No `pnpm/action-setup` usage (by design, documented in AGENTS.md) — but this means every workflow has boilerplate `corepack enable` setup
  - Supabase migrations workflow uses `npm install -g supabase` instead of using pnpm-managed version
  - No artifact caching between workflow steps
  - No integration test that runs against actual database
  - Terraform plan workflows don't post results as PR comments

### Environment Separation: 9/10

- Dev/prod clearly separated in Terraform (vars, state files, SSM paths)
- Vercel dev/prod projects are separate
- Supabase project naming includes environment
- DNS: `.com` for prod, `.us` for testing
- Cloudflare zone separation for each domain

### Secrets Management: 8/10

- SSM Parameter Store with SecureString — good
- Per-environment SSM path prefix (`/mainecybertech/dev/` vs `/mainecybertech/prod/`)
- Optional secrets are conditionally created (count pattern)
- GitHub secrets documented in matrix doc
- Concerns:
  - Terraform stores secret values in plaintext in `.tfvars` files (noted as `sensitive = true` but tfvars are in repo)
  - No Secrets Manager rotation schedule implemented in code (though `docs/SECRETS_ROTATION.md` exists)
  - `DATABASE_URL` is constructed in Terraform with plaintext password from `var.db_password`

### Monitoring / Alerting: 7/10

- 7 CloudWatch metric alarms — good coverage of CPU, memory, ALB 5xx, SQS age
- SNS topic with email subscription + Slack webhook via Lambda
- Sentry for error tracking (API + Web)
- Concerns:
  - No custom dashboards (CloudWatch Dashboard)
  - No synthetic canary/health checks (Route 53 health checks)
  - No database monitoring (connection count, query performance, slow queries)
  - No alarm for DLQ messages appearing
  - No log-based metrics/alarms (e.g., error rate from pino logs)
  - No PagerDuty/Opsgenie integration
  - Worker has no health check on the queue processing path (health endpoint only checks process liveness)

### Backup / Disaster Recovery: 6/10

- Database backup workflow exists (`db-backup.yml`) — cron-driven
- Terraform state in S3 with versioning
- Concerns:
  - No RDS snapshot strategy (Supabase handles this, but no visibility)
  - No cross-region DR
  - No documented RTO/RPO targets
  - Rollback procedures documented but untested
  - No infrastructure backup testing/recovery drill documented

### Worker Reliability: 7/10

- SQS visibility timeout at 60s — the comment in code warns about matching to task runtime
- DLQ with alarm — messages that exhaust retries trigger alert
- Graceful shutdown with in-flight task drain
- Concerns:
  - Worker has no health check on SQS connectivity
  - Task timeout (WORKER_TIMEOUT) doesn't cancel the actual task — it's configured but not wired to an AbortController
  - DLQ alarm triggers at 1 message — could cause noise from transient failures

---

## 8. Security Assessment

### Authentication: 7/10

- **Observed:** JWT-based auth via Supabase Auth (GoTrue), Bearer token or mct_session cookie
- **Observed:** PKCE flow for OAuth callback
- **Observed:** `middleware.ts` validates JWT expiration via base64url decoding
- **Concerns:**
  - The API's `requireAuth` middleware uses `supabase.auth.getUser(token)` on every request — no local JWT verification. This adds latency (~50-200ms per request) and creates dependency on Supabase availability for every request.
  - JWT_SECRET is optional in env schema — if not set, Supabase still validates tokens against its own JWKS, but self-verification would be better
  - No token refresh logic in middleware (relies on Supabase's auto-refresh which is disabled on admin client)
  - **Cookie flags:** `mct_session` cookie lacks explicit `HttpOnly`, `Secure`, `SameSite` flags in the codebase (fixed in audit but need to verify implementation)

### Authorization: 5/10 ← **Critical gap**

- **Observed:** `requireAdmin` middleware checks for admin/super_admin role membership
- **Observed:** No organization-scoped authorization on entity routes
- **Critical gap:** Any authenticated user can access any ticket, document, project, or organization by ID. For example:
  - `GET /api/v1/tickets/:id` (tickets.ts:130-145) — no check that user is member of the ticket's organization
  - `GET /api/v1/documents/:id` — same pattern
  - `GET /api/v1/projects/:id` — same pattern
  - Organization list endpoint (`GET /api/v1/organizations`) returns all orgs — no user-scoping
- **Observed:** RLS policies exist in Supabase migrations but the API uses `getSupabaseAdmin()` (service role) which bypasses RLS entirely — the API is responsible for authorization, not RLS
- **Inferred:** The `router.use(requireAuth)` at the route level applies to all routes in a file, but there's no middleware that checks "is this user a member of the organization this entity belongs to?"

### RBAC / Permissions: 7/10

- 5 roles with 26 permissions — comprehensive
- Permission overrides per user — flexible
- Admin permission toggle UI exists — good
- Concerns: Permission checks in route handlers are inconsistent (some check, some don't)

### Tenant Isolation: 4/10 ← **High risk**

- Multi-tenant by organization, but no hard isolation at the API layer
- An authenticated user from Org A can read/write records for Org B by guessing/iterating UUIDs
- The only thing preventing cross-tenant access is obfuscation (UUIDs) and good faith
- Portal UI likely scopes by user's organization, but the API has no server-side tenant enforcement

### Input Validation: 6/10

- **Critical bug in `security.ts`:** The `sanitizeObject` function replaces `>`, `<`, `"`, `'` with Unicode escapes on _all_ string fields, including passwords, JSON fields, and text content. This:
  1. Corrupts passwords that contain these characters (unlikely but possible)
  2. Mangles JSON content in fields
  3. Encodes content that will later be double-encoded on output
  4. The check runs BEFORE Zod validation — so Zod will see escaped strings
- The XSS/SQLi pattern detection uses regex on string values — false positive risk is real (an email like "select@company.com" would trigger the SQLi pattern)
- No file upload type validation beyond multer's 5MB limit
- No request schema validation for most endpoints (only 7 have Zod schemas)

### Secrets Exposure: 7/10

- No hardcoded credentials observed in source
- All secrets via env vars or SSM Parameter Store
- `.env.example` files properly exclude real values
- Concerns: Terraform `terraform.exe` binary checked into repo is unusual but likely a convenience for Windows devs

### Session Handling: 6/10

- Sessions backed by Supabase Auth tokens
- Cookie-based auth for SSR, Bearer token for API
- Concerns:
  - No explicit session invalidation on logout (user's token is revoked via Supabase admin API, but old cookies may persist)
  - No refresh token handling in the middleware
  - No concurrent session limiting

### API Security: 7/10

- Helmet middleware — good
- CORS configured (though defaults to `*` in development)
- Rate limiting at global + user level
- Request ID for correlation
- Security headers middleware
- Concerns: No API key authentication for service-to-service calls (all calls use user tokens)

### Audit Logging: 9/10

- All 27 mutation endpoints log audit events — excellent
- Structured event data with actor, action, entity type/ID, metadata
- Retry with exponential backoff — good reliability
- Admin audit viewer with search/filter/pagination
- Missing: No audit log for failed authentication attempts (only successful sign-ins are logged)

---

## 9. UI / UX Assessment

_(Based on component structure and route layout — UI files were sampled, not exhaustively reviewed)_

### Information Architecture: 7/10

- Clear 3-zone layout: public (marketing), portal (client), admin (MSP staff)
- Portal: dashboard, documents, support (tickets), projects, timeline, billing, notifications, profile
- Admin: dashboard, organizations, users, tickets, projects, documents, audit, roles, webhooks, health, bulk-invite, notifications, approvals
- Navigation may be complex — admin has 15 sections, portal has 8

### Navigation Clarity: 6/10

- Breadcrumbs components exist for both portal and admin — good
- Admin subnav exists — noted as having "missing entries" in pre-prod audit
- Portal subnav exists
- Portal header has org switcher + global search + notification bell — good
- Concerns: No clear visual hierarchy between primary/secondary navigation items

### Layout Quality: 7/10

- Root layout uses Inter + Orbitron fonts — good modern look
- Cyber-themed background (radial gradient) — appropriate for cybersecurity MSP
- Loading skeletons for route groups — good UX
- Error boundaries for each route group — good
- 404 page exists at root
- Global error boundary exists

### Accessibility: 4/10 ← **Likely gap**

- No evidence of ARIA labels, focus management, keyboard navigation, or screen reader support in the component list
- The custom select dropdowns (inline status/priority) may not be accessible
- No dark mode support mentioned
- No skip-to-content links
- Font choices (Inter + Orbitron) are generally accessible

### Mobile Responsiveness: 5/10

- Tailwind CSS used — responsive classes likely present
- Marketing header has hamburger menu — good
- Portal/admin layouts unknown without examining actual component CSS
- Pre-prod audit noted mobile responsiveness optimization as done

### Consistency: 6/10

- Admin uses `AdminPageShell` and `AdminSubnav` — consistent layout
- Portal uses `PortalBreadcrumbs` and `PortalSubnav` — consistent
- Form patterns appear consistent (lucide-react icons, tailwind classes)
- Concerns: `AdminPageShell` usage noted as inconsistent across admin pages

### Error States: 5/10

- Error boundaries exist — good
- Missing: Retry buttons on error states (noted as future medium-value feature)
- Missing: Toast/notification system for transient errors
- Missing: Graceful UI when API is unreachable

### Empty States: 3/10 ← **Likely gap**

- No evidence of empty state components (e.g., "No tickets yet. Create your first ticket.")
- Users may see blank tables or list containers when no data exists

### Loading States: 6/10

- Route-level `loading.tsx` for admin and portal — good
- Loading skeletons exist — good
- Concerns: No granular loading states for individual data fetches within pages

### Dashboard Usefulness: 7/10

- Admin dashboard: "Recent Audit Activity" panel, quick stats
- Portal dashboard: quick actions (Create Ticket, Upload Document), View in Admin links
- Concerns: No personalized welcome, no upcoming deadlines, no notification summary on dashboard

---

## 10. Documentation Assessment

### Documentation Volume: 28 files — exceptional

Every major area has dedicated documentation. This is the best-documented codebase of its size I've reviewed.

### README Quality: 7/10

- `README.md` exists (14.7KB) — covers project overview
- `README.dev.md` exists (15.4KB) — detailed dev setup
- `AGENTS.md` (96KB) — acts as a comprehensive project handbook covering architecture, testing patterns, CI/CD, infrastructure, audit history, and roadmap

### Documentation Coverage:

| Document                                  | Quality | Notes                                  |
| ----------------------------------------- | ------- | -------------------------------------- |
| `ARCHITECTURAL_ANALYSIS.md`               | 9/10    | 27KB, thorough                         |
| `ARCHITECTURAL_AUDIT_COMPLETE.md`         | 8/10    | 68KB, very detailed                    |
| `FULL_SYSTEM_AUDIT_2026-06-09.md`         | 9/10    | 107KB, exhaustive                      |
| `GAP_ANALYSIS.md`                         | 7/10    | Needs update to reflect resolved items |
| `ENVIRONMENT_VARIABLES.md`                | 8/10    | Complete reference                     |
| `BILLING.md`                              | 7/10    | Has stale note about STRIPE_SECRET_KEY |
| `ROLLBACK_PROCEDURES.md`                  | 8/10    | Detailed rollback instructions         |
| `SECRETS_ROTATION.md`                     | 8/10    | Rotation schedule + procedures         |
| `MONITORING_AND_ALERTING.md`              | 8/10    | Monitoring strategy                    |
| `GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`  | 9/10    | Essential ops doc                      |
| `FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | 8/10    | Operator manual                        |
| `CONTRIBUTING.md`                         | 7/10    | Basic                                  |
| `SECURITY.md`                             | 6/10    | Basic security policy                  |
| `SUPABASE_MIGRATION_CHEATSHEET.md`        | 7/10    | Quick reference                        |

### Documentation Gaps:

- No ADR (Architecture Decision Record) format — acknowledged as future consideration
- No OpenAPI/Swagger specification — acknowledged
- No on-call runbook (what to do when paged)
- No incident response procedure document
- No disaster recovery test plan
- No load-testing results or capacity plan
- No database ERD diagram (text-based schema exists in migrations but no visual)
- No system architecture diagram (text descriptions only)

---

## 11. Technical Debt and Risk Register

| #   | Risk                                        | Severity     | Impact Area    | Description                                                                                                                |
| --- | ------------------------------------------- | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Input sanitizer corrupts data               | **Critical** | Data Integrity | `security.ts` HTML-encodes all string fields, corrupting passwords, JSON, and text content before Zod validation           |
| 2   | No tenant isolation at API layer            | **Critical** | Security       | Any authenticated user can access any org's data by entity ID — no membership check on entity routes                       |
| 3   | Terraform image tag mismatch                | **High**     | Deployment     | Task definitions reference `:latest` but CI deploys SHA-tagged images — drift between Terraform and actual deployed images |
| 4   | Worker lacks Sentry/error reporting         | **High**     | Observability  | Worker errors only appear in CloudWatch logs; no Sentry integration, no alert on task failure                              |
| 5   | Unhandled promise rejections                | **High**     | Reliability    | API `main.ts` lacks `process.on("unhandledRejection")` — errors silently swallowed                                         |
| 6   | Cookie security flags                       | **High**     | Security       | `mct_session` cookie may lack explicit HttpOnly/Secure/SameSite flags depending on implementation                          |
| 7   | Supabase admin client bypasses RLS          | **High**     | Security       | All API DB access uses service_role key which bypasses Row Level Security — API is sole authz layer but has gaps           |
| 8   | No database connection pooling config       | **Medium**   | Performance    | Supabase client uses default settings — no pool configuration for production traffic                                       |
| 9   | Worker timeout not wired to AbortController | **Medium**   | Reliability    | `WORKER_TIMEOUT` env var exists but don't abort long-running tasks                                                         |
| 10  | JWT not locally verified                    | **Medium**   | Performance    | Every API call hits Supabase `auth.getUser()` — no local JWT verification                                                  |
| 11  | No error state retry buttons                | **Medium**   | UX             | Users see error states with no way to retry                                                                                |
| 12  | No empty state components                   | **Medium**   | UX             | Tables/lists appear blank when no data exists                                                                              |
| 13  | Single-region deployment                    | **Medium**   | Resilience     | All infrastructure in us-east-1 — no DR capability                                                                         |
| 14  | No caching layer                            | **Medium**   | Performance    | Every query hits Postgres directly — no Redis/Memcached                                                                    |
| 15  | Audit log failures silently suppressed      | **Medium**   | Compliance     | After 3 retries, audit log failures are logged but not alerted — audit trail gaps may go unnoticed                         |
| 16  | pnpm workspace allowBuilds too permissive   | **Low**      | Security       | `allowBuilds` config in `pnpm-workspace.yaml` appears to allow all packages to run arbitrary build scripts                 |
| 17  | terraform.exe binary checked in             | **Low**      | Repo Hygiene   | 91MB binary at repo root — should be in .gitignore                                                                         |
| 18  | Root vercel.json is redundant               | **Low**      | Cleanup        | Vercel project config is in `apps/web/vercel.json` — root one is unused                                                    |
| 19  | GAP_ANALYSIS.md has stale content           | **Low**      | Docs           | References resolved items as open, test counts outdated                                                                    |
| 20  | No OpenAPI spec                             | **Low**      | Docs           | API has no machine-readable specification                                                                                  |

---

## 12. Detailed Recommendations

### A. Code Recommendations

#### R1. Fix input sanitizer (Critical)

- **Issue:** `apps/api/src/middleware/security.ts:33-63` — `sanitizeObject()` HTML-encodes ALL string body fields, including passwords, rich text, and JSON content
- **Recommendation:** Remove the HTML-encoding mutation. Either:
  - (Preferred) Remove encoding entirely — Zod validation + parameterized queries + RLS provide adequate protection against injection. The pattern detection (XSS/SQLi regex) is sufficient for early rejection.
  - (Conservative) Only apply encoding to fields explicitly marked as HTML-safe (e.g., a `sanitizeForHtml` field flag)
- **Why:** Current behavior corrupts legitimate data. If a user has a `'` in their name, or a password contains `>`, the sanitizer corrupts it before it reaches the database. This is data corruption, not security.
- **Risk if unchanged:** Data integrity loss, user frustration, potential support incidents
- **Priority:** Critical
- **Effort:** Small (remove 20 lines, keep pattern detection)
- **Impacted:** `apps/api/src/middleware/security.ts`

#### R2. Add tenant-scoped authorization middleware (Critical)

- **Issue:** Entity routes (tickets, documents, projects) don't verify the requesting user has membership in the record's organization
- **Recommendation:** Create a `requireOrgAccess(orgIdParam)` middleware factory that:
  1. Extracts org ID from route params, query, or body
  2. Queries `memberships` for `user_id = authUser.userId AND organization_id = orgId AND status = 'approved'`
  3. Rejects with 403 if no membership
- **Why:** Without this, any authenticated user can enumerate any organization's records. This is a critical multi-tenant isolation failure.
- **Risk if unchanged:** Data breach between tenants, compliance violation
- **Priority:** Critical
- **Effort:** Medium (create middleware + apply to 8 route files)
- **Impacted:** `apps/api/src/middleware/` (new file), `routes/tickets.ts`, `routes/documents.ts`, `routes/projects.ts`, `routes/organizations.ts`, `routes/memberships.ts`

#### R3. Add `unhandledRejection` handler in API (High)

- **Issue:** `apps/api/src/main.ts` lacks `process.on("unhandledRejection")`
- **Recommendation:** Add handler that logs via pino and Sentry before exiting
- **Why:** Unhandled promise rejections in Node.js 16+ will terminate the process, but the handler ensures visibility into what caused it
- **Priority:** High
- **Effort:** Small (5 lines)
- **Impacted:** `apps/api/src/main.ts`

#### R4. Add Zod validation to all mutation endpoints (Medium)

- **Issue:** Only 7 of ~27 mutation endpoints have Zod validation
- **Recommendation:** Add Zod schemas for all POST/PUT/PATCH routes
- **Why:** Consistent validation prevents malformed data from reaching the database
- **Priority:** Medium
- **Effort:** Medium (1-2 days)
- **Impacted:** All route files + validators/

#### R5. Extract service layer from route handlers (Medium)

- **Issue:** Route handlers in `tickets.ts:282-361` mix business logic (notification dispatch, audit logging) with DB access
- **Recommendation:** Create `services/ticket-service.ts` with methods like `createTicket()`, `addComment()`, etc.
- **Why:** Testability — route handlers are hard to unit test without supertest. Business logic should be extractable.
- **Priority:** Medium
- **Effort:** Large (refactor across all routes)
- **Impacted:** All route files, new `services/` files

### B. Architecture Recommendations

#### R6. Add local JWT verification for auth middleware (High)

- **Issue:** `apps/api/src/middleware/auth.ts:41-43` calls `supabase.auth.getUser(token)` on every request
- **Recommendation:** Add local JWT verification using `jsonwebtoken` library and the `JWT_SECRET` env var. Fall back to Supabase call on failure.
- **Why:** Reduces latency by ~50-200ms per request and removes dependency on Supabase availability for auth
- **Priority:** High
- **Effort:** Small (add JWT verification library + ~30 lines)
- **Impacted:** `apps/api/src/middleware/auth.ts`, `apps/api/package.json`

#### R7. Add Redis cache layer (Medium)

- **Issue:** No caching anywhere — every API call queries Postgres
- **Recommendation:** Add `ioredis` and cache:
  - Role/permission data (infrequently changed)
  - Organization metadata
  - User profile data
- **Why:** Reduces database load, improves response times
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** New `services/cache.ts`, updates to route handlers

#### R8. Add SSE or WebSocket for real-time notifications (Medium)

- **Issue:** Notification bell uses 30s polling — wasteful and laggy
- **Recommendation:** Replace polling with Server-Sent Events (SSE) from the API, or use Supabase Realtime subscriptions
- **Why:** Better UX, reduced bandwidth, immediate notification delivery
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** `apps/web/components/NotificationBell.tsx`, new API route for SSE

### C. Infrastructure Recommendations

#### R9. Fix Terraform image tag drift (Critical)

- **Issue:** `infra/terraform/runtime.tf:284,318` hardcodes `:latest` image tag
- **Recommendation:**
  - Option A: Use `data.aws_ecs_image` to resolve the latest SHA, or
  - Option B: Make the image tag a Terraform variable, default to `latest` but override in CI
  - Option C: Remove image tag from Terraform entirely and use CI-only task definition registration
- **Why:** In production, `:latest` is ambiguous — CI deploys SHA-tagged images, but Terraform doesn't know about them. Manual `terraform apply` could register a task definition pointing to a stale image.
- **Priority:** Critical
- **Effort:** Small
- **Impacted:** `infra/terraform/runtime.tf`

#### R10. Add Sentry to Worker (High)

- **Issue:** Worker has no Sentry integration (`apps/worker/src/main.ts`)
- **Recommendation:** Install `@sentry/node`, initialize in `main.ts`, capture task failures
- **Why:** Worker errors are invisible without CloudWatch log inspection. Sentry provides alerting and grouping.
- **Priority:** High
- **Effort:** Small
- **Impacted:** `apps/worker/package.json`, `apps/worker/src/main.ts`

#### R11. Add VPC Flow Logs (Medium)

- **Issue:** No VPC Flow Logs configured in `infra/terraform/network.tf`
- **Recommendation:** Enable VPC Flow Logs to CloudWatch Logs
- **Why:** Network visibility for security investigations, troubleshooting connectivity issues
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `infra/terraform/network.tf`

#### R12. Add ALB access logs (Medium)

- **Issue:** `infra/terraform/runtime.tf` ALB configuration doesn't enable access logs
- **Recommendation:** Add `access_logs` block to `aws_lb.api` resource, writing to S3
- **Why:** Required for security audit trail, troubleshooting, and traffic analysis
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `infra/terraform/runtime.tf`

#### R13. Add WAF to ALB (Medium)

- **Issue:** No WAF attached to the ALB
- **Recommendation:** Add `aws_wafv2_web_acl` with AWS managed rule groups (SQL injection, XSS, rate-based rules) and associate with the ALB
- **Why:** Defense-in-depth against web application attacks beyond what Cloudflare provides
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** New `infra/terraform/waf.tf`

### D. Security Recommendations

#### R14. Add explicit cookie security flags (High)

- **Issue:** Cookie handling in `apps/web` needs verification of HttpOnly/Secure/SameSite flags
- **Recommendation:** Audit all cookie set operations and ensure:
  - `HttpOnly: true` — prevents JS access
  - `Secure: true` — HTTPS only
  - `SameSite: "Lax"` or `"Strict"` — CSRF protection
- **Why:** Without these flags, the session cookie is vulnerable to XSS theft and CSRF attacks
- **Priority:** High
- **Effort:** Small
- **Impacted:** Cookie-setting locations in web app

#### R15. Add authentication failure audit logging (Medium)

- **Issue:** Audit logging only captures successful auth events (sign-in, sign-up, sign-out)
- **Recommendation:** Log failed authentication attempts with IP, email used, timestamp
- **Why:** Brute force detection, security incident investigation
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `apps/api/src/routes/auth.ts`

#### R16. Add file upload type validation (Medium)

- **Issue:** `multer` in `apps/api/src/routes/organizations.ts` only limits file size, not type
- **Recommendation:** Add file type checking (MIME type + magic bytes) for uploads
- **Why:** Prevents arbitrary file upload attacks
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** Upload routes (organizations, documents)

### E. UI/UX Recommendations

#### R17. Add empty state components (Medium)

- **Issue:** No empty states for lists/tables
- **Recommendation:** Create reusable `EmptyState` component with:
  - Illustration or icon
  - Title ("No tickets yet")
  - Description ("Create your first ticket to get started")
  - Optional CTA button
- **Why:** Empty states guide users toward next actions instead of showing blank pages
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** New `components/EmptyState.tsx`, all list pages

#### R18. Add error retry buttons (Medium)

- **Issue:** Error boundaries don't offer retry
- **Recommendation:** Add "Try again" button to error.tsx components that calls `reset()`
- **Why:** Users can recover from transient errors without navigation
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `apps/web/app/*/error.tsx`

#### R19. Add toast/notification system for transient states (Medium)

- **Issue:** No UI notification for success/error of actions (e.g., "Ticket created")
- **Recommendation:** Add a toast notification component using `lucide-react` icons and a temporary overlay
- **Why:** Users need feedback after performing actions
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** New `components/Toast.tsx`, layout updates

#### R20. Add loading states for inline data fetches (Low)

- **Issue:** No granular loading states within pages
- **Recommendation:** Add `Suspense` boundaries with `fallback` for async components
- **Why:** Improves perceived performance
- **Priority:** Low
- **Effort:** Small
- **Impacted:** All pages with async data fetching

### F. Documentation Recommendations

#### R21. Add architecture diagrams (Medium)

- **Issue:** No visual diagrams — only text descriptions
- **Recommendation:** Create system architecture diagram, data flow diagram, deployment diagram (Mermaid or Draw.io)
- **Why:** Visual diagrams communicate architecture faster than text
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** New `docs/diagrams/` directory

#### R22. Add OpenAPI specification (Medium)

- **Issue:** No machine-readable API spec
- **Recommendation:** Generate OpenAPI 3.0 spec from Zod schemas (using `zod-to-openapi`)
- **Why:** Enables API client generation, API documentation tools, and automated testing
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** New `docs/openapi.yaml` or auto-generation in build

#### R23. Update GAP_ANALYSIS.md (Low)

- **Issue:** Stale content — resolved items marked as open, outdated test counts
- **Recommendation:** Review and update to reflect current state
- **Why:** Documentation drift creates confusion
- **Priority:** Low
- **Effort:** Small
- **Impacted:** `docs/GAP_ANALYSIS.md`

### G. Testing Recommendations

#### R24. Add tenant isolation tests (Critical)

- **Issue:** No tests verify that User A cannot access Org B's data
- **Recommendation:** Add integration tests (API) and E2E tests (web) for cross-tenant access prevention
- **Why:** Without tests, tenant isolation is unverified
- **Priority:** Critical
- **Effort:** Medium
- **Impacted:** `apps/api/src/__tests__/`, `apps/web/e2e/`

#### R25. Add load/performance tests (Medium)

- **Issue:** No load testing scripts demonstrate capacity
- **Recommendation:** Implement k6 or artillery scripts for:
  - Ticket creation under load
  - Concurrent user sessions
  - Search endpoint performance
- **Why:** Validate autoscaling configuration, identify bottlenecks before production
- **Priority:** Medium
- **Effort:** Medium
- **Impacted:** `scripts/load-testing/`

#### R26. Add visual regression tests (Low)

- **Issue:** No visual testing
- **Recommendation:** Integrate Playwright's visual comparison feature or Percy
- **Why:** Catch unintended UI changes
- **Priority:** Low
- **Effort:** Medium
- **Impacted:** E2E test files

### H. DevOps / Observability Recommendations

#### R27. Add structured logging for failed audit events (Medium)

- **Issue:** `services/audit.ts:44-48` logs audit failures after retries but doesn't alert
- **Recommendation:** Add a metric or CloudWatch alarm on audit log failure rate
- **Why:** Audit gaps should be immediately visible
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `apps/api/src/services/audit.ts`, new CloudWatch alarm

#### R28. Add CloudWatch dashboard (Medium)

- **Issue:** No custom CloudWatch dashboard
- **Recommendation:** Create dashboard with:
  - API/Worker CPU and memory
  - ALB 5xx rate, latency
  - SQS queue depth
  - Error rate from logs
- **Why:** Single-pane-of-glass monitoring
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** New Terraform resource, AWS Console

#### R29. Add CI dependency caching (Medium)

- **Issue:** `validate.yml` installs dependencies 3 times (test, lint, typecheck jobs)
- **Recommendation:** Use `actions/cache` for `node_modules` and `.turbo` cache between jobs
- **Why:** Reduces CI run time by 40-60%
- **Priority:** Medium
- **Effort:** Small
- **Impacted:** `.github/workflows/validate.yml`

#### R30. Add database connection pooler (Medium)

- **Issue:** No connection pooling configuration
- **Recommendation:** Use Supabase's built-in connection pooler (port 6543) or PgBouncer sidecar
- **Why:** Prevents connection exhaustion under load
- **Priority:** Medium
- **Effort:** Small (config change)
- **Impacted:** `apps/api/src/services/supabase.ts`, database URL

---

## 13. Prioritized Roadmap

### Immediate Fixes (0–7 Days)

| #   | Task                                                          | Effort |
| --- | ------------------------------------------------------------- | ------ |
| 1   | Fix `security.ts` input sanitizer — stop encoding all strings | Small  |
| 2   | Fix Terraform `:latest` image tag — use variable              | Small  |
| 3   | Add `unhandledRejection` handler to API                       | Small  |
| 4   | Add tenant isolation middleware on entity routes              | Medium |
| 5   | Add Sentry to Worker                                          | Small  |
| 6   | Add tenant isolation integration tests                        | Medium |

### Short-Term (1–4 Weeks)

| #   | Task                                               | Effort |
| --- | -------------------------------------------------- | ------ |
| 7   | Add local JWT verification in auth middleware      | Small  |
| 8   | Add cookie security flags audit + fix              | Small  |
| 9   | Add Zod validation to remaining mutation endpoints | Medium |
| 10  | Add empty state components                         | Small  |
| 11  | Add error retry buttons                            | Small  |
| 12  | Add VPC Flow Logs                                  | Small  |
| 13  | Add ALB access logging                             | Small  |
| 14  | Update `GAP_ANALYSIS.md`                           | Small  |
| 15  | Add auth failure audit logging                     | Small  |

### Medium-Term (1–3 Months)

| #   | Task                                      | Effort |
| --- | ----------------------------------------- | ------ |
| 16  | Add SSE/realtime notifications            | Medium |
| 17  | Add Redis caching layer                   | Medium |
| 18  | Add WAF to ALB                            | Medium |
| 19  | Add OpenAPI spec                          | Medium |
| 20  | Add architecture diagrams                 | Small  |
| 21  | Add load testing scripts                  | Medium |
| 22  | Add CloudWatch dashboard                  | Small  |
| 23  | Extract service layer from route handlers | Large  |
| 24  | Add CI dependency caching                 | Small  |
| 25  | Add toast notification system             | Medium |

### Longer-Term Strategic (3+ Months)

| #   | Task                                        | Effort     |
| --- | ------------------------------------------- | ---------- |
| 26  | Multi-region deployment for DR              | Large      |
| 27  | Database read replicas                      | Large      |
| 28  | SSO/OIDC login                              | Medium     |
| 29  | PWA / offline support                       | Large      |
| 30  | i18n support                                | Large      |
| 31  | Mobile app (React Native)                   | Very Large |
| 32  | Portfolio of auto-generated API client SDKs | Medium     |

---

## 14. Missing Artifacts / What I Would Want to Review Next

To perform an even more accurate audit, I would want to review:

1. **Actual rendered UI screenshots or a live demo URL** — to assess UX quality directly
2. **CloudWatch dashboard and alarm history** — to understand operational patterns
3. **Supabase project configuration** (auth settings, RLS policies from dashboard) — to understand auth provider config
4. **Seed data SQL files** (`supabase/seeds/`) — to understand test data
5. **Worker task handler source files** (`apps/worker/src/tasks/`) — to assess async job implementation quality
6. **The `apps/web/__tests__/` directory** — to understand frontend test patterns
7. **The `apps/api/src/__tests__/` directory** — to understand API test thoroughness
8. **`docs/INDEX.md`** — to cross-reference documentation completeness
9. **Sentry project dashboard** — to understand error patterns in dev/staging
10. **Playwright test report** — to understand E2E test coverage and failure patterns
11. **`infra/terraform/lambda/` directory** — to understand Slack alarm Lambda implementation
12. **`apps/web/app/auth/callback/`** — to understand the PKCE callback page implementation
13. **Supabase migration `5302026_*`** — the consolidated bootstrap migration (likely 3000+ lines) to understand full schema
14. **`.husky/pre-commit`** — to understand pre-commit hook configuration
15. **`infra/terraform/slack-alarms.tf`** — to understand Slack notification Lambda

---

## 15. Final Verdict

**Current Maturity Level:** Late-stage development / production-adjacent

**Readiness for Production:** ⚠️ **Conditionally ready** — after addressing the 6 immediate fixes (particularly the input sanitizer data corruption bug and tenant isolation gap), this codebase is production-capable.

**Readiness for Handoff to New Team:** ✅ **Well above average.** The documentation density, test coverage, IaC completeness, and CI/CD maturity make this one of the better-documented codebases I've reviewed. A new team could ramp up within 1-2 weeks.

**Biggest Blockers to Production:**

1. **Input sanitizer data corruption** (Critical) — this must be fixed before any production deployment
2. **Tenant isolation gap** (Critical) — legal/compliance risk for a multi-tenant MSP platform
3. **Terraform image tag drift** (Critical) — could cause deployment inconsistencies

**Biggest Opportunities:**

1. The codebase has clearly been through multiple rigorous audit cycles; the discipline is impressive
2. The documentation-driven approach (AGENTS.md as living handbook, 28 docs files) sets a high standard
3. Testing culture is strong (714 tests, 24 E2E specs, Playwright integration)
4. Infrastructure as Code is production-grade with proper state management, secret handling, and observability

**Summary:** This is a well-architected, thoroughly-documented, comprehensively-tested MSP portal platform that is near production-ready. The development team has demonstrated exceptional discipline in addressing audit findings (38+21+25 findings all resolved), maintaining documentation, and building out CI/CD maturity. The two critical issues (input sanitizer + tenant isolation) are real but easily fixable. Once addressed, this platform is ready for production deployment.

```
Maturity Assessment:
├── Architecture:        8/10  (modular monolith, clear layering)
├── Code Quality:        7/10  (strong patterns, some long handlers)
├── Security:            6/10  (good foundation, critical isolation gap)
├── Testing:             8/10  (comprehensive, missing load + visual)
├── Infrastructure:      8/10  (IaC mature, missing WAF + flow logs)
├── CI/CD:               8/10  (gated deploys, OIDC, comprehensive)
├── Documentation:       9/10  (exceptional breadth and depth)
├── DevOps/Operability:  7/10  (monitoring exists, no runbook)
├── UI/UX:               6/10  (functional, missing polish states)
└── Overall:            ~7.5/10 (near production, 6 immediate fixes)
```
