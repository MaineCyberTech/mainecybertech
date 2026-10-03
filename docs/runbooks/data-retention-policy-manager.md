# Data Retention Policy Manager - Runbook

## Owner

Governance Lead / Compliance Sponsor

## Normal Operation

### Daily

- Review policies approaching their `next_review_at`
- Flag regulated data categories missing a `regulation_reference`
- Check that no policy has a `retention_period_days` that conflicts with regulations

### Weekly

- Run a retention policy audit against regulated data stores
- Verify disposal methods are documented for regulated categories
- Update `last_reviewed_at` / `next_review_at` after reviews

### Monthly

- Report retention coverage to leadership
- Confirm new systems are registered with a policy (`system_name` present)
- Remove or deactivate obsolete policies

## Common Failures

### 1. Policy Review Overdue

**Symptoms**: Policies with `next_review_at` in the past
**Causes**:

- Review cadence not maintained
- Policy created without a `next_review_at`

**Resolution**:

1. Find overdue: `SELECT data_category, system_name, next_review_at FROM retention_policies WHERE next_review_at < now()`
2. Review the policy and update `last_reviewed_at`, then set a new `next_review_at`
3. Document the review in `notes`

### 2. Regulated Data Missing Reference

**Symptoms**: `is_regulated = true` with null `regulation_reference`
**Causes**:

- Policy created without the reference
- Regulation mapping not updated

**Resolution**:

1. Find incomplete: `SELECT data_category, system_name FROM retention_policies WHERE is_regulated = true AND regulation_reference IS NULL`
2. PATCH each policy with the correct `regulation_reference`
3. Confirm the reference matches an actual regulation/control

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid policy IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/governance/retention?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM retention_policies;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'retention_policies';"
```

### Data Integrity

```sql
-- Policies with invalid retention periods
SELECT data_category, system_name FROM retention_policies WHERE retention_period_days <= 0;

-- Regulated policies without a reference
SELECT data_category, system_name FROM retention_policies WHERE is_regulated = true AND regulation_reference IS NULL;

-- Overdue reviews
SELECT data_category, system_name, next_review_at FROM retention_policies WHERE next_review_at < now();

-- Status distribution
SELECT status, count(*) FROM retention_policies GROUP BY status;
```

## Escalation

| Severity                              | Contact           | SLA            |
| ------------------------------------- | ----------------- | -------------- |
| P0 - No retention policies accessible | Platform Engineer | 30 min         |
| P1 - Retention API broken             | Backend Engineer  | 2 hours        |
| P2 - Regulated data unmapped          | Governance Lead   | 4 hours        |
| P3 - Review cadence overdue           | Governance Lead   | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302071 causes issues:
DROP TABLE IF EXISTS retention_policies;
```

### API Rollback

1. Revert `apps/api/src/routes/governance.ts` retention registration
2. Revert `apps/api/src/validators/governance.ts` `createRetentionSchema`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/data-retention/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `retention_policies_active` (gauge) - active policies per org
- **Metric**: `retention_policies_overdue_review` (gauge) - policies past `next_review_at`
- **Metric**: `retention_regulated_unmapped` (gauge) - regulated policies without a reference
- **Alert**: Regulated policy missing `regulation_reference` for 7 days → P2
- **Alert**: Retention API 5xx → P1

## Related Documentation

- Feature spec: `docs/features/data-retention-policy-manager.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302071_governance.sql`
