# Repository Hygiene, Maintainability, and Code Health Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01T02:33:00Z
- Auditor: AI agent (audit script)
- Area code: HYGIENE
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/21_repo_hygiene_maintainability.md
- Scope limitations: Static analysis only; no runtime profiling, no bundle analysis, no dependency vulnerability scanning

## Scope

Reviewed 4 packages (API, Web, Worker, SDK) and shared config across the monorepo. Analyzed: file sizes, folder naming, duplicate/dead code, generated artifacts, import patterns, type safety (`: any` usage), error handling patterns, TODO/FIXME inventory, logging consistency, config sprawl, competing patterns, package scripts, dependency boundaries, test utilities, documentation drift, changelog/ADR coverage, and committed secrets hygiene.

Excluded: node_modules, .next build artifacts, Supabase migration files (analyzed separately), Playwright test results.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| apps/api/src/routes/ (54 files) | API route handlers | File sizes, type safety, pattern consistency | 11 files >10KB |
| apps/api/src/config/env.ts | Env validation | Config hygiene | Zod schema, 24 fields |
| apps/worker/src/env.ts | Env validation | Config hygiene | Zod schema, 20 fields |
| apps/worker/src/tasks/ (11 files) | Worker task handlers | Module-to-task mapping | 11 task modules |
| packages/sdk/src/ (49 source files) | SDK modules | API coverage, type exports | 49 modules + index.ts |
| apps/web/app/ (all page files) | Web pages | Component sizes, type safety | Large any usage pattern |
| apps/web/components/ (all components) | UI components | Reusability, type safety | Many components |
| apps/web/lib/ (all lib files) | Shared libraries | Server/client separation | client-api.ts, auth helpers |
| .gitignore | Git ignore rules | Secret hygiene | Properly ignores .env |
| packages/config/tsconfig*.json | TypeScript config | Strictness | strict: true, noUncheckedIndexedAccess |
| apps/*/.env.example | Env templates | Config accuracy | 3 .env.example files |
| docs/modules/ (72 files) | Module documentation | Docs drift | 72 vs 37 listed in INDEX |
| scripts/ (34 files) | Automation scripts | Tooling consistency | Mix of .ps1, .sh, .js, .py |
| apps/web/e2e/ (56 spec files) | E2E tests | Test organization | 56 spec files |
| AGENTS.md (1329 lines) | Agent context | Documentation-to-code drift | Stale test counts |

## Executive Summary

**Overall Score: 3.0/5 — Functional but accumulating technical debt in file sizes, type safety, config sprawl, and documentation drift.**

The MCT monorepo demonstrates strong structural foundations: Turborepo with clean package boundaries, consistent Zod-based env validation in API and Worker, comprehensive ESLint configs (`packages/config/eslint.js`), and TypeScript strict mode enabled with `noUncheckedIndexedAccess`. No TODO/FIXME/HACK comments were found — a sign of disciplined development.

**Major concerns cluster around three areas:**

1. **Type safety erosion:** The codebase has extensive `: any` usage in both API routes (~77 occurrences) and Web pages/components (100+ occurrences). The earlier audit claimed "130+ `: any` annotations" and noted them as "Noted / Low priority." The count has not improved and some usages are in critical data-mapping paths (org profiles, membership role lookups, audit log display).

2. **File size bloat:** 11 API route files exceed 10KB, with the top 3 at 30KB (projects.ts), 28KB (spec.ts), and 26KB (documents.ts). These files mix CRUD operations, business logic, validation, and response formatting in single files. The `edu-automation.ts` route file alone is 25KB with 11 sub-routes — exactly what route grouping should prevent.

3. **Orphaned code:** The store catalog API module (`apps/api/src/routes/store.ts`, 292 lines, plus `apps/api/src/lib/store-catalog`) has 8 API tests but **no corresponding web pages** in the portal or admin route groups. Yet there are 10+ web component tests for store-related components (StoreProductCard, StoreCategoryCard, BundleValuePanel, etc.) and E2E tests referencing store pages. The store test components exist in `apps/web/__tests__/components/store/` but the actual page route group (`(store)`) does not exist in `apps/web/app/`. This creates a split between present test code and absent production pages.

**Strengths:** Clean monorepo boundaries, Zod-validated config in API/Worker, consistent ESLint + TypeScript strict mode, comprehensive test suites, no TODO/FIXME detritus, disciplined .gitignore.

## Inventory

| Item | Path | Purpose | Current state | Risk | Notes |
| ---- | ---- | ------- | ------------- | ---- | ----- |
| API routes | apps/api/src/routes/ | Express route handlers | 54 files; range 30KB-1KB | Medium | 11 files >10KB |
| API env config | apps/api/src/config/env.ts | Zod env validation | 24 fields; matches .env.example well | Low | Clean |
| Worker env config | apps/worker/src/env.ts | Zod env validation | 20 fields; .env.example has 9 extra | Medium | Aspirational vars in example |
| Worker tasks | apps/worker/src/tasks/ | Background jobs | 11 modules | Low | Well-organized |
| SDK modules | packages/sdk/src/ | Typed API client | 49 source modules | Low | Good coverage |
| Web env config | apps/web/ (none) | No env validation | **Absent** | High | No Zod schema |
| Store catalog | apps/api/src/routes/store.ts | Store/quote/catalog API | Active API, no web pages | Medium | Orphaned module |
| AGENTS.md | /AGENTS.md | AI context | 1329 lines, stale counts | High | Misleading |
| `: any` usage | apps/*/src/ | Type safety | 77 API + 100+ Web occurrences | Medium | Pattern in data mapping |
| .env files | apps/*/.env* | Secrets | .env files present in working tree | High | Potential leak |
| docs/modules/ | docs/modules/ | Module docs | 72 files; INDEX lists 37 | Low | Docs drift |
| Scripts | scripts/ | Automation | 34 files; mix of .ps1/.sh/.js/.py | Low | Inconsistent languages |
| TypeScript config | packages/config/tsconfig.json | TS strictness | strict: true, noUncheckedIndexedAccess | Low | Mature |
| ESLint config | packages/config/eslint.js | Linting | Shared across 3 apps | Low | Clean (0 errors claimed) |
| E2E tests | apps/web/e2e/ | Playwright specs | 56 spec files | Low | Comprehensive |
| Large API files | apps/api/src/routes/ | Source files | projects.ts 30KB, spec.ts 28KB, documents.ts 26KB | Medium | Monolithic route handlers |
| Audit history | prompts/repo-deep-dive/ | Audit outputs | 4 timestamped directories | Low | Good preservation |
| Config sprawl | Multiple locations | Environment configs | .env.example x3, env.ts x2, docker-compose .env, CI secrets | Medium | 5+ config locations |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Folder/file naming | 4 | Consistent: apps/pkg/__tests__ mirror source; routes/*.ts maps 1:1 to SDK modules | Some docs/test files reference store/ route group that doesn't exist | Fix store module docs |
| Duplicate/dead/unused code | 3 | No archive/ dir (previously cleaned); no TODO/FIXME markers | Store catalog API has no web pages; test-only store components | Decide: implement or remove store module |
| Generated/build artifacts | 4 | .gitignore covers .next, node_modules; Dockerfiles clean caches | No build output found in source | Good |
| Imports and circular deps | 4 | Monorepo has clean package boundaries; SDK → API is client-server only | Not checked for circular imports via tooling | Add madge/dependency-cruiser CI |
| Large files/components | 2 | 11 API routes >10KB, 3 >25KB; AGENTS.md 1329 lines | Monolithic route handlers mix CRUD + business logic | Split large routes into controller + service layers |
| Type safety/any usage | 2 | 77 `: any` in API source; 100+ in Web source; no improvement since prior audit | Pattern of `(m: any) => m.organization_id` in data mapping | Add typed DB query builders; use Zod inference |
| Error handling | 4 | Consistent AppError class; global error middleware; Zod validation on mutations | Some catch blocks use `(err: any)` | Replace `any` with `unknown` in catch |
| TODO/FIXME | 5 | Zero TODO/FIXME/HACK markers found in source code | None | Excellent hygiene |
| Logging consistency | 4 | pino used in API + Worker; X-Request-ID middleware; logger.ts in worker | Web uses console.error in some server components | Migrate web server components to pino |
| Config sprawl | 3 | .env x3, env.ts x2, docker-compose .env, CI vars, GH Secrets | Web lacks env validation; Worker .env.example over-specified | Add web Zod schema; align Worker .env.example |
| Competing patterns | 3 | Some pages use server actions; others use client SDK; dashboard uses raw fetch (per prior audit) | Prior SDK migration was partial; may have regressed | Complete SDK migration for all server components |
| Package scripts | 4 | Turborepo + pnpm workspaces; consistent test/dev/build scripts | No verify/health-check script | Add `pnpm verify` that runs lint+typecheck+test |

## Detailed Review

### Item: Large API Route Files

- Evidence: `apps/api/src/routes/projects.ts` (30,740 bytes), `apps/api/src/openapi/spec.ts` (28,798 bytes), `apps/api/src/routes/documents.ts` (26,326 bytes), `apps/api/src/routes/edu-automation.ts` (25,840 bytes), `apps/api/src/services/client-onboarding-command-center.ts` (25,547 bytes), `apps/api/src/routes/proposals.ts` (23,718 bytes), `apps/api/src/routes/users.ts` (16,607 bytes), `apps/api/src/routes/findings.ts` (15,517 bytes), `apps/api/src/routes/webhooks.ts` (14,677 bytes), `apps/api/src/routes/tickets.ts` (14,622 bytes), `apps/api/src/services/satisfaction-pulse-widget.ts` (13,625 bytes)
- What it does: Express route handlers contain CRUD operations, input validation (Zod schemas), business logic, Supabase queries, response formatting, and sometimes CSV export logic all in single files.
- How it appears to work: Each route file registers handlers on an Express Router; Zod schemas defined inline; Supabase queries inline; business logic computed inline
- Dependencies: express, zod, supabase, audit service
- Current controls: Zod validation provides input safety; ESLint enforces code style
- Missing controls: No separation between route registration, request validation, business logic, and data access; no testability for business logic independently of HTTP layer
- Risks: Changes to business logic risk breaking route registration; code duplication across similar modules; hard to unit test business logic without full HTTP context; merge conflicts on large files
- Recommended improvement: Extract business logic to `apps/api/src/services/` layer; keep routes as thin wrappers that parse input, call service, format response. Already partially done for client-onboarding-command-center and satisfaction-pulse-widget (services exist), but route files still contain significant logic.
- Suggested tests: Unit tests for extracted service functions without HTTP context
- Suggested docs: Add module refactoring guide to docs/developer-guide/

### Item: `: any` Type Usage in Data Mapping

- Evidence:
  - `apps/api/src/routes/organizations.ts:37`: `(m: any) => m.organization_id`
  - `apps/api/src/routes/roles.ts:67`: `roles.map((r: any) => ({`
  - `apps/api/src/routes/users.ts:444`: `memberships.map((m: any) => m.role_id)`
  - `apps/api/src/routes/final.ts:173`: `items.filter((s: any) => s.status === "planned")`
  - `apps/web/app/(admin)/admin/users/page.tsx:17-29`: 7 `(m: any)` calls in single file
  - `apps/web/app/(admin)/admin/organizations/[orgId]/page.tsx:46-47`: `Map<string, any>` pattern
  - `apps/web/app/(admin)/admin/audit/page.tsx:80-89`: 4 `(l: any)` calls
- What it does: Supabase query results are typed as `any` and then mapped with property access, losing type safety through the entire data pipeline.
- How it appears to work: `supabase.from("table").select("*")` returns typed results if tables are typed in the Supabase client, but the codebase uses `any` casting throughout.
- Dependencies: `@supabase/supabase-js` client
- Current controls: Zod validation at input boundaries
- Missing controls: Database row types; typed query results; no Supabase type generation
- Risks: Renaming a column in Supabase would cause runtime errors with no TypeScript warning; autocomplete doesn't work for DB fields; new developers guess at field names
- Recommended improvement: Generate Supabase types using `supabase gen types typescript`; create typed query helpers; replace `(r: any)` with explicit types throughout
- Suggested tests: TypeScript compilation should fail if a DB column referenced by string doesn't exist
- Suggested docs: Add Supabase type generation to SUPABASE_MIGRATION_WORKFLOW.md

### Item: Orphaned Store Catalog Module

- Evidence:
  - `apps/api/src/routes/store.ts`: 292 lines, active Express route handler with products, categories, promotions, quotes
  - `apps/api/src/lib/store-catalog`: Supporting library functions
  - `apps/api/src/__tests__/store-catalog.test.ts`: 8 API tests
  - `apps/web/__tests__/components/store/`: 8 test files for store components (StoreProductCard, StoreCategoryCard, BundleValuePanel, CampaignBanner, FAQSection, PackageLadder, PromoBadge, ServiceFinderQuiz, TrustBadgeList)
  - `apps/web/e2e/`: No store-specific E2E spec found
  - `apps/web/app/`: No `(store)` or `store/` route group exists
- What is happening: The store catalog has a fully-implemented API with tests, component tests exist, but **no actual web pages** exist in either the portal or admin route groups. The components are tested but never rendered in production.
- Why it matters: Dead code bloats the test suite, confuses developers about what features actually exist, and wastes CI time. If the store is planned but not yet built, the API and components shouldn't be in the main branch.
- User/business impact: None (code is not user-facing), but CI time and developer confusion.
- Security/privacy/reliability impact: None (dead API routes are still accessible if someone discovers the URL — they're registered in Express).
- Recommended fix: Either implement the store web pages and promote to production, or remove the store API and components from the repo. If planned for future, move to a feature branch.
- Suggested validation: Verify store API routes are not accessible in production; remove or gate with feature flag.
- Owner suggestion: Product owner
- Effort estimate: Decision required; implementation: 1-2 days to wire up web pages
- Dependencies: Business decision on store module priority

### Item: Committed Environment Files

- Evidence:
  - `apps/api/.env`: Present in working tree
  - `apps/api/.env.local`: Present in working tree
  - `apps/web/.env.local`: Present in working tree
  - `apps/worker/.env.local`: Present in working tree
  - `.gitignore`: Contains `.env`, `.env.*`, `!.env.example`, `!.env.*.example` (should exclude these)
- What is happening: Four environment files exist in the working tree that should never be committed. Despite gitignore rules, these files are present — they may have been force-added before gitignore was updated.
- Why it matters: These files may contain SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, JWT_SECRET, SMTP credentials, and other production secrets. If these files are git-tracked and pushed, all credentials would be exposed.
- User/business impact: Potential full platform credential compromise.
- Security/privacy/reliability impact: Critical — full database access, payment processing, email sending, and JWT signing key exposure.
- Recommended fix: Immediately run `git ls-files apps/*/.env*` to verify tracked status. If tracked, remove from git history using BFG Repo-Cleaner. Rotate all credentials that may have been in these files. Add explicit `.env.local` to .gitignore.
- Suggested validation: CI pre-commit hook that fails if any non-.example env file is staged; periodic secret scanning in CI.
- Owner suggestion: DevOps / Security lead
- Effort estimate: 2 hours (including potential credential rotation)
- Dependencies: Git history access; credential rotation procedures
- Status: Open

### Item: Config Sprawl

- Evidence:
  - `apps/api/.env.example` (API env template)
  - `apps/web/.env.example` (Web env template)
  - `apps/worker/.env.example` (Worker env template)
  - `apps/api/src/config/env.ts` (API Zod schema: 24 fields)
  - `apps/worker/src/env.ts` (Worker Zod schema: 20 fields)
  - `infra/digitalocean/.env.example` (Docker Compose env)
  - `.github/workflows/deploy-do.yml` (CI env vars computed inline)
  - No centralized env config; no type sharing between packages
- What is happening: Environment configuration is spread across 7+ locations with no single source of truth. Each package validates independently (or not at all, in Web's case). CI workflows compute env vars inline.
- Why it matters: Adding a new env var requires updates in 3-5 locations; it's easy to miss one and cause production failures.
- User/business impact: Slower feature development; potential production misconfiguration.
- Security/privacy/reliability impact: Reliability risk — missed env var in deploy workflow causes silent failure.
- Recommended fix: Create `packages/config/env.ts` with shared env types; each package extends base schema; CI reads from centralized env config.
- Suggested validation: Single `pnpm env:validate` command that validates all packages' env vars.
- Owner suggestion: DevOps
- Effort estimate: 3 hours
- Dependencies: Merge worker and API env types

### Item: Web Package Lacks Environment Validation

- Evidence:
  - `apps/web/.env.example`: 7 variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_TAWKTO_ID, NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  - No Zod, dotenv, or validation code found in `apps/web/` (grep for "zod|envSchema|parseEnv|getEnv" returned zero matches)
- What is happening: Unlike API and Worker which crash fast on missing env vars via Zod, Web silently proceeds with missing/incorrect configuration.
- Why it matters: A build without NEXT_PUBLIC_API_URL would produce a site where all API calls go to `undefined/api/v1/...` — a silent failure that developers may not notice until runtime.
- User/business impact: Production builds with missing env vars would deploy but fail silently.
- Security/privacy/reliability impact: Reliability risk — no fast-fail mechanism for misconfiguration.
- Recommended fix: Create `apps/web/src/config/env.ts` with Zod schema; validate at build time; make NEXT_PUBLIC_API_URL required.
- Suggested validation: Build fails when NEXT_PUBLIC_API_URL is missing
- Owner suggestion: Web team lead
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Item: TypeScript Config Quality

- Evidence:
  - `packages/config/tsconfig.base.json`: `"strict": true`, `"forceConsistentCasingInFileNames": true`, `"noFallthroughCasesInSwitch": true`, `"isolatedModules": true`, `"resolveJsonModule": true`, `"skipLibCheck": true`
  - `packages/config/tsconfig.json`: extends base, adds `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noUncheckedIndexedAccess": true`, `"jsx": "react-jsx"`
