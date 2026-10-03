# M365 Offboarding Checklist

## Purpose

Structured employee offboarding workflow for M365 tenants. Each checklist tracks the six core exit tasks — account disabled, mailbox converted, OneDrive transferred, license reclaimed, access reviewed, evidence collected — with per-step completion tracking and a full lifecycle from in-progress to completed.

Primary users: MSP engineer, HR/IT coordinator, admin

Business impact: Very High

Category: security-ops

## Permissions

| Action                    | Roles                         |
| ------------------------- | ----------------------------- |
| List offboarding records  | All authenticated org members |
| View offboarding record   | All authenticated org members |
| Create offboarding record | admin, super_admin            |
| Update offboarding record | admin, super_admin            |
| Delete offboarding record | admin, super_admin            |
| Complete offboarding step | admin, super_admin            |

## Routes

### Portal Routes

| Route                     | Description                              |
| ------------------------- | ---------------------------------------- |
| `GET /portal/offboarding` | List offboarding records for current org |

### API Routes

| Method | Endpoint                                             | Description                              |
| ------ | ---------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/security-ops/offboarding`                   | List offboarding checklists (paginated)  |
| GET    | `/api/v1/security-ops/offboarding/:id`               | Get a single checklist                   |
| POST   | `/api/v1/security-ops/offboarding`                   | Create a checklist                       |
| PATCH  | `/api/v1/security-ops/offboarding/:id`               | Update a checklist                       |
| DELETE | `/api/v1/security-ops/offboarding/:id`               | Delete a checklist                       |
| POST   | `/api/v1/security-ops/offboarding/:id/complete-step` | Toggle a named step in `completed_steps` |

## Data Model

### offboarding_checklists

| Column               | Type        | Constraints                      | Description                                |
| -------------------- | ----------- | -------------------------------- | ------------------------------------------ |
| id                   | uuid        | PK, default gen_random_uuid()    | Unique identifier                          |
| organization_id      | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                             |
| employee_name        | text        | NOT NULL                         | Departing employee name                    |
| employee_email       | text        |                                  | Employee mailbox / alias                   |
| department           | text        |                                  | Department                                 |
| offboarding_date     | date        |                                  | Scheduled offboarding date                 |
| account_disabled     | boolean     | default false                    | Step: account disabled                     |
| mailbox_converted    | boolean     | default false                    | Step: mailbox converted                    |
| onedrive_transferred | boolean     | default false                    | Step: OneDrive transferred                 |
| license_reclaimed    | boolean     | default false                    | Step: M365 license reclaimed               |
| access_reviewed      | boolean     | default false                    | Step: access reviewed                      |
| evidence_collected   | boolean     | default false                    | Step: evidence collected                   |
| completed_steps      | text[]      | default '{}'                     | Named steps completed (from step endpoint) |
| submitted_at         | timestamptz |                                  | When offboarding was submitted             |
| completed_at         | timestamptz |                                  | When offboarding completed                 |
| status               | text        | NOT NULL, default 'in_progress'  | in_progress / submitted / completed        |
| notes                | text        |                                  | Free-form notes                            |
| created_by           | uuid        | FK → auth.users(id)              | Author                                     |
| created_at           | timestamptz | NOT NULL, default now()          | Creation timestamp                         |
| updated_at           | timestamptz | NOT NULL, default now()          | Last update timestamp                      |

## Workflows

### Standard Offboarding Flow

1. Create the checklist with employee name, email, department, and target offboarding date
2. Execute the six core steps in order (disable account → convert mailbox → transfer OneDrive → reclaim license → review access → collect evidence)
3. Toggle steps via `POST /:id/complete-step` with `{ stepName, completed }`; the API maintains the `completed_steps` array
4. When all steps are done, mark status `submitted` then `completed` with `completed_at`

### Portal Display

- Lists offboarding records scoped to the approved membership org with `StatusPill`, department, and offboard date
- Shows `completed_at` when a record is complete
- Empty state renders "No offboarding records yet."

## Troubleshooting

| Issue                    | Resolution                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| Step toggle fails        | `stepName` must be a non-empty string; `completed` must be boolean |
| Step list not persisting | Confirm `completed_steps` is updated via the step endpoint         |
| Record not complete      | `completed_at` only set through status update after steps done     |
| List empty               | Verify org has offboarding records and `organization_id` is passed |
| RLS policy denies access | Confirm user has an approved membership in the organization        |

## Release Checklist

- [ ] Migrations `5302069_security_ops.sql` + `5302095_offboarding_checklist_fields.sql` applied
- [ ] API routes registered in `apps/api/src/routes/security-ops.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`securityOps.offboarding`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/offboarding/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/offboarding.spec.ts`
- [ ] Feature doc added to `docs/features/m365-offboarding-checklist.md`
- [ ] Runbook added to `docs/runbooks/m365-offboarding-checklist.md`
