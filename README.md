# Maine CyberTech Portal

<p align="center">
  <img src="./docs/handoff/assets/maine_cyber_tech_brand_mark.png" alt="Maine Cyber Tech" width="520" />
</p>

<p align="center">
  <strong>Secure, multi-tenant MSP operations platform</strong>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-platform%20foundation%20ready-059669" />
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-Next.js%2015-000000" />
  <img alt="API" src="https://img.shields.io/badge/api-Express%20%2B%20TypeScript-2563EB" />
  <img alt="Database" src="https://img.shields.io/badge/database-Supabase%20%2B%20PostgreSQL-3ECF8E" />
  <img alt="Security" src="https://img.shields.io/badge/security-RLS%20%2B%20Storage%20Policies-7C3AED" />
</p>

The Maine CyberTech Portal is a modern MSP/client operations platform built as a **Turborepo monorepo** with:

- a **Next.js frontend**
- an **Express API**
- a **Supabase/PostgreSQL backend**
- a **worker framework** for integrations and async jobs

## What it does

The platform is designed to support:

- onboarding
- support tickets
- projects
- secure documents
- contracts
- billing visibility
- chat / messaging
- auditability

## Current status

### Production-ready now

- frontend / web app with complete test coverage (427 tests)
- API / backend with security middleware and OpenAPI docs (155 tests)
- database / RLS foundation
- SDK package with retry logic (89 tests)
- worker framework with 5 task handlers (24 tests)
- Docker images for all services (web, api, worker)
- E2E tests with Playwright
- CI/CD pipelines (test, lint, typecheck, build, deploy, E2E)
- Security hardening (XSS prevention, CSP headers, rate limiting)
- Performance optimization (database indexes, response caching)
- OpenAPI/Swagger documentation

### Still in progress

- shared package consolidation

## Prerequisites

### Development

