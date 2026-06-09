# Architectural Analysis — Maine CyberTech Portal

> **Date:** 2026-06-09
> **Scope:** Full deep-dive across 6 pillars: Repository Map, Code Mechanics, System Architecture, Infrastructure & Deployment, Documentation, Code Cleanup
> **Method:** Automated analysis + manual inspection of all source files, Terraform configs, CI/CD workflows, documentation, and test suites

---

## 1. Repository Map & File Inventory

### Monorepo Structure

```
mainecybertech-portal/
├── apps/                                       # 3 deployable applications
│   ├── api/                                    # Express REST API (port 4000)
│   │   ├── src/
│   │   │   ├── main.ts                         # Entry point: dotenv → getEnv → createApp() → listen
│   │   │   ├── app.ts                          # Factory: helmet → cors → json(10mb) → cookieParser → security → sanitizer → rate-limit → requestId → logger → routes → 404 → error
│   │   │   ├── config/env.ts                   # Zod env schema (17 vars, 3 required)
│   │   │   ├── routes/                         # 22 route files, 114 endpoints
│   │   │   ├── middleware/                     # auth, admin, error, security, rate-limit, request-id, cache, not-found
│   │   │   ├── services/                       # supabase.ts (admin client), audit.ts (logAuditEvent)
│   │   │   ├── lib/                            # email.ts (Nodemailer), logger.ts (pino), sentry.ts, notify.ts
│   │   │   ├── validators/                     # Zod schemas: document, membership, organization, project, ticket
│   │   │   ├── types/                          # AppError, success/failure helpers, Express type augmentation
│   │   │   └── __tests__/                      # 24 test files, 178 tests
│   │   ├── Dockerfile                          # Multi-stage, node:20-alpine, non-root
│   │   └── .env.example                        # 23 vars matching schema
│   │
│   ├── web/                                    # Next.js App Router (standalone output)
│   │   ├── app/
│   │   │   ├── (public)/                       # Marketing + auth pages
│   │   │   ├── (portal)/                       # Client portal layout (auth guard + membership check)
│   │   │   ├── (admin)/                        # Admin panel layout (auth guard)
│   │   │   ├── auth/callback/route.ts          # PKCE code exchange
│   │   │   ├── layout.tsx                      # Root shell (Inter + Orbitron, dark theme)
│   │   │   ├── global-error.tsx
│   │   │   └── not-found.tsx
│   │   ├── components/                         # 43 files across admin/, portal/, marketing/
│   │   ├── lib/                                # api.ts, client-api.ts, auth/, cn.ts, org-actions.ts
│   │   ├── middleware.ts                       # Edge JWT exp check + route guard
│   │   ├── next.config.mjs                     # standalone, rewrites, bundle-analyzer
│   │   ├── vercel.json                         # pnpm install --frozen-lockfile
│   │   ├── Dockerfile
│   │   └── e2e/                                # 24 Playwright spec files
│   │
│   └── worker/                                 # Background task processor
│       └── src/
│           ├── main.ts                         # Zod env → task registry → SQS poller → health server
│           ├── tasks/                          # 5 handlers: stripe-reconcile, jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications
│           ├── email.ts                        # Nodemailer SMTP
│           └── __tests__/                      # 24 tests
│
├── packages/                                   # 3 shared packages
│   ├── sdk/                                    # MCTClient — 16 API domains, retry, typed
│   ├── ui/                                     # cn() utility (clsx + tailwind-merge)
│   └── config/                                 # Shared eslint.mjs + tsconfig.json
│
├── infra/terraform/                            # 14 .tf files, ~1800 LOC
│   ├── providers.tf                            # AWS ~>5.0, Vercel ~>1.0, Supabase ~>1.0, Cloudflare ~>5.0
│   ├── network.tf                              # VPC 10.0.0.0/16, 2 AZs, NAT, SGs
│   ├── compute.tf                              # SQS FIFO, ACM cert, ECR repos
│   ├── runtime.tf                              # ECS cluster, ALB, Fargate tasks, autoscaling
│   ├── secrets.tf                              # 20+ SSM parameters
│   ├── supabase.tf                             # Project + storage buckets
│   ├── vercel.tf                               # Project + domains + env vars
│   ├── dns.cloudflare.tf                       # 4 CNAME records
│   ├── github-oidc.tf                          # GitHub OIDC IAM roles
│   ├── alarms.tf                               # 7 CloudWatch alarms
│   ├── slack-alarms.tf                         # SNS → Lambda → Slack
│   └── variables.tf                            # 30+ variables
│
├── supabase/                                   # DB migrations + seeds
│   ├── migrations/
│   ├── seeds/                                  # 5 seed SQL files
│   ├── policies/                               # RLS policies
│   └── config.toml
│
├── .github/workflows/                          # 18 workflow files
├── scripts/                                    # Local dev automation (PS1 + sh)
├── archive/stale-{docs,root-docs}/             # Archived planning artifacts
├── docs/                                       # 36 documentation files
│   ├── INDEX.md                                # Canonical doc index
│   ├── ENVIRONMENT_VARIABLES.md                # Env var reference
│   ├── GAP_ANALYSIS.md                         # Known gaps
│   └── FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md # Operator manual
│
├── AGENTS.md                                   # System runtime (921 lines)
├── README.md                                   # Project overview
├── README.dev.md                               # Developer setup guide
├── CONTRIBUTING.md                             # Contributor guide
└── SECURITY.md                                 # Security policy
```

