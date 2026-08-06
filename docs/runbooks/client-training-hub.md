# Client Training Hub - Runbook

## Owner

Security Training Coordinator

## Normal Operation

### Daily

- Review `portal/training-hub` for published courses with zero enrollments
- Check for courses stuck in `draft` that should be published

### Weekly

- Add/refresh microlearning content based on security incidents and phishing results
- Verify lesson ordering and `sort_order` values
- Monitor completion rates for assigned courses

### Monthly

- Report course completion rates to leadership
- Archive or retire courses that have run their lifecycle
- Audit enrollments for users who changed roles or left the client

## Common Failures

### 1. Courses Not Visible on Portal

**Symptoms**: Portal shows "No courses available."
**Causes**: No published courses for the org
**Resolution**:

1. Confirm courses exist: `SELECT title, status FROM training_courses WHERE organization_id = '<org>';`
2. Set `status = 'published'` on courses meant to be visible

### 2. Progress Update 404

**Symptoms**: `POST /courses/:id/progress` returns NOT_FOUND
**Causes**: No enrollment row for the course/user
**Resolution**:

1. Verify enrollment: `SELECT * FROM training_enrollments WHERE course_id = '<id>' AND user_id = auth.uid();`
2. Enroll first via `POST /courses/:id/enroll`

### 3. Enroll Fails with DB Error

**Symptoms**: Insert returns DB_ERROR
**Causes**: Duplicate enrollment or RLS rejection
**Resolution**:

1. Check existing enrollment; consider allowing re-enrollment
2. Verify RLS `enrollments_own_insert` allows the user (user_id must equal auth.uid())

### 4. Delete Course Fails (403)

**Symptoms**: DELETE returns 403
**Causes**: Membership role not admin/super_admin
**Resolution**: Confirm role via memberships/roles join for the org

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/training-hub/courses?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Courses without lessons
SELECT c.id, c.title FROM training_courses c
LEFT JOIN training_lessons l ON l.course_id = c.id
WHERE l.id IS NULL;

-- Enrollments past 100% progress
SELECT * FROM training_enrollments WHERE progress_percent > 100;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS training_enrollments;
DROP TABLE IF EXISTS training_lessons;
DROP TABLE IF EXISTS training_courses;
```

### API Rollback

1. Revert `/api/v1/training-hub` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/training-hub.ts`
3. Deploy previous API image

## Monitoring

- **Metric**: `training_course_enrollments` (gauge) - per course
- **Metric**: `training_completion_rate` (gauge) - % of enrollments completed
- **Alert**: High-value course completion < 40% → P3
- **Alert**: Enrollment failures > 5% → P2

## Related Documentation

- Feature spec: `docs/features/client-training-hub.md`
- Database schema: `supabase/migrations/5302090_training_hub.sql`
