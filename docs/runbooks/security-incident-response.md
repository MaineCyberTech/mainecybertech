# Security Incident Response - Runbook

## Owner

Security Operations Center (SOC) Lead / Incident Commander

## Normal Operation

### Daily

- Review open incidents in `detected` and `contained` status
- Ensure high/critical incidents have a named `lead_user_id`
- Verify `affected_systems` is populated for scoping

### Weekly

- Confirm incidents progress detected → contained → eradicated → recovered
- Check `closed_at` is set on all `closed` incidents
- Hold post-incident reviews for closed high/critical incidents

### Monthly

- Analyze root causes across incidents; feed `lessons_learned` into SOP library and tabletop exercises
- Review severity distribution for risk reporting

## Common Failures

### 1. Incidents Stuck in Early Stages

**Symptoms**: Incidents remain `detected` for days without status changes
**Causes**:

- No lead assigned
- Stage timestamps not updated alongside status
  **Resolution**:

1. Assign `lead_user_id`
2. PATCH `status` + matching timestamp (e.g. `contained_at`)
3. Track via status index queries

### 2. Portal Incident Response Empty

**Symptoms**: Portal shows no incidents
**Causes**:

- No records for active org
- RLS policy blocking
  **Resolution**:

1. `SELECT count(*) FROM incident_responses WHERE organization_id = '<org>';`
2. Check `pg_policies` for `incident_responses`
3. Verify membership approved

### 3. Closed Incidents Missing Lessons Learned

**Symptoms**: Closed incidents have empty `lessons_learned`
**Causes**:

- Closure happened without post-incident review
  **Resolution**:

1. Backfill via PATCH
2. Update the review process to require lessons before closure

### 4. Delete Rejected

**Symptoms**: DELETE returns 403/denied
**Causes**:

- User role is not admin/super_admin
  **Resolution**:

1. Confirm role: `SELECT r.key FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.user_id = auth.uid();`
2. Audit trail: prefer archiving (status) over deleting records

## Verification Steps

### Health Check

```bash
# List incidents
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/security-suite/incidents?organization_id=$ORG_ID"

# Get incident detail
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/security-suite/incidents/$ID"
```

### Data Integrity

```sql
-- Incidents missing closure timestamps
SELECT title FROM incident_responses
WHERE status = 'closed' AND closed_at IS NULL;

-- Open high/critical incidents
SELECT title, severity, status FROM incident_responses
WHERE status NOT IN ('closed') AND severity IN ('high', 'critical');

-- Stage/timestamp mismatch (detected stage should have detected_at)
SELECT title FROM incident_responses
WHERE status = 'detected' AND detected_at IS NULL;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - Active critical incident      | Security Incident | 15 min         |
| P1 - Incident records inaccessible | Backend Engineer  | 2 hours        |
| P2 - Incident update failures      | Backend Engineer  | 4 hours        |
| P3 - Portal display issues         | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302070 causes issues (incidents table only):
DROP TABLE IF EXISTS incident_responses;
```

### API Rollback

1. Revert `apps/api/src/routes/security-suite.ts` incidents crudRoute
2. Revert `apps/api/src/validators/security-suite.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page `apps/web/app/(portal)/portal/incident-response/`
2. Revert admin page `apps/web/app/(admin)/admin/incidents/`
3. Deploy previous Web image

## Monitoring

- **Metric**: `incidents_open` (gauge) - incidents not closed
- **Metric**: `incidents_high_critical` (gauge) - open high/critical incidents
- **Metric**: `incident_mttr_hours` (gauge) - mean time to recovery
- **Alert**: Open high/critical incident > 4 hours → P0
- **Alert**: Any incident stuck in `detected` > 24 hours → P1

## Related Documentation

- Feature spec: `docs/features/security-incident-response.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302070_security_suite.sql`
- SOP Library: `docs/features/msp-sop-library.md`
