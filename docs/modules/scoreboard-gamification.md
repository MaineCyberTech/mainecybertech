# Fun Cyber Scoreboard / Mascot

**Category:** Engagement
**API Routes:** `apps/api/src/routes/scoreboards-gamification.ts`
**SDK:** `packages/sdk/src/scoreboards-gamification.ts`

## Overview

Gamified cybersecurity scoreboard for MSP clients that rewards security-positive behaviors with points, achievements, and a rotating mascot character. Encourages employees to complete security training, report phishing, enable MFA, attend security awareness events, and maintain good cyber hygiene.

## Key Features

- Point system — earn points for training completion (+50), phishing report (+25), MFA enrollment (+100), quiz pass (+30), streak milestones (+bonus)
- Achievement badges — predefined milestones (First Report, Perfect Month, Phish Hunter, MFA Master, Streak King, Security Champion)
- Leaderboard — org-wide ranking with weekly/monthly/all-time views
- Mascot system — animated mascot character that evolves with score tier (Egg → Hatchling → Defender → Guardian → Cyber Legend)
- Monthly challenges — themed security challenges with bonus points (February = Password Health Month, October = Cyber Awareness)
- Celebration animations — confetti overlay on new badge or level-up

## Endpoints

| Method | Path                                           | Description                                         |
| ------ | ---------------------------------------------- | --------------------------------------------------- |
| GET    | /api/v1/scoreboard/leaderboard                 | Leaderboard for org (period filter: week/month/all) |
| GET    | /api/v1/scoreboard/user/:userId                | Individual score, badges, streak, mascot tier       |
| POST   | /api/v1/scoreboard/points/award                | Award points (admin/automated)                      |
| GET    | /api/v1/scoreboard/badges                      | Badge definitions and requirements                  |
| POST   | /api/v1/scoreboard/user/:userId/badge/:badgeId | Award badge (admin only)                            |
| GET    | /api/v1/scoreboard/achievements/:userId        | Full achievement history                            |
| GET    | /api/v1/scoreboard/mascot                      | Mascot tier definitions and sprites                 |
| GET    | /api/v1/scoreboard/challenges                  | Active and upcoming monthly challenges              |

## Data Model

`scoreboard_scores` (organization_id, user_id, total_points, current_streak_days, longest_streak_days, mascot_tier, last_activity_at). `scoreboard_events` (user_id, points, event_type, description, metadata JSON, awarded_by, awarded_at). `scoreboard_badges` (user_id, badge_id, badge_key, badge_label, tier, awarded_at). `scoreboard_challenges` (organization_id, title, description, bonus_points, start_date, end_date, is_active).

## Access Control

- Admin: award points/badges, manage challenges, view full leaderboard
- Client: view own score, badges, and org leaderboard
- requireAuth on score endpoints; requireOrgAccess on leaderboard data
- Audit logging on manual point awards and badge assignments
