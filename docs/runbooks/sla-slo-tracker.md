# SLA/SLO Tracker - Runbook

## Owner

Platform Engineering / Service Desk Manager

## Normal Operation

### Daily

- Review breach rates on the SLA metrics dashboard
- Identify tickets approaching breach on `first_response` and `resolution` metrics
- Confirm SLA logs are being created per ticket lifecycle

### Weekly

- Compare breach rate against SLO targets
- Review per-metric average minutes for outliers
- Verify `calculate_sla_breach()` function correctness

### Monthly

- Adjust `target_minutes` for changed service contracts
- Audit the `days` window used for reporting
- Review RLS policy for SLA log inserts (admin/super_admin only)

## Common Failures

### 1. Empty Metrics Dashboard

**Symptoms**: `/portal/sla` shows zero summary stats
**Causes**:

- No SLA logs in the selected window for the org
- `days` filter excludes all logs
  **Resolution**:

1. Verify logs exist: `SELECT * FROM sla_logs WHERE organization_id = '...'`
2. Check `created_at` falls within the requested window

### 2. Breach Rate Always 0%

**Symptoms**: Dashboard never reports breaches
**Causes**:

- `breached` flag never set on logs
  **Resolution**:

1. Check flags: `SELECT metric, breached, actual_minutes FROM sla_logs WHERE organization_id = '...'`
2. Ensure ticket lifecycle sets `breached` when elapsed exceeds `target_minutes`

### 3. By Metric Section Missing

**Symptoms**: Per-metric breakdown does not render
**Causes**:

- No SLA logs returned by the metrics endpoint
  **Resolution**:

1. The breakdown only renders when logs exist
2. Confirm the org has SLA activity in the window

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/sla/metrics?organization_id=$ORG_ID&days=30"
```

### Data Integrity

```sql
-- Breached logs without breach timestamp
SELECT * FROM sla_logs WHERE breached = true AND breached_at IS NULL;

-- Logs with actual minutes exceeding target but not flagged
SELECT * FROM sla_logs WHERE actual_minutes IS NOT NULL AND actual_minutes > target_minutes AND breached = false;

-- Metric distribution
SELECT metric, count(*), count(*) FILTER (WHERE breached) AS breached_count FROM sla_logs GROUP BY metric;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P0 - SLA dashboard unavailable | Platform Engineer | 30 min         |
| P1 - Metrics endpoint failing  | Backend Engineer  | 2 hours        |
| P2 - Breach calculation errors | Backend Engineer  | 4 hours        |
| P3 - SLA dashboard UX bugs     | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS sla_logs;
DROP FUNCTION IF EXISTS calculate_sla_breach(timestamptz, int);
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/sla.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/sla/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `sla_breach_rate` (gauge) - breaches / total in window
- **Metric**: `sla_response_avg_minutes` (gauge) - average response minutes
- **Alert**: Breach rate > 10% in a day → P1
- **Alert**: Zero SLA logs created in 24h (expected volume) → P2

## Related Documentation

- Feature spec: `docs/features/sla-slo-tracker.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302041_sla_logs.sql`
