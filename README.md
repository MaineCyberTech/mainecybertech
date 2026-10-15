# Maine CyberTech Portal

<p align="center">
  <strong>Maine CyberTech</strong>
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

- frontend / web app with complete test coverage (2,026 tests)
- API / backend with security middleware and OpenAPI docs (1,993 tests)
- database / RLS foundation (160 migrations)
- SDK package with retry logic (325 tests)
- worker framework with 28 registered task handlers (311 tests)
- Docker images for all services (web, api, worker)
- E2E tests with Playwright (91 spec files)
- CI/CD pipelines (test, lint, typecheck, build, deploy, E2E)
- Security hardening (XSS prevention, CSP headers, rate limiting)
- Performance optimization (database indexes, response caching)
- OpenAPI/Swagger documentation
- shared packages consolidated: `packages/sdk` (typed API client), `packages/ui` (components + tokens), `packages/config` (shared ESLint/TypeScript configs)

## Prerequisites

### Development

| Requirement        | Version                | Notes                            |
| ------------------ | ---------------------- | -------------------------------- |
| **Node.js**        | 20+                    | [nodejs.org](https://nodejs.org) |
| **pnpm**           | 10+                    | `npm install -g pnpm`            |
| **Docker Desktop** | Latest                 | Required for local Supabase      |
| **Supabase CLI**   | Latest                 | `npm install -g supabase`        |
| **PowerShell**     | 5.1+ (Windows) or Bash | For local stack scripts          |

### Production

| Service                  | Provider                                     | Required By                         |
| ------------------------ | -------------------------------------------- | ----------------------------------- |
| **Supabase project**     | [supabase.com](https://supabase.com)         | Database, Auth, Storage             |
| **DigitalOcean account** | [digitalocean.com](https://digitalocean.com) | Droplet hosting, Terraform provider |
| **Cloudflare account**   | [cloudflare.com](https://cloudflare.com)     | DNS, CDN, TLS                       |
| **Stripe account**       | [stripe.com](https://stripe.com)             | Billing (optional)                  |
| **Atlassian account**    | [atlassian.com](https://www.atlassian.com)   | Jira/JSM sync (optional)            |
| **Microsoft 365**        | [microsoft.com](https://www.microsoft.com)   | Calendar sync (optional)            |
| **SMTP provider**        | Any                                          | Email notifications (optional)      |
| **Sentry account**       | [sentry.io](https://sentry.io)               | Error tracking (optional)           |
| **Slack workspace**      | [slack.com](https://slack.com)               | Alarm notifications (optional)      |

### GitHub Secrets Required

See [`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](./docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md) for the full list of GitHub secrets and variables needed for CI/CD workflows.

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
cd infra/terraform/digitalocean
terraform init -backend-config=env/backend.prod.hcl
terraform apply -var-file=env/prod.tfvars

# 2. Deploy services (via GitHub Actions or manual)
#    - Push to develop triggers: deploy-do.yml (build + SSH deploy to droplet)
#    - Push to main triggers: deploy-do.yml (prod deploy with E2E + migration gates)
#    - Run migrations: .github/workflows/supabase-migrations.yml

# 3. Configure domains
#    - Web: app.mainecybertech.com → Caddy reverse proxy on droplet
#    - API: api.mainecybertech.com → Caddy reverse proxy on droplet
```

## Useful Commands

```bash
pnpm test                    # All unit tests (4,655)
pnpm e2e                     # E2E tests (91 spec files)
pnpm --filter=api dev        # API dev server
pnpm --filter=web dev        # Web dev server (auto-started by Playwright)
pnpm --filter=api typecheck  # TypeScript check
pnpm --filter=web lint       # ESLint
```

## Quick links

- **Developer setup:** [README.dev.md](./README.dev.md)
- **Architectural analysis:** [docs/ARCHITECTURAL_ANALYSIS.md](./docs/ARCHITECTURAL_ANALYSIS.md)
- **Environment variables:** [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)
- **Documentation index:** [docs/INDEX.md](./docs/INDEX.md)
- **Supabase migration workflow:** [docs/SUPABASE_MIGRATION_WORKFLOW.md](./docs/SUPABASE_MIGRATION_WORKFLOW.md)
- **Rollback procedures:** [docs/ROLLBACK_PROCEDURES.md](./docs/ROLLBACK_PROCEDURES.md)
- **Monitoring & alerting:** [docs/MONITORING_AND_ALERTING.md](./docs/MONITORING_AND_ALERTING.md)
- **Secrets rotation:** [docs/SECRETS_ROTATION.md](./docs/SECRETS_ROTATION.md)
- **GitHub secrets matrix:** [docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](./docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)
- **Infrastructure as Code:** [infra/terraform/](./infra/terraform/)

### Infrastructure

- **Deploy secrets** — integration secrets (Stripe, Sentry, SMTP, Jira, JSM, M365) are injected into the droplet `.env` by `deploy-do.yml` from GitHub environment secrets
- **Docker HEALTHCHECK** — Added to worker Dockerfile (port 3001)
- **Web build args** — `NEXT_PUBLIC_API_URL` added as Docker build arg
- **CI/CD gates** — E2E tests now gate all production deploys; validation gates all dev deploys

## Key Design Decisions

### Auth callback proxy (eliminates Supabase client in web)

The web app never directly talks to Supabase. Instead, the auth callback flow works as follows:

1. User logs in via the web login page, which calls `loginAction` (a Next.js server action)
2. `loginAction` calls the API (`POST /api/v1/auth/sign-in`) through the SDK, which starts the Supabase PKCE flow
3. After Supabase redirects back, the web callback at `/auth/callback` forwards the raw `Cookie` header to the API endpoint `POST /api/v1/auth/callback`
4. The API exchanges the code and returns `{ accessToken }`; the **web** callback route sets the `mct_session` cookie

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

The monorepo includes **4,655 tests** across all packages. See [AGENTS.md](AGENTS.md) for the current breakdown.

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
pnpm exec playwright install --with-deps chromium webkit

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

# Run E2E tests in container (local-only profile; password has no default)
E2E_ADMIN_PASSWORD=1 docker compose run e2e
```

| Service | Image (GHCR)                                       | Build              | Exposed Port  |
| ------- | -------------------------------------------------- | ------------------ | ------------- |
| web     | `ghcr.io/mainecybertech/mainecybertech/mct-web`    | Next.js standalone | 3000          |
| api     | `ghcr.io/mainecybertech/mainecybertech/mct-api`    | tsup bundle        | 4000          |
| worker  | `ghcr.io/mainecybertech/mainecybertech/mct-worker` | tsup bundle        | 3001 (health) |
| e2e     | `mcr.microsoft.com/playwright:v1.61.0`             | —                  | —             |

The local (repo-root) `docker-compose.yml` names these services `web`, `api` and `worker` and builds them from source. The production stack (`infra/digitalocean/docker-compose.yml`) pulls the GHCR images above tagged with `IMAGE_TAG`.

The web app uses Next.js `output: "standalone"` for optimized production builds. The API and worker use `tsup` for compilation.

### Environment files

Each service expects a `.env.local` file in its app directory:

- `apps/web/.env.local` — Next.js public vars + API URL
- `apps/api/.env.local` — Supabase URL/service key, server config
- `apps/worker/.env.local` — Supabase URL/service key, worker config

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow                  | Trigger                          | Purpose                                                                                                                                                                    |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml` | PR | Unit tests + coverage, OpenAPI/docs/RLS guards, Trivy, secrets scan (push-side via `validate.yml`) |
| `codeql.yml` | push/PR/weekly | CodeQL static analysis (SAST) |
| `a11y-breadth.yml` | schedule/manual | Full a11y breadth scan (68 routes, WCAG 2.2) — scheduled gate, not required |
| `lint.yml` | PR | ESLint (push-side via `validate.yml`) |
| `typecheck.yml` | PR | TypeScript typecheck (push-side via `validate.yml`) |
| `supabase-migrations.yml` | push main+dev/call | Apply Supabase migrations (prod attaches the `prod-approval` gate; post-push drift check) |
| `e2e.yml` | PR/manual/call | Playwright E2E tests (retry budget 2 + flake summary; required on `main`) |
| `deploy-do.yml` | push main+dev | Build images, SSH deploy to droplet (fatal API/Worker/Web health gate; `prod-approval` on prod) |
| `terraform-do.yml` | dispatch | Terraform plan (manual; apply requires the `apply` input + `prod-approval`) |
| `validate.yml` | workflow_call | Deploy gate (audit + test + lint + typecheck + docs/openapi/RLS/CODEOWNERS guards + prompt-provenance) |
| `build-push.yml` | dispatch | Build/push GHCR images (manual) |
| `chromatic.yml` | push/PR | Visual regression (Storybook) |
| `db-backup.yml` | schedule/manual | Database backup to Spaces (encrypted, optional offsite) |
| `db-restore-test.yml` | schedule/manual | Restore a backup into a throwaway DB with integrity/freshness assertions |
| `storage-backup.yml` | schedule/manual | Mirror Supabase Storage buckets to Spaces |
| `storage-restore-test.yml` | schedule/manual | Verify the newest storage archive against its manifest (no live bucket) |
| `backup-staleness-check.yml` | schedule/manual | Fail when the newest successful backup/restore-test run is stale |
| `secret-history-scan.yml` | schedule/manual | Full-history gitleaks scan + allowlist probe (pinned install) |
| `secret-rotation-reminder.yml` | schedule/manual | Quarterly secret-rotation issue (deduplicated, `secret-rotation` label) |
| `dependabot-triage-reminder.yml` | schedule/manual | Weekly Dependabot backlog triage issue with the SLA and merge rules |
| `dependency-review.yml` | pull_request | Block PRs introducing vulnerable dependencies |
| `dependency-rescan.yml` | schedule/manual | Report-only dependency re-scan + Trivy fs + `pnpm dedupe --check` |
| `sbom.yml` | push/PR/weekly | CycloneDX SBOM artifact (`scripts/generate-sbom.mjs`) |
| `third-party-image-scan.yml` | schedule/manual | Digest-pin guard + Trivy scan + SBOM for the third-party runtime images |
| `alert-path-exercise.yml` | schedule/manual | Synthetic critical alert + ntfy check; dead-man's-switch drill (non-blocking) |
| `branch-protection-audit.yml` | schedule/manual | Branch-protection drift + bypass audit (`[break-glass]` records) |
| `load-test.yml` | schedule/manual | k6 load scenarios against dev/prod with committed budgets |
| `external-uptime-probe.yml` | schedule/manual | External uptime + latency probe of the public endpoints |
| `release.yml` | push main/manual | Tag + GitHub Release + SBOM on promotion (`v<VERSION>-<date>-<sha>`) |
| `smoke-check.yml` | schedule/manual | API health + web login + authenticated read (dev; prod once enabled) |

## License

ISC
