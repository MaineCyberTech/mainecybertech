# Client Billing Service Catalog

## Purpose

Maintain the catalog of services offered to clients: name, description, category, billing model, unit, base price, included units, bundle membership, and visibility. Powers client-facing service listings and billing baselines.

Primary users: MSP account manager, billing admin, client sponsor

Business impact: High

Category: service_catalog

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List services       | All authenticated org members |
| View service        | All authenticated org members |
| Create service      | admin, super_admin            |
| Update service      | admin, super_admin            |
| Delete service      | admin, super_admin            |
| View pricing fields | All authenticated org members |

## Routes

### Portal Routes

| Route                         | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `GET /portal/service-catalog` | List services with pricing and bundle flags |

### API Routes

| Method | Endpoint                      | Description                                    |
| ------ | ----------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/service-catalog`     | List services (paginated, ordered by category) |
| GET    | `/api/v1/service-catalog/:id` | Get single service                             |
| POST   | `/api/v1/service-catalog`     | Create service                                 |
| PATCH  | `/api/v1/service-catalog/:id` | Update service                                 |
| DELETE | `/api/v1/service-catalog/:id` | Delete service                                 |

## Data Model

### service_catalog

| Column          | Type          | Constraints                      | Description                          |
| --------------- | ------------- | -------------------------------- | ------------------------------------ |
| id              | uuid          | PK, default gen_random_uuid()    | Unique identifier                    |
| organization_id | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                       |
| name            | text          | NOT NULL                         | Service name                         |
| description     | text          |                                  | Service description                  |
| category        | text          | default 'managed_services'       | Service category                     |
| billing_model   | text          | default 'monthly'                | Billing model (monthly, per user...) |
| unit            | text          | default 'per_user'               | Billing unit                         |
| base_price      | numeric(12,2) | default 0                        | Base price in USD                    |
| included_units  | integer       |                                  | Units included in base price         |
| overture_rate   | numeric(12,2) |                                  | Optional alternate rate              |
| is_bundled      | boolean       | default false                    | Whether part of a bundle             |
| bundle_id       | uuid          | FK → service_catalog(id)         | Parent bundle service                |
| is_active       | boolean       | default true                     | Whether the service is active        |
| status          | text          | NOT NULL, default 'active'       | Service status                       |
| visibility      | text          | NOT NULL, default 'internal'     | `internal` or `client_visible`       |
| created_by      | uuid          | FK → auth.users(id)              | Creator                              |
| metadata        | jsonb         | NOT NULL, default '{}'           | Extensible metadata                  |
| created_at      | timestamptz   | NOT NULL, default now()          | Creation timestamp                   |
| updated_at      | timestamptz   | NOT NULL, default now()          | Last update timestamp                |

## Workflows

### Catalog Management

1. Account manager adds services with category, billing model, unit, and `base_price`
2. Services can be bundled (`is_bundled`) and reference a parent `bundle_id`
3. `is_active` controls availability; inactive services show as `Inactive`
4. `visibility` determines whether a service is exposed to clients

### Client Display

- The portal lists `client_visible` and default-visible services for the org
- Each card shows category, billing model / unit, formatted base price, included units, bundle badge, and active state
- Prices are formatted as USD via `Intl.NumberFormat`

## AI Review Rules

- AI may draft service descriptions, bundle structures, and pricing guidance
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual catalog entries
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| Service card not shown   | Verify org has rows in `service_catalog`; check RLS policies           |
| Price shows $0.00        | Confirm `base_price` set on the service row                            |
| Bundled badge missing    | Confirm `is_bundled = true` and `bundle_id` references a valid service |
| Service shows Inactive   | Confirm `is_active` is true; update via PATCH if intended to be active |
| RLS policy denies access | Confirm user has an approved membership in the organization            |

## Release Checklist

- [ ] Migration `5302067_service_catalog.sql` applied
- [ ] API routes registered in `apps/api/src/routes/service-catalog.ts`
- [ ] Validators `createServiceSchema` / `updateServiceSchema` in `apps/api/src/validators/service-catalog.ts`
- [ ] SDK module `serviceCatalog` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/service-catalog/`
- [ ] Unit tests pass: `pnpm --filter=api test service-catalog`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/service-catalog.spec.ts`
- [ ] Feature doc added to `docs/features/client-billing-service-catalog.md`
- [ ] Runbook added to `docs/runbooks/client-billing-service-catalog.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
