# Security, Authorization, and Tenancy Audit

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `20261002-0344-develop-6286137`
- Repository: `C:\temp\mainecybertech` (MCT Portal monorepo)
- Branch: `develop`
- Commit SHA: `62861370` (run identifier; `.git/HEAD` points at `refs/heads/develop`; the `git` binary is unavailable in this environment, so the short SHA is taken from the run metadata `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/INDEX.md` and cannot be independently re-derived here — see Open Questions OQ-1)
- Generated at: 2026-10-02 (UTC)
- Auditor: principal-level repository auditor (subagent, prompt 06, fresh pass)
- Area code: SEC
- Output path: `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/06_security_authz_tenancy_audit.md`
- Scope limitations:
  - AUDIT-ONLY. No application code, config, or migration was modified. The only file written is this report.
  - Static review of the working tree. No live database, no production connectivity, no dynamic testing.
  - `git` is not installed in the audit environment; commit binding relies on the run scaffold (`INDEX.md` / `audit_manifest.json`) and cannot be re-verified against `git log`.
  - DB-level claims (RLS policy effectiveness, SECURITY DEFINER behavior under a real service-role JWT, `supabase-js` semantics for `undefined` filters) are marked with confidence levels rather than asserted as reproduced.
  - Supabase-hosted configuration (Auth redirect allowlist, actual env values of `CORS_ORIGIN`, `MFA_ENFORCEMENT_ENABLED`, `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED`) is not visible from the repository and is recorded as `Unverified`.

## Scope

Reviewed at the run commit (`6286137`, branch `develop`):

- `apps/api/src/routes/**` — 63 route modules including split routers `routes/final/*` (backups, budgets, crud, dns-changes, procurement, sharepoint, stats-helpers, time-entries) and `routes/store/*` (campaigns, catalog, promotions, quotes, visual-assets). Focus on authorization middleware usage, by-id tenant scoping, state-machine transitions, upload paths, share endpoints, webhooks, and account lifecycle.
- `apps/api/src/middleware/**` — `auth.ts`, `admin.ts`, `org-access.ts`, `permissions.ts`, `csrf.ts`, `rate-limit.ts`, `security-headers.ts`, `cache.ts`, `security.ts`, `idempotency.ts`, `optimistic-locking.ts`, `request-timeout.ts`, `error.ts`.
- `apps/api/src/lib/**` — `permissions.ts`, `tenant.ts`, `roles.ts`, `mfa.ts`, `mfa-recovery.ts`, `ssrf-guard.ts`, `upload-validation.ts`, `field-encryption.ts`, `webhook-signature.ts`, `idempotency.ts`, `webhook-dispatcher.ts`, `logger.ts`, `service-role.ts`.
- `apps/api/src/services/**` — `supabase.ts` (`getScopedClient`, `getSupabaseUser`), `impersonation.ts`, `audit.ts`.
- `apps/api/src/app.ts`, `apps/api/src/config/env.ts`.
- `apps/web/middleware.ts` (domain routing, auth gating, CSP).
- `apps/worker/src/**` — `tasks/module-tasks.ts` (uptime/website monitors), `tasks/webhook-dispatcher.ts`, `tasks/webhook-retry.ts`, `lib/ssrf-guard.ts`.
- `supabase/migrations/**` — 127 SQL migrations; emphasis on the security-relevant set: 5302116 (grants), 5302118 (permission catalog), 5302128 (role catalog expansion), 5302129 (RLS/security audit fixes), 5302133 (impersonation log), 5302135 (encrypted PII), 5302402–5302428 (GAP/module tables, RLS approved-status gap fixes, entitlements, manage-actions, MFA recovery).
- `.env.example` files, `pnpm-lock.yaml`, `.github/dependabot.yml`.

Not reviewed in depth (out of scope for prompt 06; covered by sibling prompts): web server components and React actions (prompt 04/05), E2E specs (09), Terraform/CI/CD (10/12/34/36), full dependency CVE enumeration (11/35), billing/payment correctness (29), email/notification delivery (30), and the full RLS deep-dive (37).

### Continuity with the prior audit

