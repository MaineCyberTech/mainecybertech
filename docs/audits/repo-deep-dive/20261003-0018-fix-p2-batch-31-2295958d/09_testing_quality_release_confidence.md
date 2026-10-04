# Testing, Quality, and Release Confidence Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: TEST
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/09_testing_quality_release_confidence.md
- Scope limitations: Tests not executed (no install/run against hosted deps in this pass); assessed statically and via committed claims.

## Scope

Unit/integration/E2E strategy, coverage thresholds and enforcement, authz test realism, CI test gates, E2E stability, contract/regression tests.

## Evidence Reviewed

- `apps/api/jest.config.mjs` (thresholds), `apps/web/jest.config.mjs`, `apps/worker/src/__tests__/*`, `packages/sdk/src/__tests__/*`.
- 487 test files (`apps`,`packages`, excluding node_modules).
- `.github/workflows/{test,validate,e2e,a11y-breadth,chromatic}.yml`.
- `review.md` Test Status / Known Debt; `apps/api/src/__tests__/orphan-cleanup.test.ts` (worker test path differs; actual test at `apps/worker/src/__tests__/orphan-cleanup.test.ts`).

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `apps/api/jest.config.mjs` | config | coverage gate | branches 30 / functions 50 / lines 55 / statements 58 |
| read `apps/web/jest.config.mjs` | config | coverage gate | 38/38/45/46 |
| read `orphan-cleanup.test.ts` | test | claimed fix validation | mock ignores list path → misses DATA-P0-001 |
| read `validate.yml`/`test.yml` | CI | gates | tests, openapi, docs counts, types, RLS, review mirror |
| gather count | command | suite size | 487 test files |

## Executive Summary

Test investment is high (487 test files, ~3,490 tests claimed, Playwright + axe CI) and the CI gate is unusually comprehensive for a project this size (OpenAPI validation/coverage, docs-count and link drift, generated DB-type freshness, RLS hygiene, review.md mirror, secret scan, Trivy, CodeQL, dependency review). The most important quality signal is negative: the branch’s new orphan-cleanup tests validate the error path but model `storage.list` incorrectly (the mock ignores the path), so they give false confidence about the very data-loss scenario they were written for. E2E is acknowledged flaky and prod-only for the deploy gate; coverage thresholds are modest (API 55% lines, web 45%).

## Inventory

| Layer | Framework | Count (static) | Gate |
|---|---|---|---|
| API | Jest + supertest | 114 suites / 1,258 tests (claimed) | yes |
| Web | Jest + RTL | 271 / 1,832 (claimed) | yes |
| SDK | Jest | 3 / 296 (claimed) | yes |
| Worker | Jest | 9 / 104 (claimed) | yes |
| E2E | Playwright + axe | 90 spec files (claimed) | prod deploy gate + PR |
| OpenAPI | custom audit | 317 paths | test + validate |
| Docs/RLS/types | scripts | — | test + validate |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Unit coverage | 4 | jest thresholds | modest global bar | raise incrementally |
| Integration | 3 | supertest route suites | route suites stub middleware | add real authz suite |
| Authz realism | 2 | `review.md` “stub middleware modules” | enforcement tested only in dedicated suites | expand |
| E2E | 3 | Playwright + axe | flakiness, prod-only gate | stabilize |
| Contract | 4 | OpenAPI audit | — | keep |
| Regression for fixes | 2 | orphan-cleanup test gap | mock wrong | DATA-P0-001 test |
| CI quality gates | 5 | validate.yml | thorough | keep |

## Detailed Review

- Coverage thresholds are enforced (`coverageThreshold.global`) but low; a large regression can pass.
- Route tests stub `org-access`/`permissions` with pass-through `next()` (`review.md`), so route suites do not prove authorization — enforcement is covered only in dedicated middleware suites. Any new route that forgets a `require*` mount is not caught.
- E2E data-dependence is documented as flaky; the deploy gate is prod-only, and there are no successful `main` deploy runs (per `review.md`), so release confidence from E2E is unproven on the production branch.

## Findings

### Finding ID: TEST-P2-001 - Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug

