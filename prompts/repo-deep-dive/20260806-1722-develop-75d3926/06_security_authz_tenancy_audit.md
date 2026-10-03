# Security, Authorization, and Tenancy Audit

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `20260806-1722-develop-75d3926`
- Repository: `C:\temp\mainecybertech-portal`
- Branch: `develop`
- Commit SHA: `75d39269310fcc09826fe532d5838d3a53d1739a`
- Generated at: 2026-08-06 (UTC-4)
- Auditor: principal-level repository auditor (fresh pass — no reliance on prior audit claims)
- Area code: SEC
- Output path: `prompts/repo-deep-dive/20260806-1722-develop-75d3926/06_security_authz_tenancy_audit.md`
- Scope limitations: Static code review of the current working tree only. No live database, no production connectivity, no dynamic testing. DB-level claims (RLS policy effectiveness, RPC `auth.uid()` behavior under service-role JWTs, supabase-js behavior with `undefined` filter values) are marked `Verify` where they depend on runtime behavior. Migration files were read as source of truth for schema/RLS.

## Scope

Reviewed at HEAD `75d3926`:

- `apps/api/src/routes/*.ts` — all 54 route files, focused on: new role-catalog endpoint `me.ts` `/permissions`; by-id IDOR patterns on tickets/documents/projects/api-keys/webhook-management/governance (change-requests, risks)/final (dns-changes, procurement)/uptime-monitor/status-page; state-machine transitions (submit/approve/reject/implement/verify/assess); bulk endpoints; upload paths; share endpoints; auth endpoints.
- `apps/api/src/middleware/*.ts` — `auth.ts`, `admin.ts`, `org-access.ts`, `csrf.ts`, `rate-limit.ts`, `rate-limit-config.ts`, `security-headers.ts`, `cache.ts`, `security.ts`, `idempotency.ts`.
- `apps/api/src/lib/*` — `roles.ts`, `webhook-signature.ts`, `idempotency.ts`, `ssrf-guard.ts`, `webhook-dispatcher.ts`.
- `apps/api/src/app.ts`, `main.ts`.
- `apps/web/middleware.ts` (domain routing + auth gating + CSP).
- `apps/worker/src/tasks/*.ts` — module-tasks (m365-hardening, backup-dr, dmarc, status-maintenance, website/uptime, phishing, domain-monitor, patch-compliance, endpoint-security, automation), webhook-dispatcher, webhook-retry.
- `supabase/migrations/` — RLS/grants (5302104–5302117), permission catalog (5302118), state columns (5302125, 5302127), role catalog expansion (5302128), RPC definitions (5302026, 5302098, 5302111, 5302122).

