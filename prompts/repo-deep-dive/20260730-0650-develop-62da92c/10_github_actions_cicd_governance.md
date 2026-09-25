# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: CI
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/10_github_actions_cicd_governance.md
- Scope limitations: Branch protection rules are GitHub UI-only (not in repo); no runtime access to verify secrets state.

## Scope

Reviewed all 12 workflow files in `.github/workflows/`, the `CODEOWNERS` file, Dependabot config, and related CI/CD documentation in `docs/`. Assessed PR validation gates, deployment safety, permissions, secrets handling, concurrency, caching, and governance controls.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `.github/workflows/test.yml` | Workflow | PR validation — unit tests | Gates push/PR to main/develop |
| `.github/workflows/lint.yml` | Workflow | PR validation — lint | Gates push/PR to main/develop |
| `.github/workflows/typecheck.yml` | Workflow | PR validation — typecheck | Gates push/PR to main/develop |
| `.github/workflows/e2e.yml` | Workflow | PR validation — E2E tests | workflow_call + push/PR triggers |
| `.github/workflows/validate.yml` | Workflow | Reusable validation gate | workflow_call — combines test+lint+typecheck |
| `.github/workflows/deploy-do.yml` | Workflow | Production deployment | Has prod-approval environment, SSH deploy |
| `.github/workflows/terraform-do.yml` | Workflow | Infrastructure deployment | Plan/apply with prod-approval gate |
| `.github/workflows/supabase-migrations.yml` | Workflow | DB migrations | workflow_call + push triggers |
| `.github/workflows/build-push.yml` | Workflow | Docker image build | Builds all 3 images on push |
| `.github/workflows/dependency-review.yml` | Workflow | Supply chain security | PR gate, fails on high severity |
| `.github/workflows/db-backup.yml` | Workflow | Scheduled backup | Cron + workflow_dispatch |
| `.github/workflows/chromatic.yml` | Workflow | UI visual testing | Storybook deploy on push |
| `.github/CODEOWNERS` | Config | Review governance | Teams-based ownership |
| `.github/dependabot.yml` | Config | Dependency automation | Weekly npm + GHA updates |
| `docs/ROLLBACK_PROCEDURES.md` | Doc | Operational guidance | Docker/Supabase/Terraform rollback |

## Executive Summary

The CI/CD system is mature and well-structured with 12 workflows covering build, test, lint, typecheck, E2E, dependency review, deployment (apps + infra + DB), and backup. Production deployments are gated through a `prod-approval` environment requiring manual approval. All deploy workflows use path filters to prevent unnecessary runs. Dependabot is configured for both npm dependencies and GitHub Actions. Actions are pinned to major versions but not to exact SHAs. A `pull_request_target` risk check is clean. The main gaps are: lack of image vulnerability scanning, no SBOM generation, no release workflow/tags, GitHub Actions not pinned to commit SHAs, and no PR template. Branch protection rules exist in GitHub UI (not in code) and their precise configuration cannot be verified from repo evidence.

### Strengths
- Comprehensive workflow inventory covering all phases (validate → build → deploy → backup)
- Production approval gate on deploy-do.yml (environment: `prod-approval`)
- Terraform prod apply gated through prod-approval environment
- Path filters on deploy workflows to avoid unnecessary runs
- Minimal `contents: read` default permissions on most workflows
- Dependabot with grouped updates for sentry/typescript-eslint/testing/aws-sdk
- E2E workflow callable from other workflows (`workflow_call`)
- Supabase migrations gated by environment (`dev` vs `prod`)
- Dependency review workflow fails on high-severity vulnerabilities
- Concurrency groups on deploy-do and build-push to cancel in-flight runs
- Health checks after deploy with retry logic (30 attempts, 4s sleep)
- CODEOWNERS mapped to teams (backend, frontend, infrastructure, platform, leads)

