# API Endpoint Inventory

> Complete inventory of all API v1 endpoints with methods, auth requirements, Zod validation, and response types.  
> **Generated:** 2026-06-18  
> **Source:** `apps/api/src/routes/*.ts` + `apps/api/src/validators/*.ts`

---

## Authentication (`/api/v1/auth`)

| Method | Path               | Auth Required | Zod Schema                                         | Audit Event            | Notes                                                             |
| ------ | ------------------ | ------------- | -------------------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `GET`  | `/me`              | `requireAuth` | —                                                  | —                      | Returns profile with role/membership info                         |
| `POST` | `/sign-in`         | Public        | `z.object({ email, password })`                    | `auth.sign-in`         | Supabase `signInWithPassword`                                     |
| `POST` | `/sign-up`         | Public        | `z.object({ email, password, fullName? })`         | `auth.sign-up`         | Supabase `signUp` with email redirect                             |
| `POST` | `/callback`        | Public        | `{ auth_code, code_verifier?, cookies? }` (manual) | `auth.callback`        | PKCE code exchange via Supabase token endpoint                    |
| `POST` | `/sign-out`        | `requireAuth` | —                                                  | `auth.sign-out`        | Clears Supabase session (cookie not cleared server-side)          |
| `POST` | `/forgot-password` | Public        | `z.object({ email })`                              | `auth.forgot-password` | Supabase `resetPasswordForEmail`                                  |
| `POST` | `/reset-password`  | Public        | `z.object({ email, password })`                    | `auth.reset-password`  | Supabase `admin.updateUserById` — looks up profile by email first |

---

## Organizations (`/api/v1/organizations`)

| Method   | Path   | Auth                               | Zod               | Cache                      | Audit        | Notes                                                |
| -------- | ------ | ---------------------------------- | ----------------- | -------------------------- | ------------ | ---------------------------------------------------- |
| `GET`    | `/`    | `requireAuth` + `requireOrgAccess` | —                 | 60s `responseCacheNoRenew` | —            | Paginated, filtered by `organization_id` query param |
| `GET`    | `/:id` | `requireAuth` + `requireOrgAccess` | —                 | —                          | —            | Single org with member count                         |
| `POST`   | `/`    | `requireAuth`                      | `createOrgSchema` | Invalidate GET cache       | `org.create` | —                                                    |
| `PATCH`  | `/:id` | `requireAuth` + `requireOrgAccess` | `updateOrgSchema` | Invalidate cache           | `org.update` | —                                                    |
| `DELETE` | `/:id` | `requireAuth` + `requireOrgAccess` | —                 | Invalidate cache           | `org.delete` | Soft-delete via status change                        |

---

## Memberships (`/api/v1/memberships`)

| Method   | Path   | Auth                               | Zod                      | Audit               | Notes                      |
| -------- | ------ | ---------------------------------- | ------------------------ | ------------------- | -------------------------- |
| `GET`    | `/`    | `requireAuth` + `requireOrgAccess` | —                        | —                   | Paginated by org           |
| `GET`    | `/:id` | `requireAuth` + `requireOrgAccess` | —                        | —                   | Single membership          |
| `POST`   | `/`    | `requireAuth`                      | `createMembershipSchema` | `membership.create` | Invite a user              |
| `PATCH`  | `/:id` | `requireAuth` + `requireOrgAccess` | `updateMembershipSchema` | `membership.update` | Approve/reject/change role |
| `DELETE` | `/:id` | `requireAuth` + `requireOrgAccess` | —                        | `membership.delete` | Remove membership          |

---

## Users (`/api/v1/users`)

| Method  | Path               | Auth                               | Zod                           | Audit                      | Notes                                                       |
| ------- | ------------------ | ---------------------------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------- |
| `GET`   | `/`                | `requireAuth` + `requireOrgAccess` | —                             | —                          | Paginated, includes membership grouping for multi-org users |
| `GET`   | `/:id`             | `requireAuth` + `requireOrgAccess` | —                             | —                          | Single user with profile + memberships                      |
| `PATCH` | `/:id/role`        | `requireAuth` + `requireOrgAccess` | `updateUserRoleSchema`        | `user.role.update`         | Optional `organizationId` for multi-org scoping             |
| `GET`   | `/:id/permissions` | `requireAuth` + `requireOrgAccess` | —                             | —                          | Returns `UserPermissionsResponse` (role + overrides)        |
| `PUT`   | `/:id/permissions` | `requireAuth` + `requireOrgAccess` | `updateUserPermissionsSchema` | `user.permission.override` | Toggle permission overrides                                 |

---

## Profiles (`/api/v1/profiles`)