Not reviewed (out of scope for this pass): web server components/actions in depth, E2E specs, Terraform/CI/CD config, dependency CVEs.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/middleware/org-access.ts` | Source | Tenant isolation core | `checkOrgAccess` + `resolveDefaultOrgId` + injection pattern |
| `apps/api/src/lib/roles.ts` | Source | Role→platform-admin mapping | `PLATFORM_ADMIN_KEYS` = 8 keys incl. 6 new MSP roles |
| `apps/api/src/middleware/auth.ts` | Source | JWT validation | local verify + Supabase fallback w/ 5s timeout |
| `apps/api/src/middleware/admin.ts` | Source | Admin gating | admin/super_admin keys only |
| `apps/api/src/middleware/csrf.ts` | Source | CSRF | double-submit, SameSite=Lax, domain cookie |
| `apps/api/src/middleware/rate-limit.ts` / `rate-limit-config.ts` | Source | Rate limits | per-user sub-based keying (fixed) vs `slice(7,27)` (dead config) |
| `apps/api/src/app.ts` | Source | Middleware order, route mounts | webhook skip in IP limiter; CORS; trust proxy |
| `apps/api/src/routes/tickets.ts` | Source | IDOR review | DELETE unscoped; comment-create cross-tenant; PATCH scoped |
| `apps/api/src/routes/documents.ts` | Source | IDOR review | versions/bulk unscoped; upload version-replace destructive; shares ok |
| `apps/api/src/routes/projects.ts` | Source | IDOR review | sub-routes/tasks/comments/updates/reorder unscoped; RPC calls |
| `apps/api/src/routes/governance.ts` | Source | State-machine transitions | no role/permission gate on approve/reject/implement/verify |
| `apps/api/src/routes/final.ts` | Source | DNS transitions | approve/reject/implement unscoped by id |
| `apps/api/src/routes/webhook-management.ts` | Source | Outbound webhook CRUD | requireAdmin on mutations; GET list by-id injection |
| `apps/api/src/routes/api-keys.ts` | Source | API key CRUD | no requireAdmin; no authn consumer exists |
| `apps/api/src/routes/me.ts` | Source | Permission endpoint | effective permission union; overrides; superadmin bypass |
| `apps/api/src/routes/auth.ts` | Source | Auth lifecycle | reset requires auth+email match; forgot-password Origin redirectTo |
| `apps/api/src/routes/search.ts` | Source | Global search | requireAdmin; orgs query unscoped (by design for admins) |
| `apps/api/src/routes/organizations.ts` | Source | Org list bypass | any platform-admin key sees all tenants |
| `apps/api/src/lib/ssrf-guard.ts` | Source | SSRF | DNS-resolve backstop; gaps: hex/octal IPv4 |
| `apps/api/src/lib/webhook-dispatcher.ts` | Source | Outbound dispatch | inline path has SSRF guard |
| `apps/api/src/routes/uptime-monitor.ts` | Source | SSRF input | `POST /checks` accepts any URL, no guard |
| `apps/worker/src/tasks/module-tasks.ts` | Source | Worker scans | `websiteMonitorCheck` fetches `uptime_checks.url` unguarded |
| `apps/worker/src/tasks/webhook-dispatcher.ts` | Source | Worker dispatch | NO SSRF guard in worker path |
| `supabase/migrations/5302116_grant_table_privileges.sql` | Migration | Grants | full DML to anon on ALL public tables (RLS is the only gate) |
| `supabase/migrations/5302118_permission_matrix_full_catalog.sql` | Migration | Permission catalog | ~90 modules × view/create/edit/delete |
| `supabase/migrations/5302128_role_catalog_expansion.sql` | Migration | 8 new roles | 6 MSP roles + 2 client roles; demo users guarded |
| `supabase/migrations/5302111_harden_bulk_update_rpc.sql` | Migration | RPC hardening | table whitelist; per-row check only when caller_uid present |
| `supabase/migrations/5302122_mark_task_read_rpc.sql` | Migration | RPC | no org/membership validation; granted to authenticated |
| `supabase/migrations/5302098_article_feedback_fields.sql` | Migration | RPC | SECURITY DEFINER, no search_path, PUBLIC execute, no whitelist |
| `apps/web/middleware.ts` | Source | Web gating | exp-only JWT check; CSP `'unsafe-inline'` scripts; nonce unused |
| `apps/api/src/middleware/cache.ts` | Source | Cache keying | mount-scoped `baseUrl+path`, per-user keys — collision fix verified |
| `apps/api/src/middleware/security-headers.ts` | Source | Headers | HSTS, COOP, CORP, frame deny, nosniff |
| `apps/api/src/__tests__/projects.test.ts` | Test | RPC mocks | tests mock `rpc()` — do not exercise real RPC auth |
| `apps/api/src/__tests__/me-permissions.test.ts` | Test | Permission endpoint | new-catalog engineer role resolution covered |

## Executive Summary

The platform's authn and transport security are strong: Supabase PKCE auth, local JWT verification with a bounded Supabase fallback, HttpOnly/Secure/SameSite session cookies, a solid security-header set, per-user rate limiting with a fixed keying bug, and a mount-scoped per-user response cache. The recent work on the permission catalog (5302118), the expanded role catalog (5302128), and the RPC/RLS hardening is real and mostly sound **as data**.

However, three systemic problems dominate this audit:

1. **The granular permission catalog is not enforced server-side.** There is no `requirePermission`-style middleware anywhere in `apps/api/src`. Every route is gated only by `requireAuth` + `requireOrgAccess` (i.e., *any approved membership in the org*) or, on a small subset, `requireAdmin`. The ~90-module `module:view/create/edit/delete` matrix and the new `client-viewer` read-only role exist only in the DB and the UI (sidebars, RouteGuard). Any `client_user` can call `POST /projects`, `PATCH /documents`, `DELETE /tickets`, or approve a CAB change request directly against the API. The "read-only" `client-viewer` role is write-capable at the API layer.

2. **A family of by-id IDORs remains on handlers that ignore the org filter the middleware injects.** The `requireOrgAccess` injection pattern (middleware writes `req.query.organization_id`) only protects handlers that read it. Verified unscoped by-id paths: `DELETE /tickets/:id`, `POST /tickets/:id/comments`, `GET /documents/:id/versions`, `POST /documents/bulk/folder` + `/bulk/metadata`, the upload version-replacement path (which deletes the victim's storage object), all of `projects` phases/milestones/dependencies/tasks/comments/updates/reorder, and `POST /dns-changes/:id/{approve,reject,implement}`. A client-scoped user of org A who knows a UUID in org B can modify or destroy org B's data. Exploitation requires knowing target UUIDs (not exposed by enumeration — IDs are v4), which is why this is P1 rather than P0, but the write/destroy impact is real (including file deletion in another tenant's storage bucket).

3. **The 5302128 role expansion multiplied the cross-tenant blast radius.** `PLATFORM_ADMIN_KEYS` now contains 6 low-trust MSP roles (dispatcher, engineer, security-analyst, project-manager, finance, onboarding-specialist). Holding **any one** of these roles in **any single membership** bypasses tenant scoping entirely (org-access middleware, orgs list, ticket comment-edit admin checks). The `dispatcher` role, for example, gets `documents:view` + `projects:view` + `tickets:create/edit` across all tenants. This is an intentional MSP-operating-model decision, but it means the credential of the least-privileged cross-tenant employee is now a cross-tenant read pivot over every client's documents. Role-to-platform-admin conflation with no per-permission tenant scope deserves explicit review.

Secondary issues: worker SSRF through `uptime_checks.url` (no SSRF guard on the worker's `fetch`), state-machine transitions (change-requests, dns-changes) with no authorization beyond org membership, `approve_project_task`/`add_project_task_comment` RPCs that gate on `auth.uid()` — which is NULL when the API calls them with the service-role key, so those endpoints appear to always fail in production (fail-closed, but broken), Jira/JSM webhook dedup keys that are not event-unique (silent missed syncs within 24h), production CSP with `'unsafe-inline'` in `script-src` while a nonce is generated but never applied, a SECURITY DEFINER `increment_article_count` RPC without `search_path` pinning or column whitelist, and a `get_analytics_summary` RPC referenced by the API but missing from all migrations (the admin analytics summary endpoint always 500s).

**Verdict:** Authn 4/5, tenant-isolation enforcement 2/5, API permission enforcement 2/5. The next release should treat server-side permission enforcement and the by-id IDOR family as release blockers.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| JWT local verify | `middleware/auth.ts:47-71` | Fast-path auth | Implemented | Low | Multi-secret rotation; Supabase fallback bounded (5s) |
| Org access | `middleware/org-access.ts` | Tenant gate | Implemented + injected | Medium | Injection only protects handlers that use it; platform-role bypass |
| Platform roles | `lib/roles.ts` | Platform-admin keys | 8 keys | High | 6 new MSP roles → cross-tenant access from any single membership |
| Admin gate | `middleware/admin.ts` | Admin-only routes | admin/super_admin | Low | Correct; not used on most module routes |
| Permission enforcement | (none) | `module:action` server checks | **Absent** | Critical | Catalog is UI-only; no `requirePermission` exists |
| CSRF | `middleware/csrf.ts` | Mutation CSRF | Double-submit + Lax | Low-Med | Cookie readable by JS by design; Bearer skips |
| Rate limits | `middleware/rate-limit.ts` | Per-user/IP | Per-user 600/15min | Low | `trust proxy: true`; webhook paths skip IP limiter |
| Security headers | `middleware/security-headers.ts` | Header set | Complete | Low | HSTS/COOP/CORP/Frame-Deny |
| Cache | `middleware/cache.ts` | Response cache | Per-user, mount-scoped keys | Low | Collision fix verified |
| Tickets CRUD | `routes/tickets.ts` | Tickets | PATCH scoped; **DELETE unscoped**; comment-create unscoped | High | IDOR family |
| Documents | `routes/documents.ts` | Docs + shares | versions/bulk/upload-replace unscoped | High | Cross-tenant file delete via version replace |
| Projects | `routes/projects.ts` | Projects + tasks | Most by-id sub-routes unscoped | High | Tasks/comments/phases/milestones/deps/reorder |
| Governance transitions | `routes/governance.ts` | Change/risk state machine | Org-scoped but no role gate | High | Any member can approve/reject/implement/verify |
| DNS transitions | `routes/final.ts` | DNS change workflow | Unscoped by id, no role gate | High | Cross-tenant approve/reject/implement |
| Webhook management | `routes/webhook-management.ts` | Outbound webhook CRUD | requireAdmin on mutations; GETs injection-scoped | Medium | OK-ish; masking of secret partial |
| API keys | `routes/api-keys.ts` | Key CRUD | No requireAdmin; no consumer of keys exists | Low | Dormant feature |
| me/permissions | `routes/me.ts` | Effective permissions | Correct union + overrides | Low | Reliable source of truth for UI |
| Auth lifecycle | `routes/auth.ts` | Sign-in/up/callback/reset | reset gated to self; forgot-password uses Origin | Medium | Origin redirectTo (P2) |
| Global search | `routes/search.ts` | Admin search | requireAdmin; orgs query global | Low | By design for admins |
| SSRF guard | `lib/ssrf-guard.ts` | URL safety | DNS-resolve backstop | Low-Med | Gaps: hex/octal IPv4; not used on uptime checks |
| Uptime monitor | `routes/uptime-monitor.ts` | Status checks | URL unvalidated at create | High | Worker fetches arbitrary URLs |
| Worker scans | `tasks/module-tasks.ts` | 13 scan tasks | Mostly bookkeeping | Medium | websiteMonitorCheck = SSRF sink |
| Worker dispatch | `tasks/webhook-dispatcher.ts` | Outbound webhooks | No SSRF guard in worker path | Medium | Guard only in inline path |
| RLS/grants | `migrations/5302116` | PostgREST access | Full DML granted to anon on all tables | Medium | RLS is the only anon gate; public_interactions RLS disabled by design |
| Permission catalog | `migrations/5302118` | ~90 modules | Seeded | High | Not enforced server-side |
| Role catalog | `migrations/5302128` | 8 new roles | Seeded + demo users guarded | High | Platform-admin conflation |
| Web middleware | `apps/web/middleware.ts` | Routing + gating | exp-only check; CSP unsafe-inline | Medium | Nonce unused in CSP |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Auth provider | 4 | Supabase GoTrue + PKCE (`auth.ts` sign-in/callback); `bootstrap_portal_access` | No MFA enforcement; no SSO | Add MFA policy for MSP staff; SSO roadmap |
| Session tokens/cookies | 4 | `mct_session` HttpOnly/Secure/SameSite=Lax (CSRF middleware and cookie flags in auth lib); middleware exp check | Cookie not rotated on privilege change; no session revocation list | Server-side session revocation; re-auth for role changes |
| JWT validation | 4 | `auth.ts:47-71` local verify + multi-secret + 5s-bounded Supabase fallback; middleware exp check | Middleware checks exp only (by design) | Rotate secrets per `docs/JWT_ROTATION.md` |
| CSRF/CORS | 3 | Double-submit + SameSite=Lax + Bearer skip + auth-endpoint skips; CORS allowlist | CSRF cookie is JS-readable (double-submit tradeoff); `CORS_ORIGIN=*` possible in dev; webhook paths skip IP limiter | Restrict dev CORS; consider `csrf_token` bound to session |
| Rate limits | 3 | Per-user sub-based keying (`rate-limit.ts:12-38`); auth per-email 10/15min; 600/15min user | `trust proxy: true` (any XFF spoofable hop); `rate-limit-config.ts` dead code still uses broken `slice(7,27)` keying; webhooks skip IP limiter | Pin trust proxy to Cloudflare/Caddy IPs; delete dead config |
| Security headers | 4 | helmet + `security-headers.ts` (HSTS, COOP, CORP, Frame-Deny, nosniff, Referrer-Policy, Permissions-Policy) | Web prod CSP uses `'unsafe-inline'` script-src; nonce unused | Apply nonce to script-src; drop unsafe-inline for app routes |
| Input/output validation | 3 | Zod on most mutations; `inputSanitizer` detection-only; export helpers | Some CRUD routes accept raw body (`final.ts` crud); no response schema enforcement | Extend Zod to remaining generic crud handlers |
| File handling | 3 | Extension blocklist + MIME allowlist + 50MB limit; signed URLs 1h; share tokens 32-byte random + expiry/revoke/max_access | Upload bucket user-controlled; version-replace deletes any doc's storage object; no AV/content scanning; SVG blocked (good) | Pin bucket to `documents`; org-scope version-replace; scan uploads |
| API permissions | 2 | `requireAdmin` on ~8 route groups; **no `module:action` enforcement anywhere** | Permission catalog is UI-only; client-viewer is write-capable | Build `requirePermission(module, action)` middleware; apply to all module routes |
| Admin permissions | 3 | `requireAdmin` admin/super_admin only; admin pages gated server-side | New MSP roles bypass tenant scoping by design; roles/users endpoints admin-only (correct) | Review dispatcher-level cross-tenant scope; admin-role separation |
| Tenant/org/workspace isolation | 2 | Middleware injection covers handlers that read `organization_id`; platform-admin bypass; **multiple unscoped by-id handlers** | IDOR family on tickets/documents/projects/dns | Scope every by-id handler; add cross-tenant regression tests |
| RLS policies | 3 | Policies present on most tables; 5302116 grants fixed; 5302111/5302112/5302100 hardenings | API runs as service_role (RLS bypassed — second line only); anon granted DML on all tables; RLS disabled on public_interactions (by design) | Audit policy coverage per table; enable RLS everywhere except intentional public tables |

## Detailed Review

### Item: Org-access middleware and the injection pattern

- Evidence: `apps/api/src/middleware/org-access.ts` (all), routes use `req.query.organization_id`.
- What it does: For requests without an explicit org, resolves the caller's default org from approved memberships and **injects it into `req.query`**; platform-admin-role users get no injection and a `orgAccessPlatformAdmin` flag.
- How it appears to work: Client-scoped users are pinned to their first approved membership; handlers that filter by `req.query.organization_id` become tenant-scoped for free.
- Dependencies: Every route handler's discipline in reading the injected query param.
- Current controls: Injection itself; explicit-org validation via `checkOrgAccess`.
- Missing controls: **No enforcement that handlers actually apply the filter.** The pattern silently fails open.
- Risks: IDOR family (finding SEC-P1-002).
- Recommended improvement: Centralize: create `requireTenantRow(router, table)` helpers that fetch the row with the org predicate and attach it to `req`; or move all row lookups behind a scoped data-access layer.
- Suggested tests: Cross-tenant test for every by-id mutation: user of org A vs object of org B → 404/403.
- Suggested docs: Update `docs/API_ERROR_HANDLING.md` / architecture notes with the "handler must consume injected org" rule.

### Item: Permission model (catalog vs enforcement)

- Evidence: `supabase/migrations/5302118_permission_matrix_full_catalog.sql`, `5302128_role_catalog_expansion.sql`, `routes/me.ts`, `apps/web/lib/permissions.ts` (UI), zero matches for `requirePermission` in `apps/api/src`.
- What it does: DB has ~90 modules × view/create/edit/delete (+ manage/export) with role assignments; `/me/permissions` computes effective sets; web sidebars/RouteGuard render from it.
- How it appears to work: Appears enforced; it is not.
- Dependencies: Only the UI consumes it.
- Current controls: `requireAdmin` (admin/super_admin) on users/roles/memberships/orgs-mutations/bulk-tickets/search/analytics.
- Missing controls: Server-side `module:action` enforcement on every module route.
- Risks: Any client_user = org-level superuser of their tenant; client-viewer = de facto writer; state transitions (CAB approve) open to any member.
- Recommended improvement: Add `requirePermission(moduleKey, actionKey)` middleware that resolves via the same logic as `me.ts` (cached), apply to module routers (read=view, mutations=create/edit/delete), and keep `requireAdmin` for admin-only consoles.
- Suggested tests: For each role in the matrix, call the API directly and assert expected 403/200.
- Suggested docs: `docs/ACCESS_CONTROL.md` — matrix → enforcement mapping.

### Item: RPC security (SECURITY DEFINER surface)

- Evidence: `5302026` (`approve_project_task`, `add_project_task_comment`), `5302122` (`mark_task_read`), `5302098` (`increment_article_count`), `5302111` (`bulk_update_with_version`), `5302035` (`bootstrap_portal_access`).
- What it does: SECURITY DEFINER functions execute with owner rights, bypassing RLS.
- How it appears to work: `approve_project_task` checks `auth.uid()` membership — but the API invokes it via the service-role client where `auth.uid()` is NULL → `raise exception 'Not authenticated'` → the API route 500s (`Verify` against hosted DB; high confidence from JWT shape).
- Dependencies: `grant execute` posture; API call pattern (service role vs user token).
- Current controls: search_path pinned on 5302122/5302111; 5302098 has **no** search_path pin; 5302111 has table whitelist + per-row check when `auth.uid()` present.
- Missing controls: `increment_article_count` — column whitelist, search_path, revoke PUBLIC; `mark_task_read` — caller validation; `approve_project_task`/`add_project_task_comment` — a way for the API to pass the acting user (e.g., `set_config('request.jwt.claims'...)` or accept `p_user_id` with API-level verification).
- Risks: Direct PostgREST invocation by any authenticated user (counter tampering, read-state pollution); broken approval/portal-comment features in production.
- Recommended improvement: Standardize an RPC security template: `set search_path = public`, revoke PUBLIC/anon, whitelist dynamic identifiers, validate caller either via `auth.uid()` **or** via an API-passed identity that the API has already authenticated.
- Suggested tests: Direct PostgREST RPC calls as anon/authenticated/service_role in `supabase db test` or E2E; assert the API route returns 200 against the real DB.
- Suggested docs: RPC inventory in `docs/` with the auth model of each.

### Item: Webhook security

- Evidence: `routes/webhooks.ts` (stripe/jira/jsm/m365), `lib/webhook-signature.ts`, `lib/idempotency.ts`, `routes/webhook-management.ts`, `lib/webhook-dispatcher.ts`, `tasks/webhook-dispatcher.ts`.
- What it does: Inbound: signed (Stripe HMAC constructEvent, Jira/JSM x-hub-signature sha256 timing-safe, M365 clientState + timestamp). Outbound: HMAC-signed payloads, idempotency keys, retry/DLQ task, delivery logs.
- How it appears to work: Good signature coverage; 5-min timestamp tolerance; 24h idempotency TTL.
- Current controls: Signature verify, timestamp check, atomic claim, SSRF guard on create/update + inline dispatch.
- Missing controls: Worker dispatch path has no SSRF guard (webhook endpoints validated at create-time only — DNS-rebinding residual); Jira/JSM dedup keys not event-unique (`jira-${webhookEvent}-${issueKey}`) → legitimate repeats suppressed for 24h.
- Risks: Missed syncs (ticket/task statuses stale); residual rebinding SSRF.
- Recommended improvement: Include an event-unique component (Jira/JSM id or timestamp) in dedup keys; add SSRF guard to worker dispatch; alert on DLQ growth.
- Suggested tests: Replay same JSM transition twice with different payloads → both applied; replay identical payload → deduped.

### Item: File handling

- Evidence: `routes/documents.ts` (upload, signed-url, shares), `storage` buckets `documents` (private, 50MB) / `avatars` (public, 2MB).
- What it does: multer memory uploads with extension blocklist (incl. `.svg`, `.js`, `.html`) + MIME allowlist; signed URLs (1h); share tokens (32-byte random, expiry ≤1y, revoked/max_access).
- How it appears to work: Public share endpoint (`GET /shares/:token`) is outside `requireAuth` — intended; membership check on share CRUD.
- Current controls: Ext/MIME/size; token entropy; expiry; org check on shares.
- Missing controls: Bucket name is client-supplied (`req.body.bucket`); version-replacement (`POST /upload` with `documentId`) fetches the target doc by id with **no org predicate** and deletes the previous storage object — cross-tenant file destruction; no content scanning; `GET /documents/:id/versions` unscoped (leaks `storage_path` metadata cross-tenant).
- Risks: Cross-tenant data loss (storage object removal); path/metadata disclosure.
- Recommended improvement: Pin bucket to `documents`; scope `documentId` resolution to the caller's org; scope versions endpoints; consider AV scanning (ClamAV) for uploads.
- Suggested tests: Upload with `documentId` of another org's doc → 403/404 and storage object intact.

### Item: Worker scans

- Evidence: `apps/worker/src/tasks/module-tasks.ts`.
- What it does: 13 bookkeeping scans (m365, backup-dr, dmarc, status, uptime, phishing, domain, patch, endpoint, automation, sla, qbr, saas).
- How it appears to work: Service-role reads/writes across all tenants (by design for a worker).
- Current controls: 10s fetch timeout on websiteMonitorCheck; interval-based due checks.
- Missing controls: **No SSRF guard on `uptime_checks.url` fetch** (finding SEC-P1-004); several tasks compute but discard results (patch/endpoint compliance), making them near-no-ops; error messages from fetch may embed internal hostnames stored into `uptime_results` (visible in status page UI).
- Risks: Internal network probing via worker; weak telemetry.
- Recommended improvement: Add `assertSafeWebhookUrl`-equivalent DNS+IP guard to the uptime fetch; persist computed compliance values; redact error strings.
- Suggested tests: Create a check pointing at `http://169.254.169.254/latest/meta-data` as client_user → rejected at create; worker refuses private IPs.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| SEC-001 | Auth provider | `routes/auth.ts` | GoTrue PKCE, callback exchange | No MFA/SSO | P2 | MFA for MSP staff |
| SEC-002 | Session tokens/cookies | auth lib cookie flags | HttpOnly/Secure/Lax | No revocation | P3 | Session revocation |
| SEC-003 | JWT validation | `middleware/auth.ts` | local verify + fallback | — | — | — |
| SEC-004 | CSRF/CORS | `middleware/csrf.ts`, `app.ts` | double-submit + Lax | JS-readable token; `*` CORS in dev | P3 | Bound token to session |
| SEC-005 | Rate limits | `middleware/rate-limit.ts` | per-user sub keying | trust-proxy spoof; webhook skip | P2 | Pin proxy IPs |
| SEC-006 | Security headers | `security-headers.ts` | complete | Web CSP unsafe-inline | P2 | Apply nonce |
| SEC-007 | Input/output validation | Zod schemas | good coverage | generic crud routes raw | P3 | Extend schemas |
| SEC-008 | File handling | `routes/documents.ts` | ext/mime/size | bucket pinning; version-replace IDOR | P1 | Pin + scope |
| SEC-009 | API permissions | (none) | requireAdmin only | **No module:action enforcement** | P1 | requirePermission middleware |
| SEC-010 | Admin permissions | `middleware/admin.ts` | admin/super_admin | — | — | — |
| SEC-011 | Tenant isolation | `middleware/org-access.ts` | injection pattern | unscoped by-id handlers | P1 | Scope all by-id |
| SEC-012 | RLS policies | migrations 53021xx | policies present | service_role bypasses RLS; anon DML granted | P2 | Per-table policy audit |

