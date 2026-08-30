# Phishing Simulation - Runbook

## Owner

MSP Security Awareness Program Lead

## Normal Operation

### Daily

- Monitor active campaigns for unusual click rates that indicate a real threat or simulation fatigue
- Review reported emails to confirm they are not actual phishing attempts

### Weekly

- Review campaign metrics (click rate, report rate) with client stakeholders
- Adjust follow-up training for departments with high click rates
- Verify campaign statuses progress draft → active → completed on schedule

### Monthly

- Produce the awareness program scorecard from aggregated campaign results
- Rotate phishing templates to prevent recognition fatigue
- Review `target_count` accuracy against current headcount

## Common Failures

### 1. Campaign Cannot Launch

**Symptoms**: `POST /:id/launch` returns success but status unchanged
**Causes**:

- Campaign status is not `draft`
- The launch handler is a no-op for non-draft campaigns by design
  **Resolution**:

1. Check status: `SELECT campaign_name, status FROM phishing_campaigns WHERE id = '...'`
2. Only `draft` campaigns transition to `active`; completed campaigns must be cloned or reset

### 2. Click Rate Spikes

**Symptoms**: `click_rate` jumps significantly between reporting periods
**Causes**:

- A template became recognizable/too easy
- Campaign targeted a high-risk department
- Metrics being mis-attributed across campaigns
  **Resolution**:

1. Review the results endpoint: `GET /api/v1/edu-automation/phishing/:id/results`
2. Cross-check `clicked_count` and `reported_count` against the delivery pipeline
3. Adjust the template and roll out supplementary training

### 3. Report Rate Too High

**Symptoms**: Users report every simulation email
**Causes**:

- Template too obviously fake
- Campaign frequency too high
  **Resolution**:

1. Review the template; make it more realistic but still safe
2. Reduce campaign frequency for the affected group

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid campaign IDs
**Causes**:

- User not in organization memberships
- `organization_id` missing from the request
  **Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Ensure the API request includes the correct `organization_id`

## Verification Steps

### Health Check

```bash
# API list
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/phishing?organization_id=$ORG"

# Results for a campaign
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/phishing/:id/results"
```

### Data Integrity

```sql
-- Active campaigns past their end date
SELECT campaign_name, started_at, ended_at FROM phishing_campaigns
WHERE status = 'active' AND ended_at < now();

-- Campaigns with clicks but no opens (anomaly)
SELECT campaign_name, opened_count, clicked_count FROM phishing_campaigns
WHERE clicked_count > opened_count;

-- Report-rate leaders for awareness reporting
SELECT campaign_name, target_count, reported_count FROM phishing_campaigns
ORDER BY (reported_count::float / NULLIF(target_count, 0)) DESC;
```

## Escalation

| Severity                            | Contact            | SLA            |
| ----------------------------------- | ------------------ | -------------- |
| P0 - No campaigns accessible        | Platform Engineer  | 30 min         |
| P1 - Launch/results endpoint broken | Backend Engineer   | 2 hours        |
| P2 - Metric attribution error       | Backend Engineer   | 4 hours        |
| P3 - Template fatigue / low quality | Security Awareness | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migrations 5302073/5302096 cause issues:
DROP TABLE IF EXISTS phishing_campaigns;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts` route registration
2. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/phishing-simulations/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `phishing_campaigns_active` (gauge) - count of active campaigns
- **Metric**: `phishing_click_rate` (gauge) - overall click rate across campaigns
- **Metric**: `phishing_report_rate` (gauge) - overall report rate across campaigns
- **Alert**: Click rate > 30% for a single campaign → P2
- **Alert**: Report rate trending down over 3 months → P3

## Related Documentation

- Feature spec: `docs/features/phishing-simulation.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql` + `supabase/migrations/5302096_phishing_campaign_fields.sql`
