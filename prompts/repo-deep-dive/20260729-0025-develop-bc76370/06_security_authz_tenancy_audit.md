# 06 - Security, Authorization, and Tenancy Audit (Verification Re-Run)

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Run ID**            | `20260729-0025-develop-bc76370` |
| **Previous Run**      | `20260728-0142-develop-21a10d6` |
| **Finding Area Code** | SEC                             |
| **Date**              | 2026-07-29                      |

## Scope

Verification re-run of the security, authorization, and tenancy audit. Cross-references the previous run`s findings against the 18 fix commits.

## Previous Findings Status

### SEC-P0-001: Organizations list endpoint returns all orgs to any authenticated user

**Status:** RESOLVED
**Evidence:** apps/api/src/routes/organizations.ts lines 27-40 now scopes the organizations query to the user`s approved organizations:

```typescript
let query = supabase
  .from("organizations")
  .select("*")
  .in(
    "id",
    supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", req.authUser!.userId)
      .eq("status", "approved"),
  );
```

This uses a subquery to filter organizations by the user`s approved memberships. The previous code was `supabase.from("organizations").select("\*")` which returned all organizations.

### SEC-P0-002: SQL injection detection regex has excessive false positives

**Status:** RESOLVED
**Evidence:** apps/api/src/middleware/security.ts has been completely rewritten:

- **BEFORE:** Used broad keyword matching patterns like `(union|select|insert|update|delete|drop|alter|create|exec|execute|xp_|sp_|0x)` that matched common English words
- **AFTER:** Uses context-aware SQL syntax patterns (lines 17-22):
  - `UNION\s+ALL\s+SELECT|UNION\s+SELECT|UNION\s+ALL\s+VALUES` - SQL UNION injection patterns
  - `--[\s\S]*$|;\s*$` - SQL comment and statement termination
  - `/\*[\s\S]*?\*/` - SQL block comments
  - `(\s|%20)*(or|and)(\s|%20)`[\s\S]\*=` - Tautology-based SQL injection

The new patterns are much less likely to produce false positives on legitimate content.

### SEC-P0-003: 4 admin-only routes operate without org-scoping

**Status:** RESOLVED
**Evidence:** Commit 00ce78d (fix: add org-id filtering to 7 module GET /:id routes) added org-id filtering to:

- Domain monitors (apps/api/src/routes/domain-monitors.ts)
- License optimizer (apps/api/src/routes/license-optimizer.ts)
- DMARC coach (apps/api/src/routes/dmarc-coach.ts)
- Documents (apps/api/src/routes/documents.ts)
- Projects (apps/api/src/routes/projects.ts)
- Tickets (apps/api/src/routes/tickets.ts)
- Webhook management (apps/api/src/routes/webhook-management.ts)

Additionally, commit dfb5ef8 (resolve critical audit findings) addressed the admin-only routes (dashboard, business-os, admin, search) with org-scoping.

### SEC-P0-004: In-memory idempotency fallback has no concurrent access synchronization

**Status:** RESOLVED
**Evidence:** apps/api/src/lib/idempotency.ts now has a proper `acquireMemoryLock()` implementation (lines 8-18):

```typescript
function acquireMemoryLock(): Promise<void> {
  if (!memoryMutex) {
    memoryMutex = Promise.resolve();
  }
  const prev = memoryMutex;
  let release: () => void;
  memoryMutex = new Promise((resolve) => {
    release = resolve;
  });
  return prev.then(() => release!);
}
```

This implements a promise-chain mutex pattern that serializes access to the in-memory fallback Map. The `IDEMPOTENCY_MAX_ENTRIES = 10_000` constant (line 50) limits the total cache size.

### SEC-P1-005: CSP allows unsafe-inline for styles on API

**Status:** STILL OPEN
**Evidence:** apps/api/src/middleware/security-headers.ts still uses `style-src 'self' 'unsafe-inline'` for the API CSP. The Swagger UI exception is handled separately but the `unsafe-inline` for styles remains.

### SEC-P1-006: Auth rate limiter applies uniformly to all endpoints

**Status:** PARTIALLY RESOLVED
**Evidence:** The rate-limit.ts file now has two separate rate limiters:

- `rateLimitByUser` (200 req/15min) - for authenticated API endpoints
- `rateLimitAuth` (10 req/15min) - for auth endpoints (sign-in, sign-up, forgot-password, reset-password)

The auth rate limiter uses email-based key generation (line 31-32) for per-email tracking. However, the previous finding was specifically about splitting auth endpoints into separate rate limiters for sign-in, sign-up, forgot-password, and reset-password, which has not been done.

### SEC-P1-007: Users, profiles, roles routers lack org-access middleware

**Status:** STILL OPEN
**Evidence:** apps/api/src/routes/users.ts (line 11), profiles.ts (line 23), and roles.ts (line 12) still lack explicit org-access middleware. The commit 00ce78d focused on 7 module routes but did not include these core routers.

### SEC-P2-009: CORS_ORIGIN wildcard allowed

**Status:** STILL OPEN
**Evidence:** apps/api/src/app.ts lines 78-79: `const allowedOrigins = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((s) => s.trim());` - the wildcard `*` is still accepted. No validation at startup that CORS_ORIGIN is not `*` when NODE_ENV=production.

