# Audit Logging

**Category:** Admin
**API Routes:** `apps/api/src/routes/audit.ts`
**SDK:** `packages/sdk/src/audit.ts`

## Overview

Paginated audit log viewer with multi-field filtering and CSV/JSON export. All mutation endpoints across the platform write to `audit_logs` via `logAuditEvent()`. Supports filtering by actor, organization, action, entity type, and entity ID.

## Key Features

- Paginated audit log listing (up to 100 per page)
- Filter by actor_user_id, organization_id, action, entity_type, entity_id
- CSV/JSON export with 10,000 row scrollback limit
- Export columns: id, action, entity_type, entity_id, organization_id, actor_user_id, actor_type, metadata, created_at
- All platform mutations logged automatically

## Endpoints

| Method | Path                 | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | /api/v1/audit        | List audit logs (paginated, filterable)       |
| GET    | /api/v1/audit/export | Export audit logs as CSV/JSON (10k row limit) |

## Data Model

Key table: `audit_logs` (action, entity_type, entity_id, organization_id, actor_user_id, actor_type, metadata, created_at)

## Access Control

- Admin only — all endpoints require `requireAuth` + `requireAdmin`
