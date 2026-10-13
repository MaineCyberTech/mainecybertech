# Scoreboards & Gamification

**Category:** Automation (sub-route of edu-automation)
**API Routes:** `apps/api/src/routes/edu-automation.ts`
**SDK:** `packages/sdk/src/edu-automation.ts` (scorecards namespace)

## Overview

Cybersecurity scorecard and gamification engine integrated within the Education Automation module. Organizations are scored per security category (identity, endpoint, network, data, cloud, training, governance, incident response in the seeded data), awarded tiered badges based on performance thresholds, and ranked on an admin-only leaderboard. The evaluation engine automatically assigns badges and records per-category score history for trend analysis.

## Key Features

- Scorecard CRUD with per-category scoring (categories are data-driven rows in `cyber_scorecards`, not a fixed domain schema)
- Aggregate score summary with overall percentage, badge collection, top-performing categories, lowest categories, and trend indicators
- Leaderboard ranking top 10 organizations by overall score (admin-only for competitive benchmarking)
- Automated evaluation engine assigning tiered badges based on thresholds: Gold >= 90, Silver >= 70, Bronze >= 50
- Security Champion badge awarded when the overall average across all categories >= 80
- Score history tracking per category for trend visualization and improvement measurement over time
- Earned badges collection with award date, category, and points per entry
- Per-category rows (with `max_score`) allow flexible weighting and category customization
- Trend indicator comparing recent vs older score history (improving, stable, declining; needs >= 4 history points)
- Admin-only leaderboard and evaluation execution; clients can view own scorecard
- Audit logging on all mutation and evaluation endpoints
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                                          | Description                                                                        |
| ------ | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | /api/v1/edu-automation/scorecards             | List scorecards (paginated, filterable by org)                                     |
| GET    | /api/v1/edu-automation/scorecards/:id         | Get a single scorecard row                                                         |
| POST   | /api/v1/edu-automation/scorecards             | Create a scorecard row (category, score, max_score)                                |
| PATCH  | /api/v1/edu-automation/scorecards/:id         | Update a scorecard row (badges are (re)assigned by /evaluate, not on save)         |
| DELETE | /api/v1/edu-automation/scorecards/:id         | Remove scorecard (org-level history/badges are retained)                           |
| GET    | /api/v1/edu-automation/scorecards/summary     | For current org: overall score, badges earned, top/lowest categories, trend        |
| GET    | /api/v1/edu-automation/scorecards/overview    | Overall score + per-category breakdown                                             |
| GET    | /api/v1/edu-automation/scorecards/leaderboard | Top 10 organizations ranked by overall score (admin-only)                          |
| POST   | /api/v1/edu-automation/scorecards/evaluate    | Run auto-evaluation: assign Gold/Silver/Bronze badges, award Champion if avg >= 80 |

## Data Model

Tables: `cyber_scorecards` (organization_id, category, score 0-100, max_score, badge, last_updated) stores one row per scored security category; `score_history` (organization_id, category, score, recorded_at) tracks per-category snapshots for trend analysis; `badges_earned` (organization_id, badge_name, category, earned_at, points) records badge awards.

## Access Control

- Admin: full CRUD on all org scorecards, leaderboard view, evaluation execution
- Client: view own organization scorecard and summary (portal); leaderboard and evaluate restricted to admin
