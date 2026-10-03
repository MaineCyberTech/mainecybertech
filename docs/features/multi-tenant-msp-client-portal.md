# Multi-Tenant MSP Client Portal

## Purpose

The foundational tenant-isolated portal surface that every client organization uses to consume MaineCyberTech managed services: ticketing (support), file exchange (documents), project tracking, approvals, and asset inventory. Every module in the platform layers on top of this foundation's authentication, membership, and organization-scoping model.

Primary users: client users, client admins, MSP technicians, MSP admins, platform super admins

Business impact: Critical (core delivery surface)

Category: platform

## Permissions

| Action                 | Roles                            |
| ---------------------- | -------------------------------- |
| View portal dashboard  | All authenticated org members    |
| List/view tickets      | All authenticated org members    |
| Create ticket          | All authenticated org members    |
| List/view documents    | All authenticated org members    |
| Upload documents       | All authenticated org members    |
| List/view projects     | All authenticated org members    |
| List/view assets       | All authenticated org members    |
| List/view approvals    | All authenticated org members    |
| Approve/reject request | client_admin, admin, super_admin |
| Manage memberships     | admin, super_admin               |
| View audit log         | admin, super_admin               |

Granular `module:view/create/edit/delete` permission keys for every sub-module are enforced via the permission catalog (see `docs/features` modules and migration `5302118_permission_matrix_full_catalog.sql`).

## Routes

### Portal Routes

| Route                       | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `GET /portal/dashboard`     | Landing page with quick actions + recent activity |
| `GET /portal/support`       | Support ticket list (create, view)                |
| `GET /portal/documents`     | Document library (grid/list/table views)          |
| `GET /portal/projects`      | Project list with tasks, timeline, calendar views |
| `GET /portal/projects/:id`  | Project detail (compound endpoint data)           |
| `GET /portal/approvals`     | Approval requests for the organization            |
| `GET /portal/assets`        | Asset inventory with warranty tracking            |
| `GET /portal/notifications` | Notification history                              |
| `GET /portal/profile`       | Self-service profile editing                      |

### API Routes

| Method                | Endpoint                                              | Description                                   |
| --------------------- | ----------------------------------------------------- | --------------------------------------------- |
| GET                   | `/api/v1/me`                                          | Current user profile + memberships            |
| GET                   | `/api/v1/me/permissions`                              | Effective permission union across memberships |
| GET                   | `/api/v1/organizations`                               | List organizations (scoped by membership)     |
| GET                   | `/api/v1/organizations/:id`                           | Get single organization                       |
| PATCH                 | `/api/v1/organizations/:id`                           | Update organization (If-Match locked)         |
| GET                   | `/api/v1/memberships`                                 | List memberships for current user             |
| GET/POST/PATCH/DELETE | `/api/v1/tickets` (+ `/:id`, `/bulk`, `/export`)      | Ticket lifecycle                              |
| GET/POST              | `/api/v1/tickets/:id/comments`                        | Ticket comments                               |
| GET/POST/PATCH/DELETE | `/api/v1/documents` (+ `/:id`, `/export`, signed-url) | Document library                              |
| GET/POST/PATCH/DELETE | `/api/v1/projects` (+ `/compound`, `/:id`, `/export`) | Project lifecycle                             |
| GET/POST              | `/api/v1/projects/:id/tasks`                          | Project task management                       |
| GET/POST/PATCH        | `/api/v1/approvals` (+ `/:id`, approve/reject)        | Approval workflows                            |
| GET/POST/PATCH/DELETE | `/api/v1/assets` (+ `/stats`, `/export`)              | Asset register                                |
| GET                   | `/api/v1/notifications`                               | Notification history + unread count           |
| GET                   | `/api/v1/audit`                                       | Audit log viewer                              |

## Data Model

### organizations

