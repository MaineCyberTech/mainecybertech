# UniFi Site Survey & Deployment Planner

## Purpose

Capture on-site UniFi network survey data for client locations and generate a deployment plan: access point / switch counts, camera and storage estimates, PoE budget, and cable-run requirements. A `/plan` endpoint derives a hardware recommendation (AP count, switch count, estimated cost) from square footage, floors, and user count.

Primary users: MSP field technician, network engineer

Business impact: Medium

Category: operations

## Permissions

Permission module key: `field-services` (view / create / edit / delete)

| Action                 | Roles                          |
| ---------------------- | ------------------------------ |
| List/view surveys      | All authenticated org members  |
| Create survey          | admin, super_admin, technician |
| Update survey          | admin, super_admin, technician |
| Delete survey          | admin, super_admin             |
| Run deployment planner | admin, super_admin             |

## Routes

### Portal Routes

| Route                            | Description                            |
| -------------------------------- | -------------------------------------- |
| `GET /portal/unifi-site-surveys` | List site surveys for the organization |

### API Routes

| Method | Endpoint                                | Description                               |
| ------ | --------------------------------------- | ----------------------------------------- |
| GET    | `/api/v1/field-services/unifi`          | List site surveys (paginated, org-scoped) |
| POST   | `/api/v1/field-services/unifi`          | Create a site survey                      |
| GET    | `/api/v1/field-services/unifi/:id`      | Get single site survey                    |
| PATCH  | `/api/v1/field-services/unifi/:id`      | Update site survey                        |
| DELETE | `/api/v1/field-services/unifi/:id`      | Delete site survey                        |
| POST   | `/api/v1/field-services/unifi/:id/plan` | Generate deployment plan (AP/switch/cost) |

## Data Model

### unifi_surveys

| Column                   | Type         | Constraints                      | Description                            |
| ------------------------ | ------------ | -------------------------------- | -------------------------------------- |
| id                       | uuid         | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id          | uuid         | FK → organizations(id), NOT NULL | Tenant scoping                         |
| site_name                | text         | NOT NULL                         | Site/location name                     |
| site_address             | text         |                                  | Physical address                       |
| access_points            | integer      | NOT NULL, default 0              | Surveyed AP count                      |
| switches                 | integer      | NOT NULL, default 0              | Surveyed switch count                  |
| cameras                  | integer      | NOT NULL, default 0              | Surveyed camera count                  |
| nvr_estimated_storage_tb | numeric(6,2) |                                  | Estimated NVR storage (TB)             |
| outdoor_aps              | integer      | NOT NULL, default 0              | Outdoor AP count                       |
| cable_runs_estimated     | integer      | NOT NULL, default 0              | Estimated cable runs                   |
| poe_budget_watts         | integer      |                                  | PoE power budget (W)                   |
| survey_date              | date         |                                  | Date of survey                         |
| notes                    | text         |                                  | Survey notes                           |
| status                   | text         | NOT NULL, default 'draft'        | draft / planned / active / completed   |
| ap_count                 | integer      | default 0                        | Planner-derived AP count (5302097)     |
| switch_count             | integer      | default 0                        | Planner-derived switch count (5302097) |
| estimated_cost           | numeric      | default 0                        | Planner-derived cost (5302097)         |
| created_by               | uuid         | FK → auth.users(id)              | Creator                                |
| created_at               | timestamptz  | NOT NULL, default now()          | Creation timestamp                     |
| updated_at               | timestamptz  | NOT NULL, default now()          | Last update timestamp                  |

## Workflows

### Create Site Survey

1. Record `site_name`, `site_address`, and `survey_date`
2. Capture surveyed counts: `access_points`, `switches`, `cameras`, `outdoor_aps`
3. Note `nvr_estimated_storage_tb`, `cable_runs_estimated`, `poe_budget_watts`
4. New records default to `status = 'draft'`

### Deployment Planning

1. `POST /api/v1/field-services/unifi/:id/plan` accepts `squareFootage` (≥100 sq ft), `floors` (1-10), `userCount` (≥1)
2. `ap_count = max(1, ceil((squareFootage / 2000) * floors))`
3. `switch_count = max(1, ceil(ap_count / 24))`
4. `estimated_cost = ap_count * 150 + switch_count * 500`
5. Writes derived values to the record and returns them with the updated row

### Lifecycle

- Surveys move `draft` → `planned` (after planner run) → `active` (deployment) → `completed`

## AI Review Rules

- AI may draft survey summaries and bill-of-materials tables from the derived plan
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before use

## Troubleshooting

| Issue                         | Resolution                                                      |
| ----------------------------- | --------------------------------------------------------------- |
| Planner rejects input         | Confirm `squareFootage` ≥ 100, `floors` 1-10, `userCount` ≥ 1   |
| Planner 404                   | Record must exist and belong to the active org                  |
| List empty for valid org      | Verify `organization_id` matches active org; check RLS          |
| Derived fields not persisting | Confirm `ap_count`/`switch_count`/`estimated_cost` are writable |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` applied (unifi_surveys + RLS)
- [ ] Migration `5302097_isp_unifi_scoring_fields.sql` applied (planner columns)
- [ ] Permission keys `field-services:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/field-services.ts` (crudRoute + plan)
- [ ] Validators in `apps/api/src/validators/field-services.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/unifi-site-surveys/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/unifi-site-surveys.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/unifi-site-survey-deployment-planner.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
