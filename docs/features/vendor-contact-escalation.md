# Vendor Contact Escalation

## Purpose

Centralize vendor support contacts and escalation paths. Each contact records vendor, role, email, phone, support portal, account number, and escalation path so technicians can reach the right person quickly during incidents and renewals.

Primary users: service desk technician, procurement lead, client admin

Business impact: High

Category: operations

## Permissions

| Action              | Roles                          |
| ------------------- | ------------------------------ |
| List contacts       | All authenticated org members  |
| View contact detail | All authenticated org members  |
| Create contact      | admin, super_admin, technician |
| Update contact      | admin, super_admin, technician |
| Delete contact      | admin, super_admin             |

## Routes

### Portal Routes

| Route                         | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `GET /portal/vendor-contacts` | List vendor contacts for current organization |

### API Routes

| Method | Endpoint                              | Description                           |
| ------ | ------------------------------------- | ------------------------------------- |
| GET    | `/api/v1/vendors/vendor-contacts`     | List contacts (paginated, filterable) |
| GET    | `/api/v1/vendors/vendor-contacts/:id` | Get single contact                    |
| POST   | `/api/v1/vendors/vendor-contacts`     | Create contact                        |
| PATCH  | `/api/v1/vendors/vendor-contacts/:id` | Update contact                        |
| DELETE | `/api/v1/vendors/vendor-contacts/:id` | Delete contact                        |

## Data Model

### vendor_contacts

| Column             | Type        | Constraints                      | Description                 |
| ------------------ | ----------- | -------------------------------- | --------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier           |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping              |
| vendor_name        | text        | NOT NULL                         | Vendor name                 |
| contact_name       | text        |                                  | Contact person              |
| role_title         | text        |                                  | Role title                  |
| email              | text        |                                  | Contact email               |
| phone              | text        |                                  | Contact phone               |
| support_portal_url | text        |                                  | Support portal link         |
| account_number     | text        |                                  | Vendor account number       |
| escalation_path    | text        |                                  | Escalation path description |
| notes              | text        |                                  | Notes                       |
| is_primary         | boolean     | NOT NULL, default false          | Primary contact flag        |
| status             | text        | NOT NULL, default 'active'       | active/inactive             |
| created_by         | uuid        | FK → auth.users(id)              | Record author               |
| created_at         | timestamptz | NOT NULL, default now()          | Creation timestamp          |
| updated_at         | timestamptz | NOT NULL, default now()          | Last update timestamp       |

## Workflows

### Add a Contact

1. Technician adds a vendor contact with vendor name, contact details, and support portal
2. `POST /api/v1/vendors/vendor-contacts` saves the contact with status `active`
3. Contact appears in the portal vendor contacts list; primary contacts are badged

### Escalation

- `escalation_path` documents the steps to escalate to higher support tiers
- Primary flag marks the go-to contact for an incident
- During incidents, technicians open the support portal link or call the recorded phone

## AI Review Rules

- AI may draft escalation paths and outreach templates
- All AI outputs are stored for human review
- Contact accuracy must be verified manually

## Troubleshooting

| Issue                    | Resolution                                          |
| ------------------------ | --------------------------------------------------- |
| Contact list empty       | No contacts recorded for the org                    |
| Vendor name missing      | `vendor_name` is not null; verify the stored record |
| Support portal broken    | Confirm `support_portal_url` is a valid https URL   |
| Delete denied            | Only admin/super_admin can delete contacts          |
| RLS policy denies access | Confirm user has membership in the organization     |

## Release Checklist

- [ ] Migration `5302066_vendor_contracts_contacts.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/vendors.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/vendor-contacts/`
- [ ] Unit tests pass: `pnpm --filter=api test vendors`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/vendor-contacts.spec.ts`
- [ ] Feature doc added to `docs/features/vendor-contact-escalation.md`
- [ ] Runbook added to `docs/runbooks/vendor-contact-escalation.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
