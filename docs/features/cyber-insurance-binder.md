# Cyber Insurance Binder

## Purpose

Collect and verify evidence documents required for cyber insurance underwriting and renewals. Each evidence item maps to a coverage area (network security, endpoint protection, access control, data backup, incident response, employee training, vendor management, compliance), with status and expiry tracking so gaps are visible before renewal.

Primary users: MSP compliance consultant, client admin, risk manager

Business impact: High

Category: governance

## Permissions

| Action               | Roles                         |
| -------------------- | ----------------------------- |
| List evidence        | All authenticated org members |
| View evidence        | All authenticated org members |
| View coverage report | All authenticated org members |
| Create evidence      | All authenticated org members |
| Update / verify      | All authenticated org members |
| Delete evidence      | admin, super_admin            |

## Routes

### Portal Routes

| Route                          | Description                             |
| ------------------------------ | --------------------------------------- |
| `GET /portal/insurance-binder` | Insurance evidence list for current org |

### Admin Routes

| Route                         | Description                    |
| ----------------------------- | ------------------------------ |
| `GET /admin/insurance-binder` | Insurance Evidence Binder page |

### API Routes

| Method | Endpoint                                   | Description                             |
| ------ | ------------------------------------------ | --------------------------------------- |
| GET    | `/api/v1/insurance-binder`                 | List evidence (filter by coverage_area) |
| GET    | `/api/v1/insurance-binder/coverage-report` | Per-area coverage completeness          |
| POST   | `/api/v1/insurance-binder`                 | Create evidence item                    |
| GET    | `/api/v1/insurance-binder/:id`             | Get a single evidence item              |
| PATCH  | `/api/v1/insurance-binder/:id`             | Update/verify evidence                  |
| DELETE | `/api/v1/insurance-binder/:id`             | Delete evidence                         |

## Data Model

### insurance_evidence

| Column             | Type        | Constraints                      | Description                   |
| ------------------ | ----------- | -------------------------------- | ----------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier             |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                |
| evidence_type      | text        | NOT NULL, default 'document'     | document / certificate / scan |
| title              | text        | NOT NULL                         | Evidence display name         |
| description        | text        |                                  | Notes on the evidence         |
| file_url           | text        |                                  | Link to stored document       |
| status             | text        | default 'pending'                | pending / verified / expired  |
| coverage_area      | text        |                                  | One of the 8 coverage areas   |
| insurance_provider | text        |                                  | Provider name                 |
| policy_number      | text        |                                  | Policy identifier             |
| expiry_date        | date        |                                  | When the evidence expires     |
| last_verified_at   | timestamptz |                                  | When evidence was verified    |
| created_by         | uuid        | FK → auth.users(id)              | Who created the item          |
| created_at         | timestamptz | default now()                    | Creation timestamp            |
| updated_at         | timestamptz | default now()                    | Last update timestamp         |

## Workflows

### Evidence Collection

1. Admin creates evidence items per coverage area with provider, policy number, and expiry
2. The portal lists items with a status badge (verified green, pending amber, expired red) and expiry date
3. `PATCH` with `status: "verified"` automatically stamps `last_verified_at`

### Coverage Report

- `GET /coverage-report` maps the 8 coverage areas to present evidence and returns total evidence, completeness %, and per-area pending/verified counts
- Gaps surfaced before renewal drive collection effort

## Troubleshooting

| Issue                           | Resolution                                                   |
| ------------------------------- | ------------------------------------------------------------ |
| Expired items not flagged       | Verify `expiry_date` is set and status updated               |
| Coverage report shows gaps      | No evidence exists for that `coverage_area` yet              |
| Verified item missing timestamp | Set `status: "verified"` via the API to auto-stamp the field |
| Delete denied (403)             | Membership role must be `admin` or `super_admin`             |

## Release Checklist

- [ ] Migration `5302091_insurance_binder.sql` applied
- [ ] API routes registered at `/api/v1/insurance-binder` in `apps/api/src/app.ts`
- [ ] SDK module `insuranceBinder` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/insurance-binder/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/insurance-binder.spec.ts`
- [ ] Feature doc added to `docs/features/cyber-insurance-binder.md`
- [ ] Runbook added to `docs/runbooks/cyber-insurance-binder.md`
