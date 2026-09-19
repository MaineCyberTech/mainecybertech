# Client Onboarding Command Center

**Category:** Admin
**API Routes:** `apps/api/src/routes/client-onboarding-command-center.ts`
**SDK:** `packages/sdk/src/client-onboarding.ts`

## Overview

Tracks client onboarding progress through phased milestones. Each record has a current phase, risk level, onboarding lead, and a checklist of items. Supports phase completion with notes, checklist item updates, and CSV/JSON export.

## Key Features

- List onboarding records (filterable by status, phase, risk level, lead)
- Full CRUD for onboarding records
- Phase completion workflow with notes and actor tracking
- Per-record checklist with individual item completion
- CSV and JSON export
- Org-scoped with org access enforcement
- Cached reads (30s)

## Endpoints

| Method | Path                                                           | Description                          |
| ------ | -------------------------------------------------------------- | ------------------------------------ |
| GET    | /api/v1/client-onboarding-command-center                       | List records (filterable, paginated) |
| GET    | /api/v1/client-onboarding-command-center/export.csv            | Export as CSV or JSON                |
| GET    | /api/v1/client-onboarding-command-center/:id                   | Get a single record                  |
| POST   | /api/v1/client-onboarding-command-center                       | Create a new onboarding record       |
| PATCH  | /api/v1/client-onboarding-command-center/:id                   | Update an onboarding record          |
| DELETE | /api/v1/client-onboarding-command-center/:id                   | Delete an onboarding record          |
| POST   | /api/v1/client-onboarding-command-center/:id/complete-phase    | Complete the current phase           |
| GET    | /api/v1/client-onboarding-command-center/:id/checklist         | Get checklist items for a record     |
| PATCH  | /api/v1/client-onboarding-command-center/:id/checklist/:itemId | Update a checklist item              |

## Data Model

Key table: `client_onboarding_command_center_records` (organization_id, client_name, client_domain, status, phase, risk_level, onboarding_lead_id). Checklist items stored per record.

## Access Control

- All authenticated users (org-scoped): list, view records and checklists
- All authenticated users (org-scoped): create, update, delete, complete phases, update checklist items