| Requirement        | Version                | Notes                            |
| ------------------ | ---------------------- | -------------------------------- |
| **Node.js**        | 18+ (20 recommended)   | [nodejs.org](https://nodejs.org) |
| **pnpm**           | 10+                    | `npm install -g pnpm`            |
| **Docker Desktop** | Latest                 | Required for local Supabase      |
| **Supabase CLI**   | Latest                 | `npm install -g supabase`        |
| **PowerShell**     | 5.1+ (Windows) or Bash | For local stack scripts          |

### Production

| Service               | Provider                                   | Required By                                  |
| --------------------- | ------------------------------------------ | -------------------------------------------- |
| **Supabase project**  | [supabase.com](https://supabase.com)       | Database, Auth, Storage                      |
| **AWS account**       | [aws.amazon.com](https://aws.amazon.com)   | ECS (API + Worker), S3, SSM, ALB, CloudWatch |
| **Vercel account**    | [vercel.com](https://vercel.com)           | Web app hosting                              |
| **Stripe account**    | [stripe.com](https://stripe.com)           | Billing (optional)                           |
| **Atlassian account** | [atlassian.com](https://www.atlassian.com) | Jira/JSM sync (optional)                     |
| **Microsoft 365**     | [microsoft.com](https://www.microsoft.com) | Calendar sync (optional)                     |
| **SMTP provider**     | Any                                        | Email notifications (optional)               |
| **Sentry account**    | [sentry.io](https://sentry.io)             | Error tracking (optional)                    |
| **Slack workspace**   | [slack.com](https://slack.com)             | Alarm notifications (optional)               |

### GitHub Secrets Required

See [`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](./docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md) for the full list of 7 secrets and 8 variables needed for CI/CD workflows.

## Quick Start (Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start the full local stack (Supabase + API + Web)
./scripts/start-local-stack.ps1        # Windows
# or
./scripts/start-local-stack.sh         # Linux/macOS

# 3. Open the app
#    Web:  http://localhost:3000
#    API:  http://localhost:4000
#    Studio: http://localhost:54323

# All seed users have password: 1
# superadmin.real@mainecybertech.local — full access
```

## Quick Start (Production)

```bash
# 1. Configure infrastructure
cd infra/terraform
terraform init -backend-config=env/backend.prod.hcl
terraform apply -var-file=env/prod.tfvars

# 2. Deploy services (via GitHub Actions or manual)
#    - Push to main triggers: api-deploy-ecs, worker-deploy-ecs, web-prod-vercel
#    - Run migrations: .github/workflows/supabase-migrations.yml

# 3. Configure domains
#    - Web: app.mainecybertech.com → Vercel
#    - API: api.mainecybertech.com → AWS ALB

# See docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md for the full 7-phase plan
```

## Useful Commands

```bash
pnpm test                    # All unit tests (733)
pnpm e2e                     # E2E tests (125) (125)
pnpm --filter=api dev        # API dev server
pnpm --filter=web dev        # Web dev server (auto-started by Playwright)
pnpm --filter=api typecheck  # TypeScript check
pnpm --filter=web lint       # ESLint
```

## Quick links

- **Developer setup:** [docs/README.dev.md](./docs/README.dev.md)
- **Architectural analysis:** [docs/ARCHITECTURAL_ANALYSIS.md](./docs/ARCHITECTURAL_ANALYSIS.md)
- **Environment variables:** [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)
- **Documentation index:** [docs/INDEX.md](./docs/INDEX.md)
- **Supabase migration workflow:** [docs/SUPABASE_MIGRATION_WORKFLOW.md](./docs/SUPABASE_MIGRATION_WORKFLOW.md)
- **Rollback procedures:** [docs/ROLLBACK_PROCEDURES.md](./docs/ROLLBACK_PROCEDURES.md)
- **Monitoring & alerting:** [docs/MONITORING_AND_ALERTING.md](./docs/MONITORING_AND_ALERTING.md)
- **Secrets rotation:** [docs/SECRETS_ROTATION.md](./docs/SECRETS_ROTATION.md)
- **Deployment plan:** [docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md](./docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md)
- **Production cutover:** [docs/PRODUCTION_CUTOVER_CHECKLIST.md](./docs/PRODUCTION_CUTOVER_CHECKLIST.md)
- **GitHub secrets matrix:** [docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](./docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)
- **Infrastructure as Code:** [infra/terraform/](./infra/terraform/)
- **GitHub secrets matrix:** [docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](./docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md) — includes all 23 SSM parameters

### Infrastructure Gaps Fixed

During a comprehensive audit, 13 gaps were identified and fixed:

- **SSM secrets** — 16 integration secrets (Stripe, Sentry, SMTP, Jira, JSM, M365) added to Terraform with conditional creation
- **ECS injection** — All new secrets wired into `runtime.tf` task definitions + IAM permissions
- **Docker HEALTHCHECK** — Added to worker Dockerfile (port 3001)
- **Web build args** — `NEXT_PUBLIC_API_URL` added as Docker build arg
- **CI/CD gates** — E2E tests now gate all production deploys; validation gates all dev deploys
- **Developer setup:** [docs/README.dev.md](./docs/README.dev.md)
- **Environment variables:** [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)
- **Documentation index:** [docs/INDEX.md](./docs/INDEX.md)
- **Supabase migration workflow:** [docs/SUPABASE_MIGRATION_WORKFLOW.md](./docs/SUPABASE_MIGRATION_WORKFLOW.md)
- **Rollback procedures:** [docs/ROLLBACK_PROCEDURES.md](./docs/ROLLBACK_PROCEDURES.md)
- **Monitoring & alerting:** [docs/MONITORING_AND_ALERTING.md](./docs/MONITORING_AND_ALERTING.md)
- **Secrets rotation:** [docs/SECRETS_ROTATION.md](./docs/SECRETS_ROTATION.md)

## Key Design Decisions

### Auth callback proxy (eliminates Supabase client in web)

The web app never directly talks to Supabase. Instead, the auth callback flow works as follows:

1. User logs in via the web login page, which calls `loginAction` (a Next.js server action)
2. `loginAction` calls the Supabase Auth REST API directly (via `fetch`) to initiate PKCE flow
3. After Supabase redirects back, the web callback at `/auth/callback` forwards the raw `Cookie` header to the API endpoint `POST /api/v1/auth/callback`
4. The API extracts the PKCE code verifier from its own `SUPABASE_URL` ref, exchanges it for a session, and sets the `mct_session` cookie

This means:

- No `@supabase/ssr` library dependency in the web app
- No `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env vars needed in the web build
- All Supabase interactions are centralized in the API layer

### Test patterns

**Mock builder pattern:** A `createMockBuilder` utility creates plain-object mocks with explicit chain methods (`.filter()`, `.maybeSingle()`, `.rpc()`, `.upsert()`) that support `await` via `.then()`. This avoids heavy mocking libraries while keeping tests readable.

**Async server component testing:** Server components are tested by importing the async function, calling it with `await`, then passing the returned JSX to `render()`:

```ts
const { container } = render(await AdminDashboardPage());
expect(container.querySelector("h1")).toHaveTextContent("Dashboard");
```

**Redirect mock:** `next/navigation`'s `redirect()` throws a `"NEXT_REDIRECT"` string at runtime. Tests mock this to throw the same value, preventing execution continuation past the redirect call.

**Bulk action return convention:** Server action functions that operate on multiple items return `{ ok, error }` objects instead of throwing. Tests check the return value directly rather than using `expect(...).rejects`.

**`fireEvent` over `userEvent`:** When pnpm symlink resolution causes issues with `@testing-library/user-event` for specific test file paths, `fireEvent` is used as a fallback. Async state updates are then wrapped in `waitFor`.

**Custom DOM matchers:** Text matching uses `getByText` with exact `textContent` for leaf elements, and `getAllByText(...).length` for text that may appear in ancestor DOM (since custom matchers with `c.includes(...)` match against parent textContent which flattens child nodes).

**Worker testability:** The worker `main.ts` exports `envSchema`, `parseEnv`, and `runWorkerTasks` alongside the same `main()` entrypoint. Tests mock `pino` and `dotenv/config` at module scope to isolate env parsing from actual worker execution.

**Route params in tests:** Server component page tests use `params: Promise.resolve({...})` and `searchParams: Promise.resolve({...})` to match the Next.js App Router's async params contract.

### Docker build considerations

- **`corepack enable` syntax:** Use `corepack enable && corepack prepare pnpm@10 --activate` (not `corepack enable pnpm@10`).
- **`--dts` removed from tsup:** The `--dts` flag causes TS2742 errors in `.pnpm` constrained environments. Declaration files are unnecessary for server packages (API, worker) since they're deployed as standalone services, not consumed as libraries.
- **`output: "standalone"`:** Required in `next.config.mjs` for the Next.js Docker runtime stage. Also set `outputFileTracingRoot` to the monorepo root to silence workspace lockfile warnings.
- **`force-dynamic` on auth pages:** Admin and portal layouts need `export const dynamic = "force-dynamic"` to prevent prerender errors during `next build` (auth-dependent pages can't be statically generated without a session).

## Architecture

```text
Frontend (apps/web)
    ↓
API (apps/api)
    ↓
Supabase / PostgreSQL
    ↓
Worker (apps/worker)
```

## Security model

```text
Auth User → Profile → Membership → Role → Permission / Override → RLS → Storage
```

## Testing

The monorepo includes **695 tests** across all packages. See [AGENTS.md](AGENTS.md) for the current breakdown.

### Running tests

```bash
# All packages
pnpm test

# Single package
pnpm --filter=web test
pnpm --filter=api test
pnpm --filter=@mct/sdk test
pnpm --filter=worker test

# Watch mode
pnpm --filter=web test:watch

# Coverage
pnpm --filter=web test:coverage
```

### E2E tests (Playwright)

```bash
# Install browsers (first time)
pnpm exec playwright install chromium

# Run E2E tests
pnpm --filter=web e2e

# With UI mode
pnpm --filter=web e2e:ui

# With debug
pnpm --filter=web e2e:debug
```

E2E tests are in `apps/web/e2e/` and cover:

- Login, signup, and pending approval flows
- Admin dashboard, users, organizations, projects, tickets, documents
- Portal dashboard, documents, support center
- Not-found pages for unknown resources

## Docker

All services can be containerized via Docker Compose:

```bash
# Build all images
docker compose build

# Build individual service
docker compose build web
docker compose build api
docker compose build worker

# Start all services
docker compose up

# Run E2E tests in container
docker compose run e2e
```

| Service | Image                                  | Size    | Exposed Port |
| ------- | -------------------------------------- | ------- | ------------ |
| web     | `mainecybertech-portal-web`            | ~331 MB | 3000         |
| api     | `mainecybertech-portal-api`            | ~287 MB | 4000         |
| worker  | `mainecybertech-portal-worker`         | ~278 MB | —            |
| e2e     | `mcr.microsoft.com/playwright:v1.60.0` | —       | —            |

The web app uses Next.js `output: "standalone"` for optimized production builds. The API and worker use `tsup` for compilation.

### Environment files

Each service expects a `.env.local` file in its app directory:

- `apps/web/.env.local` — Next.js public vars + API URL
- `apps/api/.env.local` — Supabase URL/service key, server config
- `apps/worker/.env.local` — Supabase URL/service key, worker config

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow                     | Trigger                             | Purpose                                               |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `validate.yml`               | workflow_call                       | Reusable gate: test + lint + typecheck                |
| `test.yml`                   | push/PR main,develop                | Run all unit/integration tests                        |
| `lint.yml`                   | push/PR main,develop                | Lint check                                            |
| `typecheck.yml`              | push/PR main,develop                | TypeScript type checking                              |
| `e2e.yml`                    | push/PR main,develop, workflow_call | Build web, run Playwright E2E tests                   |
| `supabase-migrations.yml`    | push main+develop, workflow_call    | Run Supabase DB migrations                            |
| `api-deploy-ecs.prod.yml`    | push main                           | Deploy API to ECS prod (validate + approval)          |
| `api-deploy-ecs.dev.yml`     | push develop                        | Deploy API to ECS dev                                 |
| `worker-deploy-ecs.prod.yml` | push main                           | Deploy worker to ECS prod (validate + approval)       |
| `worker-deploy-ecs.dev.yml`  | push develop                        | Deploy worker to ECS dev                              |
| `web-prod-vercel.yml`        | push main                           | Deploy web to Vercel production (validate + approval) |
| `web-dev-vercel.yml`         | push develop                        | Deploy web to Vercel preview                          |
| `web-preview.yml`            | PR                                  | Validate web build (no deploy)                        |
| `terraform-plan.prod.yml`    | PR main                             | Plan prod infra changes                               |
| `terraform-apply.prod.yml`   | push main                           | Apply prod infra                                      |
| `terraform-plan.dev.yml`     | PR develop                          | Plan dev infra changes                                |
| `terraform-apply.dev.yml`    | push develop                        | Apply dev infra                                       |

## License

ISC
#   t r i g g e r 
 
 

 
 
