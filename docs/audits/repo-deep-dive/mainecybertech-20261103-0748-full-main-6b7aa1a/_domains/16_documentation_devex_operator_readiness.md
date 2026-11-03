# Documentation, Developer Experience, and Operator Readiness Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:29:24Z
- Auditor: subagent (independent re-audit; read-only)
- Area code: DOC
- Output path: `docs/audits/mainecybertech/mainecybertech-20261103-0748-full-main-6b7aa1a/16_documentation_devex_operator_readiness.md`
- Scope limitations: repository-only; the dependency-free guards were executed locally (`check-docs-links`, `check-docs-counts`, `check-required-checks`, `check-env-parity`, `openapi-audit`), but CI itself was not re-run. GitHub environment settings and live backup/deploy state are not verifiable from the repo.

## Scope

Re-verification of the 19 `DOC` findings from `mainecybertech-20261014-0033-full-main-7dd0402` against `origin/main` @ `6b7aa1a`, plus a fresh pass over README, local setup, env docs, architecture/API docs, DB/migration docs, testing, deploy/rollback, incident/security, contribution, PR/release, operator manuals, troubleshooting, ADRs/diagrams, script docs, known limitations and AI-agent instructions. The #293 Known Debt refresh, the PSF-2.0 license change, the ubuntu-24.04 pin and the rate-limit JSON change were checked for documentation drift.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `AGENTS.md` | Agent/operator map | Known Debt, counts, worker, compose | Line-by-line |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`, `docs/ROLLBACK_PROCEDURES.md`, `docs/RELEASING.md` | Ops/release | Approval gate, branch state | Contradiction found |
| `docs/CI.md`, `.github/workflows/*.yml` | CI/CD | Required checks, a11y, Chromatic, SBOM | Re-read |
| `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/SECRETS_ROTATION.md` | Secrets | Alert delivery | Re-read |
| `docs/MONITORING_AND_ALERTING.md`, `infra/digitalocean/docker-compose.yml` | Observability | Metrics gate, images, memory | Version drift |
| `docs/LICENSE_POLICY.md`, `security/license-policy.json` | Supply chain | PSF-2.0 | Drift |
| `docs/API_ERROR_HANDLING.md`, `docs/API_RATE_LIMITING.md` | API contract | 429 code | Drift |
| `docs/modules/*` | Feature docs | Endpoint paths | One wrong base path |
| `docs/audits/README.md`, run `HISTORICAL.md` files | Audit corpus | Index/markers | Guards pass |
| `scripts/README.md`, `scripts/` | Script docs | Coverage | 5 missing |

## Verification Performed

| Check | Command / method | Result |
|---|---|---|
| Docs links + audit index + workflow inventory | `node scripts/check-docs-links.mjs` | `docs links OK` (exit 0) |
| Counts | `node scripts/check-docs-counts.mjs` | `docs counts OK` (exit 0) |
| Required checks | `node scripts/check-required-checks.mjs` | PASS: all 8 contexts match a workflow job |
| Env parity | `node scripts/check-env-parity.mjs` | `environment parity OK` |
| OpenAPI coverage | `node scripts/openapi-audit.js` | 455 live routes, 0 missing, exit 0 |
| Migration naming | `ls | cut | uniq -d` | **duplicate 5302463** |
| Script index | Python compare `scripts/` vs README | 5 missing |
| Version pins | grep docs vs compose | prometheus/alertmanager stale |

## Executive Summary

The previous documentation remediation is largely intact: 15 of 19 findings are **verified-fixed**, including the two open ones (`DOC-P2-009` audit index and `DOC-P3-010` Storybook pin). The deployment handbook, rollback flow, SBOM row, secret matrix, historical banners, migration guide, monitoring gate, troubleshooting names, audit index, migration naming docs (as documents) and compose table all still match the tree. The guards that matter are green: `check-docs-links` (which also enforces the audit index, `HISTORICAL.md` markers and the CI workflow inventory), `check-docs-counts`, `check-required-checks` and `check-env-parity`.

Four findings remain partial/regressed and six new drifts were found:

