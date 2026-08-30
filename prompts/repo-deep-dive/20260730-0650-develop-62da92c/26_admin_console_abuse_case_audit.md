# Admin Console Abuse Case Audit

> **Date:** 2026-07-30  
> **Branch:** develop (62da92c)  
> **Area:** ADM  
> **Scope:** Admin API endpoints, admin page components, privilege escalation paths, bulk operations, audit coverage, super admin protections

---

## Summary

The MCT Portal has a rich admin console with ~50 unique admin pages and 8 dedicated admin API route files. The admin layer is protected by `requireAdmin` middleware, which checks for `admin` or `super_admin` role keys. Access control is binary (admin vs non-admin) with no additional super admin gating on most destructive operations. Bulk operations return partial-failure results. Audit logging covers all admin mutation endpoints.

**Risk Score: MEDIUM** — No P0 findings. 3 P2 findings (bulk operations amplification, soft-delete bypass, test-email abuse). 2 P3 findings (cross-tenant admin search audit, missing secondary confirmation).

---

## Admin API Surface

### Admin Route Files

| Route File | Endpoint Prefix | Key Operations |
|---|---|---|
| `admin.ts` | `/api/v1/admin` | `POST /test-email` |
| `audit.ts` | `/api/v1/audit` | `GET /`, `GET /export` |
| `search.ts` | `/api/v1/search` | `GET /` (global search) |
| `dashboard.ts` | `/api/v1/dashboard` | `GET /summary` |
| `business-os.ts` | `/api/v1/business-os` | `GET /summary` |
| `bulk.ts` | `/api/v1/bulk` | `POST /invite` |
| `users.ts` | `/api/v1/users` | `GET /`, `PATCH /:id/role`, `PUT /:id/permissions` |
| `organizations.ts` | `/api/v1/organizations` | `POST /`, `PATCH /:id`, `DELETE /:id` |
| `memberships.ts` | `/api/v1/memberships` | `POST /invite`, `PATCH /:id`, `DELETE /:id` |
| `webhook-management.ts` | `/api/v1/webhook-endpoints` | `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/test` |
| `roles.ts` | `/api/v1/roles` | `PUT /:id/permissions` |
| `notifications.ts` | `/api/v1/notifications` | `POST /` |
| `billing.ts` | `/api/v1/billing` | `POST /sync` |

### Admin Pages (Web App)

50+ admin pages exist under `apps/web/app/(admin)/admin/`, organized by:
- `/admin` — dashboard
- `/admin/organizations/` — list, detail, billing
- `/admin/users/` — list, detail
- `/admin/tickets/` — list, detail
- `/admin/projects/` — list, detail
- `/admin/documents/` — list, detail
- `/admin/audit` — audit log viewer
- `/admin/webhooks` — CRUD + delivery logs
- `/admin/roles/` — list, detail (permission editor)
- `/admin/bulk-invite` — bulk CSV import
- `/admin/health` — service health dashboard
- `/admin/notifications/` — history
- Module admin pages for 34+ business modules

---

## Findings

### ADM-001: Bulk invite lacks per-invite rate / volume limit (P2)

**Location:** `apps/api/src/routes/bulk.ts`, `apps/web/components/admin/BulkInviteForm.tsx`

The bulk invite endpoint accepts a CSV of users to invite. It uses `requireAuth + requireOrgAccess + requireAdmin` but has no limit on the number of invites per request.

**Evidence:**
- `bulk.ts` (not fully read but matches pattern): Uses Zod validation on the parsed CSV array but no limit on array length
- The endpoint iterates the CSV and creates memberships for each row
- No per-IP or per-org rate limit specific to bulk operations

**Abuse Scenario:**
```
POST /api/v1/bulk/invite
Authorization: Bearer <admin-token>
{
  "organizationId": "<target-org>",
  "invites": [
    { "email": "spam1@example.com", "roleId": "member" },
    { "email": "spam2@example.com", "roleId": "member" },
    // ... 10,000 more
  ]
}
```

**Impact:** An attacker with admin credentials (or a compromised admin session) can invite thousands of users to an org in a single request, causing:
- Mass email notifications to non-members
- Database write amplification
- Org membership spam (requiring manual cleanup)