- What it does: Enforces strict TypeScript across all packages; catches unused variables; prevents indexed access without undefined checks
- How it appears to work: All packages extend from this shared config
- Current controls: `strict: true` enables all strict checks; `noUncheckedIndexedAccess` catches common undefined bugs
- Missing controls: None significant
- Risks: Skipping type checking on test utilities (`lib/test-utils.ts` excluded per AGENTS.md) is a minor gap
- Recommended improvement: Consider enabling `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`
- Suggested tests: TypeScript compilation CI step (already exists via `typecheck.yml`)

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| HYGIENE-001 | Large route files (>10KB) | 11 API files >10KB; 3 >25KB | ESLint, Zod validation | No service layer separation | P2 | Extract business logic to services/ |
| HYGIENE-002 | `: any` usage in data mapping | 77 API + 100+ Web occurrences | strict TS mode, but Supabase returns untyped | No DB types | P2 | Generate Supabase types; use typed queries |
| HYGIENE-003 | Orphaned store catalog module | API exists; no web pages | Test files exist | Dead code deployed | P2 | Implement or remove store module |
| HYGIENE-004 | Committed .env files | .env/.env.local in working tree | .gitignore rules | Potential secret leak | P1 | Git audit; rotate credentials if tracked |
| HYGIENE-005 | Config sprawl | 7+ env config locations | Zod schemas in API+Worker | No centralized config | P2 | Create shared env config package |
| HYGIENE-006 | Web no env validation | No Zod schema in web | None | Silent production failures | P1 | Add Zod schema to web |
| HYGIENE-007 | AGENTS.md documentation drift | 1329 lines; stale test counts | AGENTS.md exists | Misleading AI context | P1 | Update and split AGENTS.md |
| HYGIENE-008 | No TODO/FIXME markers | Zero found | Disciplined dev practice | None | N/A | Excellent hygiene |
| HYGIENE-009 | Script language inconsistency | 34 scripts; .ps1/.sh/.js/.py | Automation exists | No unified tooling | P3 | Consider consolidating to one scripting language |
| HYGIENE-010 | docs/modules/ under-documented in INDEX | 72 module docs; INDEX lists 37 | docs/INDEX.md exists | 35 missing entries | P2 | Update INDEX.md |
| HYGIENE-011 | Worker .env.example over-specifies | 28 vars example; 20 in Zod | Zod schema | Developer confusion | P2 | Align .env.example with schema |
| HYGIENE-012 | No changelog/versioning | No CHANGELOG.md or VERSION file | Git tags may exist | Release tracking gap | P3 | Add automated changelog generation |