**Total active source files (non-doc, non-test):** ~220 across 3 apps + 3 packages

---

## 2. Code Mechanics & Logic

### Entry Points & Initialization

**API (`apps/api/src/main.ts`):**
```
dotenv/config → getEnv() (Zod validate, exit on fail) → createApp() → app.listen(4000)
```

**Web (Next.js App Router):**
```
Middleware (edge) → JWT exp check → guard redirects
  → Root layout (fonts, theme, accent gradient)
    → Route group layout (portal: 2-phase auth+membership; admin: auth only)
      → Page (server component or client component)
        → Server action or client SDK call → Next.js rewrite (/api/v1/*) → Express API
```

**Worker (`apps/worker/src/main.ts`):**
```
dotenv/config → parseEnv() (Zod) → registerAllTasks() → startHealthServer(3001)
  → SQS poll loop (pollMessages → executeTask → deleteMessage if ok)
  → SIGTERM/SIGINT → graceful shutdown
```

### Middleware Chain (API — `app.ts`)

```
helmet → cors → json(10mb, rawBody) → cookieParser → securityHeaders → inputSanitizer
→ IP rate limiter (300/15min) → user rate limiter → requestId → requestLogger
→ [22 route groups] → notFoundHandler → errorHandler (Sentry + structured JSON)
```

### Core Data Flow

```
Server context:
  Browser → [Next.js Middleware] → Server Action
    → getApiClient() via lib/api.ts (mct_session cookie → Bearer token)
      → MCTClient SDK → HTTP to NEXT_PUBLIC_API_URL
        → Express API → requireAuth (JWT verify via Supabase Admin)
          → requireAdmin (single INNER JOIN on roles)
            → Route handler → Supabase queries → Response

Client context:
  Browser → [Client Component] → getClientApi() via lib/client-api.ts
    → MCTClient SDK → relative /api/v1/* (browser sends cookie automatically)
      → Next.js rewrites (next.config.mjs) → Express API (same chain)
```

### Key Patterns

| Pattern | Location | Assessment |
|---------|----------|------------|
| **Factory function** | `createApp()` | ✅ Consistent |
| **Middleware chain** | API app.ts | ✅ Well-ordered, security before routing |
| **Singleton env** | `env.ts` getEnv() | ✅ Lazy, cached, fails fast |
| **Registry pattern** | Worker tasks | ✅ Clean Map-based dispatch |
| **Facade pattern** | SDK MCTClient | ✅ 16 domain APIs behind single factory |
| **Compound endpoints** | orgs/{id}/detail, etc. | ✅ Reduces N+1 queries |
| **Server/Client API split** | lib/api.ts vs client-api.ts | ✅ Clear separation, "server-only" guard |
| **Bulk action pattern** | `{ ok, error }` return | ✅ Consistent non-throwing |