A prior pass exists at `prompts/repo-deep-dive/20260806-1722-develop-75d3926/06_security_authz_tenancy_audit.md` (commit `75d3926`). It was read for context. **No finding was copied.** Every prior finding was re-checked against the current tree, and the current state is recorded below. The delta is large: the repository has clearly run at least one remediation cycle, adding `middleware/permissions.ts`, `lib/tenant.ts`, `lib/mfa.ts`, `lib/upload-validation.ts`, worker SSRF guards, nonce CSP, Jira/JSM dedup digests, migration `5302129` (RLS/security fixes), and extensive tests.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| --- | --- | --- | --- |
| `apps/api/src/middleware/permissions.ts` | Source | API-layer `module:action` enforcement | New since prior audit; `requirePermission(moduleKey, action)`; admin bypass = `super_admin`/`admin` |
| `apps/api/src/lib/permissions.ts` | Source | Effective-permission resolution | Union of `role_permissions` + `user_permission_overrides`; `ADMIN_BYPASS_KEYS` |
| `apps/api/src/middleware/org-access.ts` | Source | Tenant gate | `requireOrgAccess`, `requireOrgAccessByParam`, `assertOrgScopeMatches`, `assertSharesActiveOrg`, populates `req.orgScope` |
| `apps/api/src/lib/tenant.ts` | Source | By-id tenant scoping helper | `assertResourceOrg`, `loadOwned`; cross-tenant platform-admin access audited |
| `apps/api/src/lib/roles.ts` | Source | Role→platform-admin mapping | `PLATFORM_ADMIN_KEYS` = 8 keys (unchanged); `roleKeyOf` |
| `apps/api/src/middleware/auth.ts` | Source | JWT validation + MFA gate | HS256 pinned; multi-secret; 5s-bounded Supabase fallback; `requiresSecondFactor` |
| `apps/api/src/middleware/admin.ts` | Source | Admin gating | `admin`/`super_admin` only |
| `apps/api/src/middleware/csrf.ts` | Source | CSRF | Double-submit, SameSite=Lax, domain cookie; auth/public/webhook skips |
| `apps/api/src/middleware/rate-limit.ts` | Source | Rate limits | SHA-256 token keying; per-email auth limits; metrics limiter |
| `apps/api/src/middleware/security-headers.ts` | Source | Header set | helmet + HSTS/COOP/CORP/nosniff/CSP; Swagger nonce |
| `apps/api/src/app.ts` | Source | Middleware order, mounts | `trust proxy 1`; CORS; `METRICS_TOKEN` gate |
| `apps/api/src/lib/ssrf-guard.ts` | Source | SSRF | Sync + DNS guard; decimal IPv4 and IPv4-mapped IPv6 handled |
| `apps/api/src/lib/upload-validation.ts` | Source | Upload content validation | Markup rejection + image/PDF byte sniffing |
| `apps/api/src/lib/mfa.ts` | Source | MFA (aal2) enforcement | Opt-in via `MFA_ENFORCEMENT_ENABLED`; fails open on GoTrue error |
| `apps/api/src/lib/field-encryption.ts` | Source | PII at rest | AES-256-GCM; `plain:` dev fallback when key absent |
| `apps/api/src/services/supabase.ts` | Source | RLS client swap | `getScopedClient` allow-list gated, empty by default → service-role |
| `apps/api/src/services/impersonation.ts` | Source | Cross-tenant audit | `logImpersonation` into `impersonation_log` |
| `apps/api/src/routes/tickets.ts` | Source | IDOR review | `requirePermission` on mutations; DELETE/comment org-predicated |
| `apps/api/src/routes/documents.ts` | Source | File handling / IDOR | Bucket pinned; version-replace/versions org-scoped; `requirePermission` |
| `apps/api/src/routes/final/dns-changes.ts` | Source | DNS transitions | `requirePermission("dns-changes","manage")` + org predicate |
| `apps/api/src/routes/governance.ts` | Source | State machine | `requirePermission("change-requests","manage")` on approve/reject/implement/verify |
| `apps/api/src/routes/client-onboarding-command-center.ts` | Source | Authorization gap candidate | `loadOwned` tenant-scoped, but **no** `requirePermission` on mutations |
| `apps/api/src/routes/uuptime-monitor.ts` (`routes/uptime-monitor.ts`) | Source | SSRF input | `assertSafeWebhookUrl` at create/update; `requirePermission` |
| `apps/api/src/routes/auth.ts` | Source | Account lifecycle | reset gated to self; forgot-password still uses `Origin` (open finding) |
| `apps/api/src/routes/webhooks.ts` | Source | Inbound webhooks | Stripe `constructEvent` on raw body; Jira/JSM HMAC over raw body |
| `apps/api/src/lib/webhook-signature.ts` | Source | Signature verify | SHA-256 HMAC, timing-safe, 5-min timestamp tolerance |
| `apps/worker/src/tasks/module-tasks.ts` | Source | Worker scans | `assertSafeUrl` before uptime/website fetch; `redirect: "manual"` |
| `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts` | Source | Outbound dispatch | `assertSafeUrl` before dispatch/retry; no redirect follow |
| `apps/web/middleware.ts` | Source | Web gating + CSP | Nonce-based prod CSP with `strict-dynamic`; exp-only token check |
| `supabase/migrations/5302129_supabase_rls_audit_fixes.sql` | Migration | RLS/security remediation | public_interactions RLS, RPC hardening, column allowlists, policy vocab fix |
| `supabase/migrations/5302116_grant_table_privileges.sql` | Migration | PostgREST grants | anon/authenticated full DML on all public tables (RLS is the only gate) |
| `supabase/migrations/5302128_role_catalog_expansion.sql` | Migration | 8 new roles | 6 MSP platform roles + 2 client roles |
| `supabase/migrations/5302412`, `5302418`, `5302420`, `5302423`, `5302424`, `5302428` | Migration | RLS gap fixes / manage actions | approved-status filters; entitlements gating; `manage` catalog actions |
| `apps/api/src/__tests__/middleware-permissions.test.ts`, `middleware-org-access.test.ts`, `get-scoped-client.test.ts`, `mfa-enforcement.test.ts`, `ssrf-guard.test.ts` (worker) | Test | Verification surface | Exercised at source level; see Verification Performed |
| `.env.example` (api/web/worker/do), `pnpm-lock.yaml`, `.github/dependabot.yml` | Config | Secrets / supply chain | Placeholders only; no secret material matched |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
| --- | --- | --- | --- |
| `grep requirePermission apps/api/src/routes/**` | Command | Confirm server-side RBAC now enforced | 240 matches across 40 route files (target commit) |
| `grep "loadOwned\|assertResourceOrg" routes/**` | Command | Confirm by-id tenant scoping | 92 matches across 19 route files |
| `grep organization_id routes/tickets.ts` (walk) | Walk | Confirm IDOR fix on DELETE/comments | Predicates present on fetch and delete; `requirePermission("tickets","delete")` |
| `grep organization_id routes/documents.ts` (walk) | Walk | Confirm version-replace fix | `DOCUMENTS_BUCKET` pinned; target resolved with `.eq("organization_id", orgId)` before storage removal |
| `read routes/final/dns-changes.ts` | Walk | Confirm DNS transition authz | `requirePermission("dns-changes","manage")` + `.eq("organization_id", existing.organization_id)` on update |
| `grep "assertSafeUrl\|assertSafeWebhookUrl" api + worker` | Command | Confirm SSRF coverage | Route create/update + worker fetch + dispatch + retry; `ssrf-guard.test.ts` present |
| `grep "no import" routes without requirePermission/requireAdmin` | Command | Locate authz outliers | `auth`, `client-onboarding-command-center`, `docs`, `final`, `health`, `me`, `notification-preferences`, `profiles`, `public`, `search-portal`, `sla`, `store`, `webhooks` |
| `read client-onboarding-command-center.ts` | Walk | Evaluate outlier | Mutations rely on `requireOrgAccess` + `loadOwned`; no `requirePermission` — finding SEC-P2-001 |
| `grep "get_analytics_summary" supabase/**` | Command | Reproduce prior SEC-P2-004 | Zero definitions across migrations/seeds while `routes/analytics.ts:84` calls it — still open (SEC-P2-004) |
| `read routes/auth.ts:281-304` | Walk | Reproduce prior SEC-P2-005 | `redirectTo: \`${req.headers.origin ?? APP_BASE_URL}/password-reset\`` — still open (SEC-P2-003) |
| `grep "PLATFORM_ADMIN_KEYS\|ADMIN_BYPASS_KEYS" src/**` | Command | Compare tenant vs permission trust sets | `PLATFORM_ADMIN_KEYS` (8, incl. 6 MSP) vs `ADMIN_BYPASS_KEYS` (2) — inconsistency finding SEC-P2-002 |
| `grep secret patterns` (`BEGIN PRIVATE KEY`, `AKIA`, `ghp_`, `xox[bap]`) | Command | Secret material | Zero matches |
| `read .env.example` (api) | Walk | Placeholder discipline | All secret-like keys empty/placeholder; no real-looking value |
| `read app.ts` | Walk | Middleware order + CORS | `trust proxy 1`; CORS reflects any origin when `CORS_ORIGIN="*"` with `credentials: true` — finding SEC-P3-002 |
| `read services/supabase.ts getScopedClient` | Walk | RLS swap posture | Allow-lists empty by default → service-role everywhere (RLS bypassed) — finding SEC-P2-005 |

### Claim reproducibility summary

| Headline claim (from prior audit) | Attempted reproduction at `6286137` | Outcome |
| --- | --- | --- |
| SEC-P1-001 "granular permission catalog is not enforced server-side" | `grep requirePermission` in `apps/api/src/routes` | **Unsupported now — remediated (verified-fixed).** 240 matches; `requirePermission` applied broadly; middleware + lib + tests exist |
| SEC-P1-002 "cross-tenant IDOR family: by-id handlers ignore injected org filter" | Walk tickets/documents/projects-final-transitions | **Partially supported.** tickets DELETE/comments, documents versions/bulk/upload-replace, DNS transitions now org-predicated; residual outlier `client-onboarding` lacks permission gate but is tenant-scoped via `loadOwned`. Marked `partially-fixed` / residual |
| SEC-P1-003 "PLATFORM_ADMIN_KEYS expansion gives 6 MSP roles cross-tenant access" | Read `lib/roles.ts` vs `lib/permissions.ts` | **Supported (unchanged).** `PLATFORM_ADMIN_KEYS` still contains 6 MSP roles; `requireOrgAccess` still bypasses tenant scope for them. Permission middleware deliberately exempts them, creating an inconsistent trust model (SEC-P2-002) |
| SEC-P1-004 "worker SSRF: uptime/website monitors fetch unvalidated URLs" | `grep assertSafeUrl` in worker + route | **Unsupported now — remediated (verified-fixed).** Guard at route create/update and in worker fetch/dispatch/retry; tests present |
| SEC-P1-005 "change-request/DNS transitions lack authorization" | Read governance/dns-changes | **Unsupported now — remediated (verified-fixed).** `requirePermission(...,"manage")` on all transitions |
| SEC-P1-006 "approve_project_task/add_project_task_comment fail under service role" | `grep` RPCs in migrations | **Not reproducible statically.** RPC definitions exist; runtime `auth.uid()` behavior cannot be exercised without a live DB. Marked `Unverified` |
| SEC-P2-001 "Jira/JSM dedup keys not event-unique" | Read `routes/webhooks.ts` keys | **Unsupported now — remediated (verified-fixed).** Keys now include a body digest |
| SEC-P2-002 "prod web CSP uses 'unsafe-inline'; nonce unused" | Read `apps/web/middleware.ts` | **Unsupported now — remediated (verified-fixed).** Prod CSP is `script-src 'self' 'nonce-…' 'strict-dynamic'` with reporting |
| SEC-P2-003 "increment_article_count RPC unhardened" | Read `5302129` | **Unsupported now — remediated (verified-fixed).** search_path pinned, field allowlist, org check, PUBLIC/anon revoked |
| SEC-P2-004 "GET /analytics/summary references nonexistent RPC" | `grep get_analytics_summary` | **Supported — still open (SEC-P2-004).** No definition in any migration/seed |
| SEC-P2-005 "forgot-password uses attacker-controlled Origin" | Read `auth.ts` | **Supported — still open (SEC-P2-003 here).** `req.headers.origin` still used |
| SEC-P3-001 "trust proxy true + dead rate-limit config" | Read `app.ts`, `rate-limit.ts` | **Partially fixed.** `trust proxy` now `1`; `rate-limit-config.ts` no longer present. Marked `partially-fixed` |
| SEC-P3-002 "mark_task_read RPC unvalidated" | Read `5302129` | **Unsupported now — remediated (verified-fixed).** Caller-identity + task/org validation, grants tightened |

## Executive Summary

The security posture of the MCT Portal has changed dramatically since the prior pass. At the previous commit the dominant themes were "the RBAC catalog is cosmetic", "a family of by-id IDORs", and "the worker is an unguarded SSRF sink". At `6286137` those three headline problems are **addressed in code and covered by tests**:

