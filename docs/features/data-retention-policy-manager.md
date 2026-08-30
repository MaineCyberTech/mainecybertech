# Data Retention Policy Manager

## Purpose

Manage data retention policies for the organization: per data category and system, define retention periods, disposal methods, regulated status with regulation references, and review cadence. Supports compliance with retention and disposal requirements.

Primary users: MSP governance lead, client compliance sponsor, technician

Business impact: High

Category: governance

## Permissions

| Action                      | Roles                         |
| --------------------------- | ----------------------------- |
| List retention policies     | All authenticated org members |
| View retention policy       | All authenticated org members |
| Create retention policy     | admin, super_admin            |
| Update retention policy     | admin, super_admin            |
| Delete retention policy     | admin, super_admin            |
| View regulated flag details | All authenticated org members |

## Routes

### Portal Routes

| Route                        | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `GET /portal/data-retention` | List retention policies with period + disposal |

### API Routes

| Method | Endpoint                           | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/api/v1/governance/retention`     | List retention policies (paginated) |
| GET    | `/api/v1/governance/retention/:id` | Get single retention policy         |
| POST   | `/api/v1/governance/retention`     | Create retention policy             |
| PATCH  | `/api/v1/governance/retention/:id` | Update retention policy             |
| DELETE | `/api/v1/governance/retention/:id` | Delete retention policy             |

## Data Model

### retention_policies

| Column                | Type        | Constraints                      | Description                           |
| --------------------- | ----------- | -------------------------------- | ------------------------------------- |
| id                    | uuid        | PK, default gen_random_uuid()    | Unique identifier                     |
| organization_id       | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                        |
| data_category         | text        | NOT NULL                         | Category of data (e.g. client_data)   |
| system_name           | text        | NOT NULL                         | System the data resides in            |
| retention_period_days | integer     | NOT NULL                         | Days to retain the data               |
| disposal_method       | text        |                                  | How data is disposed                  |
| is_regulated          | boolean     | default false                    | Whether data is subject to regulation |
| regulation_reference  | text        |                                  | Regulation / control reference        |
| last_reviewed_at      | timestamptz |                                  | Last policy review timestamp          |
| next_review_at        | timestamptz |                                  | Next scheduled review                 |
| status                | text        | NOT NULL, default 'active'       | Policy status                         |
| notes                 | text        |                                  | Analyst notes                         |
| created_by            | uuid        | FK → auth.users(id)              | Creator                               |
| created_at            | timestamptz | NOT NULL, default now()          | Creation timestamp                    |
| updated_at            | timestamptz | NOT NULL, default now()          | Last update timestamp                 |

## Workflows

### Policy Definition

1. Governance lead defines `data_category` and `system_name` for each data store
2. Sets `retention_period_days` based on business and regulatory requirements
3. Selects `disposal_method` (e.g. delete, shred, cryptoshred)
4. Marks `is_regulated` and records `regulation_reference` when applicable

### Review Cadence

- `next_review_at` drives the review schedule for each policy
- The portal surfaces the next review date on each policy card
- Overdue reviews (next_review_at in the past) are flagged for follow-up
- On review, update `last_reviewed_at` and set a new `next_review_at`

## AI Review Rules

- AI may draft disposal procedures, regulation mappings, and review summaries
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual retention policies
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                     | Resolution                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| Policy card not shown     | Verify org has rows in `retention_policies`; check RLS policies     |
| `retention_period_days` 0 | Validator requires a positive integer; re-check create payload      |
| Regulated flag missing    | Confirm `is_regulated` and `regulation_reference` set on the policy |
| RLS policy denies access  | Confirm user has an approved membership in the organization         |
| 404 on policy by id       | Confirm `organization_id` query param matches the policy's org      |

## Release Checklist

- [ ] Migration `5302071_governance.sql` applied
- [ ] API routes registered in `apps/api/src/routes/governance.ts`
- [ ] Validator `createRetentionSchema` in `apps/api/src/validators/governance.ts`
- [ ] SDK module `governance.retention` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/data-retention/`
- [ ] Unit tests pass: `pnpm --filter=api test governance`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/data-retention.spec.ts`
- [ ] Feature doc added to `docs/features/data-retention-policy-manager.md`
- [ ] Runbook added to `docs/runbooks/data-retention-policy-manager.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
