# Client Satisfaction Pulse - Runbook

## Owner

Client Success / MSP CSM Lead

## Normal Operation

### Daily

- Review pulses with `status = 'pending'` and ensure they are sent on schedule
- Escalate negative ratings (1-2) immediately to the CSM for the affected client

### Weekly

- Review `responded` pulses and the feedback text for actionable themes
- Verify schedules fired (`last_run_at` updated) for the `ticket_closed` trigger
- Spot-check CSV export output for leadership reporting

### Monthly

- Run the full CSV export and compute average rating per source
- Prune inactive templates and duplicate schedules
- Review response rate and adjust send timing

## Common Failures

### 1. Pulses Not Being Sent

**Symptoms**: `sent_at` null for pulses that should have gone out
**Causes**:

- Schedule `is_active = false`
- `next_run_at` in the past and the worker didn't pick it up
- Trigger never matched (e.g., ticket_closed didn't fire)
  **Resolution**:

1. Check schedules: `SELECT name, is_active, last_run_at, next_run_at FROM satisfaction_pulse_schedules`
2. Confirm the schedule's `trigger_type` and `cron_expression` are correct
3. Re-enable the schedule and force the worker to re-evaluate

### 2. Negative Rating Missed

**Symptoms**: Low ratings not surfaced to CSM
**Causes**:

- No alerting configured on low ratings
- Ratings captured but not reviewed
  **Resolution**:

1. Query low ratings: `SELECT subject, rating, feedback FROM satisfaction_pulses WHERE rating <= 2 AND responded_at IS NOT NULL`
2. Route the feedback to the CSM for a follow-up call

### 3. CSV Export Empty

**Symptoms**: `/export?format=csv` returns only headers
**Causes**:

- No pulses for the organization
- Wrong `format` parameter
  **Resolution**:

1. Verify pulses exist: `SELECT count(*) FROM satisfaction_pulses WHERE organization_id = '...'`
2. Confirm `format=csv` and correct `organization_id`

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid pulse IDs
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
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/satisfaction-pulse?organization_id=$ORG&limit=50"

# Templates
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/satisfaction-pulse/templates?organization_id=$ORG"
```

### Data Integrity

```sql
-- Pulses sent but never responded
SELECT subject, source, sent_at FROM satisfaction_pulses
WHERE sent_at IS NOT NULL AND responded_at IS NULL;

-- Pulses with no source entity linkage
SELECT subject, source FROM satisfaction_pulses WHERE source_entity_id IS NULL;

-- Schedules past due
SELECT name, next_run_at, is_active FROM satisfaction_pulse_schedules
WHERE next_run_at < now() AND is_active = true;
```

## Escalation

| Severity                      | Contact           | SLA            |
| ----------------------------- | ----------------- | -------------- |
| P0 - No pulses accessible     | Platform Engineer | 30 min         |
| P1 - Respond endpoint broken  | Backend Engineer  | 2 hours        |
| P2 - Schedules not firing     | Worker Engineer   | 4 hours        |
| P3 - Export formatting issues | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migrations 5302074/5302079 cause issues:
DROP TABLE IF EXISTS satisfaction_pulse_schedules;
DROP TABLE IF EXISTS satisfaction_pulse_templates;
DROP TABLE IF EXISTS satisfaction_pulses;
```

### API Rollback

1. Revert `apps/api/src/routes/satisfaction-pulse-widget.ts` route registration
2. Revert `apps/api/src/services/satisfaction-pulse-widget.ts`
3. Revert `apps/api/src/validators/satisfaction-pulse-widget.ts`
4. Deploy previous API image

### Web Rollback

1. Revert admin pages in `apps/web/app/(admin)/admin/satisfaction-pulse/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `satisfaction_pulses_pending` (gauge) - unsent pulses
- **Metric**: `satisfaction_response_rate` (gauge) - % of sent pulses responded
- **Metric**: `satisfaction_avg_rating` (gauge) - average rating across responded pulses
- **Alert**: Avg rating < 3.5 over a week → P2
- **Alert**: Response rate < 20% → P3

## Related Documentation

- Feature spec: `docs/features/client-satisfaction-pulse.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql` + `supabase/migrations/5302079_satisfaction_pulse_widget.sql`
