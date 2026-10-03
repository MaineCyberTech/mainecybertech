# 26 — Security Findings: Access Control, Multi-Tenancy, Admin Console, Webhooks, Files (ACM / MT / ADMIN / WH / FILE)

> Run ID: `20260801-0233-develop-a585f1d` · Branch: `develop` · Head: `a585f1d` · Date: 2026-08-01

## Audit Metadata

| Field | Value |
| --- | --- |
| Run ID | `20260801-0233-develop-a585f1d` |
| Branch / Head | `develop` / `a585f1d` |
| Date | 2026-08-01 02:34 UTC |
| Prompts | `prompts/repo-deep-dive/prompts/24_access_control_matrix_audit.md`, `25_multi_tenant_isolation_audit.md`, `26_admin_console_abuse_case_audit.md`, `27_webhook_replay_idempotency_audit.md`, `28_file_upload_download_security_audit.md` |
| Finding prefixes | `ACM` (24), `MT` (25), `ADMIN` (26), `WH` (27), `FILE` (28) |
| Severity model | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |
| Report file | `26_security_findings.md` |
| Companion report | `06_security_authz_tenancy_audit.md` (SEC findings + primary tenancy analysis) |
| Method | Manual source review; all claims tied to file:line. No code modified. |

## Scope

Cross-cutting access-control matrix, multi-tenant isolation posture, admin-console abuse surfaces, webhook replay/idempotency, and file upload/download security. Complements the `SEC` findings in `06_security_authz_tenancy_audit.md`; where a theme is shared, this report frames it from the applicable prompt's angle rather than duplicating.

## Evidence Reviewed

- **Access control:** `apps/api/src/middleware/admin.ts` (memberships `roles.key in ('admin','super_admin')`), `org-access.ts`, `require-active-subscription.ts`; module routes `batch.ts`, `file-requests.ts`, `api-keys.ts`, `assets.ts`, `status-page.ts`, `search.ts`, `audit.ts`, `analytics.ts`
- **Tenancy/DB:** `apps/api/src/services/supabase.ts` (service-role `getSupabaseAdmin` vs user-scoped `getSupabaseUser`); `supabase/migrations/5302026_...bootstrap...v3.sql` RLS policies; later RLS migrations for notifications/webhooks
- **Admin console:** `apps/web/app/(admin)/admin/layout.tsx`, `apps/web/lib/auth/admin.ts`, `apps/web/middleware.ts`, all 147 `page.tsx` files under `apps/web/app/(admin)/admin/`, `apps/web/components/admin/ConfirmIntentButton.tsx`
- **Webhooks:** `apps/api/src/routes/webhooks.ts`, `apps/api/src/lib/webhook-signature.ts`, `webhook-dispatcher.ts`, `idempotency.ts`, `webhook-management.ts`
- **Files:** `apps/api/src/routes/documents.ts` (upload/share/signed-url/versions), `profiles.ts` (avatar), `organizations.ts` (logo); multer configuration

## Executive Summary

Five areas were audited. **Multi-tenancy (MT)** carries the P0: the API's service-role client bypasses every RLS policy, and there is no object-level resource→org ownership check anywhere in the request path, so the database's tenant policies are a dead backstop and isolation rests entirely on a membership-only middleware. **Access control (ACM)** shows no unified layer: org-scoping and role-gating are applied inconsistently across the ~44 route files, and `requireActiveSubscription` is dead. **Admin console (ADMIN)** has a solid API-side guard (`requireAdmin` router-wide on admin routers) but 5 of 147 admin pages lack page-level role checks and the layout only requires login. **Webhooks (WH)** verify Stripe/Jira/JSM signatures correctly and use deterministic idempotency keys, but the M365 endpoint is effectively unauthenticated, timestamp validation is optional, and dedup is a non-atomic check-then-store. **Files (FILE)** rely on client-supplied mimetypes without content sniffing or AV scanning, allow user-controlled buckets, and share-link counters are racy.

