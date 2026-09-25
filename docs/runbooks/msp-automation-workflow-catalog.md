# MSP Automation Workflow Catalog - Runbook

## Owner

Platform Engineering / Automation Team Lead

## Normal Operation

### Daily

- Review workflows left in `running` status for more than a day (stuck executions)
- Verify the `automation-run-check` worker task is running

### Weekly

- Audit `run_count` and `last_run_status` for failed automations
- Confirm scheduled workflows (`trigger_type = 'scheduled'`) executed as expected

### Monthly

- Review catalog for obsolete workflows
- Validate PowerShell scripts linked to workflows pass the policy scan

## Common Failures

### 1. Workflow Stuck in "Running"

**Symptoms**: Workflow status remains `running` indefinitely
**Causes**:

- Automation process died before calling complete
- Worker task down
  **Resolution**:

1. Check `last_run_at` freshness
2. Re-run completion: `POST /api/v1/edu-automation/automation/:id/complete` with `{ result, success }`
3. If stuck repeatedly, check worker/Redis: `docker compose exec redis redis-cli ping`

### 2. Failed Automations Not Caught

**Symptoms**: `last_run_status` shows failed but no alert
**Causes**:

- Monitoring only covers run_count, not failure ratio
  **Resolution**:

1. Query failures: `SELECT name, last_run_status, last_run_at FROM automation_workflows WHERE last_run_status = 'failed';`
2. Re-run the workflow manually and verify the complete endpoint payload

### 3. Automation List Empty

**Symptoms**: Portal `/portal/automation` shows "No automation workflows configured"
**Causes**:

- No workflows created for the org
- RLS policy `aw_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM automation_workflows WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/automation?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM automation_workflows;"
```

### Data Integrity

```sql
-- Stuck running workflows
SELECT id, name, last_run_at FROM automation_workflows
WHERE last_run_status = 'running' AND last_run_at < now() - interval '24 hours';

-- Failure summary
SELECT last_run_status, count(*) FROM automation_workflows GROUP BY last_run_status;

-- Inactive vs active
SELECT is_active, count(*) FROM automation_workflows GROUP BY is_active;
```

## Escalation

| Severity                        | Contact           | SLA            |
| ------------------------------- | ----------------- | -------------- |
| P0 - Automation worker down     | Platform Engineer | 30 min         |
| P1 - Workflow execution failing | Backend Engineer  | 2 hours        |
| P2 - Stuck running workflows    | Backend Engineer  | 4 hours        |
| P3 - Catalog display issues     | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS automation_workflows;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts`
2. Revert `apps/api/src/validators/edu-automation.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/automation/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `automation_workflows_stuck_running` (gauge) - running > 24h
- **Metric**: `automation_run_failure_rate` (rate) - failed vs completed
- **Alert**: Stuck running workflows > 0 → P2
- **Alert**: Failure rate > 10% over 24h → P1

## Related Documentation

- Feature spec: `docs/features/msp-automation-workflow-catalog.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`