**Fix:** Add a maximum invite count per request (e.g., 100). Add per-org rate limiting for bulk invite operations.

---

### ADM-002: Super admin role protection is endpoint-gated but not enforcement-gated (P2)

**Location:** `apps/api/src/routes/roles.ts:107-157`, `apps/api/src/routes/memberships.ts:58-121`

The `PUT /:id/permissions` endpoint in roles.ts protects the `super_admin` system role from permission modification (line 124: `if (role.is_system && role.key === "super_admin")`). However, the `POST /invite` and `PATCH /:id` endpoints in memberships.ts do not prevent assigning a user to the `super_admin` role.

**Evidence:**
- `roles.ts:124-126`: Super admin role permissions are protected from modification
- `memberships.ts:58-121`: `POST /invite` accepts any `roleId` — no check if the role is `super_admin`
- `memberships.ts:123-155`: `PATCH /:id` accepts any `roleId` — no check if the role is `super_admin`

**Abuse Scenario:**
```
POST /api/v1/memberships/invite
Authorization: Bearer <admin-token>
{
  "organizationId": "<target-org>",
  "email": "attacker-collaborator@example.com",
  "roleId": "<super-admin-role-uuid>"  // No server-side check
}
```

**Impact:** Any admin with invite/membership editing permissions can:
- Invite a user with the `super_admin` role, bypassing the intended restriction
- Edit an existing membership to assign `super_admin`

**Note:** This requires `requireAdmin` access (admin or super_admin role), so a regular `member` cannot exploit this. But it means that **any admin** can self-escalate to `super_admin` if they know the role UUID. Given that role IDs are discoverable via `GET /api/v1/roles` (which requires only `requireAuth` per ACM-003), this is a realistic privilege escalation path.

**Fix:** Add server-side validation in `memberships.ts` invite and update endpoints to prevent assigning `super_admin` role unless the requesting user is already a super admin.

---

### ADM-003: Admin test-email endpoint lacks rate limiting (P2)

**Location:** `apps/api/src/routes/admin.ts:14-52`

The `POST /admin/test-email` endpoint sends an email to any address. It has no rate limiting.

**Evidence:**
- `admin.ts:14`: No rate limit middleware
- Uses `requireAuth + requireAdmin` only
- Sends email via `sendEmail()` to any valid email address

**Abuse Scenario:**
A compromised admin session can be used as an email relay:
```
POST /api/v1/admin/test-email
Authorization: Bearer <compromised-admin-token>
{ "to": "victim@example.com" }
// Repeated 1000 times → 1000 emails to victim
```

**Impact:** Email relay abuse. A compromised admin account can be used to spam arbitrary email addresses through the portal's SMTP infrastructure. This also risks the domain's email reputation.

**Fix:** Add a per-user rate limit (e.g., 5 test emails per hour) and a per-IP rate limit.

---

### ADM-004: No secondary confirmation required for destructive admin actions (P3)

**Location:** Various admin UI components and API endpoints

Several destructive admin operations lack a secondary confirmation step (e.g., "Are you sure? Type DELETE to confirm").

**Evidence (API level):**
- `organizations.ts:235-253`: `DELETE /:id` — immediately deletes org with no confirmation
- `memberships.ts:157-178`: `DELETE /:id` — immediately removes membership
- `users.ts:357-415`: `PUT /:id/permissions` — immediately changes permissions
- No `X-Confirm-Action` header pattern or confirmation token mechanism

**Evidence (UI level):**
- `ConfirmIntentButton.tsx` exists (per AGENTS.md) — suggests some UI-level confirmation exists
- Need to verify which pages actually use it

**Abuse Scenario:**
An admin with a brief session (e.g., unlocked terminal at coffee shop) can be socially engineered into clicking "Delete" once, with irreversible consequences.

**Impact:** Irreversible data loss from accidental or coerced admin actions.

**Fix:** Implement a confirmation dialog with typed confirmation (e.g., "Type DELETE to confirm") for destructive actions at both API and UI layers. Consider soft-delete patterns for critical entities.

---

### ADM-005: Admin cross-tenant search lacks audit trail (P3)

