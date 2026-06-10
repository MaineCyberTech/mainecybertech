# Maine CyberTech Portal — Full-System Architecture Review & Repo Health Audit

**Date:** 2026-06-09  
**Reviewer:** Principal Software Architect / DevOps Lead  
**Method:** Manual inspection of all source files, Terraform configs, CI/CD workflows, documentation, test suites, and infrastructure definitions  
**Scope:** Full-system across 12 sections as specified

---

## 1. Executive Summary

### Repository Identity

The **Maine CyberTech Portal** is a Turborepo monorepo (pnpm workspace) implementing a secure MSP (Managed Service Provider) client portal. It is a **production-oriented hybrid platform repo** — not a simple monolith or a pure monorepo — that spans:

- **Express REST API** (JWT + Supabase Auth, 114 endpoints, Zod validation)
- **Next.js App Router frontend** (Vercel-hosted, standalone output, 3 route groups)
- **Background worker** (SQS consumer with 5 task handlers)
- **TypeScript SDK** (typed API client factory)
- **Terraform IaC** (AWS ECS + Vercel + Supabase + Cloudflare)
- **Supabase database** (migrations, RLS policies, seeds, functions)

### Assessment Summary

| Domain             | Score   | Key Strengths                                                                                                             | Key Risks                                                                                                                                                                |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Security**       | ⚠️ 8/10 | SSM secrets, JWT edge validation, RLS, Zod schemas, audit logging, non-root containers, helmet, input sanitizer           | Security sanitizer regex patterns are broad and may block legitimate input; manual cookie parsing in PKCE flow; no API key rotation automation in runtime                |
| **Resilience**     | ⚠️ 7/10 | Zod env validation on all 3 apps; retry & timeout in SDK; ECS deployment circuit breaker; health checks all around        | Worker has no graceful drain on SIGTERM (in-flight tasks interrupted); no global rate-limit bypasses for webhook callbacks; DB connection pool not configured explicitly |
| **Observability**  | ✅ 7/10 | pino structured logging, Sentry in API+Web, 7 CloudWatch alarms, X-Request-ID correlation, audit logging on all mutations | No custom business metrics, no log-level based alert routing, worker health is minimal                                                                                   |
| **Documentation**  | ✅ 8/10 | 33 docs, ARCHITECTURAL_ANALYSIS, GAP_ANALYSIS, ROLLBACK_PROCEDURES, MONITORING_AND_ALERTING, SECRETS_ROTATION             | Minor drift (test counts, resolved items still marked open in some places)                                                                                               |
| **Testing**        | ✅ 9/10 | 714+ tests across all packages, 24 E2E spec files, edge-case coverage, E2E for marketing + auth + portal + admin          | SDK tests use mocked fetch only; no load/stress tests; coverage thresholds at 50% (low)                                                                                  |
| **Infrastructure** | ✅ 8/10 | Full Terraform with proper state locking, env separation, autoscaling, ACM, CloudFront integration                        | Container image tagged `latest` (mutable semantics), hardcoded bucket name in backend.tf                                                                                 |
| **Cleanliness**    | ✅ 7/10 | Well-organized, clear naming, archived stale artifacts                                                                    | 130+ `any` types, SDK return types are `any`, some redundant config files, stale `.gitkeep` in migrations                                                                |

### Production Readiness Verdict

**Ready for dev deploy. Production-ready with caveats:** The core security posture is solid (SSM secrets, JWT validation, RLS, audit logging, input sanitization). The architecture is well-considered (auth callback proxy, no Supabase client in web, domain routing separation). The gaps are in operational hardening: graceful shutdown, explicit connection pooling, blob storage for logs, and custom metrics. No blocking security vulnerabilities were identified.

---

## 2. Analysis Method & Assumptions

### Method

- **Observed:** Direct file inspection (source code, config, docs, infrastructure)
- **Inferred:** Behavioral conclusions drawn from multiple observed artifacts
- **Assumed/Not Confirmed:** Statements about runtime behavior not verifiable from static files alone

### Assumptions

