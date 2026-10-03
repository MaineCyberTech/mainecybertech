# Patch Compliance Dashboard

## Purpose

Track patch compliance across device groups. Each row represents a device group with total/patched device counts, pending and critical patches, last patch date, maintenance windows, exceptions, and a compliance percentage so MSPs can measure patching effectiveness.

Primary users: security operations engineer, client admin, technician

Business impact: High

Category: security-ops

## Permissions

| Action                 | Roles                          |
| ---------------------- | ------------------------------ |
| List compliance rows   | All authenticated org members  |
| View compliance detail | All authenticated org members  |
| Create compliance row  | admin, super_admin, technician |
| Update compliance row  | admin, super_admin, technician |
| Delete compliance row  | admin, super_admin             |
| View compliance stats  | All authenticated org members  |

## Routes

### Portal Routes

| Route                          | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `GET /portal/patch-compliance` | List patch compliance device groups for the org |

### API Routes

| Method | Endpoint                                      | Description                      |
| ------ | --------------------------------------------- | -------------------------------- |
| GET    | `/api/v1/security-ops/patch-compliance`       | List compliance rows (paginated) |
| GET    | `/api/v1/security-ops/patch-compliance/:id`   | Get single compliance row        |
| POST   | `/api/v1/security-ops/patch-compliance`       | Create compliance row            |
| PATCH  | `/api/v1/security-ops/patch-compliance/:id`   | Update compliance row            |
| DELETE | `/api/v1/security-ops/patch-compliance/:id`   | Delete compliance row            |
| GET    | `/api/v1/security-ops/patch-compliance/stats` | Aggregate compliance statistics  |

## Data Model

### patch_compliance

| Column                  | Type         | Constraints                      | Description              |
| ----------------------- | ------------ | -------------------------------- | ------------------------ |
| id                      | uuid         | PK, default gen_random_uuid()    | Unique identifier        |
| organization_id         | uuid         | FK → organizations(id), NOT NULL | Tenant scoping           |
| device_group            | text         | NOT NULL                         | Device group name        |
| total_devices           | integer      | NOT NULL, default 0              | Devices in group         |
| patched_devices         | integer      | NOT NULL, default 0              | Devices patched          |
| pending_patches         | integer      | NOT NULL, default 0              | Pending patches          |
| critical_patches        | integer      | NOT NULL, default 0              | Critical patches pending |
| last_patch_date         | date         |                                  | Last patching date       |
| next_maintenance_window | timestamptz  |                                  | Next patching window     |
| exception_count         | integer      | NOT NULL, default 0              | Exceptions granted       |
| compliance_pct          | numeric(5,2) |                                  | Compliance percentage    |
| status                  | text         | NOT NULL, default 'active'       | active/on_hold           |
| notes                   | text         |                                  | Notes                    |
| created_by              | uuid         | FK → auth.users(id)              | Record author            |
| created_at              | timestamptz  | NOT NULL, default now()          | Creation timestamp       |
| updated_at              | timestamptz  | NOT NULL, default now()          | Last update timestamp    |

## Workflows

### Record Compliance

1. Security ops records a device group with device counts and patch totals
2. `POST /api/v1/security-ops/patch-compliance` saves the row
3. Row appears in the portal patch compliance list with status pill

### Track Statistics

- `GET /api/v1/security-ops/patch-compliance/stats` aggregates total devices, patched devices, critical patches, group count, and an overall compliance rate

## AI Review Rules

- AI may draft remediation plans and exception justifications
- All AI outputs are stored for human review
- Patch decisions remain a manual security operation

## Troubleshooting

| Issue                    | Resolution                                                 |
| ------------------------ | ---------------------------------------------------------- |
| Compliance list empty    | No compliance rows recorded for the org                    |
| Compliance % missing     | `compliance_pct` not populated; compute from device counts |
| Stats show zero          | No rows exist; verify data was inserted                    |
| Delete denied            | Only admin/super_admin can delete compliance rows          |
| RLS policy denies access | Confirm user has membership in the organization            |

## Release Checklist

- [ ] Migration `5302069_security_ops.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/security-ops.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/patch-compliance/`
- [ ] Unit tests pass: `pnpm --filter=api test security-ops`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/patch-compliance.spec.ts`
- [ ] Feature doc added to `docs/features/patch-compliance-dashboard.md`
- [ ] Runbook added to `docs/runbooks/patch-compliance-dashboard.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
