# 06 — Security, Authorization & Tenancy Audit (SEC)

> Run ID: `20260801-0233-develop-a585f1d` · Branch: `develop` · Head: `a585f1d` · Date: 2026-08-01

## Audit Metadata

| Field | Value |
| --- | --- |
| Run ID | `20260801-0233-develop-a585f1d` |
| Branch / Head | `develop` / `a585f1d` |
| Date | 2026-08-01 02:34 UTC |
| Prompt | `prompts/repo-deep-dive/prompts/06_security_authz_tenancy_audit.md` |
| Finding prefix | `SEC` |
| Severity model | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |
| Report file | `06_security_authz_tenancy_audit.md` |
| Companion report | `26_security_findings.md` (ACM/MT/ADMIN/WH/FILE) |
| Method | Manual source review; all claims tied to file:line. No code modified. |

## Scope

Authentication and authorization, tenant isolation (IDOR / object-level access), admin privilege boundaries, webhook replay/idempotency, and file upload/download security for the API (`apps/api`) and web app (`apps/web`). Review limited to code inspection; no live runtime probes were performed.

## Evidence Reviewed

- **Middleware:** `apps/api/src/middleware/auth.ts`, `admin.ts`, `org-access.ts`, `csrf.ts`, `rate-limit.ts` (+`rate-limit-config.ts`), `security.ts`, `security-headers.ts`, `optimistic-locking.ts`, `idempotency.ts`, `require-active-subscription.ts`, `request-timeout.ts`
- **Services:** `apps/api/src/services/supabase.ts` (admin/user client factory), `apps/api/src/services/audit.ts`
- **Routes:** `tickets.ts`, `projects.ts`, `documents.ts`, `organizations.ts`, `users.ts`, `profiles.ts`, `api-keys.ts`, `assets.ts`, `billing.ts`, `search.ts`, `webhooks.ts`, `webhook-management.ts`, `status-page.ts`, `file-requests.ts`, `admin.ts`, `audit.ts`, `analytics.ts`, `public.ts`, `docs.ts`
- **Lib:** `apps/api/src/lib/webhook-signature.ts`, `webhook-dispatcher.ts`, `idempotency.ts`, `http-client.ts`
- **Web:** `apps/web/middleware.ts`, `apps/web/lib/cookie-domain.ts`, `apps/web/lib/api.ts`, `apps/web/lib/auth/admin.ts`, `apps/web/app/(admin)/admin/layout.tsx`, `apps/web/app/auth/callback/route.ts`
- **DB:** `supabase/migrations/5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql` (RLS for organizations, profiles, memberships, tickets, projects, documents, storage buckets); later migrations enabling RLS on notifications, webhook_endpoints, webhook_deliveries

## Executive Summary

The API authenticates every request (`requireAuth` router-wide on entity routers) and verifies JWT locally with a Supabase fallback, applies CSRF and rate limiting, and cryptographically verifies Stripe/Jira/JSM inbound webhooks — a genuinely solid baseline. However, **tenant isolation at the API layer is not enforced by any object-level check**: `requireOrgAccess` validates only that the caller belongs to the org named in the query/body, never that the resource being read/written belongs to that org, and every production route queries via the **service-role client which bypasses all RLS policies**. A user who is a member of any org — or an admin in any org — can read, modify, or delete tickets, documents, projects, assets, and API keys belonging to other orgs by supplying the target IDs. This is the dominant systemic finding and should be treated as P0 before production workloads.

Secondary themes: dead subscription-gating middleware, an SSRF reachable through admin webhook endpoints, a global rate-limit bucket shared by all JWT bearer tokens (single-user DoS), optional webhook timestamp validation, a decorative nonce-based CSP, and mimetype-only upload validation.

**Domain score: 2 / 5** (tenancy and object-level authorization are structurally unsound; authentication, transport, and incident surfaces are otherwise strong).

## Findings

### SEC-P0-001 — Cross-tenant IDOR: object-level authorization missing on by-id read/write routes

- **Severity:** P0 (Critical)
- **File(s):**
  - `apps/api/src/routes/tickets.ts:197` (PATCH `/:id`), `:410` (DELETE `/:id`), `:101` (GET `/:id`), `:274`/`:290` (comments), `:355` (PATCH comment)
  - `apps/api/src/routes/documents.ts:145` (GET `/:id`), `:349` (PATCH `/:id`), `:557`/`:578` (versions)
  - `apps/api/src/routes/projects.ts:213` (GET `/:id`), `:370` (PATCH), `:424` (DELETE), `:455`-`:956` (tasks/comments/updates)
  - `apps/api/src/routes/assets.ts:119` (GET), `:216` (PATCH), `:287` (DELETE), `:304`/`:321` (comments)
  - `apps/api/src/routes/api-keys.ts:91` (PATCH), `:131` (DELETE)
