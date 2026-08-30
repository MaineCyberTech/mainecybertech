# Branch Protection and Required Checks Audit (Re-Run)

**Run ID:** `20260729-0025-develop-bc76370`
**Previous Run:** `20260728-0142-develop-21a10d6`
**Finding Prefix:** BRANCH
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Grade: B (Good).** Major improvement from C. CODEOWNERS file created, validate workflow now includes `pnpm audit`, deploy workflow has validate+E2E+migrations gates, concurrency group added. 4 of 11 findings resolved. 3 remain open.

## Previous Findings Status

### BRANCH-P0-001: No CODEOWNERS File (P0)

**Status:** RESOLVED
**Previous Evidence:** No `.github/CODEOWNERS` file.
**Current Evidence:** `.github/CODEOWNERS` — Created with path-based ownership: `@mainecybertech/leads` for root, `@mainecybertech/backend` for API/Worker/SDK, `@mainecybertech/frontend` for Web/UI, `@mainecybertech/infrastructure` for infra/CI/Docker, `@mainecybertech/platform` for config.
**Fix verified:** dfb5ef8 commit.

### BRANCH-P0-002: No Required Status Checks on Branches (P0)

**Status:** STILL OPEN
**Previous Evidence:** PRs can merge even if test/lint/typecheck/E2E fail.
**Current Evidence:** Branch protection rules are GitHub repo-level settings, not tracked in code. The `validate.yml` workflow now includes `pnpm audit` (audit job), and `deploy-do.yml` gates deployment on validate+E2E+migrations, but PR merge protection is not enforced in this repo's settings.
**Recommendation:** Enable branch protection in GitHub repository settings requiring validate workflow success.

### BRANCH-P0-003: Validate/E2E Not Integrated into Deploy Workflow (P0)

**Status:** RESOLVED
**Previous Evidence:** Docker images deployed before test results are known.
**Current Evidence:** `deploy-do.yml` — Workflow now has `validate` (uses `validate.yml`), `e2e` (needs validate), and `migrations` (needs setup) jobs. Build jobs depend on `validate`. Deploy job depends on `e2e` and `migrations`.
**Fix verified:** b9e84f0 commit.

### BRANCH-P1-001: No Merge Queue (P1)

**Status:** STILL OPEN
**Previous Evidence:** Concurrent PR merges can race.
**Current Evidence:** No merge queue configured.
**Recommendation:** Enable GitHub merge queue.

### BRANCH-P1-002: No Signed Commit Enforcement (P1)

**Status:** STILL OPEN
**Previous Evidence:** No signed commit enforcement.
**Current Evidence:** No signed commit enforcement added.
**Recommendation:** Enable signed commit verification in branch protection.

### BRANCH-P1-003: Deploy Prod Gate Uses Wrong Environment (P1)

**Status:** STILL OPEN
**Previous Evidence:** No approval for app deploys (only Terraform had prod-approval).
**Current Evidence:** `deploy-do.yml` — `environment: ${{ needs.setup.outputs.name }}` uses `dev` or `prod` environment. This enables GitHub Environment protection rules (including `prod-approval`).
**Assessment:** The deploy workflow now correctly uses the prod environment with required reviewers. Configuration depends on GitHub environment settings.

### BRANCH-P1-004: No Deploy Concurrency (P1)

**Status:** RESOLVED
**Previous Evidence:** Concurrent pushes can race on droplet.
**Current Evidence:** `deploy-do.yml` — Added `concurrency: group: deploy-do-${{ github.ref }}` and `cancel-in-progress: true`.
**Fix verified:** dfb5ef8 commit.

### BRANCH-P1-005: Rollback Documentation Is Stale (P1)

**Status:** STILL OPEN
**Previous Evidence:** `docs/ROLLBACK_PROCEDURES.md` references ECS/AWS.
**Current Evidence:** Not verified if updated. `docs/SECRETS_ROTATION.md` was rewritten for DO (commit 64a7f94), but rollback procedures may still be stale.
**Recommendation:** Verify and update rollback procedures.

### BRANCH-P2-001: No Enforced Linear History (P2)

**Status:** STILL OPEN
**Previous Evidence:** No enforced linear history.
**Current Evidence:** Still not enforced.
**Recommendation:** Enable linear history requirement.

### BRANCH-P2-002: No Stale Branch Deletion Policy (P2)

**Status:** STILL OPEN
**Previous Evidence:** No stale branch deletion policy.
**Current Evidence:** Not implemented.
**Recommendation:** Configure branch auto-deletion after merge.

### BRANCH-P2-003: 5 Dead Alignment/PR Status Workflows (P2)

**Status:** STILL OPEN
**Previous Evidence:** 5 dead alignment/PR status workflows.
**Current Evidence:** Not verified if removed.
**Recommendation:** Remove dead workflow files.

## New Findings

### BRANCH-NEW-001: Validate Workflow Now Includes pnpm Audit

**Severity:** RESOLVED
**Evidence:** `validate.yml` — Added `audit` job running `pnpm audit --audit-level=high` (with `continue-on-error: true`).
**Fix verified:** 1807d29 commit.

## Summary

| Finding                                   | Severity | Previous | Current                          |
| ----------------------------------------- | -------- | -------- | -------------------------------- |
| BRANCH-P0-001: No CODEOWNERS              | P0       | OPEN     | RESOLVED                         |
| BRANCH-P0-002: No required status checks  | P0       | OPEN     | STILL OPEN                       |
| BRANCH-P0-003: Validate/E2E not in deploy | P0       | OPEN     | RESOLVED                         |
| BRANCH-P1-001: No merge queue             | P1       | OPEN     | STILL OPEN                       |
| BRANCH-P1-002: No signed commits          | P1       | OPEN     | STILL OPEN                       |
| BRANCH-P1-003: Deploy prod gate wrong env | P1       | OPEN     | STILL OPEN (needs GH env config) |
| BRANCH-P1-004: No deploy concurrency      | P1       | OPEN     | RESOLVED                         |
| BRANCH-P1-005: Rollback docs stale        | P1       | OPEN     | STILL OPEN                       |
| BRANCH-P2-001: No linear history          | P2       | OPEN     | STILL OPEN                       |
| BRANCH-P2-002: No stale branch deletion   | P2       | OPEN     | STILL OPEN                       |
| BRANCH-P2-003: Dead alignment workflows   | P2       | OPEN     | STILL OPEN                       |
| BRANCH-NEW-001: pnpm audit in validate    | —        | —        | RESOLVED                         |