## Findings

### Finding ID: SEC-P1-001 - Granular permission catalog is not enforced server-side (UI-only RBAC)

- Severity: P1
- Confidence: High
- Area: API permissions / authorization
- Evidence:
  - `apps/api/src/routes/*.ts` — no route imports or invokes any permission check; `grep requirePermission` across `apps/api/src` returns zero matches
  - `supabase/migrations/5302118_permission_matrix_full_catalog.sql` — full catalog + role assignments
  - `supabase/migrations/5302128_role_catalog_expansion.sql` — `client-viewer` = read-only role (all `view` perms)
  - `apps/api/src/middleware/org-access.ts:124-166` — `requireOrgAccess` only validates approved membership
  - `apps/web/lib/permissions.ts` + layouts — UI-side enforcement only
- What is happening: The ~90-module `module:view/create/edit/delete` matrix and all role assignments exist only in the database and the web UI. Every API module route is reachable by any user with any approved membership in the org (or by platform roles across all orgs). A `client_user` (or the "read-only" `client-viewer`) can `POST /api/v1/projects`, `PATCH /api/v1/documents/:id`, `DELETE /api/v1/tickets/:id`, and `POST /api/v1/governance/change-requests/:id/approve` directly.
- Why it matters: The platform markets role-based access (read-only viewers, technicians, finance, etc.) but the API does not enforce any of it. The permission system is cosmetic; the actual capability boundary is "any org member ≈ full write access within the tenant".
- User / business impact: Client-visible privilege escalation inside the tenant; "read-only" viewer accounts can delete data; compliance claims (SOC 2, RBAC) are not backed by enforcement.
- Security / privacy / reliability impact: Unauthorized create/edit/delete of tickets, documents, projects, governance records; CAB/change approvals by unauthorized members; audit log is the only artifact.
- Recommended fix: Implement `requirePermission(moduleKey, actionKey)` middleware resolving the same effective-permission logic as `routes/me.ts` (with a short cache), apply it per-module (view/create/edit/delete), and keep `requireAdmin` for admin consoles. Wire permission changes to invalidate the cache (reuse `invalidateCache` pattern from `middleware/cache.ts`).
- Suggested validation: Table-driven API test: for every role × module × action in the catalog, assert 200/403 against the real DB (not mocks); E2E: log in as Vera Viewer (`viewer.real@acme.example`) and attempt `DELETE /api/v1/tickets/:id` → 403.
- Owner suggestion: Platform/API lead + security engineer.
- Effort estimate: 2–3 days for middleware + route wiring; 1 day for the matrix test.
- Dependencies: None (permission data already exists).
- Status: Open.

