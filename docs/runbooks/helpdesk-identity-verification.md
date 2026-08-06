# Helpdesk Identity Verification - Runbook

## Owner

Platform Engineering / Helpdesk & Security Operations

## Normal Operation

### Daily

- Review pending verification requests older than 24 hours
- Confirm authorized actions were completed and recorded

### Weekly

- Audit records where `verification_pass = false` to identify repeated failed verifications
- Verify authorized actions map to real helpdesk tickets/changes

### Monthly

- Review verification method distribution (email vs phone vs MFA)
- Archive or prune old verification records per retention policy

## Common Failures

### 1. Records Stuck in "Pending"

**Symptoms**: Multiple records with status `pending` for days
**Causes**:

- Verify step not completed
- Technician bypassed the workflow
  **Resolution**:

1. List pending records: `SELECT id, requestor_name, requestor_email, created_at FROM identity_verifications WHERE status = 'pending';`
2. Complete the verify step: `POST /api/v1/security-suite/identity-verification/:id/verify`
3. Retrain technicians on the required verification workflow

### 2. Verification List Empty

**Symptoms**: Portal shows "No verification requests found"
**Causes**:

- No records for the org
- RLS policy `idverify_select_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM identity_verifications WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`
3. Test API directly with the org query param

### 3. Duplicate/Unlogged Verifications

**Symptoms**: Authorized actions without a verification record
**Causes**:

- Technicians not using the module
- No enforcement on sensitive actions
  **Resolution**:

1. Cross-reference authorized actions against identity_verifications
2. Confirm audit events `identity-verification.*` appear in `audit_logs`

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/security-suite/identity-verification?organization_id=$ORG"
```

### Data Integrity

```sql
-- Pending older than 24h
SELECT id, requestor_name, created_at FROM identity_verifications
WHERE status = 'pending' AND created_at < now() - interval '24 hours';

-- Failed verifications
SELECT requestor_name, requestor_email, verification_method, count(*)
FROM identity_verifications WHERE verification_pass = false GROUP BY 1, 2, 3;

-- Authorized actions audit trail
SELECT requestor_name, action_authorized, authorized_at FROM identity_verifications
WHERE action_authorized IS NOT NULL ORDER BY authorized_at DESC;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - No verification records stored | Platform Engineer | 30 min         |
| P1 - Verification endpoint broken   | Backend Engineer  | 2 hours        |
| P2 - Pending queue backlog          | Helpdesk Lead     | 4 hours        |
| P3 - Reporting/export issues        | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS identity_verifications;
```

### API Rollback

1. Revert `apps/api/src/routes/security-suite.ts`
2. Revert `apps/api/src/validators/security-suite.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/identity-verification/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `id_verify_pending` (gauge) - pending verification count
- **Metric**: `id_verify_failure_rate` (rate) - failed verifications
- **Alert**: Pending > 50 for 24h → P2
- **Alert**: Verification endpoint 5xx rate > 5% → P1

## Related Documentation

- Feature spec: `docs/features/helpdesk-identity-verification.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302070_security_suite.sql`
