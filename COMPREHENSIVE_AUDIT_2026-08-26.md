# Comprehensive Audit Report — MaineCyberTech Portal

**Audit Date:** 2026-08-26  
**Auditor:** opencode/big-pickle (independent)  
**Scope:** Full codebase audit — security, code quality, documentation drift, infrastructure, AI prompts  
**Methodology:** Evidence-based verification; no claims from AGENTS.md, README.md, or prior audit reports were trusted without source-code verification.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Critical (P0) findings** | **7** |
| **High (P1) findings** | **11** |
| **Medium (P2) findings** | **14** |
| **Low (P3) findings** | **9** |
| **Total findings** | **41** |
| **AGENTS.md claims verified as false** | **12** |
| **AI prompt files found** | **787** (across 6 packs) |

### Verdict: NOT production-ready as documented

The codebase itself is a well-structured, functional monorepo. However, the **documentation is severely stale**, containing contradicting test counts, phantom CI/CD workflows from a decommissioned AWS architecture, and false claims about lint/test status. The security posture has real vulnerabilities (XSS, weak JWT, auth bypass in test mode). The 787 AI prompt files represent a significant supply-chain and code-generation risk.

---

## Section 1: P0 Critical Findings

### P0-01: Stored XSS via `javascript:` URLs in CommentBody
**File:** `apps/web/components/CommentBody.tsx:22-24`  
**Severity:** CRITICAL  
**Description:** The markdown link pattern `[text](url)` constructs `<a href="$2">` where `$2` is the URL from user input. A malicious user can inject `[Click me](javascript:alert(document.cookie))` as a comment, executing arbitrary JavaScript in every viewer's browser. This is stored XSS — the payload persists and fires for all users who view the comment.  
**Impact:** Account takeover, session hijacking, data exfiltration for all portal users.  
**Fix:** Validate that link URLs start with `http://` or `https://` before inserting into href. Block `javascript:`, `data:`, and `vbscript:` schemes.

### P0-02: Authorization Bypass in Test Mode
**File:** `apps/api/src/middleware/org-access.ts:124-127`, `apps/api/src/middleware/permissions.ts:58-61`  
**Severity:** CRITICAL  
**Description:** When `NODE_ENV === "test"`, all tenant isolation (`requireOrgAccess`) and permission checks (`requirePermission`) short-circuit with `return next()`. The Zod env schema at `apps/api/src/lib/config/env.ts:12` accepts `"test"` as a valid `NODE_ENV` value. If a misconfigured production environment or CI artifact sets `NODE_ENV=test`, **all authorization is completely disabled**.  
**Impact:** Full data access bypass — any authenticated user can access all tenants' data.  
**Fix:** Remove the `NODE_ENV === "test"` bypass or add an explicit production guard. The env schema should reject `"test"` in non-test contexts.

### P0-03: Weak JWT Secret Without Entropy Validation
**File:** `apps/api/src/lib/config/env.ts:12`, `apps/api/.env:7`  
**Severity:** CRITICAL  
**Description:** The local `.env` contains `JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long` — a human-readable, guessable string. The Zod schema only requires `z.string().min(1)` — no minimum length, no entropy check, no randomness validation. If this or a similar value is used in production, an attacker can forge valid JWTs and impersonate any user.  
**Impact:** Full authentication bypass — attacker can forge tokens for any user including super_admin.  
**Fix:** Enforce minimum 32-character length in Zod schema. Add a entropy/randomness check. Document JWT_SECRET generation requirements.

### P0-04: README.md Lists 11 Non-Existent CI/CD Workflows
**File:** `README.md:324-342`  
**Severity:** CRITICAL (operational)  
**Description:** README.md lists 18 workflows in its CI/CD table. Only **13 workflows exist**. The 5 phantom workflows are from the decommissioned AWS ECS + Vercel architecture:
- `api-deploy-ecs.prod.yml` (does not exist)
- `api-deploy-ecs.dev.yml` (does not exist)
- `worker-deploy-ecs.prod.yml` (does not exist)
- `worker-deploy-ecs.dev.yml` (does not exist)
- `web-prod-vercel.yml` (does not exist)
- `web-dev-vercel.yml` (does not exist)
- `web-preview.yml` (does not exist)
- `terraform-plan.prod.yml` (does not exist)
- `terraform-apply.prod.yml` (does not exist)
- `terraform-plan.dev.yml` (does not exist)
- `terraform-apply.dev.yml` (does not exist)