**Domain score: 2 / 5** (consistent with the SEC report; tenancy and object-level authorization are the binding constraint).

## Findings

### ACM — Access Control Matrix

#### ACM-P1-001 — No unified access-control layer; enforcement is inconsistent across module routes

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/middleware/org-access.ts:44-85`; contrast `apps/api/src/routes/batch.ts`, `file-requests.ts` (org-scoped by-id queries) with `tickets.ts:197/410`, `projects.ts:370/424`, `documents.ts:349`, `assets.ts:216/287`, `api-keys.ts:91/131` (by-id queries filtered only on `id`)
- **Description:** The matrix is enforced per-route by hand. Some module routes consistently add `.eq("organization_id", ...)` to by-id operations; the core entity routes do not. `requireOrgAccess` is a membership check, not a resource-ownership check, so nothing forces correctness. `requireAdmin` is also applied selectively (e.g., document `DELETE` is admin-gated at `documents.ts:406` but document `bulk/folder` and `bulk/metadata` at `:468/:508` have no role gate at all).
- **Impact:** Divergent authorization semantics across modules; new routes are easy to add without a gate; IDOR regressions are a recurring risk.
- **Recommendation:** Introduce one reusable `assertResourceOrg` gate and a lint/test rule that rejects by-id queries without an org predicate.

#### ACM-P2-001 — `requireActiveSubscription` is imported but never invoked

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/require-active-subscription.ts`; imports in `documents.ts`, `projects.ts`, `tickets.ts`
- **Description:** No route calls the middleware. The access-control matrix therefore has no paid-feature gating at all (see SEC-P1-004).
- **Recommendation:** Wire it to the routes it protects or delete it.

#### ACM-P2-002 — Role-gating sources differ: `memberships.roles` vs `profiles.is_super_admin`

- **Severity:** P2 (Medium)
- **File(s):** `apps/api/src/middleware/admin.ts` (roles key), `apps/api/src/routes/profiles.ts:64-73,94-104` (cross-user profile view/edit gated solely on the `is_super_admin` column)
- **Description:** Admin authorization for entity routers uses `memberships.roles!inner(id,key)` (`admin.ts`), but cross-user profile operations use a boolean column on `profiles`. Two independent privilege sources make the matrix harder to reason about and audit.
- **Recommendation:** Standardize on one source (roles) and derive flags from it.

### MT — Multi-Tenant Isolation

#### MT-P0-001 — Service-role client bypasses all RLS; DB tenant policies are a dead backstop

- **Severity:** P0 (Critical)
- **File(s):** `apps/api/src/services/supabase.ts:12-36` (`getSupabaseAdmin` with `SUPABASE_SERVICE_ROLE_KEY`); `supabase/migrations/5302026_...v3.sql` (RLS on organizations, profiles, memberships, tickets, projects, documents, storage)
- **Description:** The bootstrap migration enables RLS and defines org-scoped policies (`tickets_select_same_org`, `documents_select_same_org`, `profiles_select_self_same_org_or_super_admin`, etc.). However, essentially every production route queries through `getSupabaseAdmin()`, which uses the service-role key and bypasses RLS. `getSupabaseUser(jwt)` is used in only a handful of places (e.g., `profiles.ts:75` for reads, `profiles.ts:169` for avatar upload). The RLS layer is therefore ineffective against API traffic.
- **Impact:** Tenant isolation depends entirely on middleware discipline that (per SEC-P0-001/ACM-P1-001) is missing object-level checks. Database-level policies cannot save a mis-scoped query.
- **Recommendation:** Route entity queries through the user-scoped client so RLS becomes a real backstop; retain `getSupabaseAdmin` only where a deliberate privilege escalation is audited.