1. **Server-side permission enforcement exists.** `apps/api/src/middleware/permissions.ts` implements `requirePermission(moduleKey, action)` backed by `apps/api/src/lib/permissions.ts` (`resolveEffectivePermissions`), and it is wired into **40 route files / 240 route-level calls**. The tiny `ADMIN_BYPASS_KEYS` = `["super_admin","admin"]` preserves prior admin behaviour without granting every MSP role blanket access. This is the single most important improvement.
2. **By-id tenant scoping is systemic.** `apps/api/src/lib/tenant.ts` provides `assertResourceOrg` / `loadOwned`, and 19 route files use them. The specific prior offenders — `DELETE /tickets/:id`, ticket comment creation, `GET /documents/:id/versions`, document bulk/version-replace (which previously deleted another tenant's storage object), and the DNS-change transitions — now carry organization predicates and/or permission gates. The upload path also pins the storage bucket server-side (`DOCUMENTS_BUCKET = "documents"`).
3. **SSRF is guarded end-to-end.** `assertSafeWebhookUrl` runs at uptime-check create/update, and the worker's `module-tasks.ts`, `webhook-dispatcher.ts`, and `webhook-retry.ts` all call `assertSafeUrl` before `fetch`, with `redirect: "manual"`. The guard now also handles decimal IPv4 and IPv4-mapped IPv6.
4. **Other prior findings are remediated**: Jira/JSM webhook dedup keys now include a body digest; the production web CSP is nonce-based with `strict-dynamic`; `increment_article_count` and `mark_task_read` RPCs are hardened in `5302129`; the CSV file-handling path now byte-sniffs uploads and rejects markup; `trust proxy` is pinned to `1`; and a new `impersonation_log` records platform-admin cross-tenant access.

Remaining risks are materially smaller and cluster into four groups:

- **Two prior findings are still open** and are easy wins: the analytics summary endpoint still calls a `get_analytics_summary` RPC that no migration defines (`SEC-P2-004`), and password-reset emails still derive `redirectTo` from the attacker-controllable `Origin` header (`SEC-P2-003`).
- **An inconsistent trust model for MSP roles.** `requireOrgAccess` still treats `PLATFORM_ADMIN_KEYS` (8 keys, including dispatcher/finance/onboarding-specialist) as cross-tenant, while `requirePermission` treats only `admin`/`super_admin` as bypass. The result is that a low-trust MSP role can reach tenant-scoped *reads* across all tenants via `requireOrgAccess` but is then denied writes by `requirePermission` — a confusing and slightly over-broad read posture (`SEC-P2-002`).
- **A few authorization outliers remain.** `apps/api/src/routes/client-onboarding-command-center.ts` performs mutations with only `requireOrgAccess` + `loadOwned` (no `requirePermission`), despite the module existing in the catalog (`SEC-P2-001`). `notification-preferences` accepts a body `organizationId` without `assertOrgScopeMatches` (`SEC-P3-003`).
- **Structural hardening gaps**: RLS is still bypassed on almost every request because the service-role client is the default (`getScopedClient` allow-lists empty) (`SEC-P2-005`); the `5302116` grant sweep still gives `anon`/`authenticated` full DML on every public table, making RLS the single gate (`SEC-P3-001`); and `resolveEffectivePermissions` performs 4–6 uncached queries per gated request (`SEC-P3-004`, availability/cost).

**Verdict:** Authn 4/5, tenant isolation enforcement 4/5, API permission enforcement 4/5 (was 2/5). There are **no P0/P1 release blockers identified in this pass**. The remaining work is P2/P3 hardening plus two small carried-over fixes. The next release can ship; the two open P2s and the authorization outliers should be scheduled this month.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| Permission middleware | `middleware/permissions.ts` `requirePermission` | `module:action` gate | Implemented, broadly wired (240 calls / 40 files) | Low | Bypass = `super_admin`/`admin`; platform-admin fallback re-resolves org-agnostically |
| Permission resolver | `lib/permissions.ts` `resolveEffectivePermissions` | Effective set | Implemented | Low-Med | Union of role perms + overrides; **uncached** (4–6 queries/call) |
| Org access | `middleware/org-access.ts` | Tenant gate + scope | Implemented + `req.orgScope` | Med | `PLATFORM_ADMIN_KEYS` (8) bypass; body-org assertion present |
| By-id scoping | `lib/tenant.ts` `assertResourceOrg`/`loadOwned` | Tenant-scoped row load | Implemented, 19 files | Low | Cross-tenant platform-admin access logged |
| Role keys | `lib/roles.ts` | Platform-admin mapping | 8 keys | Med | 6 MSP roles are cross-tenant for org-access but not for permission |
| JWT validation | `middleware/auth.ts` | AuthN | HS256-pinned, multi-secret, 5s fallback | Low | Plus opt-in MFA gate |
| MFA | `lib/mfa.ts` | aal2 enforcement | Implemented, opt-in | Low-Med | Fails open on GoTrue error; exempt `/auth/*` |
| Admin gate | `middleware/admin.ts` | Admin-only | `admin`/`super_admin` | Low | |
| CSRF | `middleware/csrf.ts` | Mutation CSRF | Double-submit + Lax | Low-Med | Cookie JS-readable by design; Bearer/skip paths |
| Rate limits | `middleware/rate-limit.ts` | Throttle | SHA-256 token key; per-email auth | Low | `trust proxy 1` |
| Security headers | `middleware/security-headers.ts` | Headers | Complete incl. CSP | Low | Swagger nonce branch |
| Web CSP | `apps/web/middleware.ts` | Prod CSP | Nonce + `strict-dynamic` + reporting | Low | Local dev keeps unsafe-inline |
| SSRF guard | `lib/ssrf-guard.ts` + worker `lib/ssrf-guard.ts` | URL safety | Route + worker | Low | Decimal IPv4 & IPv4-mapped IPv6 handled |
| Upload validation | `lib/upload-validation.ts` | Content checks | Markup reject + byte sniff | Low | Invoked by documents/file-request paths |
| Field encryption | `lib/field-encryption.ts` | PII at rest | Implemented | Med | `plain:` fallback when key unset; wiring depends on `5302135` |
| RLS client swap | `services/supabase.ts` `getScopedClient` | Incremental RLS | Allow-lists empty → service-role | Med | RLS effectively bypassed by default |
| Impersonation audit | `services/impersonation.ts` | Cross-tenant trail | Implemented | Low | Fire-and-forget into `impersonation_log` |
| Tickets | `routes/tickets.ts` | Tickets | `requirePermission`; delete/comment org-scoped | Low | Prior IDOR fixed |
| Documents | `routes/documents.ts` | Docs + shares | Bucket pinned; versions/bulk/upload org-scoped | Low | Prior cross-tenant file delete fixed |
| DNS transitions | `routes/final/dns-changes.ts` | DNS workflow | `requirePermission` + org predicate | Low | Prior gap fixed |
| Change requests | `routes/governance.ts` | State machine | `requirePermission("change-requests","manage")` | Low | Prior gap fixed |
| Client onboarding | `routes/client-onboarding-command-center.ts` | Onboarding CRUD | `loadOwned`, **no** `requirePermission` | Med | Module exists in catalog — SEC-P2-001 |
| Webhooks (inbound) | `routes/webhooks.ts` + `lib/webhook-signature.ts` | Signature verify | Raw-body HMAC; digest dedup | Low | Prior dedup bug fixed |
| Webhook management | `routes/webhook-management.ts` | Outbound CRUD | `requireAdmin`/`requirePermission`; SSRF guard | Low | |
| API keys | `routes/api-keys.ts` | Key CRUD | `requirePermission` | Low | No external consumer of issued keys found |
| Auth lifecycle | `routes/auth.ts` | Sign-in/up/callback/reset/MFA | reset self-only; forgot-password uses `Origin` | Med | SEC-P2-003 |
| Analytics | `routes/analytics.ts` | Admin summary | Calls missing RPC | Med | SEC-P2-004 |
| RLS/grants | `migrations/5302116` | PostgREST access | anon/authenticated full DML | Med | RLS is the only anon gate |
| Permission catalog | `migrations/5302118` + `5302424` | ~90 modules | Seeded, now enforced | Low | `manage` actions added |
| Role catalog | `migrations/5302128` | 8 new roles | Seeded | Med | MSP cross-tenant read posture |
| RLS fixes | `migrations/5302129`, `5302412`, `5302418`, `5302420`, `5302428` | Policy remediation | Present | Low | Idempotent; approved-status filters |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| --- | ---: | --- | --- | --- |
| Auth provider | 4 | `routes/auth.ts` GoTrue PKCE sign-in/callback; `bootstrap_portal_access`; MFA factors via `lib/mfa.ts` | MFA opt-in (default off); no SSO; `Origin`-based reset redirect | Enable `MFA_ENFORCEMENT_ENABLED` for MSP staff; fix reset redirect (SEC-P2-003) |
| Session tokens/cookies | 4 | `mct_session` HttpOnly/Secure/SameSite (auth lib + CSRF cookie config); web middleware exp check | No server-side revocation list; no rotation on privilege change | Session revocation; re-auth on role change |
| JWT validation | 4 | `middleware/auth.ts` HS256 pinned, multi-secret, 5s-bounded Supabase fallback | None material | Rotate secrets per `docs/JWT_ROTATION.md` |
| CSRF/CORS | 3 | `middleware/csrf.ts` double-submit + Lax; `app.ts` CORS allowlist | `CORS_ORIGIN="*"` reflects any origin with credentials (SEC-P3-002); CSRF cookie JS-readable | Reject `*` in production; bind token to session |
| Rate limits | 4 | `middleware/rate-limit.ts` SHA-256 token key, per-email auth (10/15min), 600/15min user | Metrics per-IP; global limiter per-IP | Keep; add per-account limits on new auth flows |
| Security headers | 4 | `security-headers.ts`; web nonce CSP + `strict-dynamic` + reporting | API non-Swagger CSP lacks nonce (minor) | Optional API nonce parity |
| Input/output validation | 4 | Zod schemas on mutations across routes; `lib/validators.ts`; upload byte-sniffing | A few body-org handlers skip `assertOrgScopeMatches` | Add scope assertions (SEC-P3-003) |
| File handling | 4 | `lib/upload-validation.ts`; bucket pinned; signed URLs 1h; share tokens; org-scoped replace | No AV/content scanning; version-replace still removes prior object (now org-scoped) | Consider AV scanning; audit object retention |
| API permissions | 4 | `middleware/permissions.ts` + 240 calls; `ADMIN_BYPASS_KEYS` | `client-onboarding` outlier; uncached resolution | Wire `requirePermission` on onboarding; cache resolution |
| Admin permissions | 4 | `middleware/admin.ts`; `5302424` manage actions | MSP role vs admin bypass inconsistency | Decide platform trust model (SEC-P2-002) |
| Tenant/org/workspace isolation | 4 | `lib/tenant.ts`; IDOR endpoints fixed; org predicates on transitions | `PLATFORM_ADMIN_KEYS` breadth; `notification-preferences` body org | Split internal-role from cross-tenant; add missing scope assertions |
| RLS policies | 3 | Policies present + `5302129`/`5302412`/`5302418` fixes; `is_org_member`/`is_org_approved_member` helpers | API still service-role by default (`getScopedClient` empty); `5302116` anon DML | Follow `docs/RLS-rollout.md`; audit anon DML per table |

## Detailed Review

### Item: Permission enforcement (new `requirePermission`)

- Evidence: `apps/api/src/middleware/permissions.ts`; `apps/api/src/lib/permissions.ts`; 240 `requirePermission(...)` calls across 40 route files.
- What it does: Resolves `module:action` for the acting user in the active org, denies 403 unless present; `super_admin` profiles and `admin`/`super_admin` memberships bypass.
- How it appears to work: `resolveEffectivePermissions(userId, orgId)` unions `role_permissions` across approved memberships in that org, applies `user_permission_overrides`, and the middleware checks the `module:action` key. Org resolution prefers query → body → `X-Active-Org` → `mct_active_org` cookie → `req.orgId` (set by `requireOrgAccessByParam`).
- Dependencies: `memberships`, `role_permissions`, `user_permission_overrides`, `permissions` tables.
- Current controls: Central middleware; admin bypass; explicit fallback re-resolution for platform admins with no membership in the target org.
- Missing controls: No cache (per-request DB fan-out); no per-request permission audit; `client-onboarding` not wired.
- Risks: Unwired outlier (SEC-P2-001); cost/latency (SEC-P3-004).
- Recommended improvement: Wire `requirePermission("client-onboarding-command-center", …)` on the onboarding mutations; add a short-TTL cache keyed by `(userId, orgId)` invalidated on membership/role/override change.
- Suggested tests: Extend `middleware-permissions.test.ts` table-driven role×module×action assertions; add cross-tenant onboarding test.
- Suggested docs: `docs/ACCESS_CONTROL.md` mapping catalog → enforcement.

### Item: Tenant scoping helpers (`assertResourceOrg` / `loadOwned`)

- Evidence: `apps/api/src/lib/tenant.ts`; `req.orgScope` populated in `middleware/org-access.ts`; 92 usages across 19 route files.
- What it does: Loads a row by id, verifies `organization_id` against the caller's resolved scope (404 on mismatch), and logs cross-tenant platform-admin access to `impersonation_log`.
- How it appears to work: Fail-closed: no scope ⇒ 404. Platform admins acting without an explicit org are org-agnostic (audited); otherwise the row must match `scope.orgId`.
- Dependencies: `impersonation_log` table (migration `5302133`).
- Current controls: Central helper + org predicate.
- Missing controls: Not applied in every route (e.g., some split `final/*` and newer modules use inline predicates).
- Risks: Residual inconsistency; a future route could regress by hand-rolling a by-id query.
- Recommended improvement: Lint/CI rule that by-id handlers either use `loadOwned` or include `organization_id`; expand helper use to all split routers.
- Suggested tests: Cross-tenant regression suite for every by-id route.
- Suggested docs: Note the "handler must consume injected/scoped org" rule in architecture docs.

### Item: Platform-admin trust breadth

- Evidence: `apps/api/src/lib/roles.ts` `PLATFORM_ADMIN_KEYS`; `middleware/permissions.ts` `ADMIN_BYPASS_KEYS`; `middleware/org-access.ts` `checkOrgAccess`/`resolveDefaultOrgId`; `services/impersonation.ts`.
- What it does: `requireOrgAccess` treats any of 8 role keys as cross-tenant (bypasses membership checks and is never pinned to a default org); `requirePermission` treats only `admin`/`super_admin` as bypass.
- How it appears to work: A dispatcher can reach `requireOrgAccess`-only reads across tenants; writes are then blocked by `requirePermission` unless the role has the permission in that org (which it typically does not, as it is not a member). Cross-tenant entry is logged via `logImpersonation`.
- Dependencies: role catalog `5302128`; `impersonation_log`.
- Current controls: Impersonation audit trail; catalog-driven writes.
- Missing controls: No separate "internal staff" vs "cross-tenant trust" flag; read breadth for low-trust roles.
- Risks: Over-broad cross-tenant *read* for low-privilege internal roles (SEC-P2-002).
- Recommended improvement: Split `PLATFORM_ADMIN_KEYS` into `PLATFORM_ADMIN_KEYS` (admin/super_admin, full bypass) and a distinct cross-tenant-read set, or require an explicit membership/flag to traverse tenant scope; document the decision.
- Suggested tests: As `dispatcher` in org A, call a `requireOrgAccess`-only GET for org B → assert intended posture.
- Suggested docs: ADR for the MSP operating model and tenant traversal.

### Item: RLS / grants posture

- Evidence: `supabase/migrations/5302116`; `services/supabase.ts` `getScopedClient`; `docs/RLS-rollout.md` (referenced by `apps/api/.env.example`).
- What it does: The API uses the service-role client by default (RLS bypassed); the user-scoped RLS client is only used for modules listed in `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED`, both empty by default. `5302116` grants `anon`/`authenticated` full DML on all public tables, so RLS policies are the only gate for direct PostgREST/anon-key access.
- How it appears to work: RLS is a second line of defence that is currently inactive for API-originated writes; anon-key paths depend entirely on policy coverage.
- Dependencies: policy coverage per table; `is_org_member` / `is_org_approved_member` / `user_has_permission` helpers.
- Current controls: Extensive policies including approved-status fixes (`5302112`, `5302412`, `5302418`); `public_interactions` RLS re-enabled (`5302129`).
- Missing controls: RLS not exercised by the API; broad anon DML baseline.
- Risks: A policy gap on any table is directly reachable with the anon key.
- Recommended improvement: Follow the incremental RLS rollout; generate a per-table report of grants vs policies; restore RLS on any table that is not intentionally public.
- Suggested tests: PostgREST call matrix as anon/authenticated per sensitive table.
- Suggested docs: Keep `docs/RLS-rollout.md` current with per-table readiness.

### Item: Account lifecycle

- Evidence: `apps/api/src/routes/auth.ts`; `lib/mfa.ts`; `lib/mfa-recovery.ts`; migrations `5302127`/`5302427`.
- What it does: Sign-in/up/callback, sign-out, forgot/reset password, MFA enroll/challenge/verify/delete, recovery codes.
- How it appears to work: Reset requires auth + email match; MFA enforcement is opt-in and fails open on GoTrue error; forgot-password builds `redirectTo` from `Origin`.
- Dependencies: Supabase Auth redirect allowlist.
- Current controls: Self-only reset; per-email rate limits; MFA gate.
- Missing controls: Server-side redirect base (SEC-P2-003); session revocation.
- Risks: Reset-email phishing if the redirect allowlist is permissive.
- Recommended improvement: Use `APP_BASE_URL` only; validate `Origin` against the CORS allowlist.
- Suggested tests: `Origin: https://evil.example` ⇒ redirectTo stays `APP_BASE_URL`.
- Suggested docs: `docs/ENVIRONMENT_VARIABLES.md` note that `APP_BASE_URL` is the single reset base.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Auth provider | `routes/auth.ts` | GoTrue PKCE + MFA (opt-in) | No SSO; MFA default off | P3 | Enable MFA for staff; SSO roadmap |
| SEC-002 | Session tokens/cookies | `mct_session` flags | HttpOnly/Secure/Lax | No revocation list | P3 | Session revocation |
| SEC-003 | JWT validation | `middleware/auth.ts` | HS256 pin, multi-secret, bounded fallback | — | — | — |
| SEC-004 | CSRF/CORS | `csrf.ts`, `app.ts` | Double-submit + Lax; allowlist | `*` reflects any origin w/ credentials | P3 | Reject `*` in prod (SEC-P3-002) |
| SEC-005 | Rate limits | `rate-limit.ts` | Token + per-email keying | Metrics per-IP | P3 | Minor |
| SEC-006 | Security headers | `security-headers.ts`, web CSP | Nonce CSP + `strict-dynamic` | API non-Swagger CSP no nonce | P3 | Optional parity |
| SEC-007 | Input/output validation | Zod + `upload-validation.ts` | Strong | Few body-org handlers unscoped | P3 | SEC-P3-003 |
| SEC-008 | File handling | `documents.ts` + `upload-validation.ts` | Bucket pinned, org-scoped, sniffed | No AV scan | P2 | AV scanning backlog |
| SEC-009 | API permissions | `middleware/permissions.ts` | `requirePermission` ×240 | Onboarding outlier; no cache | P2 | SEC-P2-001, SEC-P3-004 |
| SEC-010 | Admin permissions | `middleware/admin.ts` | admin/super_admin | MSP vs admin bypass inconsistency | P2 | SEC-P2-002 |
| SEC-011 | Tenant isolation | `lib/tenant.ts` | `loadOwned`/`assertResourceOrg` | Platform-admin read breadth | P2 | SEC-P2-002 |
| SEC-012 | RLS policies | migrations + `getScopedClient` | Policies present; incremental RLS | Service-role default; anon DML baseline | P2/P3 | SEC-P2-005, SEC-P3-001 |

## Findings

### Finding ID: SEC-P2-001 - Client-onboarding mutations run without `requirePermission` (authorization outlier)

- Severity: P2
- Confidence: High
- Area: API permissions / authorization
- Evidence:
  - `apps/api/src/routes/client-onboarding-command-center.ts:29-30` — router uses only `requireAuth` + `requireOrgAccess`; no `requirePermission` import/call anywhere in the file
  - `apps/api/src/routes/client-onboarding-command-center.ts:129-140` — `POST /` (`createOnboardingRecord`)
  - `apps/api/src/routes/client-onboarding-command-center.ts:142-160` — `PATCH /:id` (`updateOnboardingRecord`)
  - `apps/api/src/routes/client-onboarding-command-center.ts:162-178` — `DELETE /:id` (`deleteOnboardingRecord`)
  - `apps/api/src/routes/client-onboarding-command-center.ts:180-207` — `POST /:id/complete-phase`
  - `supabase/migrations/5302118_permission_matrix_full_catalog.sql:276-279` — catalog defines `client-onboarding-command-center` view/create/edit/delete
  - Contrast: `apps/api/src/routes/governance.ts`, `routes/tickets.ts`, and 38 other route files gate writes with `requirePermission`
- What is happening: Every other module route added in the RBAC remediation uses `requirePermission`, but the client-onboarding router performs create/edit/delete/phase-completion gated only by "any approved member of the org". The rows themselves ARE tenant-scoped (`loadOwned` verifies `organization_id`), so this is not a cross-tenant IDOR; it is an intra-tenant privilege gap.
- Why it matters: The module and its catalog permissions exist and the UI will hide the actions from roles lacking `create/edit/delete`, but the API accepts them from any org member — the exact class of "UI-only RBAC" the prior audit flagged, now isolated to this router.
- User / business impact: A read-only/dispatcher-style role in the tenant can create, edit, delete, and advance onboarding projects directly against the API.
- Security / privacy / reliability impact: Unauthorized data modification within a tenant; audit log is the only artifact.
- Recommended fix: Add `requirePermission("client-onboarding-command-center", "create" | "edit" | "delete")` to the corresponding handlers (create/edit/complete-phase/checklist ⇒ `edit`; `POST /` ⇒ `create`; `DELETE /:id` ⇒ `delete`).
- Suggested validation: Extend the permission matrix test to include the onboarding module; API test as a `client-viewer` calling `POST /api/v1/client-onboarding` ⇒ 403.
- Owner suggestion: API team.
- Effort estimate: S (≤ 0.5 day).
- Dependencies: None (catalog already exists).
- Status: open.
- Endpoint / data path: `POST /api/v1/client-onboarding` → `createOnboardingRecord` → `client_onboarding_command_center_records`.
- Attack path: none identified (intra-tenant capability escalation only).

### Finding ID: SEC-P2-002 - MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)

- Severity: P2
- Confidence: High
- Area: Authorization / tenancy design
- Evidence:
  - `apps/api/src/lib/roles.ts:9-18` — `PLATFORM_ADMIN_KEYS` = `super_admin, admin, dispatcher, engineer, security-analyst, project-manager, finance, onboarding-specialist`
  - `apps/api/src/lib/permissions.ts:26` — `ADMIN_BYPASS_KEYS = ["super_admin", "admin"]` (only these two)
  - `apps/api/src/middleware/org-access.ts:37-60` and `:110-124` — any `PLATFORM_ADMIN_KEYS` membership grants access to every org and logs impersonation
  - `apps/api/src/middleware/permissions.ts:70-86` — permission bypass uses `ADMIN_BYPASS_KEYS`, not `PLATFORM_ADMIN_KEYS`
  - `apps/api/src/routes/organizations.ts` (platform-key org list bypass; per prior audit `:43-53`)
- What is happening: Two different "trusted" role sets exist. A user holding, say, `dispatcher` in any single org (a) passes `requireOrgAccess` for every tenant (no membership required, audited) but (b) is subject to `requirePermission` without an admin bypass. The net effect is broad **read** traversal across all tenants for low-trust internal roles, while writes are correctly denied.
- Why it matters: The prior audit's SEC-P1-003 ("a single low-trust MSP credential is a cross-tenant read pivot") is only partially addressed: the write blow-up is fixed, the read blow-up is not, and the divergence between the two constants is a latent hazard (a future author may "fix" one to match the other in the wrong direction).
- User / business impact: Any leaked dispatcher/onboarding-specialist credential can read every client's tenant-scoped data reachable through `requireOrgAccess`-only GET handlers.
- Security / privacy / reliability impact: Mass tenant data exposure (read); incident complexity. Cross-tenant access is logged in `impersonation_log`, which supports detection.
- Recommended fix: Introduce an explicit distinction: keep `admin`/`super_admin` as full platform admins; for MSP operational roles require an approved membership (or an explicit `can_traverse_tenants` flag) before `requireOrgAccess` grants cross-tenant access. Document the model in an ADR.
- Suggested validation: Test: `dispatcher` (no membership in org B) calls a `requireOrgAccess`-only GET (`GET /api/v1/sla/metrics?organization_id=<B>`) → assert the intended posture; verify `impersonation_log` row exists.
- Owner suggestion: CTO / security lead (policy) + API team (code).
- Effort estimate: M (1–3 days) including the decision record and tests.
- Dependencies: Product/security decision on the MSP operating model.
- Status: open (by-design breadth, flagged for decision; write-side already constrained).
- Endpoint / data path: `requireOrgAccess`-only GET handlers (e.g. `routes/sla.ts`, `routes/search-portal.ts` reads) → service-role query.
- Attack path: Leaked MSP low-trust credential → cross-tenant read across `requireOrgAccess`-only handlers → aggregated client data exposure.

### Finding ID: SEC-P2-003 - Forgot-password email redirect still uses attacker-controlled `Origin` header

- Severity: P2
- Confidence: Medium (depends on the Supabase project's redirect allowlist, which is not in the repo)
- Area: Account lifecycle / phishing
- Evidence:
  - `apps/api/src/routes/auth.ts:281-288` — `redirectTo: \`${req.headers.origin ?? getEnv().APP_BASE_URL}/password-reset\``
  - `apps/api/src/app.ts:101-106` — CORS reflects request `Origin` (and reflects any origin when `CORS_ORIGIN="*"`), i.e. `Origin` is caller-controlled
  - Prior audit flag SEC-P2-005 at commit `75d3926` (same code) — carried forward unchanged
- What is happening: The password-reset email's callback URL is built from the client-supplied `Origin` header rather than a server-side constant. If Supabase's redirect allowlist is permissive (or an attacker Origin matches an allowed prefix), the reset link in the email can point at an attacker host carrying a valid recovery token.
- Why it matters: This is effectively a phishing vector with a *valid* reset link, and it is unchanged since the previous audit.
- User / business impact: Targeted phishing of MSP/client staff; account-takeover assist.
- Security / privacy / reliability impact: ATO vector if the redirect allowlist is permissive; otherwise inert.
- Recommended fix: Always use `getEnv().APP_BASE_URL` for `redirectTo`; if multi-domain support is needed, validate `Origin` against an explicit allowlist and fall back to `APP_BASE_URL`.
- Suggested validation: Unit/API test: `Origin: https://evil.example` ⇒ generated `redirectTo` starts with `APP_BASE_URL`.
- Owner suggestion: API team.
- Effort estimate: S.
- Dependencies: Confirm Supabase `Redirect URLs` configuration (Open Question OQ-3).
- Status: still-open.
- Endpoint / data path: `POST /api/v1/auth/forgot-password` → `supabase.auth.resetPasswordForEmail`.
- Attack path: Attacker sets `Origin` → victim receives legitimate-looking reset email with attacker `redirectTo` → token exfiltration → account takeover.

### Finding ID: SEC-P2-004 - `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines

- Severity: P2
- Confidence: High
- Area: Functional / availability
- Evidence:
  - `apps/api/src/routes/analytics.ts:81-88` — `router.get("/summary", requireAuth, requireAdmin, …); supabase.rpc("get_analytics_summary")`
  - `grep "get_analytics_summary"` across `supabase/migrations/*.sql` and `supabase/seeds/*.sql` — zero definitions
  - Prior audit flag SEC-P2-004 at `75d3926` — still present, unfixed
- What is happening: The admin analytics summary endpoint invokes a Postgres function that no migration creates; PostgREST returns `PGRST202` and the route throws a 500.
- Why it matters: A shipped admin feature is permanently broken and returns server errors; it also masks any real analytics-backend faults.
- User / business impact: Admin analytics summary page non-functional.
- Security / privacy / reliability impact: Availability/correctness (admin-only); no data exposure.
- Recommended fix: Add a `get_analytics_summary` migration (aggregating `store_analytics_events` with tenant gating and `set search_path`) or reimplement the summary as a scoped query; alternatively remove/disable the endpoint until implemented.
- Suggested validation: Integration test against a real DB; assert 200 with seeded events.
- Owner suggestion: API team.
- Effort estimate: S.
- Dependencies: Confirm `store_analytics_events` schema (migration `5302134`/`5302422`).
- Status: still-open.
- Endpoint / data path: `GET /api/v1/analytics/summary` → `rpc("get_analytics_summary")`.
- Attack path: none identified (reliability only).

### Finding ID: SEC-P2-005 - RLS is bypassed on API requests by default (service-role is the default client)

- Severity: P2
- Confidence: High
- Area: Defense in depth / tenant isolation
- Evidence:
  - `apps/api/src/services/supabase.ts:163-186` — `getScopedClient` returns the user-scoped (RLS) client only when `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` contains the module key; otherwise `getSupabaseAdmin()`
  - `apps/api/.env.example` — `RLS_READS_ENABLED=` and `RLS_WRITES_ENABLED=` empty by default; comment states "the API uses the service-role client (RLS bypassed) everywhere"
  - `supabase/migrations/5302116_grant_table_privileges.sql:33-35` — anon/authenticated granted full DML on all public tables
- What is happening: For nearly all requests the API queries with the service-role key, which bypasses RLS. Tenant isolation therefore depends almost entirely on application-layer predicates (`req.orgScope`, `loadOwned`, injected `organization_id`). RLS remains a real gate only for direct anon-key/PostgREST access (which `5302116` makes broad).
- Why it matters: An application-layer mistake (like the ones fixed in this cycle) has no second line of defence; there is no RLS backstop to contain an unscoped query.
- User / business impact: Larger blast radius of any future scoping regression.
- Security / privacy / reliability impact: Single-layer tenant isolation.
- Recommended fix: Execute the documented incremental RLS rollout (`docs/RLS-rollout.md`): enable modules one at a time via the allow-lists, verify member-scoped policies exist, then roll forward. Track per-table readiness.
- Suggested validation: After enabling a module, run the cross-tenant regression suite with the user-scoped client for that module.
- Owner suggestion: Platform lead + DB owner.
- Effort estimate: L (> 3 days, staged).
- Dependencies: Per-table policy completeness; `docs/RLS-rollout.md`.
- Status: open (known, documented, staged).
- Endpoint / data path: All API routes using `getSupabaseAdmin()` directly.
- Attack path: An unscoped application query (future regression) → cross-tenant read/write with no RLS containment.

### Finding ID: SEC-P3-001 - `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)

- Severity: P3
- Confidence: High
- Area: Grants / RLS baseline
- Evidence:
  - `supabase/migrations/5302116_grant_table_privileges.sql:33-35,60-70` — `grant select, insert, update, delete … to service_role / authenticated / anon` for all public tables and `on tables` default privileges
  - Mitigations applied: `5302129` re-enables RLS on `public_interactions` and revokes SELECT/UPDATE/DELETE from anon/authenticated there
- What is happening: The baseline grants give the anon role table-level DML on everything; RLS policies are the only thing preventing an anon-key holder from reading/writing. Any table that is RLS-disabled or has no policy is fully open to the anon key.
- Why it matters: A single policy gap becomes a direct anon data path. This is a latent, table-by-table risk rather than a single exploitable bug.
- User / business impact: Potential exposure if a policy gap exists in production.
- Security / privacy / reliability impact: Defense-in-depth gap.
- Recommended fix: Generate a per-table report of `relrowsecurity` vs policy count and grants; revoke anon DML from any table not intentionally public (keep INSERT for the contact form); prefer least-privilege grants going forward.
- Suggested validation: SQL audit query over `pg_class`/`pg_policies`; assert every anon-granted table has RLS enabled and at least one policy.
- Owner suggestion: DB owner.
- Effort estimate: M.
- Dependencies: None.
- Status: open (partially mitigated by `5302129` for `public_interactions`).
- Endpoint / data path: Direct PostgREST with anon key.
- Attack path: anon key + an RLS-disabled/policy-less table → direct read/write.

### Finding ID: SEC-P3-002 - CORS reflects any origin with credentials when `CORS_ORIGIN="*"`

- Severity: P3
- Confidence: Medium (depends on the deployed `CORS_ORIGIN` value, not visible in the repo)
- Area: CSRF/CORS
- Evidence:
  - `apps/api/src/app.ts:93-108` — when `env.CORS_ORIGIN === "*"`, `origin` callback returns `cb(null, true)` for any Origin, with `credentials: true`
  - `apps/api/src/config/env.ts:9` — `CORS_ORIGIN` default `http://localhost:3000` (safe default); production value unknown
- What is happening: If production sets `CORS_ORIGIN="*"`, the API reflects every request Origin and allows credentials, which (combined with `SameSite=Lax` cookies) widens the surface for cross-site requests from any origin.
- Why it matters: The wildcard branch contradicts the credentialed-request model and could enable cross-origin reads/CSRF-adjacent requests if combined with other weaknesses.
- User / business impact: Depends on deployment configuration; none in the repo default.
- Security / privacy / reliability impact: Weakened origin isolation if misconfigured.
- Recommended fix: In production (`NODE_ENV=production`), reject `CORS_ORIGIN="*"` at env-validation time or at CORS setup; require an explicit origin allowlist.
- Suggested validation: Boot with `NODE_ENV=production CORS_ORIGIN=*` → expect a startup validation error.
- Owner suggestion: API team.
- Effort estimate: S.
- Dependencies: Confirm deployed value (Open Question OQ-2).
- Status: open.
- Endpoint / data path: All API routes (CORS layer).
- Attack path: Attacker origin → reflected `Access-Control-Allow-Origin` + credentials.

### Finding ID: SEC-P3-003 - `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

- Severity: P3
- Confidence: High
- Area: Tenant scoping
- Evidence:
  - `apps/api/src/routes/notification-preferences.ts:45-68` — parses body `organizationId` and upserts `organization_id: organizationId` with no `assertOrgScopeMatches` call
  - `apps/api/src/middleware/org-access.ts:296-300` — `assertOrgScopeMatches` exists (uses it other routes such as store campaigns)
  - Row is keyed to `req.authUser!.userId`, limiting impact
- What is happening: A caller can tag their own notification-preference rows with an arbitrary `organization_id` they are not a member of. Because the row's `user_id` is always the caller, the practical impact is low (self-owned rows), but it is an inconsistency in tenant-scope enforcement.
- Why it matters: Inconsistent enforcement is how scope regressions creep back in; other consumers may later query preferences by org.
- User / business impact: Minimal today.
- Security / privacy / reliability impact: Data-integrity/tenant-hygiene gap.
- Recommended fix: Call `assertOrgScopeMatches(req, organizationId)` after parsing, or derive the org from `req.orgId` and ignore the body value.
- Suggested validation: API test: user of org A PUTs `organizationId = orgB` → 403.
- Owner suggestion: API team.
- Effort estimate: S.
- Dependencies: None.
- Status: open.
- Endpoint / data path: `PUT /api/v1/notification-preferences` → `notification_preferences` upsert.
- Attack path: none identified (self-scoped rows).

### Finding ID: SEC-P3-004 - `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request

- Severity: P3
- Confidence: High
- Area: Availability / performance
- Evidence:
  - `apps/api/src/lib/permissions.ts:49-152` — sequential queries: `profiles`, `memberships`, then parallel `role_permissions` + `user_permission_overrides`, then `permissions`
  - `apps/api/src/middleware/permissions.ts:54-86` — the middleware calls `resolveEffectivePermissions` per request and may call it a second time (org-agnostic fallback at `:81-86`)
- What is happening: Every `requirePermission`-gated request performs multiple uncached DB round-trips (up to two resolver invocations). There is no TTL cache; `middleware/cache.ts` caches responses, not permissions.
- Why it matters: Cost and tail latency scale with request rate; a hot endpoint under load multiplies DB queries, and there is no bound on concurrent resolver work.
- User / business impact: Slower responses under load; higher DB cost.
- Security / privacy / reliability impact: Availability/cost pressure; not a direct vulnerability.
- Recommended fix: Add a short-TTL (e.g. 30–60s) in-process cache keyed by `(userId, orgId|"any")`, invalidated on membership/role/override change (reuse the `invalidateCache` pattern).
- Suggested validation: Unit test cache hit/miss; load test a gated endpoint and compare query counts.
- Owner suggestion: API team.
- Effort estimate: S–M.
- Dependencies: Cache invalidation hooks on membership/permission mutations.
- Status: open.
- Endpoint / data path: All `requirePermission`-gated routes → permissions tables.
- Attack path: none identified (reliability/cost only).

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| --- | --- | --- | --- | --- | --- |
| Unauthorized onboarding mutations within a tenant | P2 | Certain (by construction) | Tenant data integrity | SEC-P2-001 | Wire `requirePermission` on onboarding |
| Low-trust MSP credential = cross-tenant read pivot | P2 | Medium (credential leak) | Mass client-data exposure | SEC-P2-002 | Split internal-role vs platform trust |
| Reset-email phishing via `Origin` | P2 | Low-Med | ATO assist | SEC-P2-003 | Fixed server-side redirect base |
| Broken admin analytics summary | P2 | Certain | Feature outage | SEC-P2-004 | Add/repair the RPC |
| No RLS backstop on API queries | P2 | Certain (by config) | Larger blast radius on any scoping regression | SEC-P2-005 | Incremental RLS rollout |
| anon DML baseline + any policy gap | P3 | Low | Direct anon data path | SEC-P3-001 | Per-table grants/policy audit |
| CORS wildcard with credentials | P3 | Low (depends on deploy) | Origin-isolation weakening | SEC-P3-002 | Reject `*` in production |
| Body-org scope inconsistency | P3 | Low | Tenant hygiene | SEC-P3-003 | `assertOrgScopeMatches` |
| Permission resolver cost under load | P3 | Medium | Latency/cost | SEC-P3-004 | Cache |

## Recommendations

### Immediate / Release Blocking

None. No P0/P1 blockers were identified at this commit.

### This Week

1. Wire `requirePermission("client-onboarding-command-center", …)` on the onboarding mutations (SEC-P2-001) — smallest change with the clearest capability gap.
2. Fix the forgot-password redirect to use `APP_BASE_URL` only (SEC-P2-003) — carried over from the prior audit.
3. Decide and document the MSP-role trust model (SEC-P2-002): separate internal roles from cross-tenant traversal; keep the `impersonation_log` trail.

### This Month

4. Repair or remove `GET /analytics/summary` (SEC-P2-004).
5. Add `assertOrgScopeMatches` to `notification-preferences` PUT (SEC-P3-003).
6. Reject `CORS_ORIGIN="*"` in production (SEC-P3-002).
7. Add a TTL cache to `resolveEffectivePermissions` (SEC-P3-004).
8. Begin the incremental RLS rollout and produce the per-table grants/policy audit (SEC-P2-005, SEC-P3-001).

### Later / Platform Evolution

9. Session revocation and re-auth on privilege change; enable MFA for all platform-key holders.
10. AV/content scanning for uploads; object-retention review for version replacement.
11. SSO for MSP staff; per-permission tenant scoping.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --- | --- | --- | --- |
| Add `requirePermission` to onboarding mutations | Closes the lone RBAC outlier | `apps/api/src/routes/client-onboarding-command-center.ts` | Role × action API test |
| Hardcode `APP_BASE_URL` in forgot-password | Kills the reset phishing vector | `apps/api/src/routes/auth.ts:287` | `Origin`-spoof test |
| `assertOrgScopeMatches` in notification-preferences | Removes a scope inconsistency | `apps/api/src/routes/notification-preferences.ts` | Cross-org PUT → 403 |
| Reject `CORS_ORIGIN="*"` in prod | Prevents credentialed wildcard CORS | `apps/api/src/app.ts`, `config/env.ts` | Boot validation test |
| Add permission TTL cache | Cuts DB fan-out per request | `apps/api/src/lib/permissions.ts` | Cache hit/miss test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| --- | --- | --- | --- | --- |
| `requirePermission` on client-onboarding | P2 | API team | S | — |
| Reset redirect uses `APP_BASE_URL` | P2 | API team | S | Supabase redirect-URL audit |
| MSP role trust decision + ADR | P2 | CTO/security | M | Product decision |
| `get_analytics_summary` RPC | P2 | API team | S | Analytics schema |
| RLS incremental rollout (per-module allow-lists) | P2 | Platform lead + DB owner | L | Policy completeness |
| Permission resolver cache | P3 | API team | S–M | Invalidation hooks |
| `assertOrgScopeMatches` sweep | P3 | API team | S | — |
| Production CORS hardening | P3 | API team | S | — |
| anon grant/policy per-table audit | P3 | DB owner | M | — |
| Session revocation + MFA for staff | P3 | Platform lead | M | — |
| AV scanning for uploads | P3 | API/platform | M | Storage pipeline |

## Suggested Tests

- **Permission matrix (regression)**: for each role × module × action in the catalog, a table-driven API test asserts 200/403 against a real DB (not mocks). Extend `apps/api/src/__tests__/middleware-permissions.test.ts`.
- **Onboarding authorization (new)**: `client-viewer` calls `POST /api/v1/client-onboarding`, `PATCH /:id`, `DELETE /:id`, `POST /:id/complete-phase` ⇒ 403.
- **Cross-tenant regression suite**: org-A user vs org-B objects for tickets, documents (versions/bulk/upload-replace/shares), projects sub-routes, governance transitions, DNS transitions, api-keys, webhook endpoints, onboarding ⇒ 404/403 with zero side effects (verify storage objects intact).
- **MSP trust posture**: `dispatcher` without membership in org B calls `requireOrgAccess`-only GETs ⇒ assert the documented posture; assert an `impersonation_log` row exists.
- **Auth**: forgot-password with `Origin: https://evil.example` ⇒ `redirectTo` stays `APP_BASE_URL`; reset-password for another email ⇒ 403.
- **SSRF (worker + route)**: create uptime check pointing at `169.254.169.254`, hex/octal/decimal-encoded private hosts, and `http://api:4000/health` ⇒ 400; seed a private-URL row directly and assert the worker blocks it (`apps/worker/src/lib/ssrf-guard.test.ts` already covers the guard).
- **CORS**: boot with `NODE_ENV=production CORS_ORIGIN=*` ⇒ startup validation failure.
- **RPC integration** (`supabase db test`): `increment_article_count` with `field_name='version'` ⇒ rejected; `mark_task_read` for a foreign user/org ⇒ rejected; `approve_project_task` under service-role API call ⇒ confirm expected behavior (closes OQ-4).
- **RLS/anon**: PostgREST call matrix as `anon`/`authenticated` per sensitive table; assert no read/write where RLS is disabled or policy-less.
- **CSP**: assert production `Content-Security-Policy` `script-src` contains `'nonce-'` and `'strict-dynamic'` on app routes.
- **Load/perf**: query-count assertion for a `requirePermission`-gated endpoint before/after the resolver cache.

## Suggested Documentation Updates

- `docs/ACCESS_CONTROL.md` (new or update): catalog → enforcement mapping; note the `requirePermission` rollout, `ADMIN_BYPASS_KEYS`, and the `client-onboarding` wiring.
- ADR for the MSP operating model: define "internal role" vs "cross-tenant traversal" and the `PLATFORM_ADMIN_KEYS` decision (SEC-P2-002), referencing `impersonation_log`.
- `docs/ENVIRONMENT_VARIABLES.md`: document `MFA_ENFORCEMENT_ENABLED`, `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED`, `FIELD_ENCRYPTION_KEY`, `METRICS_TOKEN`, and that `APP_BASE_URL` is the single source for reset links.
- `docs/RLS-rollout.md`: keep the per-module readiness list current as RLS_* allow-lists are enabled (SEC-P2-005).
- Update the API endpoint inventory: mark `GET /analytics/summary` as broken until the RPC exists (SEC-P2-004); list state-transition endpoints and their required permissions.
- `docs/RPC_SECURITY.md` (new): SECURITY DEFINER checklist (search_path, grants, column allowlists, caller model) reflecting the `5302129` standard.

## Open Questions

| Question | Why it matters | Evidence needed |
| --- | --- | --- |
| OQ-1: What is the exact commit SHA at HEAD? | Verifies the audit is bound to `6286137` | `git rev-parse HEAD` (git unavailable here); confirm via CI/remote |
| OQ-2: What is the deployed `CORS_ORIGIN` in production? | Determines SEC-P3-002 severity | Production env/infra config (out of repo) |
| OQ-3: Is the Supabase project's `Redirect URLs` allowlist strict? | Determines SEC-P2-003 exploitability | Supabase dashboard config |
| OQ-4: Does `auth.uid()` return NULL for the API's service-role RPC calls (`approve_project_task`, `add_project_task_comment`)? | Prior SEC-P1-006; determines whether those endpoints fail in production | Run the routes against a hosted DB with a real session |
| OQ-5: Which modules have been enabled in `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` in any environment? | Determines actual RLS coverage (SEC-P2-005) | Deployment env config |
| OQ-6: Is broad cross-tenant read for `dispatcher`/`onboarding-specialist` an accepted requirement? | Drives SEC-P2-002 fix direction | Product/security decision |
| OQ-7: Are there RLS-disabled or policy-less tables still covered by the `5302116` anon DML grant? | Determines SEC-P3-001 exposure | `select relname, relrowsecurity from pg_class …` + policy counts on the hosted DB |

## Appendix

### A. Route authorization coverage (target commit)

| Route group | Auth | Tenant scope | Permission gate | Notes |
| --- | --- | --- | --- | --- |
| `tickets.ts` | `requireAuth` (router) | org predicate on by-id; delete/comment scoped | `requirePermission("tickets", …)` on mutations | Prior IDOR fixed |
| `documents.ts` | `requireAuth` | bucket pinned; versions/bulk/upload org-scoped | `requirePermission("documents", …)` | Prior cross-tenant delete fixed |
| `projects.ts` | `requireAuth` | scoped; `loadOwned` | `requirePermission("projects", …)` | |
| `governance.ts` | `requireAuth` | scoped | `requirePermission("change-requests","manage")` on transitions | Prior gap fixed |
| `final/dns-changes.ts` | `requireAuth` | org predicate on update | `requirePermission("dns-changes","manage")` | |
| `client-onboarding-command-center.ts` | `requireAuth` | `loadOwned` | **none** | SEC-P2-001 |
| `notification-preferences.ts` | `requireAuth` + `requireOrgAccess` | self rows; body org unscoped | n/a | SEC-P3-003 |
| `search-portal.ts` | `requireAuth` | query limited to caller memberships | n/a (read-only) | |
| `store/*` | `requireAuth` + `requireAdmin` (+ `requireOrgAccess`) | scoped where needed | admin-gated | |
| `webhook-management.ts` | `requireAuth` + `requireAdmin`/`requirePermission` | scoped | SSRF guard on create/update | |
| `api-keys.ts` | `requireAuth` | scoped | `requirePermission("api-keys", …)` | No key consumer found |

### B. Trust-set divergence (`PLATFORM_ADMIN_KEYS` vs `ADMIN_BYPASS_KEYS`)

```
PLATFORM_ADMIN_KEYS = super_admin, admin, dispatcher, engineer,
                      security-analyst, project-manager, finance,
                      onboarding-specialist          (8)  -> org-access traversal
ADMIN_BYPASS_KEYS   = super_admin, admin                 (2)  -> permission bypass
```

### C. Middleware order (from `app.ts`)

`helmet → cors → express.json(10mb, raw body) → cookieParser → securityHeaders → inputSanitizer → IP limiter (skips /health, loopback, /api/v1/webhooks/*) → rateLimitByUser → requestId → requestLogger → idempotency → csrf → requestTimeout(30s) → routers → /metrics (METRICS_TOKEN gate) → notFound → errorHandler`.

CSRF skips: any `Authorization` header, the five auth endpoints (`sign-in`, `sign-up`, `forgot-password`, `reset-password`, `callback`), `/api/v1/public/*`, `/api/v1/webhooks/*`.

### D. Threat model (summary)

- **In-scope attackers**: unauthenticated internet (public endpoints, webhooks, analytics track, anon-key PostgREST); authenticated client user (own tenant + residual scope inconsistencies); low-trust MSP employee (cross-tenant read by design, audited); compromised account; malicious tenant admin.
- **Assets**: tenant data (tickets, documents incl. storage, projects, billing, governance, onboarding), platform admin console, webhook delivery, worker jobs, PII.
- **Primary remaining threat paths**: MSP cross-tenant read (SEC-P2-002); onboarding privilege gap (SEC-P2-001); reset-email phishing (SEC-P2-003); RLS-not-backstopped tenant isolation (SEC-P2-005); anon DML baseline with any policy gap (SEC-P3-001).
- **Mitigations present today**: server-side `requirePermission` across 40 route files; `loadOwned`/`assertResourceOrg` tenant scoping; SSRF guards at route + worker; upload byte-sniffing; nonce CSP; MFA gate (opt-in); impersonation audit log; PII-redacted logging.

### E. Security regression checklist

- [ ] Every module mutation route has a `requirePermission` gate (no outliers) — **currently fails** (SEC-P2-001)
- [x] Every by-id query resolves within the caller's tenant scope
- [x] No SECURITY DEFINER function without `set search_path` + grants review (5302129 standard)
- [x] No user-controlled URL fetched without the SSRF guard at write-time and fetch-time
- [x] Webhook dedup keys include an event-unique component
- [x] CSP contains a nonce + `strict-dynamic` for `script-src` on app routes
- [x] `trust proxy` no longer unrestricted
- [ ] Password reset email uses server-side base URL only — **currently fails** (SEC-P2-003)
- [ ] Cross-tenant regression suite green (add the onboarding module)
- [x] Permission-matrix API tests present (`middleware-permissions.test.ts`)
- [ ] RLS exercised by the API for at least one module — **currently fails** (SEC-P2-005)

### F. Aggregate counts

- Findings: 8 total (P0: 0, P1: 0, P2: 5, P3: 3).
- Prior findings re-checked: 13; remediated/verified-fixed: 8; still-open: 2 (SEC-P2-003, SEC-P2-004); partially-fixed: 1; not reproducible statically: 1; downgraded to design note: 1.
- Route files with `requirePermission`: 40 (of 63 route modules). Files without any permission/admin gate: `auth`, `client-onboarding-command-center`, `docs`, `final`, `health`, `me`, `notification-preferences`, `profiles`, `public`, `search-portal`, `sla`, `store`, `webhooks` — of these, only `client-onboarding` has mutations that should be gated (SEC-P2-001); the rest are user-self, public, aggregate-read, or admin-gated internally.
- Secret-material matches found: 0.
