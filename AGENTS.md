# MCT Portal — Agent Reference

**Repo:** `C:\temp\mainecybertech-portal`
**Branch:** `develop`
**Package manager:** pnpm (corepack, v10+)
**Node:** >= 20
**Shell:** PowerShell (no bash — do not use `&&`)

## Architecture

Turborepo monorepo: 3 apps + 3 packages.

| Service | Entry                       | Port | Purpose                                               |
| ------- | --------------------------- | ---- | ----------------------------------------------------- |
| API     | `apps/api/src/main.ts`      | 4000 | Express server, Supabase Admin for DB/auth            |
| Web     | `apps/web/app/layout.tsx`   | 3000 | Next.js App Router, server components + actions       |
| Worker  | `apps/worker/src/main.ts`   | 3001 | Queue consumer (`consumer-sqs.ts`; BullMQ/SQS/inline) |
| SDK     | `packages/sdk/src/index.ts` | —    | Typed API client factory (`MCTClient.create()`)       |
| UI      | `packages/ui`               | —    | `cn()` utility (clsx + tailwind-merge)                |
| Config  | `packages/config`           | —    | Shared ESLint/TypeScript configs                      |

**Deploy:** DigitalOcean droplet. Caddy reverse proxy (TLS). Hosted Supabase (cloud.supabase.com). Redis 7 on droplet for BullMQ. Docker images on GHCR (`ghcr.io/mainecybertech/mainecybertech/mct-{api,worker,web}`).

**Request flow:**

```
Browser → loginAction() → Supabase Auth REST/PKCE
  → /auth/callback?code=... → forwards Cookie to API POST /api/v1/auth/callback
  → API exchanges code for session → sets mct_session cookie
  → Browser uses SDK with Bearer token / cookie-backed auth
  → API requireAuth → supabase.auth.getUser(token)
  → API requireAdmin → single `roles!inner()` JOIN query
```

**Security model:** Auth User → Profile → Membership → Role → Permission/Override → RLS → Storage

## Test Status (2026-09-21 Verified)

**3,262 tests, all passing. 380 suites.**

| Package | Tests         | Suites | Framework                         |
| ------- | ------------- | ------ | --------------------------------- |
| API     | 1,186         | 109    | Jest + supertest                  |
| Web     | 1,688         | 259    | Jest + Testing Library            |
| SDK     | 289           | 3      | Jest (mocked fetch)               |
| Worker  | 99            | 9      | Jest (env schema + task handlers) |
| E2E     | 90 spec files | —      | Playwright (chromium + axe-core)  |

### Known Debt (2026-08-29)

- **`portal-knowledge-base` E2E failure — FIXED & validated:** the 3 KB E2E tests now pass in prod mode. Root cause was the inline server-action wrapper `<form action={async (fd) => await createArticle(fd)}>` breaking under Next's production build; fixed via `action={createArticle}` + `void` return + `items` guard (commit `688f9fa`).
- **E2E has known run-to-run flakiness:** data-dependent tests (notification bell, project/user/document detail, admin-documents modal) fail intermittently due to CI API/Supabase contention — identical seeds, yet the same test passes in one shard and fails in another. This is **not** a product regression and **not** caused by the CORS `*`→`http://localhost:3000` change. The E2E gate is **prod-only** (`deploy-do.yml` `if: name == 'prod'`), so only a `main` deploy would be exposed to it. As of 2026-09-21 there are **no `main`-branch `deploy-do` runs at all** (prod has not been deployed through this pipeline since E2E was made a prod-only gate), and E2E is currently green on PRs — so "prod deploy is blocked" is not observable. Dev (`develop`) deploy is unaffected and green. **Partially hardened 2026-09-18** (`44900e3`): artifact paths, action/navigation timeouts, shell-wait helper, bounded `networkidle` before axe, and a `withRetry()` around the layout profile fetch (the SDK does not retry 500). **Hardened 2026-09-20** (`2865f7b`): the ~35 `if (await locator.isVisible())` data gates across 12 specs now go through `visibleWithin()` in `e2e/fixtures.ts` (auto-waits for `state:"visible"`, tolerates absent seed data) so a slow render skips the branch instead of failing it. The documents modals already carry `role="dialog"`/`aria-modal`/`aria-labelledby`. **Also hardened 2026-09-20** (`bc46bb9`): `e2e.yml` installed the CLI via `supabase/setup-cli` with `version: latest`, which resolves `releases/latest` through the GitHub API and intermittently failed the job before Playwright ran (`Failed to resolve latest Supabase CLI release: rate limit exceeded`). Now installs the pinned `supabase@2.107.0` from npm (matching `supabase-migrations.yml`/`package.json`).
- **MFA/SSO (net-new):** TOTP **management** backend + SDK shipped 2026-09-18 (`334d65f`). An opt-in enrollment UI (`/portal/profile/security`) shipped in `471b63e`. **`aal2` enforcement now exists** behind `MFA_ENFORCEMENT_ENABLED` (`apps/api/src/lib/mfa.ts`, wired into `requireAuth`): once enabled, an `aal1` session that has a _verified_ factor is rejected with `403 MFA_REQUIRED` on non-`/auth/*` routes, the web layouts step the user up to `/portal/profile/security`, the factor lookup is cached 60s and fails open with a warning (a GoTrue blip cannot lock users out), and a user with no factor is never blocked. Remaining: (1) enable MFA on the hosted Supabase project + set the flag; (2) a first-class login second-factor step (today the security page handles the challenge); (3) SSO (SAML/OIDC) — own larger effort, needs a paid Supabase plan + per-org provider config.
- **Toast consolidation (open):** three ad-hoc toast implementations remain — `pushToast` (`AdminDocumentsCenterClient`, `ProjectTaskListV5`), `addToast` (`RolePermissionsEditor`, `UserPermissionOverridesClient`, `PortalDocumentsCenterClient`), and the `onToast` prop (`AdminDocumentsBulkControls`). Intended fix is one `ToastProvider`/`useToast()`; see `docs/WEB_UI_CONVENTIONS.md`.
- **Axe automation breadth (open):** `apps/web/e2e/a11y.spec.ts` scans 19 of 318 pages and filters to `critical`/`serious` only (no WCAG 2.2 tags). Expanding it should be done where the E2E stack runs so new rules can be triaged rather than failing the prod gate blind.

### Test patterns

- **Mock builder:** `createMockBuilder` — plain object with chain methods + `then()` for `await`; includes `filter`, `maybeSingle`, `rpc`, `upsert`
- **Async server components:** Call async function → `await` JSX → `render()`
- **Redirect mock:** Must throw `"NEXT_REDIRECT"` to prevent execution continuation
- **Bulk actions:** Return `{ ok, error }` instead of throwing
- **DOM text:** Use `getAllByText(...).length` over `getByText(...)` for text in nested DOM
- **forceEvent vs userEvent:** Use `fireEvent` when pnpm symlink resolution fails for `@testing-library/user-event`; wrap async updates in `waitFor`
- **Route params in tests:** `params: Promise.resolve({...})`, `searchParams: Promise.resolve({...})`
- **Worker testability:** `envSchema`, `parseEnv`, `runWorkerTasks` exported for testing; mocks `pino` and `dotenv/config`
- **API middleware layering (2026-08-26):** The P0-2 removal of `NODE_ENV=test`
  auth bypasses means route-level suites stub the middleware modules
  (`org-access`, `permissions`) with pass-through
  `next()` — see the stub block at the top of any route `*.test.ts`. Enforcement
  is covered for real by `middleware-org-access.test.ts`,
  `middleware-permissions.test.ts`, `middleware-subscription.test.ts`,
  `middleware-admin.test.ts`. Do NOT re-add test-mode bypasses to production
  middleware; extend the dedicated suites instead.

### Running tests

```bash
pnpm test                    # All packages via turbo
pnpm --filter=api test       # Single package
pnpm --filter=web test:watch # Watch mode
pnpm --filter=web test:coverage
pnpm e2e                     # Playwright E2E
```

## File Counts (2026-09-21 Verified)

| Category                  | Count | Notes                                                                                               |
| ------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| API route files           | 62    | `apps/api/src/routes/*.ts` (75 incl. `routes/final/` + `routes/store/`)                             |
| API SDK modules           | 60    | `packages/sdk/src/` (excl. `index.ts`, `database.types.ts`)                                         |
| Worker task files         | 12    | Registered in `apps/worker/src/tasks/index.ts`                                                      |
| Web pages                 | 318   | Admin 202, Portal 86, Public 28, Root 2                                                             |
| Web components            | 99    | `apps/web/components/`                                                                              |
| SQL migrations            | 124   | `supabase/migrations/` (latest: 5302425 public interactions is_bot)                                 |
| Seed files                | 9     | `supabase/seeds/*.sql`                                                                              |
| GitHub Actions workflows  | 14    | `.github/workflows/`                                                                                |
| AI prompt files           | 789   | `prompts/` (6 packs); `prompts/manifest.json` pins SHA-256 + `PROVENANCE.md`                        |
| Build/dev/utility scripts | 67    | `scripts/` (`verify-prompts.js`, `openapi-audit.js`, `seed-store.ts`, `generate-db-types.js`, etc.) |

