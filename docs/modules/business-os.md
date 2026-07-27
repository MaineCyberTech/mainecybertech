# Business OS

**Category:** Operations
**API Routes:** `apps/api/src/routes/business-os.ts`
**SDK:** `packages/sdk/src/business-os.ts`

## Overview
Internal MSP business operating system dashboard providing aggregated metrics across organizations, tickets, projects, documents, approvals, and users.

## Key Features
- Cross-org summary dashboard with key counts
- Organization breakdown (total, approved, pending)
- Open tickets, active projects, and pending approvals counts
- Document and user totals
- 30-second response cache for dashboard performance

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/business-os/summary | Get aggregate dashboard summary |
| GET | /api/v1/business-os/dashboard | Get detailed dashboard metrics |

## Data Model
Aggregated response from multiple tables: `organizations`, `tickets`, `projects`, `documents`, `approval_requests`, `profiles`

## Access Control
- Admin: full access (requireAdmin middleware)
- Client: no access (internal MSP operations only)
