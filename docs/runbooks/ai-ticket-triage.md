# AI Ticket Triage - Runbook

## Owner

Platform Engineering / Help Desk Operations Lead

## Normal Operation

### Daily

- Technicians review `portal/ai-triage` drafts with status `analyzed`
- Convert accepted drafts to tickets; discard or re-analyze rejected ones
- Check for drafts stuck in `draft` status (analysis never completed)

### Weekly

- Review triage confidence scores; identify descriptions that mis-categorize
- Update keyword lexicons in `apps/api/src/routes/ai.ts` for recurring misses
- Verify converted drafts link correctly to their tickets (`converted_ticket_id`)

### Monthly

- Audit conversion rate (drafts → tickets)
- Review `copilot` reply-draft usage and tone quality
- Archive stale drafts older than 90 days

## Common Failures

### 1. Draft Stuck in Draft Status

**Symptoms**: Row exists with `status = 'draft'`, no suggestions populated
**Causes**: Analysis insert failed partway, or RLS blocked the write
**Resolution**:

1. Check `ticket_triage_drafts` row for null `suggested_category`
2. Re-submit the description through `POST /ai/triage/analyze`
3. Check API logs for `DB_ERROR` on insert

### 2. Wrong Category Suggested

**Symptoms**: Hardware issues classified as software, etc.
**Causes**: Keyword overlap (e.g., "laptop" in both hardware and software)
**Resolution**:

1. Review the `CATEGORY_KEYWORDS` map in `ai.ts`
2. Add negative keywords or reorder scoring so the intended category wins
3. Re-run the analysis with the corrected description

### 3. Convert Fails with 404

**Symptoms**: `POST /ai/triage/convert` returns NOT_FOUND
**Causes**: Draft id does not exist or is scoped to another organization
**Resolution**:

1. Verify the draft exists: `SELECT * FROM ticket_triage_drafts WHERE id = '<id>'`
2. Confirm the caller's membership matches `organization_id`
3. Check the ticket insert didn't violate `created_by` NOT NULL (set from `req.authUser.userId`)

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid draft IDs
**Causes**: User not in org memberships
**Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '<org>'`
2. Re-check the `organization_id` passed in the request

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/ai/triage?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Drafts never converted
SELECT count(*) FROM ticket_triage_drafts WHERE status NOT IN ('converted', 'draft');

-- Orphaned conversions (converted without ticket)
SELECT * FROM ticket_triage_drafts WHERE converted_ticket_id IS NULL AND status = 'converted';
```

## Escalation

| Severity | Contact           | SLA    |
| -------- | ----------------- | ------ |
| P0       | Platform Engineer | 30 min |
| P1       | Backend Engineer  | 2 hrs  |
| P2       | Frontend Engineer | 1 day  |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS ticket_triage_drafts;
```

### API Rollback

1. Revert route registration for `/api/v1/ai` in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/ai.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `ai_triage_drafts_total` (gauge) - drafts per org
- **Metric**: `ai_triage_conversion_rate` (gauge) - % converted to tickets
- **Alert**: High volume of low-confidence drafts (< 40) → P2
- **Alert**: Conversion failures > 5% → P1

## Related Documentation

- Feature spec: `docs/features/ai-ticket-triage.md`
- Database schema: `supabase/migrations/5302065_ticket_triage.sql`
