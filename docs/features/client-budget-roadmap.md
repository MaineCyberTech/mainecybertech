# Client Budget Roadmap

## Purpose

Forward-looking IT budget planning for client organizations. Budget items capture planned purchases, estimated costs, fiscal year/quarter allocation, and priority so the MSP and client can align on a roadmap before money is committed.

Primary users: client administrator, MSP account manager, admin

Business impact: High

Category: final

## Permissions

| Action             | Roles                         |
| ------------------ | ----------------------------- |
| List budget items  | All authenticated org members |
| View budget item   | All authenticated org members |
| Create budget item | admin, super_admin            |
| Update budget item | admin, super_admin            |
| Delete budget item | admin, super_admin            |

## Routes

### Portal Routes

| Route                 | Description                       |
| --------------------- | --------------------------------- |
| `GET /portal/budgets` | List budget items for current org |

### API Routes

| Method | Endpoint                         | Description                              |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/final/budgets`          | List budget items (paginated)            |
| GET    | `/api/v1/final/budgets/:id`      | Get a single budget item                 |
| POST   | `/api/v1/final/budgets`          | Create a budget item                     |
| PATCH  | `/api/v1/final/budgets/:id`      | Update a budget item                     |
| DELETE | `/api/v1/final/budgets/:id`      | Delete a budget item                     |
| GET    | `/api/v1/final/budgets/analysis` | Projected vs actual variance by category |

## Data Model

### budget_roadmaps

| Column          | Type          | Constraints                      | Description                        |
| --------------- | ------------- | -------------------------------- | ---------------------------------- |
| id              | uuid          | PK, default gen_random_uuid()    | Unique identifier                  |
| organization_id | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                     |
| item_name       | text          | NOT NULL                         | Budget item name                   |
| category        | text          | default 'hardware'               | hardware / software / services etc |
| estimated_cost  | numeric(12,2) |                                  | Planned cost in USD                |
| fiscal_year     | integer       |                                  | Target fiscal year                 |
| quarter         | integer       |                                  | Target quarter (1-4)               |
| priority        | text          | default 'medium'                 | low / medium / high / critical     |
| status          | text          | NOT NULL, default 'planned'      | planned / approved / purchased     |
| notes           | text          |                                  | Planning notes                     |
| created_by      | uuid          | FK → auth.users(id)              | Author                             |
| created_at      | timestamptz   | NOT NULL, default now()          | Creation timestamp                 |
| updated_at      | timestamptz   | NOT NULL, default now()          | Last update timestamp              |

## Workflows

### Roadmap Planning

1. MSP and client identify planned IT investments and capture them as budget items
2. Items are prioritized (`priority` badge) and allocated to `fiscal_year`/`quarter`
3. `GET /budgets/analysis` compares projected vs actual spend by category and reports variance
4. Portal displays each item with category, estimated cost, FY/quarter, and priority badge

### Portal Display

- Budget items scoped to the approved membership org
- Priority badges: `high`/`critical` → red, `medium` → amber, other → slate
- Empty state renders "No budget items found."

## Troubleshooting

| Issue                    | Resolution                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| Budget list empty        | Verify org has budget items and `organization_id` is passed         |
| Analysis variance wrong  | Analysis reads `estimated_cost` (projected) vs actual spend columns |
| Priority badge wrong     | `priority` must be low/medium/high/critical                         |
| RLS policy denies access | Confirm user has an approved membership in the organization         |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied (`budget_roadmaps` table)
- [ ] API routes registered in `apps/api/src/routes/final.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`final.budgets`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/budgets/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/budgets.spec.ts`
- [ ] Feature doc added to `docs/features/client-budget-roadmap.md`
- [ ] Runbook added to `docs/runbooks/client-budget-roadmap.md`
