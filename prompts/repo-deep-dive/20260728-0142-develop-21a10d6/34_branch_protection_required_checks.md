# Branch Protection and Required Checks Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Prefix:** BRANCH

## Executive Summary

**Grade: C (Needs Improvement).** Partial CI/CD gating exists (prod-approval, path filters, SHA-tagged images) but no formalized branch protection rules, no CODEOWNERS, no merge queue, no signed commits.

**11 findings** (3 P0, 5 P1, 3 P2)

## P0 Findings

### BRANCH-P0-001: No CODEOWNERS File

**Risk:** Any contributor can modify any code path without mandatory domain expert review.
**Recommendation:** Create `.github/CODEOWNERS` with team ownership per directory path.

### BRANCH-P0-002: No Required Status Checks on Branches

**Risk:** PRs can merge even if test/lint/typecheck/E2E fail.
**Recommendation:** Enable branch protection requiring validate and E2E workflow success.

### BRANCH-P0-003: Validate/E2E Not Integrated into Deploy Workflow

**Risk:** Docker images deployed before test results are known.
**Recommendation:** Add validate + E2E as predecessor jobs in `deploy-do.yml`.

## P1 Findings

- **BRANCH-P1-001:** No merge queue — concurrent PR merges can race
- **BRANCH-P1-002:** No signed commit enforcement
- **BRANCH-P1-003:** Deploy prod gate uses wrong environment (no approval for app deploys)
- **BRANCH-P1-004:** No deploy concurrency — concurrent pushes can race on droplet
- **BRANCH-P1-005:** Rollback documentation is stale (ECS/AWS references)

## P2 Findings

- **BRANCH-P2-001:** No enforced linear history
- **BRANCH-P2-002:** No stale branch deletion policy
- **BRANCH-P2-003:** 5 dead alignment/PR status workflows

## Recommended Required Checks

| Check                | Priority | Rationale                         |
| -------------------- | -------- | --------------------------------- |
| validate / test      | Required | Unit + integration tests          |
| validate / lint      | Required | ESLint compliance                 |
| validate / typecheck | Required | TypeScript type safety            |
| e2e                  | Required | Playwright E2E tests              |
| terraform-plan       | Required | IaC validation (when paths match) |
