# Field Services

**Category:** Operations
**API Routes:** `apps/api/src/routes/field-services.ts`
**SDK:** `packages/sdk/src/field-services.ts`

## Overview
Field services module for managing ISP assessments, UniFi surveys, port maps, camera calculations, hardware staging, and network diagrams for client sites.

## Key Features
- ISP assessment tracking (provider, speed, contract status)
- UniFi wireless survey data and coverage mapping
- Switch port mapping and VLAN assignments
- IP camera calculations (storage, bandwidth, coverage)
- Hardware staging and deployment tracking
- Network diagram management (upload, versioning)

## Endpoints
### ISP
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/isp | List ISP assessments |
| POST | /api/v1/field-services/isp | Create ISP assessment |
| GET | /api/v1/field-services/isp/:id | Get by ID |
| PATCH | /api/v1/field-services/isp/:id | Update |
| DELETE | /api/v1/field-services/isp/:id | Delete |

### UniFi
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/unifi | List UniFi surveys |
| POST | /api/v1/field-services/unifi | Create survey |
| PATCH | /api/v1/field-services/unifi/:id | Update |
| DELETE | /api/v1/field-services/unifi/:id | Delete |

### Port Maps
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/port-maps | List port maps |
| POST | /api/v1/field-services/port-maps | Create port map |
| PATCH | /api/v1/field-services/port-maps/:id | Update |
| DELETE | /api/v1/field-services/port-maps/:id | Delete |

### Camera Calculations
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/camera-calc | List camera calculations |
| POST | /api/v1/field-services/camera-calc | Create calculation |
| PATCH | /api/v1/field-services/camera-calc/:id | Update |
| DELETE | /api/v1/field-services/camera-calc/:id | Delete |

### Staging
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/staging | List hardware staging records |
| POST | /api/v1/field-services/staging | Create staging record |
| PATCH | /api/v1/field-services/staging/:id | Update |
| DELETE | /api/v1/field-services/staging/:id | Delete |

### Network Diagrams
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/field-services/network-diagrams | List network diagrams |
| POST | /api/v1/field-services/network-diagrams | Upload diagram |
| PATCH | /api/v1/field-services/network-diagrams/:id | Update |
| DELETE | /api/v1/field-services/network-diagrams/:id | Delete |

## Data Model
Key fields (per table): `isp_assessments` (provider, speed_down, speed_up, contract_end), `unifi_surveys` (site, ap_count, coverage_score), `port_maps` (switch_name, port, vlan, device), `camera_calculations` (camera_count, storage_days, bandwidth_total), `hardware_staging` (device, config_status, ship_date), `network_diagrams` (title, file_url, version) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)
