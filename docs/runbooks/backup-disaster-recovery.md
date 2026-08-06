# Backup Disaster Recovery - Runbook

## Owner

Platform Engineering / NOC Backup Operations

## Normal Operation

### Daily

- Review backup jobs with `last_backup_status = 'failed'`
- Confirm scheduled backups ran within their RPO window

### Weekly

- Check `backup-dr-check` worker task results
- Verify restore testing cadence (`restore_tested_at` within 90 days)

### Monthly

- Run risk-analysis and review high/medium-risk clients
- Confirm offsite replication and encryption flags are accurate

## Common Failures

### 1. Failed Backups Not Flagged

**Symptoms**: `last_backup_status` stays `success` despite failed jobs
**Causes**:

- Backup tool reporting lag
- Worker task `backup-dr-check` not scheduled
  **Resolution**:

1. Verify worker registration in `apps/worker/src/tasks/index.ts`
2. Compare `next_scheduled_at` / `last_backup_at` for staleness
3. Manually update the job status via PATCH after confirming the actual backup state

### 2. Risk Score Misleading

**Symptoms**: Risk level high when backups are healthy
**Causes**:

- `restore_test_result` null for untested but otherwise healthy jobs
- `status` column values outdated
  **Resolution**:

1. Review `SELECT id, system_name, status, last_backup_status, restore_test_result FROM backup_status;`
2. Complete restore tests and update `restore_tested_at`/`restore_test_result`
3. Re-run the risk-analysis endpoint

### 3. Backup Job List Empty

**Symptoms**: Portal shows "No backup jobs configured"
**Causes**:

- No jobs for the org
- RLS policy `backup_select_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM backup_status WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`
3. Test API directly with the org query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/backups?organization_id=$ORG"

# Stats endpoint
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/backups/stats?organization_id=$ORG"

# Risk analysis
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/backups/risk-analysis?organization_id=$ORG"
```

### Data Integrity

```sql
-- Stale backups (no run within RPO)
SELECT system_name, last_backup_at, recovery_point_objective_hours FROM backup_status
WHERE last_backup_at < now() - (recovery_point_objective_hours || ' hours')::interval;

-- Untested restores
SELECT system_name, restore_tested_at FROM backup_status
WHERE restore_test_result IS NULL OR restore_tested_at < now() - interval '90 days';

-- Non-encrypted critical systems
SELECT system_name FROM backup_status WHERE encryption_enabled = false;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - Restore capability at risk    | Platform Engineer | 30 min         |
| P1 - Failed backups across clients | NOC Engineer      | 2 hours        |
| P2 - Single-client backup degraded | NOC Engineer      | 4 hours        |
| P3 - Risk scoring accuracy         | Backend Engineer  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS backup_status;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts`
2. Revert `apps/api/src/validators/final.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/backup-dr/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `backup_jobs_failed` (gauge)
- **Metric**: `backup_jobs_untested` (gauge)
- **Metric**: `backup_restore_test_age_days` (gauge)
- **Alert**: Failed backup jobs > 0 for 2 consecutive check cycles → P1
- **Alert**: Restore test age > 120 days → P2

## Related Documentation

- Feature spec: `docs/features/backup-disaster-recovery.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302075_backup_dr.sql`
