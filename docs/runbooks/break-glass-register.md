# Break Glass Register - Runbook

## Owner

MSP Security Operations Lead

## Normal Operation

### Daily

- Review break glass accounts for upcoming `next_rotation_at` dates
- Check for accounts with `last_used_at` that indicate abnormal use
- Verify custodians are current

### Weekly

- Confirm rotation schedule is being met
- Spot-check `access_procedure` documentation is still accurate
- Test one account's login path (`last_tested_at`) on a rotating basis

### Monthly

- Full rotation cycle review across all accounts
- Update `test_notes` after scheduled testing
- Report rotation compliance to leadership

## Common Failures

### 1. Rotation Overdue

**Symptoms**: Accounts with `next_rotation_at` in the past
**Causes**:

- Rotation not performed
- New account created without a rotation date

**Resolution**:

1. Find overdue: `SELECT account_name, system, next_rotation_at FROM break_glass_accounts WHERE next_rotation_at < now()`
2. Rotate the credential following the documented `access_procedure`
3. PATCH `last_rotated_at` and set a new `next_rotation_at`

### 2. Custodian Unassigned

**Symptoms**: Account cards show "Custodian: N/A"
**Causes**:

- `custodian_name` never populated
- Custodian left the organization

**Resolution**:

1. Find unassigned: `SELECT account_name, system FROM break_glass_accounts WHERE custodian_name IS NULL`
2. Assign a current named custodian via PATCH
3. Update `access_procedure` if custody changed

### 3. Credential Never Tested

**Symptoms**: `last_tested_at` is null or stale
**Causes**:

- Testing not scheduled
- Access procedure not followed

**Resolution**:

1. Find untested: `SELECT account_name, system FROM break_glass_accounts WHERE last_tested_at IS NULL`
2. Perform a controlled login test
3. PATCH `last_tested_at` and record `test_notes`

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid account IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/security-ops/break-glass?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM break_glass_accounts;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'break_glass_accounts';"
```

### Data Integrity

```sql
-- Rotation overdue
SELECT account_name, system, next_rotation_at FROM break_glass_accounts WHERE next_rotation_at < now();

-- Never tested
SELECT account_name, system FROM break_glass_accounts WHERE last_tested_at IS NULL;

-- Missing custodian
SELECT account_name, system FROM break_glass_accounts WHERE custodian_name IS NULL;

-- Status distribution
SELECT status, count(*) FROM break_glass_accounts GROUP BY status;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - No break glass data accessible | Platform Engineer | 30 min         |
| P1 - Break glass API broken         | Backend Engineer  | 2 hours        |
| P2 - Rotation overdue               | Security Analyst  | 4 hours        |
| P3 - Access procedure stale         | Security Analyst  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302069 causes issues:
DROP TABLE IF EXISTS break_glass_accounts;
```

### API Rollback

1. Revert `apps/api/src/routes/security-ops.ts` break-glass registration
2. Revert `apps/api/src/validators/security-ops.ts` `createBreakGlassSchema`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/break-glass/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `break_glass_accounts_total` (gauge) - accounts per org
- **Metric**: `break_glass_rotation_overdue` (gauge) - accounts past `next_rotation_at`
- **Metric**: `break_glass_never_tested` (gauge) - accounts with null `last_tested_at`
- **Alert**: Rotation overdue > 3 days → P2
- **Alert**: Break glass API 5xx → P1

## Related Documentation

- Feature spec: `docs/features/break-glass-register.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302069_security_ops.sql`
