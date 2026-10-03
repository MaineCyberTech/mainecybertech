# Security, Authorization, and Tenancy Audit

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Audit Name**        | `repo-deep-dive`                |
| **Run ID**            | `20260728-0142-develop-21a10d6` |
| **Date**              | 2026-07-28                      |
| **Auditor**           | Automated security audit agent  |
| **Repository**        | `C:\temp\mainecybertech-portal` |
| **Branch / SHA**      | develop / 21a10d6               |
| **Finding Area Code** | SEC                             |

## Scope

This audit covers authentication, authorization, tenant isolation, input validation, secrets management, session handling, API security, and secure defaults within the MCT Portal monorepo.

## Evidence Reviewed

| File                                                        | Lines | Key Findings                                                 |
| ----------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| `apps/api/src/middleware/auth.ts`                           | 99    | Dual-path auth (local JWT + Supabase), multi-secret rotation |
| `apps/api/src/middleware/org-access.ts`                     | 105   | `checkOrgAccess()` query, admin bypass                       |
| `apps/api/src/middleware/admin.ts`                          | 39    | Single JOIN query to memberships+roles                       |
| `apps/api/src/middleware/security.ts`                       | 93    | Pattern-based XSS + SQLi detection                           |
| `apps/api/src/middleware/security-headers.ts`               | 35    | Nonce-based CSP, Swagger exception                           |
| `apps/api/src/middleware/rate-limit.ts`                     | 35    | 300/15min global, 10/15min auth                              |
| `apps/api/src/middleware/csrf.ts`                           | 72    | Double-submit cookie, timing-safe compare                    |
| `apps/api/src/middleware/idempotency.ts`                    | 55    | Redis + in-memory fallback                                   |
| `apps/api/src/middleware/optimistic-locking.ts`             | 44    | If-Match header parsing                                      |
| `apps/api/src/middleware/cache.ts`                          | 201   | Redis + in-memory, org-scoped keys                           |
| `apps/api/src/middleware/error.ts`                          | 48    | Sentry capture, ZodError, AppError                           |
| `apps/api/src/lib/circuit-breaker.ts`                       | 128   | 3-state circuit breaker                                      |
| `apps/api/src/lib/http-client.ts`                           | 152   | Timeout, retry, circuit breaker                              |
| `apps/api/src/lib/logger.ts`                                | 44    | 15 redacted paths                                            |
| `apps/api/src/lib/idempotency.ts`                           | 112   | Redis + in-memory Map                                        |
| `apps/api/src/config/env.ts`                                | 48    | Zod schema                                                   |
| `apps/api/src/app.ts`                                       | 184   | Middleware ordering, CORS, 50+ routes                        |
| `apps/api/src/main.ts`                                      | 35    | SIGTERM/SIGINT, unhandledRejection                           |
| `apps/web/middleware.ts`                                    | 115   | Domain routing, JWT expiry, CSP                              |
| `supabase/migrations/5302100_fix_rls_membership_status.sql` | 1115+ | `is_org_member()` function, RLS policies                     |

## Executive Summary

The MCT Portal codebase demonstrates a **mature, defense-in-depth security architecture** with strong authentication, authorization, and tenant isolation foundations.

**Strengths:**

- Dual-path JWT verification (local + Supabase fallback)
- Multi-secret JWT rotation support
- Comprehensive tenant isolation via `requireOrgAccess` middleware on 36 entity routers
- RLS policies on 100+ tables with `is_org_member()` helper
- Nonce-based CSP on both API and Web
- Timing-safe CSRF with double-submit cookie pattern
- Idempotency key enforcement
- Optimistic locking via If-Match headers
- Circuit breaker for Supabase and external HTTP clients
- Pino logging with 15 redacted fields
- Rate limiting (300/15min global, 10/15min auth)
- Graceful shutdown with 10s drain timeout
- Webhook signature verification with timing-safe HMAC

**Gaps Identified:**

1. Organizations list endpoint returns all orgs to any authenticated user (SEC-P0-001)
2. SQL injection regex has excessive false positives blocking legitimate content (SEC-P0-002)
3. 4 admin-only routes operate without org-scoping (SEC-P0-003)
4. In-memory idempotency fallback lacks concurrent access synchronization (SEC-P0-004)
5. CSP allows `unsafe-inline` for styles on API (SEC-P1-005)
6. Auth rate limiter applies uniformly to all endpoints (SEC-P1-006)
7. Users/profiles/roles routers lack org-access middleware (SEC-P1-007)
8. CORS_ORIGIN wildcard allowed (SEC-P2-009)
9. Global rate limiter skips webhook endpoints (SEC-P2-010)
10. No audit logging on auth failure events (SEC-P2-012)

**Overall Security Posture: 8/10**

