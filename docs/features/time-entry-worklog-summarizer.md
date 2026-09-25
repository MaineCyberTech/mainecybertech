# Time Entry Worklog Summarizer

## Purpose

Track billable and non-billable time entries for the organization, optionally linked to tickets, and summarize hours over a configurable period for client worklog reporting.

Primary users: MSP technician, account manager, client sponsor

Business impact: Medium

Category: final

## Permissions

| Action               | Roles                         |
| -------------------- | ----------------------------- |
| List time entries    | All authenticated org members |
| View time entry      | All authenticated org members |
| Create time entry    | admin, super_admin            |
| Update time entry    | admin, super_admin            |
| Delete time entry    | admin, super_admin            |
| View worklog summary | All authenticated org members |

## Routes

### Portal Routes

| Route                      | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `GET /portal/time-entries` | List time entries with hours and billable status |

### API Routes

| Method | Endpoint                             | Description                               |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/api/v1/final/time-entries`         | List time entries (paginated)             |
| GET    | `/api/v1/final/time-entries/:id`     | Get single time entry                     |
| POST   | `/api/v1/final/time-entries`         | Create time entry                         |
| PATCH  | `/api/v1/final/time-entries/:id`     | Update time entry                         |
| DELETE | `/api/v1/final/time-entries/:id`     | Delete time entry                         |
| GET    | `/api/v1/final/time-entries/summary` | Summarize hours over last N days (max 90) |

## Data Model

### time_entries

| Column          | Type         | Constraints                      | Description                   |
| --------------- | ------------ | -------------------------------- | ----------------------------- |
| id              | uuid         | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id | uuid         | FK → organizations(id), NOT NULL | Tenant scoping                |
| description     | text         | NOT NULL                         | Work description              |
| hours           | numeric(5,2) | default 0                        | Hours worked                  |
| billable        | boolean      | default true                     | Whether the entry is billable |
| work_date       | date         |                                  | Date the work was performed   |
| ticket_id       | uuid         | FK → tickets(id)                 | Linked ticket                 |
| user_id         | uuid         | FK → auth.users(id)              | User who logged the time      |
| created_at      | timestamptz  | NOT NULL, default now()          | Creation timestamp            |
| updated_at      | timestamptz  | NOT NULL, default now()          | Last update timestamp         |

## Workflows

### Logging Time

1. Technician creates an entry with `description`, `hours`, `billable`, and optional `work_date` / `ticket_id`
2. The portal renders each entry with hours, date, linked ticket (truncated id), and a billable / non-billable badge
3. Entries may be updated (e.g. correct hours) via PATCH

### Worklog Summary

- `GET /time-entries/summary?days=30` returns `periodDays`, `totalEntries`, `totalHours`, `billableHours`, `nonBillableHours`, and a `byDate` breakdown
- Default period is 30 days, capped at 90 days
- Used for client worklog reports and capacity tracking

## AI Review Rules

- AI may draft entry descriptions and summary narratives for client reporting
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual time entries
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                     | Resolution                                                  |
| ------------------------- | ----------------------------------------------------------- |
| Entry not shown           | Verify org has rows in `time_entries`; check RLS policies   |
| Hours display 0.0         | Confirm `hours` set to a positive value on the entry        |
| Billable badge wrong      | Confirm `billable` flag on the entry                        |
| Summary period unexpected | Confirm `days` param between 1 and 90 (default 30)          |
| RLS policy denies access  | Confirm user has an approved membership in the organization |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied
- [ ] API routes registered in `apps/api/src/routes/final.ts`
- [ ] Validator `time` in `apps/api/src/validators/final.ts`
- [ ] SDK module `final.timeEntries` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/time-entries/`
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/time-entries.spec.ts`
- [ ] Feature doc added to `docs/features/time-entry-worklog-summarizer.md`
- [ ] Runbook added to `docs/runbooks/time-entry-worklog-summarizer.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
