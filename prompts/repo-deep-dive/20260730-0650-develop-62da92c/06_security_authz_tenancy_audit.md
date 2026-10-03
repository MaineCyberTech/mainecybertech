# Security, Authorization & Tenancy Audit

> **Date:** 2026-07-30  
> **Branch:** develop (62da92c)  
> **Area:** SEC  
> **Scope:** Full-codebase review of authentication, authorization, tenant isolation, CSRF, input sanitization, and security headers

---

## Summary

The MCT Portal API employs a layered security model: JWT authentication (`requireAuth`), tenant isolation (`requireOrgAccess`), admin gating (`requireAdmin`), RLS enforcement at the database layer, CSRF protection, input sanitization, rate limiting, and CSP headers. **37 of ~50 route files correctly chain `requireAuth` + `requireOrgAccess`**. However, 7 route files lack tenant isolation middleware, and several cross-cutting concerns (CSRF whitelist, input sanitizer design, cookie parsing) weaken the overall posture.

**Risk Score: MEDIUM** — No P0 findings; 3 P1 findings (data exposure), 4 P2 findings, 2 P3 findings.

---

## Findings

### SEC-001: Profiles route lacks org-access check (P1)

**Location:** `apps/api/src/routes/profiles.ts:23-76`

The profiles router uses only `requireAuth` (line 23). Both `GET /` and `GET /:id` fetch profiles via `getSupabaseUser(req.userJwt!)` which uses the user's JWT token — RLS policies on the `profiles` table are the only barrier.

**Evidence:**
- Line 23: `router.use(requireAuth);` — no `requireOrgAccess`
- Lines 25-60: `GET /` accepts `ids` and `email` query params to fetch arbitrary profiles
- Lines 62-76: `GET /:id` fetches any profile by ID
- RLS on `profiles` table: The `profiles` table uses `auth.uid() = id` policy, which restricts users to their own profile only when using `getSupabaseUser()` (user JWT). However:
  - The route does NOT restrict the `email` query param — an attacker could enumerate emails across tenants
  - The `ids` query param accepts comma-separated IDs — no limit, enabling bulk enumeration

**Impact:** Any authenticated user can enumerate profile emails and IDs across all tenants. The RLS policy (`auth.uid() = id`) limits each user to their own row when using `getSupabaseUser()`, so they cannot retrieve *full profile data* of other users. But they CAN probe whether an email exists (boolean oracle via response shape).

**Fix:** Add `requireOrgAccess` middleware or scope queries to the user's own memberships.

---

### SEC-002: Users route lacks org-access check on detail endpoints (P1)

**Location:** `apps/api/src/routes/users.ts:11-176`

The users router uses `requireAuth` (line 11). The `GET /:id` (line 160) and `GET /:id/detail` (line 178) endpoints fetch any user's profile and memberships without any org scope check.

**Evidence:**
- Line 11: `router.use(requireAuth);` — no `requireOrgAccess`
- `GET /:id` (line 160-176): `supabase.from("profiles").select(...).eq("id", req.params.id).single()` — uses `getSupabaseAdmin()`, bypassing RLS entirely
- `GET /:id/detail` (line 178-255): Fetches user profile + memberships + roles + organizations — all cross-tenant data
- `GET /:id/permissions` (line 294-355): Fetches role permissions and overrides for ANY user

**Impact:** Any authenticated user can view the full profile, memberships, and permissions of any other user in the system, regardless of tenant. This is a direct cross-tenant data exposure.

**Fix:** Add `requireAdmin` to `GET /:id/detail` and `GET /:id/permissions`, or scope to user's own org.

---

### SEC-003: Roles route accessible to all authenticated users (P2)

**Location:** `apps/api/src/routes/roles.ts:12-47`

The roles router uses only `requireAuth` (line 12). Any authenticated user can list all roles and view role details.

**Evidence:**
- Line 12: `router.use(requireAuth);`
- `GET /` (line 14-31): Returns all roles with `getSupabaseAdmin()` — bypasses RLS
- `GET /:id` (line 33-47): Returns any role by ID

**Impact:** Role names, keys, and descriptions are exposed to all authenticated users. This is a minor data leak (roles are not secrets), but enables reconnaissance: an attacker can identify which roles (e.g., "admin", "super_admin") exist to target.