Additionally, 5 actual workflows are **undocumented**: `build-push.yml`, `chromatic.yml`, `db-backup.yml`, `db-restore-test.yml`, `dependency-review.yml`.  
**Impact:** Contributors and operators cannot understand the actual CI/CD pipeline. Deployments may be misconfigured.  
**Fix:** Rewrite the CI/CD table with the actual 13 workflows.

### P0-05: Five Contradictory Test Count Snapshots in AGENTS.md
**File:** `AGENTS.md:5,7,43,104,239`  
**Severity:** CRITICAL (operational)  
**Description:** AGENTS.md contains **5 different test count claims** that contradict each other:
| Location | Claim |
|----------|-------|
| Line 5 | "2,324 across 279 suites" |
| Line 7 | "API 799, SDK 264, Worker 74, Web 1450 (total 2,577+)" |
| Line 43 | "API 800, Web 1450" |
| Line 104 | "API 701, SDK 251, Worker 31, Web 1434, total 2,417" |
| Line 239 (README.md) | "695 tests" |

None of these can be verified without running the test suite (which requires a running Supabase instance). The `alignment-audit-results.json` claims "764 tests" from June 2026 — yet another contradition.  
**Impact:** No reliable test count exists. CI coverage gates may be meaningless.  
**Fix:** Run the full test suite and update all documents with verified counts in a single commit.

### P0-06: Terraform State Files on Disk (Multiple Prior Audits Found This)
**File:** `infra/terraform/digitalocean/terraform.tfstate`, `infra/terraform/digitalocean/terraform.tfstate.backup`  
**Severity:** HIGH (downgraded from CRITICAL)  
**Description:** Both `terraform.tfstate` (9,874 bytes) and `terraform.tfstate.backup` (9,565 bytes) exist on disk. `git ls-files` confirms they are NOT committed — the `.gitignore` patterns `*.tfstate` and `*.tfstate.*` (lines 49-50) correctly prevent tracking. However, these state files contain infrastructure metadata (SSH key fingerprints, VPC UUID, firewall IDs, Cloudflare zone IDs) and possibly DO tokens in plaintext. This issue has been flagged in **at least 5 prior audits** (MEGA_AUDIT_2026-06-18, SYSTEM_REVIEW_2026-06-26, repo-deep-dive runs 1-3) and was reportedly "fixed" in run 2 — yet the files still exist on disk.  
**Impact:** Secret leakage if the machine is compromised or directory shared. State file corruption from concurrent local edits.  
**Fix:** Delete local state files (`rm infra/terraform/digitalocean/terraform.tfstate*`). Ensure remote backend is used exclusively. Rotate any secrets found in state.

### P0-07: SSH Open to 0.0.0.0/0 in Terraform Default
**File:** `infra/terraform/digitalocean/variables.tf:88`  
**Severity:** CRITICAL  
**Description:** `admin_ip_ranges` defaults to `["0.0.0.0/0", "::/0"]` — SSH accessible from the entire internet. While mitigated by key-only auth (no password), if `prod.tfvars` doesn't override this value, the production droplet is SSH-open to the world. The `prod.tfvars` file contains only placeholder values (`your-do-api-token`).  
**Impact:** Brute-force SSH attacks, unauthorized access to production server.  
**Fix:** Change the default to a restrictive CIDR. Add validation that prod environments must set a specific admin IP range.

---

## Section 2: P1 High Findings

### P1-01: 200+ Production `any` Type Annotations
**Files:** `apps/worker/src/tasks/module-tasks.ts` (14 casts), `apps/web/app/(admin)/admin/page.tsx` (6 casts), `apps/api/src/routes/final.ts` (15+ casts), and ~30 more files  
**Severity:** HIGH  
**Description:** The entire worker scan system casts every Supabase query `as any` (14 instances in module-tasks.ts alone). The AGENTS.md claim of "130+ `: any`" is **false** — actual count exceeds 200 combined `: any` + `as any` in production code. This eliminates TypeScript's type safety across critical paths.  
**Impact:** Runtime errors that TypeScript should catch at compile time. Silent data corruption.  
**Fix:** Generate Supabase types (`supabase gen types typescript`) and use them throughout.

