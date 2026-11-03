# GitHub Actions, CI/CD, and Governance Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `CI`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/10_github_actions_cicd_governance.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

.github/workflows (30), .github/actions (composites), .github/branch-protection, CODEOWNERS, dependabot, docs/CI.md, docs/RELEASING.md, release/deploy/migration workflows, live public GitHub runs/tags/releases.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/check-required-checks.mjs` (executed) | Guard | Required contexts resolve, no filtered required workflow | **PASS** (8 main / 6 develop) |
| `node scripts/check-docs-links.mjs` (executed) | Guard | Audit index + docs/CI workflow inventory | **PASS** (CI-P1-004 closed) |
| `node scripts/ci/test-secret-patterns.mjs` (executed) | Fixture | Canonical secret patterns | **PASS** (6 detected, 3 negatives) |
| `bash scripts/ci/check-required-checks.sh` (executed) | Fixture | Negative/positive required-check fixtures | **PASS** 4/4 |
| Live GitHub API: release run 41598762576, tags, releases | CI state | Release/tag/SBOM delivery | run green; 36 tags; Release asset `release-sbom.cdx.json` present |
| Live GitHub API: Chromatic run 41598762575 @ 6b7aa1a | CI state | Visual gate execution | job green; step 8 `Chromatic` **skipped** (token absent) |
| Live GitHub API: E2E runs 41598757709 / 41593286318 / 41590405172 / 41569749520 | CI state | Required E2E health | all fail at `Start Supabase`; last green 41520431521 (2026-11-02T20:34Z) |
| `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/RELEASING.md` | Docs | Operator-gated prod approval/secrets | still open (CI-P1-001/003) |

## Executive Summary

The pipeline is materially more operated than the previous run: the docs-links gate is green (CI-P1-004), release tagging now works end-to-end with 36 tags and an attached SBOM (CI-P2-011 / CI-P3-008), the secret scanner consumes one canonical pattern list including the platform token formats (CI-P3-005), and Storybook builds. Two new live failures are in scope: the required E2E check is red at the promotion head (CI-P1-005), and the new Chromatic token gate turns an unprovisioned token into a green skip (recorded on CI-P2-006). The prod approval/secrets gaps remain operator-gated (CI-P1-001/003), and actionlint is still config-only (CI-P3-001).

**Totals:** 31 findings — P0 0, P1 5, P2 11, P3 15. Status: open 2, partially-fixed 5, still-open 2, verified-fixed 22.

**New this run:** CI-P1-005, CI-P3-015.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate | still-open | still operator-gated at 6b7aa1a: every prod-mutating job attaches prod-approval (deploy-do.yml:648, supabase-migrations.yml:38, terraform-do.yml:204, load-test.yml, db-backup.yml/db-restore-test.yml, alert-path-exercise.yml), but docs still state the required reviewers are not configured (docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:9-16, docs/RELEASING.md:141-149). The repo cannot set environment reviewers. |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass | verified-fixed | re-verified at 6b7aa1a: reproduced the guard - node scripts/check-required-checks.mjs PASS, all 8 main / 6 develop contexts resolve to emitted check-runs (incl. 'Dependency Review / review' <- dependency-review.yml job review); enforce_admins:true + require_code_owner_reviews:true in both payloads; guard + fixtures wired in the required test job (unit-tests action.yml:136-144). |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules | still-open | still operator-gated at 6b7aa1a: docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:187-224 and docs/RELEASING.md:188-199 state prod-approval lacks SUPABASE_*/JWT_SECRET/migration secrets, DO_API_TOKEN returns 401, and prod has no DROPLET_IP fallback. No repo-side change. |
| CI-P1-004 | P1 | NEW: published fast-mode audit run fails the docs-links gate on main (required check + deploy gate red) | verified-fixed | re-verified at 6b7aa1a: node scripts/check-docs-links.mjs exits 0. The fast-run 905ed63 directory is indexed (docs/audits/README.md:113) and carries HISTORICAL.md; the new 20261103-0748 run is also indexed. The script runs in the required Test / test (20.x) job (unit-tests action.yml:72-74). |
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | verified-fixed | re-verified at 6b7aa1a: no firewall/wireguard workflow exists in .github/workflows (30 workflows inventoried); terraform-do rejects empty/world-open ADMIN_IP_RANGES before plan/apply (terraform-do.yml:102-113, :241-248). |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | verified-fixed | re-verified at 6b7aa1a: secret-scan composite diffs against github.event.before with a zero-SHA -> HEAD~1 fallback (.github/actions/secret-scan/action.yml:15-28); used by test.yml:78-88 and validate.yml:98-108. |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | verified-fixed | re-verified at 6b7aa1a: docs state the truth (matrix:12-14, RELEASING.md:128-133); the operational gap is tracked by CI-P1-001/003. |
| CI-P2-004 | P2 | DB restore test reports success without asserting restore integrity | verified-fixed | re-verified at 6b7aa1a: db-restore-test.yml:196-330 fails on table/migration/row/freshness/RLS floors (psql counts + created_at age + rowsecurity), not just prints. |
| CI-P2-005 | P2 | Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) | partially-fixed | terraform-do.yml remains manual-dispatch only (header :4-8) at 6b7aa1a; a weekly plan-only drift run exists (:14-15) but stays dormant until the operator sets TF_DRIFT_PLAN_ENABLED=true (:40), and PR/push plan gating stays off pending DO token rotation + environment protection. |
| CI-P2-006 | P2 | Chromatic visual-regression job is permanently non-blocking | partially-fixed | at 6b7aa1a the job still has no continue-on-error and exitZeroOnChanges:false (chromatic.yml:28,98), so a broken Storybook build is blocking. Residual: the new token check (chromatic.yml:71-88) skips the Chromatic step entirely when CHROMATIC_PROJECT_TOKEN is unset; live run 41598762575 (6b7aa1a) shows step 8 'Chromatic' skipped and the job green, so visual diffs/axe are not gated until the token is provisioned (docs matrix:151 lists it as required). |
| CI-P2-007 | P2 | Branch protection permits admin bypass and ignores CODEOWNERS | verified-fixed | re-verified at 6b7aa1a: both .github/branch-protection payloads set enforce_admins:true, require_code_owner_reviews:true, allow_force_pushes:false, allow_deletions:false, required_conversation_resolution:true. |
| CI-P2-008 | P2 | Terraform apply is manual and drift detection is not automated | partially-fixed | weekly plan-only drift check wired (terraform-do.yml:14-15, fails on non-empty plan :160-172) but dormant until TF_DRIFT_PLAN_ENABLED=true (:40); apply remains manual-dispatch + approval-gated. |
| CI-P2-009 | P2 | E2E is a required check on main but path-filtered, so PRs that miss its paths can never satisfy branch protection | verified-fixed | re-verified at 6b7aa1a: e2e.yml pull_request has no paths filter (:19-23); check-required-checks.mjs fails if a required check's workflow is path-filtered (fixture-tested, scripts/ci/check-required-checks.sh PASS). |
| CI-P2-010 | P2 | Backup dispatcher duplicates the backup workflows now that they exist on the default branch | verified-fixed | re-verified at 6b7aa1a: backup-dispatch.yml no longer exists anywhere in the tree; SCHEDULE_DISPATCH_TOKEN is documented as retired (matrix:160-162; SECRETS_ROTATION.md:98) and backup-staleness-check.yml now uses only GITHUB_TOKEN (:52). Residual stale comments still mention the retired dispatcher (backup-staleness-check.yml:17,61), but no workflow reads the PAT. |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | partially-fixed | shellcheck gate wired in both gates (test.yml:56, validate.yml:56; .github/actions/shellcheck/action.yml, --severity=warning) and the named issues are addressed; actionlint remains config-only (.github/actionlint.yaml) with no CI job. |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | verified-fixed | re-verified at 6b7aa1a: no 'actions: write' grants remain anywhere in .github/; workflow-level permissions are contents:read except codeql (security-events), dependency-review (pull-requests), release (contents), sbom/deploy builds (packages/id-token/attestations). |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | verified-fixed | re-verified at 6b7aa1a: deploy-do.yml:1152 uses StrictHostKeyChecking=yes with a pinned known_hosts built from DO_SSH_HOST_KEY; alert-path-exercise.yml:111 and scripts/rollback.sh:61 the same (rollback requires an explicit last-resort opt-in for accept-new). |
| CI-P3-004 | P3 | `main` is far behind `develop`; scheduled jobs fire only from the default branch | verified-fixed | re-verified at 6b7aa1a: origin/main contains all of origin/develop (git rev-list origin/main..origin/develop = 0; main is 7 ahead), so all 11 new scheduled workflows are on the default branch and their crons can fire. (This row was 'regressed' at 905ed63.) |
| CI-P3-005 | P3 | Secret scanner misses the platform's own token formats and scans diffs only | verified-fixed | re-verified at 6b7aa1a: the diff scanner reads the canonical scripts/ci/secret-patterns.txt list (secret-scan action.yml:14-16) which includes dop_v1_, sbp_, glpat-, sk-proj- and npm_ (:1-15), and `node scripts/ci/test-secret-patterns.mjs` passes (6 formats + 3 negatives). The pre-commit .sh/.ps1 scanners consume the same file. |
| CI-P3-006 | P3 | Unused permission grants across deploy/test workflows | verified-fixed | re-verified at 6b7aa1a: security-events:write only in codeql.yml (which uploads SARIF); terraform-do has no pull-requests:write and no dead PR-comment step; remaining grants (dependency-review pull-requests, release contents, build packages/id-token/attestations) are all consumed. |
| CI-P3-007 | P3 | DB restore test uses an unpinned `postgres:16-alpine` image | verified-fixed | re-verified at 6b7aa1a: db-restore-test.yml:177 postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea. |
| CI-P3-008 | P3 | No release/tagging workflow and no post-merge release artifact | verified-fixed | re-verified at 6b7aa1a: release.yml is wired (annotated tag + GitHub Release + lockfile SBOM) and live run 41598762576 succeeded; 36 tags exist and the latest Release (v0.1.0-20261103-6b7aa1a) has release-sbom.cdx.json attached. The post-merge release artifact is now delivered. |
| CI-P3-009 | P3 | e2e is required on `main` but the documented flakiness makes it an unstable hard gate | verified-fixed | re-verified at 6b7aa1a: docs/CI.md:196-211 documents the retry budget 2 + flake summary + quarantine policy; scripts/e2e-flake-summary.mjs reports retries and retried tests do not fail the job. The current E2E outage is a separate release-blocking failure (CI-P1-005), not flakiness policy. |
| CI-P3-010 | P3 | Missing per-job timeouts and minor workflow hygiene gaps | verified-fixed | re-verified at 6b7aa1a: every job that can carry timeout-minutes does (30-workflow inventory, none missing); reusable-workflow callers document the callee carrying its own. |
| CI-P3-011 | P3 | Workflow documentation drift: docs list a removed workflow, omit a live one, and misstate gate behavior | verified-fixed | re-verified at 6b7aa1a: the docs/CI.md File-column workflow inventory still matches all 30 .github/workflows files (0 missing/0 stale) and scripts/check-docs-links.mjs exits 0. Content-level row drift (Chromatic 'Failing', third-party 'four refs') is tracked in CI-P3-014 and INFRA-P2-003. |
| CI-P3-012 | P3 | Badge/report generation is a stub and is not wired into CI | verified-fixed | re-verified at 6b7aa1a: the badge stubs are gone (no generate_badges.py/history_logger.py under scripts/); docs/CI.md:213-226 documents the real reports (coverage-reports artifact, job summaries). |
| CI-P3-013 | P3 | workflow_dispatch inputs are interpolated directly into run: scripts (rollback_sha/deploy_target) | verified-fixed | fixed at 6b7aa1a (commit 07e9ce09, in main): deploy-do passes rollback_sha/deploy_target/ref through env indirection (ROLLBACK_SHA_INPUT :74-84, DEPLOY_TARGET_INPUT/REF_NAME_INPUT :88-91, ROLLBACK_SHA :482, SENTRY_RELEASE :666 env block). Remaining direct interpolations are type:choice inputs (load-test scenario :167) or env-block expressions, which GitHub validates server-side. |
| CI-P3-014 | P3 | NEW: Storybook webpack fix landed but CI docs/comments still describe the Chromatic build as broken | partially-fixed | at 6b7aa1a docs/CI.md and the chromatic.yml comments now describe the webpack 5.101.2 pin as applied, and the post-pin job builds Storybook. Residual: docs/testing.md:143-149 and docs/ui-kit.md:279-281 still say the Storybook build is broken/red, and docs/CI.md:19 still labels the Chromatic gate 'Failing (not required)' while live runs are green. |
| CI-P2-011 | P2 | release.yml fails on every promotion (SIGPIPE exit 141), so no tag/release/SBOM attachment is produced | verified-fixed | re-verified at 6b7aa1a: release.yml now uses `git log --max-count=100` and a sed range instead of `\| head` (release.yml:100-113) and sets the git identity before tagging (:147-148). Live run 41598762576 (6b7aa1a) is green; origin now carries 36 tags including v0.1.0-20261103-6b7aa1a and the GitHub Release has release-sbom.cdx.json attached. |
| CI-P1-005 | P1 | NEW: required E2E check is red at the promotion head (Start Supabase fails) | open | NEW at 6b7aa1a: the required E2E check is red at the promotion head. Live runs 41598757709 (PR #333 head 2a8b6ab), 41593286318, 41590405172 and 41569749520 all fail at step 10 'Start Supabase' after 'Restore the Supabase image cache' and 'Load the cached Supabase images' succeed; the last green run was 41520431521 (b2fd32a) at 2026-11-02T20:34Z. PR #333 was merged with the e2e check failed, and deploy-do run 41598762689 for 6b7aa1a is pending (on main the prod e2e-gate runs and will block). Root cause is not ret... |
| CI-P3-015 | P3 | NEW: declared Node engine floor (>=20.0.0) is below the >=20.11 required by import.meta.dirname | open | NEW at 6b7aa1a: package.json:7 declares node >=20.0.0, but scripts/ci/check-validate-sbom.mjs:25, scripts/ci/check-supply-chain-gates.mjs:31-32 and scripts/check-audits-budget.mjs:25 use import.meta.dirname, which requires Node >=20.11. Running check-validate-sbom.mjs on Node 18 fails with ERR_INVALID_ARG_TYPE; a developer on an allowed Node 20.0-20.10 would also fail. CI's setup-node 20.x resolves a newer 20, so live CI is unaffected. |

## New Findings Detail

### CI-P1-005 — NEW: required E2E check is red at the promotion head (Start Supabase fails) (P1, open)

- **Evidence:** NEW at 6b7aa1a: the required E2E check is red at the promotion head. Live runs 41598757709 (PR #333 head 2a8b6ab), 41593286318, 41590405172 and 41569749520 all fail at step 10 'Start Supabase' after 'Restore the Supabase image cache' and 'Load the cached Supabase images' succeed; the last green run was 41520431521 (b2fd32a) at 2026-11-02T20:34Z. PR #333 was merged with the e2e check failed, and deploy-do run 41598762689 for 6b7aa1a is pending (on main the prod e2e-gate runs and will block). Root cause is not retrievable read-only (job logs need admin); the cache path is the newest variable (e2e.yml:82-105).
- **Owner:** platform/CI owner · **Target:** this week

### CI-P3-015 — NEW: declared Node engine floor (>=20.0.0) is below the >=20.11 required by import.meta.dirname (P3, open)

- **Evidence:** NEW at 6b7aa1a: package.json:7 declares node >=20.0.0, but scripts/ci/check-validate-sbom.mjs:25, scripts/ci/check-supply-chain-gates.mjs:31-32 and scripts/check-audits-budget.mjs:25 use import.meta.dirname, which requires Node >=20.11. Running check-validate-sbom.mjs on Node 18 fails with ERR_INVALID_ARG_TYPE; a developer on an allowed Node 20.0-20.10 would also fail. CI's setup-node 20.x resolves a newer 20, so live CI is unaffected.
- **Owner:** platform/CI owner · **Target:** this quarter

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| Production application deploys have no working manual-approval gate | P1 | CI-P1-001 | Fix/verify per the finding |
| Production deploy path cannot run; prod environment lacks secrets and protection rules | P1 | CI-P1-003 | Fix/verify per the finding |
| Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) | P2 | CI-P2-005 | Fix/verify per the finding |
| Chromatic visual-regression job is permanently non-blocking | P2 | CI-P2-006 | Fix/verify per the finding |
| Terraform apply is manual and drift detection is not automated | P2 | CI-P2-008 | Fix/verify per the finding |
| actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | P3 | CI-P3-001 | Fix/verify per the finding |
| NEW: Storybook webpack fix landed but CI docs/comments still describe the Chromatic build as broken | P3 | CI-P3-014 | Fix/verify per the finding |
| NEW: required E2E check is red at the promotion head (Start Supabase fails) | P1 | CI-P1-005 | Fix/verify per the finding |
| NEW: declared Node engine floor (>=20.0.0) is below the >=20.11 required by import.meta.dirname | P3 | CI-P3-015 | Fix/verify per the finding |

## Recommendations

- **Immediate (this week):** restore the required E2E check (CI-P1-005): inspect `Start Supabase` after the cached-image load, and either fix the cache contents/key or remove the cache while the upstream pull is retried. Add PSF-2.0 to `dependency-review.yml` (SBOM-P1-006) and provision `CHROMATIC_PROJECT_TOKEN` or drop the green skip (CI-P2-006).
- **This week (operator):** configure `prod-approval` required reviewers and prod secrets (CI-P1-001/003); rerun the branch-protection drift audit (BP-P1-004).
- **This month:** enable `TF_DRIFT_PLAN_ENABLED` after the DO token rotation (CI-P2-005/008); wire actionlint as a CI job (CI-P3-001); fix the docs/testing.md and docs/ui-kit.md Storybook claims (CI-P3-014).
- **This quarter:** align the declared Node engine floor with the scripts' >=20.11 requirement (CI-P3-015).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Why does `supabase start` fail after a cache hit? | Root cause of the required E2E outage (CI-P1-005) | Job log / a local reproduction of the cached image set |
| Is `CHROMATIC_PROJECT_TOKEN` provisioned? | The visual/axe gate is skipped when it is absent | GitHub environment secret list (admin) |
| Can the deploy-do run for 6b7aa1a pass the prod e2e-gate? | Confirms the release impact of CI-P1-005 | run 41598762689 conclusion |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
