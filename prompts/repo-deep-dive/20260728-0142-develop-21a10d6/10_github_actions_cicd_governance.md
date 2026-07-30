# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

| Field              | Value                               |
| ------------------ | ----------------------------------- |
| **Audit ID**       | `repo-deep-dive-10-cicd-governance` |
| **Run ID**         | `20260728-0142-develop-21a10d6`     |
| **Date**           | 2026-07-28                          |
| **Repository**     | `C:\temp\mainecybertech-portal`     |
| **Branch / SHA**   | develop / 21a10d6                   |
| **Finding Prefix** | CICD                                |

## Scope

All 15 workflow files, `dependabot.yml`, `turbo.json`, test configs, deployment configs.

## Evidence Reviewed

All 15 `.github/workflows/*.yml` files, `.github/dependabot.yml`, `turbo.json`, `playwright.config.ts`, all 4 jest configs, `infra/digitalocean/docker-compose.yml`, `docs/ROLLBACK_PROCEDURES.md`, `package.json`, `.husky/pre-commit`.

## Executive Summary

The MCT Portal CI/CD pipeline is **mature and well-structured** with 15 workflows covering validation, build, deploy, and infrastructure-as-code.

**Strengths:** Gated production deployment (prod-approval), comprehensive validation matrix (test+lint+typecheck), path-filtered triggers, SHA-tagged immutable images, concurrency control, environment-aware, health checks, pre-commit hooks, Dependabot configured.

**Critical Gaps (4 P0):**

1. E2E not integrated as a deploy gate
2. Supabase migrations not called before deployment
3. Validate gate not integrated into deploy workflow
4. Rollback documentation is ECS/AWS-stale, missing DO procedure

## Findings

### CICD-P0-001: E2E not integrated as a deploy gate

**Location:** `deploy-do.yml` line 163
**Description:** Deploy job only depends on setup + build jobs, not E2E. `e2e.yml` supports `workflow_call` but is never invoked.
**Risk:** Broken user flows can reach production undetected.
**Recommendation:** Add `e2e` as required `needs` dependency in deploy job.

### CICD-P0-002: Supabase migrations not called before deployment

**Location:** `deploy-do.yml` lines 162-164
**Description:** `supabase-migrations.yml` supports `workflow_call` but is never invoked by deploy.
**Risk:** Code deployed before schema changes are applied can fail or corrupt data.
**Recommendation:** Add migration execution as predecessor job in deploy-do.yml.

### CICD-P0-003: Validate gate not integrated into deploy workflow

**Location:** `deploy-do.yml` lines 94-160
**Description:** `validate.yml` is reusable `workflow_call` but deploy-do.yml build jobs don't depend on it.
**Risk:** Bad code pushed to GHCR as SHA-tagged images before validation fails.
**Recommendation:** Make validate a required predecessor for all build jobs.

### CICD-P0-004: Rollback documentation is ECS/AWS-stale

**Location:** `docs/ROLLBACK_PROCEDURES.md`
**Description:** Entire file references ECS, Vercel, AWS. No DO-based rollback procedure documented.
**Risk:** In an emergency, operators have no accurate rollback documentation.
**Recommendation:** Rewrite for DO Docker Compose deployment with automated and manual rollback steps.

### CICD-P1-001: 5 alignment/PR status workflows are dead code

**Location:** alignment-\*.yml (4) + pr-status.yml
**Evidence:** Reference hardcoded `dashboards/data/sample_data.json` with unrealistic data (p0=0). One workflow explicitly states "Alignment CLI not yet deployed."
**Recommendation:** Remove or gate behind `workflow_dispatch`.

### CICD-P1-002: No CODEOWNERS file or branch protection documentation

**Recommendation:** Create `.github/CODEOWNERS` and document required status checks.

### CICD-P1-003: Node.js 18 in engines but only 20.x tested in CI

**Recommendation:** Update engines to `>=20.0.0`.

### CICD-P1-004: No multi-node or blue/green deployment strategy

**Recommendation:** Implement blue/green with Docker Compose profiles.

### CICD-P2-001: Mutable env tags alongside SHA tags

**Location:** `build-push.yml`
**Recommendation:** Remove `ENV_TAG` mutable tags.

### CICD-P2-002: No concurrency control on deploy workflow

**Recommendation:** Add `concurrency` group to `deploy-do.yml`.

## Quick Wins

| #   | Action                                 | Effort | Impact                           |
| --- | -------------------------------------- | ------ | -------------------------------- |
| 1   | Add concurrency group to deploy-do.yml | 5 min  | Prevents concurrent deploy races |
| 2   | Update Node engines to >=20.0.0        | 1 min  | Aligns docs with CI              |
| 3   | Remove alignment/stale workflows       | 15 min | Saves runner-minutes per push    |
| 4   | Remove mutable ENV_TAG from build-push | 5 min  | Enforces immutable tagging       |
| 5   | Add CODEOWNERS file                    | 10 min | Path-based PR reviews            |
