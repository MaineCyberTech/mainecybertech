# Hardware Staging Checklist

## Purpose

Track hardware staging workflows before deployment to client sites. Devices are recorded with type, name, serial/asset identifiers, and staged through configuration, imaging, testing, labeling, and QA verification steps with a dynamic checklist.

Primary users: field technician, hardware staging engineer, client admin

Business impact: Medium

Category: field-services

## Permissions

| Action                   | Roles                          |
| ------------------------ | ------------------------------ |
| List staging items       | All authenticated org members  |
| View staging detail      | All authenticated org members  |
| Create staging item      | admin, super_admin, technician |
| Update staging item      | admin, super_admin, technician |
| Delete staging item      | admin, super_admin             |
| Update staging checklist | admin, super_admin, technician |

## Routes

### Portal Routes

| Route                          | Description                             |
| ------------------------------ | --------------------------------------- |
| `GET /portal/hardware-staging` | List hardware staging items for the org |

### API Routes

| Method | Endpoint                                       | Description                    |
| ------ | ---------------------------------------------- | ------------------------------ |
| GET    | `/api/v1/field-services/staging`               | List staging items (paginated) |
| GET    | `/api/v1/field-services/staging/:id`           | Get single staging item        |
| POST   | `/api/v1/field-services/staging`               | Create staging item            |
| PATCH  | `/api/v1/field-services/staging/:id`           | Update staging item            |
| DELETE | `/api/v1/field-services/staging/:id`           | Delete staging item            |
| POST   | `/api/v1/field-services/staging/:id/checklist` | Toggle a checklist item        |

## Data Model

### hardware_staging

| Column          | Type        | Constraints                      | Description                        |
| --------------- | ----------- | -------------------------------- | ---------------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier                  |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                     |
| device_type     | text        | NOT NULL                         | Device type                        |
| device_name     | text        | NOT NULL                         | Device display name                |
| serial_number   | text        |                                  | Serial number                      |
| asset_tag       | text        |                                  | Asset tag                          |
| configured      | boolean     | NOT NULL, default false          | Configured flag                    |
| tested          | boolean     | NOT NULL, default false          | Tested flag                        |
| labeled         | boolean     | NOT NULL, default false          | Labeled flag                       |
| imaged          | boolean     | NOT NULL, default false          | Imaged flag                        |
| qa_verified     | boolean     | NOT NULL, default false          | QA verified flag                   |
| staged_by       | uuid        | FK → auth.users(id)              | User who staged the device         |
| staged_at       | timestamptz |                                  | Staging timestamp                  |
| notes           | text        |                                  | Staging notes                      |
| status          | text        | NOT NULL, default 'pending'      | pending/in_progress/ready/deployed |
| created_by      | uuid        | FK → auth.users(id)              | Record author                      |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp                 |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp              |

## Workflows

### Record Hardware

1. Technician records the device with type, name, serial, and asset tag
2. `POST /api/v1/field-services/staging` saves the item with status `pending`
3. Item appears in the portal hardware staging list

### Staging Steps

- Devices progress through configured, imaged, tested, labeled, and QA-verified states
- `POST /api/v1/field-services/staging/:id/checklist` toggles checklist items via the stored `checklist_items` / `completed_items` arrays
- Once staged, the item is marked ready for deployment

## AI Review Rules

- AI may draft staging checklists and imaging runbooks
- All AI outputs are stored for human review
- Physical staging verification remains a manual step

## Troubleshooting

| Issue                    | Resolution                                      |
| ------------------------ | ----------------------------------------------- |
| Staging list empty       | No staging items recorded for the org           |
| Checklist toggle 404     | Staging item not found in the organization      |
| Device shows no type     | `device_type` is null; update the record        |
| Delete denied            | Only admin/super_admin can delete staging items |
| RLS policy denies access | Confirm user has membership in the organization |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/field-services.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/hardware-staging/`
- [ ] Unit tests pass: `pnpm --filter=api test field-services`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/hardware-staging.spec.ts`
- [ ] Feature doc added to `docs/features/hardware-staging-checklist.md`
- [ ] Runbook added to `docs/runbooks/hardware-staging-checklist.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
