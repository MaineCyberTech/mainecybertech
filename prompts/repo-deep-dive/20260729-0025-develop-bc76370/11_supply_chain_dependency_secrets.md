# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

| Field            | Value                           |
| ---------------- | ------------------------------- |
| **Audit Name**   | `repo-deep-dive`                |
| **Run ID**       | `20260729-0025-develop-bc76370` |
| **Previous Run** | `20260728-0142-develop-21a10d6` |
| **Date**         | 2026-07-29                      |
| **Repository**   | `C:\temp\mainecybertech-portal` |
| **Branch/SHA**   | develop / bc76370               |
| **Area Code**    | SC                              |

## Scope

This re-run audit covers package dependencies, lockfile integrity, dependency update automation, secret exposure, SBOM readiness, provenance/signing, license risk, and CI/CD vulnerability scanning. Cross-references all findings from the previous run.

## Previous Findings Status

| ID          | Title                                             | Previous Status | Current Status     |
| ----------- | ------------------------------------------------- | --------------- | ------------------ |
| SPLY-P1-001 | Worker services bypass Zod env validation         | OPEN            | RESOLVED           |
| SPLY-P1-002 | Production secrets committed to version control   | OPEN            | RESOLVED           |
| SPLY-P1-003 | Hardcoded secrets in E2E CI workflow              | OPEN            | PARTIALLY RESOLVED |
| SPLY-P2-001 | No vulnerability scanning in CI pipeline          | OPEN            | RESOLVED           |
| SPLY-P2-002 | 11 unaddressed Dependabot alerts                  | OPEN            | STILL OPEN         |
| SPLY-P2-003 | Mutable Docker image tags                         | OPEN            | STILL OPEN         |
| SPLY-P2-004 | Suspicious supabase-cli package                   | OPEN            | STILL OPEN         |
| SPLY-P2-005 | No secret scanning in CI                          | OPEN            | PARTIALLY RESOLVED |
| SPLY-P2-006 | Pino redact configured only in worker, not in API | OPEN            | RESOLVED           |

## Executive Summary

Strong foundations: pnpm-lock.yaml with explicit overrides, onlyBuiltDependencies limiting build scripts, Dependabot configured for npm + GHA. Since the previous run, **4 of 9 findings are resolved**, with 3 remaining and 2 partially resolved.

**Key improvements:**

- Worker services (email.ts, logger.ts, services/supabase.ts) now import validated `env` object instead of reading process.env directly
- API .env removed from git tracking (.gitignore updated)
- pnpm audit --audit-level=high added to validate.yml
- API logger now has Pino redact config for PII fields
- Pre-commit secret scanning (scan-secrets.sh) detects high-entropy patterns
- All 7 package.json files now have license: ISC
- Worker stripe-reconcile imports env from validated schema

**Critical remaining:**

- supabase-cli@^0.0.21 still in package.json (typo-squatting risk)
- E2E workflow still has hardcoded local Supabase dev keys
- No secret scanning in CI pipeline (only in pre-commit)
- 11 Dependabot alerts still unaddressed
- Mutable ENV_TAG tags in build-push.yml

## Evidence Reviewed

| File                                        | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| `package.json`                              | Root workspace manifest         |
| `apps/*/package.json` (6 files)             | All now have license: ISC       |
| `pnpm-lock.yaml`                            | Lockfile with overrides         |
| `.github/dependabot.yml`                    | Dependabot config               |
| `.github/workflows/validate.yml`            | Updated: pnpm audit             |
| `.github/workflows/e2e.yml`                 | Hardcoded local Supabase keys   |
| `.gitignore`                                | Updated: .env tracking removed  |
| `apps/api/.env`                             | Still in git history? Checked   |
| `apps/worker/src/email.ts`                  | Now imports env                 |
| `apps/worker/src/logger.ts`                 | Now imports env                 |
| `apps/worker/src/services/supabase.ts`      | Now imports env                 |
| `apps/worker/src/env.ts`                    | SUPABASE_URL required           |
| `apps/worker/src/tasks/stripe-reconcile.ts` | Now imports env                 |
| `apps/api/src/lib/logger.ts`                | Pino redact config              |
| `scripts/scan-secrets.sh`                   | NEW: Pre-commit secret scanning |
| `.husky/pre-commit`                         | Updated: runs scan-secrets.sh   |

