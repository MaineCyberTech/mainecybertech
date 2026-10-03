# Cyber Scoreboard

## Purpose

Gamified security posture scoreboard. Category-level scores roll up into an overall cyber score, badges reward strong performance, and score history tracks trend over time. Encourages clients to improve security maturity through visible, comparable scoring.

Primary users: client administrator, client user, MSP security engineer, admin

Business impact: Medium

Category: edu-automation

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List scorecards     | All authenticated org members |
| View scorecard      | All authenticated org members |
| Create scorecard    | admin, super_admin            |
| Update scorecard    | admin, super_admin            |
| Delete scorecard    | admin, super_admin            |
| Evaluate scorecards | admin, super_admin            |
| View leaderboard    | admin (requireAdmin)          |

## Routes

### Portal Routes

| Route                    | Description                     |
| ------------------------ | ------------------------------- |
| `GET /portal/scoreboard` | List scorecards for current org |

### API Routes

| Method | Endpoint                                        | Description                                       |
| ------ | ----------------------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/edu-automation/scorecards`             | List scorecards (paginated)                       |
| GET    | `/api/v1/edu-automation/scorecards/:id`         | Get a single scorecard                            |
| POST   | `/api/v1/edu-automation/scorecards`             | Create a scorecard                                |
| PATCH  | `/api/v1/edu-automation/scorecards/:id`         | Update a scorecard                                |
| DELETE | `/api/v1/edu-automation/scorecards/:id`         | Delete a scorecard                                |
| GET    | `/api/v1/edu-automation/scorecards/summary`     | Overall score, badges, top/lowest category, trend |
| GET    | `/api/v1/edu-automation/scorecards/overview`    | Overall score + per-category breakdown            |
| GET    | `/api/v1/edu-automation/scorecards/leaderboard` | Top 10 orgs by score (admin-only)                 |
| POST   | `/api/v1/edu-automation/scorecards/evaluate`    | Assign badges and record score history            |

## Data Model

### cyber_scorecards

| Column          | Type        | Constraints                      | Description               |
| --------------- | ----------- | -------------------------------- | ------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier         |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping            |
| category        | text        | NOT NULL                         | Score category            |
| score           | integer     | default 0                        | Category score (0-100)    |
| max_score       | integer     | default 100                      | Maximum possible score    |
| badge           | text        |                                  | Earned badge label        |
| last_updated    | timestamptz | NOT NULL, default now()          | Last evaluation timestamp |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp        |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp     |

### Related tables

`score_history` (organization_id, category, score, recorded_at) tracks snapshots for trend analysis; `badges_earned` (organization_id, badge_name, category, earned_at, points) records badge awards.

## Workflows

### Scoring & Badging

1. Scorecards are created per security category (e.g., endpoint, email, access, backups)
2. `POST /scorecards/evaluate` assigns badges by score threshold:
   - ≥ 90 → Gold, ≥ 70 → Silver, ≥ 50 → Bronze, else "Needs Improvement"
3. Each evaluation appends a row to `score_history` and awards a badge to `badges_earned`
4. Overall average ≥ 80 earns the "Security Champion" badge (200 points)

### Trend Analysis

- `GET /scorecards/summary` compares recent vs older score history to derive `trend`: `improving`, `declining`, or `stable`

### Leaderboard

- `GET /scorecards/leaderboard` (admin) aggregates each org's average score and ranks the top 10 across tenants

### Portal Display

- Lists scorecards scoped to the approved membership org with `StatusPill`
- Shows score %, category, and last assessed date
- Empty state renders "No scorecards available."

## Troubleshooting

| Issue                    | Resolution                                                  |
| ------------------------ | ----------------------------------------------------------- |
| Evaluate returns 0       | No scorecards exist for the org                             |
| Badge not updating       | Badges assigned on `/evaluate`, not on PATCH                |
| Trend shows stable       | Fewer than 4 history points → trend cannot be computed      |
| Leaderboard empty        | No scorecards across orgs, or caller is not admin           |
| RLS policy denies access | Confirm user has an approved membership in the organization |

## Release Checklist

- [ ] Migrations `5302073_edu_automation.sql` + `5302085_scorecards_gamification.sql` applied
- [ ] API routes registered in `apps/api/src/routes/edu-automation.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`eduAutomation.scorecards`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/scoreboard/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/scoreboard.spec.ts`
- [ ] Feature doc added to `docs/features/cyber-scoreboard.md`
- [ ] Runbook added to `docs/runbooks/cyber-scoreboard.md`