- **Description:** `requireOrgAccess` (`apps/api/src/middleware/org-access.ts:44-85`) only verifies that the caller has a membership in the org carried by `query.organization_id`/`body.organizationId`; it never fetches the target resource, never sets a scoped `req.orgId`, and never verifies the resource belongs to that org. By-id handlers then read/update/delete rows filtered **only** by `id`. Because handlers use `getSupabaseAdmin()` (service role), the DB `*_select_same_org` / `*_update_own` RLS policies (e.g., `tickets_select_same_org` in the 5302026 bootstrap migration) do not apply. A member of any org can therefore address another org's entities directly by ID.
- **Impact:** Cross-tenant disclosure, modification, and deletion of tickets, comments, documents (incl. versions), projects/tasks/updates, assets, and API keys. Global `admin`/`super_admin` membership additionally bypasses the org check entirely (see SEC-P2-001).
- **Recommendation:** Introduce a single `assertResourceOrg(resource, resourceOrgId, req)` gate applied by every by-id handler, and add `.eq("organization_id", orgId)` to every by-id query as defense-in-depth. Keep RLS policies and route queries through the user-scoped client (`getSupabaseUser`) where feasible.

### SEC-P0-002 — Unauthenticated signed-URL generation for any document

- **Severity:** P0 (Critical)
- **File:** `apps/api/src/routes/documents.ts:442-466`
- **Description:** `POST /api/v1/documents/:id/signed-url` fetches the document row **by id only**, then calls `supabase.storage.createSignedUrl(storage_path, 3600)`. There is no membership/org check on the document. Any authenticated user can mint a 1-hour download URL for any document in any org.
- **Impact:** Complete cross-tenant exfiltration of all stored documents (the documents bucket is private; the signed URL is the bypass).
- **Recommendation:** Verify the document's `organization_id` is in the caller's accessible orgs (and that visibility rules permit) before generating the signed URL.

### SEC-P1-001 — Ticket comment editing lacks author and org verification

- **Severity:** P1 (High)
- **File:** `apps/api/src/routes/tickets.ts:355-408`
- **Description:** `PATCH /api/v1/tickets/:id/comments/:commentId` enforces only the 5-minute edit window. It does not verify the caller authored the comment, nor that the comment/ticket belongs to the caller's org. The `ticket_comments_update_own` RLS policy would restrict this, but the handler runs on the service-role client, so the policy is never evaluated.
- **Impact:** Any org member can edit other users' and other orgs' comments within the 5-minute window (content tampering / audit confusion). Project task comments (`projects.ts:781`) share the pattern.
- **Recommendation:** Compare `comment.created_by` to `req.authUser.userId` and scope the update by the ticket's org; add `.eq("id", ...).eq("created_by", userId)`.

### SEC-P1-002 — All bearer-token users share a single global rate-limit bucket

- **Severity:** P1 (High)
- **File:** `apps/api/src/middleware/rate-limit.ts:9-15`
- **Description:** `rateLimitByUser.keyGenerator` returns `user:${auth.slice(7, 27)}` — the 20 chars after the `Bearer ` prefix. For an HS256 JWT this is the constant header fragment `hbGciOiJIUzI1NiIsI` for **every** token. Every authenticated user therefore shares one 200-request/15-minute bucket.
- **Impact:** Any single user (or one misbehaving client) exhausts the shared bucket and rate-limits the entire authenticated API — a trivial user-triggered DoS and a broken per-user limit.
- **Recommendation:** Key on `req.authUser.userId` (already populated by `requireAuth`) with IP fallback; the rate limiter must run after auth or decode the JWT.

### SEC-P1-003 — SSRF via user-controlled webhook endpoint URLs

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/routes/webhook-management.ts:32-46` (create/update schema `z.string().url()`), `:213-259` (`POST /:id/test` → `fetch(webhook.url, ...)`), `apps/api/src/lib/webhook-dispatcher.ts:55` (`fetch(endpoint.url, ...)`)
- **Description:** Endpoint URLs are validated only as generic URLs — no scheme restriction (http allowed), no private/loopback/link-local IP blocking, no hostname allowlist, no DNS pinning. An admin in any org can register and test a webhook pointing at `http://169.254.169.254`, `http://redis:6379`, `http://api:4000`, or arbitrary intranet hosts; the test handler and the dispatcher then fetch those URLs server-side and return the response body/status to the caller.
- **Impact:** Internal-network probing, metadata-service access, and internal HTTP responses exfiltrated by a (possibly compromised) admin.
- **Recommendation:** Block private/loopback/link-local/multicast IP ranges and non-http(s) schemes at both create and dispatch time; resolve hostnames and re-check resolved IPs; consider an allowlist.

