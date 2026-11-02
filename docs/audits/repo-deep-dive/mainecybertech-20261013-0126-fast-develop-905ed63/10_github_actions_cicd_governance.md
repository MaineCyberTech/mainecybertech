# 10_github_actions_cicd_governance — Prompt 10 - GitHub Actions, CI/CD, and Governance Audit

- Run: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Target: `mainecybertech` @ `905ed63` (branch `develop`)
- Domain: `10_github_actions_cicd_governance.md` (area CI, prompt)

## Verification Performed

# GitHub Actions, CI/CD, and Governance — re-audit verification (develop @ 905ed63)

Read-only verification at `905ed63`. The workflow estate grew from 20 to 30 workflows and from 4 to 8 composite actions since the last audit. All 25 previous CI rows were re-checked; 17 are verified fixed, 5 partially fixed, 2 still open (operator-gated prod environments), 1 regressed state (develop->main promotion), plus 1 new hardening finding.

Key evidence: `deploy-do.yml` (prod-approval at :639, pinned host key at :1125-1132), `supabase-migrations.yml:34` (prod migrations now attach `prod-approval`), `branch-protection/{main,develop}.json` (enforce_admins, code-owner reviews, 8/6 required contexts), `scripts/check-required-checks.mjs` + fixtures (required checks must resolve and must not be path-filtered), `scripts/check-codeowners.mjs`, `e2e.yml` (no PR paths filter), `chromatic.yml` (blocking job), `db-restore-test.yml:177` (digest-pinned postgres) and :197-260 (integrity floors), `release.yml` (annotated tag + GitHub Release + SBOM), `secret-history-scan.yml:27-39,61-80` (checksum-pinned gitleaks + failure notifier), new composite actions (`shellcheck`, `dockerfile-lint`, `prometheus-rules`, `terraform-state-restore-test`) and 11 new scheduled workflows (branch-protection audit, backup staleness, dependency re-scan, uptime probe, smoke check, third-party image scan, storage restore test, alert-path exercise, load test, Dependabot triage reminder, release).

Current-state gaps (not code regressions): `origin/main` is 311 commits behind `develop`, so the new scheduled workflows cannot fire from the default branch until the next promotion, and `origin/main` still carries the retired `backup-dispatch.yml`. Production `prod-approval` reviewers and prod secrets remain operator provisioning items (CI-P1-001/003) — the workflow side is complete. The new finding records that `deploy-do.yml:75,82` interpolates dispatch inputs into `run:` scripts before validation; pass them via `env:` to remove the injection surface.

## Findings

| ID | Severity | Title |
|---|---|---|
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules |
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers |
| CI-P2-004 | P2 | DB restore test reports success without asserting restore integrity |
| CI-P2-005 | P2 | Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) |
| CI-P2-006 | P2 | Chromatic visual-regression job is permanently non-blocking |
| CI-P2-007 | P2 | Branch protection permits admin bypass and ignores CODEOWNERS |
| CI-P2-008 | P2 | Terraform apply is manual and drift detection is not automated |
| CI-P2-009 | P2 | E2E is a required check on main but path-filtered, so PRs that miss its paths can never satisfy branch protection |
| CI-P2-010 | P2 | Backup dispatcher duplicates the backup workflows now that they exist on the default branch |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check |
| CI-P3-004 | P3 | `main` is far behind `develop`; scheduled jobs fire only from the default branch |
| CI-P3-005 | P3 | Secret scanner misses the platform's own token formats and scans diffs only |
| CI-P3-006 | P3 | Unused permission grants across deploy/test workflows |
| CI-P3-007 | P3 | DB restore test uses an unpinned `postgres:16-alpine` image |
| CI-P3-008 | P3 | No release/tagging workflow and no post-merge release artifact |
| CI-P3-009 | P3 | e2e is required on `main` but the documented flakiness makes it an unstable hard gate |
| CI-P3-010 | P3 | Missing per-job timeouts and minor workflow hygiene gaps |
| CI-P3-011 | P3 | Workflow documentation drift: docs list a removed workflow, omit a live one, and misstate gate behavior |
| CI-P3-012 | P3 | Badge/report generation is a stub and is not wired into CI |
| CI-P3-013 | P3 | workflow_dispatch inputs are interpolated directly into run: scripts (rollback_sha/deploy_target) |