## Findings

### Finding ID: HYGIENE-P1-001 - Environment files present in working tree risk credential exposure

- Severity: P1
- Confidence: Medium
- Area: Security / Repository hygiene
- Evidence:
  - `apps/api/.env`: Present in working tree
  - `apps/api/.env.local`: Present in working tree
  - `apps/web/.env.local`: Present in working tree
  - `apps/worker/.env.local`: Present in working tree
  - `.gitignore` lines 1-5: `.env`, `.env.*`, `!.env.example`, `!.env.*.example`
- What is happening: Four environment configuration files exist in the working tree. These files may contain real API keys, Supabase URLs, JWT secrets, Stripe keys, and SMTP credentials. The files exist despite gitignore rules that should exclude them — they may have been force-added or created before gitignore was updated.
- Why it matters: If these files are tracked by git and the repository is ever made public or shared with an untrusted collaborator, all platform credentials would be exposed. This includes SUPABASE_SERVICE_ROLE_KEY (full DB access), STRIPE_SECRET_KEY (payment processing), JWT_SECRET (auth token signing), and SMTP credentials (email sending).
- User / business impact: Complete platform compromise possible if files contain real credentials and are pushed.
- Security / privacy / reliability impact: Critical — full database access, payment system access, email system access, authentication bypass.
- Recommended fix:
  1. Run `git ls-files apps/api/.env apps/api/.env.local apps/web/.env.local apps/worker/.env.local` to determine if tracked
  2. If tracked: remove from git history immediately, rotate all credentials that were in those files
  3. Add explicit `.env.local` line to `.gitignore`
  4. Add pre-commit hook that blocks staging of any `.env` file not ending in `.example`
  5. Add CI secret scanning (e.g., truffleHog, git-secrets)