## Database Types (2026-09-21)

`packages/sdk/src/database.types.ts` is generated from SQL migrations by
`node scripts/generate-db-types.js` (135 tables, 12 enums). Exported via
`@mct/sdk` (`Database`, `Tables`, `TablesInsert`, `Json`) and subpath
`@mct/sdk/database.types`.

Generator handles: multi-column `ALTER TABLE ... ADD COLUMN` (semicolon-split,
comma-split clauses), `IF NOT EXISTS` clauses, schema-qualified types
(`public.enum_name`), array types (`text[]`), custom enums (emitted as unions
in `Enums` + used in columns), inline + named FK `references` (emitted as
`Relationships[]` — REQUIRED by supabase-js ≥2.100 embedded queries, else
every `.from()` resolves to `never`), `NOT NULL DEFAULT` → optional Insert
fields, nullable Updates.

**Adoption: complete.** Worker _and_ the API clients are `SupabaseClient<Database>`
(`getSupabaseAdmin` / `getSupabaseAdminNoBreaker` / `getScopedClient`), taking the
API from 259 strictness findings to **0** (`6da96f8`, `7a9cded`).
`apps/api/src/lib/db-types.ts` supplies `toJson`, `asInsert`, `asUpdate` and the
`Row`/`Insert`/`Update` aliases for Json boundaries. The historical backlog and
its four categories are recorded in `docs/database-types-api-adoption.md`.
**Generator formatting note:** table entries must be separated by a newline —
omitting it ran the previous entry's `};` and the next table key together on one
line (valid TS, unreadable file). Fixed 2026-09-21.

**Real bug found by typing:** `ai.ts` inserted/selected `tickets.subject`
(column is `title`) — triage→ticket conversion and copilot summarize/reply
returned 500/404 at runtime. Fixed 2026-08-26.

## Docker & Local Stack

### Docker Compose services (DigitalOcean production)

See `infra/digitalocean/docker-compose.yml` — runs on a single DO droplet behind Caddy:

| Service | Image (GHCR)                                     | Port   | Notes                    |
| ------- | ------------------------------------------------ | ------ | ------------------------ |
| api     | ghcr.io/mainecybertech/mainecybertech/mct-api    | 4000   | Express API              |
| web     | ghcr.io/mainecybertech/mainecybertech/mct-web    | 3000   | Next.js standalone       |
| worker  | ghcr.io/mainecybertech/mainecybertech/mct-worker | 3001   | BullMQ consumer (health) |
| redis   | redis:7-alpine                                   | 6379   | BullMQ backend           |
| caddy   | caddy:2-alpine                                   | 80/443 | TLS reverse proxy        |

Supabase is **hosted** (cloud.supabase.com) — not self-hosted in docker-compose.

### Dockerfile notes

- All 3 use `corepack enable && corepack prepare pnpm@10 --activate` (not `corepack enable pnpm@10`)
- Web Dockerfile copies `packages/` for workspace deps; uses `output: "standalone"` + `outputFileTracingRoot`
- Admin/portal layouts need `export const dynamic = "force-dynamic"` to prevent prerender errors
- API/worker removed `--dts` from tsup build (causes TS2742 in `.pnpm`)
- `.dockerignore` uses `**/node_modules/` and `.pnpm/` for Windows/pnpm compatibility
- Web Dockerfile has `ARG NEXT_PUBLIC_API_URL` — must be passed as build arg for client-side components
- Web builder stage cleans up `.next/cache` to reduce image size

### CI workflow pnpm setup

All CI workflows use `corepack enable` + `corepack prepare pnpm@10 --activate` after
`actions/setup-node`. The prepare call is wrapped in a 3-attempt retry loop (2026-09-21) —
corepack fetches pnpm from the npm registry on every run and a transient failure there
failed the `Test` job's `security-scan` even though the tests passed. Actions are pinned
by commit SHA (not `@v4`).
Do NOT use `pnpm/action-setup` or `cache: pnpm` on setup-node — `cache: pnpm` tries to find pnpm before it's installed, causing "Unable to locate executable file: pnpm."

### Local development

```bash
# Terminal 1: Start API
cd apps/api && cp .env.local .env && pnpm dev

# Terminal 2: Start Worker
cd apps/worker && cp .env.local .env && pnpm dev

# Terminal 3: Start Web
cd apps/web && cp .env.local .env && pnpm dev

# Terminal 4: Start Supabase local
supabase start
supabase db reset   # Apply migrations + seeds
```

## Key Environment Variables

### API (`.env.local`)

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=<min-32-chars>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENTRY_DSN=
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://app.mainecybertech.com,https://www.mainecybertech.com
```

### Web (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_TAWKTO_ID=
NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED=false
```

> The web app talks to Supabase only through the API — it does **not** need
> `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Worker (`.env.local`)

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
REDIS_URL=redis://localhost:6379
SENTRY_DSN=
```

## CI/CD

**14 GitHub Actions workflows** in `.github/workflows/`:

| Workflow                | Trigger            | Purpose                                                           |
| ----------------------- | ------------------ | ----------------------------------------------------------------- |
| test.yml                | push/PR            | Unit tests + coverage, OpenAPI validate, Trivy, secrets scan      |
| lint.yml                | push/PR            | ESLint                                                            |
| typecheck.yml           | push/PR            | TypeScript typecheck                                              |
| supabase-migrations.yml | push main+dev/call | Apply Supabase migrations                                         |
| e2e.yml                 | PR/manual/call     | Playwright E2E tests                                              |
| deploy-do.yml           | push main+dev      | Build images, SSH deploy to droplet                               |
| terraform-do.yml        | push/PR main+dev   | Terraform plan/apply for DO infra                                 |
| validate.yml            | workflow_call      | Deploy gate (audit + test + lint + typecheck + prompt-provenance) |
| build-push.yml          | dispatch           | Build/push GHCR images (manual)                                   |
| chromatic.yml           | push/PR            | Visual regression (Storybook)                                     |
| db-backup.yml           | schedule/manual    | Database backup to Spaces                                         |
| db-restore-test.yml     | schedule/manual    | Restore a backup into a throwaway DB and validate                 |
| dependency-review.yml   | pull_request       | Block PRs introducing vulnerable dependencies                     |
| sbom.yml                | push/PR/weekly     | CycloneDX SBOM artifact (`scripts/generate-sbom.mjs`)             |

**Deploy pipeline:** `setup` → (`build api/worker/web` ∥ `validate`) → (`e2e-gate` + `migrate-gate`, **prod-only**) → `deploy` via SSH (Caddy auto-restarts).

## Code Patterns

### API (Express)

- **Auth:** `requireAuth` → `requireAdmin` / `requireOrgAccess` → `requirePermission(module, action)` (routers mount them in this order)
- **Validation:** Zod schemas on all ~27 mutation endpoints
- **Caching:** `responseCache()` / `responseCacheNoRenew()` + `invalidateCache()` on mutations
- **Rate limiting:** Per-user buckets, 600 req/15min
- **Error handling:** Global error handler, `failure()` helper, structured logging (pino)
- **Audit:** `logAuditEvent()` on all mutations
- **Graceful shutdown:** SIGTERM/SIGINT handlers with 10s drain

### Web (Next.js App Router)

- **Route groups:** `(admin)`, `(portal)`, `(public)` — separate layouts
- **Server components:** Default for data fetching; client components marked `"use client"`
- **Server actions:** Named exports in `actions.ts` files, bound with `.bind()` (not inline closures)
- **Permissions:** `usePermissions()` hook, `<HasPermission>` component, `requirePermission()` server helper
- **Error boundaries:** `error.tsx` in each route group, `global-error.tsx` at root

### Worker (155 lines)

- **Consumer:** SQS-based (`runWorkerTasks` from `consumer-sqs.ts`)
- **Task registration:** `registerTask(name, handler)` in `apps/worker/src/task-registry.ts`
- **Scans:** Domain monitors, website monitors, backup checks, patch compliance, etc.
- **Graceful shutdown:** `inFlightTasks` tracking + drain loop

### SDK

- **Factory:** `MCTClient.create({ baseUrl, getToken })`
- **Retry:** Exponential backoff with configurable retries + timeouts
- **Headers:** `X-Request-ID` correlation, `X-Active-Org` for multi-org switching

