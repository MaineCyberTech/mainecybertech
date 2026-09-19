# DNS Change Request Approvals - Runbook

## Owner

MSP Network Engineer / Change Management Lead

## Normal Operation

### Daily

- Review `pending` DNS change requests for approval or rejection
- Verify `current_value` and `proposed_value` against authoritative DNS
- Check for duplicate or conflicting requests on the same domain

### Weekly

- Confirm `implemented` requests actually took effect at the provider
- Review rejected requests for patterns or recurring issues
- Ensure audit trail is complete for implemented changes

### Monthly

- Report DNS change throughput and approval latency
- Audit that no request bypassed the workflow (direct DB writes)
- Clean up stale `pending` requests older than 30 days

## Common Failures

### 1. Cannot Approve a Request

**Symptoms**: `POST /dns-changes/:id/approve` returns 400 `INVALID_STATE`
**Causes**:

- Status is not `pending` (already approved/rejected/implemented)
- Concurrent workflow updated the record first

**Resolution**:

1. Check current status: `SELECT status FROM dns_change_requests WHERE id = '...'`
2. Only `pending` requests can be approved or rejected
3. If already `approved`, use the implement endpoint instead

### 2. Cannot Implement a Request

**Symptoms**: `POST /dns-changes/:id/implement` returns 400 `INVALID_STATE`
**Causes**:

- Status is not `approved`
- Request was rejected after approval

**Resolution**:

1. Confirm status: `SELECT status FROM dns_change_requests WHERE id = '...'`
2. Only `approved` requests can be implemented
3. Re-run approval if the request was reverted to pending

### 3. Change Not Reflected in DNS

**Symptoms**: Request marked `implemented` but records unchanged at provider
**Causes**:

- Provider propagation delay
- Record applied to wrong zone / provider
- Manual provider change failed silently

**Resolution**:

1. Verify against authoritative DNS with `nslookup`/`dig`
2. Check propagation (TTL-dependent)
3. Correct at the provider and confirm `proposed_value` matches

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid request IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/final/dns-changes?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM dns_change_requests;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'dns_change_requests';"
```

### Data Integrity

```sql
-- Requests stuck in pending for a long time
SELECT domain, change_type, created_at FROM dns_change_requests WHERE status = 'pending' AND created_at < now() - interval '30 days';

-- Implemented requests without implemented_at
SELECT domain FROM dns_change_requests WHERE status = 'implemented' AND implemented_at IS NULL;

-- Status distribution
SELECT status, count(*) FROM dns_change_requests GROUP BY status;

-- Duplicate pending requests on the same domain
SELECT domain, count(*) FROM dns_change_requests WHERE status = 'pending' GROUP BY domain HAVING count(*) > 1;
```

## Escalation

| Severity                             | Contact           | SLA            |
| ------------------------------------ | ----------------- | -------------- |
| P0 - No DNS change requests visible  | Platform Engineer | 30 min         |
| P1 - Approval/reject API broken      | Backend Engineer  | 2 hours        |
| P2 - Change implemented but not live | Network Engineer  | 4 hours        |
| P3 - Stale pending requests          | Network Engineer  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302074 causes issues:
DROP TABLE IF EXISTS dns_change_requests;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` dns-changes registration and workflow endpoints
2. Revert `apps/api/src/validators/final.ts` `dns`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/dns-changes/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `dns_change_requests_pending` (gauge) - pending requests per org
- **Metric**: `dns_change_approval_latency_hours` (histogram) - time pending → approved
- **Metric**: `dns_change_failure_rate` (gauge) - rejected/rolled-back requests
- **Alert**: Request pending > 7 days → P3
- **Alert**: `INVALID_STATE` errors > 5% of workflow calls → P2

## Related Documentation

- Feature spec: `docs/features/dns-change-request-approvals.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