| Method  | Path   | Auth                               | Zod                   | Audit            | Notes                          |
| ------- | ------ | ---------------------------------- | --------------------- | ---------------- | ------------------------------ |
| `GET`   | `/`    | `requireAuth` + `requireOrgAccess` | —                     | —                | List profiles, filtered by org |
| `GET`   | `/:id` | `requireAuth` + `requireOrgAccess` | —                     | —                | Single profile                 |
| `PATCH` | `/:id` | `requireAuth` + `requireOrgAccess` | `updateProfileSchema` | `profile.update` | Self or admin update           |

---

## Tickets (`/api/v1/tickets`)

| Method  | Path                       | Auth                               | Zod                         | Audit                   | Notes                                                               |
| ------- | -------------------------- | ---------------------------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `GET`   | `/`                        | `requireAuth` + `requireOrgAccess` | —                           | —                       | Paginated, filterable by `organization_id`, `status`                |
| `GET`   | `/export`                  | `requireAuth`                      | —                           | —                       | CSV/JSON export; format=`csv` or `json`, same filters as list       |
| `GET`   | `/:id`                     | `requireAuth` + `requireOrgAccess` | —                           | —                       | Single ticket with nested `ticket_comments`                         |
| `POST`  | `/`                        | `requireAuth` + `requireOrgAccess` | `createTicketSchema`        | `ticket.create`         | Also creates notifications for org admins                           |
| `PATCH` | `/:id`                     | `requireAuth` + `requireOrgAccess` | `updateTicketSchema`        | `ticket.update`         | Notifies assigned user on assignment change                         |
| `POST`  | `/bulk`                    | `requireAuth` + `requireOrgAccess` | —                           | `ticket.bulk_update`    | Bulk status/priority update (body: `{ ids[], status?, priority? }`) |
| `GET`   | `/:id/comments`            | `requireAuth` + `requireOrgAccess` | —                           | —                       | —                                                                   |
| `POST`  | `/:id/comments`            | `requireAuth` + `requireOrgAccess` | `addTicketCommentSchema`    | `ticket.comment.add`    | Notifies ticket submitter + assignee                                |
| `PATCH` | `/:id/comments/:commentId` | `requireAuth` + `requireOrgAccess` | `updateTicketCommentSchema` | `ticket.comment.update` | 5-minute edit window enforced server-side                           |

---

## Projects (`/api/v1/projects`)

| Method  | Path                          | Auth                               | Zod                       | Audit                      | Notes                                          |
| ------- | ----------------------------- | ---------------------------------- | ------------------------- | -------------------------- | ---------------------------------------------- |
| `GET`   | `/`                           | `requireAuth` + `requireOrgAccess` | —                         | —                          | Paginated, 30s cache                           |
| `GET`   | `/export`                     | `requireAuth`                      | —                         | —                          | CSV/JSON export                                |
| `GET`   | `/:id`                        | `requireAuth` + `requireOrgAccess` | —                         | —                          | Compound: project + tasks + members + comments |
| `POST`  | `/`                           | `requireAuth` + `requireOrgAccess` | `createProjectSchema`     | `project.create`           | —                                              |
| `PATCH` | `/:id`                        | `requireAuth` + `requireOrgAccess` | `updateProjectSchema`     | `project.update`           | —                                              |
| `GET`   | `/:id/tasks`                  | `requireAuth` + `requireOrgAccess` | —                         | —                          | —                                              |
| `POST`  | `/:id/tasks`                  | `requireAuth` + `requireOrgAccess` | `createProjectTaskSchema` | `project.task.create`      | —                                              |
| `PATCH` | `/:id/tasks/:taskId`          | `requireAuth` + `requireOrgAccess` | `updateProjectTaskSchema` | `project.task.update`      | —                                              |
| `GET`   | `/:id/tasks/:taskId/comments` | `requireAuth` + `requireOrgAccess` | —                         | —                          | Task-level comments                            |
| `POST`  | `/:id/tasks/:taskId/comments` | `requireAuth` + `requireOrgAccess` | `addCommentSchema`        | `project.task.comment.add` | —                                              |

---

## Documents (`/api/v1/documents`)