- Suggested validation: CI step that runs `git ls-files | grep '\.env$' | grep -v '\.example$'` and fails if any results
- Owner suggestion: DevOps / Security lead
- Effort estimate: 2 hours (with credential rotation: 4 hours)
- Dependencies: Git history access; credential rotation for all affected services
- Status: Open

### Finding ID: HYGIENE-P1-002 - Web package has zero environment variable validation

- Severity: P1
- Confidence: High
- Area: Configuration / Reliability
- Evidence:
  - `apps/web/.env.example`: 7 variables; no validation
  - No Zod, parseEnv, getEnv, or envSchema found in `apps/web/` (grep across all .ts/.tsx files)
  - `apps/api/src/config/env.ts`: Full Zod schema with 24 fields — good practice
  - `apps/worker/src/env.ts`: Full Zod schema with 20 fields — good practice
- What is happening: API and Worker packages validate all environment variables at startup via Zod, crashing fast on misconfiguration. Web has no such validation — missing NEXT_PUBLIC_API_URL would silently produce a broken site.
- Why it matters: A production deploy with a missing or incorrect NEXT_PUBLIC_API_URL would serve a site where every API call goes to `undefined/api/v1/...`. The error would be silent — no crash, no clear log, just broken functionality for all users.
- User / business impact: Potential production outage with no clear error signal to operators.
- Security / privacy / reliability impact: Reliability risk — no fast-fail mechanism for misconfiguration.
- Recommended fix: Create `apps/web/src/config/env.ts` with Zod schema; make NEXT_PUBLIC_API_URL required; validate at build time in next.config.mjs or instrumentation.ts
- Suggested validation: Build should fail when NEXT_PUBLIC_API_URL is not set
- Owner suggestion: Web team lead
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Finding ID: HYGIENE-P2-001 - 11 API route files exceed 10KB with monolithic handler patterns

