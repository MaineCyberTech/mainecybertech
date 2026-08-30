# Roles

**Category:** Core
**API Routes:** `apps/api/src/routes/roles.ts`
**SDK:** `packages/sdk/src/roles.ts`

## Overview

Role and permission management. Provides a compound endpoint that returns all roles with permission counts in 2 queries (eliminates N+1), a permission matrix endpoint for a specific role, and a toggle endpoint to grant/revoke individual permissions. Super Admin role permissions are immutable.

## Key Features

- List all roles (cached 120s, filterable by IDs)
- Compound endpoint with permission counts (`/with-permissions`)
- Get full permission matrix for a role (all permissions + which are granted)
- Toggle individual permissions on a role (admin only)
- Super Admin role permissions cannot be modified
- Cache invalidation on permission changes

## Endpoints

| Method | Path                           | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| GET    | /api/v1/roles                  | List roles (cached, filterable by IDs)   |
| GET    | /api/v1/roles/:id              | Get role by ID                           |
| GET    | /api/v1/roles/with-permissions | All roles with permission counts (admin) |
| GET    | /api/v1/roles/:id/permissions  | Permission matrix for a role             |
| PUT    | /api/v1/roles/:id/permissions  | Toggle a permission on/off (admin)       |

## Data Model

Key tables: `roles` (key, name, description, is_system), `permissions` (module_key, action_key, description), `role_permissions` (role_id, permission_id)

## Access Control

- All authenticated users: list roles, get role by ID, view permission matrix
- Admin: get roles with permission counts, toggle permissions on roles