### Major Risks
- No container image vulnerability scanning in any workflow
- GitHub Actions pinned to major version tags (v3, v4) not commit SHAs — susceptible to tag-mutation supply chain attacks
- No release workflow — images pushed with SHA tags but no semantic releases or changelogs
- No PR template — inconsistent PR descriptions
- Branch protection rules not codified (GitHub UI only) — risk of drift
- Terraform state file (`terraform.tfstate`) committed to repo — leak of infrastructure metadata

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|--------------|------|-------|
| test.yml | `.github/workflows/test.yml` | Run unit tests | Implemented | Low | Node 20 matrix, frozen lockfile |
| lint.yml | `.github/workflows/lint.yml` | Run ESLint | Implemented | Low | Node 20, frozen lockfile |
| typecheck.yml | `.github/workflows/typecheck.yml` | Run tsc | Implemented | Low | Node 20 only |
| e2e.yml | `.github/workflows/e2e.yml` | Playwright E2E | Implemented | Medium | Starts Supabase + API + web |
| validate.yml | `.github/workflows/validate.yml` | Reusable gate | Implemented | Medium | workflow_call only |
| deploy-do.yml | `.github/workflows/deploy-do.yml` | Prod/dev deploy | Implemented | Medium | SSH root access, GHCR pull |
| terraform-do.yml | `.github/workflows/terraform-do.yml` | Infra deploy | Implemented | Medium | Plan posted to PR |
| supabase-migrations.yml | `.github/workflows/supabase-migrations.yml` | DB migrations | Implemented | Medium | Linked env project |
| build-push.yml | `.github/workflows/build-push.yml` | Docker build only | Implemented | Low | Duplicates deploy-do build |
| dependency-review.yml | `.github/workflows/dependency-review.yml` | License/vuln gate | Implemented | Medium | Only on PR |
| db-backup.yml | `.github/workflows/db-backup.yml` | Scheduled backup | Implemented | Medium | Uses supabase cli |
| chromatic.yml | `.github/workflows/chromatic.yml` | Storybook deploy | Implemented | Low | UI package changes only |
| CODEOWNERS | `.github/CODEOWNERS` | Review assignment | Implemented | Medium | Requires GitHub teams |
| Dependabot | `.github/dependabot.yml` | Auto-update deps | Implemented | Low | Weekly schedule |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| .github/workflows | 4 | 12 workflows covering all lifecycle phases | No release/changelog workflow | Add release workflow |
| PR validation | 4 | test+lint+typecheck on PR; dependency-review on PR; E2E on PR | No PR template | Add PR template |
| Lint/typecheck/test/build | 4 | Separate workflow files + validate.yml | None significant | Add coverage threshold gate |
| Deploy workflows | 4 | prod-approval gate, health checks, rollback support | No blue-green or canary | Document deployment strategy |
| Migration workflows | 4 | Env-gated, dry-run diff, workflow_call | None significant | Add migration revert plan to docs |
| Docker build/push | 3 | build-push.yml + inline in deploy-do.yml | Duplicate build logic; no image scanning | Add Trivy scan; deduplicate |
| Releases | 1 | No release workflow or tag creation | No semantic releases | Add release workflow |
| Badge/report generation | 1 | No status badges in README | No CI visibility on README | Add status badges |
| Secrets | 3 | GitHub Environment Secrets, SSH heredoc | Secrets also written to .env files on disk | Evaluate secrets manager |
| permissions blocks | 4 | Minimal `contents: read` on most workflows | `packages: write` on deploy/build workflows | OK for push workflows |
| OIDC | 1 | No OIDC configured | All auth via tokens/secrets | Evaluate OIDC for cloud access |
| Environment protection | 4 | prod-approval environment, dev/prod envs | No `required_reviewers` confirmed in code | Document env protection rules |

## Detailed Review

### Item: Deploy-do.yml workflow

- Evidence: `.github/workflows/deploy-do.yml` lines 1-300
- What it does: Builds 3 Docker images → pushes to GHCR → SSH to DO droplet → pulls images → runs docker compose up
- How it appears to work: Healthy. Multi-stage build, health checks, rollback-on-failure pattern, targeted image cleanup.
- Dependencies: GitHub token (packages:write), DO_API_TOKEN, CI_SSH_PRIVATE_KEY, 30+ environment secrets
- Current controls: Path filters, concurrency group, prod-approval environment, health check loop, rollback-on-failure
- Missing controls: No image vulnerability scan before deploy, no blue-green, SSH as root
- Risks: Root SSH key exposure, no image signing verification
- Recommended improvement: Add container scan step before deploy; switch to non-root deploy user
- Suggested tests: Deploy dry-run workflow, SSH connectivity test workflow

### Item: PR Validation Pipeline

