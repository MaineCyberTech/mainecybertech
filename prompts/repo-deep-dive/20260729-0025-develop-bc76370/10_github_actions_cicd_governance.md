# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

| Field            | Value                           |
| ---------------- | ------------------------------- |
| **Audit Name**   | `repo-deep-dive`                |
| **Run ID**       | `20260729-0025-develop-bc76370` |
| **Previous Run** | `20260728-0142-develop-21a10d6` |
| **Date**         | 2026-07-29                      |
| **Repository**   | `C:\temp\mainecybertech-portal` |
| **Branch/SHA**   | develop / bc76370               |
| **Area Code**    | CI                              |

## Scope

This re-run audit covers all 17 workflow files, dependabot.yml, turbo.json, deployment configs, and governance controls. Cross-references all findings from the previous run.

## Previous Findings Status

| ID          | Title                                         | Previous Status | Current Status |
| ----------- | --------------------------------------------- | --------------- | -------------- |
| CICD-P0-001 | E2E not integrated as deploy gate             | OPEN            | RESOLVED       |
| CICD-P0-002 | Supabase migrations not called before deploy  | OPEN            | RESOLVED       |
| CICD-P0-003 | Validate gate not integrated into deploy      | OPEN            | RESOLVED       |
| CICD-P0-004 | Rollback documentation is ECS/AWS-stale       | OPEN            | RESOLVED       |
| CICD-P1-001 | 5 alignment/PR status workflows are dead code | OPEN            | STILL OPEN     |
| CICD-P1-002 | No CODEOWNERS file or branch protection       | OPEN            | RESOLVED       |
| CICD-P1-003 | Node.js 18 in engines but only 20.x tested    | OPEN            | STILL OPEN     |
| CICD-P1-004 | No multi-node or blue/green deployment        | OPEN            | STILL OPEN     |
| CICD-P2-001 | Mutable env tags alongside SHA tags           | OPEN            | STILL OPEN     |
| CICD-P2-002 | No concurrency control on deploy workflow     | OPEN            | RESOLVED       |

## Executive Summary

The MCT Portal CI/CD pipeline is **mature and well-structured** with 17 workflow files. Since the previous run, **6 of 10 findings are resolved**, including all 4 P0 critical findings.

**Major improvements:**

- Deploy pipeline now fully gated: setup -> validate -> (build + e2e + migrations) -> deploy
- Rollback documentation rewritten for DO Docker Compose (not ECS/AWS)
- CODEOWNERS file created with path-based ownership
- Concurrency group added to prevent parallel deploy races
- Worker health check added after deploy
- db-backup.yml daily cron workflow added

**Remaining gaps (4):**

- 5 alignment/PR status workflows still dead code
- Node engines still >=18.0.0 (CI tests 20.x only)
- Mutable ENV_TAG tags in build-push.yml
- No blue/green deployment strategy

## Evidence Reviewed

| File                                          | Purpose                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `.github/workflows/deploy-do.yml`             | Updated: validate+e2e+migrations gates, concurrency, worker health check |
| `.github/workflows/validate.yml`              | Updated: pnpm audit step                                                 |
| `.github/workflows/build-push.yml`            | Still has mutable ENV_TAG tags                                           |
| `.github/workflows/e2e.yml`                   | E2E workflow (callable)                                                  |
| `.github/workflows/supabase-migrations.yml`   | Migration workflow (callable)                                            |
| `.github/workflows/db-backup.yml`             | NEW: Daily database backup                                               |
| `.github/workflows/alignment-*.yml` (4 files) | Still dead code                                                          |
| `.github/workflows/pr-status.yml`             | Still dead code                                                          |
| `.github/CODEOWNERS`                          | NEW: Path-based ownership                                                |
| `docs/ROLLBACK_PROCEDURES.md`                 | Updated: DO-specific procedures                                          |
| `.husky/pre-commit`                           | Updated: secret scanning                                                 |

## Findings

### CICD-P0-001: E2E not integrated as deploy gate

**Status: RESOLVED**

- **Evidence:** deploy-do.yml deploy job now has e2e and migrations as required predecessors.
- **What changed:** Commit b9e84f0 (2026-07-28) wired E2E as a required predecessor.
- **Risk:** Eliminated.

### CICD-P0-002: Supabase migrations not called before deployment

**Status: RESOLVED**

- **Evidence:** deploy-do.yml now includes migrations as a required predecessor job.
- **What changed:** Commit b9e84f0 added migrations as a callable workflow dependency.
- **Risk:** Eliminated. Schema changes are applied before code deployment.

### CICD-P0-003: Validate gate not integrated into deploy workflow

**Status: RESOLVED**

- **Evidence:** All build jobs now depend on validate.
- **What changed:** Commit b9e84f0 made validate a required predecessor for all build jobs.
- **Risk:** Eliminated. Bad code cannot reach GHCR before validation.

### CICD-P0-004: Rollback documentation is ECS/AWS-stale

**Status: RESOLVED**