- **DOC-P3-009 regressed**: two migrations now share prefix `5302463`, one with a wrong header (`5302437`), despite the naming guide forbidding duplicates.
- **DOC-P2-010 (new, P2)**: `AGENTS.md` says the prod-approval reviewer gate is in force (verified 2026-10-15), while the handbook, rollback doc and `RELEASING.md` say reviewers are still not configured. The same AGENTS bullet claims `main` carries 26 commits `develop` does not; the tree shows 1/0.
- **DOC-P3-011**: `RELEASING.md` still names PR #281 @ 7dd04023 as the last promotion; `main` is 6b7aa1a (2026-11-03).
- **DOC-P3-012**: `docs/modules/change-requests.md` documents `/api/v1/change-requests`; the router lives at `/api/v1/governance/change-requests`.
- **DOC-P3-013**: docs/AGENTS still pin prometheus v3.5.1 / alertmanager v0.28.1 after compose moved to v3.15.1 / v0.29.0.
- **DOC-P3-014**: `docs/LICENSE_POLICY.md` omits PSF-2.0 although the JSON policy allows it.
- **DOC-P3-015**: `docs/API_ERROR_HANDLING.md` says 429 is `FULL`; the middleware and `docs/API_RATE_LIMITING.md` say `RATE_LIMITED`.

