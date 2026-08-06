# DMARC Coach - Runbook

## Owner

Security Engineering / Compliance

## Normal Operation

### Daily

- Review `portal/dmarc-coach` for newly added domains with grades below C
- Verify no client domain is running `p=none` without a migration plan

### Weekly

- Run new analyses for domains added or DNS-changed
- Confirm SPF/DKIM records match provider changes
- Push recommendations to clients for `p=quarantine` progression

### Monthly

- Report grade distribution across client domains to leadership
- Re-analyze domains where remediation was applied to confirm grade lift
- Archive analyses older than 12 months

## Common Failures

### 1. Grade Always F

**Symptoms**: Domain stuck at F after records were added
**Causes**: Records not provided to the analyzer, or records not re-analyzed
**Resolution**:

1. Re-run `POST /dmarc-coach/analyze` with current DMARC/SPF/DKIM TXT values
2. Verify the TXT record content is complete (`v=DMARC1; p=...; rua=...`)

### 2. Analysis 404

**Symptoms**: `GET /dmarc-coach/:id` returns NOT_FOUND
**Causes**: Wrong id or org scoping mismatch
**Resolution**:

1. Confirm the row exists: `SELECT * FROM dmarc_analyses WHERE id = '<id>'`
2. Ensure the caller's membership matches the `organization_id`

### 3. Recommendations Not Actionable

**Symptoms**: Generic advice repeated on every domain
**Causes**: Heuristic analysis without DNS introspection
**Resolution**:

1. Compare raw TXT records against the stored `dmarc_record`/`spf_record`/`dkim_record`
2. Re-analyze after records are corrected

### 4. Delete Denied

**Symptoms**: 403 on DELETE
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/dmarc-coach?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Analyses without a grade
SELECT id, domain FROM dmarc_analyses WHERE overall_grade IS NULL;

-- Grade distribution
SELECT overall_grade, count(*) FROM dmarc_analyses GROUP BY overall_grade;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P1       | Security Engineer | 2 hrs |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS dmarc_analyses;
```

### API Rollback

1. Revert `/api/v1/dmarc-coach` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/dmarc-coach.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `dmarc_grade_distribution` (gauge) - per grade bucket
- **Metric**: `dmarc_domains_below_c` (gauge) - domains needing remediation
- **Alert**: Client domain drops below B grade after being ≥ B → P2
- **Alert**: Any domain with `p=none` for 90+ days → P2

## Related Documentation

- Feature spec: `docs/features/dmarc-coach.md`
- Database schema: `supabase/migrations/5302089_dmarc_coach.sql`
