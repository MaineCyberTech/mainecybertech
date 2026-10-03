# DNS Domain Cloudflare Health Monitor - Runbook

## Owner

Platform Engineering / NOC & Security Operations

## Normal Operation

### Daily

- Review domain monitors in `warning` or `error` status
- Confirm SSL certificates expiring within 30 days are flagged by the stats endpoint

### Weekly

- Verify the `domain-monitor-check` worker task succeeded for all monitored domains
- Check nameserver mismatch and Cloudflare proxy-state exceptions

### Monthly

- Export monitor inventory for client reporting
- Review DMARC policy progression (p=none → quarantine → reject)

## Common Failures

### 1. Monitor Status Never Updates

**Symptoms**: `last_checked_at` is old; status not reflecting actual domain state
**Causes**:

- Worker task `domain-monitor-check` not scheduled or failing
- Check interval too long for the environment
  **Resolution**:

1. Verify task registration in `apps/worker/src/tasks/index.ts`
2. Confirm worker health + Redis: `docker compose exec redis redis-cli ping`
3. Check `scheduled_check_results` for recent rows with `module_key = 'domain-monitors'`

### 2. SSL/SPF/DKIM/DMARC Values Stale or Incorrect

**Symptoms**: Portal shows outdated certificate or record status
**Causes**:

- DNS propagation lag
- Check failure without retry
  **Resolution**:

1. Compare `last_checked_at` against `next_check_at`
2. Re-run the worker task manually for the affected domain
3. Validate records externally (dig/DNS tools) and re-check

### 3. Portal Domain List Empty

**Symptoms**: "No domain monitors found"
**Causes**:

- No monitors configured for the org
- RLS policy `domain_monitors_select_org` denies access
  **Resolution**:

1. Verify rows: `SELECT count(*) FROM domain_monitors WHERE organization_id = '...';`
2. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`
3. Test API directly with the org query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/domain-monitors?organization_id=$ORG"

# Stats endpoint
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/domain-monitors/stats?organization_id=$ORG"
```

### Data Integrity

```sql
-- Monitors with expiring SSL
SELECT domain, ssl_expires FROM domain_monitors
WHERE ssl_expires <= current_date + 30 AND ssl_expires IS NOT NULL;

-- Missing email security records
SELECT domain, spf_status, dkim_status, dmarc_status FROM domain_monitors
WHERE spf_status = 'missing' OR dkim_status = 'missing' OR dmarc_status = 'missing';

-- Stale checks
SELECT domain, last_checked_at, next_check_at FROM domain_monitors
WHERE last_checked_at IS NULL OR last_checked_at < next_check_at - interval '2 days';
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - Monitor worker down         | Platform Engineer | 30 min         |
| P1 - Widespread SSL/DNS failures | NOC Engineer      | 2 hours        |
| P2 - Single-domain stale checks  | NOC Engineer      | 4 hours        |
| P3 - Stats/report accuracy       | Backend Engineer  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS domain_monitors;
```

### API Rollback

1. Revert `apps/api/src/routes/domain-monitors.ts`
2. Revert `apps/api/src/validators/domain-monitors.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/domain-monitors/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `domain_monitors_checked` (counter) - successful checks
- **Metric**: `domain_monitors_alerting` (gauge) - monitors in warning/error
- **Metric**: `ssl_certs_expiring_30d` (gauge)
- **Alert**: Any monitor in error > 2 check cycles → P2
- **Alert**: Monitor worker failure rate > 10% → P1

## Related Documentation

- Feature spec: `docs/features/dns-domain-cloudflare-health-monitor.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302062_domain_monitor.sql`
