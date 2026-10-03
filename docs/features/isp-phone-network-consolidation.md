# ISP / Phone Network Consolidation

## Purpose

Track each client's internet service provider (ISP) and phone environment to identify consolidation and cost-reduction opportunities. Each `isp_assessments` record captures current and recommended providers, bandwidth, contract terms, phone lines, and VoIP readiness. A scoring endpoint computes a `consolidation_score` (0-100) from monthly cost and contract length and returns a recommendation.

Primary users: MSP network engineer, account manager, technician

Business impact: High

Category: operations

## Permissions

Permission module key: `field-services` (view / create / edit / delete)

| Action                    | Roles                          |
| ------------------------- | ------------------------------ |
| List/view assessments     | All authenticated org members  |
| Create assessment         | admin, super_admin, technician |
| Update assessment         | admin, super_admin, technician |
| Delete assessment         | admin, super_admin             |
| Run consolidation scoring | admin, super_admin             |

## Routes

### Portal Routes

| Route                        | Description                               |
| ---------------------------- | ----------------------------------------- |
| `GET /portal/field-services` | List ISP assessments for the organization |

### Admin Routes

| Route                       | Description                               |
| --------------------------- | ----------------------------------------- |
| `GET /admin/field-services` | Admin management of field-service records |

### API Routes

| Method | Endpoint                               | Description                                  |
| ------ | -------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/field-services/isp`           | List ISP assessments (paginated, org-scoped) |
| POST   | `/api/v1/field-services/isp`           | Create an ISP assessment                     |
| GET    | `/api/v1/field-services/isp/:id`       | Get single ISP assessment                    |
| PATCH  | `/api/v1/field-services/isp/:id`       | Update ISP assessment                        |
| DELETE | `/api/v1/field-services/isp/:id`       | Delete ISP assessment                        |
| POST   | `/api/v1/field-services/isp/:id/score` | Compute consolidation score + recommendation |

## Data Model

### isp_assessments

| Column                 | Type          | Constraints                      | Description                                 |
| ---------------------- | ------------- | -------------------------------- | ------------------------------------------- |
| id                     | uuid          | PK, default gen_random_uuid()    | Unique identifier                           |
| organization_id        | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                              |
| client_name            | text          | NOT NULL                         | Client/site display name                    |
| current_provider       | text          |                                  | Current ISP                                 |
| current_cost           | numeric(12,2) |                                  | Current monthly cost                        |
| recommended_provider   | text          |                                  | Recommended ISP                             |
| recommended_cost       | numeric(12,2) |                                  | Recommended monthly cost                    |
| services               | text          |                                  | Services in scope (internet/voice/firewall) |
| bandwidth_current      | text          |                                  | Current bandwidth                           |
| bandwidth_needed       | text          |                                  | Required bandwidth                          |
| contract_status        | text          | NOT NULL, default 'unknown'      | unknown / active / expired                  |
| phone_lines            | integer       | NOT NULL, default 0              | Number of phone lines                       |
| voip_ready             | boolean       | NOT NULL, default false          | Infrastructure ready for VoIP               |
| notes                  | text          |                                  | Assessment notes                            |
| status                 | text          | NOT NULL, default 'draft'        | draft / active / completed / expired        |
| monthly_cost           | numeric       | default 0                        | Scored monthly cost (5302097)               |
| contract_length_months | integer       | default 12                       | Scored contract length (5302097)            |
| consolidation_score    | integer       | default 0                        | Computed 0-100 score (5302097)              |
| recommendation         | text          |                                  | Scoring recommendation text (5302097)       |
| created_by             | uuid          | FK → auth.users(id)              | Creator                                     |
| created_at             | timestamptz   | NOT NULL, default now()          | Creation timestamp                          |
| updated_at             | timestamptz   | NOT NULL, default now()          | Last update timestamp                       |

## Workflows

### Create Assessment

1. Record client/site details: `client_name`, current and recommended providers and costs
2. Capture `services`, `bandwidth_current`, `bandwidth_needed`
3. Note `contract_status`, `phone_lines`, `voip_ready`
4. New records default to `status = 'draft'`

### Consolidation Scoring

1. `POST /api/v1/field-services/isp/:id/score` accepts `monthlyCost` (≥0) and `contractLength` (≥1 month)
2. `consolidation_score = clamp(0, 100, 100 - (monthlyCost * contractLength) / 100)`
3. `recommendation` is assigned:
   - score > 70 → `"Renegotiate contract"`
   - score > 40 → `"Explore alternative providers"`
   - otherwise → `"Current terms acceptable"`
4. Writes `monthly_cost`, `contract_length_months`, `consolidation_score`, `recommendation` to the record

### Lifecycle

- Assessments start `draft`, move to `active` while being worked, `completed` after consolidation decision, `expired` at contract term end

## AI Review Rules

- AI may draft provider comparison summaries and negotiation talking points
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before use

## Troubleshooting

| Issue                           | Resolution                                                         |
| ------------------------------- | ------------------------------------------------------------------ |
| Scoring rejects input           | Confirm `monthlyCost` ≥ 0 and `contractLength` ≥ 1 (Zod-validated) |
| List empty for valid org        | Verify `organization_id` matches active org; check RLS             |
| Contract status filter mismatch | Values are free text (`unknown`/`active`/`expired` convention)     |
| Portal field-services empty     | No ISP records for the org; create one via admin/API               |

## Release Checklist

- [ ] Migration `5302072_field_services.sql` applied (isp_assessments + RLS)
- [ ] Migration `5302097_isp_unifi_scoring_fields.sql` applied (score columns)
- [ ] Permission keys `field-services:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/field-services.ts` (crudRoute + score)
- [ ] Validators in `apps/api/src/validators/field-services.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/field-services/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/field-services.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/isp-phone-network-consolidation.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
