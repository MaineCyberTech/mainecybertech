# Access Control Matrix (Companion Artifact)

**Run:** `20261002-0344-develop-6286137`
**Repository:** mainecybertech
**Branch:** develop
**Commit:** `6286137017c4b7c77e83ee420ec11382d984f263`
**Companion to:** `24_access_control_matrix_audit.md`
**Area code:** ACM

This artifact is the machine-checkable companion to the Access Control Matrix
audit. It records the role inventory, permission inventory, route access matrix,
sensitive action matrix, and guard-precedence rules derived from the repository
at the stated commit. All rows are evidence-bound (path / symbol / migration).

---

## 1. Role inventory

Roles are defined by `supabase/migrations/5302128_role_catalog_expansion.sql`
(8 roles) plus the pre-existing catalog seeded by
`5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql` /
`5302118_permission_matrix_full_catalog.sql`. Role *classification* for
authorization purposes lives in code, not in the DB.

| Role key | Class (code) | Trust set | Defined in |
|---|---|---|---|
| `super_admin` | Platform admin | `PLATFORM_ADMIN_KEYS` + `ADMIN_BYPASS_KEYS`; `profiles.is_super_admin` also bypasses | bootstrap + `lib/roles.ts:9`, `lib/permissions.ts:26` |
| `admin` | Platform admin | `PLATFORM_ADMIN_KEYS` + `ADMIN_BYPASS_KEYS` | bootstrap + `lib/roles.ts:9`, `lib/permissions.ts:26` |
| `dispatcher` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:31` |
| `engineer` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:32` |
| `security-analyst` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:33` |
| `project-manager` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:34` |
| `finance` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:35` |
| `onboarding-specialist` | MSP internal | `PLATFORM_ADMIN_KEYS` only | `5302128:36` |
| `client-viewer` | Client (org-scoped) | none | `5302128:37` |
| `client-billing` | Client (org-scoped) | none | `5302128:38` |
| `client_admin` | Client (org-scoped) | none (pre-existing role, granted in bootstrap) | bootstrap / `5302118:410` |
| `client_user` | Client (org-scoped) | none | bootstrap / `5302118:420` |
| `technician` | Legacy/ops | none | `5302118:379` |
| custom roles | User-defined | none | `roles.ts` POST `/` |

**Key asymmetry (SEC-P2-002):** `PLATFORM_ADMIN_KEYS` = 8 keys
(`lib/roles.ts:9-18`); `ADMIN_BYPASS_KEYS` = 2 keys
(`lib/permissions.ts:26`). The 6 MSP-internal keys traverse tenants for
`requireOrgAccess` but are *not* permission-bypassed.

---

## 2. Permission catalog inventory

`permissions` rows are keyed `module_key:action_key`. Actions observed in code:
`view`, `create`, `edit`, `delete`, `manage`, `export`.

- Catalog seed: `5302118_permission_matrix_full_catalog.sql`
  (core/admin/security/operations/clients/store/tools groups).
- Action additions: `5302131_governance_manage_permissions.sql`
  (`change-requests:manage`, `dns-changes:manage`, `risk-register:manage`);
  `5302424_manage_actions.sql`
  (`users:manage`, `roles:manage`, `organizations:manage`, `memberships:manage`).
- Seed baseline: `5302028_seed_permissions.sql`.

### 2.1 Permission keys referenced by code that are satisfied by the catalog

`requirePermission` is evaluated by `lib/permissions.ts:resolveEffectivePermissions`
(union of `role_permissions` for approved memberships + `user_permission_overrides`,
where `is_allowed=false` removes) and enforced by `middleware/permissions.ts`.

### 2.2 Permission-key hygiene gaps observed

| Referenced key | In catalog? | Effect |
|---|---|---|
| `client-onboarding-command-center:{create,edit,delete}` | yes (`5302118:276-279`) | **Not wired** on `routes/client-onboarding-command-center.ts` (SEC-P2-001) |
| `ai:view` used to gate POST `/ai/triage/analyze` | yes (`5302118:310`) | Write action gated by a `view` permission (over-permissive) |
| `notifications:manage` | yes (`5302118:47`) | Not used at API; notification creation uses `requireAdmin` |
| `documents:manage`, `tickets:manage`, `projects:manage`, `contracts:manage`, `appointments:manage` | **no** | Referenced only in RLS policies (bootstrap), never granted to any role; dead predicates |

---

## 3. Route access matrix

Guard legend:
- **A** = `requireAuth`
- **O** = `requireOrgAccess` (router-level)
- **P** = `requirePermission(module, action)` (route-level; payload below)
- **AD** = `requireAdmin` (admin/super_admin role membership)
- **OP** = `requireOrgAccessByParam` (org from `:id`)
- **—** = no guard (public)

Mount base: `apps/api/src/app.ts:177-238` under `/api/v1`.

| Router (mount) | Router-level | Per-route guard outliers | Notes |
|---|---|---|---|
| `auth.ts` (`/auth`) | — (public base) | `/me`, `/sign-out`, `/mfa/*` = A; auth flows rate-limited | 14 A uses |
| `docs.ts` (`/api/v1`) | — | none | OpenAPI/doc HTML public |
| `health.ts` (`/health`) | — | none | Liveness |
| `public.ts` (`/public`) | — | none | Lead init/submit + CSP report |
| `webhooks.ts` (`/webhooks`) | — | signature-verified handlers | Inbound Stripe/Jira/JSM/M365 |
| `store.ts` (`/store`) | composite | see §3.1 | Public catalog/promo reads + admin writes |
| `organizations.ts` | A | `/onboard`,`POST /`,`domains *` = AD; `GET /:id`,`/:id/detail` = OP; PATCH/DELETE = OP + `organizations:manage` | SEC-P3-003 (list scoped in handler) |
| `memberships.ts` | A, O | invite/patch/delete = `users:manage` | `GET /` org-scoped |
| `users.ts` | A, O | `/`,`/compound`,`/:id/detail`,`/:id/permissions` = AD; `/:id/role`,`PUT /:id/permissions` = `users:manage`; `GET /:id` self-or-admin+shared-org | |
| `profiles.ts` | A, O | `GET /` enumerable; `GET /:id` self-or-super_admin; `PATCH /:id` self-or-admin+shared-org + `requireIfMatch` | SEC-P3-003 sibling |
| `tickets.ts` | A, O | create/edit/delete/comments = `tickets:{create,edit,delete}`; `/bulk` = AD | |
| `projects.ts` | A, O | many = `projects:{create,edit,delete}`; nested updates = A,O only | |
| `documents.ts` | A, O | mutations = `documents:{create,edit,delete}`; `/shares/:token` = **public** (token) | |
| `dashboard.ts` | A, AD | — | |
| `audit.ts` | A, AD | — | |
| `billing.ts` | A, O | `/sync` = `billing:manage` | |
| `roles.ts` | A | `/`,`/with-permissions`,`/:id/permissions` GET = AD; POST/PATCH/DELETE/`PUT perms` = `roles:manage`; `GET /:id` = **A only** | |
| `me.ts` | A | — | Unions all orgs (no org scope) |
| `search.ts` | A, AD, O | — | admin-only global search |
| `search-portal.ts` | A | — | Scoped to caller memberships (self) |
| `api-keys.ts` | A, O | POST/PATCH/DELETE = `api-keys:manage`; GET = A,O | expiry stored, see §5 |
| `admin.ts` | A, AD | — | |
| `bulk.ts` | A, O, AD | — | |
| `approvals.ts` | A, O | create/edit/delete/approve/reject/cancel = `approvals:*` | |
| `business-os.ts` | A, AD | — | |
| `proposals.ts` | A, O | mutations = `proposals:*` | |
| `findings.ts` | A, O | mutations = `findings:*` | |
| `assets.ts` | A, O | mutations = `assets:*` | |
| `device-profiles.ts` | A, O | mutations = `device-profiles:*` | |
| `domain-monitors.ts` | A, O | mutations = `domain-monitors:*` | |
| `qbr.ts` | A, O | generate/edit/delete = `qbr:*` | |
| `file-requests.ts` | A, O (after public block) | public `/public/:token`; mutations = `file-requests:*` | |
| `ai.ts` | A, O | `/triage/analyze` = `ai:view`; `/triage/convert` = `tickets:create`; reads/`copilot` = A,O | |
| `vendors.ts` | A, O | mutations = `<resource>:*` | |
| `service-catalog.ts` | A, O | mutations = `service-catalog:*` | |
| `batch.ts` | A, O (after public status) | `/status/public` public; mutations = `<path>:*` | |
| `security-ops.ts` | A, O | mutations = `<path>:*` | |
| `security-suite.ts` | A, O | mutations = `<path>:*` | |
| `governance.ts` | A, O | CRUD = `<path>:*`; transitions = `change-requests:manage`/`risk-register:manage` | |
| `field-services.ts` | A, O | conditional `permissionModule` guards | |
| `network-diagrams.ts` | A, O | mutations = `network-port-maps:*` | |
| `edu-automation.ts` | A, O | mutations = `<path>:*` + `automation`/`edu-automation`/`client-knowledge-base`/`compliance-readiness`/`phishing-simulations` | leaderboard = AD |
| `final.ts` (`/final`) | A, O | `final/crud.ts` mutations = `permissionModule:*`; `dns-changes` = `dns-changes:manage`; **budgets/procurement/sharepoint/time-entries/backups = A,O only** | |
| `client-onboarding-command-center.ts` | A, O | **no `requirePermission`** (all CRUD) | SEC-P2-001 |
| `satisfaction-pulse-widget.ts` | A, O | mutations = `satisfaction-pulse:*` | |
| `dynamic-client-forms-builder.ts` | A, O | mutations = `dynamic-forms:*` | |
| `license-optimizer.ts` | A, O | mutations = `license-optimizer:*` | |
| `dmarc-coach.ts` | A, O | mutations = `dmarc-coach:*` | |
| `training-hub.ts` | A, O | mutations = `training-hub:*` | |
| `insurance-binder.ts` | A, O | mutations = `insurance-binder:*` | |
| `status-page.ts` | A, O (after public) | `/public/:orgId` public; mutations = `status-pages:*` | |
| `uptime-monitor.ts` | A, O | mutations = `uptime-monitor:*` | |
| `compliance.ts` | A, O | mutations = `compliance-readiness:*` | |
| `cab.ts` | A, O | mutations = `governance:*` | |
| `staging.ts` | A, O | mutations = `hardware-staging:*` | |
| `analytics.ts` | `/track` public; `GET /`,`/summary` = A,AD | — | SEC-P2-004 (missing RPC) |
| `notifications.ts` | A, O | `POST /` = AD; `DELETE /:id` self-scoped; `/:id/read` self | |
| `notification-preferences.ts` | A, O | GET/PUT self; body org unscoped | SEC-P3-003 |
| `client-portal.ts` | A | `/entitlements` GET/PUT = AD + O | |
| `knowledge-base.ts` | A, O | mutations = `client-knowledge-base:*` | |
| `webhook-management.ts` | A, O | manage/create/delete/test = `webhooks:manage` | |
| `sla.ts` | A, O | — | |
| `webhooks.ts` (inbound) | — | signature verification | |

### 3.1 Store sub-routers (`routes/store/*`)

| Path | Guard | Notes |
|---|---|---|
| `catalog.ts` GET products/categories | public | |
| `catalog.ts` admin CRUD (`/products`,`/categories`) | A, AD | Uses `getSupabaseAdmin`, not org-scoped |
| `promotions.ts` public GET | public | |
| `promotions.ts` admin CRUD | A, AD | |
| `quotes.ts` POST `/quotes` | public | Lead/quote intake |
| `quotes.ts` admin reads/proposal-drafts | A, AD | |
| `quotes.ts` org-scoped writes | A, AD, O | `assertOrgScopeMatches` |
| `campaigns.ts` | public GET + A,AD,(O) writes | |
| `visual-assets.ts` | A, AD | |

---

## 4. Sensitive action matrix

| Sensitive action | Route | Required guard | Bypass paths |
|---|---|---|---|
| Create/revoke API key | `POST/PATCH/DELETE /api-keys/:id` | `api-keys:manage` | admin/super_admin |
| Rotate webhook secret | `PATCH /webhook-endpoints/:id` | `webhooks:manage` + `requireIfMatch` | admin/super_admin |
| Manage org membership | `POST/PATCH/DELETE /memberships/*` | `users:manage` | admin/super_admin |
| Change user role | `PATCH /users/:id/role` | `users:manage` | admin/super_admin |
| Override user permissions | `PUT /users/:id/permissions` | `users:manage` | admin/super_admin |
| Toggle role permission | `PUT /roles/:id/permissions` | `roles:manage` | admin/super_admin |
| Approve/reject change request | `POST /governance/change-requests/:id/{approve,reject,implement,verify}` | `change-requests:manage` | super_admin/admin/security-analyst |
| Approve/reject DNS change | `POST /final/dns-changes/...` | `dns-changes:manage` | super_admin/admin/security-analyst |
| Assess risk | `POST /governance/risk-register/...` | `risk-register:manage` | super_admin/admin/security-analyst |
| Grant portal entitlements | `PUT /client-portal/entitlements` | `requireAdmin` + O | super_admin/admin (RLS allows client_admin too) |
| Create org / onboard | `POST /organizations`, `/onboard` | `requireAdmin` | super_admin/admin |
| Bulk invite users | `POST /bulk/invite` | A,O,AD | super_admin/admin |
| View audit log / export | `GET /audit`, `/audit/export` | A,AD | super_admin/admin |
| Send arbitrary notification | `POST /notifications` | A,O,AD | super_admin/admin |
| Cross-tenant admin action | any O route w/ `X-Active-Org`/cookie | records `impersonation_log` | `PLATFORM_ADMIN_KEYS` (8 roles) |
| Self-service profile read | `GET /profiles?email=...` | A,O (RLS client) | none — enumerable (see findings) |

---

## 5. Key / token / certificate lifecycle

| Artifact | Issuance | Stored as | Expiry | Pruning | Revocation | Evidence |
|---|---|---|---|---|---|---|
| API key | `POST /api-keys` `crypto.randomBytes(32)` | `api_keys.key_hash` (sha256), `key_prefix` | `expires_at` (optional) | **none found** | PATCH `is_active=false`; DELETE row | `routes/api-keys.ts:23-31,56-91`; `5302042_api_keys.sql` |
| Webhook signing secret | caller-supplied on create/update | `webhook_endpoints.secret` (plaintext column) | none | n/a | overwrite secret | `5302032:8`; `routes/webhook-management.ts:286,340` |
| Session JWT | Supabase GoTrue sign-in | `mct_session` cookie / Bearer | GoTrue `exp`; multi-secret rotation via `JWT_SECRET` CSV | n/a | GoTrue | `middleware/auth.ts:35-41,69-76,126-128` |
| MFA recovery codes | `POST /auth/mfa/recovery-codes` | hashed (see `lib/mfa-recovery.ts`) | n/a | n/a | DELETE endpoint | `routes/auth.ts:523-610` |
| Document share token | `POST /documents/:id/shares` | `document_shares` token | see `5302043` | Unknown | `DELETE /documents/:id/shares/:shareId` | `routes/documents.ts:770-925` |

**Note:** API-key `expires_at` is stored and returned by list, but no query in the
codebase filters `expires_at > now()` or `is_active`; verification of API keys
(if any consumer exists) is **Unknown** — see report Open Questions.

---

## 6. Guard precedence (effective rule)

For an authenticated request the effective authorization is:

```
requireAuth  →  requireOrgAccess (resolve org: query > body > X-Active-Org > cookie > membership default)
             →  requireAdmin   (optional; admin|super_admin role in any approved membership)
             →  requirePermission(module, action)   (optional; bypass = is_super_admin profile OR admin|super_admin role)
             →  handler: assertResourceOrg / loadOwned / assertOrgScopeMatches  (row-level tenant check)
```

Trust facts:
- `requireOrgAccess` honors `PLATFORM_ADMIN_KEYS` (8) → cross-tenant read/write to any tenant; cross-tenant access logged via `logImpersonation`.
- `requirePermission` honors `ADMIN_BYPASS_KEYS` (2) + `is_super_admin`; deny-by-default otherwise.
- `requireAdmin` honors `{admin, super_admin}`.
- DB row-level isolation is enforced by RLS **only** when `getScopedClient` returns a user-scoped client — which requires the module to be listed in `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` (empty by default) → service-role default (`services/supabase.ts:163-186`).

---

## 7. DB helper (RLS) inventory

Defined in `5302026_...bootstrap...v3.sql`, all `SECURITY DEFINER,
search_path=public`, keyed on `auth.uid()`:

| Function | Line | Semantics | Forgeable input? |
|---|---|---:|---|
| `is_super_admin()` | 638 | `profiles.is_super_admin` of `auth.uid()` | no |
| `is_org_member(org)` | 653 | any membership | no |
| `is_org_approved_member(org)` | 668 | approved membership | no |
| `user_has_role(org, keys[])` | 684 | approved membership + role key | no (role keys server-side) |
| `user_has_permission(org, module, action)` | 702 | role_permissions union + override | no |
| `storage_path_org_id(name)` | — | parses org from object name | **client-controlled name** (RLS-P3-003) |

Caller-supplied-id RPCs `approve_project_task`, `add_project_task_comment`
(RLS-P2-003) are flagged by the RLS audit — not re-scored here.
