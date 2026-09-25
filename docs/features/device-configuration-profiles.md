# Device Configuration Profiles

## Purpose

Standardize device configurations across an organization. Profiles capture a platform, OS, settings JSONB blob, and description so consistent configurations can be applied to fleet devices (endpoints, servers, network gear).

Primary users: technician, client admin, endpoint engineer

Business impact: Medium

Category: operations

## Permissions

| Action              | Roles                          |
| ------------------- | ------------------------------ |
| List profiles       | All authenticated org members  |
| View profile detail | All authenticated org members  |
| Create profile      | admin, super_admin, technician |
| Update profile      | admin, super_admin, technician |
| Delete profile      | admin, super_admin             |

## Routes

### Portal Routes

| Route                         | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `GET /portal/device-profiles` | List device configuration profiles for the org |

### API Routes

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/api/v1/final/device-profiles`     | List profiles (paginated) |
| GET    | `/api/v1/final/device-profiles/:id` | Get single profile        |
| POST   | `/api/v1/final/device-profiles`     | Create profile            |
| PATCH  | `/api/v1/final/device-profiles/:id` | Update profile            |
| DELETE | `/api/v1/final/device-profiles/:id` | Delete profile            |

## Data Model

### device_profiles

| Column          | Type        | Constraints                      | Description            |
| --------------- | ----------- | -------------------------------- | ---------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier      |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping         |
| profile_name    | text        | NOT NULL                         | Profile name           |
| device_type     | text        |                                  | Target device type     |
| os              | text        |                                  | Operating system       |
| settings        | jsonb       | NOT NULL, default '{}'           | Configuration settings |
| description     | text        |                                  | Profile description    |
| status          | text        | NOT NULL, default 'active'       | active/draft/archived  |
| created_by      | uuid        | FK → auth.users(id)              | Profile author         |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp     |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp  |

## Workflows

### Create a Profile

1. Engineer defines a profile with name, device type, OS, and settings
2. `POST /api/v1/final/device-profiles` saves the profile as `active` by default
3. Profile appears in the portal device profiles list with platform and status

### Maintain Profiles

- Update settings and metadata via `PATCH /api/v1/final/device-profiles/:id`
- Archive obsolete profiles by changing status
- Delete profiles only when no devices reference them

## AI Review Rules

- AI may draft recommended settings and configuration baselines
- All AI outputs are stored for human review
- Profile activation remains a manual decision

## Troubleshooting

| Issue                    | Resolution                                                  |
| ------------------------ | ----------------------------------------------------------- |
| Profile list empty       | No profiles created for the org                             |
| Platform missing         | `platform` is null; update the record with a platform value |
| Update denied            | Only admin/super_admin/technician roles can update profiles |
| Delete denied            | Only admin/super_admin can delete profiles                  |
| RLS policy denies access | Confirm user has membership in the organization             |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/final.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/device-profiles/`
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/device-profiles.spec.ts`
- [ ] Feature doc added to `docs/features/device-configuration-profiles.md`
- [ ] Runbook added to `docs/runbooks/device-configuration-profiles.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