## Audit findings ledger (2026-08-26 audit — all remediated)

> **Current state (2026-09-21):** every row below is `FIXED`, `ACCEPTED RISK` or
> `FALSE POSITIVE` — this is the _remediation ledger_ for the 2026-08-26 audit, not a
> list of live defects. Open items are in **Known Debt** (top of file) and the
> **second-audit** section under Completed Work.

Sources: `docs/audits/comprehensive-audit/2026-08-26/report.md`, `prompts/hardening_prompt_pack/engine/deep_audit/global_findings.json`, `prompts/hardening_prompt_pack/engine/outputs/global_report.md`, `docs/P0_REMEDIATION_2026-08-05.md`. All findings verified against source code.

### P0 — Must Fix Before Production

| #   | Issue                                                                                                                                        | Source                    | Location                                                                                        | Status                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Stored XSS via `javascript:` URL** — `CommentBody.tsx` inserts raw URL into `href` with no scheme validation                               | Comprehensive             | `apps/web/components/CommentBody.tsx:22-24`                                                     | **FIXED** 2026-08-26                                                                                                                                                                                                |
| 2   | **Auth bypass when `NODE_ENV=test`** — `requireOrgAccess` and `requirePermission` both return `next()` early, disabling all tenant isolation | Comprehensive + Hardening | `apps/api/src/middleware/org-access.ts:124-127`, `apps/api/src/middleware/permissions.ts:58-61` | **FIXED** 2026-08-26                                                                                                                                                                                                |
| 3   | **Weak JWT secret validation** — `z.string().min(1)` accepts trivial secrets; local `.env` uses guessable string                             | Comprehensive             | `apps/api/src/config/env.ts:12`, `apps/api/.env:7`                                              | **FIXED** 2026-08-26 (min 32)                                                                                                                                                                                       |
| 4   | **Users router missing `requireOrgAccess`** — any authenticated user can access any user's data across all tenants                           | Hardening (P0)            | `apps/api/src/routes/users.ts` (no requireOrgAccess on router)                                  | **FIXED** 2026-08-26                                                                                                                                                                                                |
| 5   | **Rate-limit bypass via X-Forwarded-For** — `trust proxy: true` + skip on `127.0.0.1` = spoofable bypass                                     | Comprehensive             | `apps/api/src/middleware/rate-limit.ts:48-52`, `apps/api/src/app.ts:79`                         | **FIXED** 2026-08-26 (trust proxy = 1)                                                                                                                                                                              |
| 6   | **Permissive RLS on `store_*` tables** — `FOR ALL USING (true)` allows anon key writes                                                       | Comprehensive             | `supabase/migrations/5302105_store_quotes.sql`                                                  | **FIXED** 2026-08-26 — migration 5302132                                                                                                                                                                            |
| 7   | **8 platform-admin roles bypass tenant isolation** — all have full cross-tenant DB access                                                    | Comprehensive             | `apps/api/src/lib/roles.ts:9-18`                                                                | **MITIGATED** 2026-08-27 — all cross-tenant admin access now logged to impersonation_log (migration 5302133 + services/impersonation.ts); 8 admin roles retain cross-tenant access by design but are fully audited. |

**P0-7:** Fixed 2026-08-27 — `impersonation_log` table (migration 5302133) + `logImpersonation()` service wired into
`requireOrgAccess` (both `checkOrgAccess` cross-tenant fallback and active-org switch paths). Every platform-admin
cross-tenant access is now recorded with actor/role/org/IP/reason. See `apps/api/src/services/impersonation.ts`.

### P1 — High Priority

| #   | Issue                                                                                                                       | Source         | Location                                                                                                                    | Status                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **11 phantom CI workflows in README** — AWS/Vercel workflows do not exist; 5 actual workflows undocumented                  | Comprehensive  | `README.md:19-29`                                                                                                           | **FIXED** 2026-08-26                                                                                                                                                              |
| 2   | **Stale test counts in README** — claims 427/155/89/24 (895 total), actual is 801/1450/264/74 (2,589)                       | Comprehensive  | `README.md:31`                                                                                                              | **FIXED** 2026-08-26                                                                                                                                                              |
| 3   | **Stale architecture prereqs** — claims "AWS account", "Terraform Cloud", "Vercel account" (actual: DigitalOcean)           | Comprehensive  | `README.md:73-84`                                                                                                           | **FIXED** 2026-08-26                                                                                                                                                              |
| 4   | **Search endpoint cross-org exposure** — no `requireOrgAccess`; falls through to unscoped query when `adminOrgIds` is empty | Hardening (P1) | `apps/api/src/routes/search.ts`                                                                                             | **FIXED** 2026-08-26                                                                                                                                                              |
| 5   | **Profiles router missing org check** — any authenticated user can access any profile's PII across tenants                  | Hardening (P1) | `apps/api/src/routes/profiles.ts`                                                                                           | **FIXED** 2026-08-26                                                                                                                                                              |
| 6   | **6+ admin pages silently swallow errors** — `catch { /* graceful */ }` with no logging, no error state, no Sentry          | Comprehensive  | `apps/web/app/(admin)/admin/dmarc-coach/page.tsx:48`, `license-optimizer/page.tsx:31`, `status-pages/page.tsx:45`, + 3 more | **FIXED** 2026-08-26                                                                                                                                                              |
| 7   | **CSP allows `unsafe-inline`** — `script-src 'self' 'unsafe-inline'` in web middleware; XSS payloads execute despite CSP    | Comprehensive  | `apps/web/middleware.ts:36,42`                                                                                              | **FIXED** 2026-08-26                                                                                                                                                              |
| 8   | **Multer 50MB vs Supabase 2MB bucket** — large uploads consume server memory then fail at storage (DoS vector)              | Comprehensive  | `apps/api/src/routes/documents.ts:114`                                                                                      | **FIXED** 2026-08-26 (2MB)                                                                                                                                                        |
| 9   | **Dependabot missing ecosystems** — no Docker or Terraform config                                                           | Comprehensive  | `.github/dependabot.yml`                                                                                                    | **FIXED** 2026-08-26                                                                                                                                                              |
| 10  | **SSH default `0.0.0.0/0`** — should be restricted to office/VPN CIDR                                                       | Comprehensive  | `infra/terraform/digitalocean/variables.tf:88`                                                                              | **ACCEPTED RISK** — user explicitly chose to keep SSH open 2026-08-27 (key-only auth enforced on droplet; `admin_ip_ranges` intentionally left `0.0.0.0/0` for CI deploy egress). |
| 11  | **Docker Remote API on port 2376** — exposed on droplet                                                                     | Comprehensive  | `infra/digitalocean/docker-compose.yml`                                                                                     | **FALSE POSITIVE** — port 2376 not in compose file                                                                                                                                |
| 12  | **Terraform state files on disk** — `terraform.tfstate` + `.backup` exist (not git-tracked)                                 | Comprehensive  | `infra/terraform/digitalocean/`                                                                                             | **FALSE POSITIVE** — .gitignore covers \*.tfstate                                                                                                                                 |
| 13  | **7 env vars undocumented** — `BULLMQ_CONNECTION`, `REDIS_PASSWORD`, `SMTP_*`, `PUBLIC_TRAFFIC_WEBHOOK_URL`, etc.           | Comprehensive  | `docs/ENVIRONMENT_VARIABLES.md`                                                                                             | **FIXED** 2026-08-26 (REDIS_PASSWORD, QUEUE_BACKEND, APP_DOMAIN, API_DOMAIN added)                                                                                                |
| 14  | **5 undocumented CI workflows** — `storybook.yml`, `chromatic.yml`, `a11y.yml`, `build-web.yml`, `build-api.yml`            | Comprehensive  | `.github/workflows/`                                                                                                        | **FIXED** 2026-08-26                                                                                                                                                              |

### P2 — Medium Priority

