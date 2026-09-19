# Cyber Insurance Binder - Runbook

## Owner

Compliance Consultant / Risk Manager

## Normal Operation

### Daily

- Review `portal/insurance-binder` for evidence approaching `expiry_date`
- Check items stuck in `pending` that should be verified

### Weekly

- Verify submitted evidence and set status to `verified`
- Follow up on coverage areas with no evidence via the coverage report
- Update policy numbers/providers as renewals land

### Monthly

- Pull `GET /insurance-binder/coverage-report` for client gap analysis
- Report binder completeness to account management
- Archive expired items or request fresh certificates

## Common Failures

### 1. Expired Items Not Flagged

**Symptoms**: Evidence shows expired on the policy but status is `verified`
**Causes**: `expiry_date` passed without status update
**Resolution**:

1. Query: `SELECT title, expiry_date, status FROM insurance_evidence WHERE expiry_date < now();`
2. PATCH each row to `status: 'expired'`

### 2. Coverage Report Shows Missing Areas

**Symptoms**: A coverage area (e.g., data_backup) shows 0 evidence
**Causes**: No evidence row with that `coverage_area`
**Resolution**:

1. Verify the 8 coverage areas: `network_security`, `endpoint_protection`, `access_control`, `data_backup`, `incident_response`, `employee_training`, `vendor_management`, `compliance`
2. Create evidence rows for the missing areas

### 3. Verify Timestamp Not Set

**Symptoms**: `last_verified_at` null on verified items
**Causes**: Status set to `verified` without passing through the API
**Resolution**: Re-verify via `PATCH` — the API stamps `last_verified_at` automatically when status is `verified`

### 4. Delete Denied (403)

**Symptoms**: DELETE returns 403
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/insurance-binder/coverage-report?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Verified items without timestamp
SELECT id, title FROM insurance_evidence WHERE status = 'verified' AND last_verified_at IS NULL;

-- Duplicate policy numbers
SELECT policy_number, count(*) FROM insurance_evidence GROUP BY policy_number HAVING count(*) > 1;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P1       | Compliance Lead   | 2 hrs |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS insurance_evidence;
```

### API Rollback

1. Revert `/api/v1/insurance-binder` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/insurance-binder.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `insurance_binder_completeness` (gauge) - % coverage areas covered
- **Metric**: `insurance_evidence_expiring_30d` (gauge) - items expiring soon
- **Alert**: Binder completeness < 60% 60 days before renewal → P1
- **Alert**: More than 3 items expired and unverified → P2

## Related Documentation

- Feature spec: `docs/features/cyber-insurance-binder.md`
- Database schema: `supabase/migrations/5302091_insurance_binder.sql`