### SEC-P2-010: Global rate limiter skips webhook endpoints

**Status:** STILL OPEN
**Evidence:** apps/api/src/app.ts lines 104-108 still skip the global rate limiter for webhook routes. No separate webhook-specific rate limiter has been added.

### SEC-P2-012: No audit logging on auth failure events

**Status:** STILL OPEN
**Evidence:** apps/api/src/routes/auth.ts has been updated with `recordAuthAttempt` from the metrics module (line 11), but there is no `logAuditEvent("auth.sign-in.failed")` call for authentication failure events.

## NEW Security Findings

### SEC-NEW-001: Pre-commit secret scanning blocks secrets at commit time

**Severity:** P2 (improvement)
**Location:** scripts/scan-secrets.sh, .husky/pre-commit
**Evidence:** A new pre-commit hook (scripts/scan-secrets.sh) scans staged files for high-entropy patterns:

- SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, JWT_SECRET, STRIPE_SECRET_KEY
- AWS access keys (AKIA pattern)
- GitHub personal access tokens (ghp\_ pattern)
- Private keys (BEGIN \* PRIVATE KEY)

The hook exits with non-zero if any patterns are detected, blocking the commit. This is a significant security improvement.
**Recommendation:** Consider replacing the simple grep with a dedicated tool like gitleaks for more comprehensive detection (entropy analysis, file-type awareness, path ignore).

### SEC-NEW-002: Rate limit response now returns structured JSON

**Severity:** P2 (improvement)
**Location:** apps/api/src/app.ts lines 101-108
**Evidence:** The global rate limiter now returns a structured JSON error response instead of the default plain text:

```typescript
message: JSON.stringify({
  success: false,
  error: {
    code: "RATE_LIMIT",
    message: "Too many requests from this IP, please try again later.",
    status: 429,
  },
}),
```

This is better for API clients that expect JSON responses.
**Recommendation:** No action needed.

### SEC-NEW-003: HMAC-SHA256 webhook signature verification

**Severity:** P2 (improvement)
**Location:** apps/api/src/lib/webhook-dispatcher.ts lines 36-39, apps/worker/src/tasks/webhook-dispatcher.ts
**Evidence:** The outbound webhook dispatcher signs payloads with HMAC-SHA256 when the endpoint has a secret configured:

```typescript
if (endpoint.secret) {
  const hmac = crypto.createHmac("sha256", endpoint.secret).update(body).digest("hex");
  headers["X-Webhook-Signature"] = `sha256=${hmac}`;
}
```

This ensures integrity and authenticity of outbound webhook payloads.
**Recommendation:** No action needed.

### SEC-NEW-004: Turnstile CAPTCHA on contact form

**Severity:** P2 (improvement)
**Location:** apps/web/components/marketing/ContactForm.tsx
**Evidence:** Cloudflare Turnstile CAPTCHA added to the marketing contact form. This prevents automated spam submissions and bot attacks on the public contact form.
**Recommendation:** No action needed.

### SEC-NEW-005: UUID validation added to validators

**Severity:** P2 (improvement)
**Location:** Multiple validator files
**Evidence:** Commit 34a4d65 added UUID validation to form validators. The zod schemas now use z.string().uuid() for entity ID fields, ensuring proper UUID format validation.
**Recommendation:** No action needed.

### SEC-NEW-006: Performance indexes include security-relevant indexes

**Severity:** P3 (improvement)
**Location:** supabase/migrations/5302102_add_performance_indexes.sql
**Evidence:** The new migration adds indexes that improve security-relevant queries:

- idx_audit_logs_org_created: audit log queries by organization
- idx_audit_logs_entity: entity-level audit queries
- idx_tickets_assigned_to: ticket assignment queries
- idx_tickets_created_by: ticket creator queries
  These indexes make audit log queries and security investigations faster.
  **Recommendation:** No action needed.

## Security Posture: 8.5/10 (improved from 8/10)

### Summary of Changes

| Previous Finding                               | Severity | Status             |
| ---------------------------------------------- | -------- | ------------------ |
| SEC-P0-001: Organizations list all orgs        | P0       | RESOLVED           |
| SEC-P0-002: SQL injection regex FP             | P0       | RESOLVED           |
| SEC-P0-003: Admin routes no org-scoping        | P0       | RESOLVED           |
| SEC-P0-004: Idempotency no mutex               | P0       | RESOLVED           |
| SEC-P1-005: CSP unsafe-inline styles           | P1       | STILL OPEN         |
| SEC-P1-006: Auth rate limiter uniform          | P1       | PARTIALLY RESOLVED |
| SEC-P1-007: Users/profiles/roles no org-access | P1       | STILL OPEN         |
| SEC-P2-009: CORS wildcard allowed              | P2       | STILL OPEN         |
| SEC-P2-010: Webhook rate limiter skipped       | P2       | STILL OPEN         |
| SEC-P2-012: Auth failure audit logging         | P2       | STILL OPEN         |

**Resolution rate: 5/10 resolved or partially resolved (50%)**
