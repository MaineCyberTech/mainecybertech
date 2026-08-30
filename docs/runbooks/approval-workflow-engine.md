# Approval Workflow Engine - Runbook

## Owner

Platform Engineering / Governance Lead

## Normal Operation

### Daily

- Review pending approvals with approaching `due_at` deadlines
- Confirm approvers can access `/portal/approvals`
- Check rejected requests have `rejection_reason` populated

### Weekly

- Audit approval turnaround time (created → decided)
- Review approval volume by `request_type`
- Verify timeline and comment endpoints return complete histories

### Monthly

- Review stale pending requests and cancel or reassign them
- Validate source module linkage for module-originated requests
- Confirm RLS and org scoping on all approval endpoints

## Common Failures

### 1. Approval List Empty

**Symptoms**: `/portal/approvals` shows no requests
**Causes**:

- No requests created for the org
- Requests created under a different org
  **Resolution**:

1. Create a test request via `POST /api/v1/approvals`
2. Verify the row: `SELECT * FROM approval_requests WHERE organization_id = '...'`

### 2. Approve/Reject Fails

**Symptoms**: Decision endpoint returns 400
**Causes**:

- Request already decided
- State transition not valid (only `pending` can be decided)
  **Resolution**:

1. Check status: `SELECT status FROM approval_requests WHERE id = '...'`
2. Only pending requests can be approved/rejected/cancelled

### 3. Optimistic Lock Conflict

**Symptoms**: PATCH fails with version conflict
**Causes**:

- Concurrent modification by another user
  **Resolution**:

1. Refresh the record to get the latest `version`
2. Retry with the current version header

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/approvals?organization_id=$ORG_ID"

curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/approvals/stats?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Requests decided but missing reviewer attribution
SELECT * FROM approval_requests
WHERE status IN ('approved', 'rejected')
AND approved_by IS NULL AND rejected_by IS NULL;

-- Stale pending requests
SELECT * FROM approval_requests
WHERE status = 'pending' AND due_at < now();

-- Status distribution
SELECT status, count(*) FROM approval_requests GROUP BY status;
```

## Escalation

| Severity                          | Contact           | SLA            |
| --------------------------------- | ----------------- | -------------- |
| P0 - Approval module unavailable  | Platform Engineer | 30 min         |
| P1 - Decision endpoints failing   | Backend Engineer  | 2 hours        |
| P2 - Approval stats/export issues | Backend Engineer  | 4 hours        |
| P3 - Timeline/comment UX bugs     | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS approval_requests;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/approvals.ts`
3. Revert `apps/api/src/validators/approvals.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/approvals/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `approvals_pending` (gauge) - count of pending requests
- **Metric**: `approval_decision_latency_hours` (histogram) - time to decide
- **Alert**: Pending approvals past `due_at` → P2
- **Alert**: Approval endpoint error rate > 5% → P1

## Related Documentation

- Feature spec: `docs/features/approval-workflow-engine.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302058_shared_module_tables.sql`
