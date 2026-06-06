# 📋 Maine CyberTech Portal - Complete Codebase Mapping & Analysis

> **⚠️ Historical document.** This was written during the initial build-out. The codebase has changed significantly since then. See `AGENTS.md` for current architecture, test counts, and file inventory. Key differences:
> - **packages/sdk/**: Was empty → Now fully built with 11 resource classes and retry logic
> - **packages/types/**: Planned → **Removed** (empty package)
> - **lib/ directory**: Listed as active → **Deleted** (unused stubs removed)
> - **Worker tasks**: Listed as TODOs → **5 task handlers** implemented
> - **Terraform**: Described as empty → **12 .tf files** complete
> - **CI/CD**: 6 workflows listed → **17 workflows** active
> - **build.yml**, **api-deploy-ecs.yml**, **worker-deploy-ecs.yml**: Listed → **Removed** (replaced by env-specific variants)

## Overview

This document provides a comprehensive map of every significant file and directory in the Maine CyberTech Portal monorepo, what they do, why they're needed, and cleanup recommendations.

**Repository**: Maine CyberTech Portal (Monorepo)  
**Architecture**: Turborepo + pnpm workspaces  
**Languages**: TypeScript, React, Node.js  
**Database**: Supabase (PostgreSQL)

---

## 📁 Directory Structure & File Inventory

### Root Level Files

| File | Purpose | Status | Size |
|------|---------|--------|------|
| `package.json` | Root workspace config, shared scripts, monorepo coordination | ✅ Active | - |
| `pnpm-workspace.yaml` | Defines pnpm workspace (apps/*, packages/*) | ✅ Active | - |
| `turbo.json` | Turborepo build orchestration & caching | ✅ Active | - |
| `AGENTS.md` | Agent context: progress, constraints, test patterns | ✅ Active | - |
| `README.md` | Main project documentation | ✅ Active | - |
| `README.dev.md` | Developer setup guide | ✅ Active | - |
| `README.merged.complete.md` | Consolidated architecture doc (historical) | ⚠️ Archived | - |
| `pnpm-lock.yaml` | Dependency lock file (auto-generated) | ✅ Active | ~2MB |
| `docker-compose.yml` | Local development stack (api + web + worker + e2e) | ✅ Active | - |
| `.gitignore` | Git exclusion rules | ✅ Active | - |
| `CONTRIBUTING.md` | Contribution guidelines | ✅ Active | - |
| `SECURITY.md` | Security policy | ✅ Active | - |
| `LICENSE` | ISC license | ✅ Active | - |

---

## 🚀 Applications

### 1. `apps/api/` - Express.js REST API

**Purpose**: Backend service providing REST endpoints for portal functionality

**Key Files**:
```
apps/api/
├── src/
│   ├── main.ts              # API entry point (11 lines)
│   ├── app.ts               # Express app setup, middleware chain (71 lines)
│   ├── config/
│   │   └── env.ts           # Zod env schema validation
│   ├── routes/              # 14 route files (auth, users, projects, etc.)
│   ├── middleware/           # 6 middleware files (auth, admin, rate-limit, etc.)
│   ├── services/            # Supabase client + audit logging
│   ├── validators/          # Zod schemas for request validation
│   ├── types/               # TypeScript types + error helpers
│   └── __tests__/           # 22 test files (155 tests)
├── eslint.config.js         # ESLint 9.x flat config
├── jest.config.js           # Test configuration
├── Dockerfile               # Docker container spec
├── package.json             # Dependencies & scripts
└── tsconfig.json            # TypeScript config
```

**Dependencies**:
- `express` - HTTP server framework
- `@supabase/supabase-js` - Database & auth client
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - API rate limiting (100 req/15 min IP, 200 req/15 min user)
- `pino` - Structured logging
- `zod` - Runtime validation
- `multer` - File upload handling

**Features Implemented**:
- ✅ Health check endpoint with DB dependency check
- ✅ Dashboard API (`GET /api/v1/dashboard/summary`)
- ✅ Rate limiting (global IP + per-user token-based)
- ✅ CORS configuration
- ✅ Structured logging with request ID correlation
- ✅ Centralized error handling
- ✅ Environment validation (Zod schema)
- ✅ Security headers (CSP, XSS protection, HSTS)
- ✅ Input sanitization (XSS + SQL injection prevention)
- ✅ Response caching for read-heavy endpoints
- ✅ Request ID middleware (UUID4, passthrough X-Request-ID)
- ✅ OpenAPI/Swagger docs at `/api/v1/docs`
- ✅ Supabase Auth integration
- ✅ Supabase Storage for document uploads

**Status**: ✅ **PRODUCTION-READY**  
**Port**: 4000  
**Scripts**: `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `test:coverage`, `typecheck`

---

### 2. `apps/web/` - Next.js Frontend Application

**Purpose**: Customer portal and admin dashboard

**Key Files**:
```
apps/web/
├── app/
│   ├── (admin)/                # Admin dashboard routes (23 files)
│   │   ├── dashboard/          # Admin overview
│   │   ├── users/              # User management
│   │   ├── tickets/            # Ticket management
│   │   ├── projects/           # Project administration
│   │   ├── organizations/      # Organization settings
│   │   ├── documents/          # Document management
│   │   ├── audit-logs/         # Activity logs
│   │   └── approvals/          # Approval workflow
│   ├── (portal)/               # Customer portal (16 files)
│   │   ├── dashboard/          # Customer overview
│   │   ├── projects/           # Customer projects view
│   │   ├── documents/          # Document access
│   │   └── support/            # Support tickets
│   ├── (public)/               # Public pages (auth, landing)
│   │   ├── login
│   │   ├── signup
│   │   ├── password-reset
│   │   └── layout.tsx
│   ├── auth/
│   │   └── callback/           # OAuth callback handler
│   └── layout.tsx              # Root layout
├── components/                 # React components
├── lib/
│   ├── auth/                   # Authentication utilities
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── membership.ts
│   └── supabase/               # Database layer
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── package.json                # Dependencies & scripts
├── jest.config.js              # Test configuration
├── jest.setup.ts               # Test setup (React Testing Library)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── .env.example                # Environment template
```

**Dependencies**:
- `next` - React framework with SSR/SSG
- `react` / `react-dom` - UI library
- `@supabase/ssr` - Server-side rendering auth
- `@supabase/supabase-js` - Database client
- `tailwindcss` - CSS framework
- `lucide-react` - Icon library
- `clsx` / `tailwind-merge` - CSS utilities
- `zod` - Type validation

**Features**:
- ✅ Admin dashboard (users, tickets, projects, orgs)
- ✅ Customer portal (dashboard, projects, support)
- ✅ Authentication system (Supabase JWT)
- ✅ Server-side rendering (SSR)
- ✅ Static generation (SSG)
- ✅ Responsive design (Tailwind)
- ✅ Type-safe components (TypeScript)
- ✅ RLS policy integration

**Status**: ✅ **PRODUCTION-READY**  
**Port**: 3000  
**Scripts**: `dev`, `build`, `start`, `lint`, `test`, `typecheck`

---

### 3. `apps/worker/` - Node.js Background Worker

**Purpose**: Asynchronous background job processing with SQS consumer

**Key Files**:
```
apps/worker/
├── src/
│   ├── main.ts              # Worker entry point: task registry, SQS consumer, health server (268 lines)
│   └── tasks/               # 5 task handler files
│       ├── stripe-reconcile.ts
│       ├── jira-sync.ts
│       ├── jsm-sync.ts
│       ├── m365-calendar-sync.ts
│       └── scheduled-notifications.ts
├── eslint.config.js         # ESLint 9.x flat config
├── Dockerfile               # Container spec
├── package.json             # Dependencies & scripts
└── tsconfig.json            # TypeScript config
```

**Dependencies**:
- `@supabase/supabase-js` - Database client
- `@aws-sdk/client-sqs` - SQS queue consumer
- `pino` - Logging
- `zod` - Environment validation
- `dotenv` - Env loading

**Implemented Tasks**:
- ✅ Stripe reconciliation (checks subscription status, suspends inactive)
- ✅ Jira sync (syncs task status from Jira issues)
- ✅ JSM sync (imports JSM tickets as portal tickets)
- ✅ M365 calendar sync (creates calendar events for task due dates)
- ✅ Scheduled notifications (task-due, membership-approved, ticket-responded)

**Configuration**:
- `WORKER_CONCURRENCY` - Parallel job limit (default: 10)
- `WORKER_TIMEOUT` - Job timeout in ms (default: 30000)
- `SQS_QUEUE_URL` - SQS queue URL for receiving tasks

**Status**: ✅ **PRODUCTION-READY**  
**Scripts**: `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `test:coverage`, `typecheck`

---

## 📦 Shared Packages

### 1. `packages/config/` - Configuration Sharing

**Purpose**: Centralized ESLint and TypeScript configurations

**Files**:
```
packages/config/
├── package.json                # Scoped as @mct/config
├── eslint.js                   # Shared ESLint rules
└── tsconfig.json               # Shared TypeScript base config
```

**ESLint Rules**:
- Target: `src/**/*.{ts,tsx,js}`
- `no-console: warn` (allow warn/error)
- `@typescript-eslint/no-unused-vars: error`

**TypeScript Base Config**:
- Target: ES2020
- Module: ESNext
- Strict mode: ✅ enabled
- Bundler resolution: ✅ enabled

**Status**: ✅ **ACTIVE & USED**

---

### ~~2. `packages/types/` - TypeScript Types~~ **(REMOVED)**

This package was empty and has been deleted. All types are defined locally in each package.

---

### 3. `packages/ui/` - React Components Library

**Purpose**: Shared UI components across applications

**Files**:
```
packages/ui/
├── package.json                # Scoped as @mct/ui
├── src/
│   ├── index.ts                # Re-exports main exports
│   └── lib/
│       └── cn.ts               # Classname utility function
└── .gitkeep
```

**Current State**:
- ✅ `cn()` utility function (Tailwind class merging)
- 🔴 **NO reusable components**

**Recommendation**:
- [ ] Move reusable components here (Button, Input, Modal, etc.)
- [ ] Create component library documentation
- [ ] Define component API patterns

**Status**: 🟡 **MINIMAL - MOSTLY PLACEHOLDER**

---

### 4. `packages/sdk/` - SDK Package

**Purpose**: Typed API client for consuming the MCT REST API

**Files**:
```
packages/sdk/
├── src/
│   ├── index.ts              # MCTClient class with 11 resource APIs
│   ├── client.ts             # ApiClient with retry logic + timeout
│   ├── types.ts              # API interfaces (Project, Ticket, Document, etc.)
│   ├── auth.ts               # Authentication API
│   ├── users.ts              # Users API
│   ├── profiles.ts           # Profiles API
│   ├── organizations.ts      # Organizations API
│   ├── memberships.ts        # Memberships API
│   ├── projects.ts           # Projects API (includes getDetail)
│   ├── tickets.ts            # Tickets API
│   ├── dashboard.ts          # Dashboard API
│   ├── documents.ts          # Documents API
│   ├── audit.ts              # Audit log API
│   └── roles.ts              # Roles API
├── jest.config.js            # Test configuration
└── package.json              # Scoped as @mct/sdk
```

**Features**:
- ✅ 11 resource classes covering all API endpoints
- ✅ Retry logic with exponential backoff (configurable)
- ✅ Request timeout via AbortController (default 30s)
- ✅ Bearer token authentication
- ✅ Compound detail endpoints (getDetail)

**Tests**: 89 tests covering all resource classes and retry logic

**Status**: ✅ **PRODUCTION-READY**

---

## 🛠️ Infrastructure & Configuration

### `.github/workflows/` - CI/CD Pipelines

```
.github/workflows/
├── lint.yml                    # ESLint checks
├── test.yml                    # Jest unit tests (Node 18.x, 20.x)
├── typecheck.yml               # TypeScript type checking
├── validate.yml                # Reusable gate (test + lint + typecheck)
├── e2e.yml                     # Playwright E2E tests (workflow_call)
├── web-preview.yml              # PR web build validation
├── supabase-migrations.yml      # Database migrations (workflow_call)
├── api-deploy-ecs.dev.yml       # Deploy API to ECS dev
├── api-deploy-ecs.prod.yml      # Deploy API to ECS prod (validate + approval)
├── worker-deploy-ecs.dev.yml    # Deploy worker to ECS dev
├── worker-deploy-ecs.prod.yml   # Deploy worker to ECS prod (validate + approval)
├── web-dev-vercel.yml           # Deploy web to Vercel preview
├── web-prod-vercel.yml          # Deploy web to Vercel prod (validate + approval)
├── terraform-plan.dev.yml       # Terraform plan (dev)
├── terraform-plan.prod.yml      # Terraform plan (prod)
├── terraform-apply.dev.yml      # Terraform apply (dev)
└── terraform-apply.prod.yml     # Terraform apply (prod)
```

**Status**: ✅ **COMPLETE** — All deploy workflows use OIDC, ECR login, ECS stability waits, and prod-approval gate

---

### `infra/terraform/` - Infrastructure as Code

**Status**: ✅ **FULLY POPULATED** — 12 .tf files + backend configs

```
infra/terraform/
├── providers.tf               # AWS, Vercel, Supabase, Cloudflare providers
├── backend.tf                 # S3 backend config
├── variables.tf               # All input variables
├── network.tf                 # VPC, subnets, security groups, IAM roles
├── compute.tf                 # SQS, ACM cert, ECR repos
├── runtime.tf                 # ECS cluster, ALB, Fargate tasks, autoscaling
├── supabase.tf                # Supabase project + storage buckets
├── secrets.tf                 # SSM Parameter Store for all secrets
├── vercel.tf                  # Vercel project + env vars
├── dns.cloudflare.tf          # Cloudflare DNS records
├── github-oidc.tf             # GitHub OIDC provider + IAM roles
├── outputs.tf                 # All outputs (30+)
├── terraform.tfvars.example   # Example variable values
└── env/                       # Environment-specific configs
    ├── backend.dev.hcl
    └── backend.prod.hcl
