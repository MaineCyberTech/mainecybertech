# Hardware Staging Checklist - Runbook

## Owner

Field Services / Hardware Operations Lead

## Normal Operation

### Daily

- Review staging items in `pending` and `in_progress` status
- Confirm staged devices have serial numbers and asset tags
- Check for devices stuck without progress on checklist flags

### Weekly

- Validate staging throughput (items moved to ready/deployed)
- Audit QA-verified items before deployment
- Verify `staged_by` attribution is populated

### Monthly

- Review hardware types for procurement planning
- Clean up stale staging items
- Confirm checklist toggling still updates `checklist_items`/`completed_items`

## Common Failures

### 1. Staging List Empty

**Symptoms**: `/portal/hardware-staging` shows no items
**Causes**:

- No staging items recorded for the org
  **Resolution**:

1. Create a test item via `POST /api/v1/field-services/staging`
2. Verify the row: `SELECT * FROM hardware_staging WHERE organization_id = '...'`

### 2. Checklist Toggle 404

**Symptoms**: `POST /api/v1/field-services/staging/:id/checklist` returns NOT_FOUND
**Causes**:

- Item id not in the organization
  **Resolution**:

1. Verify the item exists: `SELECT id FROM hardware_staging WHERE id = '...'`
2. Confirm the request includes the correct item id

### 3. Device Missing Type

**Symptoms**: Device shows no type on the portal card
**Causes**:

- `device_type` is null
  **Resolution**:

1. Check the stored value: `SELECT device_type FROM hardware_staging WHERE id = '...'`
2. Update the record with the correct type

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/field-services/staging?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Items missing device type or serial
SELECT * FROM hardware_staging WHERE device_type IS NULL OR serial_number IS NULL;

-- Staged but never advanced
SELECT * FROM hardware_staging
WHERE status = 'pending'
AND configured = false AND imaged = false AND tested = false;

-- Status distribution
SELECT status, count(*) FROM hardware_staging GROUP BY status;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - Staging module unavailable    | Platform Engineer | 30 min         |
| P1 - Checklist endpoint failing    | Backend Engineer  | 2 hours        |
| P2 - Staging data integrity issues | Backend Engineer  | 4 hours        |
| P3 - Staging list UX bugs          | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS hardware_staging;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/field-services.ts`
3. Revert `apps/api/src/validators/field-services.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/hardware-staging/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `hardware_staging_pending` (gauge) - count of non-ready items
- **Metric**: `hardware_staging_throughput` (rate) - items staged per week
- **Alert**: Items stuck in pending > 7 days → P2
- **Alert**: Checklist endpoint error rate > 5% → P1

## Related Documentation

- Feature spec: `docs/features/hardware-staging-checklist.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302072_field_services.sql`
