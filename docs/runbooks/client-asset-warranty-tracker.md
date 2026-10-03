# Client Asset Warranty Tracker - Runbook

## Owner

Asset Management / Procurement

## Normal Operation

### Daily

- Review newly created assets for missing serial/tag data
- Check `stats` endpoint for assets with warranties expiring within 90 days

### Weekly

- Follow up on `replacement_recommended` dates approaching
- Update `vendor_support_status` for EOL devices
- Reconcile asset tags against physical inventory

### Monthly

- Export asset register (`GET /api/v1/assets/export`) for client reporting
- Review `lifecycle_score` distribution to plan refresh budgets
- Verify assigned-to ownership records

## Common Failures

### 1. PATCH 409 Version Conflict

**Symptoms**: Update fails with `VERSION_CONFLICT - Asset was modified by another user`
**Causes**:

- Concurrent edit between fetch and save
- Stale `If-Match` version header
  **Resolution**:

1. Re-fetch the asset to get the current `version`
2. Retry PATCH with the updated `If-Match` header

### 2. Export Empty

**Symptoms**: CSV/JSON export returns no rows
**Causes**:

- No assets for the org
- `organization_id` not passed
- Non-admin caller
  **Resolution**:

1. `SELECT count(*) FROM assets WHERE organization_id = '<org>';`
2. Confirm `organization_id` query param
3. Verify role is admin/super_admin

### 3. Warranty Filter Misses Records

**Symptoms**: `warranty_expiring_before` omits assets that clearly expire soon
**Causes**:

- Filter excludes null warranties by design (`.neq('warranty_expires', null)`)
  **Resolution**:

1. Use `GET /api/v1/assets/stats` for the aggregate `expiringWarranty`
2. Confirm `warranty_expires` is populated on target assets

### 4. List Empty

**Symptoms**: Portal/admin shows no assets
**Causes**:

- No records for active org
- RLS policy blocking
  **Resolution**:

1. `SELECT count(*) FROM assets WHERE organization_id = '<org>';`
2. Check `pg_policies` for `assets`
3. Verify membership approved

## Verification Steps

### Health Check

```bash
# List with warranty filter
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/assets?organization_id=$ORG_ID&warranty_expiring_before=2026-12-31"

# Stats
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/assets/stats?organization_id=$ORG_ID"

# Detail with comments/timeline
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/assets/$ID?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Assets with warranty already expired but still active
SELECT name, warranty_expires FROM assets
WHERE status = 'active' AND warranty_expires < now()::date;

-- EOL devices still active
SELECT name, vendor_support_status FROM assets
WHERE status = 'active' AND vendor_support_status = 'eol';

-- Duplicate serials
SELECT serial_number, count(*) FROM assets
WHERE serial_number IS NOT NULL GROUP BY serial_number HAVING count(*) > 1;

-- Version drift (should not happen)
SELECT id, version FROM assets WHERE version < 1;
```

## Escalation

| Severity                    | Contact           | SLA            |
| --------------------------- | ----------------- | -------------- |
| P1 - Asset register 5xx     | Backend Engineer  | 2 hours        |
| P2 - Optimistic lock errors | Backend Engineer  | 4 hours        |
| P3 - Export formatting      | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302061 causes issues (assets table only):
DROP TABLE IF EXISTS assets;
```

### API Rollback

1. Revert `apps/api/src/routes/assets.ts`
2. Revert `apps/api/src/validators/assets.ts`
3. Revert optimistic-locking middleware if changed
4. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/assets/`
2. Revert admin page `apps/web/app/(admin)/admin/assets/`
3. Deploy previous Web image

## Monitoring

- **Metric**: `assets_total` (gauge) - total assets per org
- **Metric**: `assets_expiring_warranty_90d` (gauge) - warranties expiring in 90 days
- **Metric**: `assets_eol_active` (gauge) - active EOL devices
- **Alert**: Expiring warranties > 20% of assets → P2
- **Alert**: Active EOL devices growing → P2

## Related Documentation

- Feature spec: `docs/features/client-asset-warranty-tracker.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302061_asset_tracker.sql`