| #   | Issue                                                                                                           | Source           | Location                                                                                                  | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 787 AI prompt files in `prompts/` — supply-chain risk (no provenance, no pinning)                               | Comprehensive    | `prompts/`                                                                                                | **FIXED** 2026-08-27 — `scripts/verify-prompts.js` pins SHA-256 per file + per-pack tree hashes; `validate.yml` runs `verify` as a deploy gate; `prompts/PROVENANCE.md` documents posture                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2   | `alignment-audit-results.json` stale (claims 764 tests, 45 pages)                                               | Comprehensive    | `alignment-audit-results.json`                                                                            | **FIXED** 2026-08-26 (deleted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3   | Root `test` file contains stale architecture analysis (misleading name)                                         | Comprehensive    | `test`                                                                                                    | **FIXED** 2026-08-26 (deleted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | Root `package.json` name is "client-portal" (misleading)                                                        | Comprehensive    | `package.json:2`                                                                                          | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5   | TypeScript ^6.0.3 in root vs ^5.x in apps                                                                       | Comprehensive    | `package.json:47`                                                                                         | **FIXED** 2026-08-26 (root aligned to ^5.9.3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6   | ~200 `any` type annotations (`: any` + `as any`) across production code                                         | Comprehensive    | `apps/worker/src/tasks/module-tasks.ts`, `apps/web/app/(admin)/admin/page.tsx`, + ~30 files               | **COMPLETE (non-API)** — Worker 28→0, Admin dashboard 14→0, 9 admin detail pages fixed, plus 2 agent passes cut web/worker/component `any` from ~281 → ~25 (2026-08-27). API route handlers (~70) are intentionally left untyped (large dedicated effort; tracked in `docs/database-types-api-adoption.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 7   | 10 `console.warn` statements remain in web components (bypass structured logging/Sentry)                        | Verified         | `apps/web/components/NotificationBell.tsx` (8), `AdminGlobalSearch.tsx` (1), `PortalGlobalSearch.tsx` (1) | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8   | OpenAPI spec incomplete                                                                                         | Comprehensive    | —                                                                                                         | **FIXED** 2026-08-27 — runtime route extractor + `generate:openapi` script; `openapi.yaml` regenerated (317 paths). Audit helper: `scripts/openapi-audit.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9   | No SSE/WebSocket for real-time notifications (30s polling)                                                      | Comprehensive    | —                                                                                                         | **FIXED** 2026-08-27 — SSE `/notifications/stream` already implemented server+client; fixed client handler so server-emitted objects trigger refresh                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10  | Input sanitizer uses weak regex — SQL injection patterns trivially bypassable                                   | Comprehensive    | `apps/api/src/middleware/security.ts:17-22`                                                               | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 11  | Worker Dockerfile missing `EXPOSE` directive                                                                    | Comprehensive    | `apps/worker/Dockerfile`                                                                                  | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 12  | `build-push.yml` and `deploy-do.yml` race — both trigger on push to develop, building images twice              | Comprehensive    | `.github/workflows/build-push.yml`, `.github/workflows/deploy-do.yml`                                     | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 13  | No `prevent_destroy` on Firewall/DNS Terraform resources                                                        | Comprehensive    | `infra/terraform/digitalocean/firewall.tf`, `dns.tf`                                                      | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 14  | BullMQ version mismatch — API ^5.78.1 vs Worker ^5.34.0                                                         | Comprehensive    | `apps/api/package.json`, `apps/worker/package.json`                                                       | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 15  | PII in email logs — `logger.info({ to, subject })` logs recipient addresses                                     | Comprehensive    | `apps/api/src/lib/email.ts:38,42`                                                                         | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 16  | lint-staged runs Prettier only — no `eslint --fix` on staged files                                              | Comprehensive    | `package.json:68-75`                                                                                      | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17  | Default `NEXT_PUBLIC_API_URL` build arg points to production                                                    | Comprehensive    | `apps/web/Dockerfile`                                                                                     | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 18  | **Logger factory not implemented** — singleton pino instance only; no `createLogger()` or module-scoped factory | Repo Audit       | `apps/api/src/lib/logger.ts`                                                                              | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 19  | **Circuit breaker Prometheus metrics not wired** — `circuitBreakerStatus` gauge exists but never called         | Hardening        | `apps/api/src/lib/metrics.ts:86-91`, `apps/api/src/lib/circuit-breaker.ts`                                | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 20  | **Admin onboarding wizard missing** — new orgs created via inline form only                                     | Portal Alignment | `apps/web/app/(admin)/admin/organizations/`                                                               | **FIXED** 2026-08-27 — `OrganizationOnboardingWizard.tsx` (3-step) + `/admin/organizations/new` page; SDK `organizations.onboard()` + additive `POST /api/v1/organizations/onboard` (requireAdmin); "Onboard" link on orgs list                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 21  | **Admin list pagination missing** — most list endpoints return all rows                                         | Portal Alignment | `apps/web/app/(admin)/admin/organizations/page.tsx`                                                       | **COMPLETE** 2026-08-27 — reusable `apps/api/src/lib/pagination.ts` helper + `components/admin/AdminPagination.tsx`. All sensible admin lists server-side paginated: `assets`, `findings`, `vendor-contacts`, `dmarc-coach` (`7f3f2be`), `organizations` (API+SDK pagination added, `579bd54`), `approval-requests`, `audit`, `tickets`, `projects`, `billing`, `dmarc-coach`, `approvals`, `notifications`. `tickets`/`projects` use client-side load-more over a server-capped 25 rows (acceptable UX, not a defect).                                                                                                                                                                                                                                                                                                  |
| 22  | **Store catalog is static JSON** — API wraps same JSON files; no DB-backed product CRUD                         | Webstore Pack    | `apps/api/src/lib/store-catalog.ts`                                                                       | **FIXED** 2026-08-27 — data layer + CRUD API done: `store_products`/`store_categories` tables (migration 5302134) + `scripts/seed-store.ts` + admin CRUD API in `routes/store.ts` + DB-first `lib/store-catalog.ts`. NOTE: the JSON files (`apps/api/src/data/products.json`, `categories.json`) are still imported and served as a read fallback when the DB tables are empty — DB is preferred, JSON is the seed/fallback. `products`, `products/[id]`, and `categories` admin pages converted from static JSON to the DB-backed store API (SDK CRUD in `packages/sdk/src/store.ts`). The remaining ~12 store admin pages are static-by-design (no backend table/API), not deferred work — campaigns, leads, quote-requests, visuals, import-export, operations and the admin catalog all became DB-backed 2026-09-21. |
| 23  | **37/39 admin store pages are read-only** — load from static JSON                                               | Webstore Pack    | `apps/web/app/(admin)/admin/store/`                                                                       | **PARTIAL** 2026-08-27 — `products` + `categories` (and `products/[id]`) admin pages converted to DB-backed store API (SDK CRUD + server actions/forms) 2026-08-27. **Superseded 2026-09-21:** the DB-backed set now covers products, categories, promotions, quotes, quote-requests, leads, proposal drafts, campaigns, visual assets, operations (intake→project) and import/export. The remaining ~12 pages (comparisons, case-studies, faqs, fulfillment, ladders, lead-magnets, lifecycle, nurture, portal-services, profitability, quiz, recommendations, seo-pages, testimonials, trust-badges, analytics, audit, bundle-calculator, content-audit, dependencies) are reference viewers for JSON-driven config with NO backend table/API by design — not deferred work.                                           |
| 24  | **8+ non-functional buttons** — store admin buttons with no onClick handlers                                    | Webstore Pack    | `apps/web/app/(admin)/admin/store/faqs/page.tsx:31`                                                       | **FIXED** 2026-08-26 — 5 buttons disabled with "Coming soon" title                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 25  | **Zero admin store page tests** — 1 API test for catalog reads only                                             | Webstore Pack    | `apps/api/src/__tests__/store-catalog.test.ts`                                                            | **FIXED** 2026-08-26 — 12 tests across 5 store pages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### P3 — Low Priority

| #   | Issue                                                                                    | Source         | Status                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~30 admin list pages copy-paste boilerplate — could use shared `AdminListPage` component | Comprehensive  | **FIXED** 2026-08-27 — `components/admin/AdminListPage.tsx` + `AdminListPageSearch.tsx` (generic, tested); refactored webhooks/roles/approval-requests pages to use it (markup preserved)                                                                                                                                                                                           |
| 2   | `final.ts` is a grab-bag of unrelated stats endpoints (471 lines)                        | Comprehensive  | **FIXED** 2026-08-27 — split into `routes/final/{crud,sharepoint,backups,budgets,procurement,dns-changes,time-entries,stats-helpers}.ts`; `final.ts` thin aggregator; all endpoints/order preserved + helper unit tests                                                                                                                                                             |
| 3   | E2E default credentials in docker-compose (`password=1`)                                 | Comprehensive  | **FALSE POSITIVE** — fallback in e2e/global.setup.ts only; env var overrides in CI                                                                                                                                                                                                                                                                                                  |
| 4   | No ESLint in pre-commit (only secret scanner + Prettier)                                 | Comprehensive  | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                |
| 5   | Web container memory limit 256MB — may OOM on complex pages                              | Comprehensive  | **FIXED** 2026-08-26 (increased to 512MB)                                                                                                                                                                                                                                                                                                                                           |
| 6   | Terraform prod apply has no required E2E/test dependency before apply                    | Hardening (P3) | **FIXED** 2026-08-26                                                                                                                                                                                                                                                                                                                                                                |
| 7   | PII fields in profiles table without encryption at rest                                  | Hardening (P2) | **FIXED** 2026-08-27 — `field-encryption.ts` (AES-256-GCM) + `lib/profile-pii.ts` (full_name, email, phone, title) + migration 5302135 (`encrypted_pii jsonb` on `profiles` + RLS); PATCH writes encrypted copy; plaintext responses unchanged (non-breaking). `FIELD_ENCRYPTION_KEY` now set in prod env (real encryption). Backfill of 45 existing profiles completed 2026-08-27. |

