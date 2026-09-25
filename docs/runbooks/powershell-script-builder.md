# PowerShell Script Builder - Runbook

## Owner

Platform Engineering / Automation Lead

## Normal Operation

### Daily

- Review scripts in `pending_review` status and process approvals/rejections within the team SLA
- Confirm new scripts are being submitted through the policy check before review

### Weekly

- Re-run the policy check on scripts that were approved before the guard was introduced
- Audit scripts marked `policy_checked = false` and force a scan
- Review `risk_level` distribution for recurring dangerous patterns in engineering output

### Monthly

- Review the `DANGEROUS_PATTERNS` list in `apps/api/src/routes/edu-automation.ts` and add newly emerging patterns
- Clean up `rejected` scripts that have been superseded
- Verify audit trail for approve/reject decisions is complete

## Common Failures

### 1. Script Cannot Be Submitted

**Symptoms**: `POST /powershell/:id/submit` returns `409 INVALID_STATE`
**Causes**:

- Script status is not `draft`
- Script was already approved or rejected
- Duplicate submit after a refresh
  **Resolution**:

1. Check the script status: `SELECT id, status FROM powershell_scripts WHERE id = '...'`
2. If already `pending_review`/`approved`/`rejected`, no action needed — status is intentional
3. To re-open, patch the script back to `draft` (admin-only)

### 2. Policy Scan Fails

**Symptoms**: `POST /powershell/:id/check` returns 400 "Script has no content to scan"
**Causes**:

- `script_content` is null or empty
- Script body stored in a different column
  **Resolution**:

1. Verify content exists: `SELECT length(script_content) FROM powershell_scripts WHERE id = '...'`
2. Update the script with the script body, then re-run the scan
3. Check API logs for the `INVALID_INPUT` error

### 3. Script Approved With Dangerous Content

**Symptoms**: Approved script later found to contain a destructive command
**Causes**:

- Policy check never run (approval does not require it)
- Pattern not yet in the `DANGEROUS_PATTERNS` list
  **Resolution**:

1. Re-run `POST /powershell/:id/check` to refresh `policy_violations`
2. Add the missing pattern to `DANGEROUS_PATTERNS` in `edu-automation.ts`
3. Consider downgrading the script to `draft` pending remediation

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid script IDs
**Causes**:

- User not in the organization memberships
- `organization_id` missing from the request
  **Resolution**:

1. Verify membership: `SELECT * FROM memberships WHERE user_id = auth.uid() AND organization_id = '...'`
2. Ensure the API request includes the correct `organization_id`

## Verification Steps

### Health Check

```bash
# API list
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/powershell?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM powershell_scripts;"
```

### Data Integrity

```sql
-- Scripts that have never been policy-checked
SELECT id, name, status FROM powershell_scripts WHERE policy_checked = false;

-- Scripts pending review
SELECT id, name, submitted_at FROM powershell_scripts WHERE status = 'pending_review';

-- Approved scripts with violations on record
SELECT id, name, risk_level, policy_violations FROM powershell_scripts
WHERE status = 'approved' AND array_length(policy_violations, 1) > 0;
```

## Escalation

| Severity                                  | Contact           | SLA            |
| ----------------------------------------- | ----------------- | -------------- |
| P0 - No scripts accessible                | Platform Engineer | 30 min         |
| P1 - Approval workflow broken             | Backend Engineer  | 2 hours        |
| P2 - Policy scan failing                  | Backend Engineer  | 4 hours        |
| P3 - Policy scan misses dangerous pattern | Security Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migrations 5302073/5302083 cause issues:
DROP TABLE IF EXISTS powershell_scripts;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts` route registration
2. Revert `apps/api/src/validators/edu-automation.ts` schema changes
3. Deploy previous API image

### Web Rollback

1. Revert admin pages in `apps/web/app/(admin)/admin/edu-automation/powershell/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `powershell_pending_review` (gauge) - count of scripts awaiting approval
- **Metric**: `powershell_reject_rate` (gauge) - % of submitted scripts rejected
- **Metric**: `powershell_critical_scripts` (gauge) - count of scripts with risk_level critical
- **Alert**: Pending review count > 10 for 24 hours → P2
- **Alert**: Critical scripts in `approved` status → P1

## Related Documentation

- Feature spec: `docs/features/powershell-script-builder.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql` + `supabase/migrations/5302083_powershell_policy_guard.sql`