### SEC-P1-004 — `requireActiveSubscription` is dead code

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/middleware/require-active-subscription.ts`; imported in `documents.ts`, `projects.ts`, `tickets.ts` but never invoked by any route.
- **Description:** The subscription-gate middleware exists (admin bypass, test skip, checks `query.organization_id`) but no route calls it. Paid-feature gating is therefore unimplemented at the API layer.
- **Impact:** Subscription policy bypass; any org — regardless of billing state — retains full API access.
- **Recommendation:** Wire the middleware into the routes it is meant to protect, or remove it.

### SEC-P2-001 — Any `admin` in any org passes org-access checks for any org

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/org-access.ts:44-85` (`checkOrgAccess` admin/super_admin bypass)
- **Description:** The bypass is granted to the `admin` role, not just `super_admin`. Every MSP client org has `admin` members by default (seed data assigns admin per org). With the service-role client and missing object-level checks, every org's admin can reach every tenant's data.
- **Impact:** Massive blast radius for a single compromised org-admin account.
- **Recommendation:** Restrict the cross-org bypass to a dedicated global-admin role/flag; make `requireOrgAccess` set a scoped org and refuse orgs outside it for regular admins.

### SEC-P2-002 — Tenant isolation is disabled when `NODE_ENV=test`

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/org-access.ts:7,45-48,88-89`
- **Description:** Both `requireOrgAccess` and `requireOrgAccessByParam` `return next()` unconditionally when `getEnv().NODE_ENV === "test"`. Any environment misconfigured with `NODE_ENV=test` runs with zero tenant isolation. It also means the API test suite never exercises isolation, so regressions are invisible.
- **Impact:** Deployment/env misconfiguration silently disables the only API-layer isolation check; no automated coverage for tenancy.
- **Recommendation:** Gate the bypass on an explicit, non-inherited flag (e.g., `AUTH_BYPASS` env var) never present in deployed configs; add isolated integration tests that exercise the real middleware.

### SEC-P2-003 — `extractOrgId` ignores `body.organization_id` (snake_case)

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/org-access.ts:10-11`
- **Description:** Org resolution reads `query.organization_id` then `body.organizationId` (camelCase). Handlers that receive snake_case `organization_id` fall back to the caller's primary org while writing to the body-specified org — an org-mismatch that can persist rows to an unauthorized org.
- **Impact:** Potential cross-org write with an incorrect authorization decision.
- **Recommendation:** Normalize org from all common shapes (`organizationId`, `organization_id`) with explicit precedence.

### SEC-P2-004 — Input sanitizer is regex-blocklist-based and bypassable

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/security.ts`
- **Description:** Pattern-based detection (e.g., `on\w*\s*=`, `<!--`) can be evaded with encoding/unicode and also blocks benign strings containing those substrings; it is not a security boundary. There is no body-size limit beyond the express 10mb `express.json` cap, and no schema-level validation outside endpoint Zod schemas.
- **Impact:** False confidence; the actual defense must be output encoding (React already escapes) plus validation, not input blocking.
- **Recommendation:** Keep it as an anomaly signal only; rely on Zod validation and output encoding as the real controls.

### SEC-P2-005 — Nonce-based CSP is decorative on the web app

- **Severity:** P2 (Medium)
- **File:** `apps/web/middleware.ts:27-45`
- **Description:** A nonce is generated (`:16-25`) and propagated via `x-nonce` (`:108`), but the production CSP is `script-src 'self' 'unsafe-inline'` (`:42`) — the nonce is never included in the policy. All nonce plumbing is therefore ineffective; inline scripts rely on `'unsafe-inline'`.
- **Impact:** XSS from an injected inline script is not mitigated by CSP.
- **Recommendation:** Emit `script-src 'self' 'nonce-<value>'` and add the nonce attribute to inline scripts, or remove the unused nonce machinery.

### SEC-P2-006 — Webhook endpoint and delivery details are readable cross-tenant by id

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/routes/webhook-management.ts:67-80` (`GET /:id`), `:192-211` (`GET /:id/deliveries`)
- **Description:** Both by-id endpoints filter only on `id`, never on `organization_id`. Any member of any org can read another org's webhook endpoint (name, URL, masked secret, events) and full delivery logs. Router-level `requireOrgAccess` does not scope the query.
- **Impact:** Cross-tenant disclosure of integration configuration and delivery history.
- **Recommendation:** Add `.eq("organization_id", orgId)` and verify the endpoint belongs to an accessible org.

