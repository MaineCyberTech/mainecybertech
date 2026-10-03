# Tabletop Exercise Planner - Runbook

## Owner

MSP vCISO / Incident Readiness Lead

## Normal Operation

### Daily

- Review upcoming exercises (`scheduled_date` within 30 days)
- Confirm facilitators are assigned (`facilitator_id`)
- Check participants list is populated

### Weekly

- Verify scenario realism and inject readiness
- Follow up on action items from completed exercises
- Confirm after-action reports are being written for completed exercises

### Monthly

- Audit exercise coverage against the training calendar
- Update scenarios based on lessons learned
- Report readiness posture to leadership

## Common Failures

### 1. Exercise Never Completed

**Symptoms**: Exercises past `scheduled_date` still `planned`
**Causes**:

- Exercise not run
- Status not updated after completion

**Resolution**:

1. Find stale: `SELECT title, scheduled_date FROM tabletop_exercises WHERE scheduled_date < now() AND status = 'planned'`
2. Confirm whether the exercise occurred
3. Update `status`, `completed_at`, and write `action_items` / `after_action_report`

### 2. Missing After-Action Report

**Symptoms**: Completed exercises with null `after_action_report`
**Causes**:

- Report not written after the exercise
- Action items not captured

**Resolution**:

1. Find missing: `SELECT title FROM tabletop_exercises WHERE status = 'completed' AND after_action_report IS NULL`
2. Write the after-action report and action items via PATCH
3. Confirm the facilitator (facilitator_id) is recorded

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid exercise IDs
**Causes**:

- User not in organization memberships
- Organization ID mismatch in request

**Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Ensure API request includes the correct `organization_id` query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/governance/tabletop?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM tabletop_exercises;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'tabletop_exercises';"
```

### Data Integrity

```sql
-- Planned exercises past their scheduled date
SELECT title, scheduled_date FROM tabletop_exercises WHERE scheduled_date < now() AND status = 'planned';

-- Completed exercises missing after-action report
SELECT title FROM tabletop_exercises WHERE status = 'completed' AND after_action_report IS NULL;

-- Status distribution
SELECT status, count(*) FROM tabletop_exercises GROUP BY status;

-- Exercises without a facilitator
SELECT title FROM tabletop_exercises WHERE facilitator_id IS NULL;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - No tabletop data accessible    | Platform Engineer | 30 min         |
| P1 - Tabletop API broken            | Backend Engineer  | 2 hours        |
| P2 - Exercise not completed on time | vCISO             | 4 hours        |
| P3 - Missing after-action reports   | vCISO             | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302071 causes issues:
DROP TABLE IF EXISTS tabletop_exercises;
```

### API Rollback

1. Revert `apps/api/src/routes/governance.ts` tabletop registration
2. Revert `apps/api/src/validators/governance.ts` `createTabletopSchema`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/tabletop/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `tabletop_exercises_scheduled` (gauge) - planned exercises per org
- **Metric**: `tabletop_exercises_overdue` (gauge) - planned past `scheduled_date`
- **Metric**: `tabletop_after_action_missing` (gauge) - completed without report
- **Alert**: Exercise past `scheduled_date` still planned for 7 days → P3
- **Alert**: Tabletop API 5xx → P1

## Related Documentation

- Feature spec: `docs/features/tabletop-exercise-planner.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302071_governance.sql`
