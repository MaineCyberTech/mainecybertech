# Branch Protection and Required Checks Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `BP`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/34_branch_protection_required_checks.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

Committed branch-protection payloads, required-check guard, CODEOWNERS, PR template, Dependabot, environment approvals, manual dispatch, branch-protection-audit workflow, live PR/review/check-run state.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/check-required-checks.mjs` (executed) | Guard | Required contexts resolve | **PASS** (8 main / 6 develop) |
| `bash scripts/ci/check-branch-protection-audit.sh` (executed) | Fixture | Drift + bypass logic | **PASS** 5/5 |
| `.github/branch-protection/main.json` / `develop.json` | Config | Review/admin/context rules | enforce_admins:true; require_code_owner_reviews:true; 1 approval; 8/6 contexts |
| Live GitHub API: PR #333, #321, #323-#326 | Live state | Reviews and check-runs at merge | all 0 reviews; PR #333 merged 2026-11-03T07:48:23Z with test/e2e/review failed |
| Live GitHub API: branch-protection-audit runs 39273950100 / 40340906384 / 41491379135 | CI state | Drift/bypass exercise | all failed; 0 artifacts; 0 `[break-glass]` issues |

## Executive Summary

The committed as-code payloads remain strong (8 main / 6 develop contexts, enforce_admins:true, CODEOWNERS review required) and the guard/fixtures pass. The live control does not match the payload: PR #333 merged into main on 2026-11-03 with 0 reviews while `test (20.x)`, `e2e (20.x)` and `review` were failed, and the last 11 inspected PRs have 0 reviews (BP-P1-004 still-open). The drift and bypass workflows exist but have failed on all three scheduled runs, so neither the live drift nor the break-glass trail has ever been produced (BP-P2-002/003 now partially-fixed).

**Totals:** 16 findings — P0 0, P1 4, P2 7, P3 5. Status: partially-fixed 4, still-open 1, verified-fixed 11.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits | verified-fixed | re-verified at 6b7aa1a: main.json requires 'Dependency Review / review', emitted by dependency-review.yml job review; guard PASS (8/6 contexts resolve). |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews | verified-fixed | re-verified at 6b7aa1a: enforce_admins:true in both .github/branch-protection/main.json and develop.json. |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` | verified-fixed | re-verified at 6b7aa1a: deploy prod job environment prod-approval (deploy-do.yml:648); prod migrations (supabase-migrations.yml:38); terraform-apply-prod (terraform-do.yml:204); read-only resolve-ip/terraform-plan keep the unprotected prod env by design (nothing mutates). |
| BP-P2-001 | P2 | `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only | verified-fixed | re-verified at 6b7aa1a: require_code_owner_reviews:true in both payloads; scripts/check-codeowners.mjs (syntax + optional team resolution via CODEOWNERS_READ_TOKEN) wired in unit-tests action.yml:146-154. |
| BP-P2-002 | P2 | No break-glass / bypass process for branch protection, and no bypass audit trail | partially-fixed | code and fixtures exist at 6b7aa1a (branch-protection-audit.yml:94-186; bash scripts/ci/check-branch-protection-audit.sh PASS), but the trail has never been produced: all 3 scheduled runs fail (39273950100 2026-10-19, 40340906384 2026-10-26, 41491379135 2026-11-02), the bypass job fails at 'Detect bypasses', there are 0 [break-glass] issues and 0 audit artifacts. Consistent with the documented missing BRANCH_PROTECTION_READ_TOKEN (matrix:231). |
| BP-P2-003 | P2 | No drift detection between committed branch-protection JSON and live GitHub settings | partially-fixed | drift code/fixtures exist and the self-test passes, but the live detector has never completed: run 41491379135's drift job fails at step 3 'Compare the committed protection with the live settings' (same for 40340906384 / 39273950100), with no drift artifacts, so the committed-vs-live divergence is still unmeasured. Needs BRANCH_PROTECTION_READ_TOKEN (matrix:231). |
| BP-P2-004 | P2 | Path-filtered required checks can leave `main`/`develop` protected by checks that never run | verified-fixed | re-verified at 6b7aa1a: all required workflows have an unfiltered pull_request trigger (test.yml:10-14, lint.yml:5-10, typecheck.yml:5-10, e2e.yml:19-23, dependency-review.yml:2-4, codeql.yml); scripts/check-required-checks.mjs fails on a filtered required workflow. |
| BP-P2-005 | P2 | Required-check guard is not run on pull requests or on branch-protection-only changes | verified-fixed | re-verified at 6b7aa1a: unit-tests composite runs scripts/ci/check-required-checks.sh in both the PR gate (test.yml:41) and the deploy gate (validate.yml:88), reading .github/branch-protection/*.json, so a branch-protection-only PR is checked too; fixtures 4/4 PASS. |
| BP-P2-006 | P2 | `deploy-do` manual dispatch can target prod from an arbitrary ref, bypassing the develop->main promotion model | verified-fixed | re-verified at 6b7aa1a: deploy-do.yml:61-69 rejects deploy_target=prod unless GITHUB_REF=refs/heads/main; the same main-only guard exists for db-restore-test (:52-60), load-test (:67-75) and smoke-check prod dispatch. |
| BP-P2-007 | P2 | Security scan jobs are not required checks, so failing scans do not block merges | partially-fixed | at 6b7aa1a Test / security-scan, Test / secrets-scan and CodeQL / Analyze (javascript-typescript) are required on both branches and block merges; residual: GitHub's 'Require code scanning results' setting is a repo-admin action not evidenced in-repo, and Chromatic/a11y-breadth remain non-required (documented). |
| BP-P3-001 | P3 | Hotfix and emergency-deploy documentation is a stub and partially stale | verified-fixed | re-verified at 6b7aa1a: docs/RUNBOOK_HOTFIX.md is a complete procedure (branch-from-main, gates, backport, break-glass pointer, incident reference); RUNBOOK_EMERGENCY_MERGE.md covers the stuck-gate path. |
| BP-P3-002 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | partially-fixed | at 6b7aa1a the SLA is documented (docs/DEPENDENCY_POLICY.md) and dependabot-triage-reminder.yml keeps a weekly deduplicated triage issue; .github/PULL_REQUEST_TEMPLATE.md links branch protection. Residual: Dependabot security-update separation is a GitHub repo setting not inspectable read-only. |
| BP-P3-003 | P3 | Operator checklists disagree on which prod environments need required reviewers (`prod` vs `prod-approval`) | verified-fixed | re-verified at 6b7aa1a: matrix:9-16, RELEASING.md:118-141 and SECRETS_ROTATION.md:28-37 all name prod-approval as the single prod mutation gate; prod is read-only jobs only. |
| BP-P3-004 | P3 | check-required-checks guard mis-models explicit job names combined with matrices | verified-fixed | re-verified at 6b7aa1a: the guard models explicit job names + matrices (scripts/check-required-checks.mjs:73-90, emittedNames) and scripts/ci/check-required-checks.sh runs a 4/4 negative-fixture suite (PASS). |
| BP-P3-005 | P3 | No CODEOWNERS validation; invalid team handles silently disable owner-review enforcement | verified-fixed | re-verified at 6b7aa1a: scripts/check-codeowners.mjs + scripts/ci/check-codeowners.sh (fixture PASS) wired in unit-tests action.yml:146-154; CODEOWNERS_READ_TOKEN optional with a documented syntax-only fallback; .github/CODEOWNERS documents the failure mode. |
| BP-P1-004 | P1 | PR #279 merged into main with required checks pending and zero reviews - live protection does not match the committed payloads (or an unrecorded bypass) | still-open | still-open at 6b7aa1a with stronger live evidence: PR #333 (head 2a8b6ab -> main) merged 2026-11-03T07:48:23Z with 0 reviews and check-runs 'test (20.x)' failure, 'e2e (20.x)' failure and 'review' failure (Dependency Review annotation: 'Dependency review detected incompatible licenses'). The committed main.json requires 1 approving review, CODEOWNERS review, enforce_admins:true and 8 contexts (main.json:3-19). PRs #321, #323-#326 and #333 all merged with 0 reviews; no [break-glass] issue exists. The live protect... |

## New Findings Detail

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| No break-glass / bypass process for branch protection, and no bypass audit trail | P2 | BP-P2-002 | Fix/verify per the finding |
| No drift detection between committed branch-protection JSON and live GitHub settings | P2 | BP-P2-003 | Fix/verify per the finding |
| Security scan jobs are not required checks, so failing scans do not block merges | P2 | BP-P2-007 | Fix/verify per the finding |
| Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | P3 | BP-P3-002 | Fix/verify per the finding |
| PR #279 merged into main with required checks pending and zero reviews - live protection does not match the committed pa | P1 | BP-P1-004 | Fix/verify per the finding |

## Recommendations

- **Immediate:** reconcile the live `main`/`develop` protection with the committed JSON and record/backfill a break-glass reason for PR #333 (BP-P1-004). Provision `BRANCH_PROTECTION_READ_TOKEN` and get one green drift + bypass run (BP-P2-002/003).
- **This month:** decide and document whether Chromatic/a11y-breadth become required and whether GitHub code-scanning results are enforced (BP-P2-007).
- **This quarter:** formalise Dependabot security-update separation/triage in the repo settings (BP-P3-002).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| What are the actual live branch-protection settings? | PR #333 proves they differ from the committed payload | Admin-token drift run |
| Did PR #333 use an admin bypass? | Determines whether a break-glass record is required | Audit log / branch-protection override evidence |
| Why do both audit jobs fail? | The weekly trail has never been produced | Job logs with an admin token |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
