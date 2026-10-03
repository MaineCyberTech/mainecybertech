# Documentation, Developer Experience, and Operator Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: `20260806-1722-develop-75d3926`
- Repository: `C:\temp\mainecybertech-portal`
- Branch: `develop`
- Commit SHA: `75d39269310fcc09826fe532d5838d3a53d1739a` (short: `75d3926`)
- Generated at: 2026-08-06 17:41 (local)
- Auditor: Principal-level repository auditor (automated evidence pass)
- Area code: DOC
- Output path: `prompts/repo-deep-dive/20260806-1722-develop-75d3926/16_documentation_devex_operator_readiness.md`
- Scope limitations: Static doc/source cross-referencing. Test counts were computed statically from source (`test(`/`it(` declarations), not by executing the suites; E2E counts are static `test()` calls in spec files. Lint was executed (`pnpm lint`), typecheck was not re-run. Docs were scanned for link validity (local links only) and file counts; full prose review was sampled, not exhaustive.

## Scope

Reviewed: README/AGENTS.md accuracy (test counts, page counts, claims), local setup docs, env docs vs actual `.env.example` and Zod schemas (API/Worker/Web), architecture/API docs (OpenAPI, MODULE_AUDIT), DB/migration docs, testing docs, deploy/rollback docs, incident/security docs, operator manuals (runbooks/features/modules), troubleshooting, ADRs, scripts docs, prompt packs, repo maps, and repo hygiene cross-cuts (TODO/FIXME, dead code, `.env.example` accuracy, Storybook config, SDK lint script, worktree cleanliness).

Not reviewed: prose quality of every one of the 75 module docs, all 60 runbooks, all 60 feature docs in depth; GitHub wiki; external hosting docs.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `AGENTS.md` (HEAD) | Doc | Canonical repo knowledge base | Test-count claims: API 731, SDK 264, Web 1450, Worker 40 (line 39); E2E "253/253", "60 spec files"; stale table at line 100 (2,417 / API 701, SDK 251, Worker 31, Web 1434) |
| `apps/api/jest.config.mjs`, `apps/web/jest.config.mjs`, `apps/worker/jest.config.mjs`, `packages/sdk/jest.config.mjs` | Config | Test framework ground truth | testMatch patterns, coverage thresholds, helpers exclusions |
| Static test-declaration counts | Computed | Verify claimed counts | API 665 (+3 `it.each` blocks), SDK 264, Worker 40, Web 1450, E2E 338 `test()` calls in 90 spec files |
| `apps/web/e2e/**` (90 spec files) | Source | E2E inventory | 26 admin, 59 portal, 2 root, 2 marketing, 1 auth; 0 skipped, 0 `test.only` |
| `docs/INDEX.md` | Doc | Link validity | 135 internal links scanned — 0 broken |
| `docs/modules/` | Docs | Module doc inventory | 75 files (claim: 75 ✓) |
| `docs/features/`, `docs/runbooks/`, `docs/seo/`, `docs/adr/` | Docs | Doc inventory | 60 / 60 / 10 / 1 |
| `docs/openapi.yaml` | Doc | API contract | 8,615 lines; 396 operations; 280 unique paths (claim: "396 paths") |
| `apps/api/src/openapi/spec.ts` | Source | Spec generator | 396 `RouteDef` entries; 280 unique paths; 48 tags |
| `docs/TROUBLESHOOTING.md` | Doc | Operator troubleshooting | Exists (53 lines); covers API/Web/Worker/Deploy |
| `apps/api/.env.example` vs `apps/api/src/config/env.ts` | Env | Env doc accuracy | Schema 32 keys; example missing 4 (REDIS_URL, TASK_QUEUE_ENABLED, REDIS_PASSWORD, M365_CLIENT_STATE) |
| `apps/worker/.env.example` vs `apps/worker/src/env.ts` | Env | Env doc accuracy | 27/27 keys covered ✓ |
| `apps/web/.env.example` | Env | Env doc accuracy | 7 vars; `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED` absent (deploy arg, by design) |
| `scripts/README.md` + `scripts/` dir | Doc | Script docs | 27 files; README covers 25; missing `apply-content-map.js`, `generate-details.js` |
| `package.json` scripts | Config | Root DX | `lint`, `test`, `typecheck`, `e2e`, `ci`, `storybook` — comprehensive |
| `packages/sdk/package.json` | Config | SDK scripts | **No `lint` script** — SDK excluded from `pnpm lint` |
| `.storybook/main.ts` + `chromatic.yml` | Config/CI | Storybook/docs tooling | staticDirs `../apps/web/public` ✓; deps 8.6.18 ✓; Chromatic non-blocking ✓; 7 stories all in `packages/ui` |
| `pnpm lint` execution | Executed | Lint status | turbo 3/3 tasks successful (api, web, worker exit 0); SDK has no lint script |
| `git status` | VCS | Repo cleanliness | 34 modified files — all under `prompts/hardening_prompt_pack/engine/deep_audit/*.json` (audit-run artifacts, not app code) |
| TODO/FIXME grep across `apps/*/src`, `packages/sdk/src` | Computed | Dead/marker code | 0 matches in app/source code (1 false positive in a test URL string) |

## Executive Summary