### Dependencies

| Dependency | Package | Coupling | Assessment |
|-----------|---------|----------|------------|
| Express | API | High | Expected, standard |
| Supabase JS | API, Worker | High | Core DB/auth, well-abstracted behind services |
| pino | API, Worker | Medium | Logger, replaceable |
| Next.js | Web | High | Framework, expected |
| MCT SDK | Web | High | First-party, managed |
| Nodemailer | API, Worker | Medium | Email, replaceable |
| Stripe SDK | API | Low | Only billing, isolated |
| Playwright | Web (E2E) | Low | Test-only |

---

## 3. System Architecture

### Design Patterns — Consistency Assessment

**Strengths:**
- Layered middleware architecture — security first, business logic last
- Two-phase data fetching in portal layout (parallel + dependent parallel)
- Server/client API split with `"server-only"` guard
- Factory + Registry in worker for clean dispatch
- Compound endpoints explicitly address N+1 patterns

**Inconsistencies:**
- Route handler error handling: some use try/catch + `next(error)`, some rely on `requireAuth`/`requireAdmin` calling `next(error)` internally, some use `failure()` inline, some let errors bubble to global handler. All three paths converge in the global error handler, but the inconsistency increases review burden.
- Portal subnav vs admin subnav — near-duplicate code (~85% overlap)
- Portal breadcrumbs vs admin breadcrumbs — character-for-character duplicate (100%)

### Coupling & Cohesion

| Module | Cohesion | Coupling | Assessment |
|--------|----------|----------|------------|
| Route handlers | **High** — one entity per file | **Low** — depends on middleware + Supabase | ✅ |
| Middleware | **High** — single responsibility | **Low** — standalone functions | ✅ |
| SDK modules | **High** — one API domain per file | **Low** — depends only on ApiClient | ✅ |
| AdminDocumentsCenterClient.tsx | **Low** — 1297 lines, 8+ concerns | **High** — all document ops in one file | ⚠️ **Needs split** |
| Portal layout | **Medium** — auth + org + notifs + branding | **High** — 6 data fetches | ⚠️ **Too many concerns** |

### Error Handling & Resilience

**Strengths:**
- Global error handler → Sentry → structured JSON
- `AppError` with typed HTTP status codes
- `failure()` helper for consistent error shape
- Zod validation on 7 key mutation endpoints
- Stripe webhook: `express.json({ verify })` + `constructEvent()` — signed payloads
- Worker SQS: delete only on `result.ok === true` — prevents data loss
- SDK: exponential backoff retry with timeout + AbortError detection

