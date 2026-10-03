# Dynamic Client Forms Builder - Runbook

## Owner

Platform Engineering / Client Services Lead

## Normal Operation

### Daily

- Review recently published forms for open/close window accuracy
- Check new form submissions landing in `dynamic_form_submissions`
- Verify form status transitions (draft → published → closed)

### Weekly

- Audit form types in use across organizations
- Review submitted answers for completeness
- Validate exports for client reporting

### Monthly

- Archive obsolete forms by closing them
- Update field schemas for changed processes
- Review RLS policies on `dynamic_client_forms` and `dynamic_form_submissions`

## Common Failures

### 1. Form List Empty

**Symptoms**: `/portal/dynamic-client-forms-builder` shows "No forms yet"
**Causes**:

- No forms created for the org
- API list call failing silently
  **Resolution**:

1. Create a test form via the New Form page
2. Verify the row: `SELECT * FROM dynamic_client_forms WHERE organization_id = '...'`

### 2. Cannot Submit a Form

**Symptoms**: Submission fails or form is not fillable
**Causes**:

- Form not published
- Form past its `closes_at` date
  **Resolution**:

1. Check status: `SELECT status, closes_at FROM dynamic_client_forms WHERE id = '...'`
2. Publish via `POST /api/v1/dynamic-forms/:id/publish`

### 3. Submissions Missing

**Symptoms**: Submission list empty after respondents filled the form
**Causes**:

- Wrong form id scoped to another org
- Answers not persisted
  **Resolution**:

1. Verify submissions: `SELECT * FROM dynamic_form_submissions WHERE form_id = '...'`
2. Re-submit through the fill page and check `submitted_at`

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/dynamic-forms?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Submissions without a valid parent form
SELECT * FROM dynamic_form_submissions s
LEFT JOIN dynamic_client_forms f ON s.form_id = f.id
WHERE f.id IS NULL;

-- Form status distribution
SELECT status, count(*) FROM dynamic_client_forms GROUP BY status;

-- Submissions after a form closed
SELECT * FROM dynamic_form_submissions s
JOIN dynamic_client_forms f ON s.form_id = f.id
WHERE f.closes_at IS NOT NULL AND s.submitted_at > f.closes_at;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - Forms module unavailable    | Platform Engineer | 30 min         |
| P1 - Submission endpoint failing | Backend Engineer  | 2 hours        |
| P2 - Export issues               | Backend Engineer  | 4 hours        |
| P3 - Form builder UX bugs        | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS dynamic_form_submissions;
DROP TABLE IF EXISTS dynamic_client_forms;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/dynamic-client-forms-builder.ts`
3. Revert `apps/api/src/services/dynamic-client-forms-builder.ts`
4. Revert `apps/api/src/validators/dynamic-client-forms-builder.ts`
5. Deploy previous API image

### Web Rollback

1. Revert portal pages in `apps/web/app/(portal)/portal/dynamic-client-forms-builder/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `dynamic_forms_active` (gauge) - count of published forms
- **Metric**: `dynamic_forms_submissions_rate` (rate) - submissions per hour
- **Alert**: Submit endpoint error rate > 5% → P1
- **Alert**: Published forms with `closes_at` in the past still open → P2

## Related Documentation

- Feature spec: `docs/features/dynamic-client-forms-builder.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302080_dynamic_client_forms_builder.sql`