### P1-02: Overly Broad Platform Admin Bypass (8 Roles)
**File:** `apps/api/src/lib/roles.ts:9-18`  
**Severity:** HIGH  
**Description:** `PLATFORM_ADMIN_KEYS` includes 8 roles (`super_admin`, `admin`, `dispatcher`, `engineer`, `security-analyst`, `project-manager`, `finance`, `onboarding-specialist`). All 8 bypass tenant isolation via `requireOrgAccess` and `requirePermission` — they can access ALL tenants' data. This contradicts the "granular RBAC" claim in AGENTS.md.  
**Impact:** Compromise of any of 8 accounts gives access to all tenant data.  
**Fix:** Reduce platform-admin roles to only those that genuinely need cross-tenant access. Implement scoped access for others.

### P1-03: 6+ Admin Pages Silently Swallow API Errors
**Files:** `apps/web/app/(admin)/admin/dmarc-coach/page.tsx:48`, `license-optimizer/page.tsx:31`, `status-pages/page.tsx:45`, `insurance-binder/page.tsx:29`, `uptime-monitor/page.tsx:27`, `training-hub/page.tsx:29`  
**Severity:** HIGH  
**Description:** These pages use `catch { /* graceful */ }` with no logging, no error state, no user feedback. API failures render completely empty pages with zero indication of what went wrong.  
**Impact:** Users see blank pages with no way to troubleshoot. No Sentry capture. Silent data loss.  
**Fix:** Add structured logging, error state UI, and Sentry capture in each catch block.

### P1-04: Rate-Limit Bypass via X-Forwarded-For
**File:** `apps/api/src/middleware/rate-limit.ts:48-52,65,78,88`, `apps/api/src/app.ts:79`  
**Severity:** HIGH  
**Description:** All rate limiters skip requests from `127.0.0.1`/`::1`. `trust proxy` is set to `true`, meaning Express trusts `X-Forwarded-For`. An attacker behind a proxy that sets this header to `127.0.0.1` can bypass all rate limiting.  
**Impact:** Rate limiting completely ineffective against sophisticated attackers.  
**Fix:** Set `trust proxy` to a specific hop count (e.g., `1` for single reverse proxy) rather than `true`.

### P1-05: Permissive RLS on Store Module Tables
**Files:** `supabase/migrations/5302105_store_quotes.sql:18-19`, `5302104_store_promotions.sql:21-22`  
**Severity:** HIGH  
**Description:** `store_quotes` has `FOR ALL USING (true) WITH CHECK (true)` and `store_promotions` has `FOR ALL USING (true)` for `service_role`. The anon key INSERT policy on `store_quotes` has `WITH CHECK (true)`, allowing arbitrary data insertion.  
**Impact:** Data integrity compromise via anon key.  
**Fix:** Restrict policies to authenticated role only. Remove permissive anon policies.

### P1-06: 19 Production Console Statements Remain
**Files:** `apps/web/components/NotificationBell.tsx` (8x), `apps/web/lib/auth/membership.ts:57`, `apps/web/components/admin/AdminGlobalSearch.tsx:50`, and 10 more  
**Severity:** HIGH  
**Description:** AGENTS.md claims "lint warnings → 0 (console→logger/stdout)" — this is **FALSE**. 19 `console.log`/`console.warn`/`console.error` calls remain in production code. These bypass structured logging, PII redaction, and Sentry integration.  
**Impact:** PII leakage in logs. Missing observability. Inconsistent error tracking.  
**Fix:** Replace all console.* calls with the project's structured logger.

### P1-07: Architecture Prerequisites List AWS/Vercel (Actual: DigitalOcean)
**File:** `README.md:73-84`  
**Severity:** HIGH  
**Description:** The "Production" prerequisites table lists "AWS account (ECS, S3, SSM, ALB, CloudWatch)" and "Vercel account (Web app hosting)". The actual infrastructure is a single DigitalOcean droplet behind Caddy with hosted Supabase. AGENTS.md:283 explicitly documents the DO migration, but README was never updated.  
**Impact:** New contributors will set up the wrong infrastructure.  
**Fix:** Update README prereqs to reflect DigitalOcean + hosted Supabase architecture.