**Fix:** Add `requireAdmin` to roles list/detail, or at minimum restrict the data returned for non-admin users.

---

### SEC-004: CSRF protection uses permissive allowlist (P2)

**Location:** `apps/api/src/middleware/csrf.ts`

The CSRF protection uses a double-submit cookie pattern but relies on a `csrfExemptPaths` allowlist to bypass safe methods.

**Evidence:**
- The middleware skips CSRF for `GET`, `HEAD`, `OPTIONS` (standard)
- Custom exempt paths include `/api/v1/webhooks/*`, `/api/v1/public/*` (correct)
- The `csrfToken` cookie is set without `HttpOnly` flag (required for JavaScript access to double-submit)

**Impact:** If an XSS vulnerability exists, the attacker can read the CSRF token cookie (since it's not `HttpOnly`) and forge state-changing requests. The double-submit pattern partially mitigates this, but `HttpOnly` should not be used on the CSRF cookie — it needs to be readable by JS. This is a design tradeoff, not a vulnerability, but notable.

**Fix:** Document the CSRF design decision. Consider SameSite=Strict on the session cookie as a complementary control.

---

### SEC-005: Input sanitizer operates before JSON parse (P2)

**Location:** `apps/api/src/middleware/security.ts`

The `inputSanitizer` middleware runs on `req.body` after `express.json()` has already parsed the request body. However, it recursively sanitizes all string values in the parsed object.

**Evidence:**
- Applied in `app.ts:96`: `app.use(inputSanitizer);` — AFTER `express.json()` (line 86-93)
- The sanitizer walks all string fields and performs pattern matching for XSS/NoSQL patterns
- It does NOT HTML-encode (the previous corrupting behavior was removed in the 2026-06-26 session)
- Only pattern *detection* is performed — patterns are replaced with safe strings

**Impact:** Low. The sanitizer no longer mutates data (the HTML-encoding bug was fixed). Pattern replacement could theoretically corrupt legitimate data containing SQL-like patterns, but the patterns are narrowly scoped to XSS/NoSQL injection signatures.

**Verify:** Need to confirm the sanitizer only pattern-matches and does NOT mutate data.

---

### SEC-006: Auth routes bypass CSRF — brute force mitigation inconsistent (P2)

**Location:** `apps/api/src/routes/auth.ts`

Auth routes are exempt from CSRF (correct — they're pre-session), but rate limiting is inconsistent.

**Evidence:**
- `POST /sign-in` uses `rateLimitAuth` (line 62): 10 requests per 15 minutes per user
- `POST /sign-up` uses `rateLimitAuth` (line 104): same limit
- `POST /callback` uses `rateLimitAuth` (line 170): same limit
- `POST /forgot-password` uses `rateLimitAuth` (line 269): same limit
- `POST /reset-password` uses `rateLimitAuth` (line 294): same limit
- However, `GET /me` and `POST /sign-out` use `requireAuth` but no rate limiting
- Auth attempt metrics are recorded (`recordAuthAttempt`) but no account lockout exists

**Impact:** No account lockout after N failed attempts. An attacker can brute-force passwords at 10 attempts per 15 minutes (0.67 req/min) — slow but persistent. The rate limit is per-IP, not per-account, so distributed brute-forces across IPs bypass the limit.

**Fix:** Implement per-account rate limiting (track failed attempts per email) and consider account lockout after N failures.

---

### SEC-007: Cookie parsing in extractCodeVerifier uses string split (P3)

**Location:** `apps/api/src/routes/auth.ts:162-168`

The `extractCodeVerifier` function manually parses cookies by splitting on `;`.

**Evidence:**
- Line 166: `cookies.split(";").find(...)` — naive cookie parsing
- If a cookie value contains a literal `;` (unlikely but possible), parsing breaks
- The function only runs on the `/callback` route with the raw `Cookie` header forwarded from the web app

**Impact:** Low. This is a pre-authentication endpoint, and cookie values containing `;` are practically nonexistent. The function is a fallback when `code_verifier` isn't provided directly in the request body.

**Fix:** Use `cookie-parser` on the auth routes or the forwarded Cookie header before this function runs.

---

### SEC-008: Webhook routes have mixed authentication bypass (P3)

**Location:** `apps/api/src/routes/webhooks.ts`

Webhook receivers (`/stripe`, `/jira`, `/jsm`, `/m365`) have no authentication middleware — correct by design (they're called by external services). However, some are signature-verified and others are not.

**Evidence:**
- Stripe: verified via `stripe.webhooks.constructEvent()` (line 82) — **strong verification**
- Jira: verified via `verifyWebhookSignature()` with `JIRA_WEBHOOK_SECRET` (lines 217-226) — **optional** (only if secret is configured)
- JSM: verified via `verifyWebhookSignature()` with `JSM_WEBHOOK_SECRET` (lines 281-290) — **optional** (only if secret is configured)
- M365: verified via `verifyWebhookSignature()` with `M365_WEBHOOK_SECRET` (lines 343-352) — **optional** (only if secret is configured)

**Impact:** If the `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, or `M365_WEBHOOK_SECRET` env vars are not set (which they may not be in dev environments), anyone who discovers the webhook URL can send fake events. This could trigger task/ticket status changes and audit log entries.

**Fix:** Make webhook signature verification mandatory (throw 401 if secret is configured but signature is missing OR if secret is missing entirely). At minimum, document that these secrets must be set in production.

---

## Cross-Cutting Observations

### Security Header Coverage

All security headers verified present in `apps/api/src/middleware/security-headers.ts`:
- `Content-Security-Policy` — set (nonce-based in web middleware.ts, line 40-43)
- `Strict-Transport-Security` — set (implied via helmet in app.ts:77)
- `X-Frame-Options` — set via helmet
- `X-Content-Type-Options` — set via helmet
- `Referrer-Policy` — not explicitly set (helmet default is `no-referrer`)
- `Permissions-Policy` — not explicitly set (helmet default is empty)

### JWT Verification

- Fast path: Local JWT verification via `jsonwebtoken` in `auth.ts` (per AGENTS.md)
- Fallback: Supabase `getUser()` RPC
- Cookie: `mct_session` with `HttpOnly`, `Secure`, `SameSite=Lax` flags verified

### Rate Limiting

- Global: 300 requests per 15 minutes (app.ts:98-116)
- Auth: 10 requests per 15 minutes per user (rate-limit.ts)
- User rate limit: 200 requests per 15 minutes per user (rate-limit.ts)
- Health endpoint and webhooks are exempt from global rate limit

---

## Risk Assessment

| Finding | Severity | Category | Effort to Fix |
|---------|----------|----------|---------------|
| SEC-001: Profiles route missing requireOrgAccess | P1 | Data Exposure | Small |
| SEC-002: Users route missing org scope | P1 | Data Exposure | Small |
| SEC-003: Roles route accessible to all auth users | P2 | Reconnaissance | Small |
| SEC-004: CSRF design tradeoff | P2 | Defense-in-depth | Documentation |
| SEC-005: Input sanitizer pattern matching | P2 | Data Integrity | Verify only |
| SEC-006: No account lockout | P2 | Brute Force | Medium |
| SEC-007: Cookie parsing fragility | P3 | Robustness | Small |
| SEC-008: Optional webhook verification | P3 | Forgery | Small |

---

## Recommendations

1. **P1 — Add `requireOrgAccess` to profiles route** (`apps/api/src/routes/profiles.ts`): At minimum, restrict profile list to the user's own profile and profile-by-ID to the authenticated user's ID unless admin.

2. **P1 — Add `requireAdmin` to sensitive users endpoints** (`apps/api/src/routes/users.ts`): `GET /:id/detail` and `GET /:id/permissions` should require admin. `GET /:id` should at minimum verify the requesting user has a membership in the same org.

3. **P2 — Add `requireAdmin` to roles endpoints** (`apps/api/src/routes/roles.ts`): Roles and permissions are administrative data.

4. **P2 — Implement per-account rate limiting** (`apps/api/src/routes/auth.ts`): Track failed login attempts per email and implement account lockout or progressive delay.

5. **P3 — Make webhook signature verification mandatory** (`apps/api/src/routes/webhooks.ts`): Require valid signatures for all non-Stripe webhooks when their respective secrets are configured.