### SEC-P3-001 — Public OpenAPI spec discloses the full API surface

- **Severity:** P3 (Low)
- **File(s):** `apps/api/src/routes/docs.ts`; served via `/api/v1/docs` and `/api/v1/openapi.json` (skipped by rate limiter at `rate-limit.ts:18-19`)
- **Description:** The Swagger UI and OpenAPI JSON are publicly served. Low direct risk, but details every endpoint/param and is an attacker's map.
- **Recommendation:** Restrict to an allowlisted network or remove in production.

### SEC-P3-002 — Public status-page endpoint reveals org operational data by id

- **Severity:** P3 (Low)
- **File:** `apps/api/src/routes/status-page.ts:11-43`
- **Description:** `GET /api/v1/status-page/public/:orgId` returns components/incidents/maintenance for any org with no auth. This is likely intended (public status pages), but there is no per-org opt-out or disclosure control, and org ids are enumerable UUIDs.
- **Recommendation:** Confirm intended scope; add per-org opt-out flag and rate limiting.

## Risks

| ID | Risk | Likelihood | Impact |
| --- | --- | --- | --- |
| SEC-P0-001/002 | Cross-tenant data breach via IDOR + signed-URL minting | High (unauthenticated ID lookup) | Catastrophic (all tenant data) |
| SEC-P2-001 | Compromised org-admin → whole-platform access | Medium | High |
| SEC-P1-002 | Single-user rate-limit exhaustion | High (trivial to trigger) | Medium (whole API DoS) |
| SEC-P1-003 | Admin-triggered SSRF into internal network | Medium | High |
| SEC-P2-002 | `NODE_ENV=test` misconfiguration disables tenancy | Low | Critical |

## Recommendations

1. **P0:** Build one object-level authorization helper (`assertResourceOrg`) and apply it to every by-id read/write/delete handler across all entity routers; add org filters to by-id queries.
2. **P0:** Fix `POST /documents/:id/signed-url` to check document org + visibility before minting URLs.
3. **P1:** Fix the rate-limit key to use `req.authUser.userId`.
4. **P1:** Block SSRF targets in webhook URL create/update/test/dispatch.
5. **P1:** Wire or remove `requireActiveSubscription`.
6. **P1:** Enforce author + org on comment edits.
7. **P2:** Scope webhook endpoint by-id reads to the caller's org; restrict admin bypass to a real global-admin role; remove test-mode tenancy bypass; wire nonces into the CSP; normalize org extraction.

## Quick Wins

- `rate-limit.ts`: use `req.authUser.userId` for the bearer key (one-line, removes the shared-bucket DoS).
- `documents.ts:442`: add an org check before `createSignedUrl`.
- `org-access.ts:10-11`: also accept `body.organization_id`.
- Add `.eq("organization_id", orgId)` to `webhook-management.ts` by-id reads.
- Add author check to `tickets.ts:355` comment edit.

## Hardening Backlog

- Global-admin role separate from per-org `admin`.
- Atomic idempotency (SETNX) for inbound webhooks and share counters.
- Upload content sniffing (magic bytes) + AV scanning hook.
- Signed-URL scope binding (resource-specific, shortened TTL).
- Object-level audit events (actor + org + resource) for every by-id mutation.
- CSP nonce wiring / removal of `'unsafe-inline'`.

## Suggested Tests

- IDOR suite: for each entity, member of org A attempting GET/PATCH/DELETE of org B resources must 403/404 — with the test-mode bypass removed so the tests exercise the real gate.
- Signed-URL minting must fail for documents outside the caller's orgs.
- Rate-limit keys must differ per user (two users, 200 req each, no cross-impact).
- SSRF: registering webhooks to `127.0.0.1`, `169.254.169.254`, `redis://`, `http://api:4000` must be rejected.
- Subscription gate applied to protected routes (403 for lapsed org).
- Comment edit by non-author and cross-org must fail.

## Open Questions

- Is cross-org access by `admin` intended (documented as feature) or an oversight? No doc states it.
- Is `NODE_ENV=test` ever set in deployed environments (docker-compose / CI)? (Env files reviewed do not set it, but confirm no leak path.)
- Should the public status-page endpoint require an opt-in flag per org?
- Does any planned feature rely on `requireActiveSubscription`?

## Score

**Security domain (authentication, authorization, tenancy, webhooks, files): 2 / 5.**
Strong authentication, transport, and webhook-signature hygiene, but the missing object-level authorization layer and service-role RLS bypass mean tenant isolation is not currently sound.