- Evidence: test.yml, lint.yml, typecheck.yml, dependency-review.yml, e2e.yml
- What it does: Runs on every push/PR to main/develop — lints, typechecks, tests, and reviews dependencies
- How it appears to work: All workflows triggered by `pull_request` to main/develop with path filters
- Dependencies: pnpm, Node 20
- Current controls: Path filters prevent unnecessary runs; frozen lockfile; dependency-review fails on high
- Missing controls: No PR template, no minimum coverage gate, no PR title/label lint
- Risks: PRs can skip validation if path filters don't match changed files
- Recommended improvement: Add PR template (`PULL_REQUEST_TEMPLATE.md`), coverage threshold to test workflow
- Suggested tests: N/A (CI config, not app code)

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| CI-001 | PR validation gates | `.github/workflows/test.yml`, `lint.yml`, `typecheck.yml` | test+lint+typecheck on PR | No coverage gate | P2 | Add coverage threshold |
| CI-002 | Production deploy gate | deploy-do.yml:171 | prod-approval environment | Not in code-as-config | P2 | Document env approvals |
| CI-003 | Terraform prod apply | terraform-do.yml:118-155 | Gate via prod-approval | None | P1 (resolved) | — |
| CI-004 | Path filters | All deploy workflows | Prevent unnecessary runs | build-push.yml duplicates deploy-do | P2 | Merge build-push into deploy-do |
| CI-005 | Concurrency | deploy-do.yml:29-31, build-push.yml:16-18 | cancel-in-progress | Not on all workflows | P3 | Add to test/lint/typecheck |
| CI-006 | Action pinning | All workflows use @v3/@v4 etc. | Major version tags | Not pinned to commit SHAs | P1 | Pin actions to full SHAs |
| CI-007 | Container scanning | None | Missing | No image vuln scan anywhere | P1 | Add Trivy scan to build-push |
| CI-008 | PR template | None | Missing | No template for PRs | P2 | Add PULL_REQUEST_TEMPLATE.md |
| CI-009 | Branch protection in code | Not in repo | GitHub UI only | Cannot verify settings | P2 | Codify in Terraform or docs |
| CI-010 | Secrets in deploy | deploy-do.yml:200-233, 248-249 | SSH heredoc, not echoed | Secrets pass through shell env | P2 | Consider secrets vault |
| CI-011 | Secret rotation automation | `docs/SECRETS_ROTATION.md` | Documented | No scheduled reminder workflow | P2 | Create rotation reminder workflow |

## Findings

### Finding ID: CI-P1-001 - GitHub Actions not pinned to commit SHAs

- Severity: P1 - High
- Confidence: High
- Area: CI/CD Governance
- Evidence:
  - All workflow files in `.github/workflows/` use `@v3`, `@v4`, `@v6`, `@v1` version tags
  - Example: `actions/checkout@v4` (test.yml:35), `docker/login-action@v3` (deploy-do.yml:104), `docker/build-push-action@v6` (deploy-do.yml:110)
  - `hasicorp/setup-terraform@v3` (terraform-do.yml:34), `supabase/setup-cli@v1` (e2e.yml:58)
- What is happening: All GitHub Actions are referenced by major version tags, which are mutable. A tag can be force-pushed to point to a different commit.
- Why it matters: Tag mutation is a known supply chain attack vector. If an action maintainer's account is compromised or a tag is overwritten, malicious code can be injected into CI pipelines.
- User / business impact: CI pipeline compromise could lead to exfiltration of secrets, poisoning of build artifacts, or deployment of malicious containers.
- Security / privacy / reliability impact: High — supply chain attack surface.
- Recommended fix: Pin every action to its full commit SHA. Append a version comment for readability:
  ```yaml
  - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332 # v4.1.7
  ```
- Suggested validation: Create a CI workflow that checks all actions are pinned to SHAs.
- Owner suggestion: Infrastructure team
- Effort estimate: 2-3 hours across 12 workflow files (~200 action references)
- Dependencies: None
- Status: Open

### Finding ID: CI-P1-002 - No container image vulnerability scanning

- Severity: P1 - High
- Confidence: High
- Area: CI/CD Security
- Evidence:
  - All workflow files reviewed — no Trivy, Snyk, Grype, or Docker Scout step
  - `build-push.yml` pushes images but never scans them
  - `deploy-do.yml` pulls images on droplet but never scans
- What is happening: Docker images are built with known vulnerable base images (node:20-alpine has CVEs) and transitively vulnerable dependencies (js-yaml, sharp via pnpm audit), but no automated scanning catches these before deployment.
- Why it matters: Vulnerable containers in production expand the attack surface. Exploitable CVEs in base images or dependencies can be used in container escape or data access attacks.
- User / business impact: Production containers may contain exploitable vulnerabilities.
- Security / privacy / reliability impact: High — direct production attack surface.
- Recommended fix: Add Trivy scan step to `build-push.yml` after each image build:
  ```yaml
  - name: Scan API image
    uses: aquasecurity/trivy-action@master
    with:
      image-ref: ghcr.io/${{ env.REPO_LC }}/mct-api:${{ env.IMAGE_TAG }}
      format: sarif
      output: trivy-api.sarif
  ```
  Also add a scheduled full-scan workflow.
