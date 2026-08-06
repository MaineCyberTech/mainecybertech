# Endpoint Security Coverage - Runbook

## Owner

Platform Engineering / MSP Security Operations Lead

## Normal Operation

### Daily

- Review endpoint groups with low `coverage_pct` in the portal
- Check for groups where `av_installed`, `disk_encrypted`, or `mdm_enrolled` lag `total_endpoints`
- Verify no new device groups are missing registration

### Weekly

- Run the org-wide coverage summary (`GET /api/v1/security-suite/endpoint-security/coverage`)
- Compare AV / encryption / MDM coverage against client security baselines
- Follow up on groups that have been under-covered for more than a week

### Monthly

- Audit `status` values across groups and clean up stale records
- Review `notes` for remediation history accuracy
- Report coverage trend to leadership for each client

## Common Failures

### 1. Coverage Summary Shows 0%

**Symptoms**: `GET /endpoint-security/coverage` returns zeros
**Causes**:

- No `endpoint_security` rows for the org
- `total_endpoints` is 0 or unpopulated
- RLS policy blocking the admin client

**Resolution**:

1. Verify rows exist: `SELECT count(*) FROM endpoint_security WHERE organization_id = '...'`
2. Confirm `total_endpoints` is populated on each group
3. Test the API directly with an admin token

### 2. Coverage Percentage Over 100

**Symptoms**: Per-group coverage renders above 100%
**Causes**:

- Sub-counts (`av_installed`, `disk_encrypted`, `mdm_enrolled`) exceed `total_endpoints`
- Data-entry error from a manual import

**Resolution**:

1. Identify the group: `SELECT device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled FROM endpoint_security WHERE coverage_pct > 100`
2. Correct counts via PATCH so sub-counts never exceed total
3. Recompute `coverage_pct`

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid group IDs
**Causes**:

- User not in organization memberships
- Membership role insufficient for write operations
- Organization ID mismatch in request

**Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Check role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid() AND m.organization_id = '...'`
3. Ensure API request includes the correct `organization_id` query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/security-suite/endpoint-security?organization_id=$ORG

# Coverage summary
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/security-suite/endpoint-security/coverage?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM endpoint_security;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'endpoint_security';"
```

### Data Integrity

```sql
-- Groups where sub-counts exceed total
SELECT device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled
FROM endpoint_security
WHERE av_installed > total_endpoints OR disk_encrypted > total_endpoints OR mdm_enrolled > total_endpoints;

-- Coverage by status
SELECT status, count(*) FROM endpoint_security GROUP BY status;

-- Groups never updated
SELECT device_group, updated_at FROM endpoint_security ORDER BY updated_at ASC LIMIT 10;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P0 - No endpoint coverage data | Platform Engineer | 30 min         |
| P1 - Coverage summary broken   | Backend Engineer  | 2 hours        |
| P2 - Group counts inaccurate   | Security Analyst  | 4 hours        |
| P3 - Notes / status cleanup    | Security Analyst  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302070 causes issues:
DROP TABLE IF EXISTS endpoint_security;
```

### API Rollback

1. Revert `apps/api/src/routes/security-suite.ts` endpoint-security registration
2. Revert `apps/api/src/validators/security-suite.ts` `createEndpointSchema`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/endpoint-security/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `endpoint_groups_total` (gauge) - count of endpoint groups per org
- **Metric**: `endpoint_coverage_percent` (gauge) - group coverage percentage
- **Metric**: `endpoint_groups_low_coverage` (gauge) - groups below coverage target
- **Alert**: Any group with `coverage_pct` below 80% for 7 days → P2
- **Alert**: Coverage summary failing (5xx) → P1

## Related Documentation

- Feature spec: `docs/features/endpoint-security-coverage.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302070_security_suite.sql`
