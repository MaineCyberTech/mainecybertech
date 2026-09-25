# Status Page

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/status-page.ts`
**SDK:** `packages/sdk/src/status-page.ts`

## Overview

Public and private service status page system for MSP clients. Organizations manage service components, active incidents, and scheduled maintenance. A public-facing status endpoint is available without authentication, ideal for embedding on client websites or sharing externally.

## Key Features

- Component management with current status tracking
- Component statuses: operational, degraded_performance, partial_outage, major_outage, under_maintenance
- Component grouping by service category (e.g., Email, VPN, Cloud Apps, Network)
- Customizable display order for public status page layout
- Incident lifecycle tracking with severity levels (informational, minor, major, critical)
- Incident timeline updates with status changes and resolution tracking
- Root cause analysis and post-mortem notes on incident resolution
- Scheduled maintenance notices with start/end times and affected components
- Automatic status rollback when maintenance window ends
- Public endpoint (`GET /public/:orgId`) — no authentication required
- Admin CRUD endpoints behind authentication and org access controls
- Audit logging on all admin mutation endpoints
- RLS enforcement on components, incidents, and maintenance notices

## Endpoints

| Method | Path                                | Description                                                                               |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | /api/v1/status-page/components      | List status components for org (grouped, ordered)                                         |
| POST   | /api/v1/status-page/components      | Create a new service component                                                            |
| PATCH  | /api/v1/status-page/components/:id  | Update component status, name, group, or display order                                    |
| DELETE | /api/v1/status-page/components/:id  | Remove component                                                                          |
| GET    | /api/v1/status-page/incidents       | List incidents (paginated, filterable by status and severity)                             |
| POST   | /api/v1/status-page/incidents       | Create incident with affected component IDs                                               |
| PATCH  | /api/v1/status-page/incidents/:id   | Update incident status, add timeline entry                                                |
| DELETE | /api/v1/status-page/incidents/:id   | Remove incident record                                                                    |
| GET    | /api/v1/status-page/maintenance     | List scheduled maintenance windows                                                        |
| POST   | /api/v1/status-page/maintenance     | Schedule maintenance with affected component IDs                                          |
| PATCH  | /api/v1/status-page/maintenance/:id | Update maintenance details, time window, or status                                        |
| DELETE | /api/v1/status-page/maintenance/:id | Cancel scheduled maintenance                                                              |
| GET    | /api/v1/status-page/public/:orgId   | Public status page (no auth) — returns components, active incidents, upcoming maintenance |

## Data Model

Tables: `status_components` (organization_id, name, description, status, group_name, display_order), `status_incidents` (organization_id, title, severity, status, affected_components (jsonb), timeline (jsonb), resolution_notes, resolved_at), `maintenance_notices` (organization_id, title, description, scheduled_start, scheduled_end, affected_components (jsonb), status)

## Access Control

- Public endpoint: no auth on `GET /public/:orgId`
- Admin: full CRUD on components, incidents, maintenance (requireAuth + requireOrgAccess)
- Client: view status page via public endpoint; no portal write access
