# Testing, Quality, and Release Confidence Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: TEST
- Scope limitations: the Jest coverage suite was **not executed locally** (the audit host has Node 18 and no pnpm/corepack). Release-confidence claims were verified from the repository and the read-only public GitHub Actions API; job logs require admin access, so a red composite step is only identifiable at job/step granularity.

## Scope

Re-verified all 15 previous TEST findings at `6b7aa1a` and re-ran the release-confidence lens: unit/coverage, API, E2E, a11y, component, visual, contract, migration, security, load/failure and smoke tests, CI execution, flake risk, test data, coverage, critical paths, local commands and docs. The `7dd0402..6b7aa1a` diff was reviewed for test-count changes, the new E2E Supabase image cache, the `ubuntu-24.04` pin and the Chromatic token gate.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `node scripts/check-docs-counts.mjs` | Executed | Counts and coverage-threshold parity | `docs counts OK`, exit 0 |
| `node scripts/check-docs-links.mjs` | Executed | Docs integrity | `docs links OK` |
| `bash scripts/ci/check-required-checks.sh` | Executed | Required-check/workflow parity | PASS, 2 branch-protection files / 56 check-run names |
| Public GitHub Actions API | Read-only | Test/E2E/load/smoke/Chromatic history | Run IDs and conclusions cited below |
| `.github/workflows/{test,e2e,load-test,smoke-check,chromatic}.yml` | Read | Gates and triggers | Current at `6b7aa1a` |
| `apps/worker/src/__tests__/tasks/module-tasks.test.ts`, `orphan-cleanup.test.ts` | Read | Worker suites and data-loss modelling | Current at `6b7aa1a` |
| `apps/api/src/__tests__/route-authorization-guard.test.ts` | Read | Static route-authz guard | Current at `6b7aa1a` |
| `docs/testing.md`, `docs/CI.md`, `AGENTS.md`, `README.md`, `review.md` | Read | Published gates/counts | Drift noted |

## Executive Summary

Eleven of the 15 previous findings are `verified-fixed`; the load-test suite now has its first green scheduled and dispatch runs, the docs/test-count guards pass locally, and the a11y, orphan-cleanup, route-authz, smoke and packages/ui fixes remain intact. Three rows are `partially-fixed`: E2E flake is still not eliminated (and its latest run failed before Playwright), Chromatic is green but still not a required check and can silently skip the visual diff, and E2E stability on `main` remains unproven. Two rows are open: the PR-bypass release-confidence finding recurred on PR #333, and a new P2 shows the Supabase image cache does not reliably produce a runnable E2E stack.

No prior finding regressed. The release gate is still **not clean** at this SHA: there is no green Test/E2E artifact for the promoted tree, and the branch-protection bypass that merged PR #333 is the same pattern flagged last run.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| TEST-P2-001 | P2 | verified-fixed | Accessibility gate width contradicts docs | `a11y.spec.ts` 25 BASE + 43 FULL = 68; docs/testing.md:66,130; guard passes |
| TEST-P2-002 | P2 | verified-fixed | Worker scan tasks lacked a suite; branch floor no-op | `module-tasks.test.ts:205,288,312,338,445,521,552`; worker branches 25 |
| TEST-P2-003 | P2 | partially-fixed | E2E flakiness unresolved; prod-only gate masks it | Last green 41520431521 (b2fd32a); every run since failed at `Start Supabase`; prod gate unexercised |
| TEST-P2-004 | P2 | verified-fixed | Load tests manual-only, no budgets/failure injection | `load-test.yml` budgets + injection; green runs 41511827450, 41515001890 |
| TEST-P2-005 | P2 | verified-fixed | Orphan-cleanup tests modelled `storage.list` incorrectly | `orphan-cleanup.test.ts` (472 lines) covers pagination, placeholders, chunks |
| TEST-P2-006 | P2 | verified-fixed | Route suites stub authorization middleware | `route-authorization-guard.test.ts` static scan |
| TEST-P2-007 | P2 | verified-fixed | Coverage table contradicted jest configs | docs/testing.md:35-43 = API 45/70/74/70, Web 39/39/47/47, SDK 33/38/40/40, Worker 25/15/12/12 |
| TEST-P2-008 | P2 | verified-fixed | Test/suite totals stale and unverified | 4,674 / 521 in AGENTS/README/review; check-docs-counts passes; `.jest-results.json` guard |
| TEST-P2-009 | P2 | verified-fixed | E2E required check could be unreported via path filter | e2e.yml PR trigger has no `paths:`; required-check guard passes |
| TEST-P3-001 | P3 | partially-fixed | Visual regression non-blocking; Storybook build broken | Chromatic 41598762575 green; not required; token gap can skip diff; docs/testing.md:68 stale |
| TEST-P3-002 | P3 | verified-fixed | No scheduled production smoke check | `smoke-check.yml`; green 41592985890 (2026-11-03) |
| TEST-P3-003 | P3 | verified-fixed | Coverage thresholds modest/unconfirmable | Coverage artifacts uploaded; floors ratcheted |
| TEST-P3-004 | P3 | partially-fixed | Coverage low; E2E stability unproven on `main` | Last green E2E 41520431521; runs since fail at setup; prod gate unexercised |
| TEST-P3-005 | P3 | verified-fixed | packages/ui had no test/lint/typecheck | `packages/ui/package.json` scripts |
| TEST-P2-010 | P2 | open | Promotion PRs merge before required checks; promoted commit has no green Test artifact | PR #333 opened 07:48:21, merged 07:48:23 with 0 reviews; Test 41598757780 and E2E 41598757709 red |
| TEST-P2-011 | P2 | open (new) | Supabase image cache loads but `supabase start` still fails | e2e.yml:87-103,115-131,133-140; run 41598757709 steps 7-8 success, step 10 failure |

