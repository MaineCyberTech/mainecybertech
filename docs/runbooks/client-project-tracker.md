# Client Project Tracker - Runbook

## Owner

Platform Engineering / Project Management Operations Lead

## Normal Operation

### Daily

- Review active projects for blocked status or overdue milestones
- Verify the portal project list loads without "temporarily unavailable" states

### Weekly

- Confirm Jira/JSM sync tasks (`jira-sync`, `jsm-sync`) are mapping statuses
- Check project progress updates are being posted by PMs

### Monthly

- Audit completed projects have accurate `progress_percent` and dates
- Review phase/milestone templates for reuse

## Common Failures

### 1. Portal Projects "Temporarily Unavailable"

**Symptoms**: Portal `/portal/projects` renders the amber unavailable state
**Causes**:

- Per-user rate limit exhausted (429) — old N+1 pattern; compound fetch should prevent this
- API 5xx from Supabase
  **Resolution**:

1. Retry the page after a few seconds
2. Verify the compound endpoint: `curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/projects/compound?organization_id=$ORG"`
3. Check API logs for 429/500 responses
4. If repeated, confirm `GET /projects/compound` is registered before `GET /projects/:id`

### 2. Task Read State Crash on Detail

**Symptoms**: Portal project detail error boundary on tasks
**Causes**:

- Missing `mark_task_read` RPC (migration 5302122 not applied) — direct upsert hits RLS violation
  **Resolution**:

1. Verify function exists: `psql -c "\df mark_task_read"`
2. Apply migration `5302122_mark_task_read_rpc.sql`
3. Re-test opening a task with no existing read row

### 3. Task Not Found / Org Scoping

**Symptoms**: 404 on valid task IDs in portal
**Causes**:

- Request org doesn't match the project's organization_id
- Platform admin without injected default org (intentional — see platform-admin fix)
  **Resolution**:

1. Verify task's project + org: `SELECT id, project_id, organization_id FROM project_tasks WHERE id = '...'`
2. Confirm the portal's active org (`mct_active_org` cookie) matches
3. Test with explicit `organization_id` query param

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/projects/compound?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM projects;"
```

### Data Integrity

```sql
-- Orphaned tasks
SELECT * FROM project_tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE p.id IS NULL;

-- Project status distribution
SELECT status, count(*) FROM projects GROUP BY status;

-- Tasks without a project
SELECT count(*) FROM project_tasks WHERE project_id NOT IN (SELECT id FROM projects);

-- Milestones past due and open
SELECT * FROM project_milestones WHERE status <> 'completed' AND due_date < current_date;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P0 - Portal projects page broken | Platform Engineer | 30 min         |
| P1 - Task read RPC failures      | Backend Engineer  | 2 hours        |
| P2 - Jira/JSM sync mapping drift | Backend Engineer  | 4 hours        |
| P3 - Timeline/calendar rendering | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302087 or 5302122 cause issues:
DROP TABLE IF EXISTS project_dependencies;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS project_phases;
DROP FUNCTION IF EXISTS mark_task_read(uuid, uuid, uuid);
```

### API Rollback

1. Revert `apps/api/src/routes/projects.ts`
2. Revert `apps/api/src/validators/project.ts`
3. Deploy previous API image

### Web Rollback

1. Revert portal pages in `apps/web/app/(portal)/portal/projects/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `portal_projects_compound_ms` (histogram) - compound fetch latency
- **Metric**: `projects_active_by_org` (gauge) - active project counts
- **Metric**: `mark_task_read_failure_rate` (rate) - RPC failures
- **Alert**: Compound fetch p95 > 5s → P2
- **Alert**: mark_task_read failures > 5/min → P1

## Related Documentation

- Feature spec: `docs/features/client-project-tracker.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302087_project_tracker.sql`
- RPC migration: `supabase/migrations/5302122_mark_task_read_rpc.sql`
