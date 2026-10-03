# Environment and Secret Rotation Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** ENV
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Risk Score: 15/100 (Very Low).** Major improvement. The critical finding about worker modules bypassing Zod validation is fully resolved. SECRETS_ROTATION.md completely rewritten for DO infrastructure with 40 secrets. ENVIRONMENT_VARIABLES.md updated with webhook secrets, REDIS_URL, JWT_SECRET as required. 10 of 22 findings resolved. 4 remain open.

## Previous Findings Status

### ENV-008: Worker Critical Modules Bypass Zod Validation (CRITICAL)

**Status:** RESOLVED
**Previous Evidence:** services/supabase.ts reads process.env.SUPABASE_URL || ""; email.ts reads all SMTP vars from process.env directly.
**Current Evidence:**

- pps/worker/src/services/supabase.ts:2 — Now imports { env } from "../env" and uses env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY.
- pps/worker/src/email.ts:2 — Now imports { env } from "./env" and uses env.SMTP_HOST, env.SMTP_PORT, env.SMTP_USER, env.SMTP_PASS, env.EMAIL_FROM.
- pps/worker/src/logger.ts:2 — Now imports { env } from "./env" and uses env.LOG_LEVEL.
  **Fix verified:** dfb5ef8 commit.

### ENV-006/ENV-007: Worker services/supabase.ts and email.ts process.env Bypass (HIGH)

**Status:** RESOLVED
**Same as ENV-008** — All three files now import validated env object.

### ENV-009: SECRETS_ROTATION.md References Dead AWS Infrastructure (HIGH)

**Status:** RESOLVED
**Previous Evidence:** 19 references to AWS SSM/ECS throughout.
**Current Evidence:** docs/SECRETS_ROTATION.md — Completely rewritten for DO infrastructure. 40 secrets documented with rotation frequencies, sources, and procedures. JWT zero-downtime multi-secret rotation documented. GitHub Secrets + DO droplet deployment model. Reviewed in commit 64a7f94.
**Fix verified:** 64a7f94 commit.

### ENV-020: Emergency Revocation Procedure References Dead Infrastructure (HIGH)

**Status:** RESOLVED
**Previous Evidence:** References SSM update and ECS redeployment.
**Current Evidence:** docs/SECRETS_ROTATION.md — Emergency rotation section now documents GitHub Secret -> deploy workflow -> SSH .env rewrite model with specific gh secret set and gh workflow run commands.
**Fix verified:** 64a7f94 commit.

### ENV-001: 3 Webhook Secrets Missing from ENVIRONMENT_VARIABLES.md (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** Missing JIRA_WEBHOOK_SECRET, JSM_WEBHOOK_SECRET, M365_WEBHOOK_SECRET.
**Current Evidence:** docs/ENVIRONMENT_VARIABLES.md — Now lists JIRA_WEBHOOK_SECRET, JSM_WEBHOOK_SECRET, M365_WEBHOOK_SECRET in the API section.
**Fix verified:** bb1e1f7 commit.

### ENV-002: REDIS_URL Missing from API .env.example and Docs (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** REDIS_URL missing from docs.
**Current Evidence:** docs/ENVIRONMENT_VARIABLES.md — API section now includes REDIS_URL with description "Redis URL for caching, idempotency, and BullMQ (required in production)".
**Fix verified:** bb1e1f7 commit.

### ENV-003: JWT_SECRET Documented as Optional But Schema Requires It (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** JWT_SECRET documented as optional but schema requires it.
**Current Evidence:** docs/ENVIRONMENT_VARIABLES.md — JWT_SECRET now marked as "Yes" for Required, with description "JWT signing secret (required; multi-secret rotation via comma-separated values)".
**Fix verified:** bb1e1f7 commit.

### ENV-005: Worker Supabase Credentials Marked Optional But Required at Runtime (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY marked as optional in docs.
**Current Evidence:** docs/ENVIRONMENT_VARIABLES.md — Worker section now marks SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY as "Yes" for Required. Worker env schema (pps/worker/src/env.ts:14-16) uses .min(1) validation.
**Fix verified:** dfb5ef8 (schema) + bb1e1f7 (docs).

### ENV-012: JWT_EXPIRY Documented But Doesn't Exist in Any Schema (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** JWT_EXPIRY documented but doesn't exist in any schema.
**Current Evidence:** Still not in any env schema. Mentioned in docs/SECRETS_ROTATION.md as "default 24h".
**Recommendation:** Either add JWT_EXPIRY to API env schema, or remove all doc references.

### ENV-018: REDIS_PASSWORD Default Hardcoded in 6 docker-compose Locations (MEDIUM)

**Status:** STILL OPEN
**Evidence:** infra/digitalocean/docker-compose.yml — Still has mct-redis-dev default in 6 locations (redis command, redis healthcheck, api REDIS_URL, api REDIS_PASSWORD, worker REDIS_URL, worker REDIS_PASSWORD).
**Recommendation:** Load from env file only, no default value.

### ENV-022: Secrets Matrix Missing 5 Secrets (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** Secrets matrix missing 5 secrets.
**Current Evidence:** docs/SECRETS_ROTATION.md — Now lists 40 secrets with rotation frequencies, sources, and procedures. Comprehensively covers all secrets used by API, Worker, Web, deploy, and Terraform workflows.
**Fix verified:** 64a7f94 commit.

## New Findings

### ENV-NEW-001: Worker Env Schema Now Validates at Startup

**Severity:** RESOLVED
**Evidence:** pps/worker/src/env.ts:44-49 — parseEnv(process.env) called at module load. On failure, logs error and calls process.exit(1). This prevents the worker from starting with invalid/missing env vars.
**Fix verified:** dfb5ef8 commit.

### ENV-NEW-002: Deploy Workflow Writes All Env Vars via SSH Heredoc

**Severity:** RESOLVED
**Evidence:** deploy-do.yml:214-247 — 20+ env vars written to /opt/mct-portal/.env via SSH heredoc. Secrets not exposed in logs. File permissions set to 600.
**Fix verified:** dfb5ef8 commit.

## Summary

| Finding                                        | Severity | Previous | Current    |
| ---------------------------------------------- | -------- | -------- | ---------- |
| ENV-008: Worker modules bypass Zod validation  | CRITICAL | OPEN     | RESOLVED   |
| ENV-006/007: Worker supabase/email bypass      | HIGH     | OPEN     | RESOLVED   |
| ENV-009: SECRETS_ROTATION.md dead AWS refs     | HIGH     | OPEN     | RESOLVED   |
| ENV-020: Emergency revocation dead infra refs  | HIGH     | OPEN     | RESOLVED   |
| ENV-001: Webhook secrets missing from docs     | MEDIUM   | OPEN     | RESOLVED   |
| ENV-002: REDIS_URL missing from docs           | MEDIUM   | OPEN     | RESOLVED   |
| ENV-003: JWT_SECRET documented as optional     | MEDIUM   | OPEN     | RESOLVED   |
| ENV-005: Worker Supabase creds marked optional | MEDIUM   | OPEN     | RESOLVED   |
| ENV-012: JWT_EXPIRY doesn't exist in schema    | MEDIUM   | OPEN     | STILL OPEN |
| ENV-018: REDIS_PASSWORD hardcoded defaults     | MEDIUM   | OPEN     | STILL OPEN |
| ENV-022: Secrets matrix missing 5 secrets      | MEDIUM   | OPEN     | RESOLVED   |
| ENV-NEW-001: Worker env validates at startup   | —        | —        | RESOLVED   |
| ENV-NEW-002: Deploy writes env via SSH heredoc | —        | —        | RESOLVED   |
