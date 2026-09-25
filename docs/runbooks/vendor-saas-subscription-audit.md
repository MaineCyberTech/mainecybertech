# Vendor SaaS Subscription Audit - Runbook

## Owner

Account Management / IT Procurement

## Normal Operation

### Daily

- Review newly created SaaS records for completeness (vendor, service, cost)
- Flag records missing `monthly_cost`/`annual_cost` for follow-up

### Weekly

- Check upcoming `renewal_date` records and schedule renewal reviews
- Re-confirm `has_data_access` flags with the security team

### Monthly

- Produce cost roll-up report (total monthly/annual spend per org)
- Identify shadow IT (`classification = 'unknown'`) and low-usage apps for cancellation
- Review `cancellation_risk` labels against business continuity plans

## Common Failures

### 1. PATCH Fails with Validation Error

**Symptoms**: Updating a record returns 400 even when only changing one field
**Causes**:

- `final.ts` PATCH re-parses the request with the full create schema (`organizationId`, `vendorName`, `serviceName` required)
  **Resolution**:

1. Send the full field set in PATCH bodies for this module
2. Or delete and re-create the record

### 2. List Empty

**Symptoms**: Portal shows "No SaaS subscriptions found"
**Causes**:

- No records for active org
- RLS policy blocking
- API error caught by page
  **Resolution**:

1. `SELECT count(*) FROM saas_audits WHERE organization_id = '<org>';`
2. Check `pg_policies` for `saas_audits`
3. Verify membership approved

### 3. Duplicate Records

**Symptoms**: Same vendor/service appears multiple times
**Causes**:

- No uniqueness constraint; audit entries created per billing statement
  **Resolution**:

1. Query: `SELECT vendor_name, service_name, count(*) FROM saas_audits GROUP BY 1,2 HAVING count(*) > 1;`
2. Merge duplicates and delete extras

### 4. Shadow IT Not Flagged

**Symptoms**: Apps with `has_data_access = true` are classified `unknown`
**Causes**:

- Classification not updated after data-access review
  **Resolution**:

1. PATCH `classification` to `business-critical` or a shadow-IT tag
2. Feed into access review queue

## Verification Steps

### Health Check

```bash
# List SaaS records
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/final/saas-audit?organization_id=$ORG_ID"

# Get record detail
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/final/saas-audit/$ID"
```

### Data Integrity

```sql
-- Total spend per org
SELECT organization_id,
       sum(coalesce(monthly_cost, annual_cost / 12, 0)) AS monthly_est
FROM saas_audits GROUP BY organization_id;

-- Apps holding data, not classified
SELECT vendor_name, service_name FROM saas_audits
WHERE has_data_access = true AND classification = 'unknown';

-- Renewals in the next 90 days
SELECT vendor_name, service_name, renewal_date FROM saas_audits
WHERE renewal_date BETWEEN now()::date AND now()::date + 90;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P1 - SaaS records inaccessible | Backend Engineer  | 2 hours        |
| P2 - PATCH failing for records | Backend Engineer  | 4 hours        |
| P3 - Portal display issues     | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302074 causes issues (saas table only):
DROP TABLE IF EXISTS saas_audits;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` saas-audit registration
2. Revert `apps/api/src/validators/final.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/saas-audit/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `saas_records_total` (gauge) - SaaS records per org
- **Metric**: `saas_monthly_spend` (gauge) - estimated monthly spend
- **Metric**: `saas_shadow_it` (gauge) - apps with data access + unknown classification
- **Alert**: Shadow IT count growing week-over-week → P3
- **Alert**: SaaS records inaccessible (5xx) → P1

## Related Documentation

- Feature spec: `docs/features/vendor-saas-subscription-audit.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
