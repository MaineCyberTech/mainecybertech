# Tabletop Exercise Planner

## Purpose

Plan and track tabletop security exercises for the organization: scenario definition, scenario type, participants, scheduling, facilitation, action items, and after-action reports. Drives readiness validation of incident response plans.

Primary users: MSP vCISO, client sponsor, security analyst

Business impact: Medium

Category: governance

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| List tabletop exercises  | All authenticated org members |
| View tabletop exercise   | All authenticated org members |
| Create tabletop exercise | admin, super_admin            |
| Update tabletop exercise | admin, super_admin            |
| Delete tabletop exercise | admin, super_admin            |

## Routes

### Portal Routes

| Route                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `GET /portal/tabletop` | List tabletop exercises with scenario + schedule |

### API Routes

| Method | Endpoint                          | Description                         |
| ------ | --------------------------------- | ----------------------------------- |
| GET    | `/api/v1/governance/tabletop`     | List tabletop exercises (paginated) |
| GET    | `/api/v1/governance/tabletop/:id` | Get single exercise                 |
| POST   | `/api/v1/governance/tabletop`     | Create exercise                     |
| PATCH  | `/api/v1/governance/tabletop/:id` | Update exercise                     |
| DELETE | `/api/v1/governance/tabletop/:id` | Delete exercise                     |

## Data Model

### tabletop_exercises

| Column              | Type        | Constraints                      | Description                     |
| ------------------- | ----------- | -------------------------------- | ------------------------------- |
| id                  | uuid        | PK, default gen_random_uuid()    | Unique identifier               |
| organization_id     | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                  |
| title               | text        | NOT NULL                         | Exercise title                  |
| scenario            | text        | NOT NULL                         | Scenario narrative              |
| scenario_type       | text        | default 'cyber_incident'         | Scenario category               |
| participants        | text        |                                  | Participants list / roles       |
| scheduled_date      | timestamptz |                                  | When the exercise is scheduled  |
| completed_at        | timestamptz |                                  | When the exercise was completed |
| facilitator_id      | uuid        | FK → auth.users(id)              | Facilitator                     |
| notes               | text        |                                  | Planning notes                  |
| action_items        | text        |                                  | Follow-up action items          |
| after_action_report | text        |                                  | After-action report             |
| status              | text        | NOT NULL, default 'planned'      | Exercise status                 |
| created_by          | uuid        | FK → auth.users(id)              | Creator                         |
| created_at          | timestamptz | NOT NULL, default now()          | Creation timestamp              |
| updated_at          | timestamptz | NOT NULL, default now()          | Last update timestamp           |

## Workflows

### Planning

1. vCISO creates an exercise with `title`, `scenario`, and `scenario_type`
2. Defines `participants`, assigns a `facilitator_id`, and sets `scheduled_date`
3. Status starts as `planned`

### Execution & Follow-Up

- On completion, set `completed_at` and update status
- Record `action_items` and an `after_action_report`
- The portal surfaces scheduled dates so upcoming exercises stay visible

## AI Review Rules

- AI may draft scenarios, injects, and after-action summaries
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual exercise records
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| Exercise card not shown  | Verify org has rows in `tabletop_exercises`; check RLS policies  |
| Scheduled date missing   | Confirm `scheduled_date` is set on the exercise                  |
| Title blank              | Confirm `title` populated; card falls back to scenario if absent |
| RLS policy denies access | Confirm user has an approved membership in the organization      |
| 404 on exercise by id    | Confirm `organization_id` query param matches the exercise's org |

## Release Checklist

- [ ] Migration `5302071_governance.sql` applied
- [ ] API routes registered in `apps/api/src/routes/governance.ts`
- [ ] Validator `createTabletopSchema` in `apps/api/src/validators/governance.ts`
- [ ] SDK module `governance.tabletop` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/tabletop/`
- [ ] Unit tests pass: `pnpm --filter=api test governance`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/tabletop.spec.ts`
- [ ] Feature doc added to `docs/features/tabletop-exercise-planner.md`
- [ ] Runbook added to `docs/runbooks/tabletop-exercise-planner.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
