# Branch Protection and Required Checks Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: BP
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/34_branch_protection_required_checks.md
- Scope limitations: Branch protection rules are configured in the GitHub UI and cannot be verified from repository files. This report recommends settings to apply, cross-referenced with the CI workflows that exist.

## Scope

Reviewed all 12 workflow files for required status check mapping, CODEOWNERS for review requirements, Dependabot config, environment approval settings, and deployment workflow gates. Assessed what branch protection rules should be configured for main and develop branches, and what supplementary governance controls are in place or missing.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `.github/workflows/test.yml` | Workflow | Potential required check | Runs on PR to main/develop |
| `.github/workflows/lint.yml` | Workflow | Potential required check | Runs on PR to main/develop |
| `.github/workflows/typecheck.yml` | Workflow | Potential required check | Runs on PR to main/develop |
| `.github/workflows/e2e.yml` | Workflow | Potential required check | Runs on PR + workflow_call |
| `.github/workflows/dependency-review.yml` | Workflow | Potential required check | Fails on high severity |
| `.github/workflows/validate.yml` | Workflow | Reusable gate | Not a standalone check |
| `.github/workflows/deploy-do.yml` | Workflow | Deploy gate | Has prod-approval |
| `.github/workflows/terraform-do.yml` | Workflow | Infra deploy | Plan posted to PR |
| `.github/CODEOWNERS` | Config | Review requirements | Team-based ownership |
| `.github/dependabot.yml` | Config | Dependency automation | Weekly updates |
| No PR template | Missing | PR standards | No template file found |

## Executive Summary

The repository has strong CI/CD validation with 6 workflows that run on PRs to main/develop (test, lint, typecheck, E2E, dependency-review, chromatic). Production deployments are gated through a `prod-approval` environment requiring manual approval. CODEOWNERS are configured with team-based ownership. However, branch protection rules cannot be verified from repository evidence — they exist only in GitHub UI settings, which are prone to drift and not auditable. There is no PR template, no branch/release/hotfix documentation, and CODEOWNERS references GitHub teams whose membership is not in the repo.

### Strengths
- Multiple PR validation workflows (test, lint, typecheck, E2E, dependency-review, chromatic)
- Production approval environment (`prod-approval`) for deploy and Terraform apply
- Terraform plan automatically posted to PRs as a comment (terraform-do.yml:95-109)
- Supabase migrations gated by environment (dev auto, prod via approval)
- Dependabot configured for dependency management
- Validation gates documented in AGENTS.md

### Major Risks
- Branch protection rules not codified — GitHub UI only, not auditable via PR
- No PR template — inconsistent PR descriptions
- No required checks locked in branch protection — cannot verify from repo
- CODEOWNERS uses GitHub team names — team membership/members may be stale
- No documented branch strategy (release branches, hotfix procedure)

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| Workflows/jobs | 4 | 12 workflows, 6 on PR | No required checks configuration in code | Document required checks |
| PR templates | 0 | No template found | Missing entirely | Create PULL_REQUEST_TEMPLATE.md |
| CODEOWNERS | 3 | Team-based ownership | No individual owners, team membership unknown | Review team membership |
| Dependabot | 4 | Configured for npm + GHA | None significant | — |
| Release/deploy/migration/security workflows | 4 | All exist and documented | No release workflow | Add release workflow |
| Branch/release/hotfix docs | 0 | No branch strategy doc | Missing entirely | Create branching strategy doc |
| Environment approvals | 4 | prod-approval on deploy + tf | None | — |
| Manual dispatch | 3 | deploy-do, terraform-do, db-backup | Not all workflows support dispatch | Add to all workflows |
| Workflow risks | 3 | No pull_request_target | No risks found | — |

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| BP-001 | Branch protection on main | GitHub UI only | Unknown | Rules not in code | P1 | Codify protection rules |
| BP-002 | Branch protection on develop | GitHub UI only | Unknown | Rules not in code | P1 | Codify protection rules |
| BP-003 | PR reviews required | CODEOWNERS | Team ownership | Enforce minimum 1 review | P2 | Add to branch protection |
| BP-004 | PR template | None | Missing | No standardized PR format | P2 | Create PULL_REQUEST_TEMPLATE.md |
| BP-005 | Required status checks | test, lint, typecheck workflows | Workflows exist | Not enforced as required | P1 | Add to branch protection |
| BP-006 | Linear history | No evidence | Unknown | No squash/merge config | P2 | Enforce squash merge |
| BP-007 | Release/hotfix strategy | None | Missing | No documented process | P2 | Create branching doc |
| BP-008 | Environment reviewers | prod-approval | Manual approval | Dev env has no gate | P2 | Add dev env review gate |
| BP-009 | CODEOWNERS freshness | Teams referenced | Unknown | Team membership may be stale | P2 | Review annually |

