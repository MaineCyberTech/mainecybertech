# Dynamic Client Forms Builder

## Purpose

No-code form builder for client intake forms, onboarding questionnaires, site surveys, access requests, incident reports, and approvals. Forms are defined with a JSONB field schema, can be published with open/close windows, and collect submissions from authenticated org members.

Primary users: client admin, MSP admin, service desk technician

Business impact: High

Category: forms

## Permissions

| Action                  | Roles                         |
| ----------------------- | ----------------------------- |
| List forms              | All authenticated org members |
| View form detail        | All authenticated org members |
| Create form             | All authenticated org members |
| Update form             | All authenticated org members |
| Delete form             | All authenticated org members |
| Publish form            | All authenticated org members |
| Submit response to form | All authenticated org members |
| List form submissions   | All authenticated org members |
| Export forms            | All authenticated org members |

## Routes

### Portal Routes

| Route                                               | Description                        |
| --------------------------------------------------- | ---------------------------------- |
| `GET /portal/dynamic-client-forms-builder`          | List forms with status/type badges |
| `GET /portal/dynamic-client-forms-builder/new`      | Create a new form                  |
| `GET /portal/dynamic-client-forms-builder/:id`      | View/edit form detail              |
| `GET /portal/dynamic-client-forms-builder/:id/fill` | Fill out a published form          |

### API Routes

| Method | Endpoint                                | Description                          |
| ------ | --------------------------------------- | ------------------------------------ |
| GET    | `/api/v1/dynamic-forms`                 | List forms (paginated, filterable)   |
| GET    | `/api/v1/dynamic-forms/export.csv`      | Export forms (CSV/JSON)              |
| GET    | `/api/v1/dynamic-forms/:id`             | Get single form                      |
| POST   | `/api/v1/dynamic-forms`                 | Create form                          |
| PATCH  | `/api/v1/dynamic-forms/:id`             | Update form                          |
| DELETE | `/api/v1/dynamic-forms/:id`             | Delete form                          |
| POST   | `/api/v1/dynamic-forms/:id/publish`     | Publish form (optionally with close) |
| POST   | `/api/v1/dynamic-forms/:id/submit`      | Submit a response                    |
| GET    | `/api/v1/dynamic-forms/:id/submissions` | List submissions for a form          |

## Data Model

### dynamic_client_forms

| Column          | Type        | Constraints                      | Description                                                         |
| --------------- | ----------- | -------------------------------- | ------------------------------------------------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier                                                   |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                                      |
| title           | text        | NOT NULL                         | Form title                                                          |
| description     | text        |                                  | Form description                                                    |
| form_type       | text        | NOT NULL, default 'intake'       | intake/survey/questionnaire/access_request/incident_report/approval |
| status          | text        | NOT NULL, default 'draft'        | draft/published/closed                                              |
| fields          | jsonb       | NOT NULL, default '[]'           | Field schema array                                                  |
| settings        | jsonb       | NOT NULL, default '{}'           | Form settings                                                       |
| published_at    | timestamptz |                                  | Publish timestamp                                                   |
| closes_at       | timestamptz |                                  | Auto-close deadline                                                 |
| created_by      | uuid        | FK → auth.users(id)              | Form author                                                         |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp                                                  |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp                                               |

### dynamic_form_submissions

| Column           | Type        | Constraints                             | Description              |
| ---------------- | ----------- | --------------------------------------- | ------------------------ |
| id               | uuid        | PK, default gen_random_uuid()           | Unique identifier        |
| form_id          | uuid        | FK → dynamic_client_forms(id), NOT NULL | Parent form              |
| organization_id  | uuid        | FK → organizations(id), NOT NULL        | Tenant scoping           |
| respondent_id    | uuid        | FK → auth.users(id)                     | Authenticated respondent |
| respondent_email | text        |                                         | Respondent email         |
| answers          | jsonb       | NOT NULL, default '{}'                  | Submitted answers        |
| status           | text        | NOT NULL, default 'submitted'           | Submission status        |
| submitted_at     | timestamptz | NOT NULL, default now()                 | Submission timestamp     |
| created_at       | timestamptz | NOT NULL, default now()                 | Creation timestamp       |
| updated_at       | timestamptz | NOT NULL, default now()                 | Last update timestamp    |

## Workflows

### Build a Form

1. User opens the builder and creates a form with a title, form type, and field definitions
2. `POST /api/v1/dynamic-forms` saves the JSONB field schema with status `draft`
3. Form appears in the portal list with a draft badge

### Publish and Collect

1. User clicks publish; `POST /api/v1/dynamic-forms/:id/publish` sets `published_at` and status `published`
2. Optionally set `closes_at` for a deadline
3. Respondents open `/portal/dynamic-client-forms-builder/:id/fill` and submit
4. `POST /api/v1/dynamic-forms/:id/submit` writes a `dynamic_form_submissions` row

### Review Responses

- `GET /api/v1/dynamic-forms/:id/submissions` lists all responses for a form

## AI Review Rules

- AI may draft form field schemas and question sets
- All AI outputs are stored for human review before publishing
- Form submissions never auto-trigger AI decisions

## Troubleshooting

| Issue                    | Resolution                                                  |
| ------------------------ | ----------------------------------------------------------- |
| Form list empty          | No forms created for the org; use the New Form builder      |
| Cannot submit a form     | Form must be published; check status and `closes_at`        |
| Submissions missing      | Verify respondents submitted; check form id and org scoping |
| Export returns empty     | Verify forms exist; check `format` parameter is csv or json |
| RLS policy denies access | Confirm user has membership in the organization             |

## Release Checklist

- [ ] Migration `5302080_dynamic_client_forms_builder.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/dynamic-client-forms-builder.ts`
- [ ] Service functions in `apps/api/src/services/dynamic-client-forms-builder.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal pages created in `apps/web/app/(portal)/portal/dynamic-client-forms-builder/`
- [ ] Unit tests pass: `pnpm --filter=api test dynamic-client-forms-builder`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/dynamic-client-forms.spec.ts`
- [ ] Feature doc added to `docs/features/dynamic-client-forms-builder.md`
- [ ] Runbook added to `docs/runbooks/dynamic-client-forms-builder.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
