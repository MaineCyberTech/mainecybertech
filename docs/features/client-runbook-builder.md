# Client Runbook Builder

## Purpose

Shared client runbook library that captures standard operating procedures, client environment documentation, and troubleshooting guides. Runbooks are versioned, categorized, and available to both the client portal and the MSP team.

Primary users: client administrator, client user, MSP engineer, admin

Business impact: Medium

Category: final

## Permissions

| Action         | Roles                         |
| -------------- | ----------------------------- |
| List runbooks  | All authenticated org members |
| View runbook   | All authenticated org members |
| Create runbook | admin, super_admin            |
| Update runbook | admin, super_admin            |
| Delete runbook | admin, super_admin            |

## Routes

### Portal Routes

| Route                  | Description                            |
| ---------------------- | -------------------------------------- |
| `GET /portal/runbooks` | List runbooks for current organization |

### API Routes

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/api/v1/final/runbooks`     | List runbooks (paginated) |
| GET    | `/api/v1/final/runbooks/:id` | Get a single runbook      |
| POST   | `/api/v1/final/runbooks`     | Create a runbook          |
| PATCH  | `/api/v1/final/runbooks/:id` | Update a runbook          |
| DELETE | `/api/v1/final/runbooks/:id` | Delete a runbook          |

## Data Model

### client_runbooks

| Column           | Type        | Constraints                      | Description                  |
| ---------------- | ----------- | -------------------------------- | ---------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier            |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping               |
| title            | text        | NOT NULL                         | Runbook display title        |
| content          | text        |                                  | Runbook body (markdown/text) |
| category         | text        |                                  | Runbook category             |
| version          | text        | NOT NULL, default '1.0'          | Version label                |
| status           | text        | NOT NULL, default 'draft'        | draft / active / archived    |
| last_reviewed_at | timestamptz |                                  | Last content review date     |
| next_review_at   | timestamptz |                                  | Scheduled review date        |
| created_by       | uuid        | FK → auth.users(id)              | Author                       |
| created_at       | timestamptz | NOT NULL, default now()          | Creation timestamp           |
| updated_at       | timestamptz | NOT NULL, default now()          | Last update timestamp        |

## Workflows

### Runbook Lifecycle

1. Author creates a runbook (status defaults to `draft`)
2. Content is reviewed and versioned (`version` incremented on substantive changes)
3. Runbook is published for portal visibility (status `active`)
4. Runbooks are reviewed on a schedule via `next_review_at`; stale runbooks are flagged or archived

### Portal Display

- Portal lists runbooks scoped to the approved membership's organization
- Each card shows `title`, `category`, `version`, and `created_at`
- Empty state renders "No runbooks found." when the organization has none

## Troubleshooting

| Issue                    | Resolution                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| Runbook list empty       | Verify organization has runbooks and `organization_id` is passed   |
| New runbook not visible  | Confirm status is `active` (draft runbooks still render by design) |
| Version not incrementing | Bump `version` explicitly on update                                |
| RLS policy denies access | Confirm user has an approved membership in the organization        |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied (`client_runbooks` table)
- [ ] API routes registered in `apps/api/src/routes/final.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`final.runbooks`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/runbooks/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/runbooks.spec.ts`
- [ ] Feature doc added to `docs/features/client-runbook-builder.md`
- [ ] Runbook added to `docs/runbooks/client-runbook-builder.md`
