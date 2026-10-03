# Approvals

**Category:** Operations
**API Routes:** `apps/api/src/routes/approvals.ts`
**SDK:** `packages/sdk/src/approvals.ts`

## Overview
Approval workflow engine for managing multi-step approval requests, comments, and timeline events across proposals, changes, and other business processes.

## Key Features
- Multi-type approval requests (proposal, change, purchase, access)
- Approve/reject/cancel workflow with required comments
- Request priority levels (low, normal, high, urgent)
- Timeline events for full audit trail
- Comment thread per approval request
- Stats dashboard (pending, approved, rejected)
- CSV/JSON export
- Optimistic locking on status changes

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/approvals | List approval requests (paginated, filterable by status/type) |
| GET | /api/v1/approvals/export | Export approvals as CSV/JSON |
| GET | /api/v1/approvals/stats | Get approval statistics |
| GET | /api/v1/approvals/:id | Get request by ID (with timeline and comments) |
| POST | /api/v1/approvals | Create an approval request |
| PATCH | /api/v1/approvals/:id | Update request (optimistic locking) |
| DELETE | /api/v1/approvals/:id | Delete a request |
| POST | /api/v1/approvals/:id/approve | Approve request |
| POST | /api/v1/approvals/:id/reject | Reject request |
| POST | /api/v1/approvals/:id/cancel | Cancel request |
| POST | /api/v1/approvals/:id/comments | Add comment to request |

## Data Model
Key fields: `request_type`, `request_subject`, `status`, `priority`, `requested_by`, `approved_by`, `approved_at`, `rejected_reason`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD + approve/reject/cancel
- Client: read-only + submit new requests (portal)
