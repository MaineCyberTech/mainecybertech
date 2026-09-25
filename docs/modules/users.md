# Users

**Category:** Administration
**API Routes:** `apps/api/src/routes/users.ts`
**SDK:** `packages/sdk/src/users.ts`

## Overview

User administration system with multi-org role management, permission matrix overrides, and compound queries. Provides both list and detailed views with membership grouping for multi-org users.

## Key Features

- Paginated user list with org membership grouping
- Compound endpoint returning users with role/permission counts
- Org-scoped role assignment (prevents corrupting other org memberships)
- Per-user permission overrides (toggles on top of role defaults)
- Permission matrix view (role + user overrides combined)
- Multi-org user display with "N more orgs" badge

## Endpoints

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | /api/v1/users                 | List users (paginated, grouped by user)  |
| GET    | /api/v1/users/compound        | List users with role + permission counts |
| GET    | /api/v1/users/:id             | Get user by ID                           |
| GET    | /api/v1/users/:id/detail      | Get user with full membership detail     |
| PATCH  | /api/v1/users/:id/role        | Update user role (org-scoped)            |
| GET    | /api/v1/users/:id/permissions | Get user permission overrides            |
| PUT    | /api/v1/users/:id/permissions | Set user permission overrides            |

## Data Model

Key tables: `profiles`, `memberships`, `organizations`, `roles`, `permissions`, `role_permissions`, `user_permission_overrides`

## Access Control

- Admin: full access to all user management operations
- Client: no access
