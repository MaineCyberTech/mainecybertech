# Network Port Map / Patch Panel Tracker

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/port-maps.ts`
**SDK:** `packages/sdk/src/port-maps.ts`

## Overview

Physical and logical network port mapping tool for data center and IDF/MDF environments. Tracks patch panel-to-switch cabling, wall jack assignments, VLAN membership, and PoE status. Supports cable testing results, label generation, and audit trail for moves/adds/changes.

## Key Features

- Patch panel inventory — panel location, port count, port type (keystone/LC/ST), termination standard
- Switch port mapping — device, port number, VLAN, PoE status, speed/duplex, admin status
- Wall jack to patch panel cross-connect mapping with cable ID and length
- Cable test result logging (TDR, wiremap, length, NEXT, return loss)
- Label export — generate printable CSV labels per panel or per rack
- MAC address discovery feed — correlate switch port MACs with DHCP reservations

## Endpoints

| Method | Path                               | Description                                     |
| ------ | ---------------------------------- | ----------------------------------------------- |
| GET    | /api/v1/port-maps/panels           | List patch panels (filterable by location/type) |
| POST   | /api/v1/port-maps/panels           | Create patch panel record                       |
| PATCH  | /api/v1/port-maps/panels/:id       | Update panel                                    |
| DELETE | /api/v1/port-maps/panels/:id       | Soft-delete panel                               |
| GET    | /api/v1/port-maps/panels/:id/ports | List ports for panel with connection status     |
| PUT    | /api/v1/port-maps/ports/:id/map    | Map wall jack to panel port to switch port      |
| GET    | /api/v1/port-maps/cross-connects   | Full cross-connect topology view                |
| GET    | /api/v1/port-maps/export/labels    | Export label CSV per panel/rack                 |

## Data Model

`patch_panels` (organization_id, location, rack_unit, panel_label, port_count, connector_type, termination_standard, notes). `port_connections` (panel_id, port_number, wall_jack_id, cable_id, cable_length_ft, switch_device_id, switch_port, vlan_id, poe_enabled, admin_status, last_verified_at). `cable_tests` (connection_id, test_type (wiremap/tdr/next), result (pass/fail), measured_length_ft, tester_id, tested_at).

## Access Control

- Admin: full CRUD, cable test logging, label export
- Client: read-only topology view for their org
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on panel create/update/delete and connection mapping changes