- Suggested validation: Verify Trivy scan catches `node:20-alpine` CVEs.
- Owner suggestion: Infrastructure team
- Effort estimate: 4 hours to add scanning to build-push and deploy workflows
- Dependencies: Trivy action
- Status: Open

### Finding ID: CI-P2-001 - No PR template

- Severity: P2 - Medium
- Confidence: High
- Area: CI/CD Governance
- Evidence:
  - No `.github/PULL_REQUEST_TEMPLATE.md` exists
  - Glob search confirmed no PR template files in `.github/`
- What is happening: PRs lack a standardized description template. This leads to inconsistent PR descriptions, missing context, and incomplete change documentation.
- Why it matters: PRs are the primary review artifact. A template ensures required context (testing done, deployment notes, related issues) is always included.
- User / business impact: Reduced review quality, harder to trace changes.
- Recommended fix: Create `.github/PULL_REQUEST_TEMPLATE.md` with sections for change description, testing notes, deployment considerations, and related issues.
- Suggested validation: New PRs auto-populate with the template.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-002 - Build-push.yml duplicates deploy-do.yml build logic

- Severity: P2 - Medium
- Confidence: High
- Area: CI/CD Efficiency
- Evidence:
  - `build-push.yml` lines 24-118: Builds all 3 Docker images
  - `deploy-do.yml` lines 98-164: Builds all 3 Docker images with nearly identical config
- What is happening: Two workflows independently build the same Docker images. This wastes CI minutes and means the images tested in `build-push` may not be the same ones deployed by `deploy-do`.
- Why it matters: Waste of CI resources (~50 minutes per run), potential drift between independently built images.
- User / business impact: Slower CI, higher GitHub Actions usage costs.
- Recommended fix: Make `build-push.yml` a reusable workflow (`workflow_call`) and have `deploy-do.yml` call it instead of duplicating build steps.
- Suggested validation: Deploy workflow uses the same image built by build-push.
- Owner suggestion: Infrastructure team
- Effort estimate: 2 hours
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-003 - No release workflow or semantic versioning

- Severity: P2 - Medium
- Confidence: High
- Area: CI/CD Release Management
- Evidence:
  - No release workflow in `.github/workflows/`
  - All images tagged with `${{ github.sha }}` (deploy-do.yml:27, build-push.yml)
  - No semantic version tags or GitHub Releases
  - No changelog generation
- What is happening: The CI pipeline builds and deploys images by commit SHA but has no mechanism for creating releases, semantic versioning, or changelog generation.
- Why it matters: Without releases, there's no way to track which version is deployed, no rollback target beyond git history, and no release notes for stakeholders.
- User / business impact: Harder to track deployments, difficult to communicate changes.
- Recommended fix: Create a release workflow that runs on tag pushes (v*), builds images with semver + SHA tags, creates GitHub Release with auto-generated changelog.
- Suggested validation: `git tag v1.0.0 && git push --tags` triggers release workflow.
- Owner suggestion: Platform team
- Effort estimate: 4 hours
- Dependencies: None
- Status: Open

### Finding ID: CI-P3-001 - Terraform state file committed to repository

- Severity: P3 - Low
- Confidence: High
- Area: CI/CD Hygiene
- Evidence:
  - `infra/terraform/digitalocean/terraform.tfstate` exists
  - `infra/terraform/digitalocean/terraform.tfstate.backup` exists
- What is happening: Terraform state files (which can contain plaintext secret values and infrastructure metadata) are committed to the repository.
- Why it matters: State files can expose resource IDs, IP addresses, and (in some configurations) secret values. They should never be committed.
- User / business impact: Low — DO resources are not highly sensitive, but best practice violation.
- Recommended fix: Add `*.tfstate*` to `.gitignore` for the terraform digitalocean directory.
- Suggested validation: Verify `.gitignore` prevents future state commits.
- Owner suggestion: Infrastructure team
- Effort estimate: 15 minutes
- Dependencies: Must ensure remote backend state is current before deleting local files.
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| Action tag mutation | P1 | Low (depends on action maintainer compromise) | High (CI pipeline compromise) | All workflows use @v3/@v4 tags | Pin actions to commit SHAs |
| Vulnerable images deployed | P1 | Medium (known CVEs in node:20-alpine) | High (production vulns) | No image scanning in any workflow | Add Trivy scan to build-push |
| PR bypass via path filters | P2 | Low (unlikely to exploit) | Medium (unvalidated code) | Path filters on all PR workflows | Document path filter risk |
| Terraform state in repo | P3 | Low | Low (exposed infrastructure data) | terraform.tfstate committed | Add to .gitignore |

