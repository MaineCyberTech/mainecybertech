# Vendor SaaS Subscription Audit

## Purpose

Inventory every software-as-a-service subscription a client organization pays for, with cost, renewal, usage, and data-access intelligence. Records in `saas_audits` capture vendor, service, monthly/annual cost, payment method, classification, usage frequency, cancellation risk, and whether the app holds business data. This enables cost-reduction conversations and shadow-IT discovery.

Primary users: MSP account manager, security engineer, client admin

Business impact: Medium

Category: operations

## Permissions

Permission module key: `saas-audit` (view / create / edit / delete)

| Action                 | Roles                          |
| ---------------------- | ------------------------------ |
| List/view SaaS records | All authenticated org members  |
| Create SaaS record     | admin, super_admin, technician |
| Update SaaS record     | admin, super_admin, technician |
| Delete SaaS record     | admin, super_admin             |

## Routes

### Portal Routes

| Route                    | Description                                 |
| ------------------------ | ------------------------------------------- |
| `GET /portal/saas-audit` | List tracked SaaS subscriptions for the org |

### API Routes

| Method | Endpoint                       | Description                               |
| ------ | ------------------------------ | ----------------------------------------- |
| GET    | `/api/v1/final/saas-audit`     | List SaaS records (paginated, org-scoped) |
| POST   | `/api/v1/final/saas-audit`     | Create SaaS record                        |
| GET    | `/api/v1/final/saas-audit/:id` | Get single SaaS record                    |
| PATCH  | `/api/v1/final/saas-audit/:id` | Update SaaS record (full schema parse)    |
| DELETE | `/api/v1/final/saas-audit/:id` | Delete SaaS record                        |

## Data Model

### saas_audits

| Column            | Type          | Constraints                      | Description                              |
| ----------------- | ------------- | -------------------------------- | ---------------------------------------- |
| id                | uuid          | PK, default gen_random_uuid()    | Unique identifier                        |
| organization_id   | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                           |
| vendor_name       | text          | NOT NULL                         | Vendor / publisher name                  |
| service_name      | text          | NOT NULL                         | Service / product name                   |
| monthly_cost      | numeric(12,2) |                                  | Monthly spend                            |
| annual_cost       | numeric(12,2) |                                  | Annualized spend                         |
| payment_method    | text          |                                  | Credit card / invoice / procurement card |
| classification    | text          | NOT NULL, default 'unknown'      | unknown / business-critical / shadow IT  |
| usage_frequency   | text          |                                  | daily / weekly / monthly / rarely        |
| cancellation_risk | text          |                                  | low / medium / high                      |
| has_data_access   | boolean       | NOT NULL, default false          | App holds business data                  |
| renewal_date      | date          |                                  | Next renewal date                        |
| notes             | text          |                                  | Audit notes                              |
| created_by        | uuid          | FK → auth.users(id)              | Creator                                  |
| created_at        | timestamptz   | NOT NULL, default now()          | Creation timestamp                       |
| updated_at        | timestamptz   | NOT NULL, default now()          | Last update timestamp                    |

## Workflows

### Audit Collection

1. Enumerate SaaS from billing feeds, browser autofill, and finance interviews
2. Create one record per subscription: `vendor_name` + `service_name` required
3. Capture `monthly_cost` / `annual_cost` and `payment_method`
4. Classify each app and mark `has_data_access` for shadow-IT / data-governance risk

### Renewal Management

- `renewal_date` drives renewal reviews
- `cancellation_risk` flags apps whose loss would disrupt operations
- Cost roll-ups are computed from `monthly_cost` / `annual_cost` fields

### Data Access Governance

- `has_data_access = true` records require identity/access review
- High-risk apps with `cancellation_risk = high` and `has_data_access = true` prioritized for consolidation

## AI Review Rules

- AI may draft vendor consolidation recommendations and renewal negotiation summaries
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before use

## Troubleshooting

| Issue                            | Resolution                                                         |
| -------------------------------- | ------------------------------------------------------------------ |
| PATCH requires full body         | `final.ts` PATCH re-parses the full create schema; send all fields |
| List empty for valid org         | Verify `organization_id` matches active org; check RLS             |
| Classification default 'unknown' | Not set at creation; backfill via PATCH                            |
| Portal saas-audit empty          | No records for the org; create one via admin/API                   |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied (saas_audits table)
- [ ] Permission keys `saas-audit:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/final.ts` (saas-audit crud registration)
- [ ] Validator `saas` in `apps/api/src/validators/final.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/saas-audit/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/saas-audit.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/vendor-saas-subscription-audit.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