#### MT-P1-001 — No resource→org ownership verification exists anywhere

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/middleware/org-access.ts:44-85`; `apps/api/src/routes/tickets.ts:101`, `documents.ts:145`, `projects.ts:213`, `assets.ts:119`, `api-keys.ts:31/91`
- **Description:** `requireOrgAccess` checks membership in an org that the **caller** supplies via query/body; it never loads the resource to compare ownership and never sets a scoped `req.orgId`. Every by-id handler is then trusted to scope its own query. The org supplied may be the caller's primary org while the resource belongs elsewhere.
- **Impact:** Cross-tenant disclosure/modification is prevented only by accident of an individual route adding the right filter.
- **Recommendation:** Implement a single ownership-check helper; make `req.orgId` authoritative and forbid handlers from reading a different org.

#### MT-P2-001 — Tenant isolation disabled under `NODE_ENV=test`; no integration coverage

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/middleware/org-access.ts:7,45-48,88-89`
- **Description:** Both org-access middlewares short-circuit in test mode. Besides the deployment risk (SEC-P2-002), the API test suite never executes the real gate, so there is no automated proof that tenancy holds.
- **Recommendation:** Add an opt-in `AUTH_BYPASS` flag instead of the `NODE_ENV` check and write cross-org negative tests.

### ADMIN — Admin Console Abuse Case Audit

#### ADMIN-P1-001 — 5 of 147 admin pages lack a page-level `requireAdminAccess` guard

- **Severity:** P1 (High)
- **File(s):**
  - `apps/web/app/(admin)/admin/health/page.tsx`
  - `apps/web/app/(admin)/admin/notifications/page.tsx`
  - `apps/web/app/(admin)/admin/final/page.tsx`
  - `apps/web/app/(admin)/admin/edu-automation/page.tsx`
  - `apps/web/app/(admin)/admin/store/audit/page.tsx`
  - Context: `apps/web/app/(admin)/admin/layout.tsx` (redirects only when **not logged in**; does not enforce role), `apps/web/middleware.ts:95-99` (guards only `/portal`, not `/admin`), `apps/web/lib/auth/admin.ts` (`requireAdminAccess`)
- **Description:** The admin layout authenticates but does not authorize; the web middleware never gates `/admin`; enforcement is page-level `requireAdminAccess()` calls. Five pages omit the call. Their server data is still admin-gated at the API (`requireAdmin` router-wide on admin routers), so the practical exposure is partial-shell rendering and navigational access to admin UI for non-admin members, but the pattern is fragile: any future page that calls a non-admin API endpoint while missing the guard becomes a real hole.
- **Impact:** UI/entitlement confusion; regression-prone; defense-in-depth failure for admin console.
- **Recommendation:** Move role enforcement into the admin layout (or middleware) once so no future page can be added without it.

#### ADMIN-P2-001 — Admin webhook "Test" and dispatch surfaces enable internal SSRF

- **Severity:** P2 (Medium)
- **File(s):** `apps/api/src/routes/webhook-management.ts:213-259` (`POST /:id/test` → `fetch(webhook.url)`), `apps/api/src/lib/webhook-dispatcher.ts:55`
- **Description:** Reachable by any `admin` (router `requireAdmin` at `webhook-management.ts:82`). See SEC-P1-003 for the SSRF mechanics; from the admin-console angle this is an abuse path where a compromised or malicious admin can pivot into the internal network and read internal HTTP responses.
- **Recommendation:** SSRF protections at create/update/test/dispatch (private-IP block, scheme allowlist, DNS re-check).

#### ADMIN-P2-002 — Destructive admin operations are hard deletes with no undo

- **Severity:** P2 (Medium)
- **File(s):** `apps/api/src/routes/tickets.ts:410`, `documents.ts:406`, `api-keys.ts:131`, `webhook-management.ts:167`; web confirmation is client-side only (`apps/web/components/admin/ConfirmIntentButton.tsx`)
- **Description:** Delete endpoints hard-remove rows (204 no content). There is no server-side confirm token, soft-delete, or undo; a single mis-click or CSRF-adjacent action is irreversible (audit logs exist but do not restore data).
- **Recommendation:** Prefer soft-delete/archival for mutable entities, or require a typed confirmation body on destructive deletes.

