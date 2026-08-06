# Public Status Page - Runbook

## Owner

NOC / Service Desk

## Normal Operation

### Daily

- Review `portal/status-pages` component statuses for accuracy
- Check `portal/status` for active incidents that should be updated
- Resolve incidents that have been stable for 24+ hours

### Weekly

- Verify maintenance windows scheduled for the coming week
- Update component statuses after planned changes
- Confirm the public endpoint (`/api/v1/status-page/public/:orgId`) reflects reality

### Monthly

- Review incident history for recurring root causes
- Archive resolved incidents older than 90 days
- Validate affected component links on incidents

## Common Failures

### 1. Public Endpoint Returns Empty

**Symptoms**: `GET /status-page/public/:orgId` returns no components
**Causes**: Wrong org id, or no components defined
**Resolution**:

1. Confirm org id matches an organization
2. Verify components exist: `SELECT * FROM status_components WHERE organization_id = '<org>';`

### 2. Resolved Incident Still Visible

**Symptoms**: Public feed shows a resolved incident
**Causes**: `status` not set to `resolved` (only non-resolved are returned)
**Resolution**:

1. PATCH the incident to `status: 'resolved'`
2. Verify `resolved_at` was set

### 3. Maintenance Never Disappears

**Symptoms**: Past maintenance still listed
**Causes**: Public feed filters on `scheduled_start >= now()` only; completed windows still match if start was future when posted
**Resolution**:

1. Set `status = 'completed'` on finished maintenance
2. Confirm `scheduled_end` is in the past

### 4. Component Delete Denied (403)

**Symptoms**: DELETE returns 403
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl "https://api.mainecybertech.com/api/v1/status-page/public/$ORG_ID"
```

### Data Integrity

```sql
-- Incidents resolved without timestamp
SELECT * FROM status_incidents WHERE status = 'resolved' AND resolved_at IS NULL;

-- Maintenance past end but not completed
SELECT * FROM maintenance_notices WHERE scheduled_end < now() AND status != 'completed';
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P1       | Platform Engineer | 2 hrs |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS maintenance_notices;
DROP TABLE IF EXISTS status_incidents;
DROP TABLE IF EXISTS status_components;
```

### API Rollback

1. Revert `/api/v1/status-page` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/status-page.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `status_page_active_incidents` (gauge) - per org
- **Metric**: `status_page_component_health` (gauge) - operational vs degraded/down
- **Alert**: Component down for 1+ hour without an incident → P2
- **Alert**: Public endpoint 5xx rate > 1% → P1

## Related Documentation

- Feature spec: `docs/features/public-status-page.md`
- Database schema: `supabase/migrations/5302092_status_page.sql`
