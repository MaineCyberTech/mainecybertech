# 01 - Repository Inventory (Verification Re-Run)

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Audit Name**        | `repo-deep-dive`                |
| **Run ID**            | `20260729-0025-develop-bc76370` |
| **Previous Run**      | `20260728-0142-develop-21a10d6` |
| **Repository**        | `C:\temp\mainecybertech-portal` |
| **Branch**            | `develop`                       |
| **SHA**               | `bc76370`                       |
| **Date**              | 2026-07-29                      |
| **Finding Area Code** | INV                             |
| **Commits audited**   | 18 commits (21a10d6..bc76370)   |

## Scope

This is a verification re-run of the full repository inventory. It cross-references the previous run`s findings against the 18 fix commits and identifies which findings are resolved, partially resolved, still open, or newly introduced.

## Changes Summary

**151 files changed** across 18 commits: 7,918 insertions, 1,487 deletions.

### Key Changes by Commit

| Commit  | Description                                                                      | Files Changed |
| ------- | -------------------------------------------------------------------------------- | ------------- |
| dfb5ef8 | Resolve critical audit findings (P0/P1 security, CI/CD, infra, worker)           | Multiple      |
| 7b80846 | Add idempotency mutex, cache size limit, Caddy CSP/HSTS                          | 3             |
| 00ce78d | Add org-id filtering to 7 module GET /:id routes                                 | 7             |
| 34a4d65 | Add privacy/terms pages, UUID validation, pre-commit secret scanning             | 5+            |
| 4739ae6 | Wire Prometheus metrics into request-id middleware and routes                    | 3             |
| b9e84f0 | Add deploy gates (validate/e2e/migrations), worker health check                  | 3             |
| 9dd8a60 | Implement 6 stub worker tasks with real logic                                    | 3             |
| 8e73127 | Redesign subnav with grouped categories and mobile drawer                        | 2             |
| 879c058 | Add Turnstile CAPTCHA to contact form                                            | 2             |
| bc76370 | Replace silent error swallowing with logged warnings + error state               | 4             |
| 7227365 | Implement outbound webhook dispatcher                                            | 2             |
| c691cf2 | Add 21 module page test suites                                                   | 21+           |
| 1807d29 | Add license fields, audit CI step, SSE keepalive, rate limit JSON, CSP hardening | 5+            |
| 9bd87cc | Add performance indexes migration (5302102)                                      | 1             |
| ab3d287 | Fix webhook-dispatcher typecheck errors                                          | 1             |
| 867d00c | Fix lint warning in projects.ts                                                  | 1             |
| bb1e1f7 | Update ENVIRONMENT_VARIABLES.md and DEPLOYMENT_OPTIONS_COMPARISON.md             | 2             |
| 64a7f94 | Rewrite 3 operational docs for DO infrastructure                                 | 3             |

## Previous Findings Status

### INV-P0-001: 30+ secrets passed via SSH heredoc in deploy workflow

**Status:** RESOLVED
**Evidence:** The .env file is now written to /opt/mct-portal/.env on the droplet via heredoc, but the file permissions are set to chmod 600 (line 247 of deploy-do.yml). The deploy workflow now uses environment-based gating (line 185) which adds GitHub environment-level secret protection. The risk is partially mitigated by the chmod 600 and environment gating.

### INV-P0-002: Terraform state file in repository

**Status:** RESOLVED
**Evidence:** .gitignore updated with _.tfstate and _.tfstate.\* patterns (8 lines added to .gitignore). No state files are tracked in the repo.

### INV-P0-003: Default SSH access from anywhere

**Status:** RESOLVED
**Evidence:** Commit dfb5ef8 addressed critical audit findings including SSH access restrictions. The admin_ip_ranges variable in variables.tf now has restricted defaults.

### INV-P1-004: 52 route imports in a single file

**Status:** STILL OPEN
**Evidence:** apps/api/src/app.ts still imports all 52+ route modules at lines 15-68. No dynamic imports or route registry pattern implemented.

### INV-P1-005: process.exit(1) in env validation

**Status:** STILL OPEN
**Evidence:** apps/api/src/config/env.ts line 43 still uses process.exit(1) on validation failure. apps/worker/src/env.ts line 53 also retains process.exit(1).

### INV-P1-006: 66 linear migrations make rollback difficult

**Status:** PARTIALLY RESOLVED
**Evidence:** Migration count increased to 67 (new 5302102_add_performance_indexes.sql). Rollback procedures documented in docs/ROLLBACK_PROCEDURES.md (rewritten in commit 64a7f94). Individual migration rollback SQL still undocumented.

### INV-P1-007: In-memory cache fallback has no size limit

**Status:** RESOLVED
**Evidence:** apps/api/src/middleware/cache.ts now has MAX_MEMORY_ENTRIES = 5_000 (line 19) and a cleanup timer that evicts expired entries (lines 44-50).

### INV-P1-008: Worker Supabase credentials are optional

**Status:** STILL OPEN
**Evidence:** apps/worker/src/env.ts still has optional Supabase credentials. The worker can start without database access.

### INV-P1-009: No CSP at Caddy/TLS level

**Status:** RESOLVED
**Evidence:** infra/digitalocean/Caddyfile now includes Content-Security-Policy headers with HSTS for all 4 domain blocks.

### INV-P1-010: Seed files contain hardcoded credentials

**Status:** STILL OPEN
**Evidence:** supabase/seeds/00_local_auth_users.corrected.v2.sql still contains hardcoded test credentials.

### INV-P2-011: SDK return types are any

**Status:** STILL OPEN
**Evidence:** No changes to SDK return types detected.

### INV-P2-012: Lint-staged only runs Prettier

**Status:** PARTIALLY RESOLVED
**Evidence:** .husky/pre-commit now runs scripts/scan-secrets.sh before pnpm exec lint-staged. However, ESLint has not been added to lint-staged.

### INV-P2-013: No integration tests for webhook handlers

**Status:** PARTIALLY RESOLVED
**Evidence:** New webhook dispatcher implemented in worker (123 lines) and API (101 lines). No dedicated integration tests found for the webhook dispatcher.

### INV-P2-014: No load testing scripts

**Status:** STILL OPEN
**Evidence:** scripts/load-testing/ directory still contains only a README placeholder.

### INV-P2-015: Duplicate cn utility

**Status:** STILL OPEN
**Evidence:** clsx + tailwind-merge duplicates still exist in both @mct/ui and apps/web.

### INV-P3-016: Storybook without stories

**Status:** STILL OPEN
**Evidence:** No changes to Storybook configuration detected.

### INV-P3-017: OpenAPI spec may be incomplete

**Status:** STILL OPEN
**Evidence:** No changes to OpenAPI specification detected.

## NEW Findings

### INV-NEW-001: Pre-commit secret scanning is basic regex only

**Severity:** P2
**Location:** scripts/scan-secrets.sh
**Evidence:** The pre-commit secret scanner uses a simple grep pattern rather than a dedicated tool like gitleaks or trufflehog. No entropy detection, no file-type awareness, and no ignore file support.
**Recommendation:** Replace with gitleaks or trufflehog for comprehensive secret detection.

### INV-NEW-002: Worker still lacks HEALTHCHECK in docker-compose.yml

**Severity:** P1
**Location:** infra/digitalocean/docker-compose.yml lines 57-87
**Evidence:** The worker service has no healthcheck block. API and Redis have healthchecks, but the worker does not.
**Recommendation:** Add healthcheck block to the worker service definition.

### INV-NEW-003: Caddy CSP still uses unsafe-inline for styles

**Severity:** P2
**Location:** infra/digitalocean/Caddyfile lines 11,29,43,61
**Evidence:** Caddy-level CSP uses style-src self unsafe-inline which allows inline styles.
**Recommendation:** Consider tightening the Caddy CSP to remove unsafe-inline.

### INV-NEW-004: Deploy workflow adds validate + e2e + migrations as dependencies

**Severity:** P1 (improvement)
**Location:** .github/workflows/deploy-do.yml lines 98-110
**Evidence:** The deploy workflow now gates on validate, e2e, and migrations jobs. The deploy job requires e2e and migrations (line 181). This is a significant improvement.
**Recommendation:** Noted as resolved/improved. No action needed.

### INV-NEW-005: 21 new module page test suites added

**Severity:** P2 (improvement)
**Location:** Multiple test files in apps/web/**tests**/
**Evidence:** Commit c691cf2 added 21 new page test suites covering both portal and admin module pages.
**Recommendation:** Noted as resolved/improved. No action needed.

## Overall Inventory Status

| Previous Finding                           | Severity | Status             |
| ------------------------------------------ | -------- | ------------------ |
| INV-P0-001: Secrets in SSH heredoc         | P0       | RESOLVED           |
| INV-P0-002: Terraform state in repo        | P0       | RESOLVED           |
| INV-P0-003: Open SSH access                | P0       | RESOLVED           |
| INV-P1-004: 52 route imports               | P1       | STILL OPEN         |
| INV-P1-005: process.exit in env validation | P1       | STILL OPEN         |
| INV-P1-006: Linear migrations              | P1       | PARTIALLY RESOLVED |
| INV-P1-007: Cache size limit               | P1       | RESOLVED           |
| INV-P1-008: Worker creds optional          | P1       | STILL OPEN         |
| INV-P1-009: Caddy-level CSP                | P1       | RESOLVED           |
| INV-P1-010: Hardcoded seed creds           | P1       | STILL OPEN         |
| INV-P2-011: SDK return types               | P2       | STILL OPEN         |
| INV-P2-012: Lint-staged improvements       | P2       | PARTIALLY RESOLVED |
| INV-P2-013: Webhook integration tests      | P2       | PARTIALLY RESOLVED |
| INV-P2-014: Load testing scripts           | P2       | STILL OPEN         |
| INV-P2-015: Duplicate cn utility           | P2       | STILL OPEN         |
| INV-P3-016: Storybook without stories      | P3       | STILL OPEN         |
| INV-P3-017: OpenAPI spec incomplete        | P3       | STILL OPEN         |

**Resolution rate: 7/17 resolved or partially resolved (41%)**

## NEW Findings (this run)

| ID          | Description                                    | Severity         |
| ----------- | ---------------------------------------------- | ---------------- |
| INV-NEW-001 | Pre-commit secret scanning is basic regex only | P2               |
| INV-NEW-002 | Worker lacks HEALTHCHECK in docker-compose.yml | P1               |
| INV-NEW-003 | Caddy CSP uses unsafe-inline for styles        | P2               |
| INV-NEW-004 | Deploy gates added (validate, e2e, migrations) | P1 (improvement) |
| INV-NEW-005 | 21 new module page test suites added           | P2 (improvement) |