### Finding ID: SEC-P1-002 - Cross-tenant IDOR family: by-id handlers ignore the injected org filter

- Severity: P1
- Confidence: High
- Area: Tenant isolation / IDOR
- Evidence:
  - `apps/api/src/routes/tickets.ts:445-472` — `DELETE /:id` fetches and deletes by `id` only (no `organization_id` predicate)
  - `apps/api/src/routes/tickets.ts:295-358` — `POST /:id/comments` inserts with caller-supplied org but ticket id from URL; no ticket-org verification (cross-tenant comment injection + notification emails to the victim org)
  - `apps/api/src/routes/documents.ts:629-665` — `GET /:id/versions` / `/:id/versions/:versionId` — no org predicate (leaks `storage_path` metadata)
  - `apps/api/src/routes/documents.ts:540-627` — `POST /bulk/folder` and `/bulk/metadata` call `bulk_update_with_version` with arbitrary document ids; RPC per-row check is skipped for service-role calls (`5302111:98` — `caller_uid IS NOT NULL` gate), so no org validation on the API path
  - `apps/api/src/routes/documents.ts:317-371` — `POST /upload` version-replacement fetches `documentId` with no org predicate and **removes the previous storage object** (`supabase.storage.from(current.storage_bucket).remove([current.storage_path])`)
  - `apps/api/src/routes/projects.ts:190-272` (`projectSubRoute` phases/milestones/dependencies), `:525-1051` tasks/comments/updates/reorder/read — none apply an org predicate
  - `apps/api/src/routes/final.ts:318-398` — `dns-changes/:id/{approve,reject,implement}` — no org predicate
  - `apps/api/src/middleware/org-access.ts:147-150` — org injection only affects handlers that read `req.query.organization_id`