**Gaps:**
- No health endpoint for worker in Terraform (ECS doesn't health-check the worker)
- Audit logging is fire-and-forget (insert errors logged to `console.error`, not retried)
- No circuit breaker for external service failures (Stripe, Jira, JSM, M365 retry until SQS max receive)
- Input sanitizer is custom regex (purpose-built library like DOMPurify would be more robust)

### Scalability Bottlenecks

| Bottleneck | Severity | Location | Rationale |
|-----------|----------|----------|-----------|
| Single API ECS task (desired=1, max=3) | 🟡 Medium | runtime.tf | Autoscaling at CPU > 60%, initial capacity 1 |
| Single Worker ECS task (desired=1, max=3) | 🟡 Medium | runtime.tf | Single-threaded SQS consumer per task |
| Supabase Postgres (16GB max) | 🟡 Medium | Supabase managed | No read replicas configured |
| 3 route-group error.tsx files | 🟢 Low | Web app | Duplicated ~35-line components |

---

## 4. Infrastructure & Deployment Topology

### Containerization

All 3 Dockerfiles follow a consistent, security-conscious pattern:
- **Base:** `node:20-alpine`
- **Multi-stage:** deps → build → runtime
- **Non-root user:** `appuser` (UID 1001)
- **pnpm via corepack:** `corepack enable && corepack prepare pnpm@10 --activate`
- **Runtime stage:** `pnpm install --frozen-lockfile --filter=./apps/xxx --prod`

### IaC Resource Map (Terraform)

```
AWS:
├── VPC (10.0.0.0/16) → 2 public subnets (ALB) + 2 private subnets (Fargate)
├── NAT Gateway → outbound for private subnets
├── Security Groups: alb (80/443), api (3001 from ALB), worker (egress-only)
├── ALB → HTTPS (TLS 1.2-1.3) + HTTP→HTTPS redirect
├── Target Group → ECS API (port 3001, /health)
├── ECS Cluster → 2 Fargate services (API 256/512, Worker 256/512)
├── Autoscaling (1-3 @ CPU > 60%)
├── ECR (api MUTABLE ⚠️, worker IMMUTABLE)
├── SQS FIFO (jobs + DLQ)
├── IAM: ecs-execution, ecs-task, slack-notifier Lambda
├── ACM cert (compute.tf — potentially dead resource)
└── CloudWatch: 7 alarms → SNS → email + Slack

Vercel:
├── Project: mainecybertech-portal-{dev,prod}
├── Root Directory: apps/web
├── NEXT_PUBLIC_API_URL env var
└── Domains: www/app.mainecybertech.{com,us}

Supabase:
├── Project per env (dev/prod naming)
└── Storage: documents (private, 50MB), avatars (public, 2MB)

Cloudflare:
├── Production zone: 4 CNAME records
├── Test zone: 2 CNAME records (www/app missing from Terraform)
└── Proxy: configurable per record

GitHub OIDC:
├── terraform role (main branch scope)
└── deploy role (main branch scope)
```

### CI/CD Pipeline

```
push main → path filter → validate.yml (test+lint+typecheck)
                         → e2e.yml (Playwright)
                         → supabase-migrations.yml
                         → prod-approval environment (MANUAL)
                         → deploy (Vercel / ECS)

push develop → path filter → validate.yml → dev environment → deploy
```

### Infrastructure Security Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | **S3 IAM policy scoped to `["*"]`** — ECS task role can read/write/delete any S3 bucket | `network.tf:92` | 🔴 **Critical** |
| 2 | **API ECR repo tag mutability = MUTABLE** — non-reproducible builds, tag poisoning (AGENTS.md incorrectly claims this was fixed) | `compute.tf:101` | 🔴 **Critical** |
| 3 | **`:latest` image tag in task definitions** — non-deterministic deployments despite CI using `${{ github.sha }}` | `runtime.tf:277,311` | 🟡 High |
| 4 | **ECS Exec enabled by default** — interactive shell access to production containers | `variables.tf:167` | 🟡 High |
| 5 | **Terraform prod apply has NO gating** — no validate, E2E, migrations, or approval environment | `terraform-apply.prod.yml` | 🔴 **Critical** |
| 6 | **No VPC Flow Logs** — no network audit trail | `network.tf` | 🟡 Medium |
| 7 | **No WAF on ALB** — internet-facing with only optional Cloudflare proxy mitigation | `runtime.tf` | 🟡 Medium |
| 8 | **Database user hardcoded as `postgres` superuser** — app connects as superuser | `secrets.tf:73` | 🟡 Medium |
| 9 | **ACM cert resource may be dead code** — created but separate variable used instead | `compute.tf:84` vs `runtime.tf:125` | 🟢 Low |

---

## 5. In-Repo Documentation & Knowledge Management

### Root File Audit

**23 of 26 root `.md`/`.txt` files are empty stubs** — only `CONTRIBUTING.md`, `README.dev.md`, and `SECURITY.md` have content. The rest are planning artifacts superseded by AGENTS.md.

| Classification | Count | Files |
|---------------|-------|-------|
| **ACTIVE** | 3 | `CONTRIBUTING.md`, `README.dev.md`, `SECURITY.md` |
| **STALE planning artifacts** | 15 | `ACTION_PLAN.md`, `CLEANUP_AND_CONSOLIDATION_PLAN.md`, `CLEANUP_PASS_2_ACTIONS.md`, `CLEANUP_PASS_2_INDEX.md`, `CRITICAL_FIXES_REQUIRED.md`, `DEPLOYMENT_OPTIONS_COMPARISON.md`, `DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md`, `DOCUMENTATION_INDEX.md`, `GITHUB_LAUNCH_STATUS.md`, `NEXT_STEPS_PRODUCTION.md`, `QUICK_FIXES_SUMMARY.txt`, `QUICK_START_CLEANUP.md`, `QUICK_START_DEPLOYMENT.md`, `README_CLEANUP_PASS_2.md`, `README_COMPLETE_GUIDE.md`, `SETUP_REVIEW_ADVICE.md` |
| **STALE historical/audit** | 5 | `ANALYSIS_SUMMARY.md`, `AUDIT_SUMMARY.txt`, `CODEBASE_MAPPING.md`, `FULL_AUDIT_REPORT.md`, `IMPLEMENTATION_SUMMARY.md`, `INTEGRATION_FINDINGS.md`, `PRE_PRODUCTION_AUDIT_FINDINGS.md` |

### Environment Variable Drift

**ENVIRONMENT_VARIABLES.md vs actual code:**

| Claim | Actual | Verdict |
|-------|--------|---------|
| `API_BASE_URL` is an API env var | Not in API schema — it's a Worker-only var | 🔴 **False claim** |
| `SUPABASE_URL` is Required for Worker | Schema: `z.string().url().optional()` | 🔴 **Wrong** |
| `HEALTH_PORT` is a Worker var (default 3001) | Not in Zod schema — reads `process.env` directly | 🟡 **Schema incomplete** |
| `SENTRY_ORG`, `SENTRY_PROJECT` are Web vars | Never referenced anywhere in web app | 🔴 **Fictitious vars** |
| `STRIPE_SECRET_KEY` missing from API table | IS in env schema | 🟡 **Missing from table** |

### GAP_ANALYSIS.md — Stale Items

| Item | Claim | Reality |
|------|-------|---------|
| #6 "No loading skeletons" | Medium gap | ✅ Implemented |
| #7 "No global-error.tsx" | Low gap | ✅ Implemented |
| #8 "No bundle analyzer" | Low gap | ✅ Implemented |
| #9 "No favicon" | Low gap | ✅ Implemented |
| #8 "Admin billing viewer" | Still Open | ✅ Implemented |
| #9 "Admin document upload" | Still Open | ✅ Implemented |

### INDEX.md — Broken Links

- `docs/ANALYSIS_SUMMARY.md` — moved to `archive/stale-docs/` (404)
- `docs/CODEBASE_MAPPING.md` — moved to `archive/stale-docs/` (404)

### AGENTS.md — Internal Contradiction

Admin billing viewer and admin document upload listed as both **✅ Done** (lines 410-411) and **"Still Open"** (lines 524-525) in different sections.

---

## 6. Code & Asset Cleanup

### Dead Code (Never Imported)

| File | Lines | Reason |
|------|-------|--------|
| `apps/web/components/portal/ErrorBoundary.tsx` | 47 | Class-based, never imported |
| `apps/web/components/SentryErrorBoundary.tsx` | 43 | Class-based with Sentry, never imported |
| `apps/web/components/FileDropzone.tsx` | 83 | Drag-and-drop upload, never imported |
| `apps/web/components/admin/ConfirmDangerButton.tsx` | 46 | Never imported (ConfirmIntentButton used instead) |
| `apps/web/components/admin/TaskOrderEditor.tsx` | 61 | Never imported |
| `apps/web/lib/auth/bootstrap.ts` | 7 | Empty `{ // TODO: Implement module }` stub |
| `apps/web/lib/sentry.ts` | 21 | `initBrowserSentry()` / `captureError()` never imported |
| `apps/web/app/(portal)/portal/template.tsx` | 7 | No-op wrapper |
| `apps/web/app/(admin)/admin/.gitkeep` | 0 | Unnecessary |
| **Total** | **~315** | **9 files** |

### Redundancy & Duplication

| Pair | Lines Each | Overlap | Recommendation |
|------|-----------|---------|---------------|
| `PortalBreadcrumbs` vs `AdminBreadcrumbs` | 38/38 | **100%** | Merge into shared `Breadcrumbs` |
| `PortalSubnav` vs `AdminSubnav` | 28/31 | ~85% | Share base, pass items as props |
| `PortalHeaderActions` vs `AdminHeaderActions` | 28/18 | ~60% | Share base component |
| `PortalGlobalSearch` vs `AdminGlobalSearch` | 101/132 | ~45% | Share search infra |
| `(portal)/loading.tsx` vs `(admin)/loading.tsx` | 37/28 | ~70% | Share skeleton component |
| 3 route-group `error.tsx` files | 35-37 | ~80% | Use shared ErrorPage |

### Monolithic Component

| Component | Lines | Issues |
|-----------|-------|--------|
| `AdminDocumentsCenterClient.tsx` | **1297** | Handles create/read/update/delete, bulk ops, search, sort, filter, drawer, 3+ views → **needs decomposition** |

### Unused Dependency

| Package | Issue | Location |
|---------|-------|----------|
| `react` in `packages/ui` | `cn()` utility doesn't use React | `packages/ui/package.json` |

### Commented-Out Code

- `apps/web/jest.setup.ts:3-11` — 9 lines of `global.console` suppression (commented out)
- No other blocks >5 lines found

### Dependency Bloat

**None found.** The dependency tree is lean:
- API: 12 runtime deps
- Web: 11 runtime deps
- Worker: Minimal (Supabase, pino, Nodemailer)
- SDK: **Zero** runtime dependencies (native `fetch`)

---

## Critical Observations & Vulnerabilities

| # | File/Module | Category | Description | Recommended Remediation |
|---|-------------|----------|-------------|------------------------|
| 1 | `network.tf:92` | **Security** | ECS task IAM policy allows `s3:*` on `["*"]` — any S3 bucket accessible | Scope to specific bucket ARNs |
| 2 | `compute.tf:101` | **Security** | API ECR repo has `MUTABLE` tag (AGENTS.md incorrectly claims it was fixed) | Change to `IMMUTABLE` to match Worker repo |
| 3 | `runtime.tf:277,311` | **Security** | Task definitions reference `:latest` tag | Pin to git SHA tag via SSM or CI variable |
| 4 | `terraform-apply.prod.yml` | **Security/CI** | Terraform prod apply has NO gating — no validate, E2E, migrations, or approval env | Add `needs: [validate, e2e, migrations]` + change env to `prod-approval` |
| 5 | `e2e.yml` | **Performance** | E2E runs on every push/PR with no path filter | Add path filters to direct triggers |
| 6 | `terraform-*.dev.yml` | **Performance** | Terraform dev runs on EVERY PR/push (no path filter) | Add `paths: ['infra/terraform/**']` |
| 7 | `docs/ENVIRONMENT_VARIABLES.md` | **Doc Drift** | 4 incorrect/fake env var claims | Remove fake vars, fix wrong claims |
| 8 | `docs/GAP_ANALYSIS.md` | **Doc Drift** | 4+ resolved items marked as gaps; 2 done items marked "Still Open" | Update to match reality |
| 9 | `docs/INDEX.md` | **Doc Drift** | 2 broken links to archived docs | Remove or update links |
| 10 | Root 23 empty .md/.txt | **Cleanup** | 23 stale planning stubs in root directory | Archive to `archive/stale-root-docs/` |
| 11 | `AdminDocumentsCenterClient.tsx` (1297 lines) | **Cleanup** | Monolithic, 8+ responsibilities | Split into focused components |
| 12 | PortalBreadcrumbs vs AdminBreadcrumbs (100% dup) | **Cleanup** | Identical code in 2 files | De-duplicate into shared component |
| 13 | PortalSubnav vs AdminSubnav (~85% dup) | **Cleanup** | Same render logic, different items | Extract shared base with items prop |
| 14 | 3 route-group error.tsx (~80% dup) | **Cleanup** | Near-identical error pages | Use shared ErrorPage component |
| 15 | 9 dead code files (~315 lines) | **Cleanup** | Never imported: ErrorBoundary, SentryErrorBoundary, FileDropzone, ConfirmDangerButton, TaskOrderEditor, bootstrap.ts, sentry.ts, template.tsx, .gitkeep | Remove dead files |
| 16 | `packages/ui` depends on `react` | **Cleanup** | `cn()` utility doesn't use React | Remove from deps |
| 17 | `apps/web/lib/auth/bootstrap.ts` | **Dead Code** | Empty `// TODO` stub, never imported | Remove file |
| 18 | AGENTS.md internal contradiction | **Doc Drift** | Same features listed as ✅ Done and "Still Open" | Unify status across doc |
| 19 | `secrets.tf:73` | **Security** | DATABASE_URL uses hardcoded `postgres` superuser | Create dedicated app user |
| 20 | `variables.tf:167` ECS Exec default=true | **Security** | Default allows interactive shell to containers | Default false for prod |
| 21 | 3 `any` type annotations in SDK/Worker | **Type Safety** | Minor, non-blocking | Use proper types |
| 22 | Worker health server not in Terraform | **Monitoring** | Worker has port 3001 health check but no ALB TG | Add to monitoring or document |
| 23 | `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | **Doc Drift** | May reference stale Vercel flow | Verify matches current `vercel pull + deploy` |

---

## Overall Assessment

| Domain | Score | Key Issues |
|--------|-------|------------|
| **Security** | ⚠️ 6/10 | S3 `*`, MUTABLE ECR, superuser DB, no WAF, ECS Exec default |
| **Resilience** | ⚠️ 7/10 | No circuit breaker, fire-and-forget audit, no worker health check in infra |
| **Code Quality** | ⚠️ 7/10 | 9 dead files (~315 lines), 5 near-duplicate components, 1 monolithic component |
| **Testing** | ✅ 9/10 | 728 tests, but Worker lacks handler sync logic tests |
| **CI/CD** | ⚠️ 7/10 | Terraform prod has no gating; E2E/Terraform dev have no path filters |
| **Documentation** | ⚠️ 5/10 | 23 empty stale root files; 4+ wrong env var claims; AGENTS.md self-contradicts; GAP_ANALYSIS.md stale |
| **Infrastructure** | ⚠️ 7/10 | Solid Terraform foundation, but 4 critical security gaps remain |

### What's Excellent
- ✅ Clean monorepo structure (Turborepo, 3 apps + 3 packages)
- ✅ Well-ordered middleware chain with security-first design
- ✅ SDK with zero runtime dependencies, retry logic, and comprehensive tests (108)
- ✅ Worker with registry pattern, 5 task handlers, and graceful shutdown
- ✅ Server/client API split with `"server-only"` guard
- ✅ Compound endpoints addressing N+1 queries
- ✅ All 3 Dockerfiles follow non-root, multi-stage best practices
- ✅ 18 CI/CD workflows with consistent pnpm setup
- ✅ Production app deployments fully gated (validate + E2E + migrations + approval)
- ✅ OIDC-based AWS auth (no long-lived keys)

### What Needs Immediate Attention
- 🔴 4 critical security gaps in Terraform (S3 *, MUTABLE ECR, no terraform prod gate, superuser DB)
- 📄 23 empty stale root files + 4 wrong env var claims + 2 broken INDEX.md links + stale GAP_ANALYSIS.md
- 🧹 9 dead code files + 5 near-duplicate component pairs + 1 monolithic 1297-line component