The repository's documentation layer is one of its strongest assets: 43 top-level docs, 75 module docs, 60 feature docs, 60 runbooks, 10 SEO docs, an ADR index, an OpenAPI contract (396 operations), an auto-generated audit trail, and a highly detailed AGENTS.md knowledge base. All 135 internal links in `docs/INDEX.md` resolve. Env docs for Worker and Web are 1:1 accurate against their Zod schemas; the API `.env.example` lags 4 schema keys. Lint is genuinely clean (verified by execution: 3/3 tasks, exit 0), and the source tree carries zero TODO/FIXME markers.

The main risk is **claim drift in AGENTS.md**: the E2E section understates reality by ~50% (90 spec files / 338 tests vs "60 spec files / 252-253 tests"), the "Test Status & Patterns" table (line 100) is stale relative to its own latest session note (2,417 vs 2,485 total), and several historical counts (e.g., "all 242 pages titled") no longer match the current 301-page surface. The OpenAPI claim "396 paths" is really 396 operations across 280 unique paths. None of this is release-blocking — the code is demonstrably green — but AI agents and new developers navigating via AGENTS.md will inherit stale numbers.

Secondary gaps: SDK package has no lint script (silently excluded from lint); `scripts/README.md` misses 2 script entries; `TROUBLESHOOTING.md` is thin (53 lines) for a platform of this scale; 34 uncommitted JSON audit artifacts sit in the worktree.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| README | `README.md`, `README.dev.md`, `AGENTS.md` | Onboarding/knowledge base | Comprehensive | Medium | AGENTS.md count drift |
| Local setup | `README.dev.md`, `scripts/*` | Local dev | Comprehensive | Low | Scripts match README index (25/27) |
| Env docs | `docs/ENVIRONMENT_VARIABLES.md`, 3 `.env.example` | Env reference | Good | Medium | API example missing 4 keys |
| Architecture/API docs | `docs/MODULE_AUDIT.md`, `docs/openapi.yaml`, `docs/API_ENDPOINT_INVENTORY.md` | System understanding | Strong | Low | OpenAPI count terminology |
| DB/migration docs | `docs/migrations/naming-guide.md`, `supabase/migrations` | DB practice | Strong | Low | 100+ migrations |
| Testing docs | `AGENTS.md` test patterns, jest configs | Test authoring | Strong | Medium | AGENTS.md counts stale |
| Deploy/rollback docs | `docs/ROLLBACK_PROCEDURES.md`, deploy workflows | Ops | Strong | Low | — |
| Incident/security docs | `docs/MONITORING_AND_ALERTING.md`, `SECRETS_ROTATION.md`, `JWT_ROTATION.md` | Ops | Strong | Low | — |
| Contribution/coding standards | `AGENTS.md`, husky/lint-staged, ESLint configs | Standards | Good | Low | No CONTRIBUTING.md |
| PR/release process | workflow docs in AGENTS.md | Process | Good | Low | No dedicated doc |
| Operator manuals | 60 runbooks, 60 feature docs, `FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Ops | Strong | Low | — |
| Troubleshooting | `docs/TROUBLESHOOTING.md` | Support | Functional | Medium | 53 lines, thin |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| README | 4 | `AGENTS.md` deep knowledge base, root README, README.dev | Stale counts (E2E 90/338 vs 60/253; totals 2,485 vs 2,417) | Update counts; note generation method |
| Local setup | 4 | `README.dev.md`, 27 scripts with README | 2 scripts missing from index | Add entries |
| Env docs | 3 | Worker 27/27 ✓, Web 7/7 ✓, API 28/32 | API example missing REDIS_URL/TASK_QUEUE_ENABLED/REDIS_PASSWORD/M365_CLIENT_STATE | Add 4 keys |
| Architecture/API docs | 4 | MODULE_AUDIT, OpenAPI 396 ops, API_ENDPOINT_INVENTORY | "396 paths" is 280 unique paths | Fix terminology |
| DB/migration docs | 4 | naming-guide, 100+ timestamped migrations, seeds docs | — | — |
| Testing docs | 4 | AGENTS test patterns, coverage thresholds in CI | Count drift; API static 665 vs claimed 731 (plausible via `.each` expansion) | Verify by run; publish counts |
| Deploy/rollback docs | 4 | ROLLBACK_PROCEDURES, deploy-do, terraform-do docs | — | — |
| Incident/security docs | 4 | MONITORING_AND_ALERTING, SECRETS_ROTATION, JWT_ROTATION | — | — |
| Contribution/coding standards | 3 | AGENTS.md conventions, lint-staged | No CONTRIBUTING.md; SDK lacks lint script | Add CONTRIBUTING.md; add SDK lint |
| PR/release process | 3 | Workflows documented in AGENTS.md | No standalone release-process doc | Consider RELEASING.md |
| Operator manuals | 4 | 60 runbooks, 60 features, 75 modules, ops handbook | — | — |
| Troubleshooting | 3 | `docs/TROUBLESHOOTING.md` (53 lines) | Thin for 4-service stack | Expand sections |

## Detailed Review

### Item: AGENTS.md test-count accuracy

- Evidence: `AGENTS.md` line 39 claims "API 731, SDK 264, Web 1450, Worker 40"; line 100 table claims "2,417 tests, all passing (2026-08-02 verified): API 701, SDK 251, Worker 31, Web 1434"; E2E claims "252 tests / 60 spec files" (line ~100) and "253/253" (lines 23/35).
- What it does: Serves as the canonical state-of-repo document for humans and AI agents.
- How it appears to work: Session entries append cumulative deltas; the test-status table at line 100 was last updated 2026-08-02 and was not refreshed by later sessions.
- Dependencies: Jest/Playwright output.
- Current controls: Cumulative session notes.
- Missing controls: No CI job regenerates/publishes the count; no script derives "current totals" from source.
- Risks: Agents inherit stale numbers; line 100 (2,417) contradicts line 39 (2,485 cumulative: 731+264+1450+40).
- Recommended improvement: Update line 100 table; add `pnpm test --silent | tail` badge-style totals, or a `scripts/test-counts.mjs` that scans declarations and writes a JSON consumed by AGENTS.md generation.
- Suggested tests: N/A (doc process).
- Suggested docs: AGENTS.md "Test Status" section refresh.

### Item: E2E inventory drift (biggest gap)

- Evidence: `apps/web/e2e/**` contains **90 spec files** (26 admin, 59 portal, 2 root, 2 marketing, 1 auth) with **338 `test()` declarations**; 0 skipped, 0 `test.only`. AGENTS.md documents "60 spec files" and "252-253 E2E tests".
- What it does: CI E2E suite (Playwright, chromium).
- How it appears to work: Runs via `pnpm e2e` → `playwright test`; CI `e2e.yml`.
- Dependencies: seeded Supabase (`db reset` in workflow).
- Current controls: Green CI runs recorded in session notes.
- Missing controls: The doc count is ~50% below reality — likely because later sessions added specs (e.g., 20 portal page specs on 2026-07-27, 25 E2E specs on 2026-08-05) without updating the summary table.
- Risks: Operators/agents under-estimate E2E runtime and coverage; "253/253 green" reads as the ceiling.
- Recommended improvement: Update AGENTS.md to "90 spec files / 338 tests"; consider `npx playwright test --list` output as the source of truth in CI logs.
- Suggested tests: `pnpm e2e --list` in CI artifact.
- Suggested docs: AGENTS.md E2E row.

### Item: OpenAPI count terminology

- Evidence: `docs/openapi.yaml` has 280 path items (`^  /...` lines) and 396 operation objects; `apps/api/src/openapi/spec.ts` defines 396 `RouteDef` entries; AGENTS.md says "OpenAPI 396 paths".
- What it does: API contract documentation (served at `/api/v1/openapi.json` + Swagger UI).
- How it appears to work: Manually-maintained `RouteDef` array → `buildPaths()` → generated YAML (header warns "do not edit by hand"; regeneration via `scripts/gen-openapi.mjs`).
- Dependencies: `builder.ts` types.
- Current controls: Auto-generated file + regeneration script.
- Missing controls: 280 paths ≠ 396 operations claim; also no CI check that `spec.ts` and `docs/openapi.yaml` are in sync (regeneration could drift silently).
- Risks: Low; terminology confusion only — but a desynced YAML would mislead SDK/API consumers.
- Recommended improvement: Correct the claim ("396 operations across 280 paths"); add a CI step regenerating and diffing the YAML.
- Suggested tests: `pnpm --filter=api exec tsx scripts/gen-openapi.mjs && git diff --exit-code docs/openapi.yaml` in `lint.yml` or `validate.yml`.
- Suggested docs: `docs/INDEX.md` openapi.yaml row (already notes generation command).

### Item: `.env.example` accuracy

- Evidence: `apps/api/.env.example` (28 keys) vs `apps/api/src/config/env.ts` schema (32 keys). Missing: `REDIS_URL`, `TASK_QUEUE_ENABLED`, `REDIS_PASSWORD`, `M365_CLIENT_STATE`. Worker: `apps/worker/.env.example` (27 keys) covers all 27 schema keys. Web: 7 keys; `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED` is a Docker build arg/CI env (deployed via `deploy-do.yml`), acceptable absence locally.
- What it does: Onboarding template for local dev.
- How it appears to work: Copy to `.env`/`.env.local`; API validates via Zod and crashes fast with missing-key messages.
- Dependencies: Zod schemas.
- Current controls: Schema validation is the enforcement point; examples are mostly complete.
- Missing controls: The 4 API keys missing from the example are optional in the schema, so no crash — but Redis-backed features (queue producer, webhook idempotency, cache) silently degrade without them.
- Risks: New devs build a working-but-degraded local stack (no queue, no dedup) without realizing it.
- Recommended improvement: Add the 4 keys (with empty defaults and comments) to `apps/api/.env.example`.
- Suggested tests: `compare-env` script that diffs `.env.example` keys against the schema keys (cheap; add to `scripts/`).
- Suggested docs: `docs/ENVIRONMENT_VARIABLES.md` already lists these; add note that API queues need REDIS_URL.

### Item: SDK lint gap

- Evidence: `packages/sdk/package.json` scripts = `{ typecheck, test, test:coverage }` — no `lint`; root `pnpm lint` (turbo) ran 3/3 (api, web, worker). `pnpm --filter=sdk lint` → `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`.
- What it does: SDK package ships without lint coverage.
- How it appears to work: SDK typechecks and tests pass; ESLint simply never runs on `packages/sdk`.
- Dependencies: ESLint config in `packages/config`.
- Current controls: Typecheck + tests.
- Missing controls: No lint script, so SDK code style/smells (dead imports, unused vars) are unchecked — the "lint 0 errors" claim implicitly excludes SDK.
- Risks: Low today (SDK is small and type-checked), but the claim "ESLint clean" is technically narrower than advertised.
- Recommended improvement: Add `"lint": "eslint src/"` to `packages/sdk/package.json` (and ensure the shared ESLint config covers it).
- Suggested tests: `pnpm lint` shows 4 tasks.
- Suggested docs: AGENTS.md note if SDK is added.

### Item: Storybook/docs tooling

- Evidence: Root `.storybook/main.ts` — `staticDirs: ["../apps/web/public"]` ✓ (claim verified), stories globs include `apps/web/components` (0 matches) + `packages/ui` (7 stories); all storybook deps at `^8.6.18` ✓ (claim verified); `chromatic.yml` non-blocking (`continue-on-error: true` on build + upload) ✓ (claim verified); path-scoped to `packages/ui/**`.
- What it does: Component documentation + optional visual regression.
- How it appears to work: `pnpm storybook`, `pnpm storybook:build` → `docs/storybook-static` (gitignored).
- Dependencies: 8.6.18 aligned.
- Current controls: Version alignment, staticDirs, a11y addon.
- Missing controls: 0 web-app stories; Chromatic never exercises web components.
- Risks: Visual regressions undetected (see UX-P2-005 in the companion UI/UX report).
- Recommended improvement: Add web stories; widen Chromatic paths.
- Suggested tests: `pnpm storybook:build` in CI (already in chromatic.yml).
- Suggested docs: `docs/storybook.md`.

### Item: Troubleshooting doc

- Evidence: `docs/TROUBLESHOOTING.md` — 53 lines, sections for API (2), Web (2), Worker (2), Deploy (1+), last updated 2026-08-01. Content is accurate and actionable (env failures, CSP, NEXT_PUBLIC_API_URL build-time inlining, Redis, SSH deploy timeout).
- What it does: First-stop ops reference.
- How it appears to work: Static markdown.
- Dependencies: none.
- Current controls: Exists and is correct.
- Missing controls: Only ~10 entries for a 4-service stack with 100+ migrations, queues, SSE, storage buckets, and Terraform; no database-reset, migration-failure, rate-limit, or webhook-delivery troubleshooting entries.
- Risks: Ops staff spend time rediscovering failure modes documented elsewhere (or not at all).
- Recommended improvement: Expand to ~25 entries; add DB/migrations, webhooks/queue, SSE/notifications, storage, rate limits.
- Suggested tests: N/A.
- Suggested docs: Expand `docs/TROUBLESHOOTING.md`.

### Item: Scripts documentation

- Evidence: `scripts/README.md` (47 lines) tables match 25 of 27 files in `scripts/`; missing `apply-content-map.js` and `generate-details.js` (both referenced by catalog tooling); `fix-apostrophe.js` (5 lines), `fix-cat.js` (17), `fix-everything-dupes.js` (22) are documented as one-off utilities ✓.
- What it does: Maps the 27 automation scripts.
- How it appears to work: Static README.
- Dependencies: none.
- Current controls: Good coverage.
- Missing controls: 2 unindexed scripts; `generate-details.js` (245-product content generator, per its header comment) should be documented since it regenerates catalog content.
- Risks: Low.
- Recommended improvement: Add the 2 entries; mark one-off scripts as deletable.
- Suggested tests: N/A.
- Suggested docs: `scripts/README.md` rows.

### Item: Worktree cleanliness

- Evidence: `git status --short` → 34 modified files, all under `prompts/hardening_prompt_pack/engine/deep_audit/*.json` (audit engine outputs). No app-source modifications pending.
- What it does: Pending changes at audit time.
- How it appears to work: Files were modified by a previous audit-engine run and never committed.
- Dependencies: none.
- Current controls: none.
- Missing controls: Audit-run artifacts being committed/cleaned by process.
- Risks: Confuses future diffs; pollutes PR history if committed with app changes.
- Recommended improvement: Either commit the audit outputs as a run artifact or restore them; add `prompts/*/engine/deep_audit/*.json` to `.gitignore` if they are regenerable.
- Suggested tests: N/A.
- Suggested docs: Prompt-pack README note.

### Item: TODO/FIXME/dead code

- Evidence: grep for `TODO|FIXME|HACK|XXX` across `apps/web/**`, `apps/api/src/**`, `apps/worker/src/**`, `packages/sdk/src/**` → 0 real matches (single match is `XXXX` inside a Slack URL string in `ssrf-guard.test.ts`).
- What it does: Marker-code hygiene.
- How it appears to work: Clean source tree.
- Dependencies: none.
- Current controls: Lint + review.
- Missing controls: none.
- Risks: none.
- Recommended improvement: Keep as is; consider a CI grep to prevent drift.
- Suggested tests: CI step `grep -rn "TODO\|FIXME" apps packages --include="*.ts" --include="*.tsx"` returning 0.
- Suggested docs: AGENTS.md hygiene note.

### Item: New-developer journey

- Evidence: `README.dev.md` (setup), `scripts/dev-setup.sh`, `scripts/start-local-stack.*`, `scripts/local_dev_reset_and_verify.automated.v2.*`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, TROUBLESHOOTING.md, `README.md` root.
- What it does: Guides a developer from clone → running stack → tests.
- How it appears to work: Multi-path (PowerShell + bash); env sync via `pnpm supabase:env:sync`.
- Dependencies: Docker/Supabase CLI/pnpm.
- Current controls: Detailed docs + scripts.
- Missing controls: A single "5-minute quickstart" block at the top of README.dev.md; CI-in-a-box script.
- Risks: Low.
- Recommended improvement: Add TL;DR quickstart; link test-accounts page for instant demo logins.
- Suggested tests: Fresh-machine walkthrough.
- Suggested docs: `README.dev.md` quickstart section.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| DOC-001 | README | `AGENTS.md` + root READMEs | Comprehensive | Stale counts (E2E 90/338 vs 60/253; totals 2,485 vs 2,417) | P2 | Refresh counts |
| DOC-002 | Local setup | `README.dev.md` + 27 scripts | Strong | 2 scripts unindexed | P3 | Add rows |
| DOC-003 | Env docs | 3 `.env.example` + ENVIRONMENT_VARIABLES.md | Worker 27/27, Web 7/7 | API example missing 4 keys | P2 | Add keys |
| DOC-004 | Architecture/API docs | MODULE_AUDIT, openapi.yaml, spec.ts | Strong | "396 paths" = 280 paths/396 ops | P3 | Fix terminology; add sync CI |
| DOC-005 | DB/migration docs | naming-guide, migrations | Strong | — | — | — |
| DOC-006 | Testing docs | AGENTS patterns, jest configs | Strong | Count drift; no auto-generated counts | P2 | Refresh; add count script |
| DOC-007 | Deploy/rollback docs | ROLLBACK_PROCEDURES | Strong | — | — | — |
| DOC-008 | Incident/security docs | MONITORING, SECRETS_ROTATION, JWT_ROTATION | Strong | — | — | — |
| DOC-009 | Contribution/coding standards | AGENTS.md, lint-staged | Good | No CONTRIBUTING.md; SDK no lint | P3 | Add; fix SDK lint |
| DOC-010 | PR/release process | workflow docs in AGENTS.md | Good | No standalone release doc | P3 | Optional RELEASING.md |
| DOC-011 | Operator manuals | 60 runbooks/60 features/75 modules | Strong | — | — | — |
| DOC-012 | Troubleshooting | `docs/TROUBLESHOOTING.md` | Functional | 53 lines; ~10 entries | P2 | Expand |

## Findings

### Finding ID: DOC-P1-001 - AGENTS.md E2E inventory understated ~50%: 90 spec files / 338 tests vs documented "60 spec files / 252-253 tests"

- Severity: P1
- Confidence: High
- Area: Documentation accuracy / testing docs
- Evidence:
  - `apps/web/e2e/` — 90 `.spec.ts` files (26 admin, 59 portal, 2 root, 2 marketing, 1 auth); 338 `test(` declarations; 0 `test.skip`/`test.only`
  - `AGENTS.md` lines 5, 11, 23, 35 ("252 E2E tests", "E2E 253/253", "60 spec files")
- What is happening: The canonical knowledge base documents an E2E suite ~50% smaller than what actually exists. The "Test Status & Patterns" table (line 100) still reads "252 tests / 60 spec files" while 90 spec files / 338 tests exist at HEAD.
- Why it matters: Operators, engineers, and AI agents planning E2E runtime, coverage, or CI capacity will under-plan by ~34%.
- User / business impact: Misjudged CI cost and coverage confidence; stale "green" ceilings.
- Security / privacy / reliability impact: None directly, but stale docs erode trust in the knowledge base that agents rely on.
- Recommended fix: Update AGENTS.md E2E rows to "90 spec files / 338 tests (0 skipped)"; add `npx playwright test --list` output as a CI artifact so counts are always derived.
- Suggested validation: Run `npx playwright test --list` and compare counts with the doc.
- Owner suggestion: CI engineer.
- Effort estimate: 1 hour.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P2-001 - AGENTS.md test-status table stale: "2,417 (API 701, SDK 251, Worker 31, Web 1434)" vs latest session "2,485 (API 731, SDK 264, Web 1450, Worker 40)"

- Severity: P2
- Confidence: High
- Area: Documentation accuracy
- Evidence:
  - `AGENTS.md:100` — "**2,417 tests, all passing (2026-08-02 verified):** API 701, SDK 251, Worker 31, Web 1434"
  - `AGENTS.md:39` — "Final: API 731, SDK 264, Web 1450, Worker 40"
  - Static declaration counts at HEAD: API 665 (`test`/`it` + 3 `it.each` blocks that expand further), SDK 264 ✓, Worker 40 ✓, Web 1450 ✓
- What is happening: The summary table was last touched 2026-08-02; four later sessions added tests without updating it, so the document contradicts itself (2,417 vs 2,485).
- Why it matters: Agents trust the table for CI gating and coverage decisions; the API static count (665 declarations) also does not obviously reconcile to 731 — 731 is plausible only when `.each` expansions are counted (e.g., `ssrf-guard.test.ts` has 3 `it.each` blocks expanding to ~40 cases), so the number should be verified by an actual run, not a hand count.
- User / business impact: Low; correctness of documentation claims.
- Security / privacy / reliability impact: None.
- Recommended fix: Refresh the table to the latest verified totals; state the source (CI `pnpm test` output) and date; add a note on how counts are produced.
- Suggested validation: `pnpm test` full run; update table from `Test Suites: N passed` summary.
- Owner suggestion: Any maintainer.
- Effort estimate: 30 minutes.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P2-002 - API `.env.example` missing 4 of 32 schema keys (REDIS_URL, TASK_QUEUE_ENABLED, REDIS_PASSWORD, M365_CLIENT_STATE)

- Severity: P2
- Confidence: High
- Area: Env docs / local setup
- Evidence:
  - `apps/api/src/config/env.ts` — 32-key Zod schema (includes REDIS_URL:28, TASK_QUEUE_ENABLED:29, REDIS_PASSWORD:30, M365_CLIENT_STATE:34)
  - `apps/api/.env.example` — 28 keys; none of the 4 above
  - `apps/worker/.env.example` — 27/27 keys covered (claim verified)
- What is happening: A developer copying the API example gets a stack where queue-producing features (task producer, webhook idempotency via Redis, response cache) silently degrade — all 4 missing keys are optional in the schema, so nothing crashes to reveal them.
- Why it matters: Local/CI parity for queue-backed features requires Redis wiring the example doesn't advertise.
- User / business impact: Hidden feature degradation in local dev.
- Security / privacy / reliability impact: None; but M365_CLIENT_STATE is a webhook-auth secret that new devs won't know to set.
- Recommended fix: Add the 4 keys (empty values + comments) to `apps/api/.env.example`; add a `scripts/check-env-example.ts` that diffs example keys vs schema keys.
- Suggested validation: The check script passes for all 3 apps.
- Owner suggestion: Backend engineer.
- Effort estimate: 1 hour.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P2-003 - TROUBLESHOOTING.md is thin (53 lines, ~10 entries) relative to platform scale

- Severity: P2
- Confidence: High
- Area: Troubleshooting / operator readiness
- Evidence:
  - `docs/TROUBLESHOOTING.md` — 53 lines; sections: API (2), Web (2), Worker (2), Deploy (1); last updated 2026-08-01
- What is happening: The doc exists and its entries are accurate, but covers only a handful of the failure modes an operator of a 4-service stack (Next.js + Express + BullMQ + Redis + hosted Supabase + Caddy + Terraform) will hit.
- Why it matters: Ops staff and agents lose time reconstructing fixes that are scattered across runbooks.
- User / business impact: Longer MTTR.
- Security / privacy / reliability impact: Low.
- Recommended fix: Expand to ~25 entries: Supabase migration apply failures (`supabase db push` conflicts), `db reset` vs migration-only DBs, queue backlog/delayed jobs, SSE `notifications/stream` console noise, rate-limit 429s, webhook delivery failures, storage bucket permission errors, Terraform `prevent_destroy` surprises, image-tag drift.
- Suggested validation: Walkthrough by a new operator; all listed entries map to real error text.
- Owner suggestion: DevOps engineer.
- Effort estimate: 3-4 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P2-004 - OpenAPI claim "396 paths" is 396 operations over 280 unique paths; no CI sync check

- Severity: P2
- Confidence: High
- Area: Architecture/API docs
- Evidence:
  - `apps/api/src/openapi/spec.ts` — 396 `RouteDef` entries, 280 unique `path` values, 48 tags
  - `docs/openapi.yaml` — 280 path items, 396 operation objects (`get/post/put/patch/delete` lines)
  - `AGENTS.md:5` — "OpenAPI 396 paths"
- What is happening: The claim conflates operations with paths; more importantly there is no CI gate proving `docs/openapi.yaml` matches `spec.ts` at HEAD (regeneration is manual via `scripts/gen-openapi.mjs`).
- Why it matters: A desynced contract would mislead SDK/API consumers and Swagger UI users.
- User / business impact: Low; terminology/accuracy.
- Security / privacy / reliability impact: None.
- Recommended fix: Correct terminology in AGENTS.md; add a CI step: regenerate YAML and `git diff --exit-code` to fail on drift.
- Suggested validation: CI job turns red when `spec.ts` changes without regenerating YAML.
- Owner suggestion: Backend engineer.
- Effort estimate: 1-2 hours.
- Dependencies: `scripts/gen-openapi.mjs`.
- Status: Open.

### Finding ID: DOC-P3-001 - SDK package has no lint script; "lint 0 errors" claim excludes SDK

- Severity: P3
- Confidence: High
- Area: Contribution/coding standards
- Evidence:
  - `packages/sdk/package.json` scripts — `typecheck`, `test`, `test:coverage` only
  - `pnpm --filter=sdk lint` → `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`
  - `pnpm lint` (turbo) — 3/3 tasks (api, web, worker); SDK silently absent
- What is happening: The SDK ships type-checked and tested but never ESLinted, so the "ESLint clean (0 errors)" claim is narrower than it reads.
- Why it matters: Dead imports/unused vars in the SDK would go undetected by the advertised lint gate.
- User / business impact: None today (SDK small, typechecked).
- Security / privacy / reliability impact: None.
- Recommended fix: Add `"lint": "eslint src/"` to `packages/sdk/package.json` (reuse `packages/config` ESLint config).
- Suggested validation: `pnpm lint` reports 4 tasks; SDK lint passes.
- Owner suggestion: Backend engineer.
- Effort estimate: 30 minutes.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P3-002 - scripts/README.md misses 2 scripts (apply-content-map.js, generate-details.js)

- Severity: P3
- Confidence: High
- Area: Script docs
- Evidence:
  - `scripts/` has 27 files; `scripts/README.md` indexes 25
  - Missing: `apply-content-map.js`, `generate-details.js` (the latter is the 245-product content generator referenced in its header comment)
- What is happening: Two scripts, including the catalog content generator, are undocumented in the index.
- Why it matters: Agents/engineers regenerating store content may not discover `generate-details.js`.
- User / business impact: Low.
- Security / privacy / reliability impact: None.
- Recommended fix: Add both rows; mark `fix-*.js` one-offs as candidates for deletion.
- Suggested validation: README table count == directory count.
- Owner suggestion: Any maintainer.
- Effort estimate: 15 minutes.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P3-003 - 34 uncommitted modified files (audit-engine JSON artifacts) in worktree

- Severity: P3
- Confidence: High
- Area: Repo hygiene
- Evidence:
  - `git status --short` — 34 modified files, all `prompts/hardening_prompt_pack/engine/deep_audit/*.json`
- What is happening: Prior audit-engine runs modified JSON outputs that were never committed or reverted.
- Why it matters: Pollutes future diffs/PRs if swept in with unrelated changes.
- User / business impact: Low.
- Security / privacy / reliability impact: None (outputs may contain finding text only — do not commit if they contain secrets; the deep_audit JSONs are finding reports).
- Recommended fix: Commit as a run artifact (if desired) or `git checkout -- prompts/hardening_prompt_pack/engine/deep_audit/`; consider `.gitignore` for regenerable outputs.
- Suggested validation: `git status` clean after decision.
- Owner suggestion: Any maintainer.
- Effort estimate: 15 minutes.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P3-004 - No CONTRIBUTING.md / RELEASING.md; coding standards live only in AGENTS.md

- Severity: P3
- Confidence: Medium
- Area: Contribution/coding standards
- Evidence: No `CONTRIBUTING.md` or `RELEASING.md` at repo root (glob); conventions documented only in `AGENTS.md` (commit style, pnpm setup, test patterns)
- What is happening: External contributors and some tooling expect CONTRIBUTING.md; release process is implicit in workflow descriptions.
- Why it matters: Minor friction for contributors; processes rely on tribal knowledge.
- User / business impact: Low.
- Security / privacy / reliability impact: None.
- Recommended fix: Add a compact CONTRIBUTING.md (link AGENTS.md + lint-staged + test commands); optional RELEASING.md summarizing the deploy gates (validate → migrations → prod-approval).
- Suggested validation: N/A.
- Owner suggestion: Any maintainer.
- Effort estimate: 2 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: DOC-P3-005 - Storybook builds into docs/storybook-static (gitignored) with zero web-app stories

- Severity: P3
- Confidence: High
- Area: Docs tooling
- Evidence:
  - `.storybook/main.ts` stories globs; 7 stories all in `packages/ui`; 0 in `apps/web/components`
  - `package.json` — `storybook:build: storybook build -o docs/storybook-static` (dir gitignored)
- What is happening: Storybook tooling is correctly configured (deps 8.6.18, staticDirs, a11y addon, non-blocking Chromatic) but documents only the UI package.
- Why it matters: Cross-referenced with the UI/UX report (UX-P2-005); for docs purposes the claim "storybook deps aligned" is true but coverage is minimal.
- User / business impact: Low.
- Security / privacy / reliability impact: None.
- Recommended fix: Add web stories; optionally move output dir to `node_modules/.cache/storybook-static`.
- Suggested validation: `pnpm storybook:build` green.
- Owner suggestion: Frontend engineer.
- Effort estimate: 1-2 days (stories).
- Dependencies: None.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Agents inherit stale counts (E2E 60/253 vs 90/338; totals 2,417 vs 2,485) | P2 | Certain (doc is stale now) | Medium | AGENTS.md:5,23,35,100 vs e2e dir + jest configs | Refresh table; derive counts in CI |
| OpenAPI YAML drifts from spec.ts silently | P2 | Low | Medium | Manual regeneration only | CI diff check |
| Local stack silently degraded (no Redis keys in API example) | P2 | Medium | Medium | env.ts:28-34 vs .env.example | Add 4 keys + check script |
| SDK lint gap grows unnoticed | P3 | Low | Low | sdk/package.json | Add lint script |
| Worktree audit artifacts contaminate a future PR | P3 | Medium | Low | git status 34 files | Commit or clean + gitignore |
| TROUBLESHOOTING too thin for MTTR targets | P2 | Medium | Medium | 53-line doc | Expand |

## Recommendations

### Immediate / Release Blocking

None — no P0 findings in this domain.

### This Week

1. Refresh AGENTS.md test-status table (DOC-P2-001) + E2E rows to 90 spec files / 338 tests (DOC-P1-001).
2. Add the 4 missing keys to `apps/api/.env.example` (DOC-P2-002).
3. Fix the "396 paths" claim to "396 operations / 280 paths" (DOC-P2-004).

### This Month

4. Expand TROUBLESHOOTING.md to ~25 entries (DOC-P2-003).
5. Add OpenAPI sync CI gate (DOC-P2-004).
6. Add `lint` script to SDK (DOC-P3-001).

### Later / Platform Evolution

7. CONTRIBUTING.md / RELEASING.md (DOC-P3-004).
8. Clean/ignore audit-engine JSON artifacts (DOC-P3-003).
9. Web-app Storybook stories (DOC-P3-005).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Update AGENTS.md counts (E2E 90/338; totals 2,485) | Stops agents planning on stale numbers | `AGENTS.md` | grep check |
| Add 4 env keys to API example | Unblocks Redis-backed local features | `apps/api/.env.example` | schema-vs-example diff |
| Fix OpenAPI terminology | Accurate contract claims | `AGENTS.md` | count check |
| Add SDK lint script | Closes lint-coverage gap | `packages/sdk/package.json` | `pnpm lint` 4 tasks |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| AGENTS.md count refresh | P1 | Any maintainer | 30m | CI test output |
| API .env.example keys + check script | P2 | Backend | 1h | None |
| TROUBLESHOOTING expansion | P2 | DevOps | 3-4h | None |
| OpenAPI sync CI gate | P2 | Backend | 1-2h | gen-openapi script |
| SDK lint script | P3 | Backend | 30m | None |
| CONTRIBUTING.md/RELEASING.md | P3 | Any maintainer | 2h | None |
| Audit-artifact cleanup | P3 | Any maintainer | 15m | None |
| Web stories | P3 | Frontend | 1-2d | None |

## Suggested Tests

- CI: `npx playwright test --list` artifact so E2E counts are machine-derived (DOC-P1-001).
- CI: OpenAPI regeneration + `git diff --exit-code docs/openapi.yaml` (DOC-P2-004).
- CI: `grep -rn "TODO\|FIXME" apps packages --include="*.ts" --include="*.tsx"` returning 0 (keeps marker-code hygiene).
- Script: `scripts/check-env-example.ts` diffs `.env.example` keys vs Zod schema keys for all 3 apps.
- Doc freshness: quarterly audit that AGENTS.md counts match `pnpm test` output and `playwright --list`.

## Suggested Documentation Updates

- `AGENTS.md` — refresh Test Status table + E2E counts; correct OpenAPI claim; correct "all 242 pages titled" (301 pages now).
- `apps/api/.env.example` — add REDIS_URL, TASK_QUEUE_ENABLED, REDIS_PASSWORD, M365_CLIENT_STATE.
- `scripts/README.md` — add `apply-content-map.js` and `generate-details.js` rows.
- `docs/TROUBLESHOOTING.md` — expand (migrations, queue, SSE, rate limits, webhooks, storage).
- `docs/INDEX.md` — already lists openapi.yaml generation command; add storybook.md reference when written.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Was the 731 API count ever produced by a real jest run? | Static count shows 665 declarations (+3 `.each` expansions); the claim needs a run to verify | CI `pnpm test` output |
| Are the 34 modified audit JSONs intentionally committed later? | Determines cleanup vs commit | Owner intent |
| Does CI store E2E/unit counts anywhere for doc regeneration? | Would end manual count drift | Workflow logs |
| Is `docs/storybook-static` needed in the docs dir at all? | It is gitignored; only the Chromatic upload consumes it | CI config |

## Appendix

### Test count reconciliation (static, HEAD 75d3926)

| Package | Documented (AGENTS.md:39) | Static declarations | Notes |
| ------- | ------------------------ | ------------------- | ----- |
| API | 731 | 665 `test`/`it` + 3 `it.each` blocks | `.each` expands (e.g., ssrf-guard.test.ts 23+6+4 cases); run-based verify needed |
| SDK | 264 | 264 | ✓ match |
| Worker | 40 | 40 | ✓ match |
| Web | 1450 | 1450 | ✓ match |
| E2E | 252-253 | 338 `test()` in 90 spec files | ✗ understated ~34% |

### E2E suite composition (apps/web/e2e)

| Directory | Spec files |
| --------- | ---------- |
| admin | 26 |
| portal | 59 |
| (root) | 2 |
| marketing | 2 |
| auth | 1 |
| **Total** | **90** |

Skipped tests: 0. `test.only`: 0.

### Env key parity

| App | Schema keys | .env.example keys | Missing |
| --- | ----------- | ----------------- | ------- |
| API (`apps/api/src/config/env.ts`) | 32 | 28 | REDIS_URL, TASK_QUEUE_ENABLED, REDIS_PASSWORD, M365_CLIENT_STATE |
| Worker (`apps/worker/src/env.ts`) | 27 | 27 | none |
| Web | n/a (Next build args) | 7 | NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED (CI-only, by design) |

### Docs inventory (docs/)

| Location | Count |
| -------- | ----- |
| docs/*.md (root) | 43 |
| docs/modules/ | 75 |
| docs/features/ | 60 |
| docs/runbooks/ | 60 |
| docs/seo/ | 10 |
| docs/adr/ | 1 |
| docs/technical-writing/ | 1 |
| docs/migrations/ | 1 |
| docs/openapi.yaml | 1 |

### Lint verification (executed)

`pnpm lint` → turbo: 3 successful, 3 total (api, web, worker), 0 cached. Per-package exit codes: api 0, web 0, worker 0. SDK: no lint script (`ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`).