- What is happening: The middleware pins client users to their default org by injecting `organization_id` into `req.query`, but the handlers listed above never read it, so the queries run tenant-blind against the service-role client (RLS bypassed).
- Why it matters: Any authenticated client user of org A who knows a UUID in org B can delete org B tickets, replace/delete org B documents (including removing the storage object), modify project tasks/comments, reorder tasks, transition DNS change requests, and inject comments into org B tickets. UUIDs are v4 (not enumerable), but they leak through notification rows, share records, exports, emails, browser history, and pasted links.
- User / business impact: Cross-tenant data loss and modification by low-privilege accounts; tenant isolation guarantees are false for these endpoints.
- Security / privacy / reliability impact: Integrity + availability impact across tenants; incident/forensics complexity.
- Recommended fix: For every by-id route, either (a) read `req.query.organization_id` (injected) and add the predicate, or (b) resolve the row with the org predicate and return 404 when absent. Add the org predicate to `document_versions` queries, to the RPC `updates` arrays (or pass `organization_id` into `bulk_update_with_version`), and scope the upload `documentId` resolution to the caller's org before touching storage.
- Suggested validation: Regression tests: org-A user vs org-B objects for every listed endpoint → 404/403 and zero side effects (verify storage object still exists for the upload case).
- Owner suggestion: API team; add to the existing `__tests__` cross-tenant suite.
- Effort estimate: 1–2 days.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P1-003 - PLATFORM_ADMIN_KEYS expansion gives low-trust MSP roles cross-tenant access from a single membership

- Severity: P1
- Confidence: High
- Area: Tenant isolation / privilege design
- Evidence:
  - `apps/api/src/lib/roles.ts:9-18` — `PLATFORM_ADMIN_KEYS` = super_admin, admin, dispatcher, engineer, security-analyst, project-manager, finance, onboarding-specialist
  - `apps/api/src/middleware/org-access.ts:29-43` (`checkOrgAccess`), `:83-97` (`resolveDefaultOrgId`) — any membership with a platform key grants access to every org, including orgs the user has no membership in
  - `apps/api/src/routes/organizations.ts:43-53` — the orgs list bypass returns all tenants (with full row details) to any platform-key holder
  - `apps/api/src/routes/tickets.ts:401-404` — comment-edit "org admin" check uses `isPlatformAdminKey`
  - `supabase/migrations/5302128_role_catalog_expansion.sql:46-63` — `dispatcher` receives `tickets:view/create/edit`, `documents:view`, `projects:view`, `assets:view`, `sla:view` — across ALL tenants once the role key grants the bypass
- What is happening: The role-key list is the single switch that flips a user from org-scoped to cross-tenant. The new role catalog added 6 low-trust operational roles to that list. A dispatcher account — typically the least-privileged internal hire — can read every client's documents/projects/assets and create/edit tickets in every tenant, and the orgs list reveals all tenant names/domains/details.
- Why it matters: Blast radius of any compromised internal credential now spans all tenants. There is no per-permission tenant scope; "MSP staff" and "cross-tenant trust" are conflated in one constant.
- User / business impact: A single leaked dispatcher/onboarding-specialist credential exposes every client's data.
- Security / privacy / reliability impact: Mass tenant data exposure; incident response complexity.
- Recommended fix: (1) Separate "internal role" from "cross-tenant access" — e.g., require explicit `is_platform_admin` flag on the membership or a distinct privilege, so roles can be granted without the bypass; (2) scope the bypass per-permission where feasible (e.g., dispatcher tickets triage can be limited to orgs with an approved membership); (3) at minimum, add MFA + anomaly detection for all platform-key holders and audit membership grants of these roles.
- Suggested validation: Test: user with `dispatcher` in org A attempts `GET /api/v1/organizations` and `GET /api/v1/documents?organization_id=<orgB>` — assert the intended posture; document the decision.
- Owner suggestion: CTO/security lead — this is a policy decision first, code second.
- Effort estimate: 1 day to split the flag; policy review ongoing.
- Dependencies: Role catalog design decision.
- Status: Open (by-design per commit 1a6e0d2, but the breadth warrants a decision record).

### Finding ID: SEC-P1-004 - Worker SSRF: uptime/website monitors fetch unvalidated URLs

- Severity: P1
- Confidence: High
- Area: SSRF
- Evidence:
  - `apps/api/src/routes/uptime-monitor.ts:14-22` — `checkCreateSchema.url` accepts any `http(s)` URL; `:143-177` `POST /checks` persists it without `assertSafeWebhookUrl`
  - `apps/worker/src/tasks/module-tasks.ts:273` — `fetch(check.url)` in `websiteMonitorCheck` (no SSRF guard, 10s timeout)
  - `apps/api/src/lib/ssrf-guard.ts` — the guard exists and is used only by webhook-management
  - No permission enforcement on `POST /checks` (see SEC-P1-001) — any org member can create checks
