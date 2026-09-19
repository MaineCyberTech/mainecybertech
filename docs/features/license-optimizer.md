# License Optimizer

## Purpose

Track software license allocations, seat utilization, cost per seat, and billing cycle to surface reclaimable licenses and quantify potential savings. Clients see a utilization dashboard; administrators maintain the license inventory.

Primary users: MSP account manager, client admin, finance

Business impact: Medium

Category: operations

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| List license allocations | All authenticated org members |
| View license detail      | All authenticated org members |
| Create allocation        | All authenticated org members |
| Update allocation        | All authenticated org members |
| Delete allocation        | admin, super_admin            |

## Routes

### Portal Routes

| Route                           | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `GET /portal/license-optimizer` | License utilization dashboard for organization |

### Admin Routes

| Route                          | Description                       |
| ------------------------------ | --------------------------------- |
| `GET /admin/license-optimizer` | License inventory management page |

### API Routes

| Method | Endpoint                                             | Description                       |
| ------ | ---------------------------------------------------- | --------------------------------- |
| GET    | `/api/v1/license-optimizer`                          | List allocations (paginated)      |
| GET    | `/api/v1/license-optimizer/:id`                      | Get a single allocation           |
| POST   | `/api/v1/license-optimizer`                          | Create allocation                 |
| PATCH  | `/api/v1/license-optimizer/:id`                      | Update allocation                 |
| DELETE | `/api/v1/license-optimizer/:id`                      | Delete allocation                 |
| GET    | `/api/v1/license-optimizer/reclaimable/license-list` | Reclaimable licenses + savings    |
| GET    | `/api/v1/license-optimizer/summary/data`             | Totals, cost, utilization summary |

## Data Model

### license_allocations

| Column          | Type          | Constraints                      | Description                   |
| --------------- | ------------- | -------------------------------- | ----------------------------- |
| id              | uuid          | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                |
| software_name   | text          | NOT NULL                         | Product name                  |
| license_type    | text          | NOT NULL, default 'per_seat'     | per_seat / concurrent / other |
| total_seats     | integer       | NOT NULL, default 1              | Licensed seats                |
| used_seats      | integer       | default 0                        | Seats in use                  |
| cost_per_seat   | numeric(10,2) |                                  | Cost of each seat             |
| billing_cycle   | text          | default 'monthly'                | monthly / annual / one-time   |
| last_audit_date | timestamptz   |                                  | Last audit                    |
| status          | text          | default 'active'                 | active / inactive             |
| notes           | text          |                                  | Free-form notes               |
| created_by      | uuid          | FK → auth.users(id)              | Who added the record          |
| created_at      | timestamptz   | default now()                    | Creation timestamp            |
| updated_at      | timestamptz   | default now()                    | Last update timestamp         |

## Workflows

### Utilization Review

- The portal page renders each allocation with a utilization bar (`used/total`) and a status color (red < 50%, amber < 80%, green ≥ 80%)
- `GET /reclaimable/license-list` flags allocations below 70% utilization and computes potential savings
- `GET /summary/data` returns total licenses, total cost, average utilization, and total potential savings

### Inventory Management (admin)

1. Add/update allocations with seat counts and cost per seat
2. Run a periodic audit (`last_audit_date`) and adjust used seats
3. Review the reclaimable list before renewal cycles
4. Deletions are restricted to `admin`/`super_admin` roles

## Troubleshooting

| Issue                           | Resolution                                               |
| ------------------------------- | -------------------------------------------------------- |
| Utilization percent looks wrong | Verify `used_seats` and `total_seats` are populated      |
| Potential savings always zero   | Ensure `cost_per_seat` is set on active allocations      |
| List empty                      | Check `organization_id` query param and RLS membership   |
| Delete denied (403)             | Current membership role must be `admin` or `super_admin` |

## Release Checklist

- [ ] Migration `5302088_license_optimizer.sql` applied
- [ ] API routes registered at `/api/v1/license-optimizer` in `apps/api/src/app.ts`
- [ ] SDK module `licenseOptimizer` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/license-optimizer/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/license-optimizer.spec.ts`
- [ ] Feature doc added to `docs/features/license-optimizer.md`
- [ ] Runbook added to `docs/runbooks/license-optimizer.md`
