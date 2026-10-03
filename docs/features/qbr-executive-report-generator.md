# QBR Executive Report Generator

## Purpose

Quarterly Business Review report generator for MSP account management. Aggregates tickets, projects, findings, assets (including expiring warranties), and domain-monitoring posture into a single executive report for client meetings.

Primary users: MSP account manager, client executive, service lead

Business impact: High

Category: reporting

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List QBR reports    | All authenticated org members |
| View QBR report     | All authenticated org members |
| Generate QBR report | admin, super_admin            |
| Update QBR report   | admin, super_admin            |
| Delete QBR report   | admin, super_admin            |
| Export QBR report   | admin, super_admin            |

## Routes

### Portal Routes

| Route             | Description                               |
| ----------------- | ----------------------------------------- |
| `GET /portal/qbr` | List QBR reports for current organization |

### Admin Routes

| Route            | Description                    |
| ---------------- | ------------------------------ |
| `GET /admin/qbr` | QBR report list and management |

### API Routes

| Method | Endpoint               | Description                                         |
| ------ | ---------------------- | --------------------------------------------------- |
| GET    | `/api/v1/qbr`          | List reports (paginated, org-scoped)                |
| GET    | `/api/v1/qbr/:id`      | Get a single report                                 |
| POST   | `/api/v1/qbr/generate` | Generate a report from current org metrics          |
| PATCH  | `/api/v1/qbr/:id`      | Update title, status, summary, visibility, metadata |
| DELETE | `/api/v1/qbr/:id`      | Delete a report                                     |

## Data Model

### qbr_reports

| Column            | Type        | Constraints                      | Description                |
| ----------------- | ----------- | -------------------------------- | -------------------------- |
| id                | uuid        | PK, default gen_random_uuid()    | Unique identifier          |
| organization_id   | uuid        | FK → organizations(id), NOT NULL | Tenant scoping             |
| title             | text        | NOT NULL                         | Report display name        |
| period_start      | date        |                                  | Reporting period start     |
| period_end        | date        |                                  | Reporting period end       |
| status            | text        | NOT NULL, default 'draft'        | draft / sent / published   |
| visibility        | text        | NOT NULL, default 'internal'     | internal / client          |
| summary           | text        |                                  | Executive summary          |
| report_data       | jsonb       | NOT NULL, default '{}'           | Aggregated metrics payload |
| generated_by      | uuid        | FK → auth.users(id)              | User who generated         |
| approved_by       | uuid        | FK → auth.users(id)              | Approving user             |
| approved_at       | timestamptz |                                  | Approval timestamp         |
| sent_to_client_at | timestamptz |                                  | When sent to client        |
| created_by        | uuid        | FK → auth.users(id)              | Creator                    |
| metadata          | jsonb       | NOT NULL, default '{}'           | Flexible metadata          |
| created_at        | timestamptz | NOT NULL, default now()          | Creation timestamp         |
| updated_at        | timestamptz | NOT NULL, default now()          | Last update timestamp      |

## Workflows

### Generate Report

1. Caller invokes `POST /api/v1/qbr/generate` with `title`, `periodStart`, `periodEnd`, `visibility`
2. API runs six parallel aggregate queries for the org: ticket total + open, recent projects, findings, assets with expiring warranties (≤90 days), and domain-monitor alerts
3. Findings are summarized by severity (P0-P3) and status (open vs resolved); assets flag warranties expiring within 90 days; domain monitors flag missing SPF/DKIM/DMARC or invalid SSL
4. `report_data` is populated with the generated snapshot and a new row is inserted with status `draft`
5. Audit event `qbr.report.generated` is logged
6. A worker task `qbr-scheduled-generate` can trigger generation on a schedule for recurring client reviews

### Publish / Send

- `PATCH /api/v1/qbr/:id` with `status: "sent"` logs `qbr.report.sent`; `published` is available for client-visible visibility
- `summary` and `visibility` can be updated before sending

## AI Review Rules

- AI may draft report summaries from the aggregated `report_data` snapshot
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before the report is sent to a client
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                     | Resolution                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Report list empty         | Verify organization has generated reports; check RLS policy                                |
| Generate returns DB_ERROR | Confirm all referenced tables (tickets, projects, findings, assets, domain_monitors) exist |
| Report not found (404)    | Ensure `organizationId` matches the report's organization                                  |
| RLS denies access         | Confirm user has an approved membership in the organization                                |

## Release Checklist

- [ ] Migration `5302063_qbr_reports.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/qbr.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/qbr/`
- [ ] Worker task `qbr-scheduled-generate` registered
- [ ] Unit tests pass: `pnpm --filter=api test qbr`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/qbr.spec.ts`
- [ ] Feature doc added to `docs/features/qbr-executive-report-generator.md`
- [ ] Runbook added to `docs/runbooks/qbr-executive-report-generator.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
