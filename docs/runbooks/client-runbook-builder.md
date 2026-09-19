# Client Runbook Builder - Runbook

## Owner

MSP Operations Lead

## Normal Operation

### Daily

- Respond to portal feedback on runbooks; fix inaccurate procedures as reported

### Weekly

- Review runbooks due for review (`next_review_at` within 7 days)
- Update version labels when content changes materially
- Verify newly created runbooks have a `category` assigned

### Monthly

- Audit all runbooks for `status = 'draft'` that should be `active`
- Purge or archive obsolete runbooks
- Review `last_reviewed_at` vs `next_review_at` gaps to ensure review cadence is met

## Common Failures

### 1. Runbook Missing From Portal

**Symptoms**: Runbook exists in DB but does not render on `/portal/runbooks`
**Causes**:

- Status still `draft`
- Organization mismatch — portal lists only the approved membership org
  **Resolution**:

1. Check status: `SELECT id, title, status FROM client_runbooks WHERE organization_id = '...'`
2. Verify the portal session's active org matches the runbook's `organization_id`

### 2. Version Stale

**Symptoms**: Portal shows an old `version` after content updates
**Causes**:

- `version` not bumped on PATCH
- Updated via a client that omits the field
  **Resolution**:

1. Update the record with a new version: `UPDATE client_runbooks SET version = '2.0', updated_at = now() WHERE id = '...'`
2. Enforce version bump in the authoring workflow going forward

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid runbook IDs
**Causes**:

- User not in organization memberships
- `organization_id` missing from the request
  **Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Ensure the API request includes the correct `organization_id`

## Verification Steps

### Health Check

```bash
# API list
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/runbooks?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM client_runbooks;"
```

### Data Integrity

```sql
-- Runbooks past their review date
SELECT id, title, status FROM client_runbooks
WHERE next_review_at IS NOT NULL AND next_review_at < now();

-- Drafts never published
SELECT id, title, created_at FROM client_runbooks WHERE status = 'draft';

-- Runbooks without a category
SELECT id, title FROM client_runbooks WHERE category IS NULL OR category = '';
```

## Escalation

| Severity                        | Contact           | SLA            |
| ------------------------------- | ----------------- | -------------- |
| P0 - No runbooks accessible     | Platform Engineer | 30 min         |
| P1 - Portal runbook list broken | Frontend Engineer | 2 hours        |
| P2 - Runbook content corruption | Backend Engineer  | 4 hours        |
| P3 - Missing version control    | Operations        | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302074 causes issues:
DROP TABLE IF EXISTS client_runbooks;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` route registration
2. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/runbooks/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `runbooks_active` (gauge) - count of active runbooks per org
- **Metric**: `runbooks_overdue_review` (gauge) - count with `next_review_at` past due
- **Alert**: Overdue review count > 25% of active runbooks → P2

## Related Documentation

- Feature spec: `docs/features/client-runbook-builder.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
