# Compliance Readiness Lite - Runbook

## Owner

Platform Engineering / Compliance Operations

## Normal Operation

### Daily

- Review `needs_review` status records for blocked evidence
- Confirm assessments created via the scoring endpoint carry scores

### Weekly

- Update `is_compliant` / `evidence_collected` as evidence arrives
- Track frameworks with the lowest readiness scores for focus

### Monthly

- Re-run assessments for annual certifications
- Export control-by-control status for client meetings

## Common Failures

### 1. Scores Not Displayed

**Symptoms**: Portal shows "Score: N/A%" for records
**Causes**:

- Records created via CRUD (no score) instead of the scoring endpoint
- `score`/`readiness_pct` fields not populated
  **Resolution**:

1. Verify stored values: `SELECT id, framework, score, readiness_pct FROM compliance_readiness;`
2. Re-run scoring: `POST /api/v1/edu-automation/compliance/score` with the question responses
3. Confirm the portal reads the correct field (`score` or `readiness_pct`)

### 2. Compliance List Empty

**Symptoms**: Portal shows "No compliance assessments yet"
**Causes**:

- No records for the org
- RLS policy `cr_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM compliance_readiness WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`
3. Test API directly with the org query param

### 3. Scoring Endpoint Fails

**Symptoms**: 400/500 on `/compliance/score`
**Causes**:

- Body schema mismatch (missing `organizationId`, `framework`, or empty `responses`)
- DB column mismatch on insert
  **Resolution**:

1. Validate payload: `organizationId`, `framework` (≤100 chars), `responses[]` with `{ questionId, passed }`
2. Check API logs for DB_ERROR column details
3. Confirm migration `5302124_fix_worker_schema_columns.sql` (if applicable) is applied

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/compliance?organization_id=$ORG"

# Score endpoint smoke test
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"organizationId":"$ORG","framework":"CMMC","responses":[{"questionId":"c1","passed":true}]}' \
  "https://api.mainecybertech.com/api/v1/edu-automation/compliance/score"
```

### Data Integrity

```sql
-- Frameworks with no score
SELECT framework, count(*) FROM compliance_readiness
WHERE score IS NULL GROUP BY framework;

-- Non-compliant with evidence
SELECT framework, control_id FROM compliance_readiness
WHERE is_compliant = false AND evidence_collected = true;

-- Stale assessments
SELECT framework, control_id, assessed_at FROM compliance_readiness
WHERE assessed_at < now() - interval '120 days';
```

## Escalation

| Severity                      | Contact           | SLA            |
| ----------------------------- | ----------------- | -------------- |
| P0 - Compliance page broken   | Platform Engineer | 30 min         |
| P1 - Scoring endpoint failing | Backend Engineer  | 2 hours        |
| P2 - Evidence tracking stale  | Compliance Lead   | 4 hours        |
| P3 - Reporting/export issues  | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS compliance_readiness;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts`
2. Revert `apps/api/src/validators/edu-automation.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/compliance-readiness/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `compliance_frameworks_tracked` (gauge)
- **Metric**: `compliance_avg_score` (gauge)
- **Metric**: `compliance_evidence_missing` (gauge)
- **Alert**: Average score below 60% for a client → P2
- **Alert**: Scoring endpoint failure rate > 5% → P1

## Related Documentation

- Feature spec: `docs/features/compliance-readiness-lite.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`