| Status | Count |
|---|---:|
| verified-fixed | 15 |
| partially-fixed | 3 (`DOC-P2-004`, `DOC-P2-005`, `DOC-P3-007`) |
| regressed | 1 (`DOC-P3-009`) |
| open (previous) | 0 |
| new | 6 (`DOC-P2-010`, `DOC-P3-011`–`015`) |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Agent map | `AGENTS.md` | Current-state source | Contradicts ops docs | High | DOC-P2-010 |
| Release gate | `docs/RELEASE_GATE.md` | Gate | Bound to 2026-10-11 | Medium | DOC-P2-005 |
| Ops handbook | `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Deploy/rollback | Reviewer caveat | Medium | DOC-P2-010 |
| Rollback | `docs/ROLLBACK_PROCEDURES.md` | Recovery | Honest caveat | — | Keep |
| Revision state | `docs/RELEASING.md` | Promotion | Stale PR #281 | Low | DOC-P3-011 |
| Migration naming | `docs/migrations/naming-guide.md` | DB convention | Duplicate exists | Medium | DOC-P3-009 |
| License | `docs/LICENSE_POLICY.md` | Supply chain | Missing PSF-2.0 | Low | DOC-P3-014 |
| Error codes | `docs/API_ERROR_HANDLING.md` | API contract | 429 code drift | Low | DOC-P3-015 |
| Module docs | `docs/modules/change-requests.md` | Feature doc | Wrong base path | Low | DOC-P3-012 |
| Run corpus | `docs/audits/**` | Historical data | Guarded | — | Keep |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| README | 4 | counts correct | — | Keep |
| Local setup | 4 | dev-setup fixed | — | Keep |
| Env docs | 4 | parity guard passes | — | Keep |
| Architecture/API docs | 4 | OpenAPI 0 missing | Change-request path | DOC-P3-012 |
| DB/migration docs | 3 | 162 migrations, naming guide | Duplicate prefix | DOC-P3-009 |
| Testing docs | 4 | guards/counts | — | Keep |
| Deploy/rollback docs | 3 | handbook/rollback current | Reviewer contradiction | DOC-P2-010 |
| Incident/security docs | 3 | alerting wording fixed | Breach gap list | DOC-P2-004 |
| Contribution/coding standards | 4 | CONTRIBUTING present | — | Keep |
| PR/release process | 3 | RELEASING stale | #281 pointer | DOC-P3-011 |
| Operator manuals | 3 | Known Debt stale | Branch/reviewer | DOC-P2-010 |
| Troubleshooting | 4 | container names/memory | — | Keep |

## Detailed Review

### Item: Single source of truth for prod state

- Evidence: `AGENTS.md:124`, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md:108`, `docs/ROLLBACK_PROCEDURES.md:350-353`, `docs/RELEASING.md:190-205`.
- What it does: all four claim to describe the current environment; they disagree on whether `prod-approval` has a required reviewer and on how far `main` is ahead of `develop`.
- Missing controls: no generated status artifact; each doc is hand-maintained.
- Risk: an operator may deploy believing the manual gate is on (or off) when the opposite is true.

### Item: Migration sequence

- Evidence: `docs/migrations/naming-guide.md:5-40`; `supabase/migrations/5302463_*` (two files); `5302463_client_portal_ai_and_visibility.sql:2` says 5302437.
- What it does: Supabase applies migrations in filename order; a duplicate prefix is not fatal on a fresh reset (lexicographic `client...` before `fix...`) but breaks the documented uniqueness and makes ordering depend on the description text.
- Missing controls: no CI check for duplicate prefixes (the naming guide says "verify no duplicate prefixes" but nothing automates it).

### Item: Rate-limit/API contract docs

- Evidence: `apps/api/src/middleware/rate-limit.ts:13-16`; `docs/API_RATE_LIMITING.md:60-67`; `docs/API_ERROR_HANDLING.md:81`.
- Risk: clients branching on `error.code === "FULL"` miss `RATE_LIMITED`.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| DOC-001 | README | `README.md:45` | Counts match | — | — | Keep |
| DOC-002 | Local setup | `migration-guide.md` | Reconciled | — | — | Keep |
| DOC-003 | Env docs | `ENVIRONMENT_VARIABLES.md` | Parity guard | — | — | Keep |
| DOC-004 | Architecture/API | `openapi.yaml` | 455 routes, 0 missing | Module doc path | P3 | DOC-P3-012 |
| DOC-005 | DB/migration | naming guide | Sequential rule | Duplicate | P3 | DOC-P3-009 |
| DOC-006 | Testing | CI.md/testing.md | Guarded counts | — | — | Keep |
| DOC-007 | Deploy/rollback | handbook | Current pipeline | Reviewer contradiction | P2 | DOC-P2-010 |
| DOC-008 | Incident/security | IR/breach docs | Alerting fixed | Breach list | P2 | DOC-P2-004 |
| DOC-009 | Contribution | CONTRIBUTING | Present | — | — | Keep |
| DOC-010 | PR/release | RELEASING.md | Checklist | Stale #281 | P3 | DOC-P3-011 |
| DOC-011 | Operator manuals | AGENTS.md | Known Debt | Stale facts | P2 | DOC-P2-010 |
| DOC-012 | Troubleshooting | TROUBLESHOOTING.md | Correct names | — | — | Keep |

## Findings

### Re-verification of previous findings

| ID | Sev | Previous status | Re-verified status | Evidence at 6b7aa1a |
|---|---|---|---|---|
| DOC-P2-001 | P2 | verified-fixed | verified-fixed | handbook `:54,112,144,146` vs deploy-do/terraform/firewall |
| DOC-P2-002 | P2 | verified-fixed | verified-fixed | `ROLLBACK_PROCEDURES.md:238-251,350-353` |
| DOC-P2-003 | P2 | verified-fixed | verified-fixed | `CI.md:31` Artifact-only; required-checks guard passes |
| DOC-P2-004 | P2 | partially-fixed | partially-fixed | `INCIDENT_RESPONSE.md:148-165` fixed; `DATA_BREACH_RESPONSE.md:473` still lists closed IDs |
| DOC-P2-005 | P2 | verified-fixed | partially-fixed | bound to 8d299b8 (`RELEASE_GATE.md:4-16,37-41`); not rebound after 7dd0402/2026-10-21 |
| DOC-P2-006 | P2 | verified-fixed | verified-fixed | matrix `:84-89,118-120`; rotation `:101-109` |
| DOC-P2-007 | P2 | verified-fixed | verified-fixed | `GAP_ANALYSIS.md:3-9` |
| DOC-P2-008 | P2 | verified-fixed | verified-fixed | `migration-guide.md:1-35` |
| DOC-P3-001 | P3 | verified-fixed | verified-fixed | all runs have `HISTORICAL.md`; docs-links passes |
| DOC-P3-002 | P3 | partially-fixed | verified-fixed | `AGENTS.md:361-364` 161 lines + BullMQ |
| DOC-P3-003 | P3 | verified-fixed | verified-fixed | 162 migrations / 30 workflows; counts guard OK |
| DOC-P3-004 | P3 | verified-fixed | verified-fixed | `MONITORING_AND_ALERTING.md:238` gate + memory table |
| DOC-P3-005 | P3 | verified-fixed | verified-fixed | `TROUBLESHOOTING.md:59,70-76`; `ONBOARDING.md:286` |
| DOC-P3-006 | P3 | verified-fixed | verified-fixed | `docs/audits/README.md:93-115`; docs-links passes |
| DOC-P3-007 | P3 | partially-fixed | partially-fixed | 53/58 indexed; 5 missing |
| DOC-P3-008 | P3 | verified-fixed | verified-fixed | `AGENTS.md:222` alertmanager row |
| DOC-P3-009 | P3 | verified-fixed | **regressed** | duplicate `5302463`; header says 5302437 |
| DOC-P2-009 | P2 | open | verified-fixed | `docs/audits/README.md:113`; HISTORICAL; docs-links OK |
| DOC-P3-010 | P3 | open | verified-fixed | `CI.md:148-155`; `chromatic.yml:30-43`; pin applied |

### Finding ID: DOC-P2-004 — Breach-response gap list still mixes closed register IDs with the live residual (partial)

- Severity: P2
- Confidence: High
- Area: DOC
- Evidence:
  - `docs/DATA_BREACH_RESPONSE.md:473` lists `DR-P0-001`, `DR-P0-002`, `IR-P1-004`, `IR-P1-005` as known gaps.
  - The 7dd0402 register (`runs/mainecybertech-20261014-0033-full-main-7dd0402/findings.json`) marks `DR-P0-002`, `IR-P1-004`, `IR-P1-005` **verified-fixed**; only `DR-P0-001` is `partially-fixed`.
  - `docs/INCIDENT_RESPONSE.md:148-165` already states the corrected alerting position.
- What is happening: the breach plan's "known gaps" list was not reconciled with the current register.
- Why it matters: responders may chase already-closed backup items or miss that only the off-box heartbeat/backup-run is left.
- Recommended fix: replace the four IDs with the current `DR-P0-001` residual and add a link to the live register; add a check that docs do not cite IDs whose status is verified-fixed.
- Owner suggestion: security lead + audit owner
- Effort estimate: S
- Status: partially-fixed
- Dependencies: current register

### Finding ID: DOC-P2-005 — RELEASE_GATE.md still binds to the 2026-10-11 run after two later audits (partial)

- Severity: P2
- Confidence: High
- Area: DOC
- Evidence:
  - `docs/RELEASE_GATE.md:4-6` binds to `mainecybertech-20261011-0426-full-main-8d299b8`.
  - `:37-41` reports that run's P0 ×8 / P1 ×89 and "18 of the P0/P1 rows remain unresolved".
  - `:24-26` says "Review by ... after every audit re-run"; `docs/audits/repo-deep-dive/mainecybertech-20261014-0033-full-main-7dd0402` and `docs/audits/portal-modules/2026-10-21` are both published and indexed.
- What is happening: the gate is internally consistent with the 2026-10-11 register but no longer the newest status artifact.
- Why it matters: release decisions read a three-week-old gate; the doc's own review cadence is missed.
- Recommended fix: rebind the header and exit-condition table to the newest run's reconciled register (or state explicitly that the 2026-10-11 gate remains the release baseline with a dated justification).
- Owner suggestion: release owner
- Effort estimate: S
- Status: partially-fixed

### Finding ID: DOC-P3-007 — scripts/README.md still omits 5 scripts, including two new CI guards (partial)

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: Python compare of `scripts/` files vs `scripts/README.md` → 53/58 indexed; missing `bundle-budget.json`, `check-bundle-budget.mjs` (`e2e.yml:211`), `exercise-storage-restore.sh` (`validate.yml:74`), `check-changelog-checkbox.mjs` (`unit-tests/action.yml:87-90`), `check-no-dotenv.sh`.
- What is happening: two new guards were added in this window without being indexed; the list was 3 short before.
- Why it matters: a contributor cannot find the guard that blocks their PR.
- Recommended fix: add the five rows; add a coverage check to `check-docs-counts`.
- Owner suggestion: repo maintainer
- Effort estimate: S
- Status: partially-fixed

### Finding ID: DOC-P3-009 — Migration prefix 5302463 is duplicated and one header names the wrong number (regressed)

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence:
  - `supabase/migrations/5302463_client_portal_ai_and_visibility.sql`
  - `supabase/migrations/5302463_fix_notification_key_dedup_index.sql`
  - `5302463_client_portal_ai_and_visibility.sql:2` says "5302437: client-portal AI triage access..."
  - `docs/migrations/naming-guide.md:40` "Duplicate prefixes are not allowed"; `:84-92` checklist; `docs/SUPABASE_MIGRATION_WORKFLOW.md:30-31` still names 5302458 as newest.
- What is happening: two migrations share the same sequential prefix; ordering is decided by the descriptive filename, and the doc's example is stale.
- Why it matters: on a fresh `supabase db reset` the order is lexicographic (`client...` before `fix...`), which happens to work today but is not the documented sequence; a future rename can reorder schema changes.
- Recommended fix: renumber the second file to 5302464 (or the next free), fix the header comment, update the workflow example, and add a duplicate-prefix check to `check-migration-transactions.sh` or a new guard.
- Owner suggestion: backend/DB lead
- Effort estimate: S
- Status: regressed

### Finding ID: DOC-P2-010 — AGENTS.md Known Debt contradicts the ops docs on the prod-approval reviewer gate and branch divergence

- Severity: P2
- Confidence: High
- Area: DOC
- Evidence:
  - `AGENTS.md:124`: "`prod-approval` **now has a required reviewer** (verified 2026-10-15), so the manual-approval gate is in force".
  - `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md:108`: required reviewers are "**not yet configured**, so the approval gate is not currently in force".
  - `docs/ROLLBACK_PROCEDURES.md:350-353`: "Until that list is populated there is **no working manual-approval gate**".
  - `docs/RELEASING.md:190-195`: "**required reviewers on `prod-approval` are still not configured**".
  - Same bullet: "`main` now carries 26 commits that `develop` does not"; `git rev-list --left-right --count origin/main...origin/develop` = `1 0`.
  - Heading is still `### Known Debt (2026-08-29)` although the content was refreshed 2026-10-15 (PR #293).
- What is happening: after the #293 refresh, AGENTS.md asserts the opposite of three ops docs and carries a stale branch-divergence example.
- Why it matters: the approval gate is a release control; an operator cannot tell whether prod mutations will pause for review. GitHub environment settings are not in the repo, so this needs one verified, dated source.
- Recommended fix: verify the actual `prod-approval` environment, then make AGENTS/FINAL/ROLLBACK/RELEASING agree and date the claim; replace the hardcoded "26 commits" with a pointer to the `git rev-list` command (already in the same sentence) and refresh the heading date.
- Suggested validation: a docs check that rejects the phrase "not yet configured" in one file and "in force" in another, or a generated environment-status snippet.
- Owner suggestion: repo maintainer + release owner
- Effort estimate: S
- Status: open

### Finding ID: DOC-P3-011 — RELEASING.md still records PR #281 @ 7dd04023 as the last promotion

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: `docs/RELEASING.md:201-205` says "the last promotion is PR #281 (`main` @ `7dd04023`, 2026-10-14)"; the audited `main` is `6b7aa1a` ("Promote develop -> main (Nov 3)", tag `v0.1.0-20261103-6b7aa1a`) and `git rev-list --left-right --count origin/main...origin/develop` = `1 0`.
- What is happening: the pre-promotion checklist's "branch state" paragraph is stale.
- Why it matters: operators compare against the wrong commit/tag; release notes generation may anchor on the wrong previous tag.
- Recommended fix: update the paragraph (or generate it from `git describe --tags`/the release workflow) as part of the promotion checklist.
- Owner suggestion: release owner
- Effort estimate: S
- Status: open

### Finding ID: DOC-P3-012 — docs/modules/change-requests.md documents a nonexistent /api/v1/change-requests base path

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: `docs/modules/change-requests.md:25-35` lists `GET/POST /api/v1/change-requests`, `/:id`, `/:id/vote`, `/:id/implement`, `/:id/pir`; the router is mounted at `app.use("/api/v1/governance", governanceRouter)` (`apps/api/src/app.ts:207`) and the SDK calls `/api/v1/governance/change-requests` (`packages/sdk/src/governance.ts:81-96`).
- What is happening: the module doc describes the old/aspirational path.
- Why it matters: a developer or client following the doc gets 404s; the OpenAPI spec and SDK disagree with the doc.
- Recommended fix: correct every path in the table (or add an alias deliberately and document it).
- Owner suggestion: docs + governance owner
- Effort estimate: S
- Status: open

### Finding ID: DOC-P3-013 — Docs still pin prometheus v3.5.1 / alertmanager v0.28.1 after the compose bump

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: `docs/MONITORING_AND_ALERTING.md:238` says `prom/prometheus:v3.5.1`; `AGENTS.md:221-222` says `prom/prometheus:v3.5.1` and `prom/alertmanager:v0.28.1`; `infra/digitalocean/docker-compose.yml:306` is `prom/prometheus:v3.15.1@sha256:...` and `:354` is `prom/alertmanager:v0.29.0@sha256:...` (bump ca567f93).
- What is happening: the image-version strings were not updated with the bump.
- Why it matters: operators debugging rule/feature differences or reproducing a promtool command use the wrong version; the digests differ.
- Recommended fix: update both references (and the promtool example) to the pinned versions/digests.
- Owner suggestion: platform/observability
- Effort estimate: S
- Status: open

### Finding ID: DOC-P3-014 — docs/LICENSE_POLICY.md omits PSF-2.0, now allowed by security/license-policy.json

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: `security/license-policy.json:20` adds `"PSF-2.0"` (commit 6d747551); `docs/LICENSE_POLICY.md:20-26` lists the allowed licenses and does not include PSF-2.0 (it stops at Python-2.0 / Artistic-2.0).
- What is happening: the narrative policy and the machine policy disagree.
- Why it matters: a maintainer following the doc would reject a Python-licensed dependency the gate accepts; review decisions diverge from CI.
- Recommended fix: add PSF-2.0 to the doc list or make the doc render the JSON as the single source.
- Owner suggestion: supply-chain owner + docs
- Effort estimate: S
- Status: open

### Finding ID: DOC-P3-015 — API_ERROR_HANDLING.md names the 429 code as FULL, while the middleware returns RATE_LIMITED

- Severity: P3
- Confidence: High
- Area: DOC
- Evidence: `apps/api/src/middleware/rate-limit.ts:13-16` returns `failure("RATE_LIMITED", message, 429)`; `docs/API_RATE_LIMITING.md:60-67` documents `"code": "RATE_LIMITED"`; `docs/API_ERROR_HANDLING.md:81` says `429 | FULL (and rate-limit middleware)`.
- What is happening: the recent JSON-429 change is documented in one file but not the error-code table.
- Why it matters: client code branching on `error.code` follows the table and misses `RATE_LIMITED`.
- Recommended fix: replace FULL with RATE_LIMITED (keep FULL as the capacity code if it exists).
- Owner suggestion: API docs owner
- Effort estimate: S
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Operator misreads the prod approval gate | P2 | Medium | Unreviewed prod mutation or blocked deploy | DOC-P2-010 | One verified source |
| Migration order surprises on reset | P3 | Low | Schema drift | DOC-P3-009 | Renumber + guard |
| Release baseline stale | P3 | Medium | Wrong comparison/tag | DOC-P3-011 | Update checklist |
| Client codes on wrong 429 code | P3 | Medium | Poor retry UX | DOC-P3-015 | Fix table |
| Doc/JSON license mismatch | P3 | Low | Wrong review decision | DOC-P3-014 | Sync |

## Recommendations

### Immediate / Release Blocking

None. (The reviewer-gate contradiction is a control risk, not a code release blocker; resolve it before the next prod deploy.)

### This Week

- Resolve `DOC-P2-010` by verifying the GitHub environment and making all four docs agree.
- Update `RELEASING.md` branch state (`DOC-P3-011`).

### This Month

- Rebind `RELEASE_GATE.md` (`DOC-P2-005`); reconcile the breach gap list (`DOC-P2-004`).
- Renumber the duplicate migration and add a duplicate-prefix guard (`DOC-P3-009`).
- Index the five missing scripts and add coverage enforcement (`DOC-P3-007`).

### Later / Platform Evolution

- Add checks for docs citing verified-fixed findings and for policy JSON ↔ docs drift.
- Generate the environment-status and branch-state paragraphs instead of hand-maintaining them.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Fix the four reviewer-status sentences | Removes a release-control contradiction | AGENTS/FINAL/ROLLBACK/RELEASING | grep consistency |
| Renumber one migration + header | Restores unique prefixes | `supabase/migrations/5302463*` | `uniq -d` empty |
| Add PSF-2.0 to the license doc | Matches the gate | `docs/LICENSE_POLICY.md` | grep |
| Fix the 429 code row | Matches the middleware | `docs/API_ERROR_HANDLING.md` | grep |
| Update image versions | Matches compose | MONITORING + AGENTS | grep |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Environment-status single source | P2 | release owner | S | GitHub verify |
| Duplicate-prefix guard | P3 | DB lead | S | none |
| Docs-policy drift check | P3 | docs/CI | S | none |
| Script index coverage check | P3 | repo maintainer | S | none |
| Rebind release gate | P2 | release owner | S | current register |

## Suggested Tests

- CI guard: `find supabase/migrations -name '*.sql' | cut -d_ -f1 | sort | uniq -d` must be empty.
- CI guard: `docs/LICENSE_POLICY.md` allowed list must equal `security/license-policy.json` allowedLicenses.
- CI guard: `docs/API_ERROR_HANDLING.md` 429 row must contain `RATE_LIMITED`.
- Docs-links check: `docs/modules/**` endpoint paths must exist in `openapi.yaml` (or the SDK).
- Consistency check: exactly one of "required reviewers ... in force" / "not yet configured" may appear across AGENTS/FINAL/ROLLBACK/RELEASING.
- `check-docs-links`, `check-docs-counts`, `check-required-checks`, `check-env-parity`, `openapi-audit` remain green (verified locally).

## Suggested Documentation Updates

- `AGENTS.md`: refresh the Known Debt heading/date and remove the hardcoded 26-commit claim.
- `docs/RELEASING.md`: update the last-promotion paragraph.
- `docs/RELEASE_GATE.md`: rebind to the newest run.
- `docs/DATA_BREACH_RESPONSE.md`: reconcile the gap list.
- `docs/migrations/naming-guide.md` / `docs/SUPABASE_MIGRATION_WORKFLOW.md`: update the newest-migration example after renumbering.
- `docs/modules/change-requests.md`: fix the endpoint table.
- `docs/MONITORING_AND_ALERTING.md` + `AGENTS.md`: update prometheus/alertmanager versions.
- `docs/LICENSE_POLICY.md`: add PSF-2.0.
- `docs/API_ERROR_HANDLING.md`: 429 code.
- `scripts/README.md`: add the five missing entries.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does `prod-approval` have a required reviewer right now? | The four docs disagree | GitHub environment settings (repo-admin) |
| Which run is the release baseline: 8d299b8, 7dd0402 or the 2026-10-21 portal-modules run? | Decides the RELEASE_GATE rebind | Release-owner decision |
| Was the 5302463 duplicate intentional (two parallel branches)? | Decides renumber vs alias | Migration author/DB lead |
| Is `FULL` still a live error code anywhere? | The error table needs both codes or one | API grep / contract decision |

## Appendix

- Guard outputs at 6b7aa1a: `docs links OK`; `docs counts OK`; `PASS: all required checks match a workflow job`; `environment parity OK`; `Live routes parsed: 455`, `MISSING from spec (0)`.
- Duplicate prefixes: `5302463` (two files).
- Missing from `scripts/README.md`: `bundle-budget.json`, `check-bundle-budget.mjs`, `exercise-storage-restore.sh`, `check-changelog-checkbox.mjs`, `check-no-dotenv.sh`.
- Branch state: `git rev-list --left-right --count origin/main...origin/develop` = `1 0`; HEAD tag `v0.1.0-20261103-6b7aa1a`.
- Version drift: compose `prometheus:v3.15.1` / `alertmanager:v0.29.0` vs docs `v3.5.1` / `v0.28.1`.
