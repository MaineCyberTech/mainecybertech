# Branch Protection Recommendation

> Companion artifact to audit prompt 40. Derived from sibling report
> `34_branch_protection_required_checks.md` (area code **BP**) in run
> `20261002-0344-develop-6286137`, repository `mainecybertech/mainecybertech`
> at commit `62861370` on `develop`. Read-only: no GitHub settings were changed.

## Why this matters for releases

Branch protection is the control that stands between an unreviewed change and a
production deploy (`deploy-do` deploys on pushes to `main`). The committed
as-code config is a real strength, but several enforcement gaps mean the release
trail is weaker than the changelog implies.

## Current state (evidence)

| Item | Evidence | Finding |
|---|---|---|
| Required contexts on `main` | `.github/branch-protection/main.json:4` — `["test (20.x)","lint (20.x)","typecheck","e2e (20.x)","Dependency Review"]` | `Dependency Review` never matches the emitted context `Dependency Review / review` (job id `review` at `.github/workflows/dependency-review.yml:11`) — BP-P1-001 |
| Admin bypass | `main.json:6`, `develop.json:6` — `"enforce_admins": false` | Admins can merge without checks/reviews — BP-P1-002 |
| CODEOWNERS | `.github/CODEOWNERS` present; `main.json:9` `require_code_owner_reviews:false` | Ownership map advisory only — BP-P2-001 |
| Prod deploy env | `deploy-do.yml:278` uses `prod`; `terraform-do.yml:158` uses `prod-approval`; matrix `:6-7` says no protection rules | Prod deploy has no human approval — BP-P1-003 |
| Drift detection | no workflow references `branch-protection`/`/protection` | As-code config can silently drift — BP-P2-003 |
| Path-filtered checks | `test.yml:13-20`, `e2e.yml:12-22` | Required checks don't run on docs-only PRs — BP-P2-004 |
| Break-glass | no process; hotfix section is a 2-line stub | No audited bypass path — BP-P2-002 |

## Recommended changes (in priority order)

### P1 — do first

1. **Fix the `Dependency Review` required context.** Capture the real emitted
   check-run name and set `main.json` `contexts` to the exact string:
   ```bash
   gh api repos/MaineCyberTech/mainecybertech/commits/<sha>/check-runs \
     --jq '.check_runs[].name'
   # then set contexts to the emitted value, e.g. "Dependency Review / review"
   gh api -X PUT repos/MaineCyberTech/mainecybertech/branches/main/protection \
     --input .github/branch-protection/main.json
   ```
   Alternatively give the job a stable `name:` and use that.
2. **Set `"enforce_admins": true`** in both `main.json` and `develop.json`, after
   defining a break-glass path (below).
3. **Add ≥1 required reviewer to the `prod` environment** (the one `deploy-do`
   actually uses), or repoint the prod deploy job to `prod-approval`.
4. **Correct the false approval claim** in `docs/ROLLBACK_PROCEDURES.md:167`
   ("1+ required reviewers") to match reality once configured.

### P2 — this week/month

5. **Set `"require_code_owner_reviews": true`** on both branches; confirm each
   `@mainecybertech/*` team exists and has members; add a CODEOWNERS syntax check.
6. **Add a drift-detection workflow** that fetches
   `repos/{owner}/{repo}/branches/{main,develop}/protection`, normalizes it, and
   fails when it differs from the committed JSON. Requires a token with
   `administration: read` (default `GITHUB_TOKEN` cannot read protection).
7. **Reconcile path filters vs required checks** — remove `paths` from
   `test`/`lint`/`typecheck` or add always-run companion jobs that report success
   when the real job is intentionally skipped.
8. **Add a bypass audit** from the GitHub audit log, and document a break-glass
   process (`docs/RUNBOOK_EMERGENCY_MERGE.md`) requiring an incident ticket, a
   named approver, a time-box, and a post-incident review.

### P3 — later

9. Migrate classic branch protection to **GitHub Rulesets** (or merge queue) for
   clearer semantics, bypass-actor lists, and required workflows.
10. Add a Dependabot `security` group and a triage SLA; point the PR template at
    the required-checks table.

## Verification

- Open a PR adding a high-severity vulnerable dependency → merge must be blocked
  for **both** an admin and a non-admin (proves point 1 + 2).
- Dispatch `deploy-do` with `deploy_target: prod` → run must pause at
  "Waiting for approval" (proves point 3).
- PR touching `/.github/workflows/` → requires `@mainecybertech/infrastructure`
  approval (proves point 5).
- Change protection in the UI → drift job fails; restore → green (point 6).

## Suggested automated test

A CI script that parses every `.github/workflows/*.yml`, derives `name/job-name`
contexts, and asserts every string in `main.json`/`develop.json` `contexts` is
producible by some job; fail on mismatch (catches BP-P1-001 on every PR).

## Risk if unchanged

An unreviewed vulnerable dependency, an unreviewed migration, or an unattended
production change can reach `main`/prod while the changelog presents the release
as fully gated. Track upstream as **BP-P1-001/002/003**.

*Source report: `34_branch_protection_required_checks.md`.*