Counts: **11 verified-fixed / 3 partially-fixed / 0 regressed / 2 open** (TEST-P2-010 carried, TEST-P2-011 new).

### Release-confidence scorecard at 6b7aa1a

| Gate | Where | Blocking? | Green artifact at this tree? |
|---|---|---|---|
| Unit/coverage + schema/docs guards | `test.yml` (PR), `validate.yml` (push) | Yes (required) | **No** — Test 41598757780 red inside the unit-tests composite |
| Lint / TypeCheck | `lint.yml`, `typecheck.yml`, `validate.yml` | Yes | Yes (recent runs green) |
| E2E + a11y (25 routes) | `e2e.yml` (every PR), prod deploy gate | Required on PRs | **No** — E2E 41598757709 failed at Supabase start |
| Contract / migration / security guards | unit-tests composite | Yes | Not reproducible offline |
| Dependency audit / secret scan / CodeQL | composites + `codeql.yml` | Yes | Yes |
| Visual regression | `chromatic.yml` | Blocking, not required | Green 41598762575, but can skip without the token |
| Load/failure | `load-test.yml` | Scheduled | **Yes** — 41511827450, 41515001890 |
| Smoke (prod path) | `smoke-check.yml` | Scheduled | Yes for dev; prod gated by `SMOKE_PROD_ENABLED` |

## Residual detail

### TEST-P2-003 / TEST-P2-011 — E2E cannot reach Playwright

`e2e.yml:87-103` restores and loads `/tmp/supabase-images.tar` on a cache hit; `:115-131` still runs `supabase start` with three attempts; `:133-140` saves the tar **only after** a successful start. The last green E2E was 41520431521 on `b2fd32a` (2026-11-02T20:34Z). Every run since failed before Playwright: 41522067914, 41569749520, 41590405172, 41593286318 and 41598757709 (2026-11-03, tree `2a8b6abf` — byte-identical to `6b7aa1a`). In the latest run steps 7 (`Restore the Supabase image cache`) and 8 (`Load the cached Supabase images`) succeeded, then step 10 (`Start Supabase`) failed; all Playwright/migration steps were skipped. A fixed cache key (`supabase-images-${runner.os}-2.107.0-v1`) cannot recover when the pinned CLI's image set changes or the tar is incomplete; the job also warns that `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` are not provisioned, so any miss falls back to the anonymous pull limit.

Fix: derive the exact image refs from the pinned CLI, `docker image inspect` every one before starting, rebuild/save on any miss, bump the cache key with the CLI version, and treat a partial load as a cache miss rather than retrying `supabase start` against it. The CI area records the same red required check as CI-P1-005; this TEST row keeps the testing-impact view.

### TEST-P2-010 — the promotion bypass recurred

