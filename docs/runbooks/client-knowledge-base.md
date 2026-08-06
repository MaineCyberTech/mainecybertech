# Client Knowledge Base - Runbook

## Owner

Platform Engineering / Content & Support Operations

## Normal Operation

### Daily

- Review published articles for obvious inaccuracies
- Respond to high not-helpful ratings on key articles

### Weekly

- Publish drafted `kb_article_generations` after review
- Search for duplicate articles across categories

### Monthly

- Retire stale articles (update `is_published = false`)
- Review helpfulness ratio to prioritize rewrites

## Common Failures

### 1. Articles Not Visible in Portal

**Symptoms**: Portal shows "No knowledge base articles yet"
**Causes**:

- Articles exist but `is_published = false`
- No articles for the org
- RLS policy `kb_org` denies access
  **Resolution**:

1. Verify articles: `SELECT id, title, is_published FROM knowledge_articles WHERE organization_id = '...';`
2. Publish via PATCH or admin UI
3. Confirm membership: `SELECT * FROM memberships WHERE user_id = auth.uid();`

### 2. Search Returns Empty

**Symptoms**: `/kb/search?q=...` returns no matches for known content
**Causes**:

- Query too specific or mis-typed
- Org scoping filter mismatch
  **Resolution**:

1. Test with a broader term: `curl ".../edu-automation/kb/search?q=password&organization_id=$ORG"`
2. Verify content exists with those terms
3. Check that the org query param matches the caller's org

### 3. Ratings Not Updating

**Symptoms**: `helpful_count`/`not_helpful_count` stay at 0
**Causes**:

- `increment_article_count` RPC missing (5302098 or later applied?)
- Article id invalid
  **Resolution**:

1. Verify RPC: `psql -c "\df increment_article_count"`
2. Confirm the article id exists and belongs to the org

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/kb?organization_id=$ORG"

# Search
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/kb/search?q=password&organization_id=$ORG"
```

### Data Integrity

```sql
-- Unpublished articles
SELECT id, title, category FROM knowledge_articles WHERE is_published = false;

-- Duplicate titles
SELECT title, count(*) FROM knowledge_articles GROUP BY title HAVING count(*) > 1;

-- Low-utility articles (more not-helpful than helpful)
SELECT id, title, helpful_count, not_helpful_count FROM knowledge_articles
WHERE not_helpful_count > helpful_count;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P0 - KB page broken            | Platform Engineer | 30 min         |
| P1 - Article publishing broken | Backend Engineer  | 2 hours        |
| P2 - Search indexing issues    | Backend Engineer  | 4 hours        |
| P3 - Rating/analytics accuracy | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS knowledge_articles;
DROP FUNCTION IF EXISTS increment_article_count(uuid, text);
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts`
2. Revert `apps/api/src/validators/edu-automation.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/client-knowledge-base/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `kb_published_articles` (gauge)
- **Metric**: `kb_helpful_ratio` (gauge) - helpful / (helpful + not-helpful)
- **Metric**: `kb_search_requests` (rate)
- **Alert**: Published articles dropped > 20% in a week → P2
- **Alert**: Helpful ratio < 50% on top-viewed articles → P2

## Related Documentation

- Feature spec: `docs/features/client-knowledge-base.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`
