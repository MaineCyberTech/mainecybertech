# Backup Disaster Recovery

## Purpose

Backup and disaster recovery review across client environments. Tracks backup jobs per system, last backup status and size, RPO/RTO objectives, retention, restore testing, offsite replication, and encryption state.

Primary users: MSP NOC engineer, backup administrator, client IT contact

Business impact: Critical

Category: operations

## Permissions

| Action            | Roles                         |
| ----------------- | ----------------------------- |
| List backup jobs  | All authenticated org members |
| View backup job   | All authenticated org members |
| Create backup job | admin, super_admin            |
| Update backup job | admin, super_admin            |
| Delete backup job | admin, super_admin            |

## Routes

### Portal Routes

| Route                   | Description                             |
| ----------------------- | --------------------------------------- |
| `GET /portal/backup-dr` | List backup jobs and DR posture for org |

### Admin Routes

| Route                          | Description            |
| ------------------------------ | ---------------------- |
| `GET /admin/final/backups`     | Backup job list        |
| `GET /admin/final/backups/:id` | Backup job detail/edit |

### API Routes

| Method | Endpoint                              | Description                                        |
| ------ | ------------------------------------- | -------------------------------------------------- |
| GET    | `/api/v1/final/backups`               | List backup jobs (paginated, org-scoped)           |
| GET    | `/api/v1/final/backups/stats`         | Aggregate: total/failed/untested/offsite/encrypted |
| GET    | `/api/v1/final/backups/risk-analysis` | Risk score + level from failed/untested            |
| GET    | `/api/v1/final/backups/:id`           | Get single backup job                              |
| POST   | `/api/v1/final/backups`               | Create backup job                                  |
| PATCH  | `/api/v1/final/backups/:id`           | Update backup job                                  |
| DELETE | `/api/v1/final/backups/:id`           | Delete backup job                                  |

## Data Model

### backup_status

| Column                         | Type         | Constraints                      | Description                             |
| ------------------------------ | ------------ | -------------------------------- | --------------------------------------- |
| id                             | uuid         | PK, default gen_random_uuid()    | Unique identifier                       |
| organization_id                | uuid         | FK → organizations(id), NOT NULL | Tenant scoping                          |
| system_name                    | text         | NOT NULL                         | Backup target name                      |
| backup_type                    | text         | default 'full'                   | full / incremental / differential       |
| last_backup_at                 | timestamptz  |                                  | Last successful backup timestamp        |
| last_backup_status             | text         | default 'unknown'                | success / failed / unknown              |
| last_backup_size_gb            | numeric(8,2) |                                  | Size of last backup                     |
| next_scheduled_at              | timestamptz  |                                  | Next scheduled backup                   |
| recovery_point_objective_hours | integer      |                                  | Target RPO in hours                     |
| recovery_time_objective_hours  | integer      |                                  | Target RTO in hours                     |
| retention_days                 | integer      | default 30                       | Retention window                        |
| restore_tested_at              | timestamptz  |                                  | Last restore test                       |
| restore_test_result            | text         |                                  | pass / fail / untested                  |
| offsite_replicated             | boolean      | default false                    | Offsite replication enabled             |
| encryption_enabled             | boolean      | default false                    | At-rest encryption enabled              |
| notes                          | text         |                                  | Free-form notes                         |
| status                         | text         | NOT NULL, default 'monitored'    | monitored / degraded / failed / at_risk |
| created_by                     | uuid         | FK → auth.users(id)              | Creator                                 |
| created_at                     | timestamptz  | NOT NULL, default now()          | Creation timestamp                      |
| updated_at                     | timestamptz  | NOT NULL, default now()          | Last update timestamp                   |

## Workflows

### Scheduled Backup Review

- Worker task `backup-dr-check` runs on a schedule to flag failed or stale backups
- Stats endpoint reports `total`, `failed`, `untested`, `offsiteReplicated`, `encrypted`
- Risk-analysis endpoint computes a weighted risk score from failed (×3) and untested (×2) jobs, mapped to `low` / `medium` / `high`

### Restore Testing

- `restore_tested_at` + `restore_test_result` track periodic restore verification
- Untested backups count toward the risk score

## AI Review Rules

- AI may draft RPO/RTO recommendations and DR review notes
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying changes

## Troubleshooting

| Issue                     | Resolution                                                    |
| ------------------------- | ------------------------------------------------------------- |
| Backup list empty         | Verify org has jobs; check RLS policy                         |
| Risk score always high    | Confirm `status` and `restore_test_result` values are current |
| Failed backup not flagged | Verify worker task `backup-dr-check` is running               |

## Release Checklist

- [ ] Migration `5302075_backup_dr.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/backup-dr/`
- [ ] Worker task `backup-dr-check` registered
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/backup-dr.spec.ts`
- [ ] Feature doc added to `docs/features/backup-disaster-recovery.md`
- [ ] Runbook added to `docs/runbooks/backup-disaster-recovery.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
