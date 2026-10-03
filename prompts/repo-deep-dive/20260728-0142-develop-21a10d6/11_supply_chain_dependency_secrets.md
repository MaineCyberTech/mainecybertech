# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Audit Name**        | `repo-deep-dive`                |
| **Run ID**            | `20260728-0142-develop-21a10d6` |
| **Date**              | 2026-07-28                      |
| **Repository**        | `C:\temp\mainecybertech-portal` |
| **Branch / SHA**      | develop / 21a10d6               |
| **Finding Area Code** | SPLY                            |

## Scope

Package dependencies, lockfile integrity, dependency update automation, secret exposure, SBOM readiness, provenance/signing, license risk, CI/CD vulnerability scanning, Pino redact configuration.

## Evidence Reviewed

All 7 `package.json` files, `pnpm-lock.yaml`, `.github/dependabot.yml`, `.gitignore`, `.dockerignore`, all `.env`/`.env.example` files, `apps/api/src/config/env.ts`, `apps/worker/src/env.ts`, worker service files, `.github/workflows/` (secret handling), all Dockerfiles, `AGENTS.md`.

## Executive Summary

Strong foundations: `pnpm-lock.yaml` with explicit `pnpm.overrides` for critical packages, `onlyBuiltDependencies` limiting build scripts to `@sentry/cli`, Dependabot configured for npm + GHA.

**Critical gaps:**

1. `apps/api/.env` committed to git with `JWT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. E2E workflow hardcodes secrets in YAML
3. Worker services bypass Zod env validation (3 files read `process.env` directly)
4. No vulnerability scanning in CI
5. Suspicious `supabase-cli@0.0.21` package
6. No SBOM or supply chain provenance

**Risk Score: 6.5/10 (Moderate-High)**

## Findings

### SPLY-P1-001: Worker services bypass Zod env validation

**Location:** `apps/worker/src/email.ts`, `services/supabase.ts`, `logger.ts`
**Evidence:** These 3 files read `process.env.SMTP_HOST`, `SUPABASE_URL`, `LOG_LEVEL`, etc. directly instead of importing the validated `env` object.
**Risk:** Missing env vars won't be caught at startup; `supabase.ts` uses empty string fallback (`|| ""`) creating a Supabase client with empty URL.
**Recommendation:** Import `env` from `../env` in all three files.

### SPLY-P1-002: Production secrets committed to version control

**Location:** `apps/api/.env`
**Evidence:** File tracked in git containing `JWT_SECRET=e2e-test-secret`, valid `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` values.
**Recommendation:** `git rm --cached apps/api/.env`, verify `.gitignore`, rotate exposed values.

### SPLY-P1-003: Hardcoded secrets in E2E CI workflow

**Location:** `.github/workflows/e2e.yml` lines 96-100
**Evidence:** `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` hardcoded inline.
**Recommendation:** Move to GitHub Actions secrets.

### SPLY-P2-001: No vulnerability scanning in CI pipeline

**Location:** All 15 workflows
**Recommendation:** Add `pnpm audit --audit-level=high` to `validate.yml`.

### SPLY-P2-002: 11 unaddressed Dependabot alerts

**Location:** `AGENTS.md` — acknowledged but not formally tracked.
**Recommendation:** Create `docs/VULNERABILITY_MANAGEMENT.md` with SLAs.

### SPLY-P2-003: Mutable Docker image tags

**Location:** `build-push.yml` — `dev`/`prod` mutable tags alongside SHA tags.
**Recommendation:** Remove mutable tags.

### SPLY-P2-004: Suspicious `supabase-cli` package

**Location:** `package.json` — `supabase-cli: ^0.0.21`
**Evidence:** Official Supabase CLI is `supabase` (npm). `supabase-cli@0.0.21` is highly suspicious.
**Recommendation:** Verify and remove if typo-squatting.

### SPLY-P2-005: No secret scanning in CI

**Recommendation:** Add `gitleaks` to `validate.yml`.

### SPLY-P2-006: Pino redact configured only in worker, not in API

**Recommendation:** Add equivalent redact config to API logger.

## Quick Wins

| #   | Action                                             | Effort | Impact |
| --- | -------------------------------------------------- | ------ | ------ |
| 1   | `git rm --cached apps/api/.env`                    | 2 min  | High   |
| 2   | Replace `process.env` with `env` in 3 worker files | 15 min | High   |
| 3   | Move E2E secrets to GitHub Secrets                 | 10 min | High   |
| 4   | Add `pnpm audit` to `validate.yml`                 | 5 min  | Medium |
| 5   | Remove mutable tags from `build-push.yml`          | 5 min  | Medium |
| 6   | Verify and remove `supabase-cli`                   | 5 min  | Medium |
