# Branch Protection and Required Checks Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: BP · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope: `.github/branch-protection/{main,develop}.json`, required-check guard + fixtures, CODEOWNERS + guard, Dependabot, PR template, hotfix/emergency runbooks, environment approvals, manual dispatch. Live GitHub state read-only via the public API (protection endpoints require auth and were not available).

## Executive Summary

All 15 previous BP rows were re-verified: **13 verified-fixed, 2 partially-fixed**, plus **1 new P1**. The committed protection-as-code is coherent with the workflow estate — every required context resolves to a real check-run and no required workflow path-filters its `pull_request` trigger (guard reproduced: PASS). `enforce_admins:true`, code-owner reviews, conversation resolution, no force-push/deletion are set on both branches; prod mutations all attach `prod-approval`; the drift/bypass audit, break-glass runbook and issue template exist and are fixture-tested.

The new finding is the most important one: **PR #279 (`docs/publish-reaudit`) was merged into `main` with its required checks still running and zero approving reviews** (live API evidence). With the committed payload requiring 8 status contexts, 1 approval, a CODEOWNERS review and `enforce_admins:true`, that merge is only possible if the live settings differ from the committed payload or an unrecorded bypass occurred. The drift/bypass audit workflow has never run (0 runs) and there are 0 `[break-glass]` issues, so the control has not been exercised — the repo-side mechanism is ready but the live gate is not evidenced as effective.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/check-required-checks.mjs` (executed) | Guard | Contexts resolve; no path-filtered required workflow | **PASS** (8 main / 6 develop) |
| `bash scripts/ci/check-required-checks.sh` (executed) | Fixture suite | Name+matrix modeling | **PASS** 4/4 |
| `bash scripts/ci/check-codeowners.sh` (executed) | Fixture suite | CODEOWNERS syntax/team handles | **PASS** |
| `bash scripts/ci/check-branch-protection-audit.sh` (executed) | Fixture suite | Drift + bypass detector | **PASS** 5/5 |
| Live API: PR #279 metadata/reviews, Test run 38334811453, `branch-protection-audit.yml` run count, break-glass issues | CI state | Did the live gate actually block? | **No** — merged with checks pending, 0 reviews, 0 audit runs, 0 break-glass records |
| `.github/branch-protection/*.json`, `branch-protection-audit.yml`, runbooks/templates | Config/docs | Rules and process | verified |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| BP-P1-001 | P1 | Required context no job emits | verified-fixed | `Dependency Review / review` resolves (guard PASS) |
| BP-P1-002 | P1 | `enforce_admins:false` bypass | verified-fixed | `enforce_admins:true` committed in both payloads |
| BP-P1-003 | P1 | Prod deploy uses unguarded `prod` | verified-fixed | deploy-do.yml:648; supabase-migrations.yml:38; terraform-do.yml:204 |
| **BP-P1-004** | **P1** | **NEW: PR #279 merged into main with required checks pending and zero reviews — live protection mismatch / unrecorded bypass** | **open** | `/pulls/279`: 0 reviews, merged 02:00:23Z; Test run 38334811453 started 02:00:21Z, failed 02:03:02Z; 0 branch-protection-audit runs; 0 `[break-glass]` issues |
| BP-P2-001 | P2 | CODEOWNERS advisory only | verified-fixed | `require_code_owner_reviews:true`; guard wired |
| BP-P2-002 | P2 | No break-glass process/audit | verified-fixed | bypass job + template + runbook (never exercised: 0 runs/issues) |
| BP-P2-003 | P2 | No drift detection vs live settings | verified-fixed | drift job (:43-92) + fixtures; unexercised (0 runs), needs operator token |
| BP-P2-004 | P2 | Path-filtered required checks | verified-fixed | no paths filters; guard enforces |
| BP-P2-005 | P2 | Guard not run on PRs | verified-fixed | unit-tests composite in both gates |
| BP-P2-006 | P2 | Prod dispatch from arbitrary ref | verified-fixed | main-only guard deploy-do.yml:61-69 (+3 more) |
| BP-P2-007 | P2 | Security scans not required | partially-fixed | scans + CodeQL required on both branches; "Require code scanning results" + Chromatic/a11y promotions are repo-admin |
| BP-P3-001 | P3 | Hotfix docs stub | verified-fixed | RUNBOOK_HOTFIX.md complete |
| BP-P3-002 | P3 | Dependabot triage/SLA + template | partially-fixed | SLA + reminder + template link; security-update separation is a repo setting |
| BP-P3-003 | P3 | Docs disagree on prod env | verified-fixed | all docs name `prod-approval` |
| BP-P3-004 | P3 | Guard mis-models names+matrices | verified-fixed | check-required-checks.mjs:73-90 + 4/4 fixtures |
| BP-P3-005 | P3 | No CODEOWNERS validation | verified-fixed | check-codeowners.mjs + fixtures |

## New Findings Detail

### BP-P1-004 — The merge gate did not block a red PR into `main` (P1, open)

- **Evidence (live API, read-only)**:
  - `GET /repos/MaineCyberTech/mainecybertech/pulls/279`: base `main`, head `62a09bac`, `merged: true`, `merged_at 2026-10-13T02:00:23Z`; `GET …/pulls/279/reviews` → `[]` (zero reviews).
  - Required `Test / test (20.x)` run `38334811453` started 02:00:21Z and failed at 02:03:02Z (step "Run ./.github/actions/unit-tests") — i.e., the merge happened while the required check was still running, minutes before its failure.
  - The committed `main.json` requires 8 status contexts, 1 approving review, a CODEOWNERS review, `strict:true` and `enforce_admins:true`.
  - `branch-protection-audit.yml` has **0 runs**; the repo has **0** `[break-glass]` issues.
- **Interpretation**: the live branch protection on `main` does not match the committed payload (or an org ruleset bypass was used without a break-glass record). Either way, the claim "all merges are gated by the committed required checks/reviews" is not evidenced for this merge — and the red check it skipped is the one CI-P1-004 breaks.
- **Fix**: run `scripts/branch-protection-audit.mjs --mode drift` with an admin token and reconcile/apply the live settings; provision `BRANCH_PROTECTION_READ_TOKEN` so the weekly audit runs; if a bypass is confirmed, open the `[break-glass]` record for PR #279 per `RUNBOOK_EMERGENCY_MERGE.md` and complete the post-incident review.
- **Validation**: drift audit exits 0; a test PR with a failing required check cannot be merged.

## Recommendations

- **Immediate (this week)**: reconcile live branch protection with the committed payloads and record the PR #279 bypass (BP-P1-004); this also unblocks CI-P1-004's gate narrative.
- **This month**: set "Require code scanning results" (BP-P2-007 residual); promote Chromatic/a11y to required checks once green (repo-admin).
- **This quarter**: enable Dependabot security updates and record the setting (BP-P3-002).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Do live protection settings match the committed JSON? | PR #279 merged red | drift audit with admin token |
| Was PR #279 an admin/ruleset bypass? | Decides whether a break-glass record is required | org audit log / GitHub support |
| Are required checks blocking on main now? | The next red PR is the test | merge attempt with a failing check |
