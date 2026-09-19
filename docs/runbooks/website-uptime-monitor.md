# Website Uptime Monitor - Runbook

## Owner

NOC / Monitoring Team

## Normal Operation

### Daily

- Review `portal/uptime-monitor` for checks showing down/degraded
- Confirm alerts map to real incidents and not false positives
- Watch SSL `days_remaining` for expiring certificates

### Weekly

- Verify check intervals match client SLAs
- Add checks for new client websites
- Review 7-day uptime percentages for trend anomalies

### Monthly

- Run `GET /checks/:id/uptime` for 90-day reporting to clients
- Audit paused checks (`status != 'active'`) and re-enable or delete
- Clean up results older than 12 months

## Common Failures

### 1. Check Shows Down but Site Is Fine

**Symptoms**: False negative on status
**Causes**: Timeout too low, expected status code wrong, worker network restrictions
**Resolution**:

1. Test the URL from the worker's network
2. Adjust `timeout_seconds` and `expected_status_code`
3. Confirm `check_type` matches the protocol (http vs https)

### 2. No Results for a Check

**Symptoms**: Check created but no `uptime_results` rows
**Causes**: Worker task not scheduled for the check
**Resolution**:

1. Verify `status = 'active'` and a valid URL
2. Check worker logs for the uptime-monitor task
3. Confirm `check_interval_minutes` is reasonable

### 3. Uptime Percent Always 100

**Symptoms**: 100.00 despite outages
**Causes**: No down results recorded, or only a single result
**Resolution**:

1. Query `uptime_results` history: `SELECT count(*), bool_and(is_up) FROM uptime_results WHERE check_id = '<id>';`
2. Confirm the worker ran during the outage window

### 4. SSL Not Tracked

**Symptoms**: `ssl_days_remaining` null
**Causes**: `check_type` not https, or result rows predate SSL capture
**Resolution**: Switch the check to `check_type: 'https'` and re-run

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/uptime-monitor/dashboard?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Results without a response status
SELECT * FROM uptime_results WHERE response_status IS NULL AND is_up = true;

-- Checks never checked
SELECT url FROM uptime_checks c
WHERE NOT EXISTS (SELECT 1 FROM uptime_results r WHERE r.check_id = c.id);
```

## Escalation

| Severity | Contact           | SLA    |
| -------- | ----------------- | ------ |
| P1       | Platform Engineer | 30 min |
| P2       | Backend Engineer  | 2 hrs  |
| P3       | Frontend Engineer | 1 day  |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS uptime_results;
DROP TABLE IF EXISTS uptime_checks;
```

### API Rollback

1. Revert `/api/v1/uptime-monitor` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/uptime-monitor.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `uptime_check_status` (gauge) - up/down per check
- **Metric**: `uptime_percentage_30d` (gauge) - per check
- **Alert**: Check down for 3 consecutive runs → P1
- **Alert**: SSL expiring within 14 days → P2
- **Alert**: Overall uptime < 99.5% over 30 days → P2

## Related Documentation

- Feature spec: `docs/features/website-uptime-monitor.md`
- Database schema: `supabase/migrations/5302093_uptime_monitor.sql`