- **Assumed:** Supabase project `gigpuknitajakejmyxuk` exists and is properly configured with the migration schema
- **Assumed:** The `bootstrap_portal_access` RPC function exists (referenced in auth callback but not found in migration files)
- **Assumed:** ECR repositories are populated with the `:latest` tag before the first deployment
- **Assumed:** GitHub secrets `VERCEL_TOKEN`, `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and all 8 org-level variables are set correctly
- **Assumed:** Cloudflare DNS zones for both `.com` and `.us` domains exist
- **Assumed:** The `prod.tfvars` file has been populated with real values (only `.example` exists in the repo)

---

## 3. Repository Map & File Inventory

### Repository Shape

**Hybrid Platform Monorepo (Turborepo)**

- 3 deployable apps (API, Web, Worker)
- 3 shared libraries (SDK, UI utils, Config)
- 1 infrastructure directory (Terraform)
- 1 database directory (Supabase)
- 18 CI/CD workflow files
- 33 documentation files
- 10 shell/PowerShell scripts
- Root-only lockfile (pnpm-lock.yaml)

### Structured File Manifest

#### Root Config (9 files)

| File                  | Purpose                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| `package.json`        | Monorepo root: scripts, workspace deps, husky, lint-staged, turborepo                |
| `pnpm-lock.yaml`      | Single source of truth for all dependency resolution                                 |
| `pnpm-workspace.yaml` | Declares workspace (apps/_, packages/_)                                              |
| `turbo.json`          | Turborepo task graph with caching rules                                              |
| `vercel.json`         | Root Vercel config (framework: nextjs); app-level vercel.json overrides in apps/web/ |
| `.editorconfig`       | Cross-editor formatting settings                                                     |
| `.gitattributes`      | Git LFS/file-type hints                                                              |
| `.dockerignore`       | Node_modules/pnpm exclusions for Docker context                                      |
| `.gitignore`          | Standard ignores + .env + dist + .next                                               |

#### Application: API (`apps/api/`)

| File                                 | Purpose                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/main.ts`                        | **Entry point**: dotenv → getEnv() → createApp() → listen(port)                                                                                                                                              |
| `src/app.ts`                         | **App factory**: middleware stack (helmet→cors→json→cookieParser→security→rate-limit→requestId→routes→404→error)                                                                                             |
| `src/config/env.ts`                  | Zod schema (22 vars, 3 required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)                                                                                                                 |
| `src/types/index.ts`                 | AppError, ApiResponse<T>, success/failure helpers, PaginatedResult<T>                                                                                                                                        |
| `src/services/supabase.ts`           | Singleton Supabase admin client (service_role_key) with undici fetch + WebSocket                                                                                                                             |
| `src/services/audit.ts`              | `logAuditEvent()` — inserts to audit_logs table; silently swallows errors                                                                                                                                    |
| `src/middleware/auth.ts`             | `requireAuth` — Bearer token or mct_session cookie → supabase.auth.getUser()                                                                                                                                 |
| `src/middleware/admin.ts`            | `requireAdmin` — single-inner-join query for admin/super_admin role check                                                                                                                                    |
| `src/middleware/error.ts`            | Global error handler: AppError→structured JSON, ZodError→400, unknown→500 + Sentry                                                                                                                           |
| `src/middleware/security.ts`         | XSS + SQL injection pattern detection and HTML entity sanitization                                                                                                                                           |
| `src/middleware/security-headers.ts` | Additional security headers                                                                                                                                                                                  |
| `src/middleware/rate-limit.ts`       | Per-user rate limiting (300/15min global + per-user)                                                                                                                                                         |
| `src/middleware/request-id.ts`       | X-Request-ID generation + request duration logging                                                                                                                                                           |
| `src/middleware/cache.ts`            | Cache-control headers configuration                                                                                                                                                                          |
| `src/middleware/not-found.ts`        | 404 handler                                                                                                                                                                                                  |
| `src/routes/` (22 files)             | 114 endpoints covering auth, organizations, memberships, users, profiles, tickets, projects, documents, dashboard, audit, billing, webhooks, roles, search, notifications, preferences, bulk, health, public |
| `src/lib/email.ts`                   | Nodemailer-based SMTP email sender                                                                                                                                                                           |
| `src/lib/logger.ts`                  | pino logger with pino-pretty in development                                                                                                                                                                  |
| `src/lib/notify.ts`                  | In-app notification + `notifyAndEmail()` with module-aware deep links                                                                                                                                        |
| `src/lib/sentry.ts`                  | Sentry init (skipped when SENTRY_DSN absent)                                                                                                                                                                 |
| `src/validators/` (5 files)          | Zod schemas for documents, memberships, organizations, projects, tickets                                                                                                                                     |
| `src/__tests__/` (24 files)          | 178 tests: jest + supertest, covering all routes + middleware + edge cases                                                                                                                                   |
| `Dockerfile`                         | Multi-stage, node:20-alpine, non-root (appuser), HEALTHCHECK                                                                                                                                                 |
| `.env.example`                       | 23 documented env vars (includes worker-only vars — finding #3 from final review)                                                                                                                            |
| `package.json`                       | Build/test scripts, tsup for bundling                                                                                                                                                                        |

#### Application: Web (`apps/web/`)

| File                                                                     | Purpose                                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `app/layout.tsx`                                                         | Root shell: Inter + Orbitron fonts, dark bg with radial gradient, SVG favicon metadata                                        |
| `app/global-error.tsx`                                                   | Root error boundary                                                                                                           |
| `app/not-found.tsx`                                                      | Root 404 page                                                                                                                 |
| `app/(public)/layout.tsx`                                                | Public route group: MarketingHeader, Footer, GA + Tawk.to scripts                                                             |
| `app/(public)/page.tsx`                                                  | Marketing homepage: hero + 5 service cards                                                                                    |
| `app/(public)/services/[slug]/page.tsx`                                  | 5 dynamic service detail pages                                                                                                |
| `app/(public)/contact/page.tsx`                                          | Contact form + info                                                                                                           |
| `app/(public)/contact/actions.ts`                                        | Form submission server action                                                                                                 |
| `app/(public)/forgot-password/page.tsx`                                  | Password reset request form                                                                                                   |
| `app/(public)/password-reset/page.tsx`                                   | Password reset form                                                                                                           |
| `app/(public)/pending/page.tsx`                                          | Approval-pending page (uses logoutAction to break redirect loop)                                                              |
| `app/(portal)/layout.tsx`                                                | Portal layout: auth guard, membership check, PortalHeader, sidebar                                                            |
| `app/(portal)/dashboard/page.tsx`                                        | Portal dashboard                                                                                                              |
| `app/(portal)/support/tickets/[ticketId]/page.tsx`                       | Ticket detail                                                                                                                 |
| `app/(portal)/documents/[documentId]/page.tsx`                           | Document detail                                                                                                               |
| `app/(portal)/projects/[projectId]/page.tsx`                             | Project detail                                                                                                                |
| `app/(portal)/profile/page.tsx`                                          | Profile editing (server wrapper)                                                                                              |
| `app/(portal)/profile/ProfileClient.tsx`                                 | Profile form (client component)                                                                                               |
| `app/(portal)/notifications/page.tsx`                                    | Paginated notification history                                                                                                |
| `app/(portal)/notifications/preferences/page.tsx`                        | Notification toggle UI                                                                                                        |
| `app/(portal)/timeline/page.tsx`                                         | Org-wide task timeline + calendar                                                                                             |
| `app/(portal)/billing/page.tsx`                                          | Billing/invoice/subscription display                                                                                          |
| `app/(admin)/layout.tsx`                                                 | Admin layout: auth guard, AdminSidebar                                                                                        |
| `app/(admin)/admin/dashboard/page.tsx`                                   | Admin dashboard                                                                                                               |
| `app/(admin)/admin/tickets/[ticketId]/page.tsx`                          | Admin ticket detail                                                                                                           |
| `app/(admin)/admin/tickets/[ticketId]/actions.ts`                        | Ticket CRUD server actions                                                                                                    |
| `app/(admin)/admin/organizations/[orgId]/billing/page.tsx`               | Admin org billing server component                                                                                            |
| `app/(admin)/admin/organizations/[orgId]/billing/AdminBillingClient.tsx` | Admin org billing client                                                                                                      |
| `app/(admin)/admin/notifications/page.tsx`                               | Admin notification history                                                                                                    |
| `app/(admin)/admin/webhooks/page.tsx`                                    | Webhook endpoint list                                                                                                         |
| `app/(admin)/admin/webhooks/new/page.tsx`                                | Create webhook                                                                                                                |
| `app/(admin)/admin/webhooks/[webhookId]/page.tsx`                        | Webhook detail + delivery log                                                                                                 |
| `app/(admin)/admin/roles/page.tsx`                                       | Roles list                                                                                                                    |
| `app/(admin)/admin/roles/[roleId]/page.tsx`                              | Permission toggle matrix                                                                                                      |
| `app/(admin)/admin/bulk-invite/page.tsx`                                 | CSV bulk user import                                                                                                          |
| `app/(admin)/admin/health/page.tsx`                                      | Service health dashboard                                                                                                      |
| `app/(admin)/admin/projects/AdminProjectsClient.tsx`                     | Project list + modal create                                                                                                   |
| `app/(admin)/admin/loading.tsx`                                          | Admin loading skeleton                                                                                                        |
| `app/(portal)/portal/loading.tsx`                                        | Portal loading skeleton                                                                                                       |
| `app/error.tsx` (×3)                                                     | Route group error boundaries                                                                                                  |
| `middleware.ts`                                                          | Edge JWT exp check (base64url decode), route guard, redirect loop prevention                                                  |
| `lib/api.ts`                                                             | **Server-only** SDK client (imports "server-only")                                                                            |
| `lib/client-api.ts`                                                      | Browser-compatible SDK client with cookie-backed auth                                                                         |
| `lib/logger.ts`                                                          | pino server logger (added in 2026-06-10 audit)                                                                                |
| `lib/sentry.ts`                                                          | Browser Sentry init                                                                                                           |
| `lib/org-actions.ts`                                                     | Multi-org switching cookie actions                                                                                            |
| `next.config.mjs`                                                        | standalone output, outputFileTracingRoot, rewrites proxy, bundle analyzer                                                     |
| `Dockerfile`                                                             | Multi-stage, non-root, standalone, HEALTHCHECK                                                                                |
| `vercel.json`                                                            | installCommand: "pnpm install --frozen-lockfile", framework: "nextjs"                                                         |
| `jest.config.js`                                                         | ts-jest, Testing Library, coverage thresholds at 50%                                                                          |
| `e2e/` (24 spec files)                                                   | Playwright tests across admin, auth, portal, marketing                                                                        |
| `components/` (43 files)                                                 | admin/, portal/, marketing/ components including DocumentPreview, FileDropzone, NotificationBell, HealthDashboardClient, etc. |

#### Application: Worker (`apps/worker/`)

| File                                   | Purpose                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `src/main.ts`                          | **Entry point**: Zod env → task registry → SQS poller loop → health server |
| `src/tasks/index.ts`                   | Registers all 5 task handlers                                              |
| `src/tasks/stripe-reconcile.ts`        | Stripe invoice/subscription sync                                           |
| `src/tasks/jira-sync.ts`               | Jira issue sync                                                            |
| `src/tasks/jsm-sync.ts`                | JSM ticket sync                                                            |
| `src/tasks/m365-calendar-sync.ts`      | M365 calendar sync                                                         |
| `src/tasks/scheduled-notifications.ts` | Scheduled notification dispatch                                            |
| `src/email.ts`                         | SMTP email sending                                                         |
| `Dockerfile`                           | Multi-stage, node:20-alpine, non-root, HEALTHCHECK on port 3001            |

#### Shared Package: SDK (`packages/sdk/`)

| File                        | Purpose                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/index.ts`              | `MCTClient` factory with 16 domain APIs                                                        |
| `src/client.ts`             | `ApiClient` with retry (exponential backoff, 429/502/503/504), timeout (30s), FormData support |
| `src/auth.ts`               | SignIn, SignUp, callback, forgotPassword, resetPassword                                        |
| `src/organizations.ts`      | CRUD for organizations                                                                         |
| `src/memberships.ts`        | Membership management + invitations                                                            |
| `src/tickets.ts`            | Ticket CRUD + comments + exports                                                               |
| `src/projects.ts`           | Project CRUD + tasks + exports                                                                 |
| `src/documents.ts`          | Document CRUD + upload + versions + signed URLs                                                |
| `src/dashboard.ts`          | Dashboard endpoints                                                                            |
| `src/users.ts`              | User CRUD + permissions                                                                        |
| `src/profiles.ts`           | Profile CRUD                                                                                   |
| `src/audit.ts`              | Audit log queries + export                                                                     |
| `src/roles.ts`              | Role + permission management                                                                   |
| `src/notifications.ts`      | Notification CRUD + preferences                                                                |
| `src/billing.ts`            | Billing summary + invoices + subscriptions + payments + sync                                   |
| `src/webhooks.ts`           | Webhook endpoint CRUD + deliveries + test                                                      |
| `src/bulk.ts`               | Bulk invite (CSV import)                                                                       |
| `src/search.ts`             | Admin + portal search                                                                          |
| `src/types.ts`              | 15+ shared types (ApiResponse, PaginatedResult, entity types)                                  |
| `src/__tests__/sdk.test.ts` | 108 tests (mocked fetch)                                                                       |

#### Terraform (`infra/terraform/`)

| File                       | Purpose                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers.tf`             | AWS (~>5.0), Vercel (~>1.0), Supabase (~>1.0), Cloudflare (~>5.0), Archive (~>2.0)                                                                                                                 |
| `backend.tf`               | S3 backend: `mainecybertech-terraform-state`, DynamoDB locking (hardcoded bucket name)                                                                                                             |
| `variables.tf`             | ~45 variables: env, regions, ECS sizing, ACM, Cloudflare DNS, GitHub OIDC, integration secrets                                                                                                     |
| `network.tf`               | VPC (10.0.0.0/16, 2 AZs), API task SG, ECS execution + task IAM roles                                                                                                                              |
| `compute.tf`               | SQS FIFO queues (jobs + DLQ with redrive policy), ACM cert, ECR repos (AES256, IMMUTABLE, scan-on-push), SQS CloudWatch alarms                                                                     |
| `runtime.tf`               | ECS cluster, ALB + target group + listeners (HTTP→HTTPS redirect), CloudWatch logs, API + Worker task definitions (Fargate), ECS services with deployment circuit breaker, autoscaling (CPU-based) |
| `secrets.tf`               | SSM Parameter Store: 7 required + 14 optional (conditional `count`) under `/mainecybertech/${var.environment}/`                                                                                    |
| `supabase.tf`              | Supabase project (dev/prod naming), computed endpoint + DB host, `prevent_destroy`                                                                                                                 |
| `vercel.tf`                | Vercel project + NEXT_PUBLIC_API_URL env var                                                                                                                                                       |
| `dns.cloudflare.tf`        | 4 CNAME records (prod + test app/api)                                                                                                                                                              |
| `github-oidc.tf`           | GitHub OIDC provider + IAM roles (terraform + deploy)                                                                                                                                              |
| `alarms.tf`                | 7 CloudWatch alarms (CPU, memory, ALB 5xx, ALB latency, SQS age) → SNS topic                                                                                                                       |
| `slack-alarms.tf`          | SNS → Lambda → Slack webhook alarm notifications                                                                                                                                                   |
| `outputs.tf`               | 30+ outputs (VPC, ALB, ECR, ECS, SSM ARNs, Supabase)                                                                                                                                               |
| `terraform.tfvars.example` | Template for all required vars (prod needs real values)                                                                                                                                            |
| `README.md`                | Terraform usage instructions                                                                                                                                                                       |

#### Supabase (`supabase/`)

| File                                                | Purpose                                                 |
| --------------------------------------------------- | ------------------------------------------------------- |
| `config.toml`                                       | Local Supabase development config                       |
| `config.toml.example`                               | Config template                                         |
| `config.toml.production.example`                    | Production config template                              |
| `migrations/5302026_*.sql`                          | **Bootstrap migration** — 1 file containing full schema |
| `migrations/5302028_seed_permissions.sql`           | Seeds 26 permissions + 5 roles                          |
| `migrations/5302029_create_notifications_table.sql` | Notifications table                                     |
| `migrations/5302030_add_jira_fields.sql`            | Jira/JSM columns on projects, tasks, tickets            |
| `migrations/5302031_org_branding.sql`               | Organization branding (logo, colors)                    |
| `migrations/5302032_webhook_endpoints.sql`          | Webhook endpoints + deliveries tables                   |
| `migrations/5302033_public_interactions.sql`        | Public interactions table (marketing site leads)        |
| `migrations/5302034_ticket_comment_editing.sql`     | edited_at column + UPDATE RLS on ticket_comments        |
| `.gitkeep`                                          | Stale placeholder — migrations dir is non-empty         |
| `seeds/04_test_seed.sql`                            | Comprehensive test data                                 |
| `policies/`                                         | RLS policy files                                        |
| `patches/`                                          | Migration patches                                       |
| `functions/`                                        | Edge Functions                                          |
| `snippets/`                                         | SQL snippets                                            |

#### CI/CD (.github/workflows/ — 18 files)

| File                         | Purpose                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `test.yml`                   | Unit/integration tests on push/PR to main,develop                           |
| `lint.yml`                   | ESLint checks                                                               |
| `typecheck.yml`              | TypeScript type checking                                                    |
| `e2e.yml`                    | Playwright E2E tests (callable + trigger)                                   |
| `validate.yml`               | Reusable gate: test + lint + typecheck                                      |
| `api-deploy-ecs.prod.yml`    | API deploy to ECS prod (gated: validate + e2e + migrations + prod-approval) |
| `api-deploy-ecs.dev.yml`     | API deploy to ECS dev                                                       |
| `worker-deploy-ecs.prod.yml` | Worker deploy to ECS prod                                                   |
| `worker-deploy-ecs.dev.yml`  | Worker deploy to ECS dev                                                    |
| `web-prod-vercel.yml`        | Web deploy to Vercel prod (gated)                                           |
| `web-dev-vercel.yml`         | Web deploy to Vercel dev                                                    |
| `web-preview.yml`            | PR preview build validation                                                 |
| `supabase-migrations.yml`    | Supabase DB migrations (callable + push trigger)                            |
| `terraform-plan.dev.yml`     | Terraform plan on PR into develop                                           |
| `terraform-plan.prod.yml`    | Terraform plan on PR into main                                              |
| `terraform-apply.dev.yml`    | Terraform apply on push develop                                             |
| `terraform-apply.prod.yml`   | Terraform apply on push main                                                |
| `db-backup.yml`              | Scheduled database backup cron                                              |

#### Documentation (33 files)

See Section 7 for full audit. Notable: ARCHITECTURAL_ANALYSIS.md (466-line deep dive produced 2026-06-09), GAP_ANALYSIS.md, ROLLBACK_PROCEDURES.md, MONITORING_AND_ALERTING.md, SECRETS_ROTATION.md, BILLING.md, JIRA_JSM_INTEGRATION.md, ORG_BRANDING.md, ADMIN_FEATURES.md, API_RATE_LIMITING.md, ENVIRONMENT_VARIABLES.md, FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md, and many domain-specific docs.

#### Scripts (10 files)

- PowerShell + Bash pairs for: local stack setup/teardown/test, environment sync, dev reset/verify, database backup, Terraform installation
- `scripts/load-testing/` — placeholder only (README: "no load-testing scripts yet")

### Dead Code (Never Imported) — from ARCHITECTURAL_ANALYSIS.md

| File                                                | Lines    | Reason                                                  |
| --------------------------------------------------- | -------- | ------------------------------------------------------- |
| `apps/web/components/portal/ErrorBoundary.tsx`      | 47       | Class-based, never imported                             |
| `apps/web/components/SentryErrorBoundary.tsx`       | 43       | Class-based with Sentry, never imported                 |
| `apps/web/components/FileDropzone.tsx`              | 83       | Drag-and-drop upload, never imported                    |
| `apps/web/components/admin/ConfirmDangerButton.tsx` | 46       | Never imported (ConfirmIntentButton used instead)       |
| `apps/web/components/admin/TaskOrderEditor.tsx`     | 61       | Never imported                                          |
| `apps/web/lib/auth/bootstrap.ts`                    | 7        | Empty `// TODO` stub, never imported                    |
| `apps/web/lib/sentry.ts`                            | 21       | `initBrowserSentry()` / `captureError()` never imported |
| `apps/web/app/(portal)/portal/template.tsx`         | 7        | No-op wrapper                                           |
| `apps/web/app/(admin)/admin/.gitkeep`               | 0        | Unnecessary                                             |
| **Total**                                           | **~315** | **9 files**                                             |

### Near-Duplicate Component Pairs — from ARCHITECTURAL_ANALYSIS.md

| Pair                                            | Lines Each | Overlap  | Recommendation                  |
| ----------------------------------------------- | ---------- | -------- | ------------------------------- |
| `PortalBreadcrumbs` vs `AdminBreadcrumbs`       | 38/38      | **100%** | Merge into shared `Breadcrumbs` |
| `PortalSubnav` vs `AdminSubnav`                 | 28/31      | ~85%     | Share base, pass items as props |
| `PortalHeaderActions` vs `AdminHeaderActions`   | 28/18      | ~60%     | Share base component            |
| `PortalGlobalSearch` vs `AdminGlobalSearch`     | 101/132    | ~45%     | Share search infra              |
| `(portal)/loading.tsx` vs `(admin)/loading.tsx` | 37/28      | ~70%     | Share skeleton component        |
| 3 route-group `error.tsx` files                 | 35-37      | ~80%     | Use shared ErrorPage            |

### Monolithic Component — from ARCHITECTURAL_ANALYSIS.md

| Component                        | Lines    | Issues                                                                                                    |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `AdminDocumentsCenterClient.tsx` | **1297** | Handles create/read/update/delete, bulk ops, search, sort, filter, drawer, 3+ views — needs decomposition |

### Files That Appear Duplicated or Obsolete

| File                                                 | Issue                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `supabase/migrations/.gitkeep`                       | Stale — directory is non-empty                                                 |
| `infra/terraform/examples/`                          | 3 example files; commented\_ examples indicate historical drift                |
| `apps/api/.env.example`                              | Contains 7 worker-only vars that aren't in the API Zod schema                  |
| `docs/ARCHITECTURAL_ANALYSIS.md`                     | Duplicates much of AGENTS.md content (intentional — separate deep-dive output) |
| `docs/CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md` | Overlaps with PRODUCTION_VS_TESTING_DOMAINS.md and ENVIRONMENT_MATRIX.md       |

### High-Risk Files (Secrets/Environment-Specific)

| File                             | Risk                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `infra/terraform/supabase.tf:13` | Contains **hardcoded Supabase project ID** (`gigpuknitajakejmyxuk`) in `import` block                      |
| `infra/terraform/backend.tf:3`   | Hardcoded S3 bucket name (`mainecybertech-terraform-state`)                                                |
| `infra/terraform/backend.tf:7`   | Hardcoded DynamoDB table name (`terraform-locks`)                                                          |
| `.env.example` (any)             | Template values could leak patterns if committed with real data                                            |
| CI workflow files                | Use `${{ secrets.* }}` and `${{ vars.* }}` — template is safe, but real values in GitHub must be protected |

---

## 4. Code Mechanics & Logic

### Entry Points & Initialization Order

**API (`apps/api/src/main.ts`):**

```
dotenv/config → getEnv() (Zod parse, exit(1) on fail) → createApp() → app.listen(API_PORT)
```

- `createApp()`: initSentry() → helmet() → cors() → express.json(10mb, verify for rawBody) → cookieParser() → securityHeaders() → inputSanitizer() → globalRateLimit() → perUserRateLimit() → requestId() → requestLogger() → 22 route registrations → notFoundHandler → errorHandler

**Web (Next.js App Router):**

```
next.config.mjs → middleware.ts (edge) → RootLayout → route group layout → page
```

- Edge middleware runs first: JWT exp check on mct_session cookie, redirect unauthenticated from /portal/\* to /login, redirect authenticated from /login to /dashboard
- Server components call `getApiClient()` from `lib/api.ts` (server-only)
- Client components use `MCTClient.create()` from `lib/client-api.ts` (cookie-backed)

**Worker (`apps/worker/src/main.ts`):**

```
dotenv/config → parseEnv(process.env) → startHealthServer(HEALTH_PORT) → registerAllTasks() → runWorkerTasks()
```

- `runWorkerTasks()`: Poll SQS (ReceiveMessageCommand with 20s wait) → processMessage() → executeTask() → deleteMessage() on success → retry on failure

### Auth Flow (Observed)

```
Browser → POST /api/v1/auth/sign-in (email+password)
  → Supabase Auth REST signInWithPassword
  → Returns accessToken + user
  → Web sets mct_session cookie with token

Alternative PKCE flow:
  Browser → loginAction() → Supabase Auth PKCE → /auth/callback?code=
  → Web forwards Cookie header to POST /api/v1/auth/callback
  → API exchangeCode() → fetches Supabase auth token endpoint
  → Creates mct_session cookie

Subsequent requests:
  API requireAuth → Bearer token OR mct_session cookie
  → supabase.auth.getUser(token) on every authenticated request
  → Sets req.authUser = { userId, email }
```

### Critical Observation: Auth callback flow

**Observed (inferred):** The `/callback` endpoint at `src/routes/auth.ts:121-198` exchanges a PKCE auth code for a Supabase session **directly via REST fetch against Supabase's auth/token endpoint**. This is unusual — most implementations use the Supabase client library. The endpoint also optionally extracts a `code_verifier` from cookies using manual string parsing (`extractCodeVerifier()`, lines 109-119). After exchange, it calls a stored procedure `bootstrap_portal_access` RPC — **whose SQL definition is not found in any migration file**. This is a risk.

### Business Logic Hotspots

**High-complexity files (god-function candidates):**

| File                               | Lines | Complexity                                                                                                                         |
| ---------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/routes/tickets.ts`   | 391   | **HIGH** — 7 route handlers, audit logging, notification dispatch, email sending, 5-min edit window enforcement, CSV export inline |
| `apps/api/src/routes/documents.ts` | 481   | **HIGH** — 10 route handlers, file upload + versioning + signed URLs + bulk operations + Supabase storage cleanup on rollback      |
| `apps/worker/src/main.ts`          | 284   | **MODERATE** — env validation, task registry, SQS consumer loop, health server, all in one file                                    |
| `apps/api/src/routes/billing.ts`   | 205   | **MODERATE** — 6 endpoints + Stripe sync with inline API fetch                                                                     |
| `apps/api/src/routes/auth.ts`      | 284   | **MODERATE** — 7 auth endpoints + manual cookie parsing + RPC call                                                                 |

### Async Behavior & Failure Handling

**SDK Retry Pattern (packages/sdk/src/client.ts):**

- Exponential backoff: 200ms → 400ms → 800ms (max 5s, factor 2)
- Retryable statuses: 429, 502, 503, 504
- AbortError detection (separate from retry loop)
- Timeout: 30s default, configurable
- `postFormData()` has identical retry logic (code duplication — 85 lines duplicated between `request()` and `postFormData()`)

**Worker Failure Handling:**

- SQS delete only on `result.ok === true`
- Failed messages return to queue for retry (visibility timeout)
- 3 max receives → DLQ
- `Promise.allSettled` for concurrent message processing
- `try/catch` on poll loop with 5s delay on error
- **No graceful drain** — SIGTERM sets a flag but in-flight tasks are not awaited

### Dependency Analysis

**Key external coupling risks:**

| Dependency                         | Risk                                                    | Mitigation                                       |
| ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `@supabase/supabase-js`            | Heavy coupling — admin client used everywhere in API    | Abstracted behind `getSupabaseAdmin()` singleton |
| `@aws-sdk/client-sqs`              | Dynamic import in worker (avoids bundle bloat)          | Lazy import at runtime                           |
| `@sentry/node` / `@sentry/browser` | Graceful skip when DSN absent                           | Proper optional handling                         |
| `stripe` SDK                       | Only in API — direct Stripe API calls (not through SDK) | Acceptable — SDK is for client-facing API        |

---

## 5. System Architecture

### Architectural Style

**Layered Modular Monolith (API) + Server Components (Web) + Event-Driven (Worker)**

The API follows a **route → controller → service** pattern with middleware chains:

```
REQUEST → middleware stack (security, auth, admin, rate-limit, request-id)
       → route handler (validation, business logic, db operations, audit logging, notifications)
       → response formatting (success/failure helpers)
       → error middleware (AppError/ZodError → structured JSON)
```

The Web is a **hybrid Next.js architecture**:

- Server components for data fetching and initial render
- Client components for interactivity (forms, real-time updates)
- Server actions for mutations (form submissions, bulk operations)
- Edge middleware for auth guards

The Worker is an **event-driven SQS consumer** with a registry pattern for task handlers.

### Pattern Consistency

**Observed** patterns are generally consistent:

- ✅ All API routes use async handlers with try/catch → next(error)
- ✅ All mutations include audit logging
- ✅ All Zod validation is centralized in `validators/`
- ✅ Error responses consistently use `failure()` helper
- ✅ Response format consistent: `{ success, data }` or `{ success, error }`
- ✅ Server components consistently use `getApiClient()` from `lib/api.ts`
- ✅ Client components consistently use `MCTClient.create()` from `lib/client-api.ts`

**Inconsistencies:**

- `src/middleware/security.ts` imports `pino` directly at the bottom of the file (line 84) instead of importing from `lib/logger.ts` — creates a second pino instance
- `src/services/audit.ts` uses `console.error` for audit log failures instead of `logger.error` (line 27)
- `src/routes/billing.ts` uses raw `fetch` to Stripe API instead of the `stripe` SDK (although the SDK is used for webhook verification)
- Some endpoints use `z.string().uuid()` (strict), others use `z.string().min(1)` (relaxed, per acknowledged finding)

### Coupling & Cohesion

**Tight coupling concerns:**

1. **Supabase admin client everywhere** — Every route handler imports `getSupabaseAdmin()` directly. There's no data access layer abstraction. Replacing Supabase would require touching every route file.
2. **Auth middleware couples auth resolution to Supabase** — `requireAuth` calls `supabase.auth.getUser(token)` on every request. This is an external API call per authenticated request.
3. **Audit service silently swallows errors** — `logAuditEvent()` at `services/audit.ts:26-28` uses `console.error` and never surfaces failures. If audit logging breaks, the system won't know.

**Good cohesion:**

- Route handlers are focused on single entity types
- Middleware is single-responsibility
- Validators are separate from business logic
- SDK cleanly wraps all API endpoints

### Resilience & Runtime Hardening

| Capability        | Status | Assessment                                                                          |
| ----------------- | ------ | ----------------------------------------------------------------------------------- |
| Error handling    | ✅     | AppError hierarchy, ZodError handling, global error handler with Sentry             |
| Retries           | ✅     | SDK exponential backoff (3 retries, 429/502/503/504)                                |
| Timeout           | ✅     | SDK 30s configurable timeout, AbortError detection                                  |
| Circuit breaker   | ❌     | Not implemented — no rate-limit circuit breaker or bulkhead pattern                 |
| Fallback          | ⚠️     | Partial — audit service silently swallows errors instead of falling back            |
| Idempotency       | ⚠️     | Not consistently enforced — no idempotency keys on mutation endpoints               |
| Graceful shutdown | ❌     | Worker sets a flag but doesn't drain in-flight tasks; API has no shutdown handler   |
| Health checks     | ✅     | API: DB query check; Worker: uptime + registered tasks                              |
| Deployment safety | ✅     | ECS circuit breaker + rollback, services-stable wait, ALB health check grace period |

### Observability

| Capability              | Status | Details                                                          |
| ----------------------- | ------ | ---------------------------------------------------------------- |
| Structured logs         | ✅     | pino across API, Web, Worker                                     |
| Correlation IDs         | ✅     | X-Request-ID middleware + request duration logging               |
| Error tracking          | ✅     | Sentry in API (node) + Web (browser) with request context        |
| CloudWatch metrics      | ✅     | ECS CPU/memory, ALB 5xx/latency, SQS age                         |
| Audit logging           | ✅     | All 27 mutation endpoints                                        |
| Custom business metrics | ❌     | No JVM-style counters, no request rate/error/duration dashboards |
| Log aggregation search  | ⚠️     | CloudWatch Logs only (no Elasticsearch/Loki/Datadog)             |

### Security Architecture

| Layer              | Mechanism                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| Auth boundary      | Supabase Auth + JWT (Bearer OR mct_session cookie)                       |
| Authorization      | `requireAuth` + `requireAdmin` middleware (single-query role check)      |
| RLS enforcement    | **Assumed** — Supabase RLS policies in `supabase/policies/`              |
| Input validation   | Zod schemas on 7 mutation endpoints + global input sanitizer             |
| XSS prevention     | Pattern detection + HTML entity encoding                                 |
| SQL injection      | Pattern detection (broad regex)                                          |
| Secrets handling   | SSM Parameter Store (SecureString), injected at container start          |
| Transport security | HTTPS (ALB listener redirect HTTP→301→HTTPS, TLS 1.2-1.3)                |
| Container security | Non-root user, `node:20-alpine` (minimal), HEALTHCHECK                   |
| Cookie security    | JWT exp validation in edge middleware; HttpOnly? Not explicitly verified |

---

## 6. Infrastructure & Deployment Topology

### Runtime Topology

```
Internet
  ├── Cloudflare DNS (www.mainecybertech.com → Vercel, app.mainecybertech.com → Vercel, api.mainecybertech.com → AWS ALB)
  │
  ├── Vercel (Next.js)
  │   ├── www.mainecybertech.com → (public) route group (marketing)
  │   └── app.mainecybertech.com → (portal) + (admin) route groups
  │
  └── AWS (us-east-1)
      └── VPC (10.0.0.0/16, 2 AZs)
          ├── Public subnets: ALB (HTTP:80 → 301 → HTTPS:443)
          └── Private subnets:
              ├── ECS Fargate Service: API (256 CPU, 512 MB, 1-3 tasks)
              │   ├── Route53/ALB → API tasks (port 3001)
              │   └── SSM Parameters → env var injection
              ├── ECS Fargate Service: Worker (256 CPU, 512 MB, 1-3 tasks)
              │   └── SQS FIFO Queue → Worker poll loop
              │       └── DLQ (3 max receives)
              ├── NAT Gateway (outbound internet from private subnets)
              └── ECR Repositories (api + worker, IMMUTABLE, scan-on-push, AES256)

  └── Supabase (external)
      └── Project: mainecybertech-production (prod) / mainecybertech-dev (dev)
          ├── Postgres DB (RLS, audit_logs, documents, etc.)
          ├── Auth (PKCE, JWT, email/password)
          └── Storage Buckets (documents: 50MB, avatars: 2MB)
```

### Containerization Review

| Criterion         | Assessment                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base image        | ✅ `node:20-alpine` — minimal, official, specific version pinning                                                                                       |
| Multi-stage       | ✅ All 3 Dockerfiles use multi-stage build                                                                                                              |
| Non-root user     | ✅ `adduser` + `USER appuser` (API + Worker) or `nextjs` (Web)                                                                                          |
| Healthcheck       | ✅ All 3 have HEALTHCHECK (Web: 40s start period, 30s interval)                                                                                         |
| Layer efficiency  | ⚠️ API & Worker copy root `pnpm-lock.yaml` + `package.json` + `pnpm-workspace.yaml` then filter; Web copies `packages/` for workspace deps — reasonable |
| Build args safety | ⚠️ Web passes `NEXT_PUBLIC_API_URL` as ARG — build-time env var is expected pattern                                                                     |
| `latest` tag      | ⚠️ **CI pipeline tags `:latest`** alongside the SHA tag — `latest` is mutable and breaks immutability guarantee                                         |
| `.dockerignore`   | ✅ Excludes `**/node_modules/` and `.pnpm/`                                                                                                             |
| Reproducibility   | ✅ `--frozen-lockfile` ensures deterministic installs                                                                                                   |

### Terraform IaC Assessment

| Strength              | Finding                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| State isolation       | ✅ Dev/prod separate S3 keys via `env/backend.*.hcl` + DynamoDB locking                                          |
| Resource naming       | ✅ Environment-prefixed, consistent `mainecybertech-{resource}` pattern                                          |
| Secrets management    | ✅ SSM Parameter Store with SecureString, environment-specific paths                                             |
| Least privilege       | ⚠️ `ecs_task_s3_access` resource at `network.tf:80-95` uses `Resource = ["*"]` — **overly permissive S3 access** |
| Conditional resources | ✅ 14 integration secrets use `count = var.X != "" ? 1 : 0` pattern                                              |
| Autoscaling           | ✅ CPU-based target tracking for API + Worker (1-3 tasks, 60% target)                                            |
| Deployment safety     | ✅ ECS circuit breaker + rollback + `services-stable` wait                                                       |
| Provider pinning      | ✅ All providers pinned to major version ranges                                                                  |
| Input validation      | ✅ `environment` var has `contains()` validation                                                                 |
| State import          | ⚠️ `supabase.tf:11-14` has hardcoded project ID `gigpuknitajakejmyxuk`                                           |

### Environment Strategy

| Environment | Isolated? | SSM Path                | Supabase Project            | Vercel Project               |
| ----------- | --------- | ----------------------- | --------------------------- | ---------------------------- |
| Local       | ✅        | N/A (env files)         | `supabase start` local      | `next dev`                   |
| Dev         | ✅        | `/mainecybertech/dev/`  | `mainecybertech-dev`        | `mainecybertech-portal-dev`  |
| Prod        | ✅        | `/mainecybertech/prod/` | `mainecybertech-production` | `mainecybertech-portal-prod` |

**Inferred risk:** The Terraform `environment` variable (dev/prod) is the sole discriminator for resource naming. If `terraform apply` is run with the wrong value, it would manipulate the wrong state. The separate backend configs mitigate this but depend on correct workflow configuration.

### CI/CD Flow

```
PUSH to develop:
  test + lint + typecheck (validate.yml)
  → success → API ECS deploy, Worker ECS deploy, Web Vercel deploy (dev env)

PUSH to main:
  test + lint + typecheck (validate.yml)
  + E2E tests (e2e.yml)
  + Supabase migrations (supabase-migrations.yml)
  → success → prod-approval environment (1+ reviewers)
  → approved → API ECS deploy, Worker ECS deploy, Web Vercel deploy (prod env)

PR:
  test + lint + typecheck
  Web preview build validation
  Terraform plan (if infra/terraform/ changed)
```

---

## 7. Documentation & Knowledge Management Audit

### Documentation Inventory & Accuracy

| Doc                                                  | Status            | Drift Assessment                                       |
| ---------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| `AGENTS.md`                                          | ✅ UP TO DATE     | Comprehensive, 959 lines, reflects all known state     |
| `docs/INDEX.md`                                      | ✅ FIXED          | Missing entries added, broken link fixed               |
| `docs/ENVIRONMENT_VARIABLES.md`                      | ✅ FIXED          | STRIPE_WEBHOOK_SECRET + API_BASE_URL added             |
| `docs/GAP_ANALYSIS.md`                               | ✅ FIXED          | Test counts updated, resolved items marked             |
| `docs/BILLING.md`                                    | ✅ FIXED          | Stale STRIPE_SECRET_KEY note removed                   |
| `docs/ARCHITECTURAL_ANALYSIS.md`                     | ✅ CURRENT        | 466-line deep-dive, matches observed codebase          |
| `docs/ROLLBACK_PROCEDURES.md`                        | ✅ ACCURATE       | ECS, Vercel, Supabase, Terraform procedures documented |
| `docs/MONITORING_AND_ALERTING.md`                    | ✅ ACCURATE       | 7 alarms, SNS, Slack Lambda documented                 |
| `docs/SECRETS_ROTATION.md`                           | ✅ COMPREHENSIVE  | Rotation schedule, emergency rotation, inventory       |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`       | ✅ GOOD           | Operational runbook                                    |
| `docs/ADMIN_FEATURES.md`                             | ✅ ACCURATE       | Webhook mgmt, roles, audit export, bulk import         |
| `docs/JIRA_JSM_INTEGRATION.md`                       | ✅ ACCURATE       | Sync flows, status maps, webhook configuration         |
| `docs/ORG_BRANDING.md`                               | ✅ ACCURATE       | Upload flow, custom domains                            |
| `docs/API_RATE_LIMITING.md`                          | ✅ FIXED          | 300/15min updated                                      |
| `docs/MARKETING_SITE_INTEGRATION.md`                 | ✅ FIXED          | Migration ref 5302033 corrected                        |
| `README.dev.md`                                      | ✅ GOOD           | Local setup, Docker, testing instructions              |
| `README.md`                                          | ✅ MINIMAL        | Standard project overview                              |
| `CONTRIBUTING.md`                                    | ✅ PRESENT        | Standard contribution guidelines                       |
| `SECURITY.md`                                        | ✅ PRESENT        | Security policy                                        |
| `LICENSE`                                            | ✅ PRESENT        | MIT license                                            |
| `docs/CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md` | ⚠️ STALE          | Cited in INDEX but overlaps with other domain docs     |
| `docs/ENVIRONMENT_MATRIX.md`                         | ⚠️ OVERLAPS       | 24 lines, duplicates PRODUCTION_VS_TESTING_DOMAINS.md  |
| `docs/DEPLOYMENT_OPTIONS_COMPARISON.md`              | ⚠️ NOT IN INDEX   | Exists but not referenced in INDEX.md                  |
| `docs/CLOUDFLARE_VERCEL_DOMAIN_COMPLETION_README.md` | ⚠️ DUPLICATIVE    | Domain completion steps duplicated elsewhere           |
| `docs/DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md`      | ⚠️ DUPLICATIVE    | Superseded by docs/INDEX.md                            |
| `docs/FINAL_OPERATOR_MAP.md`                         | ⚠️ DUPLICATIVE    | Overlaps with FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md  |
| `docs/ZERO_DOWNTIME_CUTOVER_NOTES.md`                | ⚠️ NOT ACTIONABLE | Historical planning artifact                           |
| `docs/PRODUCTION_CUTOVER_CHECKLIST.md`               | ⚠️ NOT ACTIONABLE | Historical planning artifact                           |
| `docs/VSCODE_GIT_QUICKSTART.md`                      | ⚠️ LOW VALUE      | Standard VS Code instructions                          |
| `docs/LOCAL_DEVELOPMENT_CHECKLIST.md`                | ⚠️ LOW VALUE      | Overlaps with README.dev.md                            |
| `docs/PRODUCTION_VS_TESTING_DOMAINS.md`              | ⚠️ OVERLAPS       | Merges cleanly with ENVIRONMENT_MATRIX.md              |
| `docs/VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md`         | ⚠️ LOW VALUE      | Single-use domain assignment checklist                 |
| `docs/portal_admin_permissions_guide.md`             | ✅ PRESENT        | Portal + admin permissions reference                   |
| `docs/SUPABASE_MIGRATION_CHEATSHEET.md`              | ✅ USEFUL         | Migration commands and workflow                        |
| `docs/SUPABASE_MIGRATION_WORKFLOW.md`                | ✅ USEFUL         | Step-by-step migration process                         |
| `docs/portal_platform_formal_handoff_bundle/`        | ⚠️ NON-STANDARD   | Bundle directory — archive candidate                   |

### Developer Experience Assessment

A new engineer could realistically:

1. ✅ Clone repo and install dependencies (`pnpm install`)
2. ✅ Configure env files (`.env.example` exists for all 3 apps)
3. ✅ Start local Supabase (`cd supabase && supabase start`)
4. ✅ Sync env vars (`pnpm supabase:env:sync`)
5. ✅ Start API and Web in separate terminals
6. ✅ Understand architecture (AGENTS.md and ARCHITECTURAL_ANALYSIS.md are comprehensive)
7. ✅ Run tests (714 tests pass)
8. ⚠️ Make changes safely (130+ `any` types, no strict `noUncheckedIndexedAccess` in app tsconfig, loose SDK types)
9. ⚠️ Understand the full deployment topology (complex multi-platform — Vercel + ECS + Supabase + Cloudflare)

---

## 8. Code & Asset Cleanup Review

### Dead Code & Orphaned Assets

| Item                                                               | Type                       | Action                                               |
| ------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------- |
| `supabase/migrations/.gitkeep`                                     | Stale placeholder          | **Remove** (directory is non-empty)                  |
| `infra/terraform/examples/commented_alb_service_example.tf`        | Dead comment               | **Remove** (commented-out code)                      |
| `infra/terraform/examples/commented_cloudflare_record_example.tf`  | Dead comment               | **Remove**                                           |
| `scripts/load-testing/`                                            | Empty directory            | **Remove or implement**                              |
| `docs/portal_platform_formal_handoff_bundle/`                      | Non-standard bundle        | **Archive** or integrate content into canonical docs |
| `docs/ZERO_DOWNTIME_CUTOVER_NOTES.md`                              | Stale planning             | **Archive**                                          |
| `docs/PRODUCTION_CUTOVER_CHECKLIST.md`                             | Stale planning             | **Archive**                                          |
| `docs/VSCODE_GIT_QUICKSTART.md`                                    | Low value                  | **Archive**                                          |
| `docs/LOCAL_DEVELOPMENT_CHECKLIST.md`                              | Redundant to README.dev.md | **Archive** or merge                                 |
| `docs/VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md`                       | Single-use                 | **Archive**                                          |
| `docs/FINAL_OPERATOR_MAP.md`                                       | Overlaps with handbook     | **Archive**                                          |
| `docs/DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md`                    | Superseded by INDEX.md     | **Archive**                                          |
| `docs/CLOUDFLARE_VERCEL_DOMAIN_COMPLETION_README.md`               | Duplicative                | **Archive**                                          |
| `archive/stale-docs/ANALYSIS_SUMMARY.md` and `CODEBASE_MAPPING.md` | Already archived           | **OK** (already in archive)                          |

### Dependency Bloat

| Issue                                              | Assessment                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `supabase-cli` in root `package.json:dependencies` | ❌ Should be `devDependencies` (used only for local dev/CI)                             |
| `pg` in root `package.json:dependencies`           | ⚠️ Not used directly by any app (API uses Supabase client) — likely stale               |
| `@testing-library/user-event` v14                  | ⚠️ fireEvent used instead due to pnpm symlink resolution issues                         |
| `pino-pretty` in root `devDependencies`            | ✅ Correct — used for local dev only                                                    |
| Root `dependencies` vs `devDependencies`           | ❌ Both `pg` and `supabase-cli` are runtime `dependencies` instead of `devDependencies` |

### Redundant Logic

| Pattern                    | Location                                               | Issue                                                                                   |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| SDK retry code duplication | `packages/sdk/src/client.ts` (lines 59-151 vs 176-261) | `request()` and `postFormData()` have ~85 lines of identical retry/error-handling logic |
| Audit error handling       | `apps/api/src/services/audit.ts:26-28`                 | Uses `console.error` instead of `logger.error` (inconsistent with rest of codebase)     |
| Security logger            | `apps/api/src/middleware/security.ts:84`               | Creates second pino instance instead of importing from `lib/logger.ts`                  |

### Configuration Sprawl

| Finding                             | Evidence                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Multiple `vercel.json` files        | Root has `{ framework: "nextjs" }`, `apps/web/vercel.json` has installCommand + framework — root one may be unnecessary |
| `.env.example` includes worker vars | `apps/api/.env.example` lists 7 worker-only vars (JIRA*, M365*, API_BASE_URL)                                           |
| `pg` root dep                       | On-disk root package.json has `pg` as dependency — likely unused                                                        |

### Refactor Candidates (Priority-Ordered)

| Priority      | Refactor                                                                  | Effort  | Impact                                                         |
| ------------- | ------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| 🔴 **High**   | Extract shared retry logic in SDK `client.ts`                             | Small   | Reduces ~85 lines of duplicated code, improves maintainability |
| 🔴 **High**   | Fix `security.ts` to use shared logger                                    | Trivial | Eliminates second pino instance, consistent logging            |
| 🟡 **Medium** | Fix `audit.ts` to use `logger.error`                                      | Trivial | Consistent error reporting                                     |
| 🟡 **Medium** | Move `pg` + `supabase-cli` to `devDependencies`                           | Trivial | Clean dependency separation                                    |
| 🟡 **Medium** | Remove `@typescript-eslint/*` from web devDeps (they're in shared config) | Small   | Removes redundant deps                                         |
| 🟢 **Low**    | Remove `supabase/migrations/.gitkeep`                                     | Trivial | Cleanup                                                        |
| 🟢 **Low**    | Archive 6 stale domain docs                                               | Small   | Reduces doc count by ~18%                                      |

---

## 9. Security, Reliability & Operational Risk Review

### 🔴 Critical Risks

| Risk                                                       | Severity     | Category        | Details                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API port mismatch** — Terraform `3001` vs Express `4000` | **Critical** | **Reliability** | `infra/terraform/variables.tf:107` defaults `api_container_port` to `3001`, but `apps/api/src/config/env.ts:7` defaults `API_PORT` to `4000`. ALB health check targets port 3001 but app listens on 4000. **Blocks all ECS deployments.** |
| S3 IAM policy `Resource = ["*"]`                           | **High**     | **Security**    | `terraform/network.tf:80-95` grants `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` to all S3 resources. ECS task role can access any bucket in the account.                                                           |
| `CORS_ORIGIN` defaults to `*`                              | **High**     | **Security**    | `apps/api/src/config/env.ts:11` — `z.string().default("*")`. In production, any origin can make authenticated requests. Combined with cookie-based auth, this is a credential exposure risk.                                              |
| No graceful shutdown on API                                | **High**     | **Reliability** | API has no `process.on('SIGTERM')` handler. ECS sends SIGTERM during deployments; in-flight requests will be terminated.                                                                                                                  |
| Worker in-flight tasks dropped on shutdown                 | **High**     | **Reliability** | Worker SIGTERM handler only sets `shuttingDown = true` but doesn't await in-flight `Promise.allSettled`. Running tasks are abandoned.                                                                                                     |
| `alb_allowed_cidrs` defaults to `0.0.0.0/0`                | **High**     | **Security**    | `infra/terraform/variables.tf:140` — ALB allows traffic from any IP. Should restrict to Cloudflare IP ranges for production.                                                                                                              |
| Supabase admin client `global.fetch` is a no-op            | **Medium**   | **Performance** | `apps/api/src/services/supabase.ts:19` — `fetch: (...args) => fetch(...args)` wraps native fetch without any connection pooling configuration. AGENTS.md claims "Node 20 undici connection pooling" but no agent config exists.           |
| `bootstrap_portal_access` RPC not in migrations            | **Medium**   | **Reliability** | Referenced in `auth.ts:169-184` but SQL definition not found in any migration file. If missing, auth callback will log an error but won't fail.                                                                                           |
| `CORS_ORIGIN` misused for notification links               | **Medium**   | **Reliability** | `apps/api/src/lib/notify.ts:37` uses `CORS_ORIGIN` as base URL for email notification links. If `CORS_ORIGIN` is `*`, link generation produces broken URLs. Should use dedicated `APP_BASE_URL` env var.                                  |

### 🟡 High Risks

| Risk                                                    | Severity       | Category                 | Details                                                                                                                                                                     |
| ------------------------------------------------------- | -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:latest` tag pushed alongside SHA tag                  | **Medium**     | **Security/Reliability** | `latest` tag is mutable — breaks immutability promise of ECR. Rollback to `latest` may get a newer image than expected.                                                     |
| Auth calls `supabase.auth.getUser()` per request        | **Medium**     | **Performance**          | Every authenticated API call makes an HTTP request to Supabase Auth. At scale, this adds latency and costs. JWT verification could be done locally with a public key.       |
| No DB connection pool configuration                     | **Medium**     | **Performance**          | `getSupabaseAdmin()` uses undici's built-in fetch which has connection pooling, but no explicit pool size or timeout configuration.                                         |
| Audit log failures silently swallowed                   | **Medium**     | **Compliance**           | `logAuditEvent()` uses `console.error` — no log, no metric, no alert. If audit logging breaks, there's no indication.                                                       |
| Cookie `mct_session` lacks explicit security attributes | **Medium**     | **Security**             | The middleware checks expiration via base64url decode, but the cookie's `HttpOnly`, `Secure`, `SameSite` attributes are set by the API — not verified in static analysis.   |
| `security.ts` regex patterns are very broad             | **Low-Medium** | **Security**             | SQL injection patterns match common words like "select", "update", "delete" — may block legitimate content like "Please update the ticket". Only applied to request bodies. |

### 🟢 Medium-Low Risks

| Risk                                       | Category    | Details                                                                                                   |
| ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------- |
| No rate-limit bypass for webhook callbacks | Reliability | Stripe/third-party webhooks would be subject to the global 300/15min IP rate limiter if from a shared IP. |
| Terraform state bucket name hardcoded      | Operational | Cannot deploy to multiple AWS accounts without modifying `backend.tf`                                     |
| No explicit CORS for exposed endpoints     | Security    | `CORS_ORIGIN` defaults to `*` in dev — acceptable but should be verified                                  |
| Coverage thresholds at 50%                 | Quality     | Web jest config has 50% branch/function/line/statement thresholds — low                                   |
| `public_interactions` INSERT policy        | Security    | Only INSERT policy exists (no SELECT per finding #6) — confirmed ✅ but INSERT RLS should be verified     |
| No OpenAPI/Swagger UI at `/api/v1/docs`    | DX          | `docsRouter` is registered but OpenAPI spec at `src/openapi.yaml` may be incomplete                       |

---

## 10. Technical Debt Assessment

| Debt Item                                  | Why It Matters                         | Current Impact                            | Future Impact                   | Remediation                          | Priority  |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------------ | --------- |
| 130+ `any` types in web                    | Type safety — hides real bugs          | Low (runtime-safe)                        | Blocks refactoring confidence   | Incremental typing                   | 🟢 Low    |
| SDK return types are `any`                 | No autocomplete in IDE                 | Low (documented)                          | Poor dev experience             | Add generics per endpoint            | 🟢 Low    |
| Code duplication in SDK client.ts          | ~85 lines duplicated                   | Low (works correctly)                     | Maintenance burden              | Extract shared request core          | 🟡 Medium |
| All routes import supabase directly        | Tight coupling to Supabase             | Low (works)                               | Migration blocker               | Add data access layer                | 🟢 Low    |
| Worker in one file (284 lines)             | Single-responsibility violation        | Low (cohesive)                            | Harder to test/extend           | Split: env, registry, poller, health | 🟡 Medium |
| 6+ overlapping domain docs                 | Developer confusion                    | Low                                       | Documentation debt              | Consolidate                          | 🟡 Medium |
| `pg` + `supabase-cli` in root runtime deps | Unnecessary production deps            | None (frozen lockfile)                    | Bloat on `pnpm install --prod`  | Move to devDependencies              | 🟢 Low    |
| No load-testing scripts                    | No baseline for autoscaling            | Low (not yet needed)                      | Scaling without data            | Implement k6/artillery scripts       | 🟡 Medium |
| Terraform `s3:*` access policy             | Security risk                          | Low (ECS tasks have limited blast radius) | Lateral movement risk           | Restrict to specific buckets         | 🔴 High   |
| OpenAPI spec incomplete                    | API consumers have no reference        | Low (SDK covers it)                       | Third-party integration blocker | Complete OpenAPI spec                | 🟢 Low    |
| 2 pino instances (security.ts)             | Wasted resources, inconsistent logging | None (negligible)                         | Confusing log analysis          | Import from lib/logger.ts            | 🟢 Low    |

---

## 11. Recommended Remediation Roadmap

### Immediate (0–7 Days) — Critical

| #   | Task                                                                                                             | Rationale                                                                                                                                                    | Effort |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | **Fix API port mismatch** — change `variables.tf:107` default from `3001` to `4000`                              | **Blocks all ECS deployments.** Terraform targets ALB to port 3001 but Express listens on port 4000. Health checks will fail; service never becomes healthy. | 5 min  |
| 2   | **Change `CORS_ORIGIN` default** — remove `*` default, require explicit config per environment                   | Security — production API would accept authenticated requests from any origin. Combined with cookie auth, this is a credential exposure risk.                | 5 min  |
| 3   | **Restrict S3 IAM policy** — change `Resource = ["*"]` to specific bucket ARNs in `network.tf:92`                | Security — ECS task role currently grants full S3 access to any bucket in the AWS account.                                                                   | 15 min |
| 4   | **Add graceful shutdown to API** — `process.on('SIGTERM')` with `server.close()`                                 | Prevents in-flight request termination during ECS deployments.                                                                                               | 30 min |
| 5   | **Add graceful shutdown to Worker** — `await Promise.allSettled(inFlight)` before exit                           | Prevents task abandonment during worker scale-in/deploy.                                                                                                     | 30 min |
| 6   | **Remove `:latest` tagging from CI** — only tag with `${{ github.sha }}`                                         | CI pipeline pushes mutable `latest` tag alongside SHA tag. Rollback to `latest` may deploy wrong image.                                                      | 15 min |
| 7   | **Add `APP_BASE_URL` env var** — stop using `CORS_ORIGIN` for notification link generation in `lib/notify.ts:37` | If `CORS_ORIGIN` is `*`, email notification links are broken. Decouple link generation from CORS policy.                                                     | 15 min |
| 8   | **Verify `bootstrap_portal_access` RPC exists**                                                                  | Referenced in auth callback but SQL not found in migrations — if missing, RPC call fails silently.                                                           | 30 min |

### Short Term (1–4 Weeks) — High

| #   | Task                                                                                                | Rationale                                              | Effort    |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| 6   | **Fix `security.ts` logger** — import from `lib/logger.ts` instead of creating second pino instance | Consistent logging, eliminates waste                   | 10 min    |
| 7   | **Fix `audit.ts` error handling** — use `logger.error` instead of `console.error`                   | Audit failure should be visible in logs                | 10 min    |
| 8   | **Move root deps to devDependencies** — `pg`, `supabase-cli`                                        | Clean dependency separation                            | 10 min    |
| 9   | **Archive 6 stale domain docs** — consolidate into 1-2 canonical docs                               | Reduce documentation debt                              | 1 hour    |
| 10  | **Remove `supabase/migrations/.gitkeep`**                                                           | Cleanup                                                | 1 min     |
| 11  | **Remove stale Terraform example files** — commented-out code in `examples/`                        | Cleanup                                                | 10 min    |
| 12  | **Add `HttpOnly`, `Secure`, `SameSite` cookie attributes** to mct_session in auth callback          | Defense-in-depth for session cookie                    | 30 min    |
| 13  | **Set `NEXT_PUBLIC_API_URL` explicitly in Vercel env vars** for both dev and prod                   | Removes dependency on fallback `http://localhost:4000` | 10 min    |
| 14  | **Complete OpenAPI spec** or remove the partial `openapi.yaml` and document in code                 | Either finish the spec or remove the stub              | 2-4 hours |

### Medium Term (1–3 Months) — Structural

| #   | Task                                                                                                                         | Rationale                                                         | Effort   |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| 15  | **Implement local JWT verification** — verify `mct_session` JWT with public key instead of calling Supabase Auth per request | Reduces auth latency and Supabase API calls at scale              | 1-2 days |
| 16  | **Add data access layer** — abstract `getSupabaseAdmin()` calls behind repository/DAO interfaces                             | Break tight coupling, enable testability, simplify migration path | 3-5 days |
| 17  | **Add custom business metrics** — request rates, error rates, audit log counts, notification delivery rates                  | Proactive monitoring                                              | 2-3 days |
| 18  | **Implement load-testing scripts** — k6 or artillery for baseline performance data                                           | Validate autoscaling thresholds, identify bottlenecks             | 2-3 days |
| 19  | **Add rate-limit bypass for known webhook IPs/callbacks**                                                                    | Prevent Stripe/webhook callback blocking                          | 1 day    |
| 20  | **Add idempotency keys** to mutation endpoints                                                                               | Safe retry without duplicate side effects                         | 2-3 days |

### Longer Term — Strategic

| #   | Task                                                                                   | Rationale                                              |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 21  | **Wire `@mct/ui` and `@mct/config` into apps** — shared packages exist but aren't used | Reduce config duplication, enforce consistent patterns |
| 22  | **Incremental type hardening** — reduce `any` count from 130+                          | Improve refactoring confidence, catch real bugs        |
| 23  | **Add SSE/WebSocket for real-time notifications** — replace 30s polling                | Reduce latency, reduce API load                        |
| 24  | **Implement API key management** — self-serve keys for third-party integrations        | Platform maturity feature                              |
| 25  | **Complete OpenAPI spec** with Swagger UI                                              | Enable third-party integration without SDK             |

---

## 12. Critical Observations & Vulnerabilities

### Structured Issue Summary

| File / Module                                  | Issue Category                    | Severity      | Description                                                                                            | Impact                                                                                                             | Recommended Remediation                                                  |
| ---------------------------------------------- | --------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `infra/terraform/network.tf:80-95`             | Security — IAM                    | 🔴 **High**   | ECS task role grants `s3:*` on `Resource = ["*"]`                                                      | Any ECS task (API or Worker) can read/write/delete any S3 bucket in the AWS account                                | Restrict to specific bucket ARNs (`aws_s3_bucket.*.arn`)                 |
| `apps/api/src/main.ts`                         | Reliability — Graceful Shutdown   | 🔴 **High**   | No SIGTERM handler; `app.listen()` without `server.close()`                                            | ECS sends SIGTERM during deployments; in-flight HTTP requests are abruptly terminated                              | Add `process.on('SIGTERM', ...)` with `server.close()`                   |
| `apps/worker/src/main.ts:207-237`              | Reliability — Graceful Shutdown   | 🔴 **High**   | `shuttingDown` flag set but `Promise.allSettled` results not awaited                                   | In-flight task processing is abandoned during worker shutdown                                                      | Wrap active tasks in tracked array, await completion before exit         |
| `.github/workflows/api-deploy-ecs.prod.yml:56` | Reliability — Immutability        | 🟡 **High**   | Tags both `:latest` and SHA; latest is mutable                                                         | Rollback to `:latest` may deploy a newer-than-expected image                                                       | Only tag/push with the SHA commit hash                                   |
| `.github/workflows/worker-deploy-ecs.prod.yml` | Reliability — Immutability        | 🟡 **High**   | Same `:latest` pattern as API deploy                                                                   | Same risk as API                                                                                                   | Same fix — SHA-only tagging                                              |
| `infra/terraform/backend.tf:3`                 | Operational — Hardcoded           | 🟡 **Medium** | S3 bucket name `mainecybertech-terraform-state` hardcoded                                              | Cannot deploy to different AWS accounts without modifying source                                                   | Extract to variable or use partial config via `-backend-config`          |
| `apps/api/src/services/audit.ts:27`            | Observability — Silent Failure    | 🟡 **Medium** | `console.error` instead of `logger.error`                                                              | Audit log failures are invisible in production log aggregation                                                     | Change to `logger.error`                                                 |
| `apps/api/src/middleware/security.ts:84`       | Code Quality — Logger Duplication | 🟡 **Medium** | Creates 2nd pino instance instead of importing shared one                                              | Wastes memory, inconsistent log format                                                                             | Import from `lib/logger.ts`                                              |
| `packages/sdk/src/client.ts:59-151,176-261`    | Code Quality — Duplication        | 🟡 **Medium** | ~85 lines of retry logic duplicated between `request()` and `postFormData()`                           | Maintenance burden if retry logic needs changes                                                                    | Extract shared `executeWithRetry()` function                             |
| `apps/api/src/routes/auth.ts:109-119`          | Tech Debt — Cookie Parsing        | 🟢 **Low**    | Manual cookie string splitting for PKCE code_verifier                                                  | Works but fragile; any Supabase URL format change breaks it                                                        | Use `cookie-parser` parsed cookies instead                               |
| `apps/api/src/routes/auth.ts:169-184`          | Reliability — Missing RPC         | 🟡 **Medium** | Calls `bootstrap_portal_access` RPC that isn't in any migration file                                   | If RPC doesn't exist, error is logged but hidden from caller                                                       | Add RPC definition to migration or remove the call                       |
| `infra/terraform/supabase.tf:13`               | Security — Hardcoded ID           | 🟡 **Medium** | Supabase project ID `gigpuknitajakejmyxuk` in source                                                   | Exposes project identifier; prevents easy cloning                                                                  | Extract to variable or remove from version control                       |
| `packages/sdk/src/index.ts:21`                 | DX — Type Safety                  | 🟢 **Low**    | `export type * from "./types"` re-exports are correct pattern but `any` return types on all methods    | Poor IDE autocomplete for SDK consumers                                                                            | Add typed response generics per method                                   |
| `package.json:36-37`                           | Dependency Hygiene                | 🟢 **Low**    | `pg` and `supabase-cli` in `dependencies` instead of `devDependencies`                                 | Unnecessary weight in production installs                                                                          | Move to devDependencies                                                  |
| `apps/web/jest.config.mjs`                     | Quality — Coverage                | 🟢 **Low**    | 50% coverage thresholds (branch, function, lines, statements)                                          | Coverage can degrade to 50% without CI failure                                                                     | Increase to 70-80% over time                                             |
| `infra/terraform/variables.tf:167`             | Security — ECS Exec               | 🟡 **Medium** | `enable_execute_command` defaults to `true` — interactive shell access to production containers        | Shell access via `aws ecs execute-command` to running containers; blast radius increase if credentials compromised | Default to `false` for production                                        |
| `infra/terraform/secrets.tf:73`                | Security — Superuser DB           | 🟡 **Medium** | DATABASE_URL uses hardcoded `postgres` superuser as the DB user                                        | Application connects as the Postgres superuser; any SQL injection or RLS bypass grants full DB control             | Create dedicated app user with limited privileges                        |
| `infra/terraform/network.tf`                   | Security — No VPC Flow Logs       | 🟡 **Medium** | No VPC Flow Logs configured for network audit trail                                                    | No visibility into network connections; security incident investigation impaired                                   | Add VPC Flow Logs to CloudWatch                                          |
| `infra/terraform/runtime.tf`                   | Security — No WAF on ALB          | 🟡 **Medium** | Internet-facing ALB has no WAF; only optional Cloudflare proxy mitigation                              | Direct HTTP/S traffic to ALB bypasses WAF inspection; vulnerable to OWASP Top 10 attacks                           | Add AWS WAF to ALB listener                                              |
| `packages/ui/package.json:8`                   | Cleanup — Unnecessary Dep         | 🟢 **Low**    | `@mct/ui` depends on `react` but `cn()` utility doesn't use React                                      | Unnecessary production dependency; 3KB+ added to bundle                                                            | Remove `react` from `@mct/ui` dependencies                               |
| `.github/workflows/e2e.yml`                    | CI/CD — No Path Filter            | 🟡 **Medium** | E2E workflow runs on every push/PR to main/develop with no path filter                                 | Hours of E2E test execution even when no code changes warrant it                                                   | Add `paths:` filter to direct triggers                                   |
| `.github/workflows/terraform-*.dev.yml`        | CI/CD — No Path Filter            | 🟡 **Medium** | Terraform dev workflows run on EVERY PR/push regardless of file changes                                | Unnecessary Terraform plan/apply runs when infra hasn't changed                                                    | Add `paths: ['infra/terraform/**']`                                      |
| `.github/workflows/terraform-apply.prod.yml`   | CI/CD — Insufficient Gating       | 🟡 **High**   | Terraform prod apply only gated on `validate` — missing e2e+migrations+prod-approval gates             | Infrastructure changes can bypass security and migration validation checks                                         | Add `needs: [validate, e2e, migrations]` + change env to `prod-approval` |
| `apps/worker/src/main.ts`                      | Monitoring — Missing Health       | 🟢 **Low**    | Worker health server on port 3001 exists but not monitored by ALB or Terraform                         | No visibility into worker health; failures detected only via SQS queue depth alarms                                | Add to monitoring documentation or create ALB target group               |
| `docs/` (6 files)                              | Documentation — Sprawl            | 🟢 **Low**    | 6+ overlapping domain docs (ENVIRONMENT_MATRIX, PRODUCTION_VS_TESTING_DOMAINS, CLOUDFLARE_CACHE, etc.) | Developer confusion, maintenance burden                                                                            | Consolidate into 1-2 canonical docs                                      |

---

## Final Verdict

This is a **well-architected, production-aware codebase** that reflects significant engineering discipline across security, testing, infrastructure-as-code, and documentation. The 38 pre-production findings and 21 codebase review findings demonstrate a rigorous audit culture.

The system is **ready for dev deployment** and will serve a production workload **with the 5 immediate remediation items addressed**. The core security model (SSM secrets, Zod validation, RLS, audit logging, JWT verification, non-root containers) provides a solid foundation.

**The single most impactful improvement** is adding graceful shutdown handlers to the API and Worker (items #2 and #3 in the immediate remediation). Without these, every ECS deployment or scale-in event risks terminating in-flight operations.

**The most significant security finding** is the unrestricted S3 IAM policy (`Resource = ["*"]`) — a 15-minute fix that should be addressed before any production deployment.

**The architectural pattern is sustainable** for a team of 3-8 engineers. The monorepo structure, shared SDK, Zod validation patterns, and Terraform IaC provide clear boundaries and good developer experience. The remaining tech debt items (130+ `any` types, SDK return types, tight Supabase coupling) are well-understood and noted as future concerns rather than blocking issues.
