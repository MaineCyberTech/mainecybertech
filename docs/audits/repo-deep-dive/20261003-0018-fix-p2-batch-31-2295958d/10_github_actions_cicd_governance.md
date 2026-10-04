# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: CI
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/10_github_actions_cicd_governance.md
- Scope limitations: Static; GitHub repo settings/branch protection not queried live (files inspected).

## Scope

Workflow triggers/permissions/pinning, deploy pipeline, gates, secret handling, environments/protection, branch protection, dependency review, static analysis, SBOM, and governance files.

## Evidence Reviewed

- `.github/workflows/` (16): test, validate, e2e, deploy-do, build-push, codeql, sbom, dependency-review, db-backup, db-restore-test, supabase-migrations, terraform-do, lint, typecheck, chromatic, a11y-breadth.
- `.github/branch-protection/{main,develop}.json`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/PULL_REQUEST_TEMPLATE.md`.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `deploy-do.yml` | CI | deploy gates | action SHAs pinned; rollback on health fail; secrets via env |
| read `validate.yml` | CI | gate depth | audit/test/openapi/docs/types/RLS/secrets prompts |
| read `test.yml` | CI | hard gates | coverage, Trivy (exit 1), secret scan |
| read `branch-protection/main.json` | config | required checks | strict true; 5 contexts; enforce_admins false |
| read `dependabot.yml` | config | update coverage | npm/actions/docker/terraform |
| read `terraform-do.yml` reference in `review.md` | doc | apply gating | manual-dispatch, apply input |

## Executive Summary

CI/CD is a genuine strength: all third-party actions are pinned by commit SHA, the deploy job forwards secrets as environment variables (not interpolated into the remote script), deploys are health-gated with automatic rollback, migrations are serialized per branch, and `validate.yml` composes a deep gate (tests, OpenAPI, docs counts/links, DB types, RLS hygiene, prompt provenance, secret scan). Governance gaps remain at the GitHub settings layer: `main` protection does not enforce admins, does not require code-owner review despite a `CODEOWNERS` file, and the required status contexts omit `CodeQL`, `Validate`, and `SBOM`. The prod deploy path also cannot currently succeed because the `prod` environment is documented as lacking secrets — a go-live blocker tracked as an operator action.

## Inventory

| Workflow | Trigger | Gate role | Risk |
|---|---|---|---|
| `test.yml` | push/PR | tests+Trivy+secrets | Low |
| `validate.yml` | workflow_call | deploy gate | Low |
| `deploy-do.yml` | push main/develop | build+SSH deploy | Medium |
| `e2e.yml` | PR/dispatch/call | E2E | Medium (flake) |
| `codeql.yml` | push/PR/weekly | SAST | Low |
| `sbom.yml` | push/PR/weekly | SBOM artifact | Low |
| `dependency-review.yml` | PR | blocks vulnerable deps | Low |
| `supabase-migrations.yml` | push main/dev | DB migrate | Medium |
| `terraform-do.yml` | dispatch | IaC | Medium |
| `db-backup.yml`/`db-restore-test.yml` | schedule | backup/restore | Medium (not exercised) |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Workflow hygiene | 5 | SHA-pinned, least privilege | — | keep |
| Deploy pipeline | 4 | health-gated rollback | prod env secrets missing | CI-P1-001 |
| Test/quality gates | 5 | `validate.yml` | — | keep |
| Secret handling | 4 | env forwarding, scan | — | keep |
| Branch protection | 2 | `main.json` | admin bypass, no CODEOWNERS gate | CI-P2-001 |
| Environments | 2 | prod lacks secrets/rules | go-live blocked | CI-P1-001 |
| IaC governance | 3 | manual terraform | no automated drift | CI-P2-002 |
| Supply chain | 4 | dependency-review, SBOM | no license gate | SUPPLY-P2-001 |

## Detailed Review

- Deploy safety: `deploy-do.yml` validates `rollback_sha` as hex, writes `.env` with `printf '%s'`, sets `chmod 600`, uses container healthchecks, and rolls back to `PREV_TAG` on failure.
- Required checks: `main.json` contexts are `test (20.x)`, `lint (20.x)`, `typecheck`, `e2e (20.x)`, `Dependency Review`. Not required: `CodeQL`, `Validate`, `SBOM`, `Chromatic`, `a11y`.
- `enforce_admins: false` lets admins bypass checks; `require_code_owner_reviews: false` ignores `CODEOWNERS`.

## Findings

### Finding ID: CI-P1-001 - Production deploy path cannot run; prod environment lacks secrets and protection rules

- Severity: P1
- Confidence: Medium
- Area: CI
- Evidence:
  - `review.md` Known Debt (Infra/ops) — “the `prod` environment has no `SUPABASE_*`/`JWT_SECRET`/vars, so the prod deploy path cannot succeed”; “`prod`/`prod-approval` environments have no protection rules”; no successful `main` deploy runs
  - `.github/workflows/deploy-do.yml` — `environment: ${{ needs.setup.outputs.name }}` and prod gates (`e2e-gate`, `migrate-gate`) require those secrets
  - `.github/branch-protection/main.json` — no environment protection concept (env rules live in GitHub settings)
- What is happening: a `main`/prod deploy would fail for missing credentials, and required reviewers are not configured.
- Why it matters: no reproducible production release; anyone able to trigger a workflow could deploy without review once secrets exist.
- User / business impact: release blocked; production change control weak.
- Security / privacy / reliability impact: high governance.
- Recommended fix: provision the `prod` environment secrets/vars, add required reviewers + wait timer to `prod`/`prod-approval`, and perform one successful dry `main` deploy.
- Suggested validation: `gh api repos/{owner}/{repo}/environments`; one green `deploy-do` run on `main`.
- Owner suggestion: ops/release
- Effort estimate: M
- Dependencies: GitHub admin credentials
- Status: open

### Finding ID: CI-P2-001 - Branch protection permits admin bypass and ignores CODEOWNERS

- Severity: P2
- Confidence: High
- Area: CI
- Evidence:
  - `.github/branch-protection/main.json` — `"enforce_admins": false`, `"require_code_owner_reviews": false`, `required_approving_review_count: 1`
  - `.github/CODEOWNERS` exists
  - `main.json` required contexts omit `CodeQL`, `Validate`, `SBOM`
- What is happening: admins can merge without the checks; code-owner review is not required; the SAST/gate workflows are not required statuses.
- Why it matters: the security gates can be bypassed and sensitive paths lack mandatory owner review.
- User / business impact: higher chance of a bad/unsafe merge.
- Security / privacy / reliability impact: medium governance.
- Recommended fix: set `enforce_admins: true`, `require_code_owner_reviews: true`, and add `CodeQL`, `Validate`, `SBOM` to required contexts (once stable).
- Suggested validation: inspect branch protection via API; attempt a bypass merge and expect block.
- Owner suggestion: repo admin
- Effort estimate: S
- Dependencies: GitHub admin
- Status: open

### Finding ID: CI-P2-002 - Terraform apply is manual and drift detection is not automated

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `review.md` — “`terraform-do` is manual-dispatch only (2026-09-29) … Re-enable push/PR triggers once the `DO_API_TOKEN` is rotated”
  - `.github/workflows/terraform-do.yml` — apply gated by an `apply` input
- What is happening: infra changes are applied manually; no scheduled plan/drift check.
- Why it matters: drift between committed Terraform and the droplet can persist unnoticed.
- Recommended fix: add a scheduled plan job (no apply) once the token is rotated; alert on non-empty plans.
- Suggested validation: scheduled plan run visible with zero diff.
- Owner suggestion: infra
- Effort estimate: S
- Dependencies: `DO_API_TOKEN`
- Status: open

### Finding ID: CI-P3-001 - `main` is far behind `develop`; scheduled jobs fire only from the default branch

- Severity: P3
- Confidence: Medium
- Area: CI
- Evidence:
  - `review.md` — “`main` is far behind `develop` (scheduled `db-backup`/`db-restore-test`/`sbom` only fire from the default branch, and the last backup runs failed)”
- What is happening: backup/SBOM schedules run on the stale default branch.
- Why it matters: backups/SBOM may not reflect deployed code.
- Recommended fix: promote `develop` to `main` (or repoint default) and verify scheduled jobs.
- Owner suggestion: release
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| No working prod release | P1 | High | Go-live blocked | CI-P1-001 | provision env |
| Gate bypass | P2 | Medium | Unsafe merge | CI-P2-001 | enforce admins |
| Infra drift | P2 | Medium | Outage | CI-P2-002 | scheduled plan |
| Stale backup/SBOM | P3 | Medium | Recovery gap | CI-P3-001 | promote main |

## Recommendations

### Immediate / Release Blocking
- Provision `prod` env secrets/reviewers and run one dry deploy (CI-P1-001).

### This Week
- Harden branch protection (CI-P2-001).

### This Month
- Scheduled Terraform plan + promote `main` (CI-P2-002/CI-P3-001).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| `enforce_admins: true` | stops bypass | branch protection | API check |
| Require CodeQL | SAST enforced | required contexts | API check |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Prod env provisioning | P1 | ops | M | GitHub admin |
| Branch protection | P2 | admin | S | none |
| TF drift plan | P2 | infra | S | token |

## Suggested Tests

- Workflow lint (`actionlint`), required-check coverage test, `terraform plan -detailed-exitcode`.

## Suggested Documentation Updates

- `docs/RELEASE.md` with the exact prod environment requirements and rollout.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are `prod` env rules already partially set? | CI-P1-001 scope | GitHub API |
| Is the default branch `main` or `develop`? | scheduled jobs | repo settings |

## Appendix

- 16 workflows; actions pinned by SHA; `validate.yml` gate steps enumerated in §Verification.