| Column         | Type        | Constraints                   | Description              |
| -------------- | ----------- | ----------------------------- | ------------------------ |
| id             | uuid        | PK, default gen_random_uuid() | Unique identifier        |
| name           | text        | NOT NULL                      | Organization name        |
| slug           | citext      | NOT NULL, UNIQUE              | URL slug                 |
| status         | org_status  | NOT NULL, default 'pending'   | pending/active/suspended |
| primary_domain | citext      |                               | Company email domain     |
| billing_email  | citext      |                               | Billing contact          |
| support_plan   | text        |                               | Tier/plan                |
| settings       | jsonb       | NOT NULL, default '{}'        | Branding + settings      |
| created_at     | timestamptz | NOT NULL, default now()       | Creation timestamp       |
| updated_at     | timestamptz | NOT NULL, default now()       | Last update timestamp    |

### memberships

| Column             | Type                       | Constraints                      | Description                   |
| ------------------ | -------------------------- | -------------------------------- | ----------------------------- |
| id                 | uuid                       | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id    | uuid                       | FK → organizations(id), NOT NULL | Tenant scoping                |
| user_id            | uuid                       | FK → auth.users(id), NOT NULL    | Member user                   |
| role_id            | uuid                       | FK → roles(id), NOT NULL         | Role key (admin, client_user) |
| status             | membership_status          | NOT NULL, default 'pending'      | pending/approved/suspended    |
| approved_at        | timestamptz                |                                  | Approval timestamp            |
| is_billing_contact | boolean                    | NOT NULL, default false          | Billing contact flag          |
| created_at         | timestamptz                | NOT NULL, default now()          | Creation timestamp            |
| unique constraint  | (organization_id, user_id) |                                  | One membership per org/user   |

### roles

Seeded system roles: `super_admin`, `admin`, `client_admin`, `technician`, `client_user`. Permissions are assigned via `role_permissions` (role_id → permission_id) and can be overridden per user via `user_permission_overrides`.

### profiles

| Column                  | Type    | Constraints             | Description                |
| ----------------------- | ------- | ----------------------- | -------------------------- |
| id                      | uuid    | PK → auth.users(id)     | One profile per auth user  |
| full_name               | text    |                         | Display name               |
| email                   | citext  |                         | Contact email              |
| phone                   | text    |                         | Contact phone              |
| title                   | text    |                         | Job title                  |
| is_super_admin          | boolean | NOT NULL, default false | Platform-wide flag         |
| default_organization_id | uuid    | FK → organizations(id)  | Default tenant for session |

### tickets

| Column          | Type            | Constraints                      | Description        |
| --------------- | --------------- | -------------------------------- | ------------------ |
| id              | uuid            | PK, default gen_random_uuid()    | Unique identifier  |
| organization_id | uuid            | FK → organizations(id), NOT NULL | Tenant scoping     |
| created_by      | uuid            | FK → auth.users(id), NOT NULL    | Reporter           |
| assigned_to     | uuid            | FK → auth.users(id)              | Assignee           |
| title           | text            | NOT NULL                         | Ticket title       |
| status          | ticket_status   | NOT NULL, default 'new'          | Lifecycle status   |
| priority        | ticket_priority | NOT NULL, default 'normal'       | Priority           |
| source          | text            | NOT NULL, default 'portal'       | portal/email/phone |
| created_at      | timestamptz     | NOT NULL, default now()          | Creation timestamp |

### projects

| Column           | Type           | Constraints                      | Description        |
| ---------------- | -------------- | -------------------------------- | ------------------ |
| id               | uuid           | PK, default gen_random_uuid()    | Unique identifier  |
| organization_id  | uuid           | FK → organizations(id), NOT NULL | Tenant scoping     |
| name             | text           | NOT NULL                         | Project name       |
| status           | project_status | NOT NULL, default 'planned'      | Lifecycle status   |
| start_date       | date           |                                  | Start date         |
| due_date         | date           |                                  | Due date           |
| progress_percent | int            | NOT NULL, default 0              | Completion percent |

### documents

| Column          | Type                | Constraints                      | Description           |
| --------------- | ------------------- | -------------------------------- | --------------------- |
| id              | uuid                | PK, default gen_random_uuid()    | Unique identifier     |
| organization_id | uuid                | FK → organizations(id), NOT NULL | Tenant scoping        |
| name            | text                | NOT NULL                         | File name             |
| storage_bucket  | text                | NOT NULL                         | Supabase bucket       |
| storage_path    | text                | NOT NULL                         | Object path           |
| mime_type       | text                |                                  | File type             |
| current_version | int                 | NOT NULL, default 1              | Latest version number |
| visibility      | document_visibility | NOT NULL, default 'org'          | org/internal/private  |

