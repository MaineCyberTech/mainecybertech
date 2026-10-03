# MSP Automation Workflow Catalog

## Purpose

Catalog of MSP automation workflows — reusable PowerShell and scripted automations that can be tracked, executed, and audited per client. Covers script type, trigger type (manual or scheduled), active state, and last run results.

Primary users: MSP automation engineer, service delivery lead

Business impact: High

Category: operations

## Permissions

| Action                    | Roles                         |
| ------------------------- | ----------------------------- |
| List automation workflows | All authenticated org members |
| View workflow             | All authenticated org members |
| Create workflow           | admin, super_admin            |
| Update workflow           | admin, super_admin            |
| Delete workflow           | admin, super_admin            |
| Execute workflow          | admin, super_admin            |

## Routes

### Portal Routes

| Route                    | Description                               |
| ------------------------ | ----------------------------------------- |
| `GET /portal/automation` | List automation workflows for current org |

### Admin Routes

| Route                                      | Description          |
| ------------------------------------------ | -------------------- |
| `GET /admin/edu-automation/automation`     | Workflow list        |
| `GET /admin/edu-automation/automation/:id` | Workflow detail/edit |

### API Routes

| Method | Endpoint                                         | Description                               |
| ------ | ------------------------------------------------ | ----------------------------------------- |
| GET    | `/api/v1/edu-automation/automation`              | List workflows (paginated, org-scoped)    |
| GET    | `/api/v1/edu-automation/automation/:id`          | Get a single workflow                     |
| POST   | `/api/v1/edu-automation/automation`              | Create workflow                           |
| PATCH  | `/api/v1/edu-automation/automation/:id`          | Update workflow                           |
| DELETE | `/api/v1/edu-automation/automation/:id`          | Delete workflow                           |
| POST   | `/api/v1/edu-automation/automation/:id/execute`  | Mark workflow as running                  |
| POST   | `/api/v1/edu-automation/automation/:id/complete` | Mark workflow complete/failed with result |

## Data Model

### automation_workflows

| Column          | Type        | Constraints                      | Description                   |
| --------------- | ----------- | -------------------------------- | ----------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                |
| name            | text        | NOT NULL                         | Workflow name                 |
| description     | text        |                                  | Workflow description          |
| script_type     | text        | default 'powershell'             | powershell / bash / api, etc. |
| trigger_type    | text        | default 'manual'                 | manual / scheduled / event    |
| is_active       | boolean     | default true                     | Enabled flag                  |
| last_run_at     | timestamptz |                                  | Last execution timestamp      |
| last_run_status | text        |                                  | running / completed / failed  |
| run_count       | integer     | default 0                        | Total executions              |
| created_by      | uuid        | FK → auth.users(id)              | Creator                       |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp            |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp         |

## Workflows

### Execute Workflow

1. `POST /automation/:id/execute` marks the workflow `status: running` and stamps `last_run_at`
2. Automation runs (externally or via the `automation-run-check` worker task)
3. `POST /automation/:id/complete` records `last_result` and sets status to `completed` or `failed`
4. `run_count` increments on each run
5. Audit events `automation.created` / `.updated` / `.deleted` are logged for CRUD

### PowerShell Policy Integration

- Workflows are distinct from `powershell_scripts`, which enforce a policy scan (`/powershell/:id/check`) against dangerous patterns before approval
- Approval-required scripts go through submit → check → approve/reject lifecycle

## AI Review Rules

- AI may draft workflow definitions and descriptions
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to the automation catalog

## Troubleshooting

| Issue                    | Resolution                                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| Workflow stuck "running" | Call `POST /automation/:id/complete` with success/result or reset via PATCH |
| Empty workflow list      | Verify org has workflows; check RLS policy                                  |
| Execute returns 404      | Confirm workflow id exists in the org                                       |

## Release Checklist

- [ ] Table from migration `5302073_edu_automation.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/automation/`
- [ ] Worker task `automation-run-check` registered
- [ ] Unit tests pass: `pnpm --filter=api test edu-automation`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/automation.spec.ts`
- [ ] Feature doc added to `docs/features/msp-automation-workflow-catalog.md`
- [ ] Runbook added to `docs/runbooks/msp-automation-workflow-catalog.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
