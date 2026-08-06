# MSP SOP Library - Runbook

## Owner

Quality / Process Owner or Operations Manager

## Normal Operation

### Daily

- Review new SOP drafts for completeness
- Verify required compliance control mappings before SOPs go active

### Weekly

- Check for SOPs past `next_review_at` and schedule reviews
- Confirm newly added SOPs have `sop_number` and `category` set

### Monthly

- Run `framework-gaps` to report compliance coverage to leadership
- Retire obsolete SOPs (set status `retired`)
- Bump `version` when content changes materially

## Common Failures

### 1. Compliance Map Shows Everything Uncategorized

**Symptoms**: All SOPs appear under the "uncategorized" bucket in `compliance-map`
**Causes**:

- SOPs created without a `compliance_framework` value
- Framework field left null on create
  **Resolution**:

1. Query: `SELECT title, compliance_framework FROM sop_library WHERE organization_id = '<org>';`
2. PATCH each SOP with the correct `complianceFramework`
3. Re-run compliance-map

### 2. Framework Gaps Show 0% Coverage

**Symptoms**: `framework-gaps` reports 0% for frameworks that have SOPs
**Causes**:

- SOPs are still `draft` status
- No `framework_control_ids` mapped
  **Resolution**:

1. Confirm SOP `status = 'active'`
2. Verify control IDs: `SELECT framework_control_ids FROM sop_library WHERE organization_id = '<org>';`
3. Map controls and re-run

### 3. PATCH Fails on Compliance Fields

**Symptoms**: Update returns a validation error when sending `reviewCycleDays` or `frameworkControlIds`
**Causes**:

- Wrong value type (e.g. string instead of number/array)
- Sending an undefined/null field the schema rejects
  **Resolution**:

1. Confirm `frameworkControlIds` is an array of strings
2. Send only the fields being changed

### 4. Portal SOP Library Empty

**Symptoms**: Portal shows no SOPs
**Causes**:

- No records for active org
- RLS policy blocking
  **Resolution**:

1. `SELECT count(*) FROM sop_library WHERE organization_id = '<org>';`
2. Check `pg_policies` for `sop_library`
3. Verify membership approved

## Verification Steps

### Health Check

```bash
# List SOPs
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/governance/sop-library?organization_id=$ORG_ID"

# Compliance map
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/governance/sop-library/compliance-map?organization_id=$ORG_ID"

# Framework gaps
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/governance/sop-library/framework-gaps?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- SOPs overdue for review
SELECT title, next_review_at FROM sop_library
WHERE next_review_at < now() AND status = 'active';

-- Draft SOPs still mapping frameworks
SELECT title, compliance_framework FROM sop_library
WHERE status = 'draft' AND compliance_framework IS NOT NULL;

-- Orphaned SOPs (should be empty)
SELECT s.* FROM sop_library s
LEFT JOIN organizations o ON o.id = s.organization_id
WHERE o.id IS NULL;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P1 - SOP library inaccessible  | Backend Engineer  | 2 hours        |
| P2 - Compliance analytics down | Backend Engineer  | 4 hours        |
| P3 - Portal display issues     | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302073/5302086 cause issues (SOP tables only):
DROP TABLE IF EXISTS sop_library;
```

### API Rollback

1. Revert `apps/api/src/routes/governance.ts` sop-library routes
2. Revert `apps/api/src/routes/edu-automation.ts` sop CRUD registration
3. Revert `apps/api/src/validators/governance.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/sop-library/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `sop_library_total` (gauge) - total SOPs per org
- **Metric**: `sop_library_overdue_reviews` (gauge) - SOPs past `next_review_at`
- **Metric**: `sop_framework_coverage` (gauge) - overall compliance % from framework-gaps
- **Alert**: Overdue reviews > 25% of active SOPs → P2
- **Alert**: Compliance analytics 5xx > 1% → P2

## Related Documentation

- Feature spec: `docs/features/msp-sop-library.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`, `5302086_sop_library_compliance.sql`
