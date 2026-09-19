# QBR Executive Report Generator - Runbook

## Owner

Platform Engineering / Account Management Lead

## Normal Operation

### Daily

- Verify scheduled `qbr-scheduled-generate` worker task is producing draft reports
- Spot-check that report periods align with the previous quarter

### Weekly

- Review draft reports for stale or missing data (tickets, projects, findings)
- Confirm asset warranty and domain-monitor alerts are current in `report_data`

### Monthly

- Publish/send finalized reports to clients with `status: "sent"`
- Audit report visibility: internal reports must never be `visibility: client`

## Common Failures

### 1. Report Generation Fails (DB_ERROR)

**Symptoms**: `POST /api/v1/qbr/generate` returns 500; no row inserted
**Causes**:

- One of the source tables (tickets, projects, findings, assets, domain_monitors) is missing
- Organization has no approved membership for the caller
- Supabase service role unavailable
  **Resolution**:

1. Verify all five source tables exist: `psql -c "\d qbr_reports"`
2. Confirm the caller has an approved membership: `SELECT * FROM memberships WHERE user_id = auth.uid()`
3. Check API logs for the failing table name in the DB_ERROR message

### 2. Report Not Found on Portal

**Symptoms**: Portal QBR list is empty even though reports exist
**Causes**:

- `organizationId` mismatch between portal membership and report rows
- RLS policy `qbr_reports_select_org` denies access
  **Resolution**:

1. Verify rows: `SELECT id, organization_id FROM qbr_reports;`
2. Confirm the portal's active org matches the report organization_id
3. Test API directly: `curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/qbr?organization_id=$ORG"`

### 3. Worker Task Not Generating

**Symptoms**: No new draft reports from the schedule
**Causes**:

- Worker queue down (Redis unreachable)
- Task not registered in `apps/worker/src/tasks/index.ts`
  **Resolution**:

1. Check worker health endpoint on port 3001
2. Confirm Redis is reachable: `docker compose exec redis redis-cli ping`
3. Verify registration: grep `qbr-scheduled-generate` in `apps/worker/src/tasks/index.ts`

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/qbr?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM qbr_reports;"
```

### Data Integrity

```sql
-- Verify reports have report_data populated
SELECT id, title, status, jsonb_typeof(report_data) FROM qbr_reports;

-- Check for draft reports older than 30 days (stale)
SELECT id, title, created_at FROM qbr_reports
WHERE status = 'draft' AND created_at < now() - interval '30 days';

-- Ensure client-visible reports are never internal-only
SELECT id, title, visibility, status FROM qbr_reports WHERE visibility = 'client';
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - Report generation fully broken | Platform Engineer | 30 min         |
| P1 - Scheduled generation failing   | Backend Engineer  | 2 hours        |
| P2 - Stale report data              | Backend Engineer  | 4 hours        |
| P3 - Formatting/visibility issue    | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS qbr_reports;
```

### API Rollback

1. Revert `apps/api/src/routes/qbr.ts`
2. Revert `apps/api/src/validators/qbr.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `qbr_reports_draft_stale` (gauge) - draft reports > 30 days old
- **Metric**: `qbr_generate_success_rate` (rate) - ratio of successful generations
- **Alert**: Generate failure rate > 5% over 1 hour → P1
- **Alert**: Scheduled generation produces no drafts for 7 days → P2

## Related Documentation

- Feature spec: `docs/features/qbr-executive-report-generator.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302063_qbr_reports.sql`