#### ADMIN-P3-001 — Super-admin gate is a profiles column, not a membership role

- **Severity:** P3 (Low)
- **File:** `apps/api/src/routes/profiles.ts:62-104`
- **Description:** Cross-user profile read/edit hinges on `profiles.is_super_admin`, which is not part of the membership/role model used elsewhere. Audit trail of who is super-admin lives in a column that is itself editable only by a super-admin — but the coupling to the role model is undocumented.
- **Recommendation:** Derive super-admin from a role; keep the flag read-only.

### WH — Webhook Replay & Idempotency Audit

#### WH-P0-001 — M365 webhook endpoint is effectively unauthenticated

- **Severity:** P0 (Critical)
- **File:** `apps/api/src/routes/webhooks.ts:376-431`
- **Description:** `POST /api/v1/webhooks/m365` performs no signature verification. The only check is `if (notification.clientState && notification.clientState !== clientState)` at `:396` — an attacker who simply **omits** `clientState` passes. Timestamp validation (`:403`) also passes when no timestamp is present (`webhook-signature.ts:44`). Anyone who knows the endpoint can inject fake M365 events, polluting `audit_logs`, `webhook_deliveries`, and any downstream processing.
- **Impact:** Event spoofing, audit-log poisoning, and potential downstream state corruption; DoS via flood.
- **Recommendation:** Require a valid, non-empty `clientState` and verify a request signature, or restrict the endpoint to expected Microsoft ranges.

