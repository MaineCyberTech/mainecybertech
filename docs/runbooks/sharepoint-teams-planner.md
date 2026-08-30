# SharePoint & Teams Planner - Runbook

## Owner

MSP M365 Engineer / Collaboration Lead

## Normal Operation

### Daily

- Review new SharePoint plans in `planned` status
- Check for sites with `external_sharing` enabled and verify they are intended
- Confirm owners are assigned to each plan

### Weekly

- Run the structure summary (`GET /api/v1/final/sharepoint/structure-summary`)
- Review `active` sites for label and sharing compliance
- Follow up on plans stalled in `planned` status

### Monthly

- Audit sensitivity labels against M365 tenant labels
- Verify `team_name` links still resolve to real Teams
- Update notes with provisioning outcomes

## Common Failures

### 1. Plan Stuck in Planned

**Symptoms**: Plans remain `planned` after provisioning
**Causes**:

- Status not updated after site creation
- No owner assigned to complete the handoff

**Resolution**:

1. Identify stalled: `SELECT site_name, status FROM sharepoint_plans WHERE status = 'planned' AND updated_at < now() - interval '14 days'`
2. Confirm the site/team was provisioned
3. PATCH the plan to `active` and assign an `owner`

### 2. External Sharing Not Expected

**Symptoms**: Teams with `external_sharing = 'enabled'` that should be disabled
**Causes**:

- Default not applied at creation
- Policy change not reflected

**Resolution**:

1. Find enabled: `SELECT site_name, team_name FROM sharepoint_plans WHERE external_sharing = 'enabled'`
2. Verify each against the client's sharing policy
3. PATCH to `disabled` where not justified

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid plan IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/final/sharepoint?organization_id=$ORG

# Structure summary
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/final/sharepoint/structure-summary?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM sharepoint_plans;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'sharepoint_plans';"
```

### Data Integrity

```sql
-- Plans without an owner
SELECT site_name FROM sharepoint_plans WHERE owner IS NULL;

-- External sharing enabled
SELECT site_name, team_name, external_sharing FROM sharepoint_plans WHERE external_sharing = 'enabled';

-- Status distribution
SELECT status, count(*) FROM sharepoint_plans GROUP BY status;

-- Stalled plans
SELECT site_name, status FROM sharepoint_plans WHERE status = 'planned' AND updated_at < now() - interval '14 days';
```

## Escalation

| Severity                            | Contact           | SLA            |
| ----------------------------------- | ----------------- | -------------- |
| P0 - No SharePoint plans accessible | Platform Engineer | 30 min         |
| P1 - Structure summary broken       | Backend Engineer  | 2 hours        |
| P2 - External sharing misconfigured | M365 Engineer     | 4 hours        |
| P3 - Stalled plans                  | M365 Engineer     | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302074 causes issues:
DROP TABLE IF EXISTS sharepoint_plans;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` sharepoint registration
2. Revert `apps/api/src/validators/final.ts` `sp`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/sharepoint/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `sharepoint_plans_total` (gauge) - plans per org
- **Metric**: `sharepoint_plans_active` (gauge) - active sites
- **Metric**: `sharepoint_external_sharing_enabled` (gauge) - sites with external sharing
- **Alert**: External sharing enabled without notes for 7 days → P2
- **Alert**: Structure summary 5xx → P1

## Related Documentation

- Feature spec: `docs/features/sharepoint-teams-planner.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
