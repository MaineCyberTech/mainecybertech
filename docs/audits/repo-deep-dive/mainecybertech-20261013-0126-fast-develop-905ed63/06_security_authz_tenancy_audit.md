# 06_security_authz_tenancy_audit — Prompt 06 - Security, Authorization, and Tenancy Audit

- Run: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Target: `mainecybertech` @ `905ed63` (branch `develop`)
- Domain: `06_security_authz_tenancy_audit.md` (area SEC, prompt)

## Verification Performed

# Security, Authorization, and Tenancy — re-audit verification (develop @ 905ed63)

Read-only verification at `905ed63` (worktree of `origin/develop`); no runtime probing, no database access. The previous full run's 40 SEC rows were re-checked against the current code; 37 are verified fixed, 3 remain partially fixed. No new security regression was found in the reviewed surfaces.

Checked surfaces (evidence): `apps/api/src/lib/role-assignment.ts` (shared super-admin role-assignment guard) + its four call sites (`routes/memberships.ts:91,152,161`, `routes/bulk.ts:66`, `routes/organizations.ts:93`, `routes/users.ts:492`); `config/env.ts:172-196` + `lib/field-encryption.ts:39-58` (fail-closed PII crypto); `middleware/admin.ts:22-64` + `lib/admin-scope.ts:55-71` (org-pinned admin gate); `routes/audit.ts:114-191` (impersonation review behind `allTenants`); `lib/roles.ts` + `@mct/sdk/role-keys` (trust-tier split); `routes/auth.ts:34,193,347` (trusted redirect origin); `routes/client-onboarding-command-center.ts` (`requirePermission`); `routes/file-requests.ts` (token/org-bound public upload); `worker/tasks/module-tasks.ts:606-668` (`pinnedFetch`); `middleware/permissions.ts:73-79` (API-key scope cap) + `routes/api-keys.ts`; `lib/mfa.ts:136-150` (privileged aal2); `middleware/rate-limit.ts:48-55` (normalized hashed keys); `routes/health.ts:150-161` (METRICS_TOKEN gate); `routes/analytics.ts:74-110` (platform-admin gate); `middleware/org-access.ts:162-173` + `routes/notification-preferences.ts:66-70` (body/org pinning); `supabase/migrations/5302434` (anon least privilege) and `5302440` (`get_analytics_summary`); `apps/web/lib/org-actions.ts:21-50` (authorized active-org setter).

Spot scan for new gaps: all 66 route modules were enumerated for auth middleware; the six modules without `requireAuth` are the intended public surfaces (docs, health, public, store, unsubscribe-token, signature-verified webhooks). New post-audit code reviewed: webhook ingress caps + encrypted endpoint secrets (`routes/webhooks.ts`, `routes/webhook-management.ts`), document visibility (`lib/document-visibility.ts`), cache tenant-scoping (`middleware/cache.ts` + `responseCache` scope resolver), malware-scan hook (`lib/malware-scan.ts`, fail-closed when configured), unsubscribe token HMAC (`lib/unsubscribe-token.ts`). No new finding was justified.

Residuals (unchanged from the prior register): PII plaintext cutover (SEC-P2-002), RLS write-side rollout + deployed allowlists (SEC-P2-012), non-authoritative web middleware gate (SEC-P3-012).

## Findings

| ID | Severity | Title |
|---|---|---|
| SEC-P1-001 | P1 | super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard |
| SEC-P1-002 | P1 | PII field encryption silently degrades to reversible plaintext |
| SEC-P1-003 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data |
| SEC-P1-004 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted |
| SEC-P1-005 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot |
| SEC-P1-006 | P1 | Caller-controlled reset redirect composes into an account-takeover assist |
| SEC-P1-007 | P1 | Client-onboarding mutations run without any `requirePermission` gate |
| SEC-P1-008 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed |
| SEC-P1-009 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference |
| SEC-P1-010 | P1 | Public file-request upload authorizes with a permission unioned across all orgs |
| SEC-P2-001 | P2 | Worker monitoring checks are guard-then-fetch (DNS-rebinding TOCTOU); webhook path is pinned but uptime/website checks and SSL probe are not |
| SEC-P2-002 | P2 | PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned |
| SEC-P2-003 | P2 | Global role catalog is mutable by any org's roles:manage holder (roles are not org-scoped) |
| SEC-P2-004 | P2 | API-key scopes are stored but never enforced; keys act with the creating user's full permissions and always bypass RLS |
| SEC-P2-005 | P2 | MFA enforcement is opt-in and the deployed default is false |
| SEC-P2-006 | P2 | Secret scanner echoes the matched secret value into CI logs |
| SEC-P2-007 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window |
| SEC-P2-008 | P2 | Client-onboarding mutations run without `requirePermission` (authorization outlier) |
| SEC-P2-009 | P2 | MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model) |
| SEC-P2-010 | P2 | Forgot-password email redirect still uses attacker-controlled `Origin` header |
| SEC-P2-011 | P2 | `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines |
| SEC-P2-012 | P2 | RLS is bypassed on API requests by default (service-role is the default client) |
| SEC-P2-013 | P2 | CAPTCHA/Turnstile is bypassed when the secret is unset |
| SEC-P2-014 | P2 | `/health` publicly discloses provider configuration and Redis errors |
| SEC-P2-015 | P2 | Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) |
| SEC-P2-016 | P2 | `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets |
| SEC-P2-017 | P2 | API keys store `expires_at` but nothing enforces or prunes expiry |
| SEC-P2-018 | P2 | API keys cannot authenticate; the feature is dead |
| SEC-P3-001 | P3 | Sign-up confirmation redirect is built from the caller-controlled Host header and targets a non-existent API route |
| SEC-P3-002 | P3 | Analytics admin reads are not tenant-scoped and expose platform-wide event data including visitor IPs |
| SEC-P3-003 | P3 | Auth rate-limit key uses the raw email string without normalization |
| SEC-P3-004 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) |
| SEC-P3-005 | P3 | `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate) |
| SEC-P3-006 | P3 | CORS reflects any origin with credentials when `CORS_ORIGIN="*"` |
| SEC-P3-007 | P3 | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` |
| SEC-P3-008 | P3 | `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request |
| SEC-P3-009 | P3 | Deprecated header and broad API CSP style directive |
| SEC-P3-010 | P3 | M365 webhook `clientState` is compared non-constant-time |
| SEC-P3-011 | P3 | Active-org cookie setter performs no server-side authorization |
| SEC-P3-012 | P3 | Web middleware gates routes on an unverified JWT `exp` |
