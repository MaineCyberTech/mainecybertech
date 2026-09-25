# Network Port Map Tracker - Runbook

## Owner

Field Services / Network Engineering

## Normal Operation

### Daily

- Review `portal/network-port-maps` for ports with unknown `connected_device`
- Verify new switch installs get their port maps recorded within 48 hours

### Weekly

- Update `wall_jack_label` and `connected_device` for moved equipment
- Confirm uplink/PoE flags match switch configuration
- Check for duplicate switch/port entries

### Monthly

- Audit port maps against live switch LLDP/ARP data
- Clean up stale entries for decommissioned switches
- Report port utilization to capacity planning

## Common Failures

### 1. Duplicate Port Entries

**Symptoms**: Same `switch_name` + `port_number` appears multiple times
**Causes**: Manual entry without dedup at the site
**Resolution**:

1. Query: `SELECT switch_name, port_number, count(*) FROM port_maps GROUP BY switch_name, port_number HAVING count(*) > 1;`
2. Keep the most recent row, delete others (admin/super_admin only)

### 2. Device Identity Stale

**Symptoms**: `connected_device` doesn't match what's physically plugged in
**Causes**: Equipment moved without updating the map
**Resolution**:

1. Verify against LLDP/ARP or physical inspection
2. PATCH the row with the current device

### 3. List Empty on Portal

**Symptoms**: No port maps visible
**Causes**: No mappings recorded for the org
**Resolution**:

1. Confirm rows exist: `SELECT * FROM port_maps WHERE organization_id = '<org>';`
2. Verify the caller has an approved membership in the org

### 4. Delete Denied (403)

**Symptoms**: DELETE returns 403
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/field-services/port-maps?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Ports flagged as both uplink and regular
SELECT switch_name, port_number FROM port_maps WHERE uplink = true AND poe_enabled = true;

-- Missing wall jack labels
SELECT switch_name, port_number FROM port_maps WHERE wall_jack_label IS NULL;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P2       | Field Services    | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS port_maps;
```

### API Rollback

1. Revert `/api/v1/field-services` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/field-services.ts` (port-maps CRUD)
3. Deploy previous API image

## Monitoring

- **Metric**: `port_map_count` (gauge) - mappings per org
- **Metric**: `port_map_coverage` (gauge) - % of switch ports mapped
- **Alert**: No port map updates for a client in 90 days → P3

## Related Documentation

- Feature spec: `docs/features/network-port-map-tracker.md`
- Database schema: `supabase/migrations/5302072_field_services.sql`
