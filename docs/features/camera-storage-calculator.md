# Camera Storage Calculator

## Purpose

Estimate video surveillance storage requirements before deployment. The calculator takes camera count, bitrate, resolution, retention days, and FPS to produce daily storage (GB), total storage (TB), and an NVR tier recommendation so clients buy the right recorder the first time.

Primary users: field technician, sales engineer, client

Business impact: Medium

Category: field-services

## Permissions

| Action             | Roles                         |
| ------------------ | ----------------------------- |
| List calculations  | All authenticated org members |
| View calculation   | All authenticated org members |
| Create calculation | All authenticated org members |
| Run calculator     | All authenticated org members |
| Update calculation | All authenticated org members |
| Delete calculation | admin, super_admin            |

## Routes

### Portal Routes

| Route                           | Description                                |
| ------------------------------- | ------------------------------------------ |
| `GET /portal/camera-calculator` | Camera storage calculator for organization |

### Admin Routes

| Route                                   | Description                                        |
| --------------------------------------- | -------------------------------------------------- |
| `GET /admin/field-services/camera-calc` | Camera calculation management under Field Services |

### API Routes

| Method | Endpoint                                       | Description                       |
| ------ | ---------------------------------------------- | --------------------------------- |
| GET    | `/api/v1/field-services/camera-calc`           | List calculations (paginated)     |
| GET    | `/api/v1/field-services/camera-calc/:id`       | Get a single calculation          |
| POST   | `/api/v1/field-services/camera-calc`           | Create calculation                |
| PATCH  | `/api/v1/field-services/camera-calc/:id`       | Update calculation                |
| DELETE | `/api/v1/field-services/camera-calc/:id`       | Delete calculation                |
| POST   | `/api/v1/field-services/camera-calc/calculate` | Run storage estimate (no persist) |

## Data Model

### camera_calculations

| Column               | Type         | Constraints                      | Description                      |
| -------------------- | ------------ | -------------------------------- | -------------------------------- |
| id                   | uuid         | PK, default gen_random_uuid()    | Unique identifier                |
| organization_id      | uuid         | FK → organizations(id), NOT NULL | Tenant scoping                   |
| site_name            | text         | NOT NULL                         | Site/location name               |
| camera_count         | integer      | default 1                        | Number of cameras                |
| avg_bitrate_mbps     | numeric(6,2) | default 4                        | Average stream bitrate           |
| resolution           | text         | default '4MP'                    | Camera resolution                |
| retention_days       | integer      | default 30                       | Days of retention                |
| estimated_storage_tb | numeric(8,2) |                                  | Computed storage estimate        |
| recommended_nvr      | text         |                                  | Standard / Business / Enterprise |
| notes                | text         |                                  | Free-form notes                  |
| status               | text         | NOT NULL, default 'draft'        | draft / completed                |
| created_by           | uuid         | FK → auth.users(id)              | Who ran the calculation          |
| created_at           | timestamptz  | NOT NULL, default now()          | Creation timestamp               |
| updated_at           | timestamptz  | NOT NULL, default now()          | Last update timestamp            |

## Workflows

### Run the Calculator

1. User enters camera count, bitrate (default 4 Mbps), resolution, retention days, and FPS
2. `POST /calculate` computes daily storage in GB and total storage in TB
3. NVR tier is recommended: Standard (≤ 2 TB), Business (≤ 10 TB), Enterprise (> 10 TB)
4. Results can be saved as a `camera_calculations` row for the site quote

### Estimation Formula

- `dailyStorageGB = (cameras × bitrateMbps × retentionDays × 86400) / 8 / 1024`
- `totalStorageTB = dailyStorageGB / 1024`

## Troubleshooting

| Issue                       | Resolution                                                             |
| --------------------------- | ---------------------------------------------------------------------- |
| Estimate seems too high/low | Verify bitrate assumption matches the camera's resolution/FPS          |
| Calculation returns 0       | `cameraCount` must be ≥ 1 and `bitrateMbps` ≥ 0.1                      |
| NVR tier surprising         | Tier thresholds: Standard ≤ 2 TB, Business ≤ 10 TB, Enterprise > 10 TB |
| Delete denied (403)         | Membership role must be `admin` or `super_admin`                       |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` + `5302094_camera_calculation_fields.sql` applied
- [ ] API routes registered at `/api/v1/field-services` in `apps/api/src/app.ts`
- [ ] SDK module `fieldServices.camera` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/camera-calculator/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/camera-calculator.spec.ts`
- [ ] Feature doc added to `docs/features/camera-storage-calculator.md`
- [ ] Runbook added to `docs/runbooks/camera-storage-calculator.md`
