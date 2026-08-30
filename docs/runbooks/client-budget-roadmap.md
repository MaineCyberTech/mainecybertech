# Client Budget Roadmap - Runbook

## Owner

MSP Account Management / Client Finance Lead

## Normal Operation

### Daily

- Review newly created budget items for priority and category accuracy

### Weekly

- Update item `status` as items are approved or purchased
- Reconcile `estimated_cost` against quotes received from vendors
- Flag items whose `fiscal_year`/`quarter` is within the current quarter for action

### Monthly

- Run `GET /api/v1/final/budgets/analysis` for client leadership reviews
- Review variance by category and adjust roadmap projections
- Purge stale items that were cancelled

## Common Failures

### 1. Analysis Variance Misleading

**Symptoms**: Variance % jumps unexpectedly
**Causes**:

- `estimated_cost` entered in cents instead of dollars
- Items missing `estimated_cost` counted as zero
- Actual spend columns not maintained
  **Resolution**:

1. Verify the source rows: `SELECT item_name, estimated_cost FROM budget_roadmaps WHERE organization_id = '...'`
2. Normalize currency and confirm spend columns are updated
3. Re-run the analysis endpoint

### 2. Item Missing From Portal

**Symptoms**: Budget item exists in DB but not on `/portal/budgets`
**Causes**:

- Organization mismatch — portal lists only the approved membership org
  **Resolution**:

1. Check `organization_id`: `SELECT id, item_name FROM budget_roadmaps WHERE organization_id = '...'`
2. Confirm the portal session's active org matches

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid budget item IDs
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
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/budgets?organization_id=$ORG"

# Analysis
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/budgets/analysis?organization_id=$ORG"
```

### Data Integrity

```sql
-- High priority items in current quarter
SELECT item_name, estimated_cost, priority FROM budget_roadmaps
WHERE priority IN ('high', 'critical') AND quarter = EXTRACT(QUARTER FROM now())::int;

-- Items with no estimated cost
SELECT item_name, category FROM budget_roadmaps WHERE estimated_cost IS NULL;

-- Duplicate item names (potential double-counting)
SELECT item_name, count(*) FROM budget_roadmaps GROUP BY item_name HAVING count(*) > 1;
```

## Escalation

| Severity                        | Contact            | SLA            |
| ------------------------------- | ------------------ | -------------- |
| P0 - No budget items accessible | Platform Engineer  | 30 min         |
| P1 - Analysis endpoint broken   | Backend Engineer   | 2 hours        |
| P2 - Budget data corruption     | Backend Engineer   | 4 hours        |
| P3 - Stale roadmap projections  | Account Management | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302074 causes issues:
DROP TABLE IF EXISTS budget_roadmaps;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` route registration
2. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/budgets/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `budget_items_pending` (gauge) - count of items in `planned` status
- **Metric**: `budget_variance` (gauge) - overall projected vs actual variance %
- **Alert**: Critical priority items unapproved past their quarter → P2

## Related Documentation

- Feature spec: `docs/features/client-budget-roadmap.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