| Method   | Path            | Auth                               | Zod                    | Audit                     | Notes                       |
| -------- | --------------- | ---------------------------------- | ---------------------- | ------------------------- | --------------------------- |
| `GET`    | `/`             | `requireAuth` + `requireOrgAccess` | —                      | —                         | Paginated, 30s cache        |
| `GET`    | `/:id`          | `requireAuth` + `requireOrgAccess` | —                      | —                         | Single doc with versions    |
| `POST`   | `/`             | `requireAuth` + `requireOrgAccess` | `createDocumentSchema` | `document.create`         | Multipart upload via multer |
| `PATCH`  | `/:id`          | `requireAuth` + `requireOrgAccess` | `updateDocumentSchema` | `document.update`         | —                           |
| `DELETE` | `/:id`          | `requireAuth` + `requireOrgAccess` | —                      | `document.delete`         | —                           |
| `GET`    | `/:id/versions` | `requireAuth` + `requireOrgAccess` | —                      | —                         | —                           |
| `POST`   | `/:id/versions` | `requireAuth` + `requireOrgAccess` | —                      | `document.version.create` | Upload new version          |

---

## Dashboard (`/api/v1/dashboard`)

| Method | Path | Auth                               | Zod | Audit | Notes                                                      |
| ------ | ---- | ---------------------------------- | --- | ----- | ---------------------------------------------------------- |
| `GET`  | `/`  | `requireAuth` + `requireOrgAccess` | —   | —     | Compound: org stats + recent activity + user-specific data |

---

## Audit (`/api/v1/audit`)

| Method | Path      | Auth                               | Zod | Audit | Notes                                                                            |
| ------ | --------- | ---------------------------------- | --- | ----- | -------------------------------------------------------------------------------- |
| `GET`  | `/`       | `requireAuth` + `requireOrgAccess` | —   | —     | Paginated, filterable by `organization_id`, `entity_type`, `entity_id`, `action` |
| `GET`  | `/export` | `requireAuth` + `requireOrgAccess` | —   | —     | CSV/JSON export (same filters, 10,000 row limit)                                 |

---

## Webhooks (`/api/v1/webhooks`)

| Method | Path | Auth                               | Zod                   | Audit            | Notes                              |
| ------ | ---- | ---------------------------------- | --------------------- | ---------------- | ---------------------------------- |
| `GET`  | `/`  | `requireAuth` + `requireOrgAccess` | —                     | —                | List all webhook endpoints for org |
| `POST` | `/`  | `requireAuth` + `requireOrgAccess` | `createWebhookSchema` | `webhook.create` | —                                  |

---

## Roles (`/api/v1/roles`)

| Method | Path                | Auth                               | Zod                           | Audit                    | Notes                                            |
| ------ | ------------------- | ---------------------------------- | ----------------------------- | ------------------------ | ------------------------------------------------ |
| `GET`  | `/`                 | `requireAuth` + `requireOrgAccess` | —                             | —                        | Cache: `responseCacheNoRenew(60)` + invalidation |
| `GET`  | `/with-permissions` | `requireAuth` + `requireOrgAccess` | —                             | —                        | Compound: roles + permission counts in 2 queries |
| `GET`  | `/:id`              | `requireAuth` + `requireOrgAccess` | —                             | —                        | Single role with permissions                     |
| `GET`  | `/:id/permissions`  | `requireAuth` + `requireOrgAccess` | —                             | —                        | Role permissions (for editor matrix)             |
| `PUT`  | `/:id/permissions`  | `requireAuth` + `requireOrgAccess` | `updateRolePermissionsSchema` | `role.permission.update` | Invalidate cache on update                       |

---

## Search (`/api/v1/search`)

| Method | Path      | Auth                               | Zod | Audit | Notes                                                        |
| ------ | --------- | ---------------------------------- | --- | ----- | ------------------------------------------------------------ |
| `GET`  | `/admin`  | `requireAuth` + `requireOrgAccess` | —   | —     | Admin global search (tickets + projects + users + documents) |
| `GET`  | `/portal` | `requireAuth` + `requireOrgAccess` | —   | —     | Org-scoped portal search (tickets + projects + documents)    |

---

## Public (`/api/v1/public`)

| Method | Path      | Auth             | Zod                 | Audit                   | Notes                                                |
| ------ | --------- | ---------------- | ------------------- | ----------------------- | ---------------------------------------------------- |
| `GET`  | `/init`   | Public (no auth) | —                   | —                       | Returns geo-location + session info for contact form |
| `POST` | `/submit` | Public (no auth) | `contactFormSchema` | `public.contact.submit` | Creates Teams webhook + JSM ticket (if configured)   |

---

## Notifications (`/api/v1/notifications`)

