# QBR Reports

**Category:** Business
**API Routes:** `apps/api/src/routes/qbr.ts`
**SDK:** `packages/sdk/src/qbr.ts`

## Overview
Quarterly Business Review (QBR) report generator that aggregates real-time data from tickets, projects, findings, assets, and domain monitors into a single executive summary.

## Key Features
- Auto-generate reports with aggregated metrics across all modules
- Custom period ranges (start/end dates)
- Executive summary with ticket counts, project status, finding severity breakdown
- Asset warranty expiry tracking and security posture overview
- Visibility control (internal, client, public)
- Scheduled auto-generation via worker task

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/qbr | List all reports (paginated) |
| POST | /api/v1/qbr/generate | Generate a new QBR report |
| GET | /api/v1/qbr/:id | Get report by ID |
| PATCH | /api/v1/qbr/:id | Update report (title, status, summary, visibility) |
| DELETE | /api/v1/qbr/:id | Delete a report |

## Data Model
Key fields: `title`, `status`, `period_start`, `period_end`, `report_data` (JSON), `visibility`, `organization_id`, `generated_by`, `created_by`, `metadata`

## Access Control
- Admin: full CRUD + report generation
- Client: read-only (portal, own org reports)

## Worker Tasks
- `qbr-scheduled-generate`: Automated quarterly report generation