- **Evidence:** docs/ROLLBACK_PROCEDURES.md now covers DO Docker Compose rollback with automated (workflow_dispatch) and manual (SSH) procedures.
- **What changed:** Commit 64a7f94 (2026-07-28) rewrote the entire rollback document for DO infrastructure.
- **Risk:** Eliminated. Operators have accurate rollback documentation.

### CICD-P1-001: 5 alignment/PR status workflows are dead code

**Status: STILL OPEN**

- **Evidence:** 4 alignment workflows (alignment-badges.yml, alignment-engine.yml, alignment-full.yml, alignment-pr-comment.yml) and pr-status.yml still exist in .github/workflows/. They reference hardcoded data and are not used.
- **What changed:** No changes since previous run. These files remain.
- **Risk:** Low. Wastes runner minutes on push. Misleading to new developers.
- **Recommended action:** Remove or gate behind workflow_dispatch.

### CICD-P1-002: No CODEOWNERS file or branch protection documentation

**Status: RESOLVED**

- **Evidence:** .github/CODEOWNERS file exists (1,115 bytes) with path-based ownership rules.
- **What changed:** Commit dfb5ef8 (2026-07-28) created the CODEOWNERS file.
- **Risk:** Eliminated. PRs now automatically request appropriate reviewers.

### CICD-P1-003: Node.js 18 in engines but only 20.x tested in CI

**Status: STILL OPEN**

- **Evidence:** package.json still has engines.node >=18.0.0. CI workflows use Node 20.x only.
- **What changed:** No changes since previous run.
- **Risk:** Low. Node 18 EOL is October 2025 (already past). Should be updated to >=20.0.0.
- **Recommended action:** Update engines to >=20.0.0.

### CICD-P1-004: No multi-node or blue/green deployment strategy

**Status: STILL OPEN**

- **Evidence:** Single DO droplet deployment. No blue/green or multi-node strategy.
- **What changed:** No changes since previous run.
- **Risk:** Low. Acceptable for current scale.
- **Recommended action:** Implement blue/green with Docker Compose profiles when multi-node is needed.

### CICD-P2-001: Mutable env tags alongside SHA tags

**Status: STILL OPEN**

- **Evidence:** build-push.yml still tags images with both SHA and ENV_TAG (dev/prod) mutable tags.
- **What changed:** No changes since previous run.
- **Risk:** Low. SHA tags are primary identifier. Mutable tags are convenience.
- **Recommended action:** Remove mutable ENV_TAG tags to enforce immutable tagging.

### CICD-P2-002: No concurrency control on deploy workflow

**Status: RESOLVED**

- **Evidence:** deploy-do.yml now has concurrency group with cancel-in-progress.
- **What changed:** Commit dfb5ef8 (2026-07-28) added the concurrency group.
- **Risk:** Eliminated. Parallel deploys are prevented.

## New Findings

### CI-P2-003: Worker health check uses SSH but no content validation

- **Severity:** P2 (Medium)
- **Evidence:** deploy-do.yml added a Worker health check step after deploy, but it runs via SSH wget to the internal port. There is no validation of the response body content.
- **Risk:** Low. Non-responsive worker will fail, but a degraded worker returning 200 with wrong content would pass.
- **Recommended action:** Validate health check response body content.

### CI-P3-001: db-backup.yml has no failure notification

- **Severity:** P3 (Low)
- **Evidence:** db-backup.yml (daily cron) runs supabase db dump but has no failure notification mechanism.
- **Risk:** Low. Backup failures would go unnoticed until next manual check.
- **Recommended action:** Add Slack/Teams notification on backup failure.

## Quick Wins

| #   | Task                                   | Effort | Impact |
| --- | -------------------------------------- | ------ | ------ |
| 1   | Remove alignment/stale workflows       | 15 min | Medium |
| 2   | Update Node engines to >=20.0.0        | 1 min  | Low    |
| 3   | Remove mutable ENV_TAG from build-push | 5 min  | Low    |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Remove 5 dead alignment/PR status workflows
2. Update Node engines to >=20.0.0

### This Month

3. Remove mutable ENV_TAG tags from build-push.yml
4. Add failure notification to db-backup.yml

### Later

5. Implement blue/green deployment strategy
6. Add health check response body validation

## Suggested Tests

- E2E: Verify deploy gate sequence (validate -> build -> e2e -> migrations -> deploy)
- Unit: Validate rollback workflow logic

## Suggested Documentation Updates

- docs/BRANCH_PROTECTION.md: Create with required status checks documentation
- docs/ROLLBACK_PROCEDURES.md: Already updated, verify accuracy

## Open Questions

| Question                                                        | Why it matters               | Evidence needed |
| --------------------------------------------------------------- | ---------------------------- | --------------- |
| Are the alignment workflows actually used by any external tool? | Determines if safe to delete | Ask team        |
| Should db-backup.yml push to S3 or local droplet storage?       | Determines restore procedure | Storage review  |