```

**Key Features**:
- ✅ Dev/prod environment separation via `environment` variable
- ✅ SSM Parameter Store for secrets (7 parameters)
- ✅ ECS Fargate with autoscaling and health checks
- ✅ Supabase project + storage buckets (documents, avatars)
- ✅ Cloudflare DNS management
- ✅ GitHub OIDC for CI/CD authentication

---

### `supabase/` - Database Configuration

```
supabase/
├── config.toml                # Main project config
├── config.toml.example        # Template
├── config.toml.production.example
├── migrations/                # Database migration files
├── seeds/                     # Seed data (auth users, sample data)
├── patches/                   # Database patches (empty)
├── policies/                  # RLS policies (empty)
├── functions/                 # Edge functions (empty)
└── .branches/                 # Branch metadata
```

**Status**: ✅ **ACTIVE**

---

## 📚 Documentation

### `docs/` Directory

The `docs/` directory contains 30+ documentation files covering setup, architecture, deployment, operations, and reference. Key documents:

| Document | Purpose |
|----------|---------|
| `docs/INDEX.md` | Canonical documentation index |
| `docs/README.dev.md` | Developer setup guide |
| `docs/ENVIRONMENT_VARIABLES.md` | All env vars across all services |
| `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | Required secrets/variables |
| `docs/ROLLBACK_PROCEDURES.md` | Rollback procedures |
| `docs/MONITORING_AND_ALERTING.md` | Monitoring strategy |
| `docs/SECRETS_ROTATION.md` | Secrets policy |
| `docs/API_RATE_LIMITING.md` | Rate limiting docs |

