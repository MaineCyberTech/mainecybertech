# Procurement Quote Comparison

## Purpose

Track hardware and service procurement quotes from multiple vendors, compare them side by side, and drive purchasing decisions. Stores each quote's amount and competitor pricing so the lowest-cost option and savings percentages are computed automatically.

Primary users: MSP procurement lead, technician, client admin

Business impact: Medium

Category: operations

## Permissions

| Action            | Roles                         |
| ----------------- | ----------------------------- |
| List quotes       | All authenticated org members |
| View quote detail | All authenticated org members |
| Create quote      | All authenticated org members |
| Update quote      | All authenticated org members |
| Delete quote      | admin, super_admin            |
| Compare quotes    | All authenticated org members |

## Routes

### Portal Routes

| Route                     | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `GET /portal/procurement` | List procurement quotes for current organization |

### API Routes

| Method | Endpoint                            | Description                             |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/api/v1/final/procurement`         | List quotes (paginated)                 |
| GET    | `/api/v1/final/procurement/:id`     | Get single quote                        |
| POST   | `/api/v1/final/procurement`         | Create quote                            |
| PATCH  | `/api/v1/final/procurement/:id`     | Update quote                            |
| DELETE | `/api/v1/final/procurement/:id`     | Delete quote                            |
| POST   | `/api/v1/final/procurement/compare` | Compare 2-10 quotes and compute savings |

## Data Model

### procurement_quotes

| Column           | Type          | Constraints                      | Description                 |
| ---------------- | ------------- | -------------------------------- | --------------------------- |
| id               | uuid          | PK, default gen_random_uuid()    | Unique identifier           |
| organization_id  | uuid          | FK → organizations(id), NOT NULL | Tenant scoping              |
| vendor_name      | text          | NOT NULL                         | Vendor name                 |
| product          | text          | NOT NULL                         | Product or service          |
| quote_amount     | numeric(12,2) |                                  | Vendor's quoted price       |
| competitor_quote | numeric(12,2) |                                  | Competitor price reference  |
| comparison_notes | text          |                                  | Notes comparing options     |
| selected         | boolean       | NOT NULL, default false          | Quote selected for purchase |
| purchased_at     | timestamptz   |                                  | Purchase timestamp          |
| notes            | text          |                                  | General notes               |
| created_by       | uuid          | FK → auth.users(id)              | Quote author                |
| created_at       | timestamptz   | NOT NULL, default now()          | Creation timestamp          |
| updated_at       | timestamptz   | NOT NULL, default now()          | Last update timestamp       |

## Workflows

### Record Quotes

1. Procurement team collects quotes from vendors for a product
2. `POST /api/v1/final/procurement` stores vendor, product, quote amount, and competitor reference
3. Quotes appear in the portal procurement list with total and status

### Compare Quotes

1. `POST /api/v1/final/procurement/compare` accepts 2-10 quote IDs
2. The endpoint computes lowest/highest price, average, per-quote savings percentage, and flags the lowest-cost option
3. Teams use the comparison to select a vendor and mark the quote `selected`

## AI Review Rules

- AI may draft comparison notes and negotiation summaries
- All AI outputs require human review before purchase decisions
- Price computations are deterministic server-side logic

## Troubleshooting

| Issue                    | Resolution                                                   |
| ------------------------ | ------------------------------------------------------------ |
| Quote list empty         | No quotes recorded for the org                               |
| Compare requires 2+      | Pass at least 2 quote IDs (max 10) to the compare endpoint   |
| Total shows 0            | `quote_amount` is null or 0; verify the stored numeric value |
| Delete denied            | Only admin/super_admin can delete quotes                     |
| RLS policy denies access | Confirm user has membership in the organization              |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/final.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/procurement/`
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/procurement.spec.ts`
- [ ] Feature doc added to `docs/features/procurement-quote-comparison.md`
- [ ] Runbook added to `docs/runbooks/procurement-quote-comparison.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
