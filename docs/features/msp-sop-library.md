# MSP SOP Library

## Purpose

Central library of Standard Operating Procedures for the MSP's managed client operations. Each SOP tracks a category, version, review cycle, and optional compliance framework mapping (NIST 800-53, ISO 27001, CIS Controls, HIPAA, CMMC, PCI DSS, SOC 2). Dedicated analytics endpoints report compliance coverage and framework gaps per organization.

Primary users: MSP engineers, technicians, client admins

Business impact: High

Category: operations

## Permissions

Permission module key: `sop-library` (view / create / edit / delete)

| Action                   | Roles                          |
| ------------------------ | ------------------------------ |
| List/view SOPs           | All authenticated org members  |
| Create SOP               | admin, super_admin, technician |
| Update SOP               | admin, super_admin, technician |
| Delete SOP               | admin, super_admin             |
| View compliance map/gaps | admin, super_admin             |

## Routes

### Portal Routes

| Route                     | Description                    |
| ------------------------- | ------------------------------ |
| `GET /portal/sop-library` | List SOPs for the organization |

### API Routes

| Method                | Endpoint                                        | Description                                 |
| --------------------- | ----------------------------------------------- | ------------------------------------------- |
| GET                   | `/api/v1/governance/sop-library`                | List SOPs (paginated, org-scoped)           |
| POST                  | `/api/v1/governance/sop-library`                | Create SOP                                  |
| GET                   | `/api/v1/governance/sop-library/:id`            | Get single SOP                              |
| PATCH                 | `/api/v1/governance/sop-library/:id`            | Update SOP (validated by updateSopSchema)   |
| DELETE                | `/api/v1/governance/sop-library/:id`            | Delete SOP                                  |
| GET                   | `/api/v1/governance/sop-library/compliance-map` | SOP counts + control IDs by framework       |
| GET                   | `/api/v1/governance/sop-library/framework-gaps` | Per-framework coverage % + overall score    |
| GET/POST/PATCH/DELETE | `/api/v1/edu-automation/sop` (+ `/:id`)         | Parallel SOP CRUD via edu-automation router |

## Data Model

### sop_library

Table created in migration `5302073_edu_automation.sql` (columns confirmed by seed data in 5302120/5302123).

| Column           | Type        | Constraints                      | Description                            |
| ---------------- | ----------- | -------------------------------- | -------------------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                         |
| title            | text        | NOT NULL                         | SOP title                              |
| sop_number       | text        |                                  | Internal SOP reference number          |
| category         | text        |                                  | SOP category                           |
| version          | text        | NOT NULL, default '1.0'          | SOP version                            |
| framework        | text[]      |                                  | Compliance frameworks this SOP maps to |
| content          | text        |                                  | Full SOP body                          |
| status           | text        | NOT NULL, default 'draft'        | draft / active / retired               |
| last_reviewed_at | timestamptz |                                  | Last review timestamp                  |
| next_review_at   | timestamptz |                                  | Due review timestamp                   |
| created_by       | uuid        | FK → auth.users(id)              | Creator                                |
| created_at       | timestamptz | NOT NULL, default now()          | Creation timestamp                     |
| updated_at       | timestamptz | NOT NULL, default now()          | Last update timestamp                  |

The governance API additionally accepts the compliance-oriented field set (`description`, `sopCategory`, `complianceFramework`, `frameworkControlIds`, `reviewCycleDays`, `ownerUserId`, `documentUrl`, `tags`) as defined by migration `5302086_sop_library_compliance.sql`, and the compliance analytics endpoints read `compliance_framework` / `framework_control_ids`.

## Workflows

### Create SOP

1. Record `title`, `sop_number`, `category`, and `content`
2. Attach compliance frameworks via `framework` and (where present) `framework_control_ids`
3. New SOPs default to `status = 'draft'`

### Review Cycle

- `next_review_at` / `last_reviewed_at` track the review cadence
- Admin lists flag SOPs past `next_review_at` for refresh
- PATCH updates `status`, `version`, and review timestamps

### Compliance Analytics

- `GET /sop-library/compliance-map` groups SOPs by `compliance_framework` and reports active/draft counts plus unique control IDs
- `GET /sop-library/framework-gaps` computes per-framework coverage percentage (control IDs vs a 20-control baseline) and an overall compliance average across NIST 800-53, ISO 27001, CIS Controls, HIPAA, CMMC, PCI DSS, SOC 2

## AI Review Rules

- AI may draft or refresh SOP content; outputs stored in `ai_draft_outputs` with `status = 'draft'`
- Human review required before promoting; store `prompt_key`/`prompt_version` for traceability

## Troubleshooting

| Issue                         | Resolution                                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| Compliance map empty          | Confirm SOPs have `compliance_framework` set (uncategorized bucket) |
| PATCH rejects optional fields | updateSopSchema validates types; send only fields being changed     |
| List empty for valid org      | Verify `organization_id` matches active org; check RLS              |
| Framework coverage 0%         | SOP must be `status = 'active'` with control IDs mapped             |

## Release Checklist

- [ ] Migration `5302073_edu_automation.sql` applied (sop_library + RLS)
- [ ] Migration `5302086_sop_library_compliance.sql` applied (compliance schema)
- [ ] Permission keys `sop-library:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/governance.ts` (sop-library CRUD + compliance-map + framework-gaps)
- [ ] API routes in `apps/api/src/routes/edu-automation.ts` (sop CRUD)
- [ ] Validators in `apps/api/src/validators/governance.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/sop-library/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/sop-library.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/msp-sop-library.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
