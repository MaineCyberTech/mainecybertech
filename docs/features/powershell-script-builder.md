# PowerShell Script Builder

## Purpose

Central library for MSP-authored PowerShell scripts with an approval workflow and automated policy scan. Scripts are stored, reviewed for dangerous patterns, submitted for approval, and either approved or rejected before use across client environments.

Primary users: MSP engineer (author), MSP technician (reviewer), admin, super_admin

Business impact: High

Category: edu-automation

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| List scripts             | All authenticated org members |
| View script              | All authenticated org members |
| Create script            | admin, super_admin            |
| Update script            | admin, super_admin            |
| Delete script            | admin, super_admin            |
| Submit script for review | admin, super_admin            |
| Run policy scan          | admin, super_admin            |
| Approve script           | admin, super_admin            |
| Reject script            | admin, super_admin            |

## Routes

### Admin Routes

| Route                                      | Description                            |
| ------------------------------------------ | -------------------------------------- |
| `GET /admin/edu-automation/powershell`     | List PowerShell scripts (admin-only)   |
| `GET /admin/edu-automation/powershell/:id` | View/edit a single script (admin-only) |

There is no portal page for this module — script creation and review are admin-only operations.

### API Routes

| Method | Endpoint                                        | Description                                                                |
| ------ | ----------------------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/api/v1/edu-automation/powershell`             | List scripts (paginated, org-scoped)                                       |
| GET    | `/api/v1/edu-automation/powershell/:id`         | Get a single script                                                        |
| POST   | `/api/v1/edu-automation/powershell`             | Create a script                                                            |
| PATCH  | `/api/v1/edu-automation/powershell/:id`         | Update a script                                                            |
| DELETE | `/api/v1/edu-automation/powershell/:id`         | Delete a script                                                            |
| POST   | `/api/v1/edu-automation/powershell/:id/submit`  | Submit draft for review (status → `pending_review`)                        |
| POST   | `/api/v1/edu-automation/powershell/:id/check`   | Run policy scan; set `policy_checked` + `policy_violations` + `risk_level` |
| POST   | `/api/v1/edu-automation/powershell/:id/approve` | Approve (status → `approved`, sets `approved_by`/`approved_at`)            |
| POST   | `/api/v1/edu-automation/powershell/:id/reject`  | Reject (status → `rejected`)                                               |

All routes require `requireAuth` + `requireOrgAccess` (org passed via `organization_id` query param on reads and in the create/update body).

## Data Model

### powershell_scripts

| Column            | Type        | Constraints                      | Description                                |
| ----------------- | ----------- | -------------------------------- | ------------------------------------------ |
| id                | uuid        | PK, default gen_random_uuid()    | Unique identifier                          |
| organization_id   | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                             |
| name              | text        | NOT NULL                         | Script display name                        |
| script_content    | text        |                                  | PowerShell script body                     |
| policy_checked    | boolean     | NOT NULL, default false          | Whether policy scan has run                |
| approval_required | boolean     | NOT NULL, default true           | Whether approval gate is enforced          |
| approved_by       | uuid        | FK → auth.users(id)              | User who approved the script               |
| approved_at       | timestamptz |                                  | Approval timestamp                         |
| status            | text        | NOT NULL, default 'draft'        | draft → pending_review → approved/rejected |
| policy_violations | text[]      | default '{}'                     | Labels of dangerous patterns detected      |
| risk_level        | text        | default 'low'                    | low, medium, high, critical                |
| submitted_at      | timestamptz |                                  | When the script was submitted              |
| created_by        | uuid        | FK → auth.users(id)              | Author                                     |
| created_at        | timestamptz | NOT NULL, default now()          | Creation timestamp                         |
| updated_at        | timestamptz | NOT NULL, default now()          | Last update timestamp                      |

RLS policies (`ps_org`, `ps_org_i`, `ps_org_u`, `ps_org_d`) scope all access to the caller's organization membership.

## Workflows

### Script Lifecycle

1. **Draft** — Engineer creates a script (`POST /powershell`). Status defaults to `draft`.
2. **Policy check** — Engineer runs `POST /powershell/:id/check`. The API scans `script_content` against the `DANGEROUS_PATTERNS` list (Invoke-Expression, Remove-Item -Recurse -Force, Set-ExecutionPolicy Bypass, external Invoke-WebRequest, credential manipulation, local user/group creation, net user commands, Stop-Service/Restart-Computer, disk formatting, remote Invoke-Command) and stores the detected violation labels and aggregate risk level.
3. **Submit** — Engineer calls `POST /powershell/:id/submit`; status moves `draft` → `pending_review`. Submitting a non-draft script returns `409 INVALID_STATE`.
4. **Approve / Reject** — Reviewer approves (`approved` + `approved_by`/`approved_at`) or rejects (`rejected`). Both transitions require status `pending_review` or they return `409 INVALID_STATE`.
5. **Audit** — Every transition logs an audit event (`powershell.submit`, `powershell.policy_check`, `powershell.approve`, `powershell.reject`, plus CRUD actions).

### Policy Scan Risk Levels

- 0 violations → `low`
- 1 violation → `medium`
- 2 violations → `high`
- 3+ violations → `high`; 4+ → `critical`

## Troubleshooting

| Issue                                | Resolution                                                            |
| ------------------------------------ | --------------------------------------------------------------------- |
| Submit returns 409                   | Script is not in `draft`; only drafts can be submitted                |
| Approve/reject returns 409           | Script is not `pending_review`; only submitted scripts can be decided |
| Policy scan returns no content error | `script_content` is empty — add script body before running the scan   |
| Script list empty                    | Verify org has scripts and `organization_id` is passed on the request |
| RLS policy denies access             | Confirm user has an approved membership in the organization           |

## Release Checklist

- [ ] Migration `5302073_edu_automation.sql` + `5302083_powershell_policy_guard.sql` applied
- [ ] API routes registered in `apps/api/src/routes/edu-automation.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`eduAutomation.powershell`)
- [ ] Admin pages created in `apps/web/app/(admin)/admin/edu-automation/powershell/`
- [ ] Server actions in `apps/web/lib/module-actions.ts` (`createPowerShell`)
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/admin/powershell.spec.ts`
- [ ] Feature doc added to `docs/features/powershell-script-builder.md`
- [ ] Runbook added to `docs/runbooks/powershell-script-builder.md`