#### WH-P1-001 — Inbound timestamp validation is optional; replay bounded only by non-atomic dedup

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/lib/webhook-signature.ts:39-44` (`if (ts === null) return true`), `apps/api/src/routes/webhooks.ts:35-42` (`dedupWebhook` = check-then-store), `apps/api/src/lib/idempotency.ts:61-118`
- **Description:** `validateWebhookTimestamp` returns true for payloads without a timestamp field, so Jira/JSM/M365 replay is limited only by the dedup key. The dedup is a non-atomic GET-then-SETEX: two concurrent identical deliveries can both observe "absent" and both process. Dedup state is lost on Redis restart (in-memory fallback caps at 10k entries, `idempotency.ts:53`).
- **Impact:** Duplicate/replayed webhook processing (double updates, duplicate notifications) under concurrency or Redis failure.
- **Recommendation:** Atomic `SET key value NX EX ttl`; require an event id/timestamp for replay keys.

#### WH-P1-002 — M365 dedup key is deterministic per resource+changeType → first delivery suppresses all later legitimate events

- **Severity:** P1 (High)
- **File:** `apps/api/src/routes/webhooks.ts:411` (`m365Key = m365-${resource}-${changeType}`)
- **Description:** The key has no event-specific entropy. After the first M365 notification for a given resource+changeType is processed, every subsequent legitimate notification for the same resource+changeType is treated as a duplicate and dropped.
- **Impact:** Silent loss of legitimate M365 change events (data freshness); conversely, genuine replays with a *different* resource value still pass.
- **Recommendation:** Derive the key from an event id / `changeNotificationId` or include the notification timestamp.

#### WH-P2-001 — Raw webhook request/response bodies persisted to `webhook_deliveries`

- **Severity:** P2 (Medium)
- **File(s):** `apps/api/src/routes/webhooks.ts:21-27` (request_body = full inbound payload), `apps/api/src/lib/webhook-dispatcher.ts:70-83` (request_body + response_body)
- **Description:** Deliveries store the raw JSON bodies, which for Stripe/JSM/M365 can contain PII or internal references, and outbound `response_body` can reflect arbitrary internal endpoint content (exacerbated by SSRF in SEC-P1-003).
- **Impact:** Sensitive data at rest in the DB with no retention/scrubbing policy.
- **Recommendation:** Store truncated or field-masked bodies; add retention; ensure DB access is least-privilege.

#### WH-P2-002 — Outbound dispatch has no retry/backoff and ignores the DLQ table

- **Severity:** P2 (Medium)
- **File(s):** `apps/api/src/lib/webhook-dispatcher.ts:55-90` (single `fetch`, no retry); DLQ table exists (`webhook_retry_dlq`, migration 5302050) but is not written by the dispatcher
- **Description:** A failed delivery (timeout/5xx) is recorded once and never retried; no backoff, no DLQ enqueue. Downstream systems that are briefly unavailable permanently miss events.
- **Recommendation:** Implement retry with exponential backoff and enqueue to the DLQ on terminal failure.

### FILE — File Upload / Download Security Audit

#### FILE-P1-001 — Upload validation trusts client-supplied mimetype; no content sniffing

- **Severity:** P1 (High)
- **File(s):** `apps/api/src/routes/documents.ts:202-237` (mimetype allowlist only), `profiles.ts:161-164` (avatar allowlist), `organizations.ts:365-380` (logo: **no** mimetype check at all)
- **Description:** The `Content-Type` is taken from the multipart part (client-controlled) and checked against an allowlist; the bytes are never inspected. An attacker can upload arbitrary content (e.g., HTML/JS with XSS payloads, polyglot files) with a spoofed `application/pdf` mimetype. The `logos` bucket is public and logo upload (`organizations.ts:361-380`) performs no type check at all.
- **Impact:** Stored-XSS risk if such content is served inline (images/HTML in browsers); malicious-file storage with no detection.
- **Recommendation:** Sniff magic bytes and match against the declared type; reject HTML/SVG by content, not extension; add an AV hook.

#### FILE-P1-002 — No malware/virus scanning on any upload path

- **Severity:** P1 (High)
- **File(s):** `documents.ts:202`, `profiles.ts:152`, `organizations.ts:361`
- **Description:** No AV/scanning integration exists anywhere in the upload pipeline. The platform stores arbitrary user files for an MSP context where documents are routinely exchanged.
- **Impact:** The portal can be used to host or ferry malicious files; recipients may open them (documents/previews).
- **Recommendation:** Add a scanning step (async worker) or at minimum quarantine non-matching content until reviewed.

#### FILE-P2-001 — User-controlled storage bucket with `upsert: true`

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/routes/documents.ts:228-237`
- **Description:** `bucket` is taken from `req.body.bucket` (default `documents`) and used directly in `supabase.storage.from(bucket).upload(..., { upsert: true })`. A member can target any bucket they have access to (e.g., public `avatars`/`logos`) and, because `upsert: true` and the path is `orgs/${orgId}/${Date.now()}-${safeName}`, can overwrite an existing object whose path they can reconstruct.
- **Impact:** Potential overwrite of public-facing objects; writes to unintended buckets; content-type drift.
- **Recommendation:** Pin the bucket server-side to a per-route constant; use `upsert: false`.

#### FILE-P2-002 — Storage filenames derive from user-supplied original names

- **Severity:** P2 (Medium)
- **File(s):** `profiles.ts:166-168` (`avatar.${ext}` from `originalname.split(".").pop()`), `organizations.ts:372-373`, `documents.ts:229-230` (sanitized `safeName` for documents — OK, but avatar/logo extensions are not validated)
- **Description:** The avatar/logo storage key is built from the uploaded file's extension with no allowlist. An upload named `x.svg` (or `x.js`/`x.html`) with a spoofed `image/png` mimetype would be stored and served from the **public** `avatars`/`logos` buckets with an `.svg`/.js extension — serving attacker content inline from a trusted origin.
- **Impact:** Stored XSS / phishing surface from a first-party domain; content hosted for abuse.
- **Recommendation:** Derive storage keys from a server-generated extension matched to sniffed content; never echo user filename into keys for public buckets.

#### FILE-P2-003 — Public share-link counter increments are racy; links are token-only

