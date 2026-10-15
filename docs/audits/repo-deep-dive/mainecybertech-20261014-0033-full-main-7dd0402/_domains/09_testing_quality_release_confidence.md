# Testing, Quality, and Release Confidence Audit (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: TEST
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (14 TEST findings)
- Scope limitations: **the test suite was not executed locally** — the audit host has Node 18, no pnpm/corepack and 3.3 GB free disk, so `pnpm test:coverage` (4,612 tests) was `not run`; release-confidence claims were verified from the CI configuration and the read-only GitHub Actions history instead. No logs are downloadable without admin rights, so a red job's failing step is only identifiable at job granularity.

## Scope

Re-verified all 14 previous TEST findings at `main@7dd0402` and re-ran the release-confidence lens: unit/integration/API/E2E/component/visual/a11y/contract/migration/security/load/smoke coverage, CI execution, flake risk, test data, coverage, critical paths, pre-commit hooks, local commands and docs.

## Executive Summary

The testing program was substantially upgraded: **11 of 14 previous findings are `verified-fixed`** — the worker scan-task suite and a real branch floor, load tests with enforced budgets and failure injection, the machine-checked docs/threshold/test-count guards, E2E without a path filter, coverage artifacts, the packages/ui runner, and the smoke check. The a11y gate, orphan-cleanup tests and route-authz guard remain fixed.

Three rows are `partially-fixed` (E2E flake not eliminated and the prod gate unexercised; Chromatic blocking but the Storybook build unverified after the webpack pin; E2E stability on main still unproven). No regressions.

One new P2 matters for release confidence at this exact commit: **PR #281 was merged two seconds after it was opened, before any of the eight declared required checks could run, and its Test run is red** — so `main@7dd0402` has no green Test artifact even though the identical `validate / test` composite passed on the same SHA via the develop push pipeline. The weekly branch-protection bypass audit will flag this merge; the live protection setting needs a human check.

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| TEST-P2-001 | P2 | Accessibility gate width contradicts the code | verified-fixed | `a11y.spec.ts` 25/68; docs + `check-docs-counts.mjs:631-715` |
| TEST-P2-002 | P2 | Worker scan tasks lacked a suite; branch threshold was a no-op | verified-fixed | `module-tasks.test.ts` (7 handlers); worker branches 25 |
| TEST-P2-003 | P2 | E2E flakiness documented but unresolved; prod-only gate masks it | partially-fixed | flake summary + deterministic waits; no paths filter; prod gate unexercised |
| TEST-P2-004 | P2 | Load tests manual-only with no thresholds/failure injection | verified-fixed | `load-test.yml` budgets + `failure.injection.js` |
| TEST-P2-005 | P2 | Orphan-cleanup tests model `storage.list` incorrectly | verified-fixed | `orphan-cleanup.test.ts` (456 lines) |
| TEST-P2-006 | P2 | Route suites stub authorization middleware | verified-fixed | `route-authorization-guard.test.ts` |
| TEST-P2-007 | P2 | docs/testing.md coverage table contradicts the configs | verified-fixed | table matches; guard `check-docs-counts.mjs:182-210` |
| TEST-P2-008 | P2 | Test/suite totals stale and unverified | verified-fixed | CI-measured totals + `MCT_VERIFY_TEST_COUNTS=1` guard |
| TEST-P2-009 | P2 | E2E required check could be unreported via path filter | verified-fixed | no `paths:`; `check-required-checks.mjs` |
| TEST-P3-001 | P3 | Visual regression non-blocking with broken Storybook build | partially-fixed | Chromatic blocking now; webpack pin landed, build unverified |
| TEST-P3-002 | P3 | No scheduled production smoke check | verified-fixed | `smoke-check.yml`, green runs 2026-10-13 |
| TEST-P3-003 | P3 | Coverage thresholds modest / unconfirmable | verified-fixed | coverage artifacts; ratcheted floors |
| TEST-P3-004 | P3 | Coverage low and E2E stability unproven on main | partially-fixed | ratchet + artifacts; no flake-free window; TEST-P2-010 |
| TEST-P3-005 | P3 | packages/ui has no test runner or lint/typecheck | verified-fixed | `packages/ui/package.json` scripts |
| TEST-P2-010 | P2 | The promoted commit has no green Test artifact: PR #281 merged before any required check completed and its Test run is red | **open (new)** | PR #281 00:33:03→00:33:05; Test run 38490822596 failed; same SHA passed `validate/test` at 23:07 |

Counts: 11 verified-fixed / 3 partially-fixed / 0 regressed / 1 open (new P2).

