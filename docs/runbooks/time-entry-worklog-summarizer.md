# Time Entry Worklog Summarizer - Runbook

## Owner

Service Desk Lead / Account Manager

## Normal Operation

### Daily

- Review time entries for missing or incomplete descriptions
- Verify hours logged against work performed on linked tickets
- Flag non-billable entries that should be billable (or vice versa)

### Weekly

- Run the worklog summary (`GET /api/v1/final/time-entries/summary?days=30`)
- Confirm billable vs non-billable split for client reporting
- Resolve entries with missing `work_date`

### Monthly

- Produce the monthly worklog report for each client
- Audit entries against ticket activity for accuracy
- Reconcile total hours with project/engagement expectations

## Common Failures

### 1. Hours Display 0.0

**Symptoms**: Entry card shows 0.0h
**Causes**:

- `hours` not set (default 0)
- Create payload omitted `hours`

**Resolution**:

1. Find zero-hour entries: `SELECT description, work_date FROM time_entries WHERE hours = 0`
2. PATCH with the correct `hours`
3. Confirm the entry should remain billable/non-billable

### 2. Summary Period Unexpected

**Symptoms**: Summary totals don't match expectations
**Causes**:

- `days` param outside 1-90 (clamped)
- Entries with `work_date` outside the window
- Entries missing `work_date` counted under "unknown"

**Resolution**:

1. Confirm the request: `GET /time-entries/summary?days=30`
2. Check entries with null work_date: `SELECT count(*) FROM time_entries WHERE work_date IS NULL`
3. Backfill missing `work_date` values

### 3. RLS Access Denied

**Symptoms**: 403/404 on valid entry IDs
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
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/final/time-entries?organization_id=$ORG

# Summary
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/final/time-entries/summary?organization_id=$ORG&days=30"

# Database connectivity
psql -c "SELECT count(*) FROM time_entries;"

# RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'time_entries';"
```

### Data Integrity

```sql
-- Entries with zero or negative hours
SELECT description FROM time_entries WHERE hours <= 0;

-- Entries missing work_date
SELECT description FROM time_entries WHERE work_date IS NULL;

-- Billable split
SELECT billable, count(*), sum(hours) FROM time_entries GROUP BY billable;

-- Entries referencing missing tickets
SELECT t.description FROM time_entries t
LEFT JOIN tickets tk ON t.ticket_id = tk.id
WHERE t.ticket_id IS NOT NULL AND tk.id IS NULL;
```

## Escalation

| Severity                        | Contact           | SLA            |
| ------------------------------- | ----------------- | -------------- |
| P0 - No time entries accessible | Platform Engineer | 30 min         |
| P1 - Summary endpoint broken    | Backend Engineer  | 2 hours        |
| P2 - Billable misclassification | Service Desk Lead | 4 hours        |
| P3 - Worklog reconciliation     | Account Manager   | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302074 causes issues:
DROP TABLE IF EXISTS time_entries;
```

### API Rollback

1. Revert `apps/api/src/routes/final.ts` time-entries registration and summary endpoint
2. Revert `apps/api/src/validators/final.ts` `time`
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/time-entries/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `time_entries_total` (gauge) - entries per org
- **Metric**: `time_entries_hours_total` (gauge) - total logged hours
- **Metric**: `time_entries_billable_pct` (gauge) - share of billable hours
- **Alert**: Zero-hour entries > 10% of entries in a week → P3
- **Alert**: Summary endpoint 5xx → P1

## Related Documentation

- Feature spec: `docs/features/time-entry-worklog-summarizer.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302074_final_batch.sql`
