# Proposals

**Category:** Business
**API Routes:** `apps/api/src/routes/proposals.ts`
**SDK:** `packages/sdk/src/proposals.ts`

## Overview
MSP proposal builder for creating structured service proposals with phases, line items, pricing, and e-signature support. Includes approval workflow integration.

## Key Features
- Full CRUD with draft/published/accepted status flow
- Multi-phase proposal structure with individual line items
- Line item pricing (quantity, unit price, total)
- Approval submission and publishing workflow
- Timeline events for status changes and approvals
- CSV/JSON export
- Optimistic locking on updates

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/proposals | List all proposals (paginated, filterable by status/search) |
| GET | /api/v1/proposals/export | Export proposals as CSV/JSON |
| GET | /api/v1/proposals/:id | Get proposal by ID (with phases and line items) |
| POST | /api/v1/proposals | Create a new proposal |
| PATCH | /api/v1/proposals/:id | Update proposal (optimistic locking) |
| DELETE | /api/v1/proposals/:id | Delete a proposal |
| GET | /api/v1/proposals/:id/phases | List phases for a proposal |
| POST | /api/v1/proposals/:id/phases | Add a phase |
| PATCH | /api/v1/proposals/phases/:phaseId | Update a phase |
| DELETE | /api/v1/proposals/phases/:phaseId | Delete a phase |
| GET | /api/v1/proposals/phases/:phaseId/line-items | List line items in a phase |
| POST | /api/v1/proposals/phases/:phaseId/line-items | Add a line item |
| PATCH | /api/v1/proposals/line-items/:itemId | Update a line item |
| DELETE | /api/v1/proposals/line-items/:itemId | Delete a line item |
| POST | /api/v1/proposals/:id/submit | Submit for approval |
| POST | /api/v1/proposals/:id/publish | Publish to client |

## Data Model
Key fields: `title`, `status`, `grand_total`, `valid_until`, `organization_id`, `created_by`, `phases`, `line_items`

## Access Control
- Admin: full CRUD + submit/publish
- Client: read-only (portal, own org proposals)
