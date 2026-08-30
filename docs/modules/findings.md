# Findings

**Category:** Security
**API Routes:** `apps/api/src/routes/findings.ts`
**SDK:** `packages/sdk/src/findings.ts`

## Overview
Open findings and audit remediation tracker for managing security assessment results, vulnerability remediation, and audit findings across client organizations.

## Key Features
- Severity classification (P0-P3)
- Source tracking (pen test, audit, self-assessment, etc.)
- Remediation deadline tracking
- Verification workflow (verify finding resolution)
- Timeline events for status changes
- Comments support per finding
- CSV/JSON export
- Optimistic locking on updates

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/findings | List all findings (paginated, filterable by status/severity/source) |
| GET | /api/v1/findings/export | Export findings as CSV/JSON |
| GET | /api/v1/findings/:id | Get finding by ID (with comments and timeline) |
| POST | /api/v1/findings | Create a new finding |
| PATCH | /api/v1/findings/:id | Update finding (optimistic locking) |
| DELETE | /api/v1/findings/:id | Delete a finding |
| POST | /api/v1/findings/:id/verify | Mark finding as verified |
| POST | /api/v1/findings/:id/resolve | Mark finding as resolved |

## Data Model
Key fields: `title`, `severity`, `status`, `source`, `remediation_deadline`, `remediation_notes`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD + verify/resolve
- Client: read-only (portal, own org findings)