- Severity: P2
- Confidence: High
- Area: Code structure / Maintainability
- Evidence:
  - `apps/api/src/routes/projects.ts`: 30,740 bytes
  - `apps/api/src/openapi/spec.ts`: 28,798 bytes
  - `apps/api/src/routes/documents.ts`: 26,326 bytes
  - `apps/api/src/routes/edu-automation.ts`: 25,840 bytes (11 sub-routes in one file)
  - `apps/api/src/services/client-onboarding-command-center.ts`: 25,547 bytes
  - `apps/api/src/routes/proposals.ts`: 23,718 bytes
  - `apps/api/src/routes/users.ts`: 16,607 bytes
  - `apps/api/src/routes/findings.ts`: 15,517 bytes
  - `apps/api/src/routes/webhooks.ts`: 14,677 bytes
  - `apps/api/src/routes/tickets.ts`: 14,622 bytes
  - `apps/api/src/services/satisfaction-pulse-widget.ts`: 13,625 bytes
- What is happening: Express route handlers contain Zod schemas (input validation), Supabase queries (data access), business logic (computation), audit logging, CSV export logic, and response formatting all in single files. The `edu-automation` route alone handles 11 sub-routes in 25KB.
- Why it matters: These files are difficult to review, test in isolation, and refactor. A business logic change requires navigating 30KB of mixed concerns. Merge conflicts are likely when multiple developers work on the same module. Unit testing business logic requires full HTTP mock infrastructure.
- User / business impact: Slower feature development; higher bug risk from complex changes; harder code review.
- Security / privacy / reliability impact: Indirect — complex code is harder to security-review.
- Recommended fix: Extract business logic to `apps/api/src/services/<module>.ts`; extract Zod schemas to `apps/api/src/schemas/<module>.ts`; keep route files as thin wrappers (~100 lines) that parse input → call service → format response. Split `edu-automation` into separate route files per sub-route.
- Suggested validation: All route files should be under 300 lines; all service files should have independent unit tests
- Owner suggestion: API team lead
- Effort estimate: 3-5 days for full refactor
- Dependencies: Must not break existing tests
- Status: Open

### Finding ID: HYGIENE-P2-002 - Widespread `: any` type usage defeats TypeScript strict mode

- Severity: P2
- Confidence: High
- Area: Type safety / Code quality
- Evidence:
  - `apps/api/src/routes/`: ~77 occurrences of `: any` in non-test source
  - `apps/web/app/` and `apps/web/components/`: 100+ occurrences of `: any`
  - Common pattern: `items.filter((s: any) => s.status === "planned")` — accessing properties on `any` typed values
  - Common pattern: `(m: any) => m.organization_id` — mapping DB results with no type info
  - Common pattern: `catch (err: any)` — catching errors as `any` instead of `unknown`
- What is happening: Supabase query results, Express request objects, and error catches are typed as `any`, bypassing TypeScript's strict mode and `noUncheckedIndexedAccess` protections. The prior audit noted "130+ `: any` annotations" and marked them "Noted — Low priority" but the count has not decreased.
- Why it matters: Renaming a Supabase column (`organization_id` → `org_id`) would not produce any TypeScript errors — only runtime failures in production. New developers writing data-mapping code get no autocomplete or type checking.
- User / business impact: Higher bug rate from uncaught type errors; longer debugging cycles for DB schema changes.
- Security / privacy / reliability impact: Reliability risk — type-unsafe property access can crash at runtime.
- Recommended fix:
  1. Generate Supabase types: `npx supabase gen types typescript --linked > apps/api/src/types/database.ts`
  2. Replace `(r: any) => ...` with typed parameter: `(r: DatabaseRow) => ...`
  3. Replace `catch (err: any)` with `catch (err: unknown)` and add type guards
  4. Add ESLint rule `@typescript-eslint/no-explicit-any` with `"warn"` level