## Recommendations

### Immediate / Release Blocking

1. Pin all GitHub Actions to commit SHAs (CI-P1-001)
2. Add container vulnerability scanning to `build-push.yml` (CI-P1-002)

### This Week

3. Add PR template (CI-P2-001)
4. Refactor `build-push.yml` to reusable workflow (CI-P2-002)
5. Add `*.tfstate*` to digitalocean `.gitignore` (CI-P3-001)

### This Month

6. Create release workflow with semantic versioning (CI-P2-003)
7. Add coverage threshold gate to `test.yml`
8. Create secret rotation reminder workflow (from SECRETS_ROTATION.md)

### Later / Platform Evolution

9. Evaluate OIDC for cloud provider authentication
10. Implement blue-green deployment strategy
11. Codify branch protection rules in Terraform

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Add .gitignore for terraform state | Prevent accidental secret exposure | `.gitignore` roots, `infra/terraform/digitalocean/.gitignore` | Verify git status shows no tfstate |
| Add PR template | Consistent PR descriptions | `.github/PULL_REQUEST_TEMPLATE.md` | New PR auto-populates |
| Add concurrency to test/lint/typecheck | Prevent redundant CI runs on rapid pushes | test.yml, lint.yml, typecheck.yml | Verify cancel-in-progress |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Pin actions to SHAs | P1 | Infrastructure | 2-3 hours | None |
| Container scanning | P1 | Infrastructure | 4 hours | Trivy action |
| PR template | P2 | Platform | 30 min | None |
| Consolidate build workflows | P2 | Infrastructure | 2 hours | None |
| Release workflow | P2 | Platform | 4 hours | None |
| Coverage gate | P2 | Platform | 1 hour | test.yml |
| Branch protection as code | P2 | Infrastructure | 4 hours | Terraform GitHub provider |
| Secret rotation reminder | P2 | Platform | 1 hour | New workflow file |

## Suggested Tests

- CI workflow that validates all actions are pinned to commit SHAs
- Deploy dry-run workflow (validate compose file without SSH)
- Test that build-push reusable workflow works when called from deploy-do

## Suggested Documentation Updates

- Create `docs/CI_CD_WORKFLOW_MAP.md` mapping workflows to their triggers, required checks, and environments
- Add PR template reference to contributing guide
- Document branch protection rules in `docs/branch_protection.md`

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are branch protection rules enforced on both main and develop? | Cannot verify from repo evidence alone | GitHub UI or Terraform config |
| What is the deploy-do rollback success rate? | SSH-based deploy can fail silently | Deploy run logs |
| Are there any unused GitHub secrets that need cleanup? | Attack surface for leaked secrets | GitHub UI → Settings → Secrets |

## Appendix

### Workflow Inventory

| Workflow | Trigger | PR Gate? | Deploy? | Path Filter |
|----------|---------|----------|---------|-------------|
| test.yml | push/PR main,develop | Yes | No | apps, packages, pnpm-lock, package.json |
| lint.yml | push/PR main,develop | Yes | No | apps, packages, pnpm-lock, package.json |
| typecheck.yml | push/PR main,develop | Yes | No | apps, packages, pnpm-lock, package.json |
| validate.yml | workflow_call | Yes (composite) | No | N/A (reusable) |
| e2e.yml | push/PR + workflow_call | Yes | No | e2e files, packages, supabase |
| dependency-review.yml | PR main,develop | Yes | No | All (no path filter) |
| chromatic.yml | push/PR main,develop | Yes | No | packages/ui |
| deploy-do.yml | push main,develop + workflow_dispatch | No | Yes | api, web, worker, packages, infra |
| terraform-do.yml | push/PR + workflow_dispatch | Plan only | Yes (apply) | infra/terraform |
| supabase-migrations.yml | push + workflow_call | No | Yes (DB) | supabase |
| build-push.yml | push main,develop | No | No | apps, packages, pnpm-lock |
| db-backup.yml | cron + workflow_dispatch | No | No | N/A |

### CI Gate Map

```
PR to main/develop
  ├── test (required)
  ├── lint (required)
  ├── typecheck (required)
  ├── dependency-review (required, fails on high)
  ├── e2e (required for e2e paths)
  └── chromatic (required for ui paths)

Push to develop
  ├── (same PR gates)
  ├── supabase-migrations dev
  ├── build-push (Docker images)
  └── deploy-do dev

Push to main
  ├── (same PR gates)
  ├── supabase-migrations prod (prod-approval)
  ├── terraform-do prod apply (prod-approval)
  └── deploy-do prod (prod-approval)
```
