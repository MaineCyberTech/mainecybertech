# Phishing Simulation

## Purpose

Security awareness phishing campaign management. Campaigns track target counts, open/click/report metrics, launch lifecycle, and results so organizations can measure and improve their resistance to social engineering.

Primary users: MSP security engineer, client security administrator, admin

Business impact: High

Category: edu-automation

## Permissions

| Action                | Roles                         |
| --------------------- | ----------------------------- |
| List campaigns        | All authenticated org members |
| View campaign         | All authenticated org members |
| Create campaign       | admin, super_admin            |
| Update campaign       | admin, super_admin            |
| Delete campaign       | admin, super_admin            |
| Launch campaign       | admin, super_admin            |
| View campaign results | admin, super_admin            |

## Routes

### Portal Routes

| Route                              | Description                             |
| ---------------------------------- | --------------------------------------- |
| `GET /portal/phishing-simulations` | List phishing campaigns for current org |

### API Routes

| Method | Endpoint                                      | Description                                     |
| ------ | --------------------------------------------- | ----------------------------------------------- |
| GET    | `/api/v1/edu-automation/phishing`             | List campaigns (paginated)                      |
| GET    | `/api/v1/edu-automation/phishing/:id`         | Get a single campaign                           |
| POST   | `/api/v1/edu-automation/phishing`             | Create a campaign                               |
| PATCH  | `/api/v1/edu-automation/phishing/:id`         | Update a campaign                               |
| DELETE | `/api/v1/edu-automation/phishing/:id`         | Delete a campaign                               |
| POST   | `/api/v1/edu-automation/phishing/:id/launch`  | Launch draft campaign (status → `active`)       |
| GET    | `/api/v1/edu-automation/phishing/:id/results` | Compute click rate and report rate for campaign |

## Data Model

### phishing_campaigns

| Column          | Type        | Constraints                      | Description                  |
| --------------- | ----------- | -------------------------------- | ---------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier            |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping               |
| campaign_name   | text        | NOT NULL                         | Campaign display name        |
| target_count    | integer     | default 0                        | Number of targets            |
| opened_count    | integer     | default 0                        | Users who opened the email   |
| clicked_count   | integer     | default 0                        | Users who clicked the link   |
| reported_count  | integer     | default 0                        | Users who reported the email |
| started_at      | timestamptz |                                  | Campaign start               |
| ended_at        | timestamptz |                                  | Campaign end                 |
| notes           | text        |                                  | Planning notes               |
| status          | text        | NOT NULL, default 'draft'        | draft / active / completed   |
| created_by      | uuid        | FK → auth.users(id)              | Author                       |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp           |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp        |

Additional columns added by `5302096_phishing_campaign_fields.sql`: `launched_at` timestamptz.

## Workflows

### Campaign Lifecycle

1. **Draft** — Create the campaign with name, target count, and notes
2. **Launch** — `POST /:id/launch` sets status to `active` and stamps `launched_at`; only `draft` campaigns can be launched (otherwise no-op)
3. **Run** — Metrics accumulate as emails are opened, links clicked, and phishing reported
4. **Complete** — Campaign ends; status moves to `completed` with `ended_at`
5. **Results** — `GET /:id/results` returns `clickRate` and `reportRate` computed as percentages of `target_count`

Every launch logs an audit event (`phishing.launched`).

### Portal Display

- Lists campaigns scoped to the approved membership org with `StatusPill`
- Shows sent/clicked/reported counts and completion date
- Empty state renders "No phishing simulations yet."

## Troubleshooting

| Issue                    | Resolution                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| Launch does nothing      | Campaign status must be `draft`; active/completed campaigns skip  |
| Results show 0 rates     | `target_count` is 0, or metrics not yet populated                 |
| Metrics stale            | Click/report counts are updated by the campaign delivery pipeline |
| List empty               | Verify org has campaigns and `organization_id` is passed          |
| RLS policy denies access | Confirm user has an approved membership in the organization       |

## Release Checklist

- [ ] Migrations `5302073_edu_automation.sql` + `5302096_phishing_campaign_fields.sql` applied
- [ ] API routes registered in `apps/api/src/routes/edu-automation.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`eduAutomation.phishing`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/phishing-simulations/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/phishing-simulations.spec.ts`
- [ ] Feature doc added to `docs/features/phishing-simulation.md`
- [ ] Runbook added to `docs/runbooks/phishing-simulation.md`
