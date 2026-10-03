# AI Service Desk Copilot - Runbook

## Owner

Platform Engineering / Service Desk Operations Lead

## Normal Operation

### Daily

- Review new triage drafts in `ticket_triage_drafts` with status `draft` or `analyzed`
- Convert approved drafts to tickets and check `converted_ticket_id` linkage
- Watch confidence scores to spot analysis quality issues

### Weekly

- Audit conversion rate: drafts converted vs total analyzed
- Review categories with consistently low confidence scores
- Verify audit events `triage.analyzed` and `triage.converted_to_ticket` are logged

### Monthly

- Tune the keyword category map if misclassifications persist
- Review missing-info flags to improve intake prompts
- Confirm RLS and org scoping still apply to all triage endpoints

## Common Failures

### 1. Triage List Empty

**Symptoms**: `/portal/ai-triage` shows zero drafts
**Causes**:

- No descriptions have been analyzed
- Organization ID mismatch in the request
  **Resolution**:

1. Run `POST /api/v1/ai/triage/analyze` for a sample description
2. Verify the row is inserted: `SELECT * FROM ticket_triage_drafts WHERE organization_id = '...'`

### 2. Category Always "general"

**Symptoms**: All drafts classify as general
**Causes**:

- Description contains no keyword matches
- Keyword map not covering the domain
  **Resolution**:

1. Review the raw description for known keywords
2. Extend `CATEGORY_KEYWORDS` in `apps/api/src/routes/ai.ts` and redeploy

### 3. Convert Draft Fails 404

**Symptoms**: `POST /api/v1/ai/triage/convert` returns NOT_FOUND
**Causes**:

- Draft id not in the organization
- Draft already converted
  **Resolution**:

1. Verify the draft exists: `SELECT id, status FROM ticket_triage_drafts WHERE id = '...'`
2. Only `draft`/`analyzed` drafts can be converted

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/ai/triage?organization_id=$ORG_ID"

# Database connectivity
psql -c "SELECT count(*) FROM ticket_triage_drafts;"
```

### Data Integrity

```sql
-- Drafts without conversion linkage
SELECT * FROM ticket_triage_drafts WHERE status = 'converted' AND converted_ticket_id IS NULL;

-- Conversion rate
SELECT status, count(*) FROM ticket_triage_drafts GROUP BY status;

-- Orphan drafts (ticket deleted)
SELECT * FROM ticket_triage_drafts WHERE converted_ticket_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_triage_drafts.converted_ticket_id);
```

## Escalation

| Severity                        | Contact             | SLA            |
| ------------------------------- | ------------------- | -------------- |
| P0 - Triage console unavailable | Platform Engineer   | 30 min         |
| P1 - Analyze endpoint failing   | Backend Engineer    | 2 hours        |
| P2 - Misclassification          | ML/Backend Engineer | 4 hours        |
| P3 - Draft conversion UX issues | Frontend Engineer   | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS ticket_triage_drafts;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/ai.ts`
3. Revert `apps/api/src/validators/ai.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/ai-triage/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `ai_triage_drafts_total` (gauge) - count of triage drafts by status
- **Metric**: `ai_triage_conversion_rate` (gauge) - converted / analyzed
- **Alert**: Analyze endpoint error rate > 5% → P1
- **Alert**: No drafts created in 24h (expected volume exists) → P2

## Related Documentation

- Feature spec: `docs/features/ai-service-desk-copilot.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302065_ticket_triage.sql`
