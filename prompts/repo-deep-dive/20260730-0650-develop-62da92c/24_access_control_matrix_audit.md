# Access Control Matrix Audit

> **Date:** 2026-07-30  
> **Branch:** develop (62da92c)  
> **Area:** ACM  
> **Scope:** Complete API route-to-middleware mapping, permission breakdown, and authorization gaps

---

## Summary

The MCT Portal API has **44 route files** registered in `apps/api/src/app.ts`, exposing ~200+ unique endpoints. 37 route files correctly chain `requireAuth` + `requireOrgAccess` for tenant-scoped access. 7 route files lack tenant isolation (`requireOrgAccess`), creating data exposure pathways. 8 route files require `requireAdmin` for elevated operations. No fine-grained permission-checking middleware exists — the system relies entirely on role-based routing (admin vs non-admin) and RLS policies for row-level security.

**Risk Score: MEDIUM** — Access control model is simple (admin vs member) but lacks granularity. Core entity routes are well-guarded; system/cross-cutting routes have gaps.

---

## Access Control Architecture

### Middleware Layers

1. **`requireAuth`** — JWT verification. Sets `req.authUser` with `{ userId, email }`. Applied to all authenticated routes.
2. **`requireOrgAccess`** — Tenant isolation. Extracts `organization_id` from `req.query`, `req.body`, or falls back to user's first approved membership. Enforces user has approved membership in the org.
3. **`requireOrgAccessByParam`** — Variation for routes where org ID is a URL param (`req.params.id`). Used by organizations router.
4. **`requireAdmin`** — Checks user has `admin` or `super_admin` role in ANY org they belong to. Applied to admin-only operations.
5. **RLS** — Row-level security policies on Supabase tables (50+ tables with `is_org_member()` helper). Enforced when queries use `getSupabaseUser()` (user JWT).

### Service Role vs User JWT

