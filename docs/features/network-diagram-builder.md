# Network Diagram Builder

## Purpose

Build and manage network diagrams per site. Each diagram stores site metadata, a JSONB diagram payload, and summary counts (devices, VLANs, WAN links, wireless zones, camera zones) so clients and technicians can visualize and document network topology.

Primary users: network engineer, technician, client admin

Business impact: High

Category: field-services

## Permissions

| Action              | Roles                          |
| ------------------- | ------------------------------ |
| List diagrams       | All authenticated org members  |
| View diagram detail | All authenticated org members  |
| Create diagram      | admin, super_admin, technician |
| Update diagram      | admin, super_admin, technician |
| Delete diagram      | admin, super_admin             |
| Export diagram JSON | All authenticated org members  |

## Routes

### Portal Routes

| Route                           | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `GET /portal/network-diagrams`  | List network diagrams for current organization |
| `GET /portal/network-port-maps` | Related port maps view for the organization    |

### API Routes

| Method | Endpoint                                             | Description                     |
| ------ | ---------------------------------------------------- | ------------------------------- |
| GET    | `/api/v1/field-services/network-diagrams`            | List diagrams (paginated)       |
| GET    | `/api/v1/field-services/network-diagrams/:id`        | Get single diagram              |
| POST   | `/api/v1/field-services/network-diagrams`            | Create diagram                  |
| PATCH  | `/api/v1/field-services/network-diagrams/:id`        | Update diagram                  |
| DELETE | `/api/v1/field-services/network-diagrams/:id`        | Delete diagram                  |
| GET    | `/api/v1/field-services/network-diagrams/:id/export` | Export diagram as JSON download |

## Data Model

### network_diagrams

| Column          | Type        | Constraints                      | Description              |
| --------------- | ----------- | -------------------------------- | ------------------------ |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier        |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping           |
| site_name       | text        | NOT NULL                         | Site display name        |
| diagram_data    | jsonb       | NOT NULL, default '{}'           | Diagram payload          |
| device_count    | integer     | NOT NULL, default 0              | Number of devices        |
| vlan_count      | integer     | NOT NULL, default 0              | Number of VLANs          |
| wan_count       | integer     | NOT NULL, default 0              | Number of WAN links      |
| wireless_zones  | integer     | NOT NULL, default 0              | Wireless zones           |
| camera_zones    | integer     | NOT NULL, default 0              | Camera zones             |
| notes           | text        |                                  | Diagram notes            |
| status          | text        | NOT NULL, default 'draft'        | draft/published/archived |
| created_by      | uuid        | FK → auth.users(id)              | Diagram author           |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp       |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp    |

## Workflows

### Create a Diagram

1. Engineer creates a diagram for a site with site name and diagram payload
2. `POST /api/v1/field-services/network-diagrams` saves the diagram as `draft`
3. Diagram appears in the portal network diagrams list with device/VLAN/WAN counts

### Export

- `GET /api/v1/field-services/network-diagrams/:id/export` downloads the full diagram JSON for offline use or migration

## AI Review Rules

- AI may draft diagram layouts and inventory summaries
- All AI outputs are stored for human review
- Diagram publishing remains a manual step

## Troubleshooting

| Issue                    | Resolution                                                   |
| ------------------------ | ------------------------------------------------------------ |
| Diagram list empty       | No diagrams created for the org                              |
| Export returns 404       | Diagram id not found in the organization                     |
| Counts all zero          | `device_count`/`vlan_count` not populated; update the record |
| Delete denied            | Only admin/super_admin can delete diagrams                   |
| RLS policy denies access | Confirm user has membership in the organization              |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/field-services.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/network-diagrams/`
- [ ] Unit tests pass: `pnpm --filter=api test field-services`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/network-diagrams.spec.ts`
- [ ] Feature doc added to `docs/features/network-diagram-builder.md`
- [ ] Runbook added to `docs/runbooks/network-diagram-builder.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
