# Cyber Scoreboard - Runbook

## Owner

MSP Security Program / Reporting Lead

## Normal Operation

### Daily

- Review newly created scorecards for category accuracy and score sanity (0-100)
- Flag scorecards where `score` exceeds `max_score`

### Weekly

- Run `POST /api/v1/edu-automation/scorecards/evaluate` to refresh badges and score history
- Review trend output from `/summary` for client reporting
- Verify the leaderboard reflects current tenant data

### Monthly

- Produce the monthly security posture report from `overview`/`summary`
- Audit `badges_earned` for scoring integrity
- Review category definitions and weights for improvement opportunities

## Common Failures

### 1. Badges Not Appearing

**Symptoms**: Scorecards updated but badges stay null
**Causes**:

- Score updated via PATCH instead of `/evaluate`
- Evaluation ran but failed partway
  **Resolution**:

1. Run `POST /api/v1/edu-automation/scorecards/evaluate` for the org
2. Check `badges_earned` rows: `SELECT badge_name, points FROM badges_earned WHERE organization_id = '...'`
3. Verify badge thresholds: Gold ≥ 90, Silver ≥ 70, Bronze ≥ 50

### 2. Trend Says Stable

**Symptoms**: `/summary` returns `stable` despite real improvements
**Causes**:

- Fewer than 4 `score_history` rows
- Recent vs older delta ≤ 5 points
  **Resolution**:

1. Confirm history: `SELECT count(*) FROM score_history WHERE organization_id = '...'`
2. Accumulate weekly evaluations so the trend window fills
3. Trend only flips on a >5 point delta between halves

### 3. Leaderboard Incorrect

**Symptoms**: Org ranked wrong
**Causes**:

- Scorecards from inactive orgs counted
- Average computed across unequal category counts
  **Resolution**:

1. Review the source query in `edu-automation.ts` (`/scorecards/leaderboard`)
2. Verify org names/IDs in the aggregated map
3. Confirm caller is admin — the route is `requireAdmin` gated

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid scorecard IDs
**Causes**:

- User not in organization memberships
- `organization_id` missing from the request
  **Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Ensure the API request includes the correct `organization_id`

## Verification Steps

### Health Check

```bash
# API list
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/scorecards?organization_id=$ORG"

# Summary
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/scorecards/summary?organization_id=$ORG"
```

### Data Integrity

```sql
-- Scorecards where score exceeds max
SELECT category, score, max_score FROM cyber_scorecards WHERE score > max_score;

-- Categories without badges after evaluation
SELECT category, score FROM cyber_scorecards WHERE badge IS NULL;

-- Score history gaps for trend
SELECT category, count(*) FROM score_history GROUP BY category;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - No scorecards accessible    | Platform Engineer | 30 min         |
| P1 - Evaluate endpoint broken    | Backend Engineer  | 2 hours        |
| P2 - Badge/score integrity issue | Backend Engineer  | 4 hours        |
| P3 - Leaderboard misreporting    | Reporting         | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migrations 5302073/5302085 cause issues:
DROP TABLE IF EXISTS badges_earned;
DROP TABLE IF EXISTS score_history;
DROP TABLE IF EXISTS cyber_scorecards;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts` route registration
2. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/scoreboard/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `cyber_score_overall` (gauge) - overall average score across categories
- **Metric**: `cyber_scorecards_evaluated` (counter) - evaluations run
- **Metric**: `cyber_score_trend` (gauge) - trend delta (improving/declining/stable)
- **Alert**: Overall score < 60 for any org → P2
- **Alert**: No evaluations run for 14 days → P3

## Related Documentation

- Feature spec: `docs/features/cyber-scoreboard.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql` + `supabase/migrations/5302085_scorecards_gamification.sql`
