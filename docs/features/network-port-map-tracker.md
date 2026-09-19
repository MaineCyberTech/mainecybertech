# Network Port Map Tracker

## Purpose

Maintain a structured inventory of network switch port mappings: switch, port number, VLAN, wall jack label, connected device, device type, uplink/PoE flags, and link speed. Used by field technicians during cabling, troubleshooting, and change management.

Primary users: field technician, network engineer

Business impact: Medium

Category: field-services

## Permissions

| Action          | Roles                         |
| --------------- | ----------------------------- |
| List port maps  | All authenticated org members |
| View port map   | All authenticated org members |
| Create port map | All authenticated org members |
| Update port map | All authenticated org members |
| Delete port map | admin, super_admin            |

## Routes

### Portal Routes

| Route                           | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `GET /portal/network-port-maps` | Switch port mapping inventory for organization |

### Admin Routes

| Route                                 | Description                              |
| ------------------------------------- | ---------------------------------------- |
| `GET /admin/field-services/port-maps` | Port map management under Field Services |

### API Routes

| Method | Endpoint                               | Description                |
| ------ | -------------------------------------- | -------------------------- |
| GET    | `/api/v1/field-services/port-maps`     | List port maps (paginated) |
| GET    | `/api/v1/field-services/port-maps/:id` | Get a single port map      |
| POST   | `/api/v1/field-services/port-maps`     | Create port map            |
| PATCH  | `/api/v1/field-services/port-maps/:id` | Update port map            |
| DELETE | `/api/v1/field-services/port-maps/:id` | Delete port map            |

## Data Model

### port_maps

| Column           | Type        | Constraints                      | Description                   |
| ---------------- | ----------- | -------------------------------- | ----------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                |
| switch_name      | text        | NOT NULL                         | Switch/device name            |
| port_number      | integer     | NOT NULL                         | Physical port number          |
| vlan_id          | integer     |                                  | VLAN identifier               |
| vlan_name        | text        |                                  | VLAN display name             |
| wall_jack_label  | text        |                                  | Jack/cable label              |
| connected_device | text        |                                  | Device plugged into port      |
| device_type      | text        |                                  | PC, printer, AP, camera, etc. |
| uplink           | boolean     | default false                    | Is this an uplink port        |
| poe_enabled      | boolean     | default false                    | PoE powered                   |
| speed            | text        | default '1G'                     | Link speed (100M/1G/10G)      |
| notes            | text        |                                  | Free-form notes               |
| created_by       | uuid        | FK → auth.users(id)              | Who recorded the mapping      |
| created_at       | timestamptz | default now()                    | Creation timestamp            |
| updated_at       | timestamptz | default now()                    | Last update timestamp         |

## Workflows

### Record a Mapping

1. Field technician notes switch, port number, VLAN, and connected device during a site visit
2. A `port_maps` row captures the mapping with optional jack label, PoE, uplink, and speed
3. Record updates as devices move or reconfigure

### Troubleshooting Use

- Cross-reference `wall_jack_label` with the connected device to locate a jack
- Query by `switch_name` and `port_number` to confirm what should be on a port before changes
- Uplink/PoE flags identify critical infrastructure ports

## Troubleshooting

| Issue                  | Resolution                                             |
| ---------------------- | ------------------------------------------------------ |
| List empty on portal   | No port mappings recorded for the org yet              |
| Duplicate port entries | Same switch_name + port_number recorded more than once |
| Device identity stale  | Update `connected_device` after changes                |
| Delete denied (403)    | Membership role must be `admin` or `super_admin`       |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` applied
- [ ] API routes registered at `/api/v1/field-services` in `apps/api/src/app.ts`
- [ ] SDK module `fieldServices.portMaps` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/network-port-maps/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/network-port-maps.spec.ts`
- [ ] Feature doc added to `docs/features/network-port-map-tracker.md`
- [ ] Runbook added to `docs/runbooks/network-port-map-tracker.md`
