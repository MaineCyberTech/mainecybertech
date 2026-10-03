# Network Diagram Builder - Runbook

## Owner

Platform Engineering / Network Engineering Lead

## Normal Operation

### Daily

- Review newly created network diagrams for site accuracy
- Confirm device/VLAN/WAN counts match the diagram payload
- Check diagram status (draft vs published)

### Weekly

- Audit diagram completeness across client sites
- Verify export endpoint returns valid JSON
- Review stale diagrams needing updates

### Monthly

- Standardize diagram naming and conventions
- Review RLS and org scoping on diagram endpoints
- Clean up archived diagrams

## Common Failures

### 1. Diagram List Empty

**Symptoms**: `/portal/network-diagrams` shows no diagrams
**Causes**:

- No diagrams created for the org
  **Resolution**:

1. Create a test diagram via `POST /api/v1/field-services/network-diagrams`
2. Verify the row: `SELECT * FROM network_diagrams WHERE organization_id = '...'`

### 2. Export Returns 404

**Symptoms**: `GET /api/v1/field-services/network-diagrams/:id/export` returns NOT_FOUND
**Causes**:

- Diagram id not in the organization
  **Resolution**:

1. Verify the diagram exists: `SELECT id FROM network_diagrams WHERE id = '...'`
2. Confirm the correct id is used in the request

### 3. Counts All Zero

**Symptoms**: Device/VLAN/WAN counts display as zero
**Causes**:

- Summary counts not populated on the record
  **Resolution**:

1. Check the stored counts: `SELECT device_count, vlan_count, wan_count FROM network_diagrams WHERE id = '...'`
2. Update the record via PATCH with accurate counts

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/field-services/network-diagrams?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Diagrams with no diagram payload
SELECT * FROM network_diagrams WHERE diagram_data = '{}'::jsonb;

-- Status distribution
SELECT status, count(*) FROM network_diagrams GROUP BY status;

-- Duplicate site names per org
SELECT organization_id, site_name, count(*) FROM network_diagrams GROUP BY organization_id, site_name HAVING count(*) > 1;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - Network diagrams module down  | Platform Engineer | 30 min         |
| P1 - Diagram endpoints failing     | Backend Engineer  | 2 hours        |
| P2 - Export/count integrity issues | Backend Engineer  | 4 hours        |
| P3 - Diagram list UX bugs          | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS network_diagrams;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/field-services.ts`
3. Revert `apps/api/src/validators/field-services.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/network-diagrams/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `network_diagrams_active` (gauge) - count of diagrams per status
- **Alert**: Diagram export error rate > 5% → P1
- **Alert**: Diagrams with zero device counts > 20% → P2

## Related Documentation

- Feature spec: `docs/features/network-diagram-builder.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302072_field_services.sql`
