# M365 Hardening - Runbook

## Owner

Security Operations / M365 Engineering

## Normal Operation

### Daily

- Review new hardening records in `needs_review` status
- Flag tenants with `mfa_enforced = false` or `legacy_auth_blocked = false` for immediate remediation

### Weekly

- Run scans for tenants approaching `next_review_at`
- Update `overall_score` after remediation work
- Verify admin/guest counts stay within client agreements

### Monthly

- Full tenant sweep: confirm every client org has a current `m365_hardening` record
- Roll up average `overall_score` for leadership reporting
- Review guest access and shared mailbox hygiene

## Common Failures

### 1. Scan Endpoint 404

**Symptoms**: `POST /m365-hardening/:id/scan` returns 404
**Causes**:

- Record ID belongs to a different org than the active org
- Record was deleted
  **Resolution**:

1. Verify the ID: `SELECT id, organization_id FROM m365_hardening WHERE id = '<id>';`
2. Confirm the request passes the correct `organization_id`
3. Re-create the record if it was deleted

### 2. List Empty

**Symptoms**: Portal shows "0 tenant hardening checks"
**Causes**:

- No records for the active org
- RLS policy blocking select
- API error silently caught by page
  **Resolution**:

1. Query directly: `SELECT count(*) FROM m365_hardening WHERE organization_id = '<org>';`
2. Check RLS: `SELECT * FROM pg_policies WHERE tablename = 'm365_hardening';`
3. Verify membership status is `approved`

### 3. Score Out of Sync

**Symptoms**: `overall_score` does not reflect the boolean checks
**Causes**:

- Score set manually and never recomputed after check toggles
- PATCH omitted the score field
  **Resolution**:

1. Recompute score in the UI/API and PATCH `overall_score`
2. Verify the record's updated `updated_at` after write

### 4. Scan Timestamps Not Updated

**Symptoms**: `last_assessment_at` unchanged after scan
**Causes**:

- Scan called on a record in another org (404 path)
- Request rejected before reaching the handler
  **Resolution**:

1. Test the endpoint with an admin token directly
2. Confirm the response body contains `scannedAt`

## Verification Steps

### Health Check

```bash
# List hardening records for org
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/security-suite/m365-hardening?organization_id=$ORG_ID"

# Trigger scan
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/security-suite/m365-hardening/$ID/scan"
```

### Data Integrity

```sql
-- Tenants without MFA
SELECT tenant_domain, organization_id FROM m365_hardening
WHERE mfa_enforced = false;

-- Records missing next review
SELECT tenant_domain FROM m365_hardening
WHERE next_review_at IS NULL;

-- Score distribution
SELECT status, count(*) FROM m365_hardening GROUP BY status;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - M365 tenant compromise         | Security Incident | 15 min         |
| P1 - Hardening records inaccessible | Backend Engineer  | 2 hours        |
| P2 - Scan endpoint broken           | Backend Engineer  | 4 hours        |
| P3 - Score/review display issues    | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302070 causes issues (M365 tables only):
DROP TABLE IF EXISTS m365_hardening;
```

### API Rollback

1. Revert `apps/api/src/routes/security-suite.ts` crudRoute/scan changes
2. Revert `apps/api/src/validators/security-suite.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/m365-hardening/`
2. Revert admin page `apps/web/app/(admin)/admin/m365-hardening/`
3. Deploy previous Web image

## Monitoring

- **Metric**: `m365_hardening_records` (gauge) - total tenant records
- **Metric**: `m365_tenants_no_mfa` (gauge) - tenants with MFA not enforced
- **Metric**: `m365_avg_overall_score` (gauge) - average hardening score
- **Alert**: Any tenant with `mfa_enforced = false` beyond 7 days → P1
- **Alert**: Records without `next_review_at` older than 90 days → P2

## Related Documentation

- Feature spec: `docs/features/m365-hardening.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302070_security_suite.sql`
- Permission catalog: `supabase/migrations/5302118_permission_matrix_full_catalog.sql`