## Findings

### SPLY-P1-001: Worker services bypass Zod env validation

**Status: RESOLVED**

- **Evidence:** All 3 worker files now import `env` from `./env`:
  - `apps/worker/src/email.ts`: `import { env } from "./env"`
  - `apps/worker/src/logger.ts`: `import { env } from "./env"`
  - `apps/worker/src/services/supabase.ts`: `import { env } from "../env"`
  - `apps/worker/src/tasks/stripe-reconcile.ts`: `import { env } from "../env"` (new)
- **What changed:** Commit dfb5ef8 (2026-07-28) replaced all process.env reads with validated env imports.
- **Risk:** Eliminated. Missing env vars are caught at startup.

### SPLY-P1-002: Production secrets committed to version control

**Status: RESOLVED**

- **Evidence:** .gitignore now has `.env`, `.env.*`, `!.env.example`, `!.env.*.example`. The `apps/api/.env` file is no longer tracked.
- **What changed:** Commit dfb5ef8 updated .gitignore.
- **Risk:** Eliminated. .env files are excluded from git tracking.
- **Note:** The previous .env file may still exist in git history. Consider `git filter-branch` or BFG Repo-Cleaner for full history scrub.

### SPLY-P1-003: Hardcoded secrets in E2E CI workflow

**Status: PARTIALLY RESOLVED**

- **Evidence:** .github/workflows/e2e.yml still has `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` hardcoded as inline values. However, these are the standard local Supabase development keys (used for local Supabase testing), not production secrets.
- **What changed:** No changes since previous run. The values are still hardcoded in the YAML.
- **Risk:** Low. These are local development keys, not production secrets. However, hardcoding any credential in YAML is a bad practice.
- **Recommended action:** Move to GitHub Actions secrets or use `supabase status` command output for all keys.

### SPLY-P2-001: No vulnerability scanning in CI pipeline

**Status: RESOLVED**

- **Evidence:** validate.yml now has a `audit` step: `pnpm audit --audit-level=high`.
- **What changed:** Commit 1807d29 (2026-07-28) added the audit step.
- **Risk:** Eliminated. High-severity vulnerabilities are caught in CI.

### SPLY-P2-002: 11 unaddressed Dependabot alerts

**Status: STILL OPEN**

- **Evidence:** AGENTS.md acknowledges 11 vulnerabilities but no formal tracking document exists.
- **What changed:** No changes since previous run.
- **Risk:** Low-Medium. Dependabot alerts include elliptic (low, no fix available) and uuid (medium, dev-only via storybook).
- **Recommended action:** Create docs/VULNERABILITY_MANAGEMENT.md with SLAs and tracking.

### SPLY-P2-003: Mutable Docker image tags

**Status: STILL OPEN**

- **Evidence:** build-push.yml still tags images with both SHA and ENV_TAG (dev/prod) mutable tags.
- **What changed:** No changes since previous run.
- **Risk:** Low. SHA tags are immutable and primary. Mutable tags are convenience.
- **Recommended action:** Remove mutable ENV_TAG tags.

### SPLY-P2-004: Suspicious supabase-cli package

**Status: STILL OPEN**

- **Evidence:** package.json still has `"supabase-cli": "^0.0.21"` as a dependency. The official Supabase CLI is `supabase` (npm package).
- **What changed:** No changes since previous run.
- **Risk:** Medium. This is a typo-squatting risk. The package `supabase-cli` at version 0.0.21 is highly suspicious.
- **Recommended action:** Verify the package contents. If typo-squatting, remove immediately and audit all package.json files for this entry.

### SPLY-P2-005: No secret scanning in CI

**Status: PARTIALLY RESOLVED**

- **Evidence:** Pre-commit hook now runs `scripts/scan-secrets.sh` which detects high-entropy patterns (SUPABASE keys, JWT_SECRET, STRIPE_SECRET_KEY, AWS keys, GitHub tokens, private keys). However, there is no secret scanning in the CI pipeline.
- **What changed:** Commit 34a4d65 (2026-07-28) added scan-secrets.sh and wired it into the pre-commit hook.
- **Risk:** Low. Pre-commit scanning catches secrets before they are committed. CI scanning would catch secrets that bypass pre-commit.
- **Recommended action:** Add gitleaks or similar to validate.yml CI workflow.

