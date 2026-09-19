# License Optimizer

**Category:** Tools
**API Routes:** `apps/api/src/routes/license-optimizer.ts`
**SDK:** `packages/sdk/src/license-optimizer.ts`

## Overview

License optimization module providing cost analysis and underutilization detection across M365 and software license allocations. Identifies reclaimable seats where utilization falls below 70%, calculates potential cost savings, and tracks allocation history over time. Designed for MSPs to help clients right-size their license spend.

## Key Features

- Full CRUD management of license allocations per user per license type
- Underutilization detection flagging seats with usage below 70% threshold
- Reclaimable license list for quick identification of cost-saving opportunities
- Summary dashboard showing total monthly cost, average utilization percentage, and potential savings
- Historical tracking with assignment date and last used date per allocation
- License type categorization (M365 E3, E5, Business Premium, Business Basic, etc.)
- Status tracking (active, underutilized, reclaimed, pending)
- Monthly cost field for accurate savings calculation
- Search by user, license type, and status
- Paginated listing with sorting by cost, utilization, or assignment date
- Audit logging on all mutation operations
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                                               | Description                                                            |
| ------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| GET    | /api/v1/license-optimizer                          | List allocations (paginated, filterable by user, license type, status) |
| GET    | /api/v1/license-optimizer/:id                      | Get single allocation record with full details                         |
| POST   | /api/v1/license-optimizer                          | Create new license allocation for a user                               |
| PATCH  | /api/v1/license-optimizer/:id                      | Update allocation (user, license type, utilization %, cost)            |
| DELETE | /api/v1/license-optimizer/:id                      | Remove allocation record                                               |
| GET    | /api/v1/license-optimizer/reclaimable/license-list | List underutilized seats where utilization < 70%                       |
| GET    | /api/v1/license-optimizer/summary/data             | Aggregate summary: total cost, avg utilization, potential savings      |

## Data Model

Key fields: `license_allocations` (organization_id, user_id, license_type, utilization_percent, monthly_cost, assigned_date, last_used_date, status) — underutilized is a computed flag when utilization_percent < 70

## Access Control

- Admin: full CRUD, reclaimable list, summary dashboard across all users in org
- Client: view-only on own allocations (portal)
