# M365 Offboarding Checklist - Runbook

## Owner

MSP Security Operations / HR Technology Lead

## Normal Operation

### Daily

- Process offboarding records for employees whose departure date is today or within 48 hours
- Confirm accounts are disabled before the employee's final day

### Weekly

- Review in-progress records that are past their `offboarding_date`
- Verify OneDrive transfers and mailbox conversions completed for departing users
- Reconcile license reclamation against the M365 license pool

### Monthly

- Audit completed records for evidence gaps (`evidence_collected = false`)
- Review offboarding step completion time for process bottlenecks
- Update the step workflow based on lessons learned

## Common Failures

### 1. Offboarding Past Due

**Symptoms**: `offboarding_date` has passed but status is still `in_progress`
**Causes**:

- Steps not started on time
- Record created late
  **Resolution**:

1. List overdue records: `SELECT employee_name, offboarding_date, status FROM offboarding_checklists WHERE offboarding_date < current_date AND status != 'completed'`
2. Execute the remaining steps immediately, prioritizing account disablement

### 2. Account Not Disabled

**Symptoms**: Employee still active in M365 after departure
**Causes**:

- `account_disabled` toggled but the actual M365 action not performed
- Step skipped
  **Resolution**:

1. Verify in M365 admin center that the account is disabled
2. Update the checklist: `UPDATE offboarding_checklists SET account_disabled = true WHERE id = '...'`

### 3. License Not Reclaimed

**Symptoms**: License count stays flat after offboarding
**Causes**:

- License reclamation missed
- License held intentionally for a replacement hire
  **Resolution**:

1. Confirm with HR whether the license is being reassigned
2. If reclaiming: `UPDATE offboarding_checklists SET license_reclaimed = true WHERE id = '...'`
3. Update license optimizer records to reflect the pool change

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid checklist IDs
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
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/security-ops/offboarding?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM offboarding_checklists;"
```

### Data Integrity

```sql
-- Overdue offboardings
SELECT employee_name, offboarding_date, status FROM offboarding_checklists
WHERE offboarding_date < current_date AND status != 'completed';

-- Completed records missing evidence
SELECT employee_name, completed_at FROM offboarding_checklists
WHERE status = 'completed' AND evidence_collected = false;

-- Records where all 6 core steps are done but status not completed
SELECT employee_name FROM offboarding_checklists
WHERE account_disabled AND mailbox_converted AND onedrive_transferred
AND license_reclaimed AND access_reviewed AND evidence_collected
AND status != 'completed';
```

## Escalation

| Severity                               | Contact             | SLA            |
| -------------------------------------- | ------------------- | -------------- |
| P0 - No offboarding records accessible | Platform Engineer   | 30 min         |
| P1 - Step toggle endpoint broken       | Backend Engineer    | 2 hours        |
| P2 - Account not disabled after exit   | Security Operations | 4 hours        |
| P3 - License reclamation gaps          | License Admin       | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migrations 5302069/5302095 cause issues:
DROP TABLE IF EXISTS offboarding_checklists;
```

### API Rollback

1. Revert `apps/api/src/routes/security-ops.ts` route registration
2. Revert `apps/api/src/validators/security-ops.ts` schema changes
3. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/offboarding/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `offboarding_overdue` (gauge) - records past offboarding_date not completed
- **Metric**: `offboarding_completion_rate` (gauge) - % of 6 core steps completed across active records
- **Alert**: Overdue offboarding count > 3 → P2
- **Alert**: Any offboarding with account still enabled 24h after exit → P1

## Related Documentation

- Feature spec: `docs/features/m365-offboarding-checklist.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302069_security_ops.sql` + `supabase/migrations/5302095_offboarding_checklist_fields.sql`
