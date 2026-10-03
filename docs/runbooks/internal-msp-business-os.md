# Internal MSP Business OS - Runbook

## Owner

Platform Engineering / MSP Operations Leadership

## Normal Operation

### Daily

- Review the Business OS Dashboard for org health anomalies (orgs with high open tickets)
- Escalate overdue approvals from the "Overdue Approvals" panel

### Weekly

- Verify summary counters match underlying module lists (tickets, projects, documents)
- Confirm the `business-os-snapshot` worker task is producing trend data

### Monthly

- Review recent-activity feed for audit gaps
- Compare org-health rankings month over month

## Common Failures

### 1. Dashboard Shows Zeros

**Symptoms**: All stat cards render 0
**Causes**:

- API call failed; the page degrades gracefully (`Promise.allSettled`) to zero defaults
- `requireAdmin` rejected and page bounced (would be a redirect, not zeros)
  **Resolution**:

1. Verify the API is reachable: `curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/business-os/summary"`
2. Check the underlying tables have rows: `SELECT count(*) FROM tickets; SELECT count(*) FROM projects;`
3. Review web server logs for failed dashboard calls

### 2. Activity Feed Empty

**Symptoms**: "No recent activity" in Platform Activity
**Causes**:

- No audit_logs rows
- recent-activity cache (15s) serving an old empty response
  **Resolution**:

1. Verify audit events: `SELECT count(*) FROM audit_logs;`
2. Wait out the 15s cache TTL and refresh
3. Confirm audit logging is enabled on mutation endpoints

### 3. Cached Counts Stale

**Symptoms**: Numbers lag recent changes
**Causes**:

- Response cache TTLs (summary 30s, org-health 60s)
  **Resolution**:

1. Confirm the TTL elapsed before judging staleness
2. Verify cache keys are mount-scoped (`baseUrl + path` fix) so different endpoints don't collide

### 4. 403 on Load

**Symptoms**: Business OS dashboard bounces or denies access
**Causes**:

- Caller lacks admin/super_admin role in an approved membership
  **Resolution**:

1. Confirm role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid();`
2. Business OS is intentionally admin-only (no portal route)

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/business-os/summary"
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/business-os/approvals-overdue"
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/business-os/org-health"
```

### Data Integrity

```sql
-- Summary should reconcile
SELECT (SELECT count(*) FROM organizations WHERE status = 'approved') AS approved_orgs,
       (SELECT count(*) FROM tickets WHERE status NOT IN ('resolved','closed','completed')) AS open_tickets,
       (SELECT count(*) FROM projects WHERE status = 'active') AS active_projects;

-- Overdue approvals
SELECT id, request_subject, due_at FROM approval_requests
WHERE status = 'pending' AND due_at < now();

-- Recent activity source
SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

## Escalation

| Severity                          | Contact           | SLA            |
| --------------------------------- | ----------------- | -------------- |
| P0 - Business OS unreachable      | Platform Engineer | 30 min         |
| P1 - Endpoint 5xx/aggregation bug | Backend Engineer  | 2 hours        |
| P2 - Cache staleness              | Backend Engineer  | 4 hours        |
| P3 - Dashboard rendering issues   | Frontend Engineer | 1 business day |

## Rollback Notes

### API Rollback

1. Revert `apps/api/src/routes/business-os.ts`
2. Revert `apps/api/src/app.ts` mount at `/api/v1/business-os`
3. Deploy previous API image

### Web Rollback

1. Revert `apps/web/app/(admin)/admin/business-os/page.tsx`
2. Deploy previous Web image

## Monitoring

- **Metric**: `business_os_summary_ms` (histogram) - summary endpoint latency
- **Metric**: `orgs_by_open_tickets` (gauge) - top orgs by open tickets
- **Metric**: `overdue_approvals` (gauge)
- **Alert**: Summary p95 > 5s → P2
- **Alert**: Any org with > 50 open tickets → P2

## Related Documentation

- Feature spec: `docs/features/internal-msp-business-os.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Admin E2E: `apps/web/e2e/admin/business-os.spec.ts`