- Severity: P2
- Confidence: High
- Area: TEST
- Evidence:
  - `apps/worker/src/__tests__/orphan-cleanup.test.ts:68-83` — `list` mock ignores the `_path` argument and returns the configured flat files for any path
  - `apps/worker/src/tasks/orphan-cleanup.ts` — production lists `""` (root) and receives folder entries
- What is happening: the suite asserts flat-key behaviour that the real API never returns for nested objects.
- Why it matters: the remediation claim (“orphan cleanup can no longer wipe a bucket”) is not actually proven; DATA-P0-001 would pass these tests.
- User / business impact: false release confidence around a P0-class bug.
- Security / privacy / reliability impact: reliability/data integrity.
- Recommended fix: model the real list contract (folders as `{name, id:null}`, objects under prefixes, pagination per path) and assert that no folder name is passed to `remove`.
- Suggested validation: a failing-then-passing test that reproduces the root-listing folder entry.
- Owner suggestion: worker QA
- Effort estimate: S
- Dependencies: DATA-P0-001
- Status: open

### Finding ID: TEST-P2-002 - Route suites stub authorization middleware, so new routes can regress silently

- Severity: P2
- Confidence: Medium
- Area: TEST
- Evidence:
  - `review.md` Test patterns — “route-level suites stub the middleware modules (`org-access`, `permissions`) with pass-through `next()`”
  - `apps/api/src/__tests__/` route suites; dedicated `middleware-org-access.test.ts`, `middleware-permissions.test.ts`
- What is happening: route tests prove handler logic, not that the router mounts the right gates.
- Why it matters: a route added without `requireOrgAccess`/`requirePermission` passes its own suite.
- Recommended fix: add a static/route-mount test that asserts every mutating route under a tenant-scoped router has the expected middleware chain (or a generated inventory checked against a policy list).
- Suggested validation: table-driven test enumerating router stacks.
- Owner suggestion: API QA
- Effort estimate: M
- Dependencies: none
- Status: open

### Finding ID: TEST-P3-001 - Coverage thresholds are low and E2E stability is unproven on `main`

- Severity: P3
- Confidence: Medium
- Area: TEST
- Evidence:
  - `apps/api/jest.config.mjs` — branches 30, functions 50, lines 55, statements 58
  - `apps/web/jest.config.mjs` — 38/38/45/46
  - `review.md` — “E2E has known run-to-run flakiness”; no successful `main` deploy runs
- What is happening: global bars are permissive and the prod gate has never completed on `main`.
- Why it matters: gradual coverage erosion; unclear production-branch signal.
- Recommended fix: ratchet thresholds per package; quarantine/retry flaky specs with a tracked allowance; run the deploy gate once on `main` before go-live.
- Suggested validation: CI coverage trend; one green `main` deploy run.
- Owner suggestion: QA/DevEx
- Effort estimate: M
- Dependencies: CI credentials
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Untested data-loss fix | P2 | High | False confidence | TEST-P2-001 | model list |
| Authz regression untested | P2 | Medium | Tenant leak | TEST-P2-002 | route-stack test |
| Coverage erosion | P3 | Medium | Regressions | TEST-P3-001 | ratchet |

## Recommendations

### Immediate / Release Blocking
- Fix the orphan-cleanup test model before trusting the fix (TEST-P2-001).

### This Week
- Add a route-mount authorization test (TEST-P2-002).

### This Month
- Ratchet coverage; stabilize E2E; produce one green `main` deploy.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Folder-entry test | catches P0 | `orphan-cleanup.test.ts` | red→green |
| Route-stack assertion | catches missing gates | API test helper | CI |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Test model fix | P2 | QA | S | DATA-P0-001 |
| Authz route test | P2 | API QA | M | none |
| Coverage ratchet | P3 | DevEx | M | none |

## Suggested Tests

- Storage semantics fixture; route-stack authorization matrix; idempotent webhook replay; RLS direct-PostgREST negative tests.

## Suggested Documentation Updates

- Document E2E quarantine policy and the coverage ratchet plan.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Was `pnpm test` green at 2295958d? | baseline | CI run |
| Which specs are quarantined? | stability | e2e config |

## Appendix

- `review.md` claims 3,490 tests / 397 suites (2026-09-27) and 487 test files observed statically. Claim not re-executed in this read-only pass.