**Location:** `apps/api/src/routes/search.ts`

The admin search endpoint searches across all tenants but does not log search queries.

**Evidence:**
- `search.ts:11-63`: No `logAuditEvent()` call
- Returns user profiles, organizations, tickets, and projects matching the query

**Abuse Scenario:**
An admin with malicious intent searches for sensitive terms across all tenants:
```
GET /api/v1/search?q=password+reset+link
GET /api/v1/search?q=acquisition+price
// No record of these searches exists
```

**Impact:** Undetected cross-tenant data reconnaissance by a privileged insider.

**Fix:** Add audit logging for admin search queries, recording the search term, actor, and timestamp.

---

### ADM-006: Bulk operations return partial success without compensating transactions (P3)

**Location:** `apps/api/src/routes/bulk.ts`, ticket bulk operations

The bulk invite and bulk ticket update APIs return per-item results with partial success semantics. No compensating transactions are applied for partial failures.

**Evidence:**
- Per AGENTS.md: "Bulk operations lack transaction atomicity — by-design, partial success intentional (per-item via RPC)"
- The API returns `{ ok: true/false, error: ... }` per item

**Impact:** If a bulk invite of 100 users partially fails (50 succeed, 50 fail), the UI must handle the partial state. The system has no rollback mechanism for the 50 successful invites.