- What is happening: Any authenticated user (any role) can create an uptime check pointing at internal addresses (`http://api:4000/health`, `http://redis:6379`, `http://169.254.169.254/...`, other tenants' services). The worker then fetches those URLs, storing the HTTP status, timing, and fetch error text into `uptime_results`, which the status-page UI renders.
- Why it matters: SSRF from the worker process — internal network probing (status-code oracle, timing side channels, hostname/port disclosure in error messages). Limited exfiltration (no body read), but internal service discovery + reachability mapping.
- User / business impact: Internal network recon; DoS of internal services from repeated probes.
- Security / privacy / reliability impact: SSRF (OWASP API-4); internal topology disclosure.
- Recommended fix: Run the same `assertSafeWebhookUrl` (DNS + private-IP rejection) at create/update time AND inside the worker before `fetch`; add a URL-format allowlist (https-only); redact `error_message` before persisting.
- Suggested validation: E2E: create check with `http://169.254.169.254/latest/meta-data` → 400; seed a check with a private-IP URL directly in DB → worker refuses and marks the check failed.
- Owner suggestion: API + worker teams.
- Effort estimate: 0.5–1 day.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P1-005 - Change-request and DNS state-machine transitions lack authorization

- Severity: P1
- Confidence: High
- Area: Authorization / business logic
- Evidence:
  - `apps/api/src/routes/governance.ts:179-282` — `POST /change-requests/:id/{approve,reject,implement,verify}` — only `requireAuth` + `requireOrgAccess` (org membership); no `requireAdmin`, no permission check
  - `apps/api/src/routes/final.ts:318-398` — `POST /dns-changes/:id/{approve,reject,implement}` — same, plus no org predicate on the update (cross-tenant, see SEC-P1-002)
  - `apps/api/src/routes/governance.ts:285-319` — `POST /risks/:id/assess` — org-scoped but no role gate
- What is happening: The CAB approve/reject buttons are permission-gated in the UI (permission matrix), but the API endpoints perform no authorization beyond org membership: any `client_user` of the org can approve or reject a change request, mark it implemented/verified, or approve DNS changes.
- Why it matters: Change-management and DNS-change approval are governance controls (segregation of duties); API-level bypass nullifies the workflow.
- User / business impact: Unauthorized infrastructure changes; compliance failure (change control).
- Security / privacy / reliability impact: Integrity of the change process; DNS hijack-adjacent capability for low-privilege users.
- Recommended fix: Gate transitions by permission (`change-requests:edit` + an `approve` capability or `requireAdmin`), enforce a role check (e.g., admin or security-analyst) on approve/verify, and add the org predicate on DNS transitions.
- Suggested validation: API test: `client_user` calls approve on `pending_review` change request → 403; admin → 200.
- Owner suggestion: API team + security.
- Effort estimate: 0.5 day.
- Dependencies: requirePermission middleware (SEC-P1-001) if reused.
- Status: Open.

### Finding ID: SEC-P1-006 - approve_project_task / add_project_task_comment RPCs gate on auth.uid(), which is NULL under service-role API calls — endpoints fail in production

- Severity: P1
- Confidence: Medium-High (runtime behavior to verify on hosted DB)
- Area: Functional security / RPC auth model
- Evidence:
  - `supabase/migrations/5302026...:2013-2127` — `approve_project_task` and `add_project_task_comment` declare `v_user_id uuid := auth.uid();` and `raise exception 'Not authenticated'` when null
  - `apps/api/src/routes/projects.ts:998-1051` — routes invoke these via `getSupabaseAdmin().rpc(...)` (service-role client)
  - `apps/api/src/__tests__/projects.test.ts:573-604` — tests mock `rpc()` and never exercise the real DB auth model
  - Supabase service-role JWTs carry no `sub` claim, so `auth.uid()` is NULL for service-role PostgREST calls
- What is happening: The API calls SECURITY DEFINER RPCs with the service-role client; the RPCs require `auth.uid()` (the caller's user id), which is NULL for service-role JWTs. The functions therefore raise `Not authenticated` and the routes return 500 — `POST /projects/:id/tasks/:taskId/approve` and `/portal-comment` appear to never succeed in production. (`mark_task_read` avoids this by taking `p_user_id` as a parameter.)
- Why it matters: If confirmed, the task-approval and portal-comment features are broken in every environment; the failure is fail-closed (no privilege bypass), but it defeats the workflow and erodes trust in the RPC design pattern.
- User / business impact: Client task approval and portal comments broken in production.
- Security / privacy / reliability impact: Availability; demonstrates an RPC auth-model mismatch that could recur in new RPCs.
- Recommended fix: (1) Confirm on hosted: run the route as an authenticated user against the real DB. (2) Align the model: either call these RPCs with a user-scoped client/token, or add `p_user_id` parameters (API sets them from `req.authUser.userId` after `requireAuth`), mirroring `mark_task_read`. (3) Add an integration test that runs the RPCs under a real (or `set_config`-injected) JWT and asserts the route returns 200.
- Suggested validation: `supabase db test` / E2E: POST approve with a real session → expect 200; SQL editor: `select approve_project_task(...)` without claims → expect `Not authenticated`.
- Owner suggestion: API team.
- Effort estimate: 0.5 day incl. verification.
- Dependencies: None.
- Status: Open (verify first).

### Finding ID: SEC-P2-001 - Jira/JSM webhook dedup keys are not event-unique — legitimate deliveries suppressed for 24h

- Severity: P2
- Confidence: High
- Area: Webhook delivery / data integrity
- Evidence:
  - `apps/api/src/routes/webhooks.ts:246` — `jiraKey = \`jira-${event.webhookEvent ?? "unknown"}-${issueKey ?? "unknown"}\``
  - `apps/api/src/routes/webhooks.ts:324` — `jsmKey` same shape
  - `apps/api/src/lib/idempotency.ts:49` — `IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60`
  - `apps/api/src/routes/webhooks.ts:96` — Stripe uses `stripe-${event.id}` (event-unique, correct); `:427-432` — M365 uses a payload digest (correct)
- What is happening: Jira/JSM webhooks dedupe on `(webhookEvent, issueKey)` only. A ticket that transitions status A→B→C within 24h fires two `jira:issue_updated` events for the same issue key; the second is treated as a duplicate and dropped, so the synced status goes stale. Every legitimate repeat transition within 24h is silently lost.
- Why it matters: Replay protection must not collapse distinct events; retries need idempotency, but idempotency keys must be event-unique.
- User / business impact: Stale ticket/task statuses in the portal and admin views; manual reconciliation.
- Security / privacy / reliability impact: Data integrity (status drift); no security impact but feeds false operational decisions.
- Recommended fix: Include an event-unique component in the key — Jira/JSM payloads include `timestamp`/`id`/`issue.updated`/comment ids; e.g., `jira-${webhookEvent}-${issueKey}-${timestamp}-${digest-of-body}`.
- Suggested validation: Unit test on key derivation; E2E replay of two distinct transitions → both applied.
- Owner suggestion: API team.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P2-002 - Production web CSP uses 'unsafe-inline' script-src; generated nonce is never applied

- Severity: P2
- Confidence: High
- Area: Security headers / XSS mitigation
- Evidence:
  - `apps/web/middleware.ts:38-44` — prod CSP: `script-src 'self' 'unsafe-inline'`; nonce generated (`:47-51`, `:108`) and set as header `x-nonce`, but never referenced in the CSP
  - `apps/api/src/middleware/security-headers.ts:22-31` — API CSP has `script-src 'self'` (correct), but inline script tags in API-rendered pages (Swagger) rely on the nonce branch
- What is happening: The web middleware computes a per-request nonce and ships `x-nonce`, but the production CSP never uses it — `'unsafe-inline'` remains, so any injected inline script executes. The nonce work is dead.
- Why it matters: XSS protection is weaker than intended; a single XSS (e.g., markdown comment rendering, stored comment body) becomes full session takeover.
- User / business impact: Increased XSS exploitability in the portal/admin.
- Security / privacy / reliability impact: XSS → session/CSRF-token theft (the CSRF cookie is JS-readable, amplifying this).
- Recommended fix: Apply `script-src 'self' 'nonce-${nonce}'` for app routes and add the nonce attribute to inline scripts via the `x-nonce` header (Next.js `nonce` support), or drop inline scripts to `'self'` where feasible.
- Suggested validation: `axe-core`/CSP validator on login + portal pages; E2E assert the CSP header contains the nonce token.
- Owner suggestion: Web team.
- Effort estimate: 0.5–1 day.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P2-003 - increment_article_count RPC: SECURITY DEFINER without search_path pinning, PUBLIC execute, no column whitelist

- Severity: P2
- Confidence: High
- Area: RPC security / hardening
- Evidence:
  - `supabase/migrations/5302098_article_feedback_fields.sql:4-9` — `CREATE OR REPLACE FUNCTION increment_article_count(article_id uuid, field_name text) ... SECURITY DEFINER` — no `set search_path`, no `revoke ... from public`, no column whitelist
  - `apps/api/src/routes/edu-automation.ts:249-266` — route passes `field` derived from a boolean (safe), but the RPC itself is directly callable via PostgREST by any authenticated user with arbitrary `field_name`/`article_id`
- What is happening: `%I` identifier quoting prevents SQL injection, but the function (a) can increment any numeric column of `knowledge_articles` (e.g., `version` breaking optimistic locking, or id-type columns causing errors), (b) has no org/membership validation (cross-tenant counter tampering via PostgREST), and (c) lacks `set search_path = public` (search-path hijack vector if schema objects are attacker-influenced).
- Why it matters: Defense-in-depth failures on a SECURITY DEFINER surface; direct PostgREST abuse is possible by any authenticated user.
- User / business impact: Counter tampering; potential optimistic-locking disruption.
- Security / privacy / reliability impact: Integrity (low-severity), hardening gap.
- Recommended fix: `set search_path = public`; whitelist `field_name IN ('helpful_count','not_helpful_count')`; add an org/membership check on the article; `revoke execute from public, anon` and grant to `authenticated` only (or drop the RPC and use a plain update).
- Suggested validation: SQL test: call with `field_name='version'` → error; direct call without membership → denied.
- Owner suggestion: API team.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P2-004 - GET /analytics/summary references a nonexistent RPC — always 500s

- Severity: P2
- Confidence: High
- Area: Functional / observability
- Evidence:
  - `apps/api/src/routes/analytics.ts:78-88` — `supabase.rpc("get_analytics_summary")`
  - Full search of `supabase/migrations/*.sql` and `supabase/seeds/*.sql` for `get_analytics_summary` / `analytics_summary` — no definition exists
- What is happening: The admin analytics summary endpoint calls a Postgres function that no migration creates; PostgREST returns PGRST202 → the endpoint always 500s in production.
- Why it matters: Broken admin feature; indicates the store analytics module is partially wired.
- User / business impact: Admin analytics summary page broken.
- Security / privacy / reliability impact: Availability (admin-only); no data exposure.
- Recommended fix: Add the `get_analytics_summary` RPC (aggregating `store_analytics_events` with tenant gating) or reimplement the summary as a scoped query.
- Suggested validation: Integration test against a real DB; E2E on the analytics page.
- Owner suggestion: API team.
- Effort estimate: Small.
- Dependencies: None.
- Status: Open.

### Finding ID: SEC-P2-005 - forgot-password email redirect uses attacker-controlled Origin header

- Severity: P2
- Confidence: Medium (depends on Supabase redirect allowlist config)
- Area: Account lifecycle / phishing
- Evidence:
  - `apps/api/src/routes/auth.ts:269-292` — `redirectTo: \`${req.headers.origin ?? getEnv().APP_BASE_URL}/password-reset\``
- What is happening: The password-reset email's callback link is built from the `Origin` header, which the client fully controls. If the Supabase project's redirect allowlist accepts arbitrary URLs (or the attacker can set Origin to an allowed-looking host), the reset email can point to an attacker domain carrying a valid recovery token.
- Why it matters: Phishing with a *valid* reset link; account-takeover assist.
- User / business impact: Targeted phishing of MSP/client staff.
- Security / privacy / reliability impact: Account takeover vector if Supabase allowlist is permissive.
- Recommended fix: Hardcode the redirect base from env (`APP_BASE_URL`) and validate Origin against the CORS allowlist before echoing it.
- Suggested validation: Test with `Origin: https://evil.example` → redirectTo still uses `APP_BASE_URL`.
- Owner suggestion: API team.
- Effort estimate: Small.
- Dependencies: Supabase dashboard redirect-allowlist audit.
- Status: Open (verify Supabase `Redirect URLs` config).

### Finding ID: SEC-P3-001 - Trust-proxy-wide rate limiting and stale rate-limit config

- Severity: P3
- Confidence: High
- Area: Rate limits
- Evidence:
  - `apps/api/src/app.ts:79` — `app.set("trust proxy", true)`
  - `apps/api/src/middleware/rate-limit-config.ts:16-35` — `apiLimiter`/`adminLimiter` still key Bearer tokens with the old `auth.slice(7, 27)` (the bug fixed in `rate-limit.ts`); file is dead code (no imports)
- What is happening: (a) Trusting all proxies means `req.ip` honors the leftmost `X-Forwarded-For` hop — spoofable if any non-Caddy path reaches the API (Caddy overwrites XFF in the normal path, so practical risk is low but fragile). (b) The dead limiter config would re-introduce the shared-bucket bug if ever wired up.
- Why it matters: Rate-limit bypass and drift between two limiter implementations.
- Recommended fix: Pin `trust proxy` to Cloudflare/Caddy source IPs (or `loopback,linklocal,uniquelocal`); delete `rate-limit-config.ts`.
- Suggested validation: Header-spoof test behind the proxy; grep for imports.
- Owner suggestion: API team.
- Effort estimate: Small.
- Status: Open.

### Finding ID: SEC-P3-002 - mark_task_read RPC has no caller/org validation (PostgREST-direct write)

- Severity: P3
- Confidence: High
- Area: RPC hardening
- Evidence: `supabase/migrations/5302122_mark_task_read_rpc.sql:12-30` — inserts/upserts `project_task_comment_reads` for arbitrary `p_user_id`/`p_task_id`/`p_organization_id`; granted to `authenticated`
- What is happening: Any authenticated user can invoke `mark_task_read` directly via PostgREST with another user's id and arbitrary task/org ids, polluting or shifting read-state rows.
- Why it matters: Low-impact integrity pollution (read tracking only); still an unvalidated SECURITY DEFINER write surface.
- Recommended fix: Validate `p_organization_id` membership for the acting `auth.uid()` (or drop the user-id parameter and derive it), revoke from `public`.
- Suggested validation: Direct PostgREST call with foreign org → denied.
- Owner suggestion: API team.
- Effort estimate: Small.
- Status: Open.

### Finding ID: SEC-P3-003 - SSRF guard gaps (hex/octal IPv4 forms) and unguarded analytics track endpoint

- Severity: P3
- Confidence: Medium
- Area: SSRF / abuse
- Evidence:
  - `apps/api/src/lib/ssrf-guard.ts:34-37` — IPv4 regex only matches dotted-decimal; hex (`0x7f000001`) and octal (`0177.0.0.1`) forms are not matched by `isPrivateIpAddress` (DNS-resolution backstop mitigates most cases)
  - `apps/api/src/routes/analytics.ts:26-58` — `POST /analytics/track` is unauthenticated, unbounded inserts (rate-limited only per-IP 300/15min)
- What is happening: (a) Obscure IP encodings evade the literal-IP checks; the DNS stage usually catches them (resolve → private check). (b) The track endpoint is an open write surface for storage abuse.
- Recommended fix: Normalize numeric hosts (parse hex/octal/decimal forms) in the guard; cap track-event rate and add row retention.
- Suggested validation: Unit tests with hex/octal hosts.
- Owner suggestion: API team.
- Effort estimate: Small.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Permission model bypassed (any member = full tenant write) | P1 | Certain (by construction) | Tenant data integrity | SEC-P1-001 | requirePermission middleware |
| Cross-tenant IDOR writes/deletes | P1 | Medium (needs UUID knowledge) | Cross-tenant data loss | SEC-P1-002 | Org-scope every by-id handler |
| Compromised low-trust MSP account → all-tenants read/write | P1 | Medium (credential leak) | Mass data exposure | SEC-P1-003 | Separate role vs platform trust; MFA |
| Worker SSRF via uptime checks | P1 | Medium | Internal recon | SEC-P1-004 | SSRF guard in route + worker |
| Governance workflow bypass (any member approves changes) | P1 | Certain (by construction) | Unauthorized changes | SEC-P1-005 | Role/permission gates |
| RPC auth mismatch breaks approve/portal-comment | P1 | High (if confirmed) | Feature outage | SEC-P1-006 | Verify + align RPC auth model |
| Webhook dedup collapses distinct Jira/JSM events | P2 | High | Stale syncs | SEC-P2-001 | Event-unique keys |
| Weak web CSP | P2 | Medium (needs XSS) | Session takeover | SEC-P2-002 | Nonce CSP |
| SECURITY DEFINER RPC surface (search_path/whitelist) | P2 | Medium | Integrity | SEC-P2-003 | Harden RPCs |
| Reset-email phishing via Origin | P2 | Low-Med | Phishing/ATO assist | SEC-P2-005 | Fixed redirect base |
| Rate-limit spoofing (trust proxy) | P3 | Low | DoS bypass | SEC-P3-001 | Pin proxy IPs |

## Recommendations

### Immediate / Release Blocking

1. Build `requirePermission(module, action)` middleware and wire it into module routers (SEC-P1-001) — without it, the RBAC product claim is false.
2. Close the by-id IDOR family: org predicates on tickets DELETE/comments, documents versions/bulk/upload-replace, projects sub-routes, dns-change transitions (SEC-P1-002).
3. Gate change-request/DNS state transitions with a role/permission check (SEC-P1-005).
4. Add the SSRF guard to uptime-check creation and to the worker fetch (SEC-P1-004).

### This Week

5. Verify and fix the `approve_project_task`/`add_project_task_comment` auth-uid mismatch (SEC-P1-006).
6. Make Jira/JSM webhook dedup keys event-unique (SEC-P2-001).
7. Decide the platform-admin conflation question for the 6 new MSP roles (SEC-P1-003) and record it in an ADR; enable MFA for all platform-key holders.

### This Month

8. Apply the nonce to the web CSP and remove `'unsafe-inline'` (SEC-P2-002).
9. Harden `increment_article_count` (search_path, whitelist, grants) and `mark_task_read` (SEC-P2-003, SEC-P3-002).
10. Implement `get_analytics_summary` or rework the summary query (SEC-P2-004).
11. Pin `trust proxy` and delete dead rate-limit config (SEC-P3-001).

### Later / Platform Evolution

12. Session revocation + cookie rotation on privilege change; MFA/SSO for MSP staff.
13. Per-table RLS policy audit vs the grant-everything baseline of 5302116 (policies are the only anon gate).
14. AV scanning for uploads; bucket pinning.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add org predicate to `DELETE /tickets/:id` | Closes the clearest cross-tenant delete | `apps/api/src/routes/tickets.ts:445` | Cross-tenant API test |
| Event-unique Jira/JSM dedup keys | Stops silent missed syncs | `apps/api/src/routes/webhooks.ts:246,324` | Replay two distinct transitions |
| SSRF guard on uptime check create + worker fetch | Kills the SSRF sink | `routes/uptime-monitor.ts`, `tasks/module-tasks.ts` | Private-IP check test |
| Hardcode `APP_BASE_URL` in forgot-password redirect | Kills reset-email phishing vector | `routes/auth.ts:275` | Origin-spoof test |
| Add `set search_path = public` + whitelist to `increment_article_count` | RPC hardening | `5302098` (new migration) | SQL tests |
| Fix CSP nonce wiring | XSS mitigation | `apps/web/middleware.ts` | CSP validator |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| requirePermission middleware + route wiring | P0 | Platform lead | 2–3 d | Permission data exists |
| By-id org scoping sweep (tickets/docs/projects/dns) | P0 | API team | 1–2 d | — |
| State-transition authz | P0 | API team | 0.5 d | requirePermission |
| Worker SSRF guard | P0 | Worker team | 0.5 d | — |
| RPC auth-model fix (approve/portal-comment) | P1 | API team | 0.5 d | Verify on hosted |
| Event-unique webhook keys | P1 | API team | small | — |
| MSP role trust decision + MFA | P1 | CTO/security | policy | — |
| CSP nonce | P1 | Web team | 0.5–1 d | — |
| RPC hardening sweep (search_path, grants, whitelists) | P2 | API team | 1 d | — |
| Analytics summary RPC | P2 | API team | small | — |
| trust proxy pinning + dead config removal | P3 | API team | small | — |
| Session revocation | P3 | Platform lead | medium | — |

## Suggested Tests

- **Permission matrix API tests (regression)**: for every role × module × action in the catalog, direct API call asserts expected 200/403 — table-driven, runs against the real DB (not mocks).
- **Cross-tenant IDOR regression suite**: org-A user vs org-B objects for: tickets (GET/PATCH/DELETE/comments), documents (GET/versions/bulk/upload-replace/shares), projects (sub-routes/tasks/comments/reorder/read/approve), governance transitions, dns transitions, api-keys, webhook-endpoints. Assert 404/403 **and** no side effects (verify storage objects intact).
- **RPC integration tests** (`supabase db test`): `approve_project_task`/`add_project_task_comment` under (a) no claims → `Not authenticated`, (b) API service-role call → expected behavior documented, (c) user JWT with membership → success; `mark_task_read` with foreign org → denied (after fix); `increment_article_count` with `field_name='version'` → rejected.
- **SSRF tests**: uptime check create with `169.254.169.254`, `http://api:4000/health`, hex/octal forms → 400; worker refuses private-IP targets.
- **Webhook replay tests**: identical JSM payload twice → second deduped; two distinct transitions same issue → both applied; timestamp ±5min boundaries.
- **Auth tests**: forgot-password with `Origin: https://evil.example` → redirectTo stays `APP_BASE_URL`; reset-password for another email → 403.
- **E2E**: Vera Viewer (client-viewer) attempting `DELETE /api/v1/tickets/:id` and `POST /api/v1/governance/change-requests/:id/approve` → 403 after the fix.
- **CSP check**: assert `script-src` contains `'nonce-'` on app routes.

## Suggested Documentation Updates

- `docs/ACCESS_CONTROL.md` (new): catalog → enforcement mapping, role trust levels (org-scoped vs platform), the platform-admin decision record for 5302128.
- `docs/RPC_SECURITY.md` (new): SECURITY DEFINER checklist (search_path, grants, whitelists, caller model) + inventory of RPCs and their auth model.
- `docs/SSRF_POLICY.md` (new): which user-controlled URLs are fetched (webhooks, uptime, domain monitors), where the guard must run (route + worker), residual DNS-rebinding notes.
- Update `docs/API_ENDPOINT_INVENTORY.md`: `GET /analytics/summary` status (broken until RPC exists), state-transition endpoints + required roles.
- Update `docs/MONITORING_AND_ALERTING.md`: webhook DLQ growth alerting, failed-delivery surfacing.
- Update `docs/ENVIRONMENT_VARIABLES.md`: note `APP_BASE_URL` is the single source for reset links.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Does `auth.uid()` return NULL for the API's service-role RPC calls, making `approve_project_task`/`add_project_task_comment` always fail? | Determines SEC-P1-006 severity and fix shape | Run the routes against hosted DB with a real session |
| What do supabase-js `.eq("organization_id", undefined)` queries do (throw vs no-op) for platform admins hitting org-scoped CRUD without an org param? | Many module CRUD routes call `.eq(..., undefined)` for platform admins; may 500 | Logged request on hosted dev with a dispatcher account |
| Is the Supabase project's `Redirect URLs` allowlist strict? | Determines whether the Origin-based reset redirect is exploitable (SEC-P2-005) | Supabase dashboard config |
| Which tables still have RLS disabled or zero policies after 5302116 granted anon full DML? | anon DML + no policy = open table | SQL: `select relname, relrowsecurity from pg_class ...` + policy count |
| Is cross-tenant access for `dispatcher`/`onboarding-specialist` roles an accepted business requirement? | Drives SEC-P1-003 fix direction (flag vs per-permission scoping vs accept+monitor) | Product/security decision |
| Does `websiteMonitorCheck`'s `error_message` surface hostnames/ports of internal services in the status UI? | SSRF info-disclosure extent | Inspect a failed private-target check row |

## Appendix

### A. Routes reviewed for by-id org scoping (HEAD 75d3926)

| Route | Org predicate on by-id | Notes |
| ----- | ---------------------- | ----- |
| `tickets.ts` GET/PATCH `/:id` | Yes (injected) | DELETE unscoped; comment-create unscoped; comment-edit has tenant+author checks |
| `documents.ts` GET/PATCH `/:id`, signed-url | Yes (injected) | versions ×2 unscoped; bulk ×2 unscoped (RPC); upload-replace unscoped; shares OK |
| `projects.ts` `/:id`, `/:id/detail`, `/compound` | Yes (platform-aware) | phases/milestones/deps/tasks/comments/updates/reorder/read unscoped |
| `governance.ts` crud + transitions | Yes (injected) | transitions lack role gates |
| `final.ts` dns transitions | **No** | approve/reject/implement by id only |
| `webhook-management.ts` | GETs scoped via injection; mutations requireAdmin | OK for current role model |
| `api-keys.ts` | PATCH/DELETE scoped via injection | No requireAdmin; dormant consumer |
| `uptime-monitor.ts` | Yes (injected) | URL unvalidated (SSRF input) |
| `status-page.ts` | Yes (injected) | — |

### B. Cross-tenant access semantics of `PLATFORM_ADMIN_KEYS`

A user with **any one** approved membership carrying one of `{super_admin, admin, dispatcher, engineer, security-analyst, project-manager, finance, onboarding-specialist}`:
- bypasses `requireOrgAccess` org checks for every org (`org-access.ts:29-43`),
- is never pinned to a default org (`org-access.ts:112-121`),
- sees all organizations and their details (`organizations.ts:43-53`),
- may edit any org's ticket comments as "org admin" (`tickets.ts:401-404`).

### C. Middleware order (from `app.ts`)

`helmet → cors → express.json(10mb, rawBody) → cookieParser → securityHeaders → inputSanitizer → IP limiter (skips /health, localhost, /api/v1/webhooks/*) → rateLimitByUser (skips health/docs/127.0.0.1) → requestId → requestLogger → idempotency → csrfProtection → requestTimeout(30s) → routers → 404 → errorHandler`.

CSRF skips: any `Authorization` header, auth endpoints, `/api/v1/public/*`, `/api/v1/webhooks/*` (inbound only — webhook-management lives at `/webhook-endpoints`).

### D. Threat model (summary)

- **In-scope attackers**: unauthenticated internet (public endpoints, webhooks, analytics track); authenticated client user (own tenant + cross-tenant IDOR); low-trust MSP employee (cross-tenant by design); compromised account; malicious tenant admin.
- **Assets**: tenant data (tickets, documents incl. storage, projects, billing, governance), platform admin console, webhook delivery, worker jobs.
- **Primary threat paths**: API by-id IDOR (SEC-P1-002); missing permission enforcement (SEC-P1-001); worker SSRF (SEC-P1-004); compromised MSP credential (SEC-P1-003); webhook replay/abuse (SEC-P2-001); XSS via CSP gap (SEC-P2-002).
- **Secondary**: RPC direct-call abuse (SEC-P2-003/P3-002); reset-link phishing (SEC-P2-005); rate-limit bypass (SEC-P3-001).
- **Not exploitable today**: storage signed URLs (1h, path-scoped), share tokens (256-bit), password reset (auth-gated + self-only), CSRF for cookie-session mutations (SameSite=Lax).

### E. Security regression checklist

- [ ] No route mutates data with only `requireAuth` + membership (no role/permission gate)
- [ ] Every by-id query includes `organization_id` (from injected query or explicit param)
- [ ] No SECURITY DEFINER function without `set search_path` + grants review
- [ ] No user-controlled URL fetched without the SSRF guard at write-time and fetch-time
- [ ] Webhook dedup keys include an event-unique component
- [ ] CSP headers contain a nonce for `script-src` on app routes
- [ ] `trust proxy` restricted to known proxy IPs
- [ ] Password reset email uses server-side base URL only
- [ ] Cross-tenant regression suite green
- [ ] Permission-matrix API tests green