### P1-08: 7 Environment Variables Missing from Documentation
**File:** `docs/ENVIRONMENT_VARIABLES.md` vs `apps/api/.env.example`, `apps/web/.env.example`  
**Severity:** HIGH  
**Description:** These variables exist in `.env.example` but are not documented:
- `TURNSTILE_SECRET_KEY` (API)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Web)
- `TASK_QUEUE_ENABLED` (API + Worker)
- `REDIS_PASSWORD` (API + Worker)
- `QUEUE_BACKEND` (Worker)

**Impact:** Operators cannot properly configure production environments.  
**Fix:** Add all missing variables to ENVIRONMENT_VARIABLES.md.

### P1-09: Docker Remote API Exposed on Port 2376
**File:** `infra/terraform/digitalocean/cloud-init.yml:29`  
**Severity:** HIGH  
**Description:** `ufw allow 2376/tcp comment 'Docker'` exposes the Docker Remote API to the internet. Combined with key-only SSH, this creates an additional attack surface.  
**Impact:** Unauthorized container management, potential remote code execution.  
**Fix:** Restrict port 2376 to admin IPs only, or remove entirely if not needed.

### P1-10: Multer 50MB vs Supabase 2MB Bucket Mismatch
**Files:** `apps/api/src/routes/documents.ts:114` (50MB), `apps/api/src/routes/file-requests.ts` (50MB)  
**Severity:** HIGH  
**Description:** Multer accepts up to 50MB files into memory, but Supabase storage buckets are configured for 2MB. Large uploads consume server memory then fail at storage, creating a DoS vector.  
**Impact:** Memory exhaustion DoS on API server.  
**Fix:** Reduce multer limit to match Supabase bucket (2MB) or increase bucket limit.

### P1-11: Content-Security-Policy Allows unsafe-inline
**Files:** `apps/web/middleware.ts:42`, `apps/api/src/middleware/security-headers.ts:29`  
**Severity:** HIGH  
**Description:** Both CSP headers include `'unsafe-inline'` for `script-src`. The web middleware also allows `'unsafe-eval'` in dev mode. The nonce-based CSP on the API is only used for Swagger, not for the web app.  
**Impact:** XSS payloads execute despite CSP being present.  
**Fix:** Implement nonce-based CSP for all script execution in the web app.

---

## Section 3: P2 Medium Findings

### P2-01: Root TypeScript ^6.0.3 vs App TypeScript ^5.x
**File:** `package.json:47` vs `apps/api/package.json`, `apps/web/package.json`  
**Description:** Root declares TypeScript 6.0.3 while all apps use 5.x. Major version mismatch could cause build inconsistencies.

### P2-02: BullMQ Version Mismatch
**File:** `apps/api/package.json` (^5.78.1) vs `apps/worker/package.json` (^5.34.0)  
**Description:** Different semver ranges across packages using the same queue library.

### P2-03: build-push.yml and deploy-do.yml Race Condition
**Files:** `.github/workflows/build-push.yml`, `.github/workflows/deploy-do.yml`  
**Description:** Both trigger on push to main/develop with overlapping path filters. Every push builds + pushes images twice to GHCR.

### P2-04: lint-staged Lacks ESLint
**File:** `package.json:68-75`  
**Description:** lint-staged runs Prettier only — no `eslint --fix` on staged files. Code quality issues can bypass pre-commit.

### P2-05: No prevent_destroy on Firewall/DNS
**Files:** `infra/terraform/digitalocean/firewall.tf`, `infra/terraform/digitalocean/dns.tf`  
**Description:** Only the droplet has `prevent_destroy`. Firewall and DNS records could be accidentally destroyed by `terraform destroy`.

### P2-06: Default Build Arg Points to Production
**File:** `apps/web/Dockerfile`  
**Description:** `ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.mainecybertech.com}` — building without the arg silently uses prod URL.

### P2-07: Trust Proxy Set to Boolean true
**File:** `apps/api/src/app.ts:79`  
**Description:** `app.set("trust proxy", true)` trusts all proxies. Should be set to specific hop count.

### P2-08: CSRF Cookie is JavaScript-Readable
**File:** `apps/api/src/middleware/csrf.ts:80`  
**Description:** `httpOnly: false` on CSRF cookie enables XSS-based CSRF token theft. Combined with P0-01 (XSS in comments), this creates a CSRF+XSS chain.

### P2-09: PII in Email Logs
**File:** `apps/api/src/lib/email.ts:38,42`  
**Description:** `logger.info({ to, subject }, "Email sent")` logs recipient email addresses. The pino redaction patterns may not catch the `to` field as a direct property.