**Status**: ✅ **COMPREHENSIVE**

---

## 🧹 Cleanup Status

Most cleanup items from the initial build-out have been completed:

| Item | Status |
|------|--------|
| Remove Old/ migration directories | ✅ Done (no Old/ dirs exist) |
| Remove stale script files | ✅ Done (12 stale files removed) |
| Remove unused packages (jsonwebtoken, supabase-cli, pg) | ✅ Done |
| Remove lib/ directory | ✅ Done (was empty stubs) |
| Remove packages/types/ | ✅ Done (was empty) |
| Populate packages/sdk/ | ✅ Done (89 tests, 11 resource classes) |
| Implement worker tasks | ✅ Done (5 task handlers) |
| Complete Terraform IaC | ✅ Done (12 .tf files) |
| Complete CI/CD deployment workflows | ✅ Done (17 workflows) |

**Status**: ✅ **WELL-DOCUMENTED**

**Cleanup Needed**:
- [ ] Clarify intent of `attach_real_users.no_temp.sql` (rename or delete)

---

## 📚 Documentation

### `docs/` Directory

```
docs/
├── IMPLEMENTATION_SUMMARY.md                   # Recent implementations (277 lines)
├── msp_portal_final_handoff.zip                # 🔴 **CLEANUP** - Duplicate
├── portal_platform_formal_handoff_bundle/      # ✅ Extracted content
│   ├── portal_platform_formal_handoff.docx     # Word document (459 KB)
│   ├── supabase_consolidated_fresh_bootstrap_20260529.sql  # SQL dump (66 KB)
│   ├── 01_system_architecture_diagram.png
│   ├── 02_database_schema_overview.png
│   ├── 03_api_endpoints_structure.png
│   └── 04_deployment_architecture.png
└── (other documentation files)
```

