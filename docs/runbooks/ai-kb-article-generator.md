# AI KB Article Generator - Runbook

## Owner

Service Desk Lead / Knowledge Base Administrator

## Normal Operation

### Daily

- Review `draft` KB generation records awaiting generation
- Review `generated` records awaiting human review
- Verify generated articles are not published without review

### Weekly

- Publish reviewed articles to the knowledge base
- Confirm source tickets referenced (`source_ticket_id`) are resolved
- Check for duplicate article topics

### Monthly

- Audit generation-to-publish conversion rate
- Clean up stale `draft` records never generated
- Report KB coverage and content quality to leadership

## Common Failures

### 1. Generation Returns 404

**Symptoms**: `POST /kb-generator/:id/generate` returns 404
**Causes**:

- Record id does not exist in the org
- Record deleted between list and action

**Resolution**:

1. Confirm the record: `SELECT id, source_title FROM kb_article_generations WHERE id = '...'`
2. Re-create the generation record if missing
3. Retry the generate endpoint

### 2. Generated Content Empty

**Symptoms**: `generated_content` null after generation
**Causes**:

- `source_title` null at generation time
- Generation handler failed before writing content

**Resolution**:

1. Check the record: `SELECT source_title, generated_content, status FROM kb_article_generations WHERE id = '...'`
2. PATCH `source_title` to a meaningful title
3. Re-run `POST /kb-generator/:id/generate`

### 3. Articles Published Without Review

**Symptoms**: Draft content appearing as client-facing KB articles
**Causes**:

- Human review step skipped
- Direct write to `knowledge_articles` bypassing the workflow

**Resolution**:

1. Confirm review trail: `SELECT status, reviewed_by, reviewed_at FROM kb_article_generations WHERE id = '...'`
2. Publish only records with `reviewed_by` populated
3. Enforce the review step in process before publishing

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid generation IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/edu-automation/kb-generator?organization_id=$ORG

# Database connectivity
psql -c "SELECT count(*) FROM kb_article_generations;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'kb_article_generations';"
```

### Data Integrity

```sql
-- Drafts that were never generated
SELECT id, source_title FROM kb_article_generations WHERE status = 'draft';

-- Generated but never reviewed
SELECT id, source_title FROM kb_article_generations WHERE status = 'generated' AND reviewed_at IS NULL;

-- Generated records with empty content
SELECT id FROM kb_article_generations WHERE status IN ('generated','draft') AND generated_content IS NULL;

-- Status distribution
SELECT status, count(*) FROM kb_article_generations GROUP BY status;
```

## Escalation

| Severity                      | Contact           | SLA            |
| ----------------------------- | ----------------- | -------------- |
| P0 - No KB data accessible    | Platform Engineer | 30 min         |
| P1 - Generate endpoint broken | Backend Engineer  | 2 hours        |
| P2 - Draft articles published | KB Administrator  | 4 hours        |
| P3 - Stale draft cleanup      | KB Administrator  | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302073 causes issues:
DROP TABLE IF EXISTS kb_article_generations;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts` kb-generator registration
2. Revert `apps/api/src/validators/edu-automation.ts` `kbGen`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/client-knowledge-base/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `kb_generations_draft` (gauge) - drafts awaiting generation
- **Metric**: `kb_generations_pending_review` (gauge) - generated awaiting review
- **Metric**: `kb_generation_publish_rate` (gauge) - share of generated → published
- **Alert**: Drafts not generated for 7 days → P3
- **Alert**: Generate endpoint 5xx → P1

## Related Documentation

- Feature spec: `docs/features/ai-kb-article-generator.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`
