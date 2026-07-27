# Scoreboards & Gamification

**Category:** Automation (sub-route of edu-automation)
**API Routes:** `apps/api/src/routes/edu-automation/scorecards.ts`
**SDK:** `packages/sdk/src/edu-automation.ts` (scorecards namespace)

## Overview

Cybersecurity scorecard and gamification engine integrated within the Education Automation module. Organizations are evaluated across 8 security domains, awarded tiered badges based on performance thresholds, and ranked on an admin-only leaderboard. The evaluation engine automatically assigns badges and tracks score history for trend analysis.

## Key Features

- Scorecard CRUD with domain-level scoring across 8 security domains: identity, endpoint, network, data, cloud, training, governance, and incident response
- Aggregate score summary with overall percentage, badge collection, top-performing categories, lowest categories, and trend indicators
- Leaderboard ranking top 10 organizations by overall score (admin-only for competitive benchmarking)
- Automated evaluation engine assigning tiered badges based on thresholds: Gold >= 90, Silver >= 70, Bronze >= 50
- Security Champion badge awarded when overall average across all 8 domains >= 80
- Score history tracking per scorecard for trend visualization and improvement measurement over time
- Earned badges collection with award date, badge tier, and evaluation notes per entry
- Domain scores stored as JSON allowing flexible per-org weighting and domain customization
- Trend indicator showing score direction over last 3 evaluations (improving, stable, declining)
- Admin-only leaderboard and evaluation execution; clients can view own scorecard
- Audit logging on all mutation and evaluation endpoints
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                                          | Description                                                                        |
| ------ | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | /api/v1/edu-automation/scorecards             | List scorecards (paginated, filterable by org, overall score range)                |
| GET    | /api/v1/edu-automation/scorecards/:id         | Get scorecard with badge history and recent score history                          |
| POST   | /api/v1/edu-automation/scorecards             | Create new scorecard with initial domain scores                                    |
| PATCH  | /api/v1/edu-automation/scorecards/:id         | Update domain scores (re-evaluates overall on save)                                |
| DELETE | /api/v1/edu-automation/scorecards/:id         | Remove scorecard and associated history/badges                                     |
| GET    | /api/v1/edu-automation/scorecards/summary     | For current org: overall score, badges earned, top/lowest categories, trend        |
| GET    | /api/v1/edu-automation/scorecards/leaderboard | Top 10 organizations ranked by overall score (admin-only)                          |
| POST   | /api/v1/edu-automation/scorecards/evaluate    | Run auto-evaluation: assign Gold/Silver/Bronze badges, award Champion if avg >= 80 |

## Data Model

Tables: `cyber_scorecards` (organization_id, domain_scores (jsonb: 8 domains with 0-100 each), overall_score (avg of domains), last_evaluated_at, created_by), `score_history` (scorecard_id, overall_score, domain_scores (jsonb), recorded_at), `badges_earned` (scorecard_id, badge_type: gold/silver/bronze/champion, tier, awarded_at, evaluation_notes)

## Access Control

- Admin: full CRUD on all org scorecards, leaderboard view, evaluation execution
- Client: view own organization scorecard and summary (portal); leaderboard and evaluate restricted to admin
