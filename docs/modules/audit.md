# Audit

**Category:** Administration
**API Routes:** `apps/api/src/routes/audit.ts`

## Overview

Audit logging system that records all mutation events across the platform for compliance, debugging, and activity tracking. Supports paginated querying, filtering by actor/org/action/entity, and CSV/JSON export up to 10,000 rows.

## Key Features

- Paginated list with filters by actor, organization, action, and entity
- Entity-level activity feeds (per-ticket, per-project, etc.)
- CSV/JSON export with scrollback limit of 10,000 rows
- Structured audit actions (auth.sign-in, profile.update, user.role.update, etc.)
- Action badges for UI display (create=green, update=amber, delete=red)

## Endpoints

| Method | Path                 | Description                                                                       |
| ------ | -------------------- | --------------------------------------------------------------------------------- |
| GET    | /api/v1/audit        | List audit logs (paginated, filterable by actor/org/action/entity_type/entity_id) |
| GET    | /api/v1/audit/export | Export audit logs as CSV/JSON (up to 10,000 rows)                                 |

## Data Model

Key fields: `id`, `action`, `entity_type`, `entity_id`, `actor_id`, `actor_email`, `organization_id`, `details`, `created_at`

## Access Control

- Admin: full read access to all audit logs across all organizations
- Client: no access
