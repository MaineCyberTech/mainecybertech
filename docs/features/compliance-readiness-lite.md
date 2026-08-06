# Compliance Readiness Lite

## Purpose

Lightweight compliance readiness tracking for client frameworks. Tracks per-control compliance status, evidence collection, assessment dates, and an overall readiness score without the overhead of a full GRC platform.

Primary users: MSP compliance analyst, client security contact, audit lead

Business impact: High

Category: compliance

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| List compliance records  | All authenticated org members |
| View compliance record   | All authenticated org members |
| Create compliance record | admin, super_admin            |
| Update compliance record | admin, super_admin            |
| Delete compliance record | admin, super_admin            |
| Score assessment         | admin, super_admin            |

## Routes

### Portal Routes

| Route                              | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `GET /portal/compliance-readiness` | List frameworks + readiness for current org |

### Admin Routes

| Route                                      | Description            |
| ------------------------------------------ | ---------------------- |
| `GET /admin/edu-automation/compliance`     | Framework/control list |
| `GET /admin/edu-automation/compliance/:id` | Control detail/edit    |

### API Routes

| Method | Endpoint                                  | Description                           |
| ------ | ----------------------------------------- | ------------------------------------- |
| GET    | `/api/v1/edu-automation/compliance`       | List records (paginated, org-scoped)  |
| GET    | `/api/v1/edu-automation/compliance/:id`   | Get single record                     |
| POST   | `/api/v1/edu-automation/compliance`       | Create record                         |
| PATCH  | `/api/v1/edu-automation/compliance/:id`   | Update record                         |
| DELETE | `/api/v1/edu-automation/compliance/:id`   | Delete record                         |
| POST   | `/api/v1/edu-automation/compliance/score` | Score an assessment and insert result |

## Data Model

### compliance_readiness

| Column              | Type        | Constraints                      | Description                                            |
| ------------------- | ----------- | -------------------------------- | ------------------------------------------------------ |
| id                  | uuid        | PK, default gen_random_uuid()    | Unique identifier                                      |
| organization_id     | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                         |
| framework           | text        | NOT NULL                         | Compliance framework (e.g. CMMC)                       |
| control_id          | text        |                                  | Control identifier                                     |
| control_description | text        |                                  | Control description                                    |
| is_compliant        | boolean     | default false                    | Compliance state                                       |
| evidence_collected  | boolean     | default false                    | Evidence gathered                                      |
| notes               | text        |                                  | Analyst notes                                          |
| assessed_at         | timestamptz |                                  | Last assessment timestamp                              |
| status              | text        | NOT NULL, default 'in_progress'  | in_progress / compliant / non_compliant / needs_review |
| created_by          | uuid        | FK → auth.users(id)              | Creator                                                |
| created_at          | timestamptz | NOT NULL, default now()          | Creation timestamp                                     |
| updated_at          | timestamptz | NOT NULL, default now()          | Last update timestamp                                  |

## Workflows

### Assessment Scoring

- `POST /compliance/score` accepts `organizationId`, `framework`, and an array of `{ questionId, passed }` responses
- API computes `passed / total * 100`, inserts a row with `score`, `total_questions`, `passed_questions`, and `assessed_at`, and stamps `created_by`
- The portal displays the score percentage (via `score`/`readiness_pct` fields) and last assessment date

### Evidence Collection

- Each control tracks `evidence_collected` and `is_compliant` independently so partial readiness is visible

## AI Review Rules

- AI may draft control interpretations and evidence guidance
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying changes

## Troubleshooting

| Issue                  | Resolution                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| List empty             | Verify org has records; check RLS policy                           |
| Score shows N/A        | Confirm `score`/`readiness_pct` populated after scoring            |
| Scoring endpoint error | Validate request body matches the schema (questionId/passed array) |

## Release Checklist

- [ ] Table from migration `5302073_edu_automation.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/compliance-readiness/`
- [ ] Unit tests pass: `pnpm --filter=api test edu-automation`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/compliance-readiness.spec.ts`
- [ ] Feature doc added to `docs/features/compliance-readiness-lite.md`
- [ ] Runbook added to `docs/runbooks/compliance-readiness-lite.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
