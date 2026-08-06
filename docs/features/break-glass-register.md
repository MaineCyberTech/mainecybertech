# Break Glass Register

## Purpose

Track emergency (break glass) accounts across systems: account name, system, custodian, rotation schedule, last use, and access procedures. Ensures emergency credentials are documented, tested, and rotated on a defined cadence without storing actual passwords.

Primary users: MSP security analyst, client sponsor, technician

Business impact: Critical

Category: security_ops

## Permissions

| Action                     | Roles                         |
| -------------------------- | ----------------------------- |
| List break glass accounts  | All authenticated org members |
| View break glass account   | All authenticated org members |
| Create break glass account | admin, super_admin            |
| Update break glass account | admin, super_admin            |
| Delete break glass account | admin, super_admin            |

## Routes

### Portal Routes

| Route                     | Description                                   |
| ------------------------- | --------------------------------------------- |
| `GET /portal/break-glass` | List break glass accounts with rotation dates |

### API Routes

| Method | Endpoint                               | Description                           |
| ------ | -------------------------------------- | ------------------------------------- |
| GET    | `/api/v1/security-ops/break-glass`     | List break glass accounts (paginated) |
| GET    | `/api/v1/security-ops/break-glass/:id` | Get single account                    |
| POST   | `/api/v1/security-ops/break-glass`     | Create account                        |
| PATCH  | `/api/v1/security-ops/break-glass/:id` | Update account                        |
| DELETE | `/api/v1/security-ops/break-glass/:id` | Delete account                        |

## Data Model

### break_glass_accounts

| Column           | Type        | Constraints                      | Description                   |
| ---------------- | ----------- | -------------------------------- | ----------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                |
| account_name     | text        | NOT NULL                         | Emergency account name        |
| system           | text        | NOT NULL                         | System the account belongs to |
| custodian_name   | text        |                                  | Named custodian               |
| last_rotated_at  | timestamptz |                                  | Last password rotation        |
| next_rotation_at | timestamptz |                                  | Scheduled next rotation       |
| last_used_at     | timestamptz |                                  | Last known use                |
| last_tested_at   | timestamptz |                                  | Last tested (login verified)  |
| access_procedure | text        |                                  | Documented access procedure   |
| test_notes       | text        |                                  | Notes from testing            |
| status           | text        | NOT NULL, default 'active'       | Account status                |
| created_by       | uuid        | FK → auth.users(id)              | Creator                       |
| created_at       | timestamptz | NOT NULL, default now()          | Creation timestamp            |
| updated_at       | timestamptz | NOT NULL, default now()          | Last update timestamp         |

## Workflows

### Registration

1. Security analyst registers each emergency account with `account_name`, `system`, and `custodian_name`
2. Records `access_procedure` — where the credential is stored and who may request it (never the password itself)
3. Sets `next_rotation_at` according to the rotation policy

### Rotation & Testing

- On rotation, update `last_rotated_at` and set a new `next_rotation_at`
- Periodic testing updates `last_tested_at` and `test_notes`
- The portal surfaces last used and next rotation dates for each account
- Overdue rotations (next_rotation_at in the past) are flagged for action

## AI Review Rules

- AI may draft access procedures and rotation reminders — never credential material
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual break glass records
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| Account card not shown   | Verify org has rows in `break_glass_accounts`; check RLS policies |
| Rotation date missing    | Confirm `next_rotation_at` is set on the account                  |
| Custodian blank          | Confirm `custodian_name` populated on the account                 |
| RLS policy denies access | Confirm user has an approved membership in the organization       |
| 404 on account by id     | Confirm `organization_id` query param matches the account's org   |

## Release Checklist

- [ ] Migration `5302069_security_ops.sql` applied
- [ ] API routes registered in `apps/api/src/routes/security-ops.ts`
- [ ] Validator `createBreakGlassSchema` in `apps/api/src/validators/security-ops.ts`
- [ ] SDK module `securityOps.breakGlass` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/break-glass/`
- [ ] Unit tests pass: `pnpm --filter=api test security-ops`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/break-glass.spec.ts`
- [ ] Feature doc added to `docs/features/break-glass-register.md`
- [ ] Runbook added to `docs/runbooks/break-glass-register.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
