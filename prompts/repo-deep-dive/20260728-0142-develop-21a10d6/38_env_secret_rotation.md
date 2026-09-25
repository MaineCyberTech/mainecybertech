# Environment and Secret Rotation Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** ENV

## Executive Summary

Comprehensive env validation (Zod schemas for API and Worker), multi-secret JWT rotation, proper GitHub Environment scoping. Critical gaps: worker modules bypass Zod validation, rotation docs reference dead AWS infrastructure, missing webhook secrets in docs matrix.

**Findings: 22 total (1 CRITICAL, 4 HIGH, 11 MEDIUM, 4 LOW, 3 PASS)**

## Critical Finding

### ENV-008: Worker Critical Modules Bypass Zod Validation

**Severity:** CRITICAL
**Evidence:** `services/supabase.ts` reads `process.env.SUPABASE_URL || ""`; `email.ts` reads all SMTP vars from `process.env` directly. Both bypass the validated `env` object from `env.ts`.
**Risk:** Missing env vars not caught at startup. Broken Supabase client created with empty URL.
**Recommendation:** Import `env` from `../env` in both files.

## High Findings

### ENV-006/ENV-007: Worker services/supabase.ts and email.ts process.env Bypass

**Severity:** HIGH
**Same as ENV-008** — worker starts without failing validation, then silently fails at runtime.

### ENV-009: SECRETS_ROTATION.md References Dead AWS Infrastructure

**Severity:** HIGH
**Evidence:** 19 references to AWS SSM/ECS throughout. No GitHub Secrets + DigitalOcean procedures.
**Recommendation:** Rewrite for current deployment model.

### ENV-020: Emergency Revocation Procedure References Dead Infrastructure

**Severity:** HIGH
**Evidence:** References SSM update and ECS redeployment.
**Recommendation:** Update to GitHub Secret → deploy workflow → SSH .env rewrite.

## Medium Findings

- ENV-001: 3 webhook secrets missing from `ENVIRONMENT_VARIABLES.md`
- ENV-002: `REDIS_URL` missing from API `.env.example` and docs
- ENV-003: `JWT_SECRET` documented as optional but schema requires it
- ENV-005: Worker Supabase credentials marked optional but required at runtime
- ENV-012: `JWT_EXPIRY` documented but doesn't exist in any schema
- ENV-018: `REDIS_PASSWORD` default hardcoded in 6 docker-compose locations
- ENV-022: Secrets matrix missing 5 secrets

## Quick Wins

1. Fix worker `services/supabase.ts` and `email.ts` to use validated `env` (30 min)
2. Add missing webhook secrets to docs/matrix (30 min)
3. Fix `JWT_EXPIRY` doc reference (10 min)
4. Add `REDIS_URL` to `.env.example` (5 min)