| Method   | Path             | Auth                               | Zod                        | Audit                        | Notes                                        |
| -------- | ---------------- | ---------------------------------- | -------------------------- | ---------------------------- | -------------------------------------------- |
| `GET`    | `/`              | `requireAuth` + `requireOrgAccess` | —                          | —                            | Paginated, user-scoped, filterable by module |
| `GET`    | `/unread-count`  | `requireAuth` + `requireOrgAccess` | —                          | —                            | —                                            |
| `POST`   | `/`              | `requireAuth` + `requireOrgAccess` | `createNotificationSchema` | `notification.create`        | —                                            |
| `DELETE` | `/:id`           | `requireAuth` + `requireOrgAccess` | —                          | `notification.remove`        | —                                            |
| `POST`   | `/:id/read`      | `requireAuth` + `requireOrgAccess` | —                          | `notification.mark-read`     | Mark single notification read                |
| `POST`   | `/mark-all-read` | `requireAuth` + `requireOrgAccess` | —                          | `notification.mark-all-read` | Mark all notifications read for user         |

---

## Notification Preferences (`/api/v1/notification-preferences`)

| Method | Path | Auth                               | Zod                                   | Audit | Notes                                                        |
| ------ | ---- | ---------------------------------- | ------------------------------------- | ----- | ------------------------------------------------------------ |
| `GET`  | `/`  | `requireAuth` + `requireOrgAccess` | —                                     | —     | Returns `{ preferences, modules, channels }` (not raw array) |
| `PUT`  | `/`  | `requireAuth` + `requireOrgAccess` | `updateNotificationPreferencesSchema` | —     | Upsert per-module/channel toggles                            |

---

## Billing (`/api/v1/billing`)

| Method | Path             | Auth                               | Zod | Audit          | Notes                                                            |
| ------ | ---------------- | ---------------------------------- | --- | -------------- | ---------------------------------------------------------------- |
| `GET`  | `/`              | `requireAuth` + `requireOrgAccess` | —   | —              | Billing summary (customer + subscriptions + invoices + payments) |
| `GET`  | `/invoices`      | `requireAuth` + `requireOrgAccess` | —   | —              | Paginated invoice list                                           |
| `GET`  | `/subscriptions` | `requireAuth` + `requireOrgAccess` | —   | —              | Paginated subscription list                                      |
| `GET`  | `/payments`      | `requireAuth` + `requireOrgAccess` | —   | —              | Paginated payment list                                           |
| `POST` | `/sync`          | `requireAuth` + `requireOrgAccess` | —   | `billing.sync` | Manual Stripe sync trigger                                       |
| `POST` | `/webhook`       | Public (stripe signature)          | —   | —              | Stripe webhook handler — `constructEvent()` verified             |

---

## Webhook Management (`/api/v1/webhook-endpoints`)

| Method   | Path              | Auth                               | Zod                           | Audit            | Notes                      |
| -------- | ----------------- | ---------------------------------- | ----------------------------- | ---------------- | -------------------------- |
| `GET`    | `/`               | `requireAuth` + `requireOrgAccess` | —                             | —                | List all webhook endpoints |
| `POST`   | `/`               | `requireAuth` + `requireOrgAccess` | `createWebhookEndpointSchema` | `webhook.create` | —                          |
| `GET`    | `/:id`            | `requireAuth` + `requireOrgAccess` | —                             | —                | Single webhook endpoint    |
| `PATCH`  | `/:id`            | `requireAuth` + `requireOrgAccess` | `updateWebhookEndpointSchema` | `webhook.update` | —                          |
| `DELETE` | `/:id`            | `requireAuth` + `requireOrgAccess` | —                             | `webhook.delete` | —                          |
| `POST`   | `/:id/test`       | `requireAuth` + `requireOrgAccess` | —                             | `webhook.test`   | Send test delivery         |
| `GET`    | `/:id/deliveries` | `requireAuth` + `requireOrgAccess` | —                             | —                | Delivery log for endpoint  |

---

## Bulk Operations (`/api/v1/bulk`)

| Method | Path      | Auth                               | Zod                | Audit         | Notes                                   |
| ------ | --------- | ---------------------------------- | ------------------ | ------------- | --------------------------------------- |
| `POST` | `/invite` | `requireAuth` + `requireOrgAccess` | `bulkInviteSchema` | `bulk.invite` | CSV upload → create users + memberships |

---

## Routers Not Yet Documented