**Status**: ✅ **WELL-DOCUMENTED** (but has duplicate ZIP files)




---

#### 4. Remove Temporary CLI Cache
```bash
# Location: supabase/.temp/
# Issue: Temporary CLI download cache
# Action: Delete entire directory
rm -rf supabase/.temp/
```
**Risk**: ✅ NONE - Auto-regenerated on next CLI use

---

#### 5. Remove Duplicate ZIP Archives
```bash
## 📊 Summary Statistics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Applications** | 3 (api, web, worker) | ✅ |
| **Shared Packages** | 3 (config, ui, sdk) | ✅ |
| **Source Files (TS/TSX/JS)** | ~135 | ✅ |
| **Lines of Code** | ~15,000+ | ✅ |
| **Database Migrations** | 1 active | ✅ |
| **CI/CD Workflows** | 17 | ✅ Complete |
| **Tests** | 695 (API 155, SDK 89, Worker 24, Web 427) | ✅ |
| **Documentation Files** | 30+ | ✅ |
| **Empty Packages** | 0 | ✅ |

## ✅ Production Readiness

| Item | Status | Notes |
|------|--------|-------|
| TypeScript Strict Mode | ✅ | Enabled globally |
| Error Handling | ✅ | Centralized AppError + error handler |
| Logging | ✅ | Pino + request ID correlation |
| Rate Limiting | ✅ | IP-based (100/15min) + per-user (200/15min) |
| Security Headers | ✅ | CSP, HSTS, XSS, X-Frame-Options |
| Input Sanitization | ✅ | XSS + SQL injection prevention |
| Environment Validation | ✅ | Zod schema per service |
| Testing | ✅ | 695 tests, Jest configured |
| CI/CD | ✅ | 17 workflows, validate + approval gates |
| Deployment | ✅ | ECS Fargate + Vercel + Supabase
| Database | ✅ | Migrations ready |
| Documentation | ✅ | Comprehensive |
| Security | ✅ | JWT, RLS, CORS |
| Deployment | ⚠️ | Docker ready, orchestration incomplete |

---

## 🚀 Quick Start Reference

### Install & Setup
```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env.local
```

### Development
```bash
pnpm dev                        # All services
pnpm --filter api dev          # Specific app
pnpm test                       # All tests
pnpm lint                       # ESLint
pnpm build                      # Production build
```

### Ports
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **API Docs**: http://localhost:4000/api/v1/docs

---

## 📝 File Purposes at a Glance

| File/Directory | Purpose | Status |
|---|---|---|
| `apps/api/src/` | Express API with auth, rate limiting, OpenAPI docs | Keep |
| `apps/web/app/` | Next.js App Router pages (admin + portal) | Keep |
| `apps/worker/src/` | Background worker with 5 task handlers | Keep |
| `packages/config/` | Shared ESLint/TypeScript configs | Keep |
| `packages/ui/src/` | cn() utility (Tailwind class merging) | Keep |
| `packages/sdk/src/` | Typed API client with retry logic | Keep |
| `supabase/` | Database migrations, seeds, config | Keep |
| `infra/terraform/` | 12 .tf files for ECS, Vercel, Supabase, Cloudflare | Keep |
| `.github/workflows/` | 17 CI/CD workflows with approval gates | Keep |
| `scripts/` | Local dev utilities (start, teardown, test) | Keep |

---

**Last Updated**: 2026-05-29  
**Next Review**: After cleanup & worker implementation