### Release-confidence scorecard at 7dd0402

| Gate | Where | Blocking? | Green artifact at this SHA? |
|---|---|---|---|
| Unit/coverage + schema/docs guards | `test.yml` (PR), `validate.yml` (push) | Yes (required) | **No** — PR Test run red; same-SHA `validate/test` green via deploy-do |
| Lint / TypeCheck | `lint.yml`, `typecheck.yml`, `validate.yml` | Yes | Yes (PR runs green 2026-10-14) |
| E2E + a11y (25 routes) | `e2e.yml` (every PR), prod deploy gate | Required on PRs | Yes on the PR (38490822549); prod gate unexercised |
| Contract (OpenAPI) / migration / security guards | unit-tests composite | Yes | Not reproducible offline (suite not run) |
| Dependency audit / secret scan / CodeQL | composites + `codeql.yml` | Yes | Yes (PR runs green) |
| Visual regression | `chromatic.yml` | Blocking, not required | No (no run since the webpack pin) |
| Load/failure | `load-test.yml` | Scheduled | No runs yet |
| Smoke (prod path) | `smoke-check.yml` | Scheduled | Yes for dev; prod gated by `SMOKE_PROD_ENABLED` |

## Recommendations

### Immediate / release blocking

1. Re-run the Test workflow on `main@7dd0402` (or on `develop`) and record the green run — or identify and fix the red step (TEST-P2-010).
2. Verify the live `main` branch protection against `.github/branch-protection/main.json` and run the bypass audit manually; the promotion merge happened before any check ran (TEST-P2-010, BP area).

### This week

3. Dispatch `chromatic.yml` once on a UI-touching branch to confirm the webpack pin fixes the Storybook build, then promote Chromatic to a required check (TEST-P3-001).
4. Dispatch `load-test.yml` once (smoke + failure injection) and record the first green run (TEST-P2-004).

### This month

5. Publish a flake trend (job summaries already carry it) and quarantine any spec that flakes twice in a rolling week per `docs/CI.md` (TEST-P2-003).
6. Raise the worker line/statement floors once coverage artifacts show the real numbers (TEST-P3-003).

### Later / Platform evolution

7. Provision `prod-approval` secrets/reviewers so the prod E2E gate and smoke run against production (TEST-P2-003/TEST-P3-004).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Rerun Test on the promoted SHA | Restores a green release artifact | `.github/workflows/test.yml` (rerun) | green run URL |
| Manual Chromatic dispatch | Confirms the Storybook fix | `.github/workflows/chromatic.yml` | green Chromatic run |
| First load-test dispatch | Proves the budgets work end-to-end | `.github/workflows/load-test.yml` | green run + summary |

## Suggested Tests

- **Regression**: a PR-context CI assertion that the head-SHA Test run is green before a promote PR can merge (or a documented break-glass record when bypassed).
- **Flake gate**: fail the E2E job when a spec flakes twice in a rolling week (policy exists; enforcement does not).
- **Coverage ratchet**: bump worker lines/statements to just below measured once the artifacts are reviewed.
- **Doc guard**: extend `check-docs-counts.mjs` to the README totals if they remain hand-maintained.

## Suggested Documentation Updates

- `AGENTS.md` known-debt: update the E2E paragraph now that flake is instrumented and E2E runs on every PR.
- `docs/CI.md`: record the first Chromatic/load-test green runs once they exist.
- `docs/testing.md`: note the coverage-artifact location for reviewers.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Why did the PR-context Test run fail while the identical push-context composite passed on the same SHA? | Distinguishes flake from a real PR-only regression | The failed job's log (admin) or a rerun result |
| Is the live `main` branch protection identical to the committed payload? | Explains how PR #281 merged before checks ran | `BRANCH_PROTECTION_READ_TOKEN` + the drift audit output |
| Is the worker line/statement floor (12) an accepted floor? | Decides whether TEST-P3-003's residual needs action | Coverage artifacts from CI |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-10-14): PR #281 created 00:33:03Z / merged 00:33:05Z (merge commit 7dd0402); check suite 00:33:04-00:33:14Z; Test job 38490822596 failed 00:35:47Z; Lint/TypeCheck/E2E/SBOM/CodeQL/Dependency Review green; deploy-do push on develop (same SHA) green at 23:04-23:14Z including `validate / test (20.x)`; a11y-breadth green 2026-10-12; smoke-check green 2026-10-13; load-test and alert-path-exercise 0 runs.
- Local suite execution: `not run` — Node 18, no pnpm/corepack, 3.3 GB free disk on the audit host.
