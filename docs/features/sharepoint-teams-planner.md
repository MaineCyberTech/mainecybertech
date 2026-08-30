# SharePoint & Teams Planner

## Purpose

Plan and track SharePoint site and Microsoft Teams configurations for the organization: site names, team names, structure type, ownership, sensitivity labels, external sharing policy, and rollout status. Provides a structured view of the M365 collaboration estate.

Primary users: MSP M365 engineer, client sponsor, technician

Business impact: Medium

Category: final

## Permissions

| Action                 | Roles                         |
| ---------------------- | ----------------------------- |
| List SharePoint plans  | All authenticated org members |
| View SharePoint plan   | All authenticated org members |
| Create SharePoint plan | admin, super_admin            |
| Update SharePoint plan | admin, super_admin            |
| Delete SharePoint plan | admin, super_admin            |
| View structure summary | All authenticated org members |

## Routes

### Portal Routes

| Route                    | Description                            |
| ------------------------ | -------------------------------------- |
| `GET /portal/sharepoint` | List SharePoint & Teams configurations |

### API Routes

| Method | Endpoint                                     | Description                              |
| ------ | -------------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/final/sharepoint`                   | List SharePoint plans (paginated)        |
| GET    | `/api/v1/final/sharepoint/:id`               | Get single plan                          |
| POST   | `/api/v1/final/sharepoint`                   | Create plan                              |
| PATCH  | `/api/v1/final/sharepoint/:id`               | Update plan                              |
| DELETE | `/api/v1/final/sharepoint/:id`               | Delete plan                              |
| GET    | `/api/v1/final/sharepoint/structure-summary` | Aggregate planned/active sites + sharing |

## Data Model

### sharepoint_plans

| Column            | Type        | Constraints                      | Description                 |
| ----------------- | ----------- | -------------------------------- | --------------------------- |
| id                | uuid        | PK, default gen_random_uuid()    | Unique identifier           |
| organization_id   | uuid        | FK → organizations(id), NOT NULL | Tenant scoping              |
| site_name         | text        | NOT NULL                         | SharePoint site / team name |
| team_name         | text        |                                  | Linked Microsoft Team name  |
| structure_type    | text        | default 'team_site'              | Site structure type         |
| owner             | text        |                                  | Site / team owner           |
| sensitivity_label | text        |                                  | M365 sensitivity label      |
| external_sharing  | text        | default 'disabled'               | External sharing policy     |
| notes             | text        |                                  | Planning notes              |
| status            | text        | NOT NULL, default 'planned'      | Rollout status              |
| created_by        | uuid        | FK → auth.users(id)              | Creator                     |
| created_at        | timestamptz | NOT NULL, default now()          | Creation timestamp          |
| updated_at        | timestamptz | NOT NULL, default now()          | Last update timestamp       |

## Workflows

### Site Planning

1. Engineer defines the site/team with `site_name`, `team_name`, and `structure_type`
2. Assigns an `owner` and a `sensitivity_label`
3. Sets `external_sharing` to the desired policy (default `disabled`)
4. Status starts as `planned` and moves to `active` after provisioning

### Structure Summary

- `GET /sharepoint/structure-summary` aggregates all plans for the org
- Returns `totalPlans`, `plannedSites`, `activeSites`, and `teamsWithExternalSharing`
- Highlights teams with external sharing enabled for review

## AI Review Rules

- AI may draft site structure templates, sharing policy guidance, and provisioning notes
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual SharePoint plans
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                            |
| ------------------------ | --------------------------------------------------------------------- |
| Plan card not shown      | Verify org has rows in `sharepoint_plans`; check RLS policies         |
| External sharing unset   | Confirm `external_sharing` value is `enabled`/`disabled`/other policy |
| Status badge missing     | Confirm `status` is one of `planned`, `active`, or others used by UI  |
| RLS policy denies access | Confirm user has an approved membership in the organization           |
| 404 on plan by id        | Confirm `organization_id` query param matches the plan's org          |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied
- [ ] API routes registered in `apps/api/src/routes/final.ts`
- [ ] Validator `sp` in `apps/api/src/validators/final.ts`
- [ ] SDK module `final.sharepoint` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/sharepoint/`
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/sharepoint.spec.ts`
- [ ] Feature doc added to `docs/features/sharepoint-teams-planner.md`
- [ ] Runbook added to `docs/runbooks/sharepoint-teams-planner.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
