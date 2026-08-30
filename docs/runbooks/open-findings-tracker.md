# Open Findings Tracker - Runbook

## Owner

Platform Engineering / Security Operations

## Normal Operation

### Daily

- Review P0/P1 open findings for overdue remediation deadlines
- Confirm resolved findings are being verified

### Weekly

- Run the stats endpoint and review severity/status distribution
- Escalate findings past their `remediation_deadline`

### Monthly

- Audit verified findings for completeness
- Export the open-findings list for client security reviews

## Common Failures

### 1. Cannot Resolve a Finding

**Symptoms**: `POST /:id/resolve` returns 400 INVALID_STATE
**Causes**:

- Finding status is not `open` or `in_progress` (e.g. already `resolved` or `verified`)
  **Resolution**:

1. Check status: `SELECT id, title, status FROM findings WHERE id = '...';`
2. Only open/in_progress findings can be resolved; verified findings are terminal

### 2. Cannot Verify a Finding

**Symptoms**: `POST /:id/verify` returns 400 INVALID_STATE
**Causes**:

- Finding status is not `resolved`
  **Resolution**:

1. Ensure the finding was resolved first
2. Only resolved findings can be marked verified

### 3. Version Conflict (409)

**Symptoms**: Update/resolve/verify returns VERSION_CONFLICT
**Causes**:

- Another user modified the finding between fetch and write
  **Resolution**:

1. Refresh the finding and re-apply changes
2. Use the latest `version` for optimistic locking

### 4. Portal Findings List Empty

**Symptoms**: "No findings reported"
**Causes**:

- No findings for the org
- RLS policy `findings_select_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM findings WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`
3. Test API directly with the org query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/findings?organization_id=$ORG"

# Stats
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/findings/stats?organization_id=$ORG"
```

### Data Integrity

```sql
-- Overdue open findings
SELECT id, title, severity, remediation_deadline FROM findings
WHERE status IN ('open','in_progress') AND remediation_deadline < now();

-- Resolved but never verified
SELECT id, title, resolved_at FROM findings WHERE status = 'resolved';

-- Severity distribution
SELECT severity, status, count(*) FROM findings GROUP BY severity, status;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - P0 finding not tracked        | Platform Engineer | 30 min         |
| P1 - Resolve/verify endpoints down | Backend Engineer  | 2 hours        |
| P2 - Overdue remediation queue     | Security Lead     | 4 hours        |
| P3 - Stats/export accuracy         | Backend Engineer  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS findings;
```

### API Rollback

1. Revert `apps/api/src/routes/findings.ts`
2. Revert `apps/api/src/validators/findings.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/findings/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `findings_open_p0` (gauge) - open P0 count
- **Metric**: `findings_overdue` (gauge) - past remediation deadline
- **Metric**: `findings_resolve_to_verify_ratio` (rate)
- **Alert**: Open P0 findings > 0 for 48h → P1
- **Alert**: Overdue findings > 10 → P2

## Related Documentation

- Feature spec: `docs/features/open-findings-tracker.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302060_findings_tracker.sql`