- **`getSupabaseAdmin()`** — Uses `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS entirely. Used by most route handlers.
- **`getSupabaseUser(jwt)`** — Uses `SUPABASE_ANON_KEY` + user's JWT. Enforces RLS. Used by profiles route only.

---

## Route Middleware Matrix

### Core Entity Routes (with `requireOrgAccess`)

| Route File | `requireAuth` | `requireOrgAccess` | `requireAdmin` | Status |
|---|---|---|---|---|
| `tickets.ts` | ✅ L22 | ✅ L23 | — | ✅ Correct |
| `projects.ts` | ✅ L32 | ✅ L33 | — | ✅ Correct |
| `documents.ts` | ✅ L62 | ✅ L63 | — | ✅ Correct |
| `memberships.ts` | ✅ L13 | ✅ L14 | Per-route | ✅ Correct |
| `billing.ts` | ✅ L13 | ✅ L14 | — | ✅ Correct |
| `notifications.ts` | ✅ L11 | ✅ L12 | — | ✅ Correct |
| `notification-preferences.ts` | ✅ L10 | ✅ L11 | — | ✅ Correct |
| `approvals.ts` | ✅ L26 | ✅ L27 | — | ✅ Correct |
| `assets.ts` | ✅ L14 | ✅ L15 | — | ✅ Correct |
| `findings.ts` | ✅ L19 | ✅ L20 | — | ✅ Correct |
| `proposals.ts` | ✅ L23 | ✅ L24 | — | ✅ Correct |
| `qbr.ts` | ✅ L10 | ✅ L11 | — | ✅ Correct |
| `governance.ts` | ✅ L18 | ✅ L19 | — | ✅ Correct |
| `service-catalog.ts` | ✅ L10 | ✅ L11 | — | ✅ Correct |
| `ai.ts` | ✅ L10 | ✅ L11 | — | ✅ Correct |
| `vendors.ts` | ✅ L15 | ✅ L16 | — | ✅ Correct |
| `api-keys.ts` | ✅ L11 | ✅ L12 | — | ✅ Correct |
| `sla.ts` | ✅ L9 | ✅ L10 | — | ✅ Correct |
| `file-requests.ts` | ✅ L46 | ✅ L47 | — | ✅ Correct |
| `domain-monitors.ts` | ✅ L15 | ✅ L16 | — | ✅ Correct |
| `security-suite.ts` | ✅ L16 | ✅ L17 | — | ✅ Correct |
| `security-ops.ts` | ✅ L16 | ✅ L17 | — | ✅ Correct |
| `field-services.ts` | ✅ L18 | ✅ L19 | — | ✅ Correct |
| `edu-automation.ts` | ✅ L24 | ✅ L25 | — | ✅ Correct |
| `batch.ts` | ✅ L31 | ✅ L32 | — | ✅ Correct |
| `final.ts` | ✅ L23 | ✅ L24 | — | ✅ Correct |
| `client-onboarding-command-center.ts` | ✅ L29 | ✅ L30 | — | ✅ Correct |
| `satisfaction-pulse-widget.ts` | ✅ L38 | ✅ L39 | — | ✅ Correct |
| `dynamic-client-forms-builder.ts` | ✅ L27 | ✅ L28 | — | ✅ Correct |
| `license-optimizer.ts` | ✅ L10 | ✅ L11 | — | ✅ Correct |
| `dmarc-coach.ts` | ✅ L9 | ✅ L10 | — | ✅ Correct |
| `training-hub.ts` | ✅ L9 | ✅ L10 | — | ✅ Correct |
| `insurance-binder.ts` | ✅ L9 | ✅ L10 | — | ✅ Correct |
| `status-page.ts` | ✅ L45 | ✅ L46 | — | ✅ Correct |
| `uptime-monitor.ts` | ✅ L11 | ✅ L12 | — | ✅ Correct |
| `webhook-management.ts` | ✅ L15 | ✅ L16 | Per-route | ✅ Correct |
| `bulk.ts` | ✅ L11 | ✅ L11 | ✅ L11 | ✅ Correct |
| `organizations.ts` | ✅ L25 | Per-route (`requireOrgAccessByParam`) | Per-route | ✅ Partial (see ACM-008) |

### System/Admin Routes (no `requireOrgAccess`)

| Route File | `requireAuth` | `requireOrgAccess` | `requireAdmin` | Status |
|---|---|---|---|---|
| `profiles.ts` | ✅ L23 | ❌ | — | ❌ ACM-001 |
| `users.ts` | ✅ L11 | ❌ | Per-route | ❌ ACM-002 |
| `roles.ts` | ✅ L12 | ❌ | Per-route | ❌ ACM-003 |
| `search.ts` | ✅ L9 | ❌ | ✅ L9 | ⚠️ ACM-004 |
| `search-portal.ts` | ✅ L8 | ❌ | — | ⚠️ ACM-005 |
| `audit.ts` | ✅ L10 | ❌ | ✅ L10 | ⚠️ ACM-006 |
| `dashboard.ts` | ✅ L10 | ❌ | ✅ L11 | ⚠️ ACM-007 |
| `business-os.ts` | ✅ L10 | ❌ | ✅ L11 | ⚠️ ACM-007 |
| `admin.ts` | ✅ L10 | ❌ | ✅ L11 | ✅ Intentional |

### Public/Unauthenticated Routes

| Route File | `requireAuth` | Notes |
|---|---|---|
| `health.ts` | ❌ | Public health check. Correct by design. |
| `public.ts` | ❌ | Public contact form. Correct by design. |
| `webhooks.ts` | ❌ | External service webhooks. Correct by design. |
| `docs.ts` | ❌ | Swagger UI + OpenAPI spec. Correct by design. |
| `auth.ts` | Mixed | /sign-in, /sign-up, /callback, /forgot-password, /reset-password are public. /me, /sign-out are authenticated. Correct by design. |

---

## Detailed Findings

### ACM-001: Profiles route has no org scope (P1)

**Location:** `apps/api/src/routes/profiles.ts:23`

All profile endpoints use only `requireAuth`. `GET /` returns all profiles matching query params (ids, email). `GET /:id` returns any profile by ID. `PATCH /:id` uses the `req.authUser!.userId !== req.params.id` check to restrict self-editing, but this can be bypassed if the user has `is_super_admin` flag.

**Evidence:**
- `PATCH /:id` (lines 78-139): Self-editing restriction exists (line 83) but the fallback is admin-only (lines 84-93): "if not the same user, check `is_super_admin`". No org scope check.
- `POST /:id/avatar` (lines 141-188): No authorization check at all — the route checks file type but NOT who the user is. Any authenticated user can upload an avatar for any user ID.

**Impact:** Cross-tenant avatar upload (write) and profile data enumeration (read).

**Fix:** Add `requireOrgAccess` to profiles router. For avatar upload, verify `req.params.id === req.authUser.userId`.

---

### ACM-002: Users route exposes cross-tenant data (P1)

**Location:** `apps/api/src/routes/users.ts:11`

The users router lacks `requireOrgAccess`. `GET /:id`, `GET /:id/detail`, and `GET /:id/permissions` all use `getSupabaseAdmin()` and accept any user ID.

**Evidence:**
- `GET /:id` (lines 160-176): No admin check. Any user can GET any user.
- `GET /:id/detail` (lines 178-255): Returns full profile + memberships + organizations + roles. Any user can access.
- `GET /:id/permissions` (lines 294-355): Returns role permissions and overrides. Any user can access.
- `GET /` (lines 13-28): Has `requireAdmin` — correct.
- `PATCH /:id/role` (lines 257-292): Has `requireAdmin` — correct.

**Impact:** Cross-tenant information disclosure for all user data (profile, memberships, roles, orgs, permissions).

**Fix:** Add `requireAdmin` to `GET /:id`, `GET /:id/detail`, and `GET /:id/permissions`.

---

### ACM-003: Roles endpoint accessible to all authenticated users (P2)

**Location:** `apps/api/src/routes/roles.ts:12`

Roles list and detail endpoints require only `requireAuth`. No admin or org scoping.

**Evidence:**
- `GET /` (line 14): Returns all roles with id, key, name, description, is_system
- `GET /:id` (line 33): Returns any role by ID
- `GET /:id/permissions` (line 78): Returns role-to-permission mappings — no auth check (only `requireAuth` from the router-level middleware)

**Impact:** Any authenticated user can enumerate the full list of system roles and their permission mappings. This enables privilege escalation reconnaissance (e.g., identifying the `super_admin` role ID).

**Fix:** Add `requireAdmin` to the roles router-level middleware, or at minimum to `GET /:id/permissions`.

---

### ACM-004: Search route admin-only but not org-scoped (P2)

**Location:** `apps/api/src/routes/search.ts:9`

Admin search uses `requireAuth + requireAdmin` but no `requireOrgAccess`. It searches across ALL organizations.

**Evidence:**
- Line 9: `router.use(requireAuth, requireAdmin);`
- Lines 19-48: Searches profiles, organizations, tickets, projects across ALL tenants using `getSupabaseAdmin()`

**Impact:** The admin search correctly returns all data (admins need cross-org visibility). This is intentional, not a bug. However, there is no audit trail for admin searches — an admin could search for sensitive terms across tenants without accountability.

**Fix:** Add audit logging for admin search queries (log the search term and user).

---

### ACM-005: Portal search scoped by membership but no org access middleware (P2)

**Location:** `apps/api/src/routes/search-portal.ts:8`

Portal search uses only `requireAuth`. It manually scopes results by querying `memberships` for the user's orgs (lines 22-29).

**Evidence:**
- Line 8: `router.use(requireAuth);` — no `requireOrgAccess`
- Lines 22-29: Manually fetches `memberships` to get org IDs — this duplicates `requireOrgAccess` logic
- Lines 35-49: Searches tickets and projects filtered by `orgIds`

**Impact:** The manual membership query is redundant with `requireOrgAccess`. If the membership query were to fail silently (unlikely but possible), the search would return no results (safe failure). No access gap, but architectural inconsistency.

**Fix:** Replace manual membership query with `requireOrgAccess` middleware and use `req.query.organization_id`.

---

### ACM-006: Audit route admin-only but no org scoping filter requirement (P2)

**Location:** `apps/api/src/routes/audit.ts:10`

The audit log router is admin-only. It allows filtering by `organization_id` but does not require it.

**Evidence:**
- Line 10: `router.use(requireAuth, requireAdmin);`
- Lines 22-37: Optional filters for `actor_user_id`, `organization_id`, `action`, `entity_type`, `entity_id`
- With no filters, returns ALL audit logs across ALL orgs

**Impact:** An admin can view audit logs across all tenants without an explicit org filter. This is correct behavior for super admins but should be gated. A regular admin should only see logs for their own orgs.

**Fix:** Add an org scope requirement based on the admin's memberships. Only super admins should see all logs.

---

### ACM-007: Dashboard/Business-OS routes admin-only but cross-tenant (P2)

**Location:** `apps/api/src/routes/dashboard.ts:10-11`, `apps/api/src/routes/business-os.ts:10-11`

Both dashboard routes use `requireAuth + requireAdmin` without `requireOrgAccess`. They return cross-tenant aggregate counts.

**Evidence:**
- `dashboard.ts` lines 13-54: Returns counts of ALL organizations, tickets, projects, documents, pending memberships across all tenants
- `business-os.ts` lines 13-192: Returns org list, open tickets, active projects, documents, pending approvals, users — all cross-tenant

**Impact:** Any admin can see aggregate counts across all tenants. This is likely intentional for the admin dashboard, but the `dashboard/summary` endpoint could benefit from optional org scoping.

**Fix:** Add optional `organization_id` query parameter support. No change needed if cross-tenant admin dashboard is intentional.

---

### ACM-008: Organizations routes have mixed middleware approach (P3)

**Location:** `apps/api/src/routes/organizations.ts`

The organizations router uses a mix of `requireOrgAccessByParam` (per-route) and `requireAdmin` (per-route). The `GET /` list endpoint does NOT use `requireOrgAccess` — instead it manually queries memberships (lines 31-35).

**Evidence:**
- `GET /` (lines 27-62): Manually filters orgs by user's memberships. This is correct behavior but duplicates middleware logic.
- `GET /:id` (line 64): Uses `requireOrgAccessByParam` — correct.
- `POST /` (line 145): Uses `requireAdmin` — correct.
- `PATCH /:id` (line 178): Uses `requireAdmin + requireIfMatch` — correct.
- `DELETE /:id` (line 235): Uses `requireAdmin` — correct.

**Impact:** The manual membership query in `GET /` is functionally correct but bypasses the `requireOrgAccess` pattern. Inconsistent but not vulnerable.

**Fix:** Consider removing manual membership query and adding `requireOrgAccess` to `GET /` (though the current approach is functionally equivalent).

---

## Permission Model Analysis

### Role Hierarchy

The system uses a flat role model (not hierarchical). Roles are defined in `roles` table with `key` field:
- `super_admin` — full system access (protected from permission modification)
- `admin` — org-level administration
- `member` — standard org user
- Additional custom roles via migrations

**Permissions** are defined in `permissions` table and mapped to roles via `role_permissions`:
- 26 permissions seeded in `5302028_seed_permissions.sql`
- `user_permission_overrides` allows per-user exceptions per-org

### Gap: No granular permission middleware

There is no middleware that checks whether a user has a specific permission (e.g., "tickets.create") before allowing an operation. Access control is binary:

1. **Authenticated** — can use any `requireAuth` route
2. **Org member** — can access org-scoped entity routes
3. **Admin** — can access admin-only routes

Fine-grained permissions are enforced only via:
- RLS policies on Supabase tables (database layer)
- The admin UI (filtering UI elements by role)

**Fix (optional):** Consider adding a `requirePermission(permissionKey)` middleware for future granularity.

---

## Summary Matrix

| Route | Auth | Org Scope | Admin | Fine-Grained Permissions | Risk |
|---|---|---|---|---|---|
| Tickets | ✅ | ✅ | — | RLS only | Low |
| Projects | ✅ | ✅ | — | RLS only | Low |
| Documents | ✅ | ✅ | — | RLS only | Low |
| Memberships | ✅ | ✅ | Per-route | RLS only | Low |
| Organizations | ✅ | Per-route | Per-route | RLS only | Low |
| Billing | ✅ | ✅ | — | RLS only | Low |
| Notifications | ✅ | ✅ | — | RLS only | Low |
| Profiles | ✅ | ❌ | — | RLS only | **High** |
| Users | ✅ | ❌ | Per-route | RLS only | **High** |
| Roles | ✅ | ❌ | Per-route | RLS only | Medium |
| Search | ✅ | ❌ | ✅ | RLS only | Low* |
| Portal Search | ✅ | ❌ (manual) | — | RLS only | Low* |
| Audit | ✅ | ❌ | ✅ | None | Medium |
| Dashboard | ✅ | ❌ | ✅ | None | Low* |
| Business OS | ✅ | ❌ | ✅ | None | Low* |
| Admin | ✅ | ❌ | ✅ | None | Low* |
| Health | ❌ | — | — | — | Low |
| Public | ❌ | — | — | — | Low |
| Webhooks | ❌ | — | — | Signature | Low |
| Docs | ❌ | — | — | — | Low |
| 34x module routes | ✅ | ✅ | — | RLS only | Low |

*Low risk = intentional admin-only route or correct by design

---

## Recommendations

1. **P1 — Add org scope to profiles route** (`apps/api/src/routes/profiles.ts`): Add `requireOrgAccess` or restrict to own profile.
2. **P1 — Add admin gate to users detail/permissions** (`apps/api/src/routes/users.ts`): `GET /:id/detail` and `GET /:id/permissions` require admin.
3. **P2 — Add admin gate to roles endpoints** (`apps/api/src/routes/roles.ts`): All roles endpoints except basic list require admin.
4. **P2 — Add audit logging to admin search** (`apps/api/src/routes/search.ts`): Log admin search queries.
5. **P2 — Add org scope filter to audit route** (`apps/api/src/routes/audit.ts`): Require explicit org filter or super_admin for cross-tenant audit access.
6. **P3 — Consolidate org scope pattern in organizations.ts**: Use `requireOrgAccess` consistently.
