# Patch Compliance Dashboard - Runbook

## Owner

Platform Engineering / Security Operations Lead

## Normal Operation

### Daily

- Review patch compliance rows for critical patch backlogs
- Confirm device group counts are accurate
- Check compliance percentages against security baselines

### Weekly

- Validate patching progress across device groups
- Review exception counts and justifications
- Verify maintenance windows are scheduled

### Monthly

- Produce compliance reports from the stats endpoint
- Adjust device group definitions for fleet changes
- Review RLS and org scoping on compliance endpoints

## Common Failures

### 1. Compliance List Empty

**Symptoms**: `/portal/patch-compliance` shows no device groups
**Causes**:

- No compliance rows recorded for the org
  **Resolution**:

1. Create a test row via `POST /api/v1/security-ops/patch-compliance`
2. Verify the row: `SELECT * FROM patch_compliance WHERE organization_id = '...'`

### 2. Stats Show Zero

**Symptoms**: `GET /api/v1/security-ops/patch-compliance/stats` returns zeros
**Causes**:

- No compliance rows exist for the org
  **Resolution**:

1. Confirm rows exist: `SELECT count(*) FROM patch_compliance WHERE organization_id = '...'`
2. Verify device counts are populated on the rows

### 3. Compliance % Missing

**Symptoms**: Compliance percentage is null on rows
**Causes**:

- `compliance_pct` not computed on insert/update
  **Resolution**:

1. Compute from counts: `patched_devices / total_devices`
2. Update the row via PATCH with the correct percentage

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/security-ops/patch-compliance?organization_id=$ORG_ID"

curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/security-ops/patch-compliance/stats?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Rows where patched exceeds total
SELECT * FROM patch_compliance WHERE patched_devices > total_devices;

-- Rows with critical patches but no pending count
SELECT * FROM patch_compliance WHERE critical_patches > 0 AND pending_patches = 0;

-- Status distribution
SELECT status, count(*) FROM patch_compliance GROUP BY status;
```

## Escalation

| Severity                          | Contact           | SLA            |
| --------------------------------- | ----------------- | -------------- |
| P0 - Patch compliance module down | Platform Engineer | 30 min         |
| P1 - Compliance endpoints failing | Backend Engineer  | 2 hours        |
| P2 - Compliance data integrity    | Backend Engineer  | 4 hours        |
| P3 - Compliance dashboard UX bugs | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS patch_compliance;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/security-ops.ts`
3. Revert `apps/api/src/validators/security-ops.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/patch-compliance/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `patch_compliance_rate` (gauge) - overall compliance percentage
- **Metric**: `patch_critical_backlog` (gauge) - sum of critical patches
- **Alert**: Compliance rate < 85% → P1
- **Alert**: Critical patches > 0 and no maintenance window scheduled → P2

## Related Documentation

- Feature spec: `docs/features/patch-compliance-dashboard.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302069_security_ops.sql`
