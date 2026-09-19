# Risk Acceptance Register - Runbook

## Owner

MSP vCISO / Governance Lead

## Normal Operation

### Daily

- Review newly identified risks (status `identified`) for triage
- Check risks with expired or soon-to-expire `acceptance_expires`
- Verify high `risk_level` (critical/high) risks have an owner

### Weekly

- Re-assess risks whose `assessed_at` is stale
- Review accepted risks for control drift
- Confirm mitigating controls remain in place

### Monthly

- Produce a risk register report for client leadership
- Renew expiring risk acceptances before `acceptance_expires`
- Clean up duplicates or superseded risks

## Common Failures

### 1. Risk Score Not Computed

**Symptoms**: `risk_score` or `risk_level` is null
**Causes**:

- Risk created via direct PATCH instead of the assess endpoint
- Migration 5302125 not applied (missing `risk_level` column)

**Resolution**:

1. Confirm migration applied: `SELECT column_name FROM information_schema.columns WHERE table_name = 'risk_register' AND column_name IN ('risk_level','assessed_at')`
2. Run assessment: `POST /api/v1/governance/risks/:id/assess` with `{ likelihood: n, impact: n }` (1-5 each)
3. Verify `risk_score = likelihood * impact` and `risk_level` derived

### 2. Acceptance Expiry Not Renewed

**Symptoms**: Risks with past `acceptance_expires` still flagged as accepted
**Causes**:

- Renewal workflow not run
- No owner assigned

**Resolution**:

1. Find expired: `SELECT id, risk_description FROM risk_register WHERE acceptance_expires < now()`
2. Re-assess the risk and set a new `acceptance_expires`
3. Assign `owner_user_id` if missing

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid risk IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/governance/risks?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM risk_register;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'risk_register';"
```

### Data Integrity

```sql
-- Risks with acceptance that expired
SELECT id, risk_description, acceptance_expires
FROM risk_register
WHERE acceptance_expires < now();

-- Risks without an owner
SELECT id, risk_description FROM risk_register WHERE owner_user_id IS NULL;

-- Risk level distribution
SELECT risk_level, status, count(*) FROM risk_register GROUP BY risk_level, status;

-- Risks assessed but missing risk_score
SELECT id FROM risk_register WHERE assessed_at IS NOT NULL AND risk_score IS NULL;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - No risk register accessible | Platform Engineer | 30 min         |
| P1 - Assess endpoint broken      | Backend Engineer  | 2 hours        |
| P2 - Risk scores not derived     | Backend Engineer  | 4 hours        |
| P3 - Acceptance renewals overdue | Governance Lead   | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302125 causes issues:
ALTER TABLE risk_register DROP COLUMN IF EXISTS risk_level;
ALTER TABLE risk_register DROP COLUMN IF EXISTS accepting_controls;
ALTER TABLE risk_register DROP COLUMN IF EXISTS assessed_at;
```

### API Rollback

1. Revert `apps/api/src/routes/governance.ts` risks registration and `/risks/:id/assess`
2. Revert `apps/api/src/validators/governance.ts` `createRiskSchema`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/risk-register/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `risk_register_open` (gauge) - count of non-closed risks per org
- **Metric**: `risk_acceptances_expiring_soon` (gauge) - acceptances expiring within 30 days
- **Metric**: `risk_high_critical_count` (gauge) - risks with high/critical risk_level
- **Alert**: High/critical risk without owner for 3 days → P2
- **Alert**: Risk acceptance expired without renewal → P2

## Related Documentation

- Feature spec: `docs/features/risk-acceptance-register.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302071_governance.sql`, `supabase/migrations/5302125_risk_assess_columns.sql`
