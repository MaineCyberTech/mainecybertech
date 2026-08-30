# Public Status Page

## Purpose

Publish component health, active incidents, and scheduled maintenance for a client's services. Authenticated users manage components/incidents/maintenance; a public endpoint and a portal "Service Status" view surface the current operational state.

Primary users: MSP NOC, client admin, public consumers (via public API)

Business impact: Medium

Category: operations

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| View components          | All authenticated org members |
| Create/update components | All authenticated org members |
| Delete components        | admin, super_admin            |
| Manage incidents         | All authenticated org members |
| Manage maintenance       | All authenticated org members |
| View public status       | Anyone (unauth, by org id)    |

## Routes

### Portal Routes

| Route                      | Description                                   |
| -------------------------- | --------------------------------------------- |
| `GET /portal/status-pages` | Status components for current organization    |
| `GET /portal/status`       | Service Status feed (incidents + maintenance) |

### Admin Routes

| Route                     | Description                    |
| ------------------------- | ------------------------------ |
| `GET /admin/status-pages` | Status Pages page (Components) |

### API Routes

| Method | Endpoint                              | Description                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/v1/status-page/public/:orgId`   | Public status (components, active incidents, upcoming maintenance) |
| GET    | `/api/v1/status-page/components`      | List components (paginated)                                        |
| GET    | `/api/v1/status-page/components/:id`  | Get a component                                                    |
| POST   | `/api/v1/status-page/components`      | Create component                                                   |
| PATCH  | `/api/v1/status-page/components/:id`  | Update component status                                            |
| DELETE | `/api/v1/status-page/components/:id`  | Delete component                                                   |
| GET    | `/api/v1/status-page/incidents`       | List incidents                                                     |
| POST   | `/api/v1/status-page/incidents`       | Create incident                                                    |
| GET    | `/api/v1/status-page/incidents/:id`   | Get an incident                                                    |
| PATCH  | `/api/v1/status-page/incidents/:id`   | Update incident (resolve, etc.)                                    |
| DELETE | `/api/v1/status-page/incidents/:id`   | Delete incident                                                    |
| GET    | `/api/v1/status-page/maintenance`     | List maintenance notices                                           |
| POST   | `/api/v1/status-page/maintenance`     | Schedule maintenance                                               |
| GET    | `/api/v1/status-page/maintenance/:id` | Get a maintenance notice                                           |
| PATCH  | `/api/v1/status-page/maintenance/:id` | Update maintenance notice                                          |
| DELETE | `/api/v1/status-page/maintenance/:id` | Delete maintenance notice                                          |

## Data Model

### status_components

| Column          | Type        | Constraints                      | Description                                 |
| --------------- | ----------- | -------------------------------- | ------------------------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier                           |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                              |
| name            | text        | NOT NULL                         | Component name                              |
| description     | text        |                                  | Component description                       |
| component_type  | text        | default 'service'                | service / api / website / other             |
| status          | text        | default 'operational'            | operational / degraded / down / maintenance |
| display_order   | integer     | default 0                        | Sort order on the page                      |
| created_at      | timestamptz | default now()                    | Creation timestamp                          |
| updated_at      | timestamptz | default now()                    | Last update timestamp                       |

### status_incidents

| Column                 | Type        | Constraints                      | Description                                        |
| ---------------------- | ----------- | -------------------------------- | -------------------------------------------------- |
| id                     | uuid        | PK, default gen_random_uuid()    | Unique identifier                                  |
| organization_id        | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                     |
| title                  | text        | NOT NULL                         | Incident title                                     |
| description            | text        |                                  | Incident details                                   |
| severity               | text        | default 'minor'                  | minor / major / critical                           |
| status                 | text        | default 'investigating'          | investigating / identified / monitoring / resolved |
| affected_component_ids | uuid[]      | default '{}'                     | Affected components                                |
| started_at             | timestamptz | default now()                    | When it started                                    |
| resolved_at            | timestamptz |                                  | When resolved                                      |
| created_by             | uuid        | FK → auth.users(id)              | Who reported it                                    |
| created_at             | timestamptz | default now()                    | Creation timestamp                                 |
| updated_at             | timestamptz | default now()                    | Last update timestamp                              |

### maintenance_notices

| Column                 | Type        | Constraints                      | Description                         |
| ---------------------- | ----------- | -------------------------------- | ----------------------------------- |
| id                     | uuid        | PK, default gen_random_uuid()    | Unique identifier                   |
| organization_id        | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                      |
| title                  | text        | NOT NULL                         | Maintenance title                   |
| description            | text        |                                  | Maintenance details                 |
| scheduled_start        | timestamptz | NOT NULL                         | Start window                        |
| scheduled_end          | timestamptz | NOT NULL                         | End window                          |
| status                 | text        | default 'scheduled'              | scheduled / in_progress / completed |
| affected_component_ids | uuid[]      | default '{}'                     | Affected components                 |
| created_by             | uuid        | FK → auth.users(id)              | Who scheduled it                    |
| created_at             | timestamptz | default now()                    | Creation timestamp                  |
| updated_at             | timestamptz | default now()                    | Last update timestamp               |

## Workflows

### Component Management

1. Define components (services, APIs, websites) with status and display order
2. Update status as real-world health changes; the portal renders a color-coded badge per component (green operational, amber degraded, red down, blue maintenance)

### Incident Handling

1. Open an incident with severity and affected component IDs
2. Progress status investigating → identified → monitoring → resolved (`resolved_at` set on resolve)
3. The public endpoint only surfaces incidents with status != `resolved`

### Scheduled Maintenance

1. Schedule maintenance with start/end windows and affected components
2. Public endpoint returns only notices whose `scheduled_start` is still upcoming

## Troubleshooting

| Issue                           | Resolution                                                 |
| ------------------------------- | ---------------------------------------------------------- |
| Public endpoint returns empty   | Verify org id; check no active incidents/maintenance exist |
| Component status not updating   | Use PATCH with `status` and correct `organization_id`      |
| Resolved incident still visible | Public feed filters out `resolved` incidents               |
| Delete denied (403)             | Membership role must be `admin` or `super_admin`           |

## Release Checklist

- [ ] Migration `5302092_status_page.sql` applied
- [ ] API routes registered at `/api/v1/status-page` in `apps/api/src/app.ts`
- [ ] SDK module `statusPage` exported from `packages/sdk/src/index.ts`
- [ ] Portal pages at `apps/web/app/(portal)/portal/status-pages/` and `/portal/status/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/status-pages.spec.ts`
- [ ] Feature doc added to `docs/features/public-status-page.md`
- [ ] Runbook added to `docs/runbooks/public-status-page.md`
