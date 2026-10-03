# Client Onboarding Command Center - Runbook

## Owner

Platform Engineering / MSP Operations Lead

## Normal Operation

### Daily

- Onboarding leads review records in "discovery" and "m365_setup" phases
- Check for overdue phases (compare `next_review_at` with current date)
- Verify new checklist items are being completed on schedule

### Weekly

- Review all active onboarding records for stalled phases
- Run export for leadership reporting
- Verify M365 license assignments match client agreements

### Monthly

- Audit completed onboarding records for quality
- Update default checklist templates based on lessons learned
- Review risk level assessments for accuracy

## Common Failures

### 1. Phase Not Advancing

**Symptoms**: User clicks "Complete Phase" but phase doesn't change
**Causes**:

- Required checklist items not marked complete
- Optimistic lock conflict (concurrent edit)
- Database constraint violation
  **Resolution**:

1. Check all required items in current phase are completed
2. Refresh page and retry
3. Check API logs for `VERSION_CONFLICT` error

### 2. Checklist Items Missing

**Symptoms**: New onboarding record has no checklist items
**Causes**:

- Migration not applied
- Insert trigger failed
- RLS policy blocking insert
  **Resolution**:

1. Verify migration `5302078` is applied
2. Check `client_onboarding_checklist_items` table for records
3. Verify RLS policies allow insert for authenticated org members

### 3. Export Fails or Returns Empty

**Symptoms**: CSV/JSON export is empty or errors
**Causes**:

- No records in organization
- RLS policy mismatch
- Format parameter invalid
  **Resolution**:

1. Verify records exist: `SELECT * FROM client_onboarding_command_center_records WHERE organization_id = '...'`
2. Test API directly with admin token
3. Check `format` parameter is "csv" or "json"

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid record IDs
**Causes**:

- User not in organization memberships
- Membership role not admin/super_admin for write operations
- Organization ID mismatch in request
  **Resolution**:

1. Verify user membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Check role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid() AND m.organization_id = '...'`
3. Ensure API request includes correct `organizationId` header/param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/client-onboarding

# Database connectivity
psql -c "SELECT count(*) FROM client_onboarding_command_center_records;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'client_onboarding_command_center_records';"
```

### Data Integrity

```sql
-- Check for orphaned checklist items
SELECT * FROM client_onboarding_checklist_items ci
LEFT JOIN client_onboarding_command_center_records cr ON ci.onboarding_record_id = cr.id
WHERE cr.id IS NULL;

-- Verify phase progression logic
SELECT status, phase, count(*) FROM client_onboarding_command_center_records GROUP BY status, phase;

-- Check completed records have completed_at
SELECT * FROM client_onboarding_command_center_records WHERE status = 'completed' AND completed_at IS NULL;
```

## Escalation

| Severity                              | Contact           | SLA            |
| ------------------------------------- | ----------------- | -------------- |
| P0 - No onboarding records accessible | Platform Engineer | 30 min         |
| P1 - Phase advancement broken         | Backend Engineer  | 2 hours        |
| P2 - Checklist items missing          | Backend Engineer  | 4 hours        |
| P3 - Export formatting issues         | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302078 causes issues:
DROP TABLE IF EXISTS client_onboarding_checklist_items;
DROP TABLE IF EXISTS client_onboarding_command_center_records;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/client-onboarding-command-center.ts`
3. Revert `apps/api/src/services/client-onboarding-command-center.ts`
4. Revert `apps/api/src/validators/client-onboarding-command-center.ts`
5. Deploy previous API image

### Web Rollback

1. Revert portal pages in `apps/web/app/(portal)/portal/client-onboarding-command-center/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `onboarding_records_active` (gauge) - count of non-completed records
- **Metric**: `onboarding_phase_duration_seconds` (histogram) - time per phase
- **Metric**: `onboarding_checklist_completion_rate` (gauge) - % required items complete
- **Alert**: Active onboarding records > 30 days in same phase → P2
- **Alert**: Phase completion failure rate > 5% → P1

## Related Documentation

- Feature spec: `docs/features/client-onboarding-command-center.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302078_client_onboarding_command_center.sql`
