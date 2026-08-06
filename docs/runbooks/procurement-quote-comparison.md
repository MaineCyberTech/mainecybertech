# Procurement Quote Comparison - Runbook

## Owner

Platform Engineering / Procurement Lead

## Normal Operation

### Daily

- Review newly recorded quotes for complete pricing data
- Confirm quote amounts are stored as positive numerics
- Check for quotes marked `selected` awaiting purchase

### Weekly

- Run quote comparisons for active sourcing requests
- Verify competitor pricing references are current
- Review purchasing decisions against stored quotes

### Monthly

- Audit purchased quotes (`purchased_at` set)
- Remove stale or duplicate quotes
- Review the compare endpoint's savings calculations

## Common Failures

### 1. Quote List Empty

**Symptoms**: `/portal/procurement` shows no quotes
**Causes**:

- No quotes recorded for the org
  **Resolution**:

1. Create a test quote via `POST /api/v1/final/procurement`
2. Verify the row: `SELECT * FROM procurement_quotes WHERE organization_id = '...'`

### 2. Compare Requires 2+ Quotes

**Symptoms**: `POST /api/v1/final/procurement/compare` returns a validation error
**Causes**:

- Fewer than 2 quote ids passed
- More than 10 quote ids passed
  **Resolution**:

1. Confirm 2-10 valid quote ids in the same organization
2. Verify quote ids exist: `SELECT id FROM procurement_quotes WHERE id = ANY('{...}')`

### 3. Total Shows Zero

**Symptoms**: Total displays 0 for a quote
**Causes**:

- `quote_amount` is null or 0
  **Resolution**:

1. Check the stored value: `SELECT quote_amount FROM procurement_quotes WHERE id = '...'`
2. Update with a valid numeric value via PATCH

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/procurement?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Quotes without an amount
SELECT * FROM procurement_quotes WHERE quote_amount IS NULL OR quote_amount <= 0;

-- Duplicate vendor/product combinations
SELECT vendor_name, product, count(*) FROM procurement_quotes GROUP BY vendor_name, product HAVING count(*) > 1;

-- Purchased quotes missing selected flag
SELECT * FROM procurement_quotes WHERE purchased_at IS NOT NULL AND selected = false;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - Procurement module unavailable | Platform Engineer | 30 min         |
| P1 - Compare endpoint failing       | Backend Engineer  | 2 hours        |
| P2 - Quote data integrity issues    | Backend Engineer  | 4 hours        |
| P3 - Procurement list UX bugs       | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS procurement_quotes;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/final.ts`
3. Revert `apps/api/src/validators/final.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/procurement/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `procurement_quotes_active` (gauge) - count of non-purchased quotes
- **Metric**: `procurement_compare_latency_ms` (histogram) - compare endpoint latency
- **Alert**: Compare endpoint error rate > 5% → P1
- **Alert**: Quotes with null amounts > 20% of total → P2

## Related Documentation

- Feature spec: `docs/features/procurement-quote-comparison.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