## Prompt Pack Verification (2026-08-26)

Verified all 789 prompt files across 6 packs against actual codebase (787 are
pinned in `prompts/manifest.json`). Summary:

### Pack Status

| Pack                    | Findings          | Verified | False Positives        | Gaps Found                     |
| ----------------------- | ----------------- | -------- | ---------------------- | ------------------------------ |
| repo_audit_prompt_pack  | 17 adoption items | 12       | 3 (bugs already fixed) | 1 (logger factory)             |
| hardening_prompt_pack   | 12 findings       | 7        | 0                      | 1 (circuit breaker metrics)    |
| mct-portal-os 60-module | 60 modules        | 60       | 0                      | 7 GAP modules, 19 partial      |
| mct-full-webstore       | 6 findings        | 6        | 0                      | 0 — all implemented 2026-09-21 |
| portal-alignment        | 6 findings        | 6        | 2                      | as of 2026-08-26               |
| repo-deep-dive          | 41 prompts        | 41       | 0                      | (covered above)                |

### 60-Module Implementation Status (2026-08-26 snapshot)

> **Superseded 2026-08-28:** the 7 GAP modules below were built out end-to-end
> (migration + API route + SDK module + admin/portal UI + E2E) and deployed — see
> _Completed Work (2026-08-28)_. No module is a UI shell only any more; the
> FULL/PARTIAL split below is the 2026-08-26 measurement, not the current state.

| Status                  | Count | Modules                                                                                          |
| ----------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| FULL                    | 34    | 2,3,5,8,9,10,11,12,14,15,19,20,21,22,23,24,25,26,27,28,32,34,37,38,40,42,43,48,49,50,51,56,58,59 |
| PARTIAL                 | 19    | 4,6,7,13,16,29,30,31,35,36,39,41,44,52,53,54,55,57,60                                            |
| GAP (3+ layers missing) | 7     | 1,17,18,33,45,46,47 — **all shipped 2026-08-28**                                                 |

**Former GAP modules** (now implemented; listed for traceability):

- **1** Multi-Tenant MSP Client Portal — bootstrap only
- **17** Client Knowledge Base Assistant — portal page only
- **18** Compliance Readiness Lite — portal page only
- **33** Change Advisory Mini-CAB — portal page only
- **45** Hardware Staging Checklist — admin+portal only
- **46** Device Profile Library — admin+portal only
- **47** Network Diagram Builder — admin+portal only

**Pattern:** Many modules consolidated into shared routes (`final.ts`, `edu-automation.ts`, `field-services.ts`) instead of standalone files. This is architecturally acceptable but deviates from the 1-module-1-route spec.

### CSRF Double-Submit Note

The CSRF implementation uses the double-submit cookie pattern (`csrf.ts:55-98`). The cookie MUST have `httpOnly: false` so the SDK/JS can read it and set the `x-csrf-token` header. Setting `httpOnly: true` breaks the pattern and causes 403s on cross-origin mutations. The `SameSite: lax` + `Secure` flags provide adequate protection.

## Completed Work

### Second full audit + remediation (2026-09-21 session)

Re-audited all six prompt packs (`mct-portal-os-expanded-60-modules`,
`portal-alignment`, `repo_audit`, `hardening`, plus the two previously
un-audited: `mct-full-webstore-product-catalog-pack`, `repo-deep-dive`) and
the code. Prior fixes were verified in source (all held); new issues fixed:

- **P0** `requireOrgAccess` compared only the camelCase body key, so a
  snake_case `organization_id` body slipped past the cross-org guard
  (`edu-automation` scorecards/evaluate wrote the victim org with the service
  role). Both spellings now checked.
- **P1** API-side webhook fetches followed redirects after the SSRF check
  (`lib/webhook-dispatcher.ts`, `routes/webhook-management.ts`) — now
  `redirect:"manual"`.
- **P2** `client_portal_entitlements` RLS allowed any approved member to write
  entitlements the API gates to admins (migration `5302420`); same migration
  drops `NOT NULL` on `impersonation_log.actor_user_id` (ON DELETE SET NULL
  broke user deletion).
- **P2** file-request uploads were 50MB/unsniffed; `validateUploadContent`
  extracted to `lib/upload-validation.ts` and reused (25MB cap, `upsert:false`).
- **P2 (worker)** timeouts on the last three fetches; `scheduled-notifications`
  membership/ticket/custom branches dedupe on retry; PII (emails/UPN) removed
  from worker logs; SSRF-blocked deliveries marked `dead_letter`.
- **P2 (CI)** `github.ref_name`/`repository` are no longer interpolated into
  the remote root shell (forwarded via `envs:` + quoted); the worker health
  check now authenticates (`-i`) and uses `docker exec`; E2E push trigger
  removed (duplicate runs); Chromatic no longer `continue-on-error`;
  `terraform fmt -check -recursive` is blocking; db-restore binds `127.0.0.1`.
  **Regression caught and fixed the same session:** the `GHCR_TOKEN`/`GHCR_ACTOR`
  refactor left the "Deploy containers" step with a _duplicate_ `env:` key
  (invalid YAML → GitHub aborted the run with "workflow file issue") and did
  not forward the two vars into that step's `envs:`, so `docker login` saw an
  empty username and every dev deploy failed (11cfdd0 → 4064626). A UTF-8 BOM
  was also present in `deploy-do.yml`/`e2e.yml`; both are stripped. Verified by
  a successful deploy: the droplet runs the new tag with all containers healthy.
- **Web** `DataErrorNote` extended to ~100 admin/portal pages (CRLF-tolerant
  transform + inline-fallback and multi-catch shapes).
- Docs counts re-measured (3,078 tests / 356 suites, 119 migrations, 93
  components, worker 155 lines, 28 handlers).

**Known remaining debt (second audit):**

- **Webstore pack** (largest gap): **public storefront now reads the DB-backed
  catalog** (`apps/web/lib/catalog/catalog-source.ts`, server-only, DB-first with
  the bundled JSON as an offline/empty-table fallback) so admin catalog edits
  reach `/store`, `/store/[slug]`, `/store/category/[slug]`, `/store/quote`,
  `/store/compare/[slug]`, the store sidebar and `/portal/store`. Quote
  submissions now also persist `store_quote_requests` + a scored `store_leads`
  row (`apps/api/src/lib/lead-scoring.ts`, admin `GET /store/quote-requests` and
  `GET /store/leads`, SDK `listQuoteRequests`/`listLeads`), and admins can
  generate/review proposal drafts from a quote request (`store_proposal_drafts`
  via `apps/api/src/lib/proposal-generator.ts`, `/admin/store/quote-requests`,
  `/admin/store/leads`). `store_visual_assets` is now wired too (admin CRUD API +
  SDK + the `/admin/store/visuals` page), and the **intake→project handoff is
  live** (`POST /store/quote-requests/:id/convert` →
  `apps/api/src/lib/intake-handoff.ts` creates the project + 9-task fulfilment
  checklist + handoff ticket, flips the quote request to `converted_to_project`
  and the lead to `converted`, audits and dispatches `project.created`; driven
  from `/admin/store/operations`). The **`proposals`-table handoff is now linked**
  too: generating a proposal draft with an organization creates a first-class
  `proposals` row (a line item per requested service, totals computed) and
  `store_proposal_drafts.proposal_id` (migration `5302421`) points at it, so the
  store intake enters the approvals/publish workflow; the convert endpoint
  carries `proposalId` onto the project metadata. **Prompt 17 (ethical-FOMO UX)
  is implemented**: `store_campaigns` (migration `5302422`) persists seasonal
  readiness campaigns and feeds the public banner, capacity messaging is
  server-computed and only emitted when an admin enabled it with consistent
  numbers (`lib/store-campaigns.ts`), and `QuickWinLadder` (with the
  "Start With a Quick Win" CTA), `TrustPanel`, `MiniPackageComparison`,
  `StickyMobileCta` and A/B copy variants (`copy-variants.json`) ship on the
  public store. **Import/export is now real**: it exports the live DB catalog and
  upserts products/categories through the store API. Still open: ~12 store admin
  pages remain static reference viewers for JSON-driven config (no backend table
  by design) and their non-implemented affordances are explicitly disabled.