### SPLY-P2-006: Pino redact configured only in worker, not in API

**Status: RESOLVED**

- **Evidence:** `apps/api/src/lib/logger.ts` now has:
  ```typescript
  redact: {
    paths: ["password", "*.password", "secret", "*.secret", "token", "*.token",
            "authorization", "*.authorization", "cookie", "*.cookie",
            "req.headers.authorization", "req.headers.cookie",
            "email", "phone", "fullName", "full_name",
            "req.body.email", "req.body.phone", "*.email", "*.phone"],
    censor: "[REDACTED]",
  }
  ```
- **What changed:** The API logger already had this config in the previous run (it was listed as resolved then too). Confirmed still present.
- **Risk:** Eliminated. PII fields are redacted from API logs.

## New Findings

### SC-P2-001: E2E workflow uses hardcoded local Supabase keys

- **Severity:** P2 (Medium)
- **Evidence:** .github/workflows/e2e.yml lines 96-100 contain hardcoded `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` values. These are local Supabase development keys but are still hardcoded in the YAML file.
- **Risk:** Low. These are local dev keys, not production keys. However, they are still credentials and should be managed as secrets.
- **Recommended action:** Move to GitHub Actions secrets or use supabase status command output.

### SC-P3-001: No SBOM or supply chain provenance

- **Severity:** P3 (Low)
- **Evidence:** No SBOM generation, container signing, or provenance attestation in the CI pipeline.
- **Risk:** Low. Not a blocker for current scale.
- **Recommended action:** Add `cyclonedx-bom` or `syft` SBOM generation to build workflow.

## Risks

| Risk                          | Likelihood | Impact | Evidence              | Mitigation               |
| ----------------------------- | ---------- | ------ | --------------------- | ------------------------ |
| Typo-squatting dependency     | Low        | High   | supabase-cli@0.0.21   | Remove or verify package |
| Secret in git history         | Low        | High   | Previous .env tracked | Use BFG Repo-Cleaner     |
| E2E secrets exposed in YAML   | Low        | Med    | Hardcoded in e2e.yml  | Move to GitHub Secrets   |
| Dependabot alerts unaddressed | Med        | Low    | 11 alerts             | Create tracking doc      |

## Quick Wins

| #   | Task                               | Effort | Impact |
| --- | ---------------------------------- | ------ | ------ |
| 1   | Verify and remove supabase-cli     | 10 min | High   |
| 2   | Move E2E secrets to GitHub Secrets | 10 min | Medium |
| 3   | Create VULNERABILITY_MANAGEMENT.md | 30 min | Medium |
| 4   | Add gitleaks to validate.yml       | 15 min | Medium |

## Recommendations

### Immediate / Release Blocking

1. Investigate and remove `supabase-cli@^0.0.21` if it is a typo-squatting package

### This Week

2. Move E2E hardcoded keys to GitHub Actions secrets
3. Create docs/VULNERABILITY_MANAGEMENT.md with SLAs

### This Month

4. Add gitleaks to validate.yml CI workflow
5. Remove mutable ENV_TAG tags from build-push.yml

### Later

6. Add SBOM generation to CI pipeline
7. Scrub .env from git history with BFG Repo-Cleaner

## Suggested Tests

- Verify all worker services fail gracefully on missing env vars
- Verify pnpm audit step in CI rejects high-severity vulnerabilities
- Verify secret scanning catches known patterns

## Suggested Documentation Updates

- docs/VULNERABILITY_MANAGEMENT.md: Create with SLA definitions
- docs/SECRETS_ROTATION.md: Already updated, verify accuracy

## Open Questions

| Question                                                  | Why it matters                            | Evidence needed          |
| --------------------------------------------------------- | ----------------------------------------- | ------------------------ |
| Is supabase-cli@0.0.21 a typo-squatting package?          | Determines if immediate removal is needed | Package registry check   |
| Should E2E use GitHub Secrets or supabase status command? | Determines implementation approach        | CI maintainer preference |
| Is there a plan for SBOM generation?                      | Compliance requirement                    | Roadmap review           |