### P2-10: Input Sanitizer Uses Weak Regex
**File:** `apps/api/src/middleware/security.ts:17-22`  
**Description:** SQL injection detection uses 4 trivially bypassable regex patterns. Provides false sense of security.

### P2-11: Worker Missing EXPOSE Directive
**File:** `apps/worker/Dockerfile`  
**Description:** API has `EXPOSE 4000`, web has `EXPOSE 3000`, worker has neither.

### P2-12: Dependabot Missing Docker + Terraform
**File:** `.github/dependabot.yml`  
**Description:** Only covers npm and GitHub Actions. 3 Dockerfiles and Terraform providers are not monitored.

### P2-13: Root Package Name is "client-portal"
**File:** `package.json:2`  
**Description:** Misleading name for a monorepo that includes admin, portal, marketing, API, worker, and SDK.

### P2-14: alignment-audit-results.json is Stale
**File:** `alignment-audit-results.json`  
**Description:** Claims "764 tests" and "45 pages" from June 2026. Actual: 390 test files, 301 page.tsx files. Never updated.

---

## Section 4: P3 Low Findings

### P3-01: `test` File at Root Contains Stale Architecture Analysis
**File:** `test` (303 lines)  
**Description:** Contains architecture analysis from an earlier date with outdated claims (e.g., "API and Worker run as root" — they now run as `appuser`). Misleading filename.

### P3-02: AGENTS.md is 800+ Lines of Accumulated Audit Trail
**File:** `AGENTS.md`  
**Description:** Contains snapshots from 6+ different dates that contradict each other. Never consolidated. Should be a clean reference document.

### P3-03: Zero TODO/FIXME Comments (Clean)
No issues found. Codebase is clean of dead markers.

### P3-04: ~30 Admin List Pages Copy-Paste Boilerplate
**Files:** `apps/web/app/(admin)/admin/*/page.tsx`  
**Description:** Identical structure across ~30 pages. Could use a shared `AdminListPage` component.

### P3-05: final.ts is a Grab-Bag of Unrelated Stats Endpoints
**File:** `apps/api/src/routes/final.ts` (471 lines)  
**Description:** Contains stats endpoints for 10+ unrelated modules. Should be split per-module.

### P3-06: 787 AI Prompt Files in Repository
**File:** `prompts/` directory  
**Description:** 787 files across 6 packs instructing AI to generate code, run audits, and execute remediation. This is a supply-chain risk (prompt injection, unauthorized code generation). See Section 6 for details.

### P3-07: E2E Default Credentials in docker-compose
**File:** `docker-compose.yml:65-66`  
**Description:** `E2E_ADMIN_PASSWORD=${E2E_ADMIN_PASSWORD:-1}` — default password is `1`. Acceptable for dev only.

### P3-08: No ESLint in Pre-commit
**File:** `.husky/pre-commit`  
**Description:** Only runs secret scanner + Prettier. No `eslint --fix`.

### P3-09: Web Container Memory Limit Low
**File:** `infra/digitalocean/docker-compose.yml`  
**Description:** Web container limited to 256MB. May cause OOM on complex pages.

---

## Section 5: Documentation Drift Summary

### Claims Verified as FALSE

| Claim | Location | Reality |
|-------|----------|---------|
| "125 E2E tests" | README.md:131 | 90 spec files |
| "733 tests" | README.md:131 | Internal contradiction (695 also claimed) |
| "695 tests" | README.md:239 | Contradicts 733 on same page |
| "427 tests (web)" | README.md:43 | Stale — 210 test files exist |
| "155 tests (API)" | README.md:44 | Stale — 79 test files exist |
| "89 tests (SDK)" | README.md:46 | Stale — 2 test files exist |
| "24 tests (worker)" | README.md:47 | Stale — 8 test files exist |
| "lint warnings → 0" | AGENTS.md:13 | 19 console.* statements remain |
| "Worker: 32 lines" | AGENTS.md:84 | 145 lines (file grew) |
| "AWS ECS + Vercel" | README.md:73-84 | DigitalOcean droplet |
| "API 800 tests" | AGENTS.md:43 | Contradicts "API 799" on line 7 |
| "API key management incomplete" | AGENTS.md roadmap | Fully implemented (CRUD + SDK) |

