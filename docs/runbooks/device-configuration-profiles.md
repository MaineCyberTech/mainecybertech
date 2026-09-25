# Device Configuration Profiles - Runbook

## Owner

Platform Engineering / Endpoint Engineering Lead

## Normal Operation

### Daily

- Review newly created device profiles for complete settings
- Confirm profiles have correct device type and OS
- Check active profiles for settings drift

### Weekly

- Audit profile coverage against the device fleet
- Review archived profiles for cleanup
- Verify settings JSONB structure is consistent

### Monthly

- Standardize profile naming conventions
- Review RLS and org scoping on device profile endpoints
- Validate delete restrictions for profiles still referenced by devices

## Common Failures

### 1. Profile List Empty

**Symptoms**: `/portal/device-profiles` shows no profiles
**Causes**:

- No profiles created for the org
  **Resolution**:

1. Create a test profile via `POST /api/v1/final/device-profiles`
2. Verify the row: `SELECT * FROM device_profiles WHERE organization_id = '...'`

### 2. Platform Missing on Card

**Symptoms**: Portal card shows no platform
**Causes**:

- `platform` field null on the record
  **Resolution**:

1. Check the stored value: `SELECT platform FROM device_profiles WHERE id = '...'`
2. Update the record with the platform value

### 3. Update/Delete Denied

**Symptoms**: PATCH/DELETE returns 403
**Causes**:

- User role lacks write permission
  **Resolution**:

1. Verify the user's membership role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid() AND m.organization_id = '...'`
2. Only admin/super_admin/technician can update; only admin/super_admin can delete

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/device-profiles?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Profiles missing settings
SELECT * FROM device_profiles WHERE settings = '{}'::jsonb;

-- Status distribution
SELECT status, count(*) FROM device_profiles GROUP BY status;

-- Duplicate profile names per org
SELECT organization_id, profile_name, count(*) FROM device_profiles GROUP BY organization_id, profile_name HAVING count(*) > 1;
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - Device profiles module down    | Platform Engineer | 30 min         |
| P1 - Profile endpoints failing      | Backend Engineer  | 2 hours        |
| P2 - Settings data integrity issues | Backend Engineer  | 4 hours        |
| P3 - Profile list UX bugs           | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS device_profiles;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/final.ts`
3. Revert `apps/api/src/validators/final.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/device-profiles/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `device_profiles_active` (gauge) - count of active profiles
- **Alert**: Profile create/update error rate > 5% → P1
- **Alert**: Active profiles with empty settings > 20% → P2

## Related Documentation

- Feature spec: `docs/features/device-configuration-profiles.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
