# License Optimizer - Runbook

## Owner

Account Management / Procurement

## Normal Operation

### Daily

- Review `portal/license-optimizer` utilization bars for anomalies
- Verify newly added software has `total_seats` and `used_seats` populated

### Weekly

- Pull the reclaimable list (`GET /reclaimable/license-list`) for accounts under review
- Update `used_seats` based on active directory/user inventory exports
- Confirm cost per seat is accurate before renewal discussions

### Monthly

- Run `GET /summary/data` for leadership reporting (total cost, avg utilization, savings)
- Audit `last_audit_date` on all allocations; set it when verified
- Flag subscriptions with < 50% utilization for downsizing

## Common Failures

### 1. Utilization Percent Appears Wrong

**Symptoms**: Bar shows 100%+ or always 0
**Causes**: `used_seats` or `total_seats` null/zero
**Resolution**:

1. Query: `SELECT software_name, total_seats, used_seats FROM license_allocations;`
2. Update missing values via `PATCH /license-optimizer/:id`

### 2. Potential Savings Zero

**Symptoms**: Reclaimable list empty despite low utilization
**Causes**: `cost_per_seat` null, or all allocations above 70% utilization
**Resolution**:

1. Verify `cost_per_seat` populated
2. Re-check utilization threshold (reclaimable = `used_seats < total_seats * 0.7`)

### 3. Duplicate Software Entries

**Symptoms**: Same software listed multiple times with partial seats
**Causes**: Manual entry without dedup
**Resolution**:

1. Consolidate into one allocation with summed `total_seats`
2. Delete stale rows (admin/super_admin only)

### 4. Delete Denied

**Symptoms**: 403 on DELETE
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid() AND m.organization_id = '<org>'`

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/license-optimizer/summary/data?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Allocations with no cost data
SELECT software_name FROM license_allocations WHERE cost_per_seat IS NULL;

-- Over-allocated seats
SELECT software_name, used_seats, total_seats FROM license_allocations WHERE used_seats > total_seats;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P1       | Account Manager   | 2 hrs |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS license_allocations;
```

### API Rollback

1. Revert `/api/v1/license-optimizer` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/license-optimizer.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `license_utilization_pct` (gauge) - per allocation
- **Metric**: `license_potential_savings` (gauge) - total reclaimable value
- **Alert**: Allocation with utilization < 30% for 60+ days → P2
- **Alert**: Reclaimable value > $10k/month → P1

## Related Documentation

- Feature spec: `docs/features/license-optimizer.md`
- Database schema: `supabase/migrations/5302088_license_optimizer.sql`