## Findings

### Finding ID: BP-P1-001 - Branch protection rules not codified in repository

- Severity: P1 - High
- Confidence: High
- Area: Branch Protection / Governance
- Evidence:
  - No `.github/branch_protection.yml` or Terraform `github_branch_protection` resource
  - No documentation specifying exact required checks, review counts, or merge requirements
  - Branch protection settings exist in GitHub UI only (cannot be verified from repo)
- What is happening: Branch protection rules for `main` and `develop` are configured in the GitHub web UI. There is no codified definition in the repository, meaning settings can drift, cannot be reviewed in PRs, and cannot be redeployed if the repository is recreated.
- Why it matters: Without codified protection, there's no audit trail for when/why rules change. A GitHub admin could weaken protection without review.
- User / business impact: Risk of unreviewed code reaching main/develop.
- Security / privacy / reliability impact: High — direct access control risk.
- Recommended fix: Use Terraform (`github_branch_protection` resource) or GitHub's branch protection API to define rules as code. At minimum, create a `docs/branch_protection.md` documenting exact settings.
- Suggested validation: PR to change protection rules is reviewed before applying.
- Owner suggestion: Infrastructure team
- Effort estimate: 4 hours (Terraform) or 1 hour (doc only)
- Dependencies: Terraform GitHub provider or GitHub API
- Status: Open

### Finding ID: BP-P2-001 - No PR template

- Severity: P2 - Medium
- Confidence: High
- Area: PR Standards
- Evidence:
  - No `.github/PULL_REQUEST_TEMPLATE.md` found
  - No `pull_request_template` config in repo
- What is happening: PRs lack a standardized description template.
- Why it matters: Without a template, PRs may lack required context: testing performed, deployment notes, migration considerations, related issues.
- User / business impact: Lower review quality, harder to trace intent.
- Recommended fix: Create `.github/PULL_REQUEST_TEMPLATE.md` with:
  ```markdown
  ## Description
  ## Type of Change (bug/feature/refactor/docs/infra)
  ## Testing Performed
  ## Deployment Notes
  ## Related Issues
  ## Checklist
  ```
- Suggested validation: New PR auto-fills with template.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Status: Open

### Finding ID: BP-P2-002 - No documented branch/release/hotfix strategy

- Severity: P2 - Medium
- Confidence: High
- Area: Branch Strategy
- Evidence:
  - No docs for branching strategy, release branches, or hotfix process
  - Only `main` and `develop` branches used (from workflow triggers)
  - No evidence of `release/*`, `hotfix/*`, or `support/*` branches
- What is happening: The repository uses a basic Git Flow (main/develop) but has no documented process for when/how to create release branches, handle hotfixes, or manage LTS releases.
- Why it matters: Without a documented strategy, developers make ad-hoc decisions about branching, leading to inconsistency and potential deployment errors.
- User / business impact: Inconsistent release process, hotfix uncertainty.
- Recommended fix: Create `docs/BRANCHING_STRATEGY.md` documenting:
  - Branch naming conventions
  - When to create release branches
  - Hotfix process (branch from main, merge to main + develop)
  - Required checks per branch type
- Suggested validation: Team review of branching doc.
- Owner suggestion: Platform team
- Effort estimate: 2 hours
- Status: Open

### Finding ID: BP-P2-003 - CODEOWNERS requires GitHub teams that may be stale

- Severity: P2 - Medium
- Confidence: Medium
- Area: Review Governance
- Evidence:
  - `.github/CODEOWNERS` references 5 teams: `@mainecybertech/leads`, `@mainecybertech/backend`, `@mainecybertech/frontend`, `@mainecybertech/infrastructure`, `@mainecybertech/platform`