PR #333 was opened at 2026-11-03T07:48:21Z and merged at 07:48:23Z with 0 approving reviews. Its merge-commit check-runs begin at 07:48:30Z (Release), 07:49:13Z (SBOM), 07:49:24Z (Chromatic) and 07:51:10Z (CodeQL) — after the merge. None of the eight required contexts in `.github/branch-protection/main.json` completed before the merge. The PR head/tree checks then failed: Test 41598757780 failed in `./.github/actions/unit-tests` at 07:50:58Z, E2E 41598757709 failed at Supabase start, and the BP/CI domains record the same merge bypass and red required check. The weekly `branch-protection-audit.yml` is designed to flag this class of merge but its last three scheduled runs (41491379135, 40340906384, 39273950100) all failed, so the detector itself is not providing evidence.

### TEST-P3-001 — Chromatic green, but the gate is optional and skippable

`chromatic.yml:76-88` checks `CHROMATIC_PROJECT_TOKEN` in a step; when unset it emits a warning and skips the Chromatic action, leaving the job green. The recent main run 41598762575 completed success, but its 40-second duration is consistent with a cached Storybook build plus a skipped diff. `docs/testing.md:68` still states the Storybook build is broken and `docs/CI.md` calls Chromatic non-required; both should be reconciled.

## Recommendations

### Immediate / release blocking

1. Re-run the Test and E2E workflows on `6b7aa1a` (or `develop@2a8b6abf`) until both are green, or fix the failing unit-tests sub-step and the Supabase start failure; record the run URLs.
2. Verify live `main` branch protection against `.github/branch-protection/main.json` and run the bypass audit manually — PR #333 repeated the merge-before-checks pattern.
3. Fix or disable the image-cache path so E2E reports a real test result rather than a setup failure.

### This week

4. Dispatch `chromatic.yml` with `CHROMATIC_PROJECT_TOKEN` provisioned and confirm the visual diff actually runs; then promote Chromatic to a required check.
5. Provision the `prod-approval` secrets/reviewers so the prod E2E/smoke gates can be exercised.

### This month

6. Publish a flake trend and quarantine any spec that flakes twice in a rolling week per `docs/CI.md`.
7. Raise worker line/statement floors once coverage artifacts are reviewed.
8. Update `AGENTS.md`, `docs/testing.md` and `docs/CI.md` to the current E2E trigger/cache reality.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Re-run Test/E2E on the promoted tree | Restores a green release artifact | GitHub Actions | green run URLs |
| Rebuild the Supabase image cache from a successful start | Removes the setup failure | `.github/workflows/e2e.yml` | E2E reaches Playwright |
| Manual Chromatic dispatch with the token | Proves the visual gate really runs | `.github/workflows/chromatic.yml` | Chromatic run shows a diff |
| Correct the stale Storybook/E2E prose | Prevents reviewers trusting obsolete guidance | `docs/testing.md:65-68`, `AGENTS.md:117` | docs read-through |

## Suggested Tests

- **CI**: an E2E preflight that asserts every pinned Supabase image is present before `supabase start`, with a deliberate cache-miss test.
- **Regression**: a PR-context assertion that the head-SHA Test run is green before a promote PR can merge (or a break-glass record when bypassed).
- **Flake gate**: fail E2E when a spec flakes twice in a rolling week (policy exists; enforcement does not).
- **Coverage ratchet**: bump worker lines/statements to just below measured once artifacts are reviewed.

## Suggested Documentation Updates

- `docs/testing.md`: remove “prod-only on deploy” and “Storybook build is currently broken”.
- `docs/CI.md`: record the cache behavior and the first green load-test runs.
- `AGENTS.md`: replace the 2026-09 E2E debt paragraph with the current trigger/cache status.
- `review.md`: keep the 4,674/521 counts aligned with the guard.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which unit-tests sub-step failed on `2a8b6abf`? | Distinguishes a real test regression from a guard/flake | The failed job log (admin) or a rerun result |
| Is `CHROMATIC_PROJECT_TOKEN` provisioned? | A green Chromatic job may mean “skipped” | Chromatic run detail / secret presence |
| Which Supabase image is missing from the cache? | Determines whether the cache or the CLI pin is wrong | `docker image inspect` output at E2E start |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-11-03): PR #333 created 07:48:21Z / merged 07:48:23Z; check-runs 07:48:30-07:53:33Z; Test 41598757780 failed inside `unit-tests` at 07:50:58Z; E2E 41598757709 failed at `Start Supabase` with cache restore/load green; load-test 41511827450 (schedule) and 41515001890 (dispatch) success on 2026-11-02; smoke 41592985890 success; Chromatic 41598762575 success; external uptime 41561295979 success.
- Local suite execution: `not run` — Node 18, no pnpm/corepack, no `node_modules`.
