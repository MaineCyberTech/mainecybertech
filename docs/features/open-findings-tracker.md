# Open Findings Tracker

## Purpose

P0-P3 finding lifecycle tracker for audit and remediation across assessments. Tracks findings by severity, status, source, remediation plan and deadline, verification steps, affected systems, and controls impacted, with a resolve → verify workflow.

Primary users: MSP security engineer, client IT contact, audit lead

Business impact: Critical

Category: security

## Permissions

| Action             | Roles                         |
| ------------------ | ----------------------------- |
| List findings      | All authenticated org members |
| View finding       | All authenticated org members |
| Create finding     | admin, super_admin            |
| Update finding     | admin, super_admin            |
| Delete finding     | admin, super_admin            |
| Resolve finding    | admin, super_admin            |
| Verify finding     | admin, super_admin            |
| Comment on finding | admin, super_admin            |

## Routes

### Portal Routes

| Route                  | Description                        |
| ---------------------- | ---------------------------------- |
| `GET /portal/findings` | List findings + remediation status |

### Admin Routes

| Route                 | Description             |
| --------------------- | ----------------------- |
| `GET /admin/findings` | Finding management list |

### API Routes

| Method   | Endpoint                        | Description                                                        |
| -------- | ------------------------------- | ------------------------------------------------------------------ |
| GET      | `/api/v1/findings`              | List findings (paginated, filter by status/severity/source/search) |
| GET      | `/api/v1/findings/export`       | CSV/JSON export                                                    |
| GET      | `/api/v1/findings/stats`        | Severity/status breakdown                                          |
| GET      | `/api/v1/findings/:id`          | Get finding with comments + timeline                               |
| POST     | `/api/v1/findings`              | Create finding                                                     |
| PATCH    | `/api/v1/findings/:id`          | Update finding (optimistic locking)                                |
| DELETE   | `/api/v1/findings/:id`          | Delete finding                                                     |
| POST     | `/api/v1/findings/:id/resolve`  | Mark resolved (open/in_progress only)                              |
| POST     | `/api/v1/findings/:id/verify`   | Mark verified (resolved only)                                      |
| GET/POST | `/api/v1/findings/:id/comments` | List/create comments                                               |
| GET      | `/api/v1/findings/:id/timeline` | Timeline events                                                    |

## Data Model

### findings

| Column               | Type        | Constraints                      | Description                              |
| -------------------- | ----------- | -------------------------------- | ---------------------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()    | Unique identifier                        |
| organization_id      | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                           |
| title                | text        | NOT NULL                         | Finding title                            |
| description          | text        |                                  | Detailed description                     |
| severity             | text        | NOT NULL, default 'p2'           | p0 / p1 / p2 / p3                        |
| status               | text        | NOT NULL, default 'open'         | open / in_progress / resolved / verified |
| source               | text        | NOT NULL, default 'security'     | security / audit / compliance / customer |
| visibility           | text        | NOT NULL, default 'internal'     | internal / client                        |
| finding_category     | text        |                                  | Category label                           |
| remediation_plan     | text        |                                  | Remediation plan                         |
| remediation_deadline | timestamptz |                                  | Due date for remediation                 |
| verification_steps   | text        |                                  | Steps to verify the fix                  |
| verified_at          | timestamptz |                                  | Verification timestamp                   |
| verified_by          | uuid        | FK → auth.users(id)              | Verifying user                           |
| affected_systems     | text        |                                  | Systems affected                         |
| controls_impacted    | text        |                                  | Controls impacted                        |
| owner_user_id        | uuid        | FK → auth.users(id)              | Responsible owner                        |
| assigned_to          | uuid        | FK → auth.users(id)              | Assigned user                            |
| created_by           | uuid        | FK → auth.users(id)              | Creator                                  |
| updated_by           | uuid        | FK → auth.users(id)              | Last updater                             |
| resolved_at          | timestamptz |                                  | Resolution timestamp                     |
| metadata             | jsonb       | NOT NULL, default '{}'           | Flexible metadata                        |
| version              | integer     | NOT NULL, default 1              | Optimistic locking                       |
| created_at           | timestamptz | NOT NULL, default now()          | Creation timestamp                       |
| updated_at           | timestamptz | NOT NULL, default now()          | Last update timestamp                    |

Comments and timeline events live in `module_comments` / `module_timeline_events` keyed by `module_key = 'findings'`.

## Workflows

### Lifecycle

1. Finding created with severity/status/source; audit event `finding.{severity}.created` and timeline event logged
2. Work begins → status `in_progress`
3. `POST /:id/resolve` requires current status `open` or `in_progress`; sets `resolved_at` and `remediation_plan`
4. `POST /:id/verify` requires current status `resolved`; sets `verified_by`, `verified_at`, status `verified`
5. Both transitions are version-checked (409 on conflict) and emit timeline events

### Comments & Timeline

- `GET /:id` returns the finding plus its `module_comments` and `module_timeline_events`
- Comments support `is_internal` flag; timeline events document created/resolved/verified transitions

## AI Review Rules

- AI may draft remediation plans and verification steps
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying changes

## Troubleshooting

| Issue                       | Resolution                                              |
| --------------------------- | ------------------------------------------------------- |
| Resolve rejected            | Status must be `open` or `in_progress`                  |
| Verify rejected             | Status must be `resolved`                               |
| Version conflict (409)      | Refresh and retry; another user modified the finding    |
| Stats endpoint wrong counts | Confirm filters use real columns (`severity`, `status`) |

## Release Checklist

- [ ] Migration `5302060_findings_tracker.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/findings.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/findings/`
- [ ] Unit tests pass: `pnpm --filter=api test findings`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/findings.spec.ts`
- [ ] Feature doc added to `docs/features/open-findings-tracker.md`
- [ ] Runbook added to `docs/runbooks/open-findings-tracker.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
