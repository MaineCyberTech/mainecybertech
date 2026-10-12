# Runbook: Emergency Merge (Branch-Protection Break-Glass)

> Audience: repo admins, the security reviewer and on-call operators.
> Covers audit finding **BP-P2-002** — a documented, auditable break-glass path
> for branch protection. Companion artifacts:
> [`.github/ISSUE_TEMPLATE/break_glass.yml`](../.github/ISSUE_TEMPLATE/break_glass.yml)
> (the record), [`.github/workflows/branch-protection-audit.yml`](../.github/workflows/branch-protection-audit.yml)
> (drift + bypass audit), [`.github/branch-protection/README.md`](../.github/branch-protection/README.md)
> (the as-code payloads). Related process docs: [RELEASING.md](RELEASING.md),
> [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md), [templates/POSTMORTEM.md](templates/POSTMORTEM.md).

## What counts as a break-glass merge

A break-glass merge is any merge into `main` or `develop` performed while one or
more rules in `.github/branch-protection/*.json` are relaxed or overridden:
a required status check that is stuck or cannot report, a required
review/CODEOWNERS approval that cannot be obtained, conversation resolution, or
admin enforcement.

Break-glass is allowed only when **all** of these hold:

1. The change restores or protects production (incident response, security fix,
   alerting/dead-man's-switch repair) or unblocks such a fix.
2. The normal path cannot complete inside the time-box: a required check is
   stuck/misconfigured, GitHub is degraded, or the required reviewer is
   unreachable.
3. An incident or ticket reference exists (GitHub issue, incident record, or the
   on-call thread per [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)).
4. The **repo owner** — or the **security reviewer** as delegate when the owner
   is unreachable during a declared incident — has approved the bypass, recorded
   in the break-glass issue.

"The PR is urgent" or "CI is flaky" alone is not a break-glass. Do not bypass
to skip a review that can simply be requested, and never disable required
reviews or widen protection settings beyond the stuck rule.

## Roles and time-box

| Role | Who | Responsibility |
| --- | --- | --- |
| Approver | repo owner; security reviewer as delegate | approve/deny, pick the smallest relaxation, set the time-box |
| Operator | the admin who performs the merge | file the record, relax only the stuck rule, merge, restore, verify |
| Reviewer | security reviewer | blameless post-incident review within 5 business days |

Default time-box: **4 hours** (a business day at most). Protection is restored
immediately after the merge — nothing stays relaxed "until the check is fixed".

## Record (audit trail) — do this first

File an issue from the **Break-glass record** template
(`.github/ISSUE_TEMPLATE/break_glass.yml`, title `[break-glass] ...`) **before**
the bypass. It records: incident link, approver, time-box, branch + PR, which
required checks/reviews are bypassed, the exact settings changed, restoration
evidence, and the post-incident review owner/date. If the emergency leaves no
time to file first, file within 30 minutes of the merge — the weekly audit
below also opens the record for any bypass it detects.

The scheduled `branch-protection-audit.yml` workflow (Mondays 07:45 UTC, or
Actions → Branch Protection Audit → Run workflow) is the machine half of the
trail:

- **drift job** — compares `.github/branch-protection/*.json` with the live
  settings (normalized to the committed shape) and fails on any difference. A
  relaxation that was not restored shows up here on the next run.
- **bypass job** — lists PRs merged into `main`/`develop` in the lookback
  window whose head-SHA check-runs did not satisfy the required contexts that
  were live on the branch, opens a deduplicated `[break-glass]` issue per
  bypass, and fails while a bypass has no record.

The direct source for bypass events would be the org audit-log API
(`protected_branch.policy_override` events via
`gh api /orgs/MaineCyberTech/audit-log`). That API is **not available on the
current GitHub plan** (it returns 404), so until the org upgrades, the trail is
the record issue plus the PR/check-run evidence above. Revisit this runbook if
the plan changes.

## Procedure

1. **Declare.** Post in the incident thread (or open one) and file the
   break-glass issue from the template. Fill in the approver, time-box, PR and
   the rule being bypassed.
2. **Get approval.** The approver writes approval in the issue. No approval, no
   bypass — the only exception is the owner being unreachable during a declared
   incident, in which case the security reviewer approves and the owner reviews
   afterwards.
3. **Relax the minimum.** In order of preference:
   1. Re-run or fix the stuck check (this is often the real fix).
   2. Remove **only** the stuck context from the branch protection
      (Settings → Branches, or keep the remaining contexts):
      ```bash
      gh api -X PATCH \
        repos/MaineCyberTech/mainecybertech/branches/<branch>/protection/required_status_checks \
        -f strict=true -f 'contexts[]=test (20.x)' -f 'contexts[]=lint (20.x)'
      ```
   3. Turn off *Do not allow bypassing the above settings* (`enforce_admins`) so
      an admin can merge with the override checkbox.
   Do not touch unrelated settings; do not remove required reviews.
4. **Merge.** Merge the smallest viable PR (prefer a hotfix PR from `main`, then
   backport to `develop` via the normal path). Record the merge commit SHA in
   the issue.
5. **Restore and verify.** Put the setting back immediately, then verify:
   ```bash
   gh api repos/MaineCyberTech/mainecybertech/branches/<branch>/protection \
     --jq '{enforce_admins: .enforce_admins.enabled, contexts: .required_status_checks.contexts}'
   ```
   and re-run the drift job (Actions → Branch Protection Audit → Run workflow).
   Paste the output into the issue.
6. **Follow up.** File a follow-up issue for the root cause of the stuck check
   (a required check that cannot report is itself a defect), and make sure any
   change that must land on the other branch goes through the normal path.

## Post-incident review

Within **5 business days** of the merge the reviewer runs a blameless review
([INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) §4.4,
[templates/POSTMORTEM.md](templates/POSTMORTEM.md)): what bypassed what, whether
the time-box and approval were honoured, what the record was missing, and what
would have avoided the bypass. Actions are filed as issues; the break-glass
issue is closed only once the review is attached.

## Verification (exercise without bypassing)

- `GH_TOKEN=<admin PAT> node scripts/branch-protection-audit.mjs --mode drift --repo MaineCyberTech/mainecybertech`
  — PASS against reconciled settings; the same command with `--live-dir` uses
  fixtures (`scripts/ci/check-branch-protection-audit.sh` runs those).
- Actions → Branch Protection Audit → Run workflow: both jobs must pass; the
  bypass job lists recent merges and requires a record for each bypass.
- File a throwaway `[break-glass]` issue from the template and close it — the
  bypass job treats an existing record issue as the audit trail for that PR.

## Operator dependency (cannot be set from the repo)

The drift and bypass jobs need the repo secret `BRANCH_PROTECTION_READ_TOKEN`:
a fine-grained PAT with **Administration: read** on this repository (plus
`Contents: read`, `Pull requests: read`, `Checks: read` for convenience). The
default `GITHUB_TOKEN` cannot read classic branch protection, so without the
secret both jobs fail closed with instructions. Set it at Settings → Secrets
and variables → Actions → Secrets (see
[GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)),
then re-run the workflow.

Reconcile the live settings with the committed JSON as part of enabling this:
the first drift run reports the pre-existing divergence (the live protection
predates `.github/branch-protection/*.json` and still carries the old context
names and `enforce_admins: false`), and the bypass audit treats the
unsatisfiable contexts it finds as bypasses until that is fixed. Before turning
`enforce_admins` back on, confirm every committed context matches a check-run a
workflow actually emits (`gh api
repos/MaineCyberTech/mainecybertech/commits/<sha>/check-runs --jq
'.check_runs[].name'`) — a required context that never reports blocks every
merge once admin bypass is disabled.