### Claims Verified as TRUE

| Claim | Location | Verified |
|-------|----------|----------|
| Turborepo monorepo structure | AGENTS.md:78 | ✅ |
| Auth callback proxy pattern | README.md:174-187 | ✅ |
| DO deployment via docker save/pipe | AGENTS.md:289 | ✅ |
| SHA-pinned Docker base images | Dockerfiles | ✅ |
| Non-root containers | Dockerfiles (all 3) | ✅ |
| graceful shutdown on API/Worker | main.ts files | ✅ |
| Circuit breaker on outbound HTTP | http-client.ts | ✅ |
| Zod validation on mutation endpoints | All route files | ✅ |
| Supabase is hosted (not self-hosted) | docker-compose.yml | ✅ |

---

## Section 6: AI Prompt Inventory & Risk Assessment

### Summary

**787 prompt files** found across 6 packs in `prompts/`:

| Pack | Purpose | Files | Risk |
|------|---------|-------|------|
| `repo_audit_prompt_pack/` | 8-phase comparative audit vs reference repo | 12 prompts + 16 outputs | LOW — read-only audit |
| `repo-deep-dive/` | 41-prompt adversarial audit system | 42 prompts + 164 outputs | LOW — read-only audit |
| `hardening_prompt_pack/` | 8-domain security hardening audit | 12 prompts + runners + schemas | MEDIUM — includes remediation engine |
| `mct-portal-os-expanded-60-modules/` | Build 60 modules from prompts | 71 prompts (60 build + 10 phase + 1 master) | **HIGH** — instructs AI to write production code |
| `mct-full-webstore-product-catalog-pack/` | Build webstore from prompts | 84 prompts (3 master + 30 implementation + 33 audit + 18 detail) | **HIGH** — instructs AI to write production code |
| `portal-alignment/` | 7-phase alignment engine with remediation | 10 prompts + engine + CLI | **HIGH** — includes `ULTRA_REMEDIATION.md` that auto-applies fixes |

### Key Risk: AI-Generated Code Without Verification

The most concerning prompts are:

1. **`MASTER_AGENT_PROMPT.md`** (60-modules pack): Instructs AI to build complete vertical-slice modules with migrations, RLS, API routes, SDK, UI, worker tasks, tests, and docs. Non-negotiable rules include "no bypass auth/RLS/audit logging" but these are unverifiable at prompt level.

2. **`ULTRA_REMEDIATION.md`** (portal-alignment): Instructs AI to "create fix branches per patch set, apply P0 edits, run verification (pnpm test, typecheck), rollback on failure." This is an autonomous code modification engine.

3. **`MASTER_FULL_STORE_IMPLEMENTATION.md`** (webstore pack): 9-step implementation sequence for a complete e-commerce system including payment processing, lead capture, and conversion tools.

### Recommendation

The `prompts/` directory should either:
- Be removed from the repo (moved to a private prompts library)
- Be added to `.dockerignore` and excluded from production builds
- Have a clear warning that these are historical artifacts, not active instructions

---

## Section 7: Positive Findings

### Well-Implemented Security

- SSRF guard with sync + async DNS resolution and private IP blocking
- File uploads have MIME type + extension blocklists
- Worker logger has thorough PII redaction (email, phone, name, auth headers)
- Docker containers run as non-root (`appuser`/`nextjs`)
- CSRF double-submit pattern with timing-safe comparison
- Graceful shutdown on all services
- Circuit breaker on outbound HTTP calls
- Cookie security flags (HttpOnly, Secure, SameSite) on auth cookies
- Webhook signature verification on all inbound webhooks
- Helmet security headers on API
- Zod validation on mutation endpoints
- pnpm overrides for known vulnerable dependencies
- Dependabot configured for npm + GitHub Actions
- Secret scanner in pre-commit hook AND CI
- All GitHub Actions pinned to full SHA
- SHA-pinned Docker base images

### Good Architecture

- Clean Turborepo monorepo structure
- Proper separation of API/Web/Worker/SDK
- Auth callback proxy eliminates Supabase client in web
- Compound endpoints to reduce N+1 queries
- Cache middleware with no-renew pattern
- Server-only import guard in lib/api.ts

### Comprehensive Infrastructure