### approval_requests

| Column           | Type        | Constraints                      | Description               |
| ---------------- | ----------- | -------------------------------- | ------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier         |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping            |
| request_type     | text        | NOT NULL                         | e.g. proposal_approval    |
| request_subject  | text        | NOT NULL                         | Subject line              |
| request_metadata | jsonb       | NOT NULL, default '{}'           | Type-specific payload     |
| source_module    | text        |                                  | Originating module        |
| status           | text        | NOT NULL, default 'pending'      | pending/approved/rejected |
| requested_by     | uuid        | FK → auth.users(id)              | Requester                 |
| approved_by      | uuid        | FK → auth.users(id)              | Approver                  |
| due_at           | timestamptz |                                  | SLA deadline              |

### audit_logs

All mutations across every module append to `audit_logs` with `organization_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, and optional `metadata`. Readable only by admin/super_admin roles.

## Workflows

### Tenant Scoping (requireOrgAccess)

1. API middleware `requireOrgAccess` resolves the active organization from the `X-Active-Org` header / `mct_active_org` cookie, validated against approved memberships.
2. Platform admins (super_admin/admin role in any approved membership) bypass the injected-default org filter (`orgAccessPlatformAdmin`).
3. Every entity router (`tickets`, `documents`, `projects`, `assets`, `approvals`, and all ~44 module routers) applies the resolved organization filter to all queries.

### Permission Resolution

1. `GET /api/v1/me/permissions` computes the union of `role_permissions` across all approved memberships.
2. Per-org `user_permission_overrides` apply: `is_allowed=true` adds, `is_allowed=false` removes.
3. Super admins short-circuit to the full permission set.
4. Web guards (`lib/permissions.ts`, `usePermissions()`, `<HasPermission>`, `RouteGuard`) enforce the same keys client/server-side.

### Ticket Support Flow

1. Client creates ticket via `/portal/support` (POST `/api/v1/tickets`).
2. Optional sync to JSM via webhook; comments tracked on `ticket_comments`.
3. Status/priority updates are audited; notifications generated for assignee/reporter.

## AI Review Rules

- AI may draft knowledge-base articles, onboarding plans, and proposal content; all outputs stored in `ai_draft_outputs` with status `draft`.
- Human review required before promoting to `approved_content`; `prompt_key`/`prompt_version` recorded for traceability.

## Troubleshooting

| Issue                             | Resolution                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------- |
| 401 on valid session              | Verify `mct_session` cookie present; middleware JWT `exp` check may have expired |
| 403 on a known org                | Verify approved membership exists; check `memberships.status = 'approved'`       |
| Data visible across orgs          | Confirm `requireOrgAccess` applied to router; check RLS policies                 |
| Redirect loop /login ↔ /dashboard | Middleware JWT decode fails → session invalid; re-login                          |
| List returns empty for valid org  | Confirm `X-Active-Org` header matches an approved membership org                 |
| `VERSION_CONFLICT` on PATCH       | Optimistic locking: refresh entity and retry (documents/projects/orgs/assets)    |

## Release Checklist

- [ ] Bootstrap migration `5302026_*` applied (organizations, profiles, memberships, roles, permissions, tickets, projects, documents, audit_logs)
- [ ] Shared module tables `5302058_shared_module_tables.sql` applied (approval_requests, ai_draft_outputs, module_comments, module_timeline_events)
- [ ] Permission catalog migration `5302118_permission_matrix_full_catalog.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts` (tickets, documents, projects, approvals, assets, organizations, memberships, me, notifications, audit)
- [ ] SDK modules exported from `packages/sdk/src/index.ts`
- [ ] Portal pages in `apps/web/app/(portal)/portal/` render for approved members
- [ ] E2E specs pass: `pnpm e2e --project=chromium apps/web/e2e/portal/dashboard.spec.ts apps/web/e2e/portal/assets.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/multi-tenant-msp-client-portal.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
