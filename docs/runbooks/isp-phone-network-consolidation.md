# ISP / Phone Network Consolidation - Runbook

## Owner

Network Engineering / Account Management

## Normal Operation

### Daily

- Review new ISP assessments in `draft` status
- Verify client bandwidth requirements vs `bandwidth_current`
- Flag high-cost/low-bandwidth sites for scoring

### Weekly

- Run `/score` on active assessments to surface consolidation recommendations
- Update `contract_status` as renewals are confirmed
- Follow up on `recommended_provider` quotes

### Monthly

- Report consolidation savings across clients (sum of `current_cost` vs `recommended_cost`)
- Archive completed assessments; mark expired contracts
- Review phone line counts and VoIP readiness progress

## Common Failures

### 1. Score Endpoint 400

**Symptoms**: `POST /isp/:id/score` returns validation error
**Causes**:

- `monthlyCost` negative or missing
- `contractLength` < 1
  **Resolution**:

1. Confirm request body: `{ "monthlyCost": 499, "contractLength": 36 }`
2. Retry with valid values

### 2. Score Endpoint 404

**Symptoms**: Score returns 404 on a visible assessment
**Causes**:

- Record belongs to a different org
- Assessment deleted
  **Resolution**:

1. `SELECT id, organization_id FROM isp_assessments WHERE id = '<id>';`
2. Confirm request passes correct `organization_id`

### 3. Portal Field Services Empty

**Symptoms**: Portal shows "No ISP assessments found"
**Causes**:

- No records for active org
- RLS policy blocking
  **Resolution**:

1. `SELECT count(*) FROM isp_assessments WHERE organization_id = '<org>';`
2. Check `pg_policies` for `isp_assessments`
3. Verify membership approved

### 4. Cost Discrepancy

**Symptoms**: `current_cost` doesn't match `monthly_cost` after scoring
**Causes**:

- `current_cost` is the recorded cost; `monthly_cost` is the scored input; they can differ by design
  **Resolution**:

1. These are separate fields (create vs scoring)
2. Align by PATCHing `current_cost` if it should reflect scored value

## Verification Steps

### Health Check

```bash
# List assessments
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/field-services/isp?organization_id=$ORG_ID"

# Run scoring
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyCost": 499, "contractLength": 36}' \
  "https://api.mainecybertech.com/api/v1/field-services/isp/$ID/score"
```

### Data Integrity

```sql
-- Assessments missing scores
SELECT id, client_name FROM isp_assessments
WHERE consolidation_score = 0 AND status IN ('active', 'completed');

-- Savings potential
SELECT client_name, current_cost, recommended_cost,
       (current_cost - recommended_cost) AS monthly_savings
FROM isp_assessments
WHERE recommended_cost IS NOT NULL AND current_cost > recommended_cost;
```

## Escalation

| Severity                        | Contact           | SLA            |
| ------------------------------- | ----------------- | -------------- |
| P1 - Scoring endpoint down      | Backend Engineer  | 2 hours        |
| P2 - Assessments not accessible | Backend Engineer  | 4 hours        |
| P3 - Portal display issues      | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302072 or 5302097 cause issues (field services only):
ALTER TABLE isp_assessments DROP COLUMN IF EXISTS consolidation_score;
ALTER TABLE isp_assessments DROP COLUMN IF EXISTS recommendation;
DROP TABLE IF EXISTS isp_assessments;
```

### API Rollback

1. Revert `apps/api/src/routes/field-services.ts` isp crudRoute + score
2. Revert `apps/api/src/validators/field-services.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/field-services/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `isp_assessments_active` (gauge) - active assessments
- **Metric**: `isp_total_monthly_savings` (gauge) - sum of cost deltas
- **Metric**: `isp_avg_consolidation_score` (gauge) - average score
- **Alert**: Scoring failure rate > 5% → P2
- **Alert**: Assessments in `draft` over 60 days → P3

## Related Documentation

- Feature spec: `docs/features/isp-phone-network-consolidation.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302072_field_services.sql`, `5302097_isp_unifi_scoring_fields.sql`
