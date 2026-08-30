# Client Billing Service Catalog - Runbook

## Owner

Billing Admin / Account Management Lead

## Normal Operation

### Daily

- Review newly created services for pricing completeness
- Verify `is_active` reflects the current offer status
- Check that `visibility` matches the intended audience

### Weekly

- Confirm `base_price` and `included_units` match signed agreements
- Review bundled services (`is_bundled`) for correct `bundle_id` linkage
- Validate categories are used consistently

### Monthly

- Produce the catalog snapshot for billing reviews
- Deactivate services no longer offered (`is_active = false`)
- Audit `overture_rate` / pricing fields for accuracy

## Common Failures

### 1. Price Shows $0.00

**Symptoms**: Service card renders $0.00 base price
**Causes**:

- `base_price` never set (default 0)
- Create payload omitted `basePrice`

**Resolution**:

1. Find zero-price services: `SELECT name FROM service_catalog WHERE base_price = 0 AND is_active = true`
2. PATCH with the correct `base_price`
3. Confirm the amount matches the client agreement

### 2. Bundle Badge Missing

**Symptoms**: Bundled services don't show the Bundled badge
**Causes**:

- `is_bundled` false
- `bundle_id` references a missing service

**Resolution**:

1. Check bundles: `SELECT name, bundle_id FROM service_catalog WHERE is_bundled = true`
2. Fix orphaned references: `SELECT c.name FROM service_catalog c LEFT JOIN service_catalog b ON c.bundle_id = b.id WHERE c.is_bundled = true AND b.id IS NULL`
3. PATCH the parent bundle id or clear `is_bundled`

### 3. Service Not Visible to Client

**Symptoms**: A service expected on the portal does not appear
**Causes**:

- `visibility` set to `internal`
- `is_active` false

**Resolution**:

1. Confirm row: `SELECT name, visibility, is_active FROM service_catalog WHERE name = '...'`
2. Set `visibility = 'client_visible'` and `is_active = true` via PATCH
3. Re-check the portal page

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid service IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/service-catalog?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM service_catalog;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'service_catalog';"
```

### Data Integrity

```sql
-- Zero-price active services
SELECT name FROM service_catalog WHERE base_price = 0 AND is_active = true;

-- Orphaned bundles
SELECT c.name FROM service_catalog c
LEFT JOIN service_catalog b ON c.bundle_id = b.id
WHERE c.is_bundled = true AND b.id IS NULL;

-- Status / visibility distribution
SELECT is_active, visibility, count(*) FROM service_catalog GROUP BY is_active, visibility;

-- Negative prices (should never happen)
SELECT name FROM service_catalog WHERE base_price < 0;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - No catalog accessible       | Platform Engineer | 30 min         |
| P1 - Catalog API broken          | Backend Engineer  | 2 hours        |
| P2 - Pricing fields inaccurate   | Billing Admin     | 4 hours        |
| P3 - Visibility / bundle cleanup | Billing Admin     | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302067 causes issues:
DROP TABLE IF EXISTS service_catalog;
```

### API Rollback

1. Revert `apps/api/src/routes/service-catalog.ts`
2. Revert `apps/api/src/validators/service-catalog.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/service-catalog/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `service_catalog_active` (gauge) - active services per org
- **Metric**: `service_catalog_zero_price_active` (gauge) - active services at $0
- **Metric**: `service_catalog_bundles` (gauge) - bundled services
- **Alert**: Active service with zero price for 7 days → P2
- **Alert**: Catalog API 5xx → P1

## Related Documentation

- Feature spec: `docs/features/client-billing-service-catalog.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302067_service_catalog.sql`
