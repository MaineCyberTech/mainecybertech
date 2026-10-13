# Runbook: Hotfix / Emergency Deploy

> Audience: release owner, on-call operators, repo admins.
> Covers audit finding **BP-P3-001** — the hotfix path was a two-line stub.
> Companion artifacts: [`RELEASING.md`](RELEASING.md) (branch model, quality
> gates, approval gate), [`RUNBOOK_EMERGENCY_MERGE.md`](RUNBOOK_EMERGENCY_MERGE.md)
> (branch-protection break-glass — only needed when a gate is stuck),
> [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) (rollback and recovery),
> [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md),
> [`templates/POSTMORTEM.md`](templates/POSTMORTEM.md).

## When a hotfix applies

A hotfix is a small change that must reach production **without waiting for the
normal `develop` → `main` promotion cadence**:

- a production incident or security fix (data loss, auth/tenant-isolation
  break, outage), or
- unblocking one of those (e.g. a broken alerting or deploy path).

A hotfix is **not** a shortcut for a normal change, a refactor, or a feature
that is merely urgent. If the change can go through the normal promotion, do
that instead.

## Rules

1. **Branch from `main`, not `develop`** — `hotfix/<slug>`. A hotfix based on
   `develop` drags every unreleased change into production.
2. **Smallest viable diff.** One defect (or one tightly-coupled set), with the
   regression test that proves it. No drive-by cleanups, no dependency bumps,
   no reformatting.
3. **The normal gates still apply.** Branch protection on `main` requires:
   `Test / test (20.x)`, `Test / security-scan`, `Test / secrets-scan`,
   `Lint / lint (20.x)`, `TypeCheck / typecheck`, `E2E / e2e (20.x)`,
   `Dependency Review / review`, `CodeQL / Analyze (javascript-typescript)`,
   one approving review, a CODEOWNERS review, and conversation resolution
   (strict: the branch must be up to date). Do not weaken these for a hotfix.
4. **No gate is skipped by this runbook.** The only sanctioned bypass is the
   break-glass procedure in
   [`RUNBOOK_EMERGENCY_MERGE.md`](RUNBOOK_EMERGENCY_MERGE.md), which requires an
   approver, a time-box, a record issue, and a post-incident review. "CI is
   flaky" alone is not a break-glass.
5. **The approval record lives on the PR.** Prod deploy pauses on the
   `prod-approval` environment once its required reviewers are configured
   ([`RELEASING.md` §Approval gate](RELEASING.md#approval-gate)); the deploy
   run is the second record. A break-glass hotfix additionally files the
   `[break-glass]` issue before the bypass.
6. **Backport to `develop` always.** A fix that lives only on `main` is lost on
   the next promotion. Cherry-pick the merge commit (or merge `main` into
   `develop`) via the normal PR path, and reference the hotfix PR.

## Procedure

1. **Declare.** Confirm the incident reference (issue or incident record per
   [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md)). If production is currently
   broken and the normal path cannot complete inside the time-box, read
   `RUNBOOK_EMERGENCY_MERGE.md` **before** touching branch protection.
2. **Branch.**
   ```bash
   git fetch origin
   git switch -c hotfix/<slug> origin/main
   ```
3. **Fix + test.** Keep the diff minimal; add or update the regression test.
   Run what CI will run, locally where possible:
   ```bash
   pnpm lint && pnpm typecheck && pnpm --filter=api test   # scope to what changed
   ```
4. **PR to `main`.** Fill the PR template; call out the incident reference and
   why the normal path is not used. Request the CODEOWNERS reviewer for the
   touched paths.
5. **Green gate.** Wait for the required checks (they run on every PR — `test`,
   `lint`, `typecheck`, `codeql`, and `e2e` is required on `main`) and the
   approving + CODEOWNERS reviews. Resolve conversations.
6. **Merge.** Merging to `main` triggers `deploy-do` automatically for app
   paths; otherwise dispatch it:
   ```bash
   gh workflow run deploy-do.yml --ref main -f deploy_target=prod
   ```
   The prod `deploy` job attaches `prod-approval`; approve it there (once the
   reviewer list is configured) and watch the run: build → validate →
   prod-only `e2e-gate` + `migrate-gate` → `verify-attestations` → SSH deploy
   with the container-health gate and auto-rollback.
7. **Verify.** Confirm the deploy run is green and the health gate passed, then
   run the smoke check against the target:
   ```bash
   gh workflow run smoke-check.yml -f target=prod
   ```
   (or watch the scheduled run). `/health`, `/login` and the authenticated read
   must be green. Check alerts are quiet for 30 minutes.
8. **Backport.** Cherry-pick the merge commit to `develop` through the normal
   PR path:
   ```bash
   git fetch origin && git switch -c backport/<slug> origin/develop
   git cherry-pick -m 1 <merge-sha>
   git push -u origin backport/<slug>   # open the PR to develop
   ```
   For a multi-commit hotfix, merge `main` into `develop` instead and note it.
9. **Changelog + release.** Add the entry to `CHANGELOG.md` `[Unreleased]`
   (the coordinator reconciles changelog waves; a hotfix gets an explicit
   entry). The promotion push to `main` makes `release.yml` cut the
   `v<VERSION>-<date>-<sha>` tag/release — confirm it succeeded (or that the
   tag already existed).
10. **Post-incident review.** Within **5 business days** the reviewer runs a
    blameless review ([`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) §4.4,
    [`templates/POSTMORTEM.md`](templates/POSTMORTEM.md)): root cause, why the
    normal path could not carry the fix, what the hotfix bypassed (normally
    nothing), and follow-up actions. A break-glass hotfix closes its record
    issue only once the review is attached.

## Validation (exercise without an incident)

- Walk steps 2–4 on a scratch branch: confirm a docs-only PR to `main` is not
  blocked by path-filtered required checks (`scripts/check-required-checks.mjs`
  enforces this in CI).
- Confirm the deploy path: `deploy-do` on `main` attaches `prod-approval` and
  the `migrate-gate`/`e2e-gate` jobs run only for prod
  (`deploy-do.yml`, `if: needs.setup.outputs.name == 'prod'`).
- Confirm the backport path: cherry-pick a trivial commit to a `develop` PR and
  check the required checks report.
- Dispatch `smoke-check.yml -f target=dev` and confirm the job summary lists
  health + login (+ the authenticated read once the smoke account exists).