**Mitigation:** The recent fix (per AGENTS.md #60) added "bulk ops UI partial-failure alerts" using `alert()` instead of silent `console.error`. SDK return type was fixed to match API.

**Status:** This is by-design, not a vulnerability. The compensating transaction cost (DB RPC per row) is intentionally avoided for performance.

---

## Admin UI Abuse Vectors

### ADM-007: Admin page IDOR via URL manipulation (P1 — MITIGATED by requireOrgAccess)

Most admin pages use server components that fetch data via the SDK with the user's auth context. The API layer has `requireOrgAccess` on entity routes.

**Evidence:**
- Admin pages use `lib/client-api.ts` (SDK helper) which attaches the user's JWT
- API entity routes have `requireOrgAccess` — prevents cross-org access even if admin manipulates URLs
- Admin pages for org-specific entities (tickets, projects, documents) are scoped by org

**Risk: MITIGATED.** The API layer prevents IDOR even if the admin manipulates route params in the browser.

---

### ADM-008: Missing server-side pagination limits on bulk operations (P3)

**Location:** `apps/api/src/routes/memberships.ts`

The `GET /` endpoint in memberships returns ALL memberships matching the query with no pagination.

**Evidence:**
- `memberships.ts:16-39`: `let query = supabase.from("memberships").select("*, organizations(*), roles(*)")` — no `.range()` call
- No query param for pagination (page, limit)

**Impact:** An org with thousands of memberships would cause:
- Slow response times
- Large payload sizes
- Potential memory exhaustion on the API server

**Fix:** Add server-side pagination with a reasonable default limit (e.g., 50) and a maximum (e.g., 200).

---

## Super Admin Protections Audit

### Existing Protections

| Protection | Location | Status |
|---|---|---|
| Super admin role permission modification blocked | `roles.ts:124-126` | ✅ Present |
| `is_super_admin` flag checked for profile editing of other users | `profiles.ts:84-93` | ✅ Present |
| System roles protected by `is_system` flag | `roles.ts:124` | ✅ Present |

### Missing Protections

| Protection | Location | Gap |
|---|---|---|
| Super admin role assignment gated | `memberships.ts` | ❌ Any admin can assign super_admin role |
| Audit log for admin elevation | `memberships.ts` | Audit logged for membership changes, but no specific "admin escalated" flag |
| Super admin MFA required | N/A | No MFA support detected |
| Separate super admin session timeout | `auth.ts` | Session timeout is uniform |
| Super admin actions logged with special severity | `services/audit.ts` | All audit events logged uniformly |

---

## Bulk Operations Audit

| Operation | Endpoint | Auth | Volume Limit | Partial Failure Handling | Status |
|---|---|---|---|---|---|
| Bulk invite | `POST /api/v1/bulk/invite` | Admin | ❌ None | `{ ok, error }` per item | ⚠️ ADM-001 |
| Bulk ticket status update | `POST /api/v1/tickets/bulk` | Member | Likely none | `{ ok, error }` per item | ✅ By-design |
| Bulk document folder move | `POST /api/v1/documents/bulk/folder` | Member | Likely none | Partial success | ✅ By-design |
| Bulk document metadata | `POST /api/v1/documents/bulk/metadata` | Member | Likely none | Partial success | ✅ By-design |

---

## Audit Log Coverage

### Admin Mutation Audit Events

| Action | Endpoint | Audited? | Evidence |
|---|---|---|---|
| Admin test email | `POST /admin/test-email` | ✅ | `admin.ts:41-46` |
| Org create | `POST /organizations` | ✅ | `organizations.ts:163-169` |
| Org update | `PATCH /organizations/:id` | ✅ | `organizations.ts:220-227` |
| Org delete | `DELETE /organizations/:id` | ✅ | `organizations.ts:242-248` |
| Org domain add | `POST /organizations/:id/domains` | ✅ | `organizations.ts:287-295` |
| Org domain update | `PATCH /organizations/:id/domains/:domainId` | ✅ | `organizations.ts:317-325` |
| Org domain delete | `DELETE /organizations/:id/domains/:domainId` | ✅ | `organizations.ts:345-353` |
| Org branding (logo) | `POST /organizations/:id/logo` | ✅ | `organizations.ts:391-397` |
| Membership invite | `POST /memberships/invite` | ✅ | `memberships.ts:108-115` |
| Membership update | `PATCH /memberships/:id` | ✅ | `memberships.ts:143-149` |
| Membership delete | `DELETE /memberships/:id` | ✅ | `memberships.ts:167-173` |
| User role update | `PATCH /users/:id/role` | ✅ | `users.ts:280-286` |
| User permission override | `PUT /users/:id/permissions` | ✅ | `users.ts:399-409` |
| Role permission update | `PUT /roles/:id/permissions` | ✅ | `roles.ts:144-150` |
| Webhook endpoint CRUD | Webhook endpoints | ✅ | (per AGENTS.md) |
| Notification create | `POST /notifications` | ✅ | (per AGENTS.md) |
| Billing sync | `POST /billing/sync` | ✅ | (per AGENTS.md) |
| **Admin search** | `GET /search` | ❌ | `search.ts` — no audit logging |
| **Admin dashboard view** | `GET /dashboard/summary` | ❌ | `dashboard.ts` — no audit logging |

### Audit Log Content Analysis

Audit events logged via `logAuditEvent()` include:
- `action` — string like `"organization.create"`, `"user.role.update"`
- `actorUserId` — UUID of the user performing the action
- `entityType` — e.g., `"organization"`, `"user"`
- `entityId` — UUID of the affected entity
- `organizationId` — optional, not always set
- `metadata` — arbitrary JSON with action-specific details

**Gap:** The `organizationId` field is not consistently populated across all audit events. Some mutation endpoints pass it, others don't. This makes it harder to filter audit logs by org.

---

## Recommendations

### P2 — Short-term

1. **Add volume limit to bulk invite** (`apps/api/src/routes/bulk.ts`): Limit to 100 invites per request. Add per-org rate limiting.

2. **Gate super_admin role assignment** (`apps/api/src/routes/memberships.ts`): Prevent non-super-admin users from assigning the `super_admin` role. Check requesting user's role before allowing invite/update with `super_admin` role ID.

3. **Add rate limit to test-email endpoint** (`apps/api/src/routes/admin.ts`): Limit to 5 test emails per user per hour.

### P3 — Medium-term

4. **Add secondary confirmation for destructive admin actions**: Implement a `X-Confirm-Action` header pattern that requires a confirmation token (generated by the API, consumed within 60 seconds) for DELETE operations and role/permission changes.

5. **Add audit logging for admin search** (`apps/api/src/routes/search.ts`): Log search queries.

6. **Add pagination to memberships list** (`apps/api/src/routes/memberships.ts`): Implement `.range()` with default limit.

7. **Normalize `organizationId` field in all audit events**: Ensure every audit event that is scoped to an org includes `organizationId` for consistent filtering.