## Findings

### SEC-P0-001: Organizations list endpoint returns all orgs to any authenticated user

**Location:** `apps/api/src/routes/organizations.ts:28-50`
**Evidence:** Uses `requireAuth` but NOT `requireOrgAccess`. Query at line 33: `supabase.from("organizations").select("*")` -- returns all organizations.
**Risk:** Information disclosure -- any authenticated user can enumerate all organizations.
**Recommendation:** Add `requireOrgAccess` or scope the query to the user's approved organizations.

### SEC-P0-002: SQL injection detection regex has excessive false positives

**Location:** `apps/api/src/middleware/security.ts:17-21`
**Evidence:** Pattern `/(\b(union|select|insert|update|delete|drop|alter|create|exec|execute|xp_|sp_|0x)\b)/i` matches common English words.
**Risk:** Legitimate form submissions containing words like "create", "update", "select" are rejected with 400.
**Recommendation:** Replace broad keyword matching with context-aware SQL syntax patterns.

### SEC-P0-003: 4 admin-only routes operate without org-scoping

**Locations:** `dashboard.ts`, `business-os.ts`, `admin.ts`, `search.ts`
**Evidence:** Use `requireAuth + requireAdmin` but omit `requireOrgAccess`.
**Risk:** Compromised admin account can access all data across all organizations.
**Recommendation:** Add optional `organization_id` query parameter filter.

### SEC-P0-004: In-memory idempotency fallback has no concurrent access synchronization

**Location:** `apps/api/src/lib/idempotency.ts:38-112`
**Evidence:** `IN_MEMORY_FALLBACK` Map operations (`get`, `set`, `delete`) performed without synchronization.
**Risk:** Race conditions under concurrent load when Redis is unavailable.
**Recommendation:** Add a simple mutex/lock for the in-memory fallback.

### SEC-P1-005: CSP allows `unsafe-inline` for styles on API

**Location:** `apps/api/src/middleware/security-headers.ts:28-32`
**Recommendation:** Use nonce-based approach for styles matching the script pattern.

### SEC-P1-006: Auth rate limiter applies uniformly to all endpoints

**Location:** `apps/api/src/middleware/rate-limit.ts:24-35`
**Recommendation:** Create separate rate limiters for sign-in, sign-up, forgot-password, reset-password.

### SEC-P1-007: Users, profiles, roles routers lack org-access middleware

**Locations:** `users.ts:11`, `profiles.ts:23`, `roles.ts:12`
**Recommendation:** Add explicit user filter to profiles list.

### SEC-P2-009: CORS_ORIGIN wildcard allowed

**Location:** `apps/api/src/config/env.ts:9`, `app.ts:78-79`
**Recommendation:** Validate at startup that CORS_ORIGIN is not `*` when `NODE_ENV=production`.

### SEC-P2-010: Global rate limiter skips webhook endpoints

**Location:** `apps/api/src/app.ts:104-108`
**Recommendation:** Add separate rate limiter for webhook endpoints instead of skipping.

### SEC-P2-012: No audit logging on auth failure events

**Location:** `apps/api/src/routes/auth.ts`
**Recommendation:** Add `logAuditEvent("auth.sign-in.failed")` on authentication failures.

## Risks

| Risk ID | Description                                 | Likelihood | Impact   |
| ------- | ------------------------------------------- | ---------- | -------- |
| R1      | Organization enumeration via API            | Medium     | High     |
| R2      | Legitimate content blocked by SQL regex     | High       | Medium   |
| R3      | Cross-org data access via compromised admin | Low        | Critical |
| R4      | Duplicate webhook/payment processing        | Low        | Critical |
| R5      | Auth rate limit exhaustion                  | Medium     | Medium   |
| R6      | Undetected brute-force attacks              | Low        | Medium   |

## Recommendations

### Immediate (P0)

1. Org-scope the organizations list endpoint
2. Fix SQL injection regex (remove dictionary words)
3. Add mutex to in-memory idempotency fallback
4. Document admin route security boundary

### Short-term (P1)

5. Replace `unsafe-inline` with nonce-based CSP for styles
6. Split auth rate limiters
7. Add user filter to profiles list
8. Add failed auth audit logging

### Medium-term (P2)

9. Add webhook-specific rate limiter
10. Validate CORS origin in production
11. Document Redis requirements

## Quick Wins

| #   | Change                                           | Effort | Impact |
| --- | ------------------------------------------------ | ------ | ------ |
| 1   | Add org filter to organizations query            | 30 min | High   |
| 2   | Remove dictionary words from SQL injection regex | 5 min  | High   |
| 3   | Add failed auth audit logging                    | 15 min | Medium |
| 4   | Add validation for CORS_ORIGIN in production     | 10 min | Medium |