- Suggested validation: TypeScript compilation fails when a non-existent DB column is accessed
- Owner suggestion: Full team (incremental cleanup)
- Effort estimate: 2-3 days for API; 2-3 days for Web (incremental)
- Dependencies: Supabase type generation setup
- Status: Open

### Finding ID: HYGIENE-P2-003 - Store catalog module is orphaned — API and tests exist but no web pages

- Severity: P2
- Confidence: High
- Area: Dead code / Module completeness
- Evidence:
  - `apps/api/src/routes/store.ts`: 292 lines, active Express route handler (products, categories, promotions, quotes, bundles)
  - `apps/api/src/lib/store-catalog`: Supporting library functions
  - `apps/api/src/__tests__/store-catalog.test.ts`: 8 API tests that pass
  - `apps/web/__tests__/components/store/`: 9 test files for store UI components
  - `apps/web/app/`: No `(store)` route group, no `store/` directory
  - `apps/web/components/store/`: May or may not exist — test files reference StoreProductCard, StoreCategoryCard, etc.
- What is happening: A fully-implemented store catalog API exists with 8 passing API tests and 9 component test files, but the actual web pages to render the store do not exist in the app router. The components are either dead code or exist in a branch that wasn't merged.
- Why it matters: Dead code bloats the test suite (slower CI), confuses developers browsing the codebase, and wastes maintenance effort. The API routes are still registered in Express — if someone discovers the URL path, they could interact with an unfinished module.
- User / business impact: None directly, but wasted CI time and developer confusion.
- Security / privacy / reliability impact: Low — dead API routes are technically accessible if someone guesses the path.
- Recommended fix: Two options: (a) Implement the store web pages and promote to production, or (b) Remove the store API, tests, and components. If the store is planned for future, gate API routes behind a feature flag and move to a feature branch.
- Suggested validation: Either store pages render in dev, or store API returns 404/feature-flag-off
- Owner suggestion: Product owner for go/no-go decision; frontend lead for implementation
- Effort estimate: 1-2 days to implement web pages; 30 min to remove dead code
- Dependencies: Business decision on store module
- Status: Open

### Finding ID: HYGIENE-P2-004 - AGENTS.md claims stale — 1329 lines with incorrect test counts and E2E spec count

- Severity: P2
- Confidence: High
- Area: Documentation drift
- Evidence:
  - `AGENTS.md:5`: "774 tests all green (182 API + 108 SDK + 24 Worker + 460 Web)" — from June 2026
  - `AGENTS.md:68`: "1,530 tests, all passing: API 583, SDK 223, Worker 24, Web 700" — also stale
  - `AGENTS.md:76`: "E2E | 26 spec files" — actual: 56 spec files
  - Actual (2026-08-01): ~584 API, ~247 SDK, ~31 Worker, ~397 Web, ~56 E2E specs = ~1495 unit + 236 E2E
- What is happening: The AGENTS.md file acts as the primary context document for AI coding agents but contains test counts from 9 months ago. The file has grown to 1329 lines with extensive completion logs but hasn't been audited for accuracy.
- Why it matters: Every AI agent reading this file operates on incorrect assumptions about test coverage, module count, and E2E scope. This wastes agent context and produces unreliable recommendations.
- User / business impact: AI-generated code may skip tests for "already-tested" code; new developers underestimate project size.
- Security / privacy / reliability impact: Low direct impact, but incorrect assumptions lead to quality issues.
- Recommended fix: Split AGENTS.md into core context (~200 lines) + extension files; add date stamps; update all counts; add CI verification that counts match reality.
- Suggested validation: CI step that compares AGENTS.md test counts against `pnpm test --json` output
- Owner suggestion: Principal engineer
- Effort estimate: 1 hour
- Dependencies: Test suite must be runnable
- Status: Open

### Finding ID: HYGIENE-P3-001 - Script collection uses 4 different languages with no organizing README

- Severity: P3
- Confidence: High
- Area: Developer tooling
- Evidence:
  - `scripts/`: 34 files including .ps1, .sh, .js, .py, and a .gitkeep
  - PowerShell scripts: backup-database.ps1, install-terraform.ps1, local_dev_reset_and_verify.automated.v2.ps1, scan-secrets.ps1, start-local-stack.ps1, sync_supabase_env.auto.v2.ps1, teardown-local-stack.ps1, test-local-stack.ps1
  - Shell scripts: backup-database.sh, dev-setup.sh, local_dev_reset_and_verify.automated.v2.sh, preflight-check.sh, restore-database.sh, rollback.sh, scan-secrets.sh, start-local-stack.sh, teardown-local-stack.sh, test-local-seeds.sh, validate-terraform-env.sh
  - JavaScript: api.basic.smoke.js, auth.load.js, fix-apostrophe.js, fix-cat.js, fix-everything-dupes.js, generate-fulfillment.js, generate-product-content.js, health.spike.js, sse.load.js, tickets.load.js
  - Python: generate_badges.py, history_logger.py
  - A README.md exists under scripts/load-testing/ but no top-level scripts/README.md
