# Change Advisory (Mini-CAB) - Runbook

## Owner

MSP Change Manager / Service Delivery Lead

## Normal Operation

### Daily

- Process change requests in `pending_review` status
- Confirm high-risk (`risk_level` high/critical) changes are escalated to the full CAB
- Verify implementation windows don't overlap for critical clients

### Weekly

- Review implemented changes and close any pending verification steps
- Audit rejected changes to identify recurring root causes
- Review rollback plans for adequacy on major changes

### Monthly

- Report change success/failure rates to leadership
- Review `verification_steps` quality and enforce evidence collection
- Tune the mini-CAB membership and approval thresholds

## Common Failures

### 1. Change Stuck in Draft

**Symptoms**: Change requests never reach review
**Causes**:

- Engineer never called submit
- Status not `draft` on submit attempt
  **Resolution**:

1. Confirm status: `SELECT id, status FROM change_requests WHERE id = '...'`
2. Call `POST /api/v1/governance/change-requests/:id/submit` to move to `pending_review`

### 2. Approve/Reject Not Working

**Symptoms**: 409 on approve/reject
**Causes**:

- Status is not `pending_review`
- Change already decided
  **Resolution**:

1. Check status via the detail endpoint
2. Only `pending_review` changes can be approved or rejected; if already decided the 409 is correct

### 3. Implement Fails

**Symptoms**: `POST /:id/implement` returns 400
**Causes**:

- Change not yet approved
  **Resolution**:

1. Ensure status is `approved` first
2. Re-run the implement call after approval

### 4. Audit Trail Missing

**Symptoms**: No `change_request.*` events in audit log
**Causes**:

- Audit insert failure on the transition endpoint
  **Resolution**:

1. Check `audit_logs` for the entity_id
2. Confirm the transition API returned success; re-trigger if needed

## Verification Steps

### Health Check

```bash
# API list
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/governance/change-requests?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM change_requests;"
```

### Data Integrity

```sql
-- Pending changes awaiting review
SELECT id, title, risk_level FROM change_requests WHERE status = 'pending_review';

-- Implemented but never verified
SELECT id, title, implemented_at FROM change_requests
WHERE status = 'implemented';

-- Approved changes without rollback plan
SELECT id, title FROM change_requests
WHERE status IN ('approved', 'implemented', 'verified') AND (rollback_plan IS NULL OR rollback_plan = '');
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - No change requests accessible | Platform Engineer | 30 min         |
| P1 - Approval workflow broken      | Backend Engineer  | 2 hours        |
| P2 - Verification not closing      | Backend Engineer  | 4 hours        |
| P3 - Change status audit gaps      | Compliance        | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302071 causes issues:
DROP TABLE IF EXISTS change_requests;
```

### API Rollback

1. Revert `apps/api/src/routes/governance.ts` route registration
2. Revert `apps/api/src/validators/governance.ts` schema changes
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/change-requests/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `change_requests_pending` (gauge) - count of pending changes
- **Metric**: `change_implementation_time` (histogram) - time from approval to implementation
- **Metric**: `change_success_rate` (gauge) - % of implemented changes verified
- **Alert**: Pending changes > 10 for 24 hours → P2
- **Alert**: High-risk change implemented without verification → P1

## Related Documentation

- Feature spec: `docs/features/change-advisory-mini-cab.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302071_governance.sql`