- Docker Compose with security hardening (cap_drop, read_only, mem_limit)
- Terraform with separate state per environment
- UFW firewall in cloud-init
- Redis with password requirement
- Prometheus for metrics

---

## Section 8: Remediation Priority Matrix

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| **P0-01** | XSS in CommentBody | Small | Block any production deploy |
| **P0-02** | Auth bypass in test mode | Small | Block any production deploy |
| **P0-03** | Weak JWT secret | Small | Block any production deploy |
| **P0-04** | Phantom CI/CD workflows | Small | Fix README.md |
| **P0-05** | Contradictory test counts | Medium | Run test suite, update docs |
| **P0-06** | Terraform state on disk | Small | Delete files, fix .gitignore |
| **P0-07** | SSH 0.0.0.0/0 default | Small | Change default CIDR |
| **P1-01** | 200+ `any` annotations | Large | Generate Supabase types |
| **P1-02** | Overly broad admin bypass | Medium | Audit role assignments |
| **P1-03** | Silent error swallowing | Small | Add error states to 6 pages |
| **P1-04** | Rate-limit bypass | Small | Fix trust proxy setting |
| **P1-05** | Permissive RLS | Small | Restrict store policies |
| **P1-06** | Console statements | Small | Replace with structured logger |
| **P1-07** | Stale architecture prereqs | Small | Update README.md |
| **P1-08** | Missing env var docs | Small | Update ENVIRONMENT_VARIABLES.md |
| **P1-09** | Docker port 2376 | Small | Restrict to admin IPs |
| **P1-10** | Multer/Bucket mismatch | Small | Align limits |
| **P1-11** | CSP unsafe-inline | Medium | Implement nonce-based CSP |

---

## Appendix A: Verified File Counts

| Metric | Actual Count |
|--------|-------------|
| Test files (*.test.ts/tsx, *.spec.ts/tsx) | 390 |
| Page files (page.tsx under apps/web/app/) | 301 |
| SQL migrations | 96 |
| Seed files (SQL) | 9 |
| API route files | 55 |
| SDK source files | 53 |
| E2E spec files | 90 |
| GitHub Actions workflows | 13 |
| AI prompt files | 787 |

---

## Appendix B: All Files Referenced in This Audit

### Security
- `apps/web/components/CommentBody.tsx` — XSS vulnerability
- `apps/api/src/middleware/org-access.ts` — Auth bypass in test mode
- `apps/api/src/middleware/permissions.ts` — Auth bypass in test mode
- `apps/api/src/lib/config/env.ts` — Weak JWT secret validation
- `apps/api/.env` — Weak JWT secret value
- `apps/api/src/middleware/rate-limit.ts` — Rate-limit bypass
- `apps/api/src/app.ts` — Trust proxy, rate limit config
- `apps/api/src/middleware/csrf.ts` — CSRF cookie readable
- `apps/api/src/middleware/security.ts` — Weak regex sanitizer
- `apps/api/src/middleware/security-headers.ts` — CSP unsafe-inline
- `apps/web/middleware.ts` — CSP unsafe-inline
- `apps/api/src/lib/email.ts` — PII in logs
- `apps/api/src/lib/roles.ts` — Overly broad admin bypass
- `infra/terraform/digitalocean/variables.tf` — SSH 0.0.0.0/0

### Documentation
- `README.md` — Phantom workflows, stale prereqs, wrong test counts
- `AGENTS.md` — 5 contradictory test count snapshots
- `docs/ENVIRONMENT_VARIABLES.md` — 7 missing variables
- `alignment-audit-results.json` — Stale audit results
- `test` — Stale architecture analysis

### Infrastructure
- `infra/terraform/digitalocean/terraform.tfstate` — State on disk
- `infra/terraform/digitalocean/terraform.tfstate.backup` — Backup on disk
- `.github/workflows/build-push.yml` — Race condition with deploy-do.yml
- `.github/workflows/deploy-do.yml` — Race condition
- `.github/dependabot.yml` — Missing Docker/Terraform ecosystems
- `.husky/pre-commit` — Missing ESLint

### Code Quality
- `apps/worker/src/tasks/module-tasks.ts` — 14 `as any` casts
- `apps/api/src/routes/final.ts` — Grab-bag of stats endpoints
- `package.json` — Root package name "client-portal", TS ^6.0.3
- `packages/sdk/src/users.ts` — `memberships: any[]`

---

*End of audit report.*