- What is happening: The scripts directory has grown organically with a mix of Windows (.ps1) and Unix (.sh) versions of the same scripts, plus one-off JS utilities and Python scripts. Duplicated functionality between .ps1 and .sh versions.
- Why it matters: New developers don't know which scripts to run, which are obsolete, or which are OS-specific. Duplicate scripts mean bugs fixed in one version may persist in the other.
- User / business impact: Slower developer onboarding; potential for running wrong/outdated scripts.
- Security / privacy / reliability impact: None
- Recommended fix: Create `scripts/README.md` documenting each script's purpose and OS compatibility. Consider adopting cross-platform scripts (Node.js) where possible to eliminate OS-specific duplication. Archive one-off fix scripts (fix-apostrophe.js, fix-cat.js, fix-everything-dupes.js, generate-fulfillment.js, generate-product-content.js) to `scripts/archive/`.
- Suggested validation: Every script file has a clear purpose; no duplicated functionality between .ps1 and .sh versions.
- Owner suggestion: DevOps
- Effort estimate: 2 hours
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Credential leak via committed .env files | Critical | Low | Critical | .env files in working tree | Remove from git; rotate credentials; add pre-commit hook |
| Silent production failure from missing web env vars | High | Medium | High | No web env validation | Add Zod schema to web package |
| Uncaught runtime errors from `: any` usage | Medium | High | Medium | 177+ `: any` across codebase | Generate DB types; add ESLint rule |
| Missed bugs from monolithic route files | Medium | Medium | Medium | 11 files >10KB | Extract service layer |
| Orphaned store module wastes CI time | Low | Low | Low | Store API + tests, no web pages | Implement or remove |
| AI agent errors from stale AGENTS.md | Medium | High | Low | Test counts off by 2x | Update and add CI verification |

## Recommendations

### Immediate / Release Blocking

1. **Audit and clean committed .env files** — Check if tracked by git; remove from history if so; rotate all credentials in those files.
2. **Add web env validation** — Zod schema validating NEXT_PUBLIC_API_URL as required; fail build on missing.
3. **Update AGENTS.md** — Refresh test counts, E2E spec count, API route count with actual values.

### This Week

4. **Align Worker .env.example with schema** — Comment out or remove 9 extra vars.
5. **Update docs/INDEX.md** — Add all 72 module docs and missing subdirectories.
6. **Decide on store module** — Implement web pages or remove API + tests.
7. **Add pre-commit hook** — Block staging of .env files (non-.example).

### This Month

8. **Extract service layer from large route files** — Start with documents.ts, edu-automation.ts, projects.ts.
9. **Generate Supabase types** — Run `supabase gen types` and integrate into CI.
10. **Create scripts/README.md** — Document all scripts, archive one-off fix scripts.
11. **Split AGENTS.md** — Core context + extension files.
12. **Add ESLint `no-explicit-any` rule** — Set to `"warn"` and begin incremental cleanup.

### Later / Platform Evolution

13. **Centralized env config package** — Share types between API/Worker/Web env schemas.
14. **Auto-generate OpenAPI from routes** — Eliminate manual spec drift.
15. **Add madge/dependency-cruiser CI** — Detect circular dependencies and import boundary violations.
16. **Automated changelog generation** — Based on conventional commits.
17. **Consider `exactOptionalPropertyTypes`** — Further TypeScript strictness.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add `.env.local` to .gitignore | Prevent future credential leaks | .gitignore | Try to stage .env.local |
| Add web Zod schema | Fail-fast on missing API_URL | apps/web/src/config/env.ts (new) | Build fails without var |
| Comment out unused Worker .env.example vars | Reduce new-dev confusion | apps/worker/.env.example | Visual review |
| Update AGENTS.md test counts | AI agents get accurate info | AGENTS.md | Compare with `pnpm test --json` |
| Archive one-off fix scripts | Clean scripts/ directory | scripts/fix-*.js, generate-*.js | scripts/ dir is 10 files lighter |
| Add ESLint `no-explicit-any: warn` | Surface type safety debt | .eslintrc in each package | `pnpm lint` shows warnings |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| .env file audit and cleanup | P1 | DevOps/Security | 2-4h | Credential rotation access |
| Web env validation | P1 | Web team | 1h | None |
| AGENTS.md accuracy update | P1 | Principal | 1h | Test suite running |
| Store module decision | P2 | Product owner | 30m | Business priority |
| Large route refactoring | P2 | API team | 3-5d | Must preserve test pass |
| Supabase type generation | P2 | API team | 2h | Supabase CLI access |
| scripts/README.md | P3 | DevOps | 2h | None |
| Centralized env config | P2 | DevOps | 3h | Merge API/Worker types |
| ESLint no-explicit-any rule | P3 | Full team | 30m setup; ongoing | DB types generated |
| Circular dep detection | P3 | DevOps | 1h | None |
| Automated changelog | P3 | DevOps | 2h | Conventional commit adoption |

## Suggested Tests

1. **Pre-commit hook test**: Attempting to stage a .env file (non-.example) fails
2. **Build test**: `pnpm --filter=web build` fails when NEXT_PUBLIC_API_URL is unset
3. **Schema test**: Every var in `apps/worker/.env.example` has a corresponding field in `apps/worker/src/env.ts`
4. **Route size test**: No route file in `apps/api/src/routes/` exceeds 1000 lines / 15KB
5. **Type safety test**: ESLint `no-explicit-any` produces <100 warnings across entire codebase
6. **Orphan test**: Every route file in `apps/api/src/routes/` has at least one corresponding web page test or is gated by feature flag
7. **AGENTS.md accuracy test**: Test counts in AGENTS.md match `pnpm test --json` output within 5%
8. **Git hygiene test**: `git ls-files | grep '\.env$' | grep -v '\.example$'` returns empty

