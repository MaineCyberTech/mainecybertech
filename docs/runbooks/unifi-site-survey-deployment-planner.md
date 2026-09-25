# UniFi Site Survey & Deployment Planner - Runbook

## Owner

Field Services / Network Engineering

## Normal Operation

### Daily

- Review new surveys in `draft` status for completed field data
- Verify surveyed counts are consistent with site size

### Weekly

- Run `/plan` on surveys with confirmed square footage and floors
- Validate derived `estimated_cost` against current UniFi pricing
- Update survey status as deployments progress

### Monthly

- Reconcile planned vs deployed hardware
- Review NVR storage estimates against camera counts
- Archive completed surveys

## Common Failures

### 1. Planner Endpoint 400

**Symptoms**: `POST /unifi/:id/plan` returns validation error
**Causes**:

- `squareFootage` < 100
- `floors` outside 1-10
- `userCount` < 1
  **Resolution**:

1. Confirm request body: `{ "squareFootage": 5000, "floors": 2, "userCount": 50 }`
2. Retry with valid values

### 2. Planner Endpoint 404

**Symptoms**: Planner returns 404 on a survey that appears in the portal
**Causes**:

- Survey belongs to another org
- Survey deleted
  **Resolution**:

1. `SELECT id, organization_id FROM unifi_surveys WHERE id = '<id>';`
2. Confirm request passes correct `organization_id`

### 3. Portal UniFi Site Surveys Empty

**Symptoms**: Portal shows "No site surveys available"
**Causes**:

- No surveys for active org
- RLS policy blocking
  **Resolution**:

1. `SELECT count(*) FROM unifi_surveys WHERE organization_id = '<org>';`
2. Check `pg_policies` for `unifi_surveys`
3. Verify membership approved

### 4. Estimated Cost Stale

**Symptoms**: `estimated_cost` does not reflect hardware price changes
**Causes**:

- Plan generated before pricing updates; values are snapshot, not live
  **Resolution**:

1. Re-run `/plan` to refresh derived values
2. Apply manual PATCH if pricing needs adjustment

## Verification Steps

### Health Check

```bash
# List surveys
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/field-services/unifi?organization_id=$ORG_ID"

# Run planner
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"squareFootage": 5000, "floors": 2, "userCount": 50}' \
  "https://api.mainecybertech.com/api/v1/field-services/unifi/$ID/plan"
```

### Data Integrity

```sql
-- Surveys without a plan
SELECT site_name FROM unifi_surveys
WHERE ap_count = 0 AND status = 'draft';

-- Plan cost totals by org
SELECT organization_id, sum(estimated_cost) AS total_planned_cost
FROM unifi_surveys GROUP BY organization_id;
```

## Escalation

| Severity                    | Contact           | SLA            |
| --------------------------- | ----------------- | -------------- |
| P1 - Planner endpoint down  | Backend Engineer  | 2 hours        |
| P2 - Surveys not accessible | Backend Engineer  | 4 hours        |
| P3 - Portal display issues  | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302097 causes issues (planner columns only):
ALTER TABLE unifi_surveys DROP COLUMN IF EXISTS ap_count;
ALTER TABLE unifi_surveys DROP COLUMN IF EXISTS switch_count;
ALTER TABLE unifi_surveys DROP COLUMN IF EXISTS estimated_cost;
DROP TABLE IF EXISTS unifi_surveys;
```

### API Rollback

1. Revert `apps/api/src/routes/field-services.ts` unifi crudRoute + plan
2. Revert `apps/api/src/validators/field-services.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/unifi-site-surveys/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `unifi_surveys_planned` (gauge) - surveys with derived plans
- **Metric**: `unifi_estimated_cost_total` (gauge) - sum of estimated cost
- **Alert**: Planner failure rate > 5% → P2
- **Alert**: Surveys in `draft` over 60 days → P3

## Related Documentation

- Feature spec: `docs/features/unifi-site-survey-deployment-planner.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302072_field_services.sql`, `5302097_isp_unifi_scoring_fields.sql`
