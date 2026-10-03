# Infrastructure, Deployment, and Environment Drift Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** INFRA

## Executive Summary

**16 findings** (3 CRITICAL, 4 HIGH, 6 MEDIUM, 3 LOW). Strong production stack with SHA-tagged images, health checks, and approval gates. Critical drift between Terraform code and actual state, stale documentation, and environment separation gaps.

## Critical Findings

### INFRA-CRIT-01: Terraform State File Committed to Git

**Evidence:** `terraform.tfstate` (318 lines) and `.backup` (315 lines) in repo. Contains SSH key fingerprints, VPC UUID, firewall IDs, Cloudflare zone IDs.
**Remediation:** Remove from git, add to `.gitignore`, migrate to DO Spaces backend.

### INFRA-CRIT-02: Terraform Backend Bucket/Key Drift

**Evidence:** `providers.tf` hardcodes `portal-terraform-state-development` bucket. `env/backend.dev.hcl` and `env/backend.prod.hcl` point to `portal-terraform-state` with different keys. CI runs `terraform init` without `-backend-config`, so dev and prod share state.
**Remediation:** Add `-backend-config=env/backend.${{ env }}.hcl` to CI.

### INFRA-CRIT-03: Terraform Version Mismatch

**Evidence:** CI pins `terraform_version: 1.9`. Applied state shows `terraform_version: 1.15.5`.
**Remediation:** Update CI to match applied version.

## High Findings

- **INFRA-HIGH-04:** Firewall port 2376 (Docker) open to world — not in code but in running state
- **INFRA-HIGH-05:** Redis password hardcoded as `mct-redis-dev` default
- **INFRA-HIGH-06:** SSH open to entire internet (`admin_ip_ranges` defaults to `0.0.0.0/0`)
- **INFRA-HIGH-07:** No memory reservations — 880MB mem_limit exceeds 512MB droplet RAM

## Medium Findings

- INFRA-MED-08: ROLLBACK_PROCEDURES.md is stale (ECS/Vercel)
- INFRA-MED-09: MONITORING_AND_ALERTING.md is stale (AWS)
- INFRA-MED-10: Cloud-init UFW conflicts with DO firewall
- INFRA-MED-11: Caddy `depends_on` lacks health check conditions
- INFRA-MED-12: `deploy.sh` is dead code
- INFRA-MED-13: No `-backend-config` in Terraform CI

## Env Var Gaps

- `REDIS_PASSWORD` NOT written to `.env` by deploy — hardcoded in docker-compose
- `APP_BASE_URL` NOT written to `.env` by deploy
- `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET` exist in API schema but not in docker-compose or deploy
