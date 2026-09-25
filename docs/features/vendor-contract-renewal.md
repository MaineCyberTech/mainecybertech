# Vendor Contract Renewal

## Purpose

Vendor contract and contact management with renewal tracking. Contracts track renewal dates, values, billing frequency, and auto-renewal flags. The renewal calendar surfaces contracts expiring within 90 days so renewals are never missed. A companion vendor contacts directory maintains escalation paths and primary contacts.

Primary users: MSP client administrator, vendor coordinator, admin

Business impact: High

Category: vendors

## Permissions

| Action                       | Roles                         |
| ---------------------------- | ----------------------------- |
| List contracts               | All authenticated org members |
| View contract                | All authenticated org members |
| Create contract              | admin, super_admin            |
| Update contract              | admin, super_admin            |
| Delete contract              | admin, super_admin            |
| List contacts                | All authenticated org members |
| Create/update/delete contact | admin, super_admin            |

## Routes

### Portal Routes

| Route                          | Description                           |
| ------------------------------ | ------------------------------------- |
| `GET /portal/vendor-contracts` | List vendor contracts for current org |
| `GET /portal/vendor-contacts`  | List vendor contacts for current org  |

### API Routes

| Method | Endpoint                                    | Description                                |
| ------ | ------------------------------------------- | ------------------------------------------ |
| GET    | `/api/v1/vendors/vendor-contracts`          | List contracts (paginated, searchable)     |
| GET    | `/api/v1/vendors/vendor-contracts/:id`      | Get a single contract                      |
| POST   | `/api/v1/vendors/vendor-contracts`          | Create a contract                          |
| PATCH  | `/api/v1/vendors/vendor-contracts/:id`      | Update a contract                          |
| DELETE | `/api/v1/vendors/vendor-contracts/:id`      | Delete a contract                          |
| GET    | `/api/v1/vendors/vendor-contracts/renewals` | Contracts renewing within the next 90 days |
| GET    | `/api/v1/vendors/vendor-contacts`           | List contacts (paginated, searchable)      |
| GET    | `/api/v1/vendors/vendor-contacts/:id`       | Get a single contact                       |
| POST   | `/api/v1/vendors/vendor-contacts`           | Create a contact                           |
| PATCH  | `/api/v1/vendors/vendor-contacts/:id`       | Update a contact                           |
| DELETE | `/api/v1/vendors/vendor-contacts/:id`       | Delete a contact                           |

## Data Model

### vendor_contracts

| Column              | Type          | Constraints                      | Description                      |
| ------------------- | ------------- | -------------------------------- | -------------------------------- |
| id                  | uuid          | PK, default gen_random_uuid()    | Unique identifier                |
| organization_id     | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                   |
| vendor_name         | text          | NOT NULL                         | Vendor display name              |
| service_name        | text          | NOT NULL                         | Service provided                 |
| contract_number     | text          |                                  | Vendor contract reference        |
| start_date          | date          |                                  | Contract start date              |
| end_date            | date          |                                  | Contract end date                |
| renewal_date        | date          |                                  | Next renewal date                |
| contract_value      | numeric(12,2) |                                  | Contract value in USD            |
| billing_frequency   | text          | default 'annual'                 | annual / monthly / quarterly etc |
| auto_renews         | boolean       | default false                    | Whether renewal is automatic     |
| renewal_notice_days | integer       | default 60                       | Days notice before renewal       |
| status              | text          | NOT NULL, default 'active'       | active / expiring_soon / expired |
| contract_type       | text          | default 'software'               | software / hardware / services   |
| primary_contact_id  | uuid          | FK → auth.users(id)              | Internal primary contact         |
| owner_user_id       | uuid          | FK → auth.users(id)              | MSP owner of the contract        |
| notes               | text          |                                  | Free-form notes                  |
| visibility          | text          | NOT NULL, default 'internal'     | internal / client                |
| created_by          | uuid          | FK → auth.users(id)              | Author                           |
| created_at          | timestamptz   | NOT NULL, default now()          | Creation timestamp               |
| updated_at          | timestamptz   | NOT NULL, default now()          | Last update timestamp            |

### vendor_contacts

| Column             | Type        | Constraints                      | Description                |
| ------------------ | ----------- | -------------------------------- | -------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier          |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping             |
| vendor_name        | text        | NOT NULL                         | Vendor display name        |
| contact_name       | text        |                                  | Contact person name        |
| role_title         | text        |                                  | Contact role               |
| email              | text        |                                  | Contact email              |
| phone              | text        |                                  | Contact phone              |
| support_portal_url | text        |                                  | Vendor support portal link |
| account_number     | text        |                                  | Vendor account reference   |
| escalation_path    | text        |                                  | Escalation procedure       |
| notes              | text        |                                  | Free-form notes            |
| is_primary         | boolean     | default false                    | Primary contact flag       |
| status             | text        | NOT NULL, default 'active'       | active / inactive          |
| created_by         | uuid        | FK → auth.users(id)              | Author                     |
| created_at         | timestamptz | NOT NULL, default now()          | Creation timestamp         |
| updated_at         | timestamptz | NOT NULL, default now()          | Last update timestamp      |

## Workflows

### Renewal Tracking

1. Contracts store `renewal_date`, `renewal_notice_days`, and `auto_renews`
2. `GET /vendor-contracts/renewals` returns active contracts with `renewal_date` within the next 90 days, ordered by soonest renewal
3. Portal badges classify contracts as `Active`, `Expiring Soon`, or `Expired` from the `status` field
4. Contracts display `renewal_date`, `contract_value`, and an `Auto-renews` tag when applicable

### Contact Escalation

- Vendor contacts list displays primary contacts with an amber `Primary` badge
- `support_portal_url` renders as an external "Open Link" for self-service support

## Troubleshooting

| Issue                    | Resolution                                                    |
| ------------------------ | ------------------------------------------------------------- |
| Renewal list empty       | No active contracts with a `renewal_date` in the next 90 days |
| Status badge wrong       | `status` value must be `active` / `expiring_soon` / `expired` |
| Search returns nothing   | Search runs against `vendor_name` via `ilike`                 |
| RLS policy denies access | Confirm user has an approved membership in the organization   |

## Release Checklist

- [ ] Migration `5302066_vendor_contracts_contacts.sql` applied
- [ ] API routes registered in `apps/api/src/routes/vendors.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`vendors.contracts`, `vendors.contacts`)
- [ ] Portal pages created in `apps/web/app/(portal)/portal/vendor-contracts/` and `vendor-contacts/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/vendor-contracts.spec.ts`
- [ ] Feature doc added to `docs/features/vendor-contract-renewal.md`
- [ ] Runbook added to `docs/runbooks/vendor-contract-renewal.md`