- **Severity:** P2 (Medium)
- **File:** `apps/api/src/routes/documents.ts:790-838`
- **Description:** `GET /shares/:token` is public by design. `max_access` enforcement (`:808`) reads `access_count`, then increments via a separate UPDATE (`:822-825`) — a concurrent burst can exceed the cap. Tokens are the only gate (no per-request challenge), and the returned signed URL is valid for 1 hour (`:817`).
- **Impact:** Access-count caps can be exceeded; a leaked token + captured signed URL extends access beyond policy.
- **Recommendation:** Atomic increment (e.g., `UPDATE ... SET access_count = access_count + 1 WHERE access_count < max_access ... RETURNING`), and tie signed URLs to the token/requester.

## Risks

| ID | Risk | Likelihood | Impact |
| --- | --- | --- | --- |
| MT-P0-001 | RLS dead against API traffic (service role) | Certain | Critical (no DB backstop) |
| WH-P0-001 | M365 webhook spoofing | High (unauthenticated) | Medium-High |
| FILE-P1-001/002 | Malicious/stored-XSS content hosted from first-party domain | Medium | High |
| ADMIN-P1-001 | Admin UI reachable without role guard on 5 pages | Medium | Medium |
| WH-P1-001/002 | Duplicate/lost webhook processing | Medium | Medium |

## Recommendations

1. **P0 (MT):** Move entity queries to the user-scoped client so RLS is a live backstop; implement object-level ownership checks (shared with SEC-P0-001).
2. **P0 (WH):** Require `clientState` + signature on the M365 endpoint.
3. **P1 (WH):** Atomic idempotency (SETNX); fix the M365 dedup key entropy.
4. **P1 (FILE):** Magic-byte sniffing + AV scan on upload; pin the bucket server-side.
5. **P1 (ADMIN):** Enforce `requireAdminAccess` at the admin layout/middleware level.
6. **P2:** Retry/backoff + DLQ for outbound dispatches; scrub delivery bodies; soft-delete for destructive ops.

## Quick Wins

- `webhooks.ts:396`: reject requests where `clientState` is missing or mismatched.
- `idempotency.ts`: use `SET ... NX EX` instead of GET-then-SETEX.
- `documents.ts:228`: drop the user-supplied `bucket`.
- `documents.ts:822`: atomic access-count increment.
- Add a content-sniffing check next to the existing mimetype allowlist in `documents.ts:209`.

## Hardening Backlog

- Central authorization layer (`assertResourceOrg`) applied to all by-id handlers.
- Redis-backed idempotency with atomic semantics and persisted fallback.
- AV scanning worker task for documents.
- Webhook delivery retry/backoff + DLQ consumer.
- Server-side confirm tokens for destructive admin ops.
- Unify super-admin source of truth.

## Suggested Tests

- RLS enforcement test: assert entity queries with a cross-org org param return no rows even when the handler is "mistaken" (run against the real gate, not test-mode bypass).
- M365 webhook: missing `clientState` → 401; wrong `clientState` → 401.
- Dedup race: fire N concurrent identical webhooks → exactly 1 processed.
- M365 dedup: two distinct events on same resource+changeType → both processed.
- Share-link cap: concurrent fetches must not exceed `max_access`.
- Upload: `application/pdf` with HTML bytes rejected by sniffing; `x.svg` avatar rejected.
- Admin pages: all 147 admin pages return 403/redirect for a non-admin member.

## Open Questions

- Are share tokens intended to be a full public link (no auth) — is the 1-hour signed-URL-in-response model acceptable, or should downloads stream server-side with rate limits?
- Is there a documented retention policy for `webhook_deliveries` bodies?
- Should the `is_super_admin` flag migrate to the role model?

## Score

**Security domain (access control, tenancy, admin console, webhooks, files): 2 / 5.**
Cryptographic webhook hygiene and admin API gating are good, but tenant isolation lacks both a DB backstop and object-level enforcement, the M365 webhook is unauthenticated, and upload validation is content-blind.
