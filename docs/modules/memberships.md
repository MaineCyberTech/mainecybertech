# Memberships

**Category:** Core
**API Routes:** `apps/api/src/routes/memberships.ts`
**SDK:** `packages/sdk/src/memberships.ts`

## Overview

Manages user-to-organization membership assignments with role bindings, status tracking, and billing/security contact flags. Supports inviting users by email, updating roles and status, and removing members from an organization.

## Key Features

- List memberships filtered by organization, user, or status
- Get current user's own memberships (`/mine`)
- Invite users to an organization by email (admin only)
- Update membership role, status, and contact flags (admin only)
- Remove members from an organization (admin only)
- Duplicate membership detection on invite
- Audit logging on all mutations

## Endpoints

| Method | Path                       | Description                                       |
| ------ | -------------------------- | ------------------------------------------------- |
| GET    | /api/v1/memberships        | List memberships (filter by org, user, or status) |
| GET    | /api/v1/memberships/mine   | Get current user's memberships                    |
| POST   | /api/v1/memberships/invite | Invite a user to an organization (admin)          |
| PATCH  | /api/v1/memberships/:id    | Update a membership (admin)                       |
| DELETE | /api/v1/memberships/:id    | Remove a membership (admin)                       |

## Data Model

Key table: `memberships` (user_id, organization_id, role_id, status, is_billing_contact, is_security_contact). Joined with `organizations` and `roles` on read.

## Access Control

- All authenticated users: list memberships (scoped by `requireOrgAccess`), view own memberships
- Admin: invite, update, and delete memberships within their organization