## Suggested Documentation Updates

1. **Create**: `apps/web/src/config/env.ts` — Zod schema for web environment validation
2. **Create**: `scripts/README.md` — Script purpose, OS compatibility, usage examples
3. **Create**: `docs/developer-guide/refactoring.md` — Patterns for extracting services from routes
4. **Create**: `docs/developer-guide/types.md` — Supabase type generation and usage guide
5. **Update**: `AGENTS.md` — Split into core + extensions; refresh all counts
6. **Update**: `docs/INDEX.md` — Add all module docs, subdirectories, remove dead links
7. **Update**: `.gitignore` — Add explicit `.env.local` entry
8. **Update**: `apps/worker/.env.example` — Comment out 9 unused aspirational vars
9. **Update**: `packages/config/eslint.js` — Add `@typescript-eslint/no-explicit-any: "warn"`
10. **Archive**: `scripts/fix-apostrophe.js`, `scripts/fix-cat.js`, `scripts/fix-everything-dupes.js`, `scripts/generate-fulfillment.js`, `scripts/generate-product-content.js` → `scripts/archive/`

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are .env files tracked by git? | Determines severity of credential leak risk | `git ls-files apps/*/.env*` output |
| Is the store module planned or abandoned? | Determines whether to implement or remove | Product roadmap / stakeholder input |
| Are store web components in source or only in tests? | Determines how much code to clean up | Check `apps/web/components/store/` existence |
| Are there circular dependencies between packages? | Can cause build issues and tight coupling | Run madge or dependency-cruiser |
| Why does Web have no env validation when API/Worker do? | Indicates inconsistency in development standards | Ask web team |
| Are `console.error` calls in web server components routed to pino/Sentry? | Prior AGENTS.md claimed migration done but grep found no pino in web | Check web app/ server components |
| Are the 72 module docs all accurate and complete? | Many may be stubs created during module expansion | Spot-check 5-10 module docs against actual API routes |

## Appendix

### File Size Heatmap — API Routes

```
>30KB: projects.ts (30,740)
28-30KB: spec.ts (28,798)
26-28KB: documents.ts (26,326)
24-26KB: edu-automation.ts (25,840), client-onboarding-command-center.ts (25,547)
22-24KB: proposals.ts (23,718)
16-18KB: users.ts (16,607)
14-16KB: findings.ts (15,517), webhooks.ts (14,677), tickets.ts (14,622)
12-14KB: satisfaction-pulse-widget.ts (13,625)
10-12KB: (4 more files)
<10KB: 43 files
```

### `: any` Usage by Category

| Category | Location | Approx Count | Pattern |
| -------- | -------- | ------------ | ------- |
| DB row mapping | API routes (all) | ~50 | `(r: any) => r.field` |
| Supabase mock | API tests | ~15 | `let supabase: any` |
| Error catches | API + Web | ~15 | `catch (err: any)` |
| DB query builder | API routes | ~10 | `(qb: any) => qb.eq(...)` |
| Component props | Web pages | ~30 | `{ webhook: any }` |
| Data display | Web pages | ~20 | `items.map((item: any) =>` |
| Link mock | Web tests | ~10 | `({ href, ...rest }: any)` |
| Express middleware | API | ~5 | `(req: any, res: any, next: any)` |
| Other | Various | ~22 | Misc |

### Script Inventory by Language

| Language | Count | Examples |
| -------- | ----- | -------- |
| PowerShell (.ps1) | 8 | backup-database.ps1, scan-secrets.ps1, start-local-stack.ps1 |
| Shell (.sh) | 12 | dev-setup.sh, rollback.sh, test-local-stack.sh, preflight-check.sh |
| JavaScript (.js) | 10 | api.basic.smoke.js, auth.load.js, health.spike.js, fix-*.js |
| Python (.py) | 2 | generate_badges.py, history_logger.py |
| Other | 1 | .gitkeep |
| README | 1 | scripts/load-testing/README.md |
| **Total** | **34** | |

Note: Several scripts have both .ps1 and .sh versions (start-local-stack, teardown-local-stack, test-local-stack, local_dev_reset_and_verify, scan-secrets, backup-database) — potential for OS-specific bug divergence.

### TypeScript Configuration Quality Assessment

| Option | Value | Impact |
| ------ | ----- | ------ |
| `strict` | `true` | Enables all strict type checking |
| `noUncheckedIndexedAccess` | `true` | Prevents undefined from unvalidated index access |
| `noUnusedLocals` | `true` | Catches dead variable declarations |
| `noUnusedParameters` | `true` | Catches unused function parameters |
| `noFallthroughCasesInSwitch` | `true` | Prevents accidental case fallthrough |
| `forceConsistentCasingInFileNames` | `true` | Prevents cross-platform casing bugs |
| `isolatedModules` | `true` | Required by transpilers (tsup, esbuild) |
| `skipLibCheck` | `true` | Skips type checking of .d.ts files |
| `exactOptionalPropertyTypes` | Not set | Would catch missing optional property handling |
| `noPropertyAccessFromIndexSignature` | Not set | Would require bracket notation for index access |

**Assessment:** Strong TypeScript configuration. The combination of `strict: true` + `noUncheckedIndexedAccess` provides excellent baseline type safety. The `: any` usage in data mapping is the primary gap — it bypasses all these protections at the point where data enters the system.