- **repo-deep-dive pack**: **resolved 2026-09-21** — the `docs/audits/`
  output contract + README are in place, `sbom.yml` (`scripts/generate-sbom.mjs`)
  emits a CycloneDX artifact, a root `CHANGELOG.md` exists, and
  `.github/branch-protection/{develop,main}.json` is committed **and applied**
  to `develop` + `main` (2026-09-24; `enforce_admins:false`, so admins can still
  bypass). `vercel.json` is retained (Vercel previews are
  connected); the 2026-08-26 audit report was relocated under `docs/audits/`.
- **Pack path drift**: the 60-module `implementation-matrix.csv` points at
  aspirational 1-file-per-module paths (58/60 api/web/sdk) that do not exist
  (modules are real, in consolidated routes); `hardening`/`portal-alignment`/
  `repo_audit` prompts reference `apps/api/src/lib/auth.ts` and
  `lib/supabase.ts` (actual: `middleware/auth.ts`, `services/supabase.ts`), and
  the hardening/alignment CI runner workflows are not installed.
- ```7 admin pages still swallow~~ **FIXED 2026-09-21** — `approval-requests`,
`cab`, `client-portal`, `compliance-readiness`, `knowledge-base`and`store/{products,categories,promotions,quotes}`now set a`loadFailed`flag and
render`DataErrorNote` instead of a misleading empty/zero state.

  ```

  ```

- `terraform-do push` still fails on the `DO_API_TOKEN` 401 (rotate the token).

### Full repo audit + remediation (2026-09-20 session)

Evidence-based audit (API security, data layer, web, worker, CI/infra, docs)
with every P0/P1 re-verified in source before fixing. Two reports were false
positives: the Dockerfiles DO build (workspace `@mct/sdk` is type-only) and
`terraform-do push` fails on the known `DO_API_TOKEN` 401, not on code.

**Security:** tenant-isolation bypass closed (`?organization_id=A` + body
`organizationId=B`); RLS approved-status regression re-fixed for
`client_portal_entitlements`/`phishing_targets` (migration 5302418); Redis URL
no longer logged; SSRF (`redirect:"manual"` + domain-monitor guard); test-login
server gate; deploy forwards secrets via `envs:` (no remote-shell injection);
tfvars written with `printf`; `rollback_sha` validated as hex.

**Reliability:** webhook failures now set `next_retry_at` (were never retried);
stripe-reconcile picks the active subscription deterministically and only
suspends on terminal states; worker fetch timeouts; `orphan-cleanup` uses the
service role; `jsm-sync` checks insert errors; `m365-calendar-sync` rewritten
(app-only tokens cannot use `/me`); Redis scan lock so multi-replica does not
duplicate scans; membership lookup distinguishes 401/403 from transient +
`cache()`; `ModuleDetailPage` no longer masks 500s as "Record not found";
`DataErrorNote` on admin lists that showed misleading zeros; inline form-action
closures removed; document modals got dialog semantics; generator Row
nullability now derives from NOT NULL (surfaced and fixed 12 API nullability
bugs); TF state locking; deploy health gate (container health) before pruning;
compose log rotation + fail-closed IMAGE_TAG + caddy healthcheck; FK indexes
(5302419); `.dockerignore` excludes prompts/e2e; docs counts corrected.

**Known remaining debt:** ~~~90 other admin/portal pages still convert a failed
fetch into an empty/zero state~~ **FIXED 2026-09-21** — `DataErrorNote` now covers
~100 admin/portal pages (34 lists + 66 detail pages) plus the last 9 that logged
to console only; ~57 older migrations
use bare `CREATE POLICY` (non-idempotent) and `5302406`/`5302407` drop tables
unguarded (already applied); several form labels lack `htmlFor`/`id`.
~~E2E runs on both push and PR~~ (push trigger removed 2026-09-21);
~~Chromatic/`terraform fmt` use `continue-on-error`~~ (Chromatic is an explicit
best-effort _job_; `terraform fmt -check -recursive` is blocking);
~~the deploy does not auto-redeploy the prior tag~~ (auto-rollback added,
`3cf876d`); worker `ping` is registered but never enqueued.

### Typed Supabase admin client + audited row drift (2026-09-18 session)

- **`getSupabaseAdmin` / `getSupabaseAdminNoBreaker` / `getScopedClient` are
  all `SupabaseClient<Database>`** (`6da96f8` + `7a9cded`), taking the API from
  259 strictness findings to **0** — the full database-types adoption is done.
  `getScopedClient` adoption (`7a9cded`) touched 43 route/service files:
  `String(req.params.*)` coercion, `toJson()` at Json boundaries,
  `as never`/typed payloads for the generic CRUD factories and field-map
  updates, nullability guards, and RPC-arg casts (the generator emits an empty
  `Functions` map). `notifyAndEmail`'s `email` is now optional so a recipient
  without an address gets the in-app notification but no email.
  **RLS rollout:** `getScopedClient` returns the user-scoped (RLS) client for
  any module listed in `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED`. These are
  **repo-level GitHub secrets** (2026-08-30) enabling a broad list (~44 read /
  ~17 write modules), so RLS is already enforced for most read paths; an
  environment secret overrides the repo value. See `docs/RLS-rollout.md`.
  Platform admins acting cross-tenant (org switcher) keep the service-role
  client so their audited admin access is unaffected; only regular members
  are switched to the RLS client (mechanism covered by
  `get-scoped-client.test.ts`).
- **Real runtime bugs found by typing** (same class as the earlier
  `tickets.subject` fix):
  - `webhook_deliveries.webhook_id` was `NOT NULL` while `logWebhookDelivery`
    inserts `null` → every generic inbound-webhook delivery log threw, so the
    log was always empty **and** the idempotency key was never stored
    (duplicate-processing risk). Migration `5302410` makes it nullable; the
    worker retry task now skips endpoint-less deliveries (`dfa607b`).
  - `satisfaction_pulses` was missing `template_id`/`send_at`/`scheduled_for`/
    `created_by` and `satisfaction_pulse_templates` was missing `subject`/
    `question`/`default_rating` → those inserts/updates threw. Migration
    `5302411` adds them.
  - `respondSatisfactionPulse` read a non-existent `created_by` column.
- **Generator (`scripts/generate-db-types.js`):** primary-key columns are now
  treated as `NOT NULL` (fixes nullable `profiles.id`, `store_*.id`), and
  `ALTER COLUMN ... {DROP,SET} NOT NULL` is now parsed.
- **New `apps/api/src/lib/db-types.ts`:** `toJson`, `asInsert`, `asUpdate`,
  `Row`/`Insert`/`Update` aliases (+4 tests).

### E2E hardening + API bug fix + MFA backend (2026-09-18 session)

- **E2E flakiness hardening (`44900e3`):**
  - `e2e.yml` uploaded `apps/web/playwright-report/`, but the config writes to
    the repo root (`.playwright-report` / `.playwright-results`) — so failures
    produced no report/traces. Fixed the artifact paths.
  - `playwright.config.ts`: `actionTimeout: 15s` + `navigationTimeout: 30s` so
    a hung action fails inside the 45s budget.
  - `apps/web/e2e/fixtures.ts`: `setActiveOrg` now derives the cookie URL from
    `E2E_BASE_URL` (was hardcoded `localhost:3000`); added `gotoApp()` which
    waits for the server-rendered shell so "bell not found" becomes a clear
    failure.
  - `a11y.spec.ts`: bounded `waitForLoadState("networkidle")` before axe (was
    scanning a pre-hydration DOM).
  - `admin/search.spec.ts`: dropped fixed sleeps in favour of auto-waiting
    assertions.
  - **Layout resilience:** the SDK retries 429/502/503/504 but **not 500**, so
    a transient API 500 made `admin/layout.tsx` and `(portal)/layout.tsx`
    throw → error boundary → missing header/bell. New `lib/retry.ts`
    `withRetry()` (rethrown on 401/403, two retries at 150/300ms) wraps the
    `users.me()` profile fetch in both layouts.
- **Real API bug fixed (`a85b41f`):** `domain_monitors` was created (5302062)
  without a `version` column while `PATCH /domain-monitors/:id` runs the shared
  optimistic-locking pattern — `current.version` was `undefined`, so the update
  wrote `version = NaN` to a non-existent column and 500'd. Migration `5302409`
  adds `version integer not null default 1`; `database.types.ts` regenerated.
  +2 If-Match route tests.
- **Generated types vs prettier (`4ac350f`):** the pre-commit hook reformatted
  the 6.7k-line generated `packages/sdk/src/database.types.ts`, making every
  regeneration produce a ~1.4k-line spurious diff. Added it to
  `.prettierignore`.
- **MFA backend (`334d65f`):** Supabase-native TOTP factor management —
  `GET /auth/mfa/factors`, `POST /auth/mfa/enroll|challenge|verify`,
  `DELETE /auth/mfa/factors/:id`, plus SDK `auth.mfa*`. Delegates to GoTrue
  (`auth.mfa_factors`), so no TOTP secrets are stored and no new table is
  needed. **Non-enforcing by design.** +8 API tests, +5 SDK tests.
  Opt-in enrollment UI at `/portal/profile/security` (`471b63e`), linked from
  `/portal/profile`. See the Known Debt note for remaining enforcement/SSO.
- **API query-param widening (`fb093df`):** start of the typing backlog from
  `docs/database-types-api-adoption.md`. New `apps/api/src/lib/query.ts`
  (`queryString`/`queryInt`/`queryStringArray`, +11 tests); the 79
  `parseInt(req.query.page|limit as string) || N` sites across 38 route files
  now use `queryInt(...)`, which coerces `string | string[]` at runtime instead
  of lying with an `as string` cast. Remaining cohorts (Json assignments,
  enum-literal rejects, dynamic row objects, `string | null` row nullability)
  are still open — see the doc.

### CSP nonce hardening + deploy-do IP resolution (2026-09-18 session)

- **Nonce-based CSP (`script-src`):** the middleware already generated an
  `x-nonce` and the public layout passed it to the GA/Tawk `<Script>` tags,
  but production CSP still allowed `script-src 'unsafe-inline'`, so the nonce
  was never enforced. `apps/web/middleware.ts` now emits
  `script-src 'self' 'nonce-<n>' 'strict-dynamic'` and sets the CSP on the
  **request** headers too (the documented Next.js pattern for it to auto-apply
  the nonce to its own inline RSC bootstrap scripts). Local dev keeps
  `'unsafe-inline'`/`'unsafe-eval'` for HMR. Verified against a production
  build with a prod `Host` header: 41/43 `<script>` tags carry the same nonce;
  the only non-nonced scripts are `type="application/ld+json"` (non-executable).
  +3 middleware tests. Closes the residual of P1-7.
- **`deploy-do` droplet IP resolution:** dev deploys had been red since
  2026-08-30. Two bugs: (1) the DO API lookup returned nothing and hid the
  error via `curl -sf`; (2) the Terraform fallback captured the
  `hashicorp/setup-terraform` wrapper's `::error::Terraform exited with code 1.`
  line as the "IP", emitting a malformed `droplet_ip=` output → SSH host `:0`.
  `resolve-ip` now logs the DO API HTTP status, matches the droplet by exact
  name or `mct-portal-<env>-*` (newest, public v4), validates an IPv4 before
  use, extracts only an IPv4 from Terraform stdout, and falls back to a
  `DROPLET_IP` environment variable. **Root cause is a credential issue: the
  dev `DO_API_TOKEN` returns HTTP 401** — it needs to be rotated/replaced
  (dev environment + repo secret). Until then the `DROPLET_IP` fallback carries
  dev deploys (`dev` env var set to the verified live droplet `138.197.105.82`;
  prod has no fallback set — add `DROPLET_IP` to the `prod` environment once the
  prod droplet IP is known).
- **Pre-commit on web test files:** `lint-staged` matched `apps/web/**` against
  `__tests__/**`, which the web ESLint config ignores from the `apps/web` cwd
  but **not** from the repo root, so the hook failed under `--max-warnings=0`.
  Added `--no-warn-ignored` to the three workspace eslint tasks and made
  `middleware.test.ts` assert the `mct_session` cookie name.

### Database types + worker typing + test migration (2026-08-26 session)

- `scripts/generate-db-types.js` hardened: bogus `alter`/`if` columns eliminated,
  multi-column ALTER TABLE parsing, array (`text[]`) + schema-qualified +
  enum types resolved (72 → 0 unknowns), custom enums emitted as unions,
  FK `Relationships[]` emitted (required by supabase-js 2.106 embedded queries),
  `NOT NULL DEFAULT` columns now optional in Insert, Updates accept null
- Worker fully typed: `SupabaseClient<Database>`; `sla_logs` insert typed via
  `TablesInsert<"sla_logs">`; webhook dispatcher payload typed `Record<string, Json>`
- API clients remain untyped; adoption backlog (~259 findings) saved to
  `docs/database-types-api-adoption.md` — _(superseded: adoption completed
  2026-09-18, 259 → 0 — see above)_
- **REAL BUG fixed:** `ai.ts` used `tickets.subject` (column is `title`) —
  triage→ticket conversion 500'd and copilot summarize/reply 404'd at runtime;
  found by the typed client's SelectQueryError markers
- API tests migrated off the removed `NODE_ENV=test` middleware bypasses:
  route suites stub the three middleware modules; dedicated
  `middleware-*` suites keep real enforcement coverage — 48 broken suites → green

### Tenant isolation — requireOrgAccess added to all routers (2026-08-26)

- `apps/api/src/routes/users.ts` — was missing requireOrgAccess (P0 from hardening pack)
- `apps/api/src/routes/search.ts` — was missing requireOrgAccess (P1)
- `apps/api/src/routes/profiles.ts` — was missing requireOrgAccess (P1)
- `apps/api/src/middleware/org-access.ts` — NODE_ENV=test bypass removed
- `apps/api/src/middleware/permissions.ts` — NODE_ENV=test bypass removed

### Security Hardening (2026-08-26 session)

- XSS blocked in CommentBody.tsx (javascript:/data:/vbscript: scheme validation)
- JWT_SECRET min length increased to 32 chars
- Trust proxy changed from true to 1
- CSP hardened (unsafe-inline removed from style-src, frame-ancestors + base-uri added)
- Multer limit reduced from 50MB to 2MB
- PII redacted in email logs
- lint-staged now includes eslint
- Web Dockerfile default NEXT_PUBLIC_API_URL changed to localhost
- Input sanitizer SQL injection patterns strengthened (6 patterns)
- 10 console.warn removed from web components
- Circuit breaker wired to Prometheus metrics (setCircuitBreakerStatus on state change)
- Logger factory (createLogger) added for scoped logging
- BullMQ versions aligned (worker ^5.34.0 → ^5.78.1)
- Worker Dockerfile EXPOSE 3001 added
- build-push.yml push trigger removed (race condition fix)
- Dependabot: Docker + Terraform ecosystems added
- Terraform: prevent_destroy on firewall + 3 DNS records
- package.json name fixed (client-portal → mct-portal)
- README: test counts, CI workflows, prereqs, deployment targets all corrected
- RLS migration 5302132: store_quotes and store_promotions policies scoped by role
- Web container memory limit increased (256MB → 512MB)
- Stale files deleted (test, alignment-audit-results.json)
- ENVIRONMENT_VARIABLES.md: added REDIS_PASSWORD, QUEUE_BACKEND, APP_DOMAIN, API_DOMAIN
- TypeScript version aligned (root ^6.0.3 → ^5.9.3)
- Admin dashboard: 14 `any` annotations replaced with SDK types (Ticket, Document, Project, Organization, AuditLog)
- Store admin buttons: 5 non-functional buttons disabled with "Coming soon" title
- Store admin tests: 12 tests added across 5 store pages
- Worker `any` types: 28 eliminated across module-tasks.ts, webhook-dispatcher.ts, scheduled-notifications.ts (table() helper added)
- Admin detail pages: 9 pages typed (proposals, organizations, tickets, projects, webhooks, roles, qbr)

### Database Types Generation Fix (2026-08-26 — this session)

- Fixed `scripts/generate-db-types.js` to handle `ADD COLUMN IF NOT EXISTS` syntax in ALTER TABLE statements
- Regenerated `packages/sdk/src/database.types.ts` — `webhook_deliveries` now includes `retry_count` (number), `next_retry_at` (string | null), `dead_letter` (boolean)
- Worker typecheck now passes cleanly (was failing on missing columns)
- All typechecks pass: API, Web, Worker, SDK

### Completed Work (2026-08-27 session — open-issue remediation)

- **P0-7 impersonation logging:** `impersonation_log` table (migration 5302133) + `apps/api/src/services/impersonation.ts`, wired into `requireOrgAccess` (both cross-tenant fallback and active-org switch). Unit-tested in `middleware-org-access.test.ts`.
- **P2-1 prompt provenance:** `scripts/verify-prompts.js` pins SHA-256 per file + per-pack tree hashes into `prompts/manifest.json`; `validate.yml` runs `verify` as a deploy gate; `prompts/PROVENANCE.md` documents posture.
- **P2-8 OpenAPI:** runtime route coverage audit (`scripts/openapi-audit.js`) + `apps/api/src/openapi/generate.ts` (`pnpm --filter=api generate:openapi`); `docs/openapi.yaml` regenerated (317 paths, up from 285).
- **P2-9 SSE:** server `/notifications/stream` (Supabase realtime) + client `EventSource` already existed; fixed `NotificationBell.tsx` handler so server-emitted notification objects (not just arrays) trigger refresh.
- **P2-22/23 store catalog DB-backed:** `store_products`/`store_categories` tables (migration 5302134) + `scripts/seed-store.ts` + admin CRUD API in `routes/store.ts` + DB-first `lib/store-catalog.ts` with JSON fallback. (Products + categories UI converted 2026-08-27 — see below; the remaining ~30 store pages are static-by-design, no backend table/API.)
- **P2-21 pagination:** reusable `apps/api/src/lib/pagination.ts`; most API list endpoints already paginate.
- **P3-7 PII encryption (completed end-to-end):** `apps/api/src/lib/field-encryption.ts` (AES-256-GCM) + `apps/api/src/lib/profile-pii.ts` (full_name, email, phone, title) + migration 5302135 (`encrypted_pii jsonb` on `profiles` + RLS); PATCH writes encrypted copy; plaintext responses unchanged (non-breaking). `FIELD_ENCRYPTION_KEY` added to deploy `.env` generation + set as a GH secret so encryption is real (not the dev `plain:` fallback). Migration `5302135` was corrected (PostgreSQL has no `CREATE POLICY IF NOT EXISTS`; made idempotent + nullable). One-time backfill (`scripts/backfill-profile-pii.mjs`, runs via api container + Supabase REST) encrypted all 45 existing profiles on 2026-08-27.
- **CI/deploy gate fixes (2026-08-27):** `validate / prompt-provenance` was failing every deploy since it was added because `.gitattributes` (`* text=auto`) checks files out as LF on Linux CI but CRLF on Windows, so the SHA-256 manifest never matched. `scripts/verify-prompts.js` now normalizes `\r\n`→`\n` before hashing (still detects real content changes). Also added 7 web unit tests for the new store admin pages so `web#test:coverage` meets the global thresholds (was blocking deploys), and moved `store-view.test.ts` into `__tests__/` so `tsc` doesn't see jest globals.
- **Migrations now applied to hosted Supabase:** `supabase-migrations.yml` runs on push to develop when `supabase/**` changes (deploy-do.yml `migrate-gate` is prod-only). Applied 5302133 (impersonation_log), 5302134 (store_products/store_categories), 5302135 (profiles encrypted_pii). Previously these were never applied to prod, so P0-7/P2-22/P3-7 code was live but the schema was missing.
- **Store UI (products + categories) converted to DB-backed API:** `packages/sdk/src/store.ts` gained product/category CRUD + `getProductById`; `apps/web/app/(admin)/admin/store/{categories,products,products/[id]}` now read/write via the store API (server actions + forms), replacing static JSON. `apps/web/lib/catalog/store-view.ts` flattens DB rows (incl. `attributes`) back to the UI shape. The other ~30 store pages have no backend and remain static by design.
- **P2-20 admin onboarding wizard:** `components/admin/OrganizationOnboardingWizard.tsx` (3-step) + `app/(admin)/admin/organizations/new/page.tsx` + tests; SDK `MCTClient.organizations.onboard()` + additive `POST /api/v1/organizations/onboard` (requireAdmin) creating org + admin membership; "Onboard" link on orgs list.
- **P3-1 shared AdminListPage:** `components/admin/AdminListPage.tsx` + `AdminListPageSearch.tsx` (generic, tested); refactored webhooks/roles/approval-requests pages (markup/classes preserved).
- **P3-2 refactor final.ts:** split into `routes/final/{crud,sharepoint,backups,budgets,procurement,dns-changes,time-entries,stats-helpers}.ts`; `final.ts` thin aggregator preserving all endpoints/order; added pure-helper unit tests.

### Features (snapshot — see the header tables for current counts)

- 301 pages (196 admin, 77 portal, 26 public) _(at the time of this snapshot; now 317)_
- 55+ API route files (incl. `routes/final/` submodule split) covering ~90 module areas
- 28 registered worker task handlers
- RBAC with 13 roles, 90-module permission matrix
- Multi-org switching (`X-Active-Org` header + cookie)
- Marketing site integration (4 phases complete)
- DigitalOcean deploy pipeline (build → SSH → Caddy)
- 96 SQL migrations, 9 seed files with comprehensive test data _(now 121)_
- E2E tests for all major flows

### Testing (snapshot — the header table holds the current numbers)

- 2,734 unit tests across 225 suites (all green) _(now 3,262 / 380)_
- 90 Playwright E2E spec files
- ESLint: 0 errors
- TypeScript: clean

### Completed Work (2026-08-28 — GAP modules + E2E + cleanup)

- **7 GAP modules deployed** (`agent/gap-1` through `agent/gap-7`): client-portal, knowledge-base, compliance, CAB, hardware staging, device profiles, network diagrams — all migrations, API routes, SDK modules, portal/admin UI, and E2E tests merged and deployed (deploys `33134749548` → `83bbb25` → `aa07d2c` → `bc6a835` → `08f3402`).
- **E2E auth fix for GAP modules** — all GAP portal specs now use `setActiveOrg()` + global admin auth; portal pages render graceful "No Organization Access" fallback instead of `return null`; all 7 portal E2E specs pass.
- **GAP E2E green** — `knowledge-base`, `device-profiles`, `network-diagrams`, `compliance-readiness`, `hardware-staging`, `client-onboarding-command-center` all pass.
- **Deploy pipeline green** — E2E + `deploy-do` passed for GAP modules (`33140806937` E2E success, `33141861485` deploy success).
- **Seed schema fixes** — `network_diagrams` and `device_profiles` seeds rewritten to match GAP migrations (`5302407`, `5302406`); `device_profiles` legacy seeds removed (migration `5302406` self-seeds correctly).
- **Webstore core complete** — `service_catalog` DB-backed (migration `5302067`), API CRUD (`service-catalog.ts`), SDK module (`serviceCatalog`), 33 admin pages + 12 unit tests; `service_catalog` table with RLS.
- **`agent/mig-guards` branch DELETED** — `5302201` (blanket `DROP POLICY` + `CREATE POLICY` for 349 policies / 15 triggers + delete GAP migrations `5302402`–`5302407`) was **never applied to prod**; deleted (local + remote) because it would clobber `5302132` (`store_*` RLS widening) and `5302135` (`profiles.encrypted_pii` RLS) security fixes. Residual bare `CREATE POLICY`/`CREATE TRIGGER` items accepted as robustness-only.
- **Cleanup** — 7 GAP worktrees (`C:\temp\mct-agent-gap-1`...`7`) + 7 `agent/gap-*` branches deleted (local + remote); `agent/mig-guards` branch deleted (local + remote).
- **Test counts updated** — 2,734 tests (API 853, Web 1,543, SDK 264, Worker 74) across 225 suites; E2E 90 specs.
- **AGENTS.md updated** — test counts, GAP module status, mig-guards decision documented.

## Audit Reports

| Report                      | Date       | Findings                      | Key Insight                                                              |
| --------------------------- | ---------- | ----------------------------- | ------------------------------------------------------------------------ |
| Comprehensive Audit         | 2026-08-26 | 41 (7 P0, 11 P1, 14 P2, 9 P3) | Documentation severely stale; 12 claims verified false                   |
| Prompt Pack Verification    | 2026-08-26 | 789 prompt files / 6 packs    | 9/12 repo audit items implemented; 7 GAP modules; CSRF httpOnly reverted |
| P2/P3 Remediation           | 2026-08-26 | 22 fixes across 16 files      | RLS migration, stale files deleted, env docs updated, infra hardened     |
| Hardening Pack (deep audit) | 2026-08-06 | 12 (1 P0, 4 P1, 4 P2, 3 P3)   | users.ts missing requireOrgAccess; risk score 50/100 BLOCKED             |
| Hardening Pack (engine)     | 2026-08-06 | 6 (1 P0, 1 P1, 2 P2, 2 P3)    | Same P0 on users.ts                                                      |
| Consolidated 5-pack         | 2026-07-30 | 147 across 5 engines          | Portal alignment 91/100 APPROVED; hardening 50/100 BLOCKED               |
| P0 Remediation              | 2026-08-05 | 9 runtime bugs fixed          | Worker schema columns, SDK URLs, worker tasks                            |
| Module Audit                | 2026-08-05 | 60 modules                    | 34 FULL, 19 PARTIAL, 7 GAP (verified 2026-08-26)                         |
| Code Review                 | 2026-06-16 | 30 across 8 categories        | All 12 original P0s fixed                                                |
| Architecture Review         | 2026-06-10 | ~7.5/10 score                 | Near production-ready (at that date)                                     |