- What is happening: CODEOWNERS routes review requests to GitHub teams. Team membership is managed outside the repository and cannot be verified from repo evidence.
- Why it matters: If team membership is outdated (members left, teams renamed), PRs may be routed to the wrong people or require reviews from inactive members.
- User / business impact: Delayed or incorrect reviews.
- Recommended fix: Review team membership for each CODEOWNERS team. Add individual owner fallbacks for critical paths. Add a scheduled workflow to validate CODEOWNERS syntax.
- Suggested validation: `CODEOWNERS` validation workflow passes.
- Owner suggestion: Platform team
- Effort estimate: 1 hour
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| Unprotected branches | P1 | Low (current protection unknown) | High (direct push to main) | No codified protection | Codify in Terraform |
| Stale CODEOWNERS | P2 | Medium | Medium | Team references in codeowners | Review team membership |
| No hotfix process | P2 | Medium | Medium | No branching strategy doc | Create documentation |
| Inconsistent PRs | P2 | High | Low | No PR template | Add template |

## Recommendations

### Immediate / Release Blocking

1. Document current branch protection settings (BP-P1-001)

### This Week

2. Create `.github/PULL_REQUEST_TEMPLATE.md` (BP-P2-001)
3. Create `docs/BRANCHING_STRATEGY.md` (BP-P2-002)

### This Month

4. Codify branch protection as code using Terraform GitHub provider
5. Review CODEOWNERS team membership (BP-P2-003)

### Later / Platform Evolution

6. Add dev environment review gate to approve deployments
7. Implement automated release branch creation via workflow

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Create PR template | Consistent PRs | `.github/PULL_REQUEST_TEMPLATE.md` | New PR auto-populates |
| Create branching doc | Team alignment | `docs/BRANCHING_STRATEGY.md` | Team review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Codify branch protection | P1 | Infrastructure | 4 hours | Terraform + GitHub provider |
| PR template | P2 | Platform | 30 min | None |
| Branching strategy doc | P2 | Platform | 2 hours | None |
| CODEOWNERS review | P2 | Platform | 1 hour | Team list |
| Release workflow | P2 | Platform | 4 hours | Branching strategy |

## Suggested Tests

- GitHub Actions workflow that validates CODEOWNERS syntax
- Manual test: verify branch protection prevents direct push to main
- Verify PR template renders correctly on new PR

## Suggested Documentation Updates

- `docs/BRANCHING_STRATEGY.md` — new file with full branching model
- README update to reference PR template and required checks

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are there currently any branch protection rules on main/develop? | Determines current state | GitHub UI or API call |
| Who manages the GitHub teams referenced in CODEOWNERS? | Team membership freshness | GitHub org admin |
| What merge strategy is used (squash, merge commit, rebase)? | Affects linear history option | GitHub repo settings |

## Appendix

### Recommended Required Status Checks

Based on the 12 workflow files, the following should be configured as required status checks on `main` branch protection:

| Check name (from CI) | Workflow source | Priority |
|---------------------|-----------------|----------|
| test | test.yml | Required |
| lint | lint.yml | Required |
| typecheck | typecheck.yml | Required |
| dependency-review | dependency-review.yml | Required |
| e2e / e2e | e2e.yml | Required (when path matches) |
| chromatic / chromatic | chromatic.yml | Required (when path matches) |
| terraform-plan | terraform-do.yml | Required (when path matches) |

### Recommended Branch Protection Settings

| Setting | main | develop |
|---------|:----:|:-------:|
| Require pull request before merging | Yes | Yes |
| Require approvals | 1 | 1 |
| Dismiss stale reviews | Yes | Yes |
| Require review from CODEOWNERS | Yes | Yes |
| Require status checks | Yes (see above) | Yes (same) |
| Require conversation resolution | Yes | No |
| Require signed commits | No | No |
| Require linear history | Yes | No |
| Allow squash merging | Yes | Yes |
| Allow rebase merging | No | Yes |
| Allow merge commits | No | Yes |
| Allow force pushes | No | No |
| Allow deletions | No | No |