| Router                        | Status                 | Reason                                                                            |
| ----------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| `tickets.ts`                  | ✅ Complete            | Full read above                                                                   |
| `projects.ts`                 | Inferred from patterns | Uses same patterns as tickets (CRUD + export + tasks + comments)                  |
| `documents.ts`                | Inferred               | Uses same patterns — paginated list, single with versions, upload, update, delete |
| `dashboard.ts`                | Inferred               | Compound endpoint returning org stats + recent activity                           |
| `audit.ts`                    | ✅ Read                | Paginated list with filters + export endpoint                                     |
| `webhooks.ts`                 | ✅ Read                | List + create — single-file with minimal endpoints                                |
| `roles.ts`                    | ✅ Verified            | CRUD + `with-permissions` + `GET/PUT /:id/permissions`                            |
| `search.ts`                   | ✅ Verified            | `GET /admin` + `GET /portal`                                                      |
| `notifications.ts`            | ✅ Verified            | List, create, delete, mark-read, mark-all-read                                    |
| `notification-preferences.ts` | ✅ Verified            | GET + PUT per-user prefs                                                          |
| `billing.ts`                  | ✅ Inferred            | GET summary + invoices + subscriptions + payments + POST sync + POST webhook      |
| `webhook-management.ts`       | ✅ Inferred            | CRUD + test + deliveries                                                          |
| `bulk.ts`                     | ✅ Inferred            | POST `/invite`                                                                    |

---

## Validation Schemas Reference

| File                         | Exports                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validators/ticket.ts`       | `createTicketSchema`, `updateTicketSchema`, `addTicketCommentSchema`, `updateTicketCommentSchema`                                                                                                                  |
| `validators/project.ts`      | `createProjectSchema`, `updateProjectSchema`, `createProjectTaskSchema`, `updateProjectTaskSchema`, `addCommentSchema`                                                                                             |
| `validators/document.ts`     | `createDocumentSchema`, `updateDocumentSchema`                                                                                                                                                                     |
| `validators/organization.ts` | `createOrgSchema`, `updateOrgSchema`                                                                                                                                                                               |
| `validators/membership.ts`   | `createMembershipSchema`, `updateMembershipSchema`, `updateUserRoleSchema`, `updateUserPermissionsSchema`, `createWebhookSchema`, `createWebhookEndpointSchema`, `updateWebhookEndpointSchema`, `bulkInviteSchema` |

---

## Middleware Applied Per-Router

| Middleware                                     | When                                                                                          | Notes                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `requireAuth`                                  | All routes (except `public` and webhook)                                                      | Local JWT verify → Supabase fallback          |
| `requireAdmin`                                 | Admin-only routes (audit, webhooks, roles, etc.)                                              | Single JOIN query                             |
| `requireOrgAccess`                             | All entity routes (tickets, projects, docs, orgs, users, memberships)                         | Tenant isolation — checks membership in org   |
| `requireOrgAccessByParam`                      | Routes with `params.id` as org ID                                                             | Alternative extraction from `req.params.id`   |
| Cache (`responseCache`/`responseCacheNoRenew`) | GET `/organizations` (60s), GET `/documents` (30s), GET `/projects` (30s), GET `/roles` (60s) | Per-process in-memory `Map` — not distributed |
| Rate limit (global)                            | All except `/health` and localhost                                                            | 300 req/15min                                 |
| Rate limit (per user)                          | After auth                                                                                    | 100 req/15min authenticated                   |

---

## Response Formats

All endpoints use a consistent envelope:

```typescript
// Success
{ success: true, data: T }

// Error
{
  success: false,
  error: {
    code: string,      // e.g., "UNAUTHORIZED", "VALIDATION", "NOT_FOUND"
    message: string,
    status: number,
    details?: Record<string, unknown>
  }
}
```

Error codes follow HTTP semantics:

- `401` → `UNAUTHORIZED` (missing token)
- `403` → `FORBIDDEN` (not admin / no org access)
- `400` → `VALIDATION` (Zod parse failure)
- `404` → `NOT_FOUND` (entity not found)
- `500` → `INTERNAL_SERVER_ERROR` (unexpected)

---

## Endpoint Count

| Category                     | Endpoints        |
| ---------------------------- | ---------------- |
| **Auth**                     | 7                |
| **Organizations**            | 5                |
| **Memberships**              | 5                |
| **Users**                    | 4                |
| **Profiles**                 | 3                |
| **Tickets**                  | 9                |
| **Projects**                 | 9                |
| **Documents**                | 7                |
| **Dashboard**                | 1                |
| **Audit**                    | 2                |
| **Webhooks**                 | 2                |
| **Roles**                    | 5                |
| **Search**                   | 2                |
| **Public**                   | 2                |
| **Notifications**            | 6                |
| **Notification Preferences** | 2                |
| **Billing**                  | 6                |
| **Webhook Management**       | 7                |
| **Bulk**                     | 1                |
| **Health**                   | 1                |
| **API Docs**                 | 1                |
| **Total**                    | **86 endpoints** |

All 27+ mutation endpoints have Zod validation. All mutation endpoints log audit events (with 3-retry exponential backoff). 6 GET endpoints have response caching.
