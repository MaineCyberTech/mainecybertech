# Testing, Quality, and Release Confidence Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260806-1722-develop-75d3926
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 75d3926 (75d39269310fcc09826fe532d5838d3a53d1739a)
- Generated at: 2026-08-06
- Auditor: Principal repository auditor (fresh audit, no reliance on prior reports)
- Area code: TEST
- Output path: prompts/repo-deep-dive/20260806-1722-develop-75d3926/09_testing_quality_release_confidence.md
- Scope limitations:
  - E2E suite (90 spec files) was NOT executed locally — it requires the full local Supabase stack + seeds (`supabase start` + `supabase db reset`), which takes 30+ minutes and was outside this audit's execution window. E2E status is reported from CI evidence (`.github/workflows/e2e.yml`) and documented results.
  - Coverage thresholds were verified as configured; a full `test:coverage` run was not performed (unit suites were run in plain mode to report counts).
  - All four unit test suites were executed at CURRENT HEAD with actual results reported below.

## Scope

Reviewed at commit 75d3926: unit test suites for all 4 packages (executed), jest configurations + coverage thresholds, CI workflows (test.yml, validate.yml, e2e.yml, lint.yml, typecheck.yml), Playwright configuration, a11y axe spec, middleware test file, husky/lint-staged pre-commit hooks, load-testing scripts, migration validation paths, security test coverage, and the docs that claim test counts. No code was modified.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/__tests__/` (77 suites) | Test source | API test inventory | Executed: 734 passed |
| `apps/web/__tests__/` (210 suites) | Test source | Web/component test inventory | Executed: 1450 passed |
| `apps/worker/src/__tests__/` (6 suites) | Test source | Worker test inventory | Executed: 40 passed |
| `packages/sdk/src/__tests__/` (2 suites) | Test source | SDK test inventory | Executed: 264 passed |
| `apps/api/jest.config.mjs` | Config | Coverage threshold gate | 58/50/55/30 statements/functions/lines/branches |
| `apps/web/jest.config.mjs` | Config | Coverage threshold gate | 35/30/35/25 |
| `apps/worker/jest.config.mjs` | Config | Coverage threshold gate | 12/15/12/5 |
| `packages/sdk/jest.config.mjs` | Config | Coverage threshold gate | 40/38/40/33 |
| `.github/workflows/test.yml` | CI | CI gate runs coverage | `pnpm test:coverage` at line 52 |
| `.github/workflows/validate.yml` | CI | CI gate runs coverage | `pnpm test:coverage` at line 51 |
| `.github/workflows/e2e.yml` | CI | E2E CI pipeline | Supabase local + seeds + prod builds + Playwright |
| `apps/web/playwright.config.ts` | Config | E2E config | expect timeout 15000; retries 2 in CI |
| `apps/web/e2e/a11y.spec.ts` | Test source | Accessibility | 4 pages, axe WCAG A/AA, critical+serious only |
| `apps/web/__tests__/middleware.test.ts` | Test source | Middleware security tests | 21 tests verified |
| `.husky/pre-commit` | Hook | Pre-commit gate | scan-secrets.sh + lint-staged |
| `scripts/load-testing/README.md` | Doc | Load testing | Placeholder only — no executable load tests |
| `package.json` | Config | Root scripts | test:coverage via turbo; per-package scripts exist |
| `apps/web/e2e/` (90 spec files) | Test source | E2E inventory | 90 specs incl. admin/portal/auth/marketing/a11y |

## Executive Summary

The repo holds **2,488 passing unit tests across 295 suites** at HEAD 75d3926 (API 734/77, SDK 264/2, Worker 40/6, Web 1450/210) — every suite green, verified by fresh execution this audit. This is the strongest area of the entire platform: 4-package coverage gates are configured and CI-enforced via `pnpm test:coverage` (test.yml + validate.yml), the E2E pipeline is fully wired (90 spec files, Supabase local reset, production builds, Playwright with 15s expect timeout and 2 retries), a11y axe scans run in E2E, and middleware security behavior has 21 dedicated tests.

Remaining gaps are not in test volume but in test *type* breadth: no executable load/failure tests (placeholder README only), no contract tests against the 396-path OpenAPI spec, visual regression not enforced (Chromatic non-blocking), a11y coverage is only 4 of ~220 pages, migration changes are only validated indirectly (E2E `db reset` + hosted push), and all three of API/Worker/SDK Jest runs emit worker-process leak/force-exit warnings. Release confidence is high for functional correctness; "release confidence" for performance/scale behavior is unproven.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API tests | `apps/api/src/__tests__/*` | Route/middleware/service integration tests | Implemented, all green | Low | 734 tests / 77 suites |
| SDK tests | `packages/sdk/src/__tests__/*` | Mocked-fetch API client tests | Implemented, all green | Low | 264 tests / 2 suites |
| Worker tests | `apps/worker/src/__tests__/*` | Env schema + task handler tests | Implemented, all green | Low | 40 tests / 6 suites |
| Web tests | `apps/web/__tests__/*` | Page/component/action tests | Implemented, all green | Low | 1450 tests / 210 suites |
| E2E | `apps/web/e2e/*.spec.ts` (90 files) | Full-stack browser tests | Implemented, CI-green (documented) | Medium | Not run locally this audit |
| a11y | `apps/web/e2e/a11y.spec.ts` | Axe WCAG A/AA scans | Implemented | Medium | Only 4 pages covered |
| Middleware tests | `apps/web/__tests__/middleware.test.ts` | JWT/domain routing/gating | Implemented | Low | 21 tests verified |
| Coverage gates | 4× `jest.config.mjs` | Enforced per-package thresholds | Implemented | Low | CI runs test:coverage |
| Visual regression | `apps/web/.storybook` + Chromatic | Screenshot diffing | Partial | Medium | Chromatic non-blocking (Next 15.5 + webpack5 conflict) |
| Contract tests | — | OpenAPI-against-implementation | Absent | Medium | OpenAPI spec exists (396 paths) but no contract tests |
| Load/failure tests | `scripts/load-testing/README.md` | Load baseline + chaos | Skeleton only | Medium | No executable load scripts |
| Migration tests | CI `supabase db reset` + `supabase-migrations.yml` | Migrations apply cleanly | Indirect only | Low | No dedicated migration test suite |
| Pre-commit | `.husky/pre-commit` | Secret scan + lint-staged | Implemented | Low | — |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Unit tests | 5 | 2,488 passing across 4 packages at HEAD; fresh run this audit | None | Keep gates; add jest `--detectOpenHandles` hygiene (see TEST-P3-001) |
| Integration tests | 4 | 734 API supertest suites (routers + middleware + services) | DB-backed integration tests mock Supabase; no Postgres-backed integration suite | Add a thin PostgREST-backed integration suite for critical CRUD paths |
| API tests | 5 | 734/77 suites green; ssrf, idempotency, rate-limit, webhook-signature, cache-collision regression tests | None | — |
| E2E | 4 | 90 spec files; CI pipeline full-stack; documented 253 tests green (2026-08-04/05) | Not executed locally this audit; count drifts from docs (253 claimed vs spec growth) | Re-run CI E2E at this HEAD; record actual count in AGENTS.md |
| Component tests | 4 | Web 1450 incl. page/component/action suites (permissions, HasPermission, RouteGuard, sidebars, org switcher, module detail pages) | Some client components lack direct coverage | Target remaining untested client components via coverage report |
| Visual regression | 1 | Storybook exists; Chromatic non-blocking (known Next 15.5 + webpack5 conflict) | No enforced screenshot diffs | Fix Storybook build or use alternative (Playwright screenshot fixtures) |
| Accessibility | 4 | `a11y.spec.ts` axe WCAG A/AA on login/store/portal-dashboard/admin | 4 of ~220 pages; filters out `minor`/`moderate` | Expand to top-20 pages; include all violation severities |
| Contract tests | 1 | OpenAPI spec (396 paths) | No automated contract validation | Add spec-vs-route coverage check (compare OpenAPI paths to Express router table) |
| Migration tests | 3 | E2E CI `supabase db reset`; hosted `db push` with shadow-DB dry-run | No explicit migration unit tests | Add `supabase db reset` to validate.yml and a migration test script |
| Security tests | 4 | middleware.test.ts (21), ssrf-guard, idempotency, auth-expired, admin-gate, permission tests | No DAST/fuzz; no secret-scan in CI (pre-commit only) | Add gitleaks/trufflehog scan step to CI |
| Load/failure tests | 1 | `scripts/load-testing/README.md` placeholder | No executable load or failure-injection tests | Add k6/autocannon scripts + a Redis-failure simulation |
| Smoke tests | 4 | /health endpoints (API/worker), web HEALTHCHECK, E2E global.setup auth, deploy health curls | No scheduled prod smoke | Add a cron smoke job hitting prod /health + login |

## Detailed Review

### Item: API test suite

- Evidence: `apps/api/src/__tests__/` — 77 suites
- What it does: supertest-based integration tests over the Express app; routers, auth middleware, org access, caching, rate limiting, idempotency, webhooks, billing, permissions, IDOR regressions.
- How it appears to work: Fresh run: **734 passed / 734 total** in 62.976s. One Jest "worker process failed to exit gracefully" warning (force-exit) — see TEST-P3-001.
- Dependencies: mocked Supabase admin client, mocked Redis, `src/__mocks__/redis.ts` moduleNameMapper.
- Current controls: coverage threshold 58/50/55/30 (statements/functions/lines/branches); CI-enforced.
- Missing controls: Postgres-backed integration tests; `--detectOpenHandles` hygiene.
- Risks: Low.
- Recommended improvement: Address Jest leak warning; add DB-backed integration tier later.
- Suggested tests: none urgent.
- Suggested docs: update test counts in AGENTS.md (734 not 731).

### Item: Web test suite

- Evidence: `apps/web/__tests__/` — 210 suites
- What it does: Next.js App Router page tests (server + client), server actions, permission utils/hooks/components, sidebars, admin/portal module pages.
- How it appears to work: Fresh run: **1450 passed / 1450 total** in 126.18s. No leak warning.
- Dependencies: jest-custom-environment, `server-only` mock, `@mct/ui` mapping.
- Current controls: coverage threshold 35/30/35/25; CI-enforced.
- Missing controls: coverage is modest (35% lines) — fine for gate purposes, but untested branches of new module-config pages may hide regressions.
- Risks: Low.
- Recommended improvement: none blocking.
- Suggested tests: none.
- Suggested docs: update AGENTS.md count (1450, was 1437/1436/1434/1429 in older entries).

### Item: Worker + SDK suites

- Evidence: `apps/worker/src/__tests__/` (6 suites), `packages/sdk/src/__tests__/` (2 suites)
- What it does: worker env-schema/task-handler tests (incl. orphan-cleanup, webhook-retry, health server); SDK mocked-fetch client tests.
- How it appears to work: Fresh runs: **Worker 40 passed/6 suites** (11.55s), **SDK 264 passed/2 suites** (11.14s). Both emit Jest force-exit leak warnings.
- Dependencies: jest.setup fake timers (SDK), globalTeardown (worker).
- Current controls: coverage thresholds worker 12/15/12/5, SDK 40/38/40/33; `--forceExit` in scripts (masks leak warnings).
- Missing controls: root-cause of leaked handles (likely unref'd interval/timeout in module-tasks or producer).
- Risks: Low-medium — forceExit is a smell that may hide real open handles in production code paths.
- Recommended improvement: run `jest --detectOpenHandles` once and fix the leaking handle, then drop `--forceExit`.

### Item: E2E

- Evidence: `apps/web/e2e/` (90 spec files), `apps/web/playwright.config.ts`, `.github/workflows/e2e.yml`
- What it does: Full-stack Playwright (chromium) against production builds with local Supabase + seeds.
- How it appears to work: Config verified: `expect.timeout = 15000` (line 19-21), `retries = 2` in CI (line 7), `workers = 1` in CI, trace/video on retry, global auth setup via `e2e/global.setup.ts`. CI (e2e.yml) runs `supabase db reset` (migrations + seeds), builds API/web, sources `.env.local`, and runs Playwright. Documented result: 253/253 green (2026-08-04/05, pre-HEAD commits).
- Dependencies: local Supabase CLI, E2E secrets.
- Current controls: path-filtered triggers, 45-min timeout, artifact upload on failure.
- Missing controls: no local `pnpm e2e` verification in dev loop without full stack; count drift in docs.
- Risks: Medium — spec growth beyond documented counts; a11y and new module specs may have pushed totals.
- Recommended improvement: run the CI E2E job at this HEAD and record the actual test count.

### Item: Accessibility

- Evidence: `apps/web/e2e/a11y.spec.ts`
- What it does: axe-core scans with `wcag2a/wcag2aa/wcag21a/wcag21aa`, asserts no critical/serious violations.
- How it appears to work: 4 pages: `/login`, `/store`, `/portal/dashboard`, `/admin`.
- Missing controls: only critical/serious impacts asserted; only 4 of ~220 pages; `minor`/`moderate` violations are invisible to the gate.
- Recommended improvement: extend to top 20 high-traffic pages; include all impact levels in report while keeping gate at critical/serious.

### Item: Migration tests

- Evidence: `.github/workflows/e2e.yml` (`supabase db reset`), `.github/workflows/supabase-migrations.yml` (hosted `db push`)
- What it does: E2E CI proves migrations + seeds apply on a clean local DB; migrations workflow pushes to hosted with shadow-DB dry-run.
- Missing controls: no unit-testable migration assertions; no migration test in validate.yml.
- Recommended improvement: add `supabase db reset` smoke to validate.yml or a dedicated migration check job.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| TEST-001 | Unit tests | 2,488 passing/295 suites (fresh run) | 4-package jest + thresholds | None | — | Keep |
| TEST-002 | Integration tests | API supertest suites 734 | Router/service integration | No Postgres-backed tier | P3 | Add thin DB-backed integration suite |
| TEST-003 | API tests | 734/77 suites green | Full router coverage | None | — | Keep |
| TEST-004 | E2E | 90 specs; CI pipeline | Full-stack CI | Not run at this HEAD; count drift | P2 | Re-run CI E2E; record actual count |
| TEST-005 | Component tests | Web 1450 | Page/component/action suites | Some client components uncovered | P3 | Use coverage report to target |
| TEST-006 | Visual regression | Storybook + Chromatic | Non-blocking Chromatic | Not enforced | P3 | Fix Storybook/Next conflict or use Playwright screenshots |
| TEST-007 | Accessibility | a11y.spec.ts (4 pages) | Axe WCAG A/AA gate | Coverage thin | P2 | Expand pages; report all impacts |
| TEST-008 | Contract tests | OpenAPI 396 paths | None | No spec-vs-impl validation | P2 | Add OpenAPI coverage check |
| TEST-009 | Migration tests | E2E db reset + hosted push | Indirect validation | No dedicated suite | P3 | Add db-reset smoke to validate.yml |
| TEST-010 | Security tests | middleware 21, ssrf, idempotency, rate-limit | Strong unit security coverage | No CI secret scan/DAST | P2 | Add gitleaks to CI |
| TEST-011 | Load/failure tests | README placeholder | None | No load/chaos scripts | P2 | Add k6/autocannon + Redis-failure sim |
| TEST-012 | Smoke tests | health endpoints, global.setup, deploy curls | Deploy-time smoke | No scheduled prod smoke | P3 | Add cron smoke job |

## Findings

### Finding ID: TEST-P2-001 - E2E count drift and unverifiable local execution

- Severity: P2
- Confidence: High
- Area: Testing / Release confidence
- Evidence:
  - `apps/web/e2e/` — 90 spec files at HEAD
  - `AGENTS.md` — documents "253/253 tests passing" (2026-08-04/05, before HEAD)
  - `.github/workflows/e2e.yml` — the only place E2E runs
- What is happening: The E2E suite has grown to 90 spec files, but the documented count (253) predates HEAD 75d3926 and the latest spec additions; E2E cannot be run locally without a full Supabase local stack, so the actual current count is unverified.
- Why it matters: Release confidence claims are based on stale counts; a regression in any of the newer specs would only surface in CI.
- User / business impact: False confidence in release readiness; possible red CI on next push.
- Security / privacy / reliability impact: Low direct impact; CI does catch failures.
- Recommended fix: Run the E2E job at this HEAD, record actual pass count + suite count in AGENTS.md; add a small script (`scripts/run-e2e-local.*`) that starts the stack and runs `pnpm e2e`.
- Suggested validation: CI E2E green at 75d3926; AGENTS.md count updated.
- Owner suggestion: Platform engineer.
- Effort estimate: S (script + doc) / M (CI run)
- Dependencies: Local Supabase CLI.
- Status: Open

### Finding ID: TEST-P2-002 - No executable load or failure-injection tests

- Severity: P2
- Confidence: High
- Area: Testing / Resilience validation
- Evidence:
  - `scripts/load-testing/README.md` — placeholder only (no runnable scripts)
  - `apps/api/src/middleware/rate-limit.ts` — per-user 600/15min limits, no baseline data
- What is happening: The load-testing directory contains documentation but no executable load tests, so rate-limit thresholds, autoscaling decisions, and Redis/queue saturation behavior have no empirical baseline.
- Why it matters: "Release confidence" cannot cover performance or capacity; the platform has never been load-tested.
- User / business impact: Unknown capacity ceiling; a traffic spike could exhaust per-user rate limits or the single-droplet deployment.
- Security / privacy / reliability impact: Reliability risk under load.
- Recommended fix: Add k6 or autocannon scripts for auth + ticket/project/compound endpoints; add a Redis-down and Supabase-down failure simulation test.
- Suggested validation: Load script reaches documented req/s; failure scripts assert 503-with-healthy-liveness behavior.
- Owner suggestion: Platform engineer.
- Effort estimate: M
- Dependencies: None.
- Status: Open

### Finding ID: TEST-P2-003 - No contract tests between OpenAPI spec and Express routes

- Severity: P2
- Confidence: High
- Area: Testing
- Evidence:
  - `apps/api/src/routes/docs.ts` / OpenAPI spec — 396 paths documented
  - `apps/api/src/app.ts` — router mounts; no spec-vs-route verification
- What is happening: The OpenAPI spec is generated/maintained but nothing validates that every documented path/verb exists in Express and vice versa; spec drift goes undetected.
- Why it matters: SDK types are generated against API behavior manually; a mismatch ships silently to clients.
- User / business impact: Client integration failures post-release.
- Security / privacy / reliability impact: Low; correctness drift.
- Recommended fix: Add a jest test that walks `app._router.stack` and asserts every OpenAPI path is mounted, and that no mounted route is undocumented.
- Suggested validation: Spec-vs-router diff test green.
- Owner suggestion: Implementation agent.
- Effort estimate: S-M
- Dependencies: None.
- Status: Open

### Finding ID: TEST-P2-004 - Accessibility gate covers only 4 of ~220 pages and filters out minor/moderate violations

- Severity: P2
- Confidence: High
- Area: Testing / Accessibility
- Evidence:
  - `apps/web/e2e/a11y.spec.ts` — pages: `/login`, `/store`, `/portal/dashboard`, `/admin`; filters `v.impact === "critical" || v.impact === "serious"`
- What is happening: The axe gate is real but narrow: 4 pages, and only critical/serious violations fail the test.
- Why it matters: WCAG AA compliance on the long tail of admin/portal module pages is unverified.
- User / business impact: Unaudited accessibility defects on module pages; potential legal exposure for a client-facing portal.
- Security / privacy / reliability impact: Low.
- Recommended fix: Expand the page list to the top 20 traffic pages (login, store, portal dashboard, ticket/project/document details, admin roles/users/orgs); keep gate at critical/serious but log all impacts.
- Suggested validation: a11y spec green with 20 pages.
- Owner suggestion: Frontend engineer.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: TEST-P2-005 - No secret-scan step in CI (pre-commit only)

- Severity: P2
- Confidence: High
- Area: Security testing / CI
- Evidence:
  - `.husky/pre-commit` — `sh scripts/scan-secrets.sh` + `pnpm exec lint-staged`
  - `.github/workflows/test.yml` / `validate.yml` — no gitleaks/trufflehog step
- What is happening: Secret scanning runs only in the local pre-commit hook; CI (including `workflow_call` validate gates consumed by deploy workflows) does not re-scan.
- Why it matters: A committed secret bypasses local hooks (e.g., `--no-verify`, IDE commits) and reaches the hosted DB/environment config.
- User / business impact: Credential exposure if `.env` or a test fixture with a real key is committed.
- Security / privacy / reliability impact: Security — credential leakage.
- Recommended fix: Add `gitleaks` action to test.yml and validate.yml.
- Suggested validation: CI red on a planted dummy key; green on clean commit.
- Owner suggestion: Platform engineer.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: TEST-P3-001 - Jest worker-process leak warnings in API, Worker, and SDK runs

- Severity: P3
- Confidence: High
- Area: Testing hygiene
- Evidence:
  - Fresh runs at HEAD: API, Worker, SDK all printed "A worker process has failed to exit gracefully and has been force exited" / "Force exiting Jest"
  - `apps/worker/package.json` — `"test": "jest --passWithNoTests --forceExit"`; `packages/sdk/package.json` — `"test": "jest --forceExit"`
- What is happening: Leaked handles (likely unref'd timers/intervals or open connections in module-tasks/producer/test mocks) force Jest to exit; `--forceExit` papers over it.
- Why it matters: `--forceExit` can mask pending async work that would fail tests; the leak may reflect real unref'd handles in production code (e.g., queue clients).
- User / business impact: None directly; false green on teardown.
- Security / privacy / reliability impact: Reliability — hidden open handles.
- Recommended fix: Run each suite once with `--detectOpenHandles`, fix the leaking handle, remove `--forceExit`.
- Suggested validation: Suites exit cleanly without force-exit.
- Owner suggestion: Implementation agent.
- Effort estimate: S-M
- Dependencies: None.
- Status: Open

### Finding ID: TEST-P3-002 - Visual regression not enforced (Chromatic non-blocking)

- Severity: P3
- Confidence: High
- Area: Testing
- Evidence:
  - `AGENTS.md` — "Chromatic non-blocking (known Next 15.5 + Storybook webpack5 conflict)"
  - `apps/web/.storybook/` present; `pnpm --filter=web storybook` scripts
- What is happening: Storybook exists but Chromatic is configured non-blocking due to a build conflict, so UI regressions are not caught by screenshot diffing.
- Why it matters: CSS/layout regressions ship without visual review.
- User / business impact: Minor cosmetic regressions.
- Recommended improvement: Either fix the Storybook/Next conflict, or add lightweight Playwright screenshot fixtures for the top pages.
- Suggested validation: Baseline screenshot diff in CI.
- Owner suggestion: Frontend engineer.
- Effort estimate: M
- Dependencies: Storybook 8.6.18 alignment.
- Status: Open

### Finding ID: TEST-P3-003 - Coverage thresholds are set but modest; worker/sdk gates are minimal

- Severity: P3
- Confidence: High
- Area: Testing / Coverage
- Evidence:
  - `apps/worker/jest.config.mjs` — 12/15/12/5 (statements/functions/lines/branches)
  - `apps/web/jest.config.mjs` — 35/30/35/25
  - `apps/api/jest.config.mjs` — 58/50/55/30
  - `packages/sdk/jest.config.mjs` — 40/38/40/33
- What is happening: Thresholds are realistic and CI-enforced, but several new module-tasks (module-tasks.ts, 856 lines, 17 handlers) have little direct coverage; worker branch threshold of 5% is nearly a no-op.
- Why it matters: Scan tasks (patch/endpoint/m365/backup-dr/dmarc/status/phishing/saas) mutate production data when they run — low coverage risks silent logic regressions (e.g., the 5302126 state-column fixes).
- Recommended improvement: Add handler-level tests for the 17 module tasks (a table-driven test over mock rows); raise worker branch threshold to ~25%.
- Suggested validation: Worker suite green with raised thresholds.
- Owner suggestion: Implementation agent.
- Effort estimate: M
- Dependencies: None.
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| E2E count drift → stale release confidence | P2 | Medium | False green claims | 90 specs vs 253 documented | Re-run CI E2E at HEAD; document actual |
| Unload-tested single-droplet production | P2 | Medium | Capacity outage under spike | load-testing README placeholder | Add k6 baseline |
| Contract drift between OpenAPI and Express | P2 | Medium | Client breakage | 396 paths, no contract test | Spec-vs-router test |
| Secret committed past pre-commit | P2 | Low | Credential leak | No CI secret scan | Gitleaks in CI |
| a11y blind spots on module pages | P2 | Medium | Compliance exposure | 4-page axe gate | Expand page set |
| Jest forceExit masking leaks | P3 | Medium | Hidden open handles | leak warnings in 3 packages | detectOpenHandles pass |

## Recommendations

### Immediate / Release Blocking

None at current HEAD — all suites green; CI E2E re-run recommended before the next deploy to refresh the documented count.

### This Week

1. Re-run CI E2E at 75d3926; record actual counts in AGENTS.md (TEST-P2-001).
2. Add `--detectOpenHandles` pass on API/Worker/SDK and remove `--forceExit` (TEST-P3-001).
3. Add gitleaks step to test.yml + validate.yml (TEST-P2-005).

### This Month

4. Spec-vs-router contract test (TEST-P2-003).
5. Expand a11y page set to 20 pages (TEST-P2-004).
6. Table-driven tests for the 17 module scan tasks; raise worker thresholds (TEST-P3-003).
7. k6/autocannon load scripts + Redis-down failure simulation (TEST-P2-002).

### Later / Platform Evolution

8. Postgres-backed integration tier.
9. Enforce visual regression (fix Storybook/Chromatic or Playwright screenshots).
10. Scheduled prod smoke job (health + login).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Update AGENTS.md test counts to actuals (API 734, SDK 264, Worker 40, Web 1450) | Stops stale-count claims | `AGENTS.md` | grep counts match jest output |
| Run jest with `--detectOpenHandles` once | Removes forceExit smell | 3 package.json files | clean exit |
| Add gitleaks action | CI-level secret protection | `test.yml`, `validate.yml` | planted-key test |
| a11y: add 4 more high-traffic pages | Broader WCAG assurance | `apps/web/e2e/a11y.spec.ts` | CI green |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| E2E local runner script | P2 | Platform engineer | S | Supabase CLI |
| Contract test (OpenAPI vs router) | P2 | Implementation agent | S-M | OpenAPI spec |
| Load tests (k6/autocannon) | P2 | Platform engineer | M | — |
| Module-task table-driven tests | P2 | Implementation agent | M | — |
| a11y page expansion | P2 | Frontend engineer | S | — |
| CI secret scan | P2 | Platform engineer | S | — |
| Detect-open-handles cleanup | P3 | Implementation agent | S-M | — |
| Visual regression enforcement | P3 | Frontend engineer | M | Storybook fix |
| Postgres-backed integration tier | P3 | Platform engineer | L | Test DB setup |

## Suggested Tests

- Contract: walk `app._router.stack`, assert OpenAPI path/verb parity.
- Module tasks: table-driven tests for each of the 17 scan handlers with mock `supabase.from()` responses (success, empty, error paths).
- Failure injection: Redis-down → cache falls back to memory; queue-down → enqueueTask returns false; Supabase-down → circuit breaker trips, /health reports unhealthy.
- E2E: login → create ticket → verify badge (already exists as notification-flow); add a prod smoke cron.
- CI: gitleaks planted-key test.

## Suggested Documentation Updates

- `AGENTS.md` — refresh test counts (2,488 total: API 734, SDK 264, Worker 40, Web 1450) and E2E count after CI re-run.
- `scripts/load-testing/README.md` — replace placeholder with runnable instructions + baseline results.
- `docs/INDEX.md` — add testing-hygiene doc if created (detect-open-handles runbook).

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| What is the actual E2E pass count at HEAD 75d3926? | Release confidence claim | CI E2E run at this SHA |
| Do the 17 module scan tasks have any test coverage? | Data-mutating production jobs | Jest coverage report for `module-tasks.ts` |
| Which handle leaks in API/Worker/SDK Jest runs? | forceExit masking | `--detectOpenHandles` output |
| Is the OpenAPI spec (396 paths) current vs `app.ts` mounts at this SHA? | Contract drift | Spec-vs-router diff |

## Appendix

### Raw test command output (fresh runs at HEAD 75d3926)

```
$ pnpm --filter=api test
Test Suites: 77 passed, 77 total
Tests:       734 passed, 734 total
Time:        62.976 s
(A worker process has failed to exit gracefully and has been force exited...)

$ pnpm --filter=web test
Test Suites: 210 passed, 210 total
Tests:       1450 passed, 1450 total
Time:        126.18 s

$ pnpm --filter=worker test
Test Suites: 6 passed, 6 total
Tests:       40 passed, 40 total
Time:        11.554 s
(Force exiting Jest...)

$ pnpm --filter=sdk test
Test Suites: 2 passed, 2 total
Tests:       264 passed, 264 total
Time:        11.143 s
(Force exiting Jest...)
```

**Totals: 2,488 tests across 295 suites — ALL PASSING.**

### Manual QA checklist (pre-release)

- [ ] CI E2E green at release SHA (actual count recorded)
- [ ] `pnpm test:coverage` passes all 4 package thresholds
- [ ] Lint + typecheck clean
- [ ] `supabase db push` applies to hosted without error
- [ ] `/health` on prod returns 200 for api + worker
- [ ] Login → portal dashboard → create ticket → notification badge flow on hosted dev
- [ ] Admin permissions matrix loads (cache-collision regression check)
- [ ] Test-accounts page renders 37 accounts
