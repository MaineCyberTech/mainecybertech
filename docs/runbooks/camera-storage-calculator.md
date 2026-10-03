# Camera Storage Calculator - Runbook

## Owner

Field Services / Sales Engineering

## Normal Operation

### Daily

- Review `portal/camera-calculator` estimates before quoting NVR hardware
- Verify bitrate assumptions match the camera model and resolution

### Weekly

- Cross-check recommended NVR tier against vendor capacity charts
- Save calculation results as `camera_calculations` rows for active quotes

### Monthly

- Re-validate bitrate defaults (4 Mbps) against current camera lineups
- Archive completed calculations older than 12 months
- Report typical storage-per-camera metrics to engineering

## Common Failures

### 1. Estimate Seems Too High/Low

**Symptoms**: TB figure far from expected for the site
**Causes**: Wrong bitrate or resolution assumption
**Resolution**:

1. Confirm `avg_bitrate_mbps` matches the camera's actual encode settings
2. Re-run `POST /calculate` with corrected inputs
3. Verify retention days matches the client requirement

### 2. Calculation Returns Zero

**Symptoms**: `dailyStorageGB` and `totalStorageTB` are 0
**Causes**: `cameraCount` below 1 or `bitrateMbps` below 0.1
**Resolution**:

1. Validate inputs: `cameraCount >= 1`, `bitrateMbps >= 0.1`
2. Re-submit with valid numbers

### 3. NVR Tier Surprising

**Symptoms**: "Standard" recommended for a large site
**Causes**: Tier thresholds based on total TB: Standard ≤ 2 TB, Business ≤ 10 TB, Enterprise > 10 TB
**Resolution**:

1. Recompute expected TB with realistic bitrate
2. Compare against the formula in the feature doc

### 4. Delete Denied (403)

**Symptoms**: DELETE returns 403
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"organizationId":"<ORG>","cameraCount":16,"bitrateMbps":4,"resolution":"4MP","retentionDays":30,"fps":15}' \
  "https://api.mainecybertech.com/api/v1/field-services/camera-calc/calculate"
```

### Data Integrity

```sql
-- Calculations without an estimate
SELECT site_name FROM camera_calculations WHERE estimated_storage_tb IS NULL;

-- Blanket check on typical values
SELECT site_name, camera_count, avg_bitrate_mbps, estimated_storage_tb FROM camera_calculations;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P2       | Field Services    | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS camera_calculations;
```

### API Rollback

1. Revert `/api/v1/field-services` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/field-services.ts` (camera-calc CRUD + calculate)
3. Deploy previous API image

## Monitoring

- **Metric**: `camera_calc_avg_storage_tb` (gauge) - average estimate per camera count
- **Alert**: Calculator endpoint error rate > 2% → P2

## Related Documentation

- Feature spec: `docs/features/camera-storage-calculator.md`
- Database schema: `supabase/migrations/5302072_field_services.sql` + `5302094_camera_calculation_fields.sql`
