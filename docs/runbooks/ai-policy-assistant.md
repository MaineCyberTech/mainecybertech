# AI Policy Assistant - Runbook

## Owner

MSP Compliance / Security Engineering Lead

## Normal Operation

### Daily

- Review newly created AI policies for title/content completeness
- Respond to requests to add or remove approved AI tools

### Weekly

- Review `pending_review` policies and process approvals
- Verify `approved_tools` reflects the current organizational AI tooling
- Check for policies whose `data_handling_rules` need updates as new tools ship

### Monthly

- Audit the active policy set; retire superseded policies
- Verify employee guidance is current and understandable
- Cross-check the approved tools list against observed usage in the org

## Common Failures

### 1. Policy Stuck in Draft

**Symptoms**: Policy never reaches review/approval
**Causes**:

- Not submitted
- Required fields (title) empty
  **Resolution**:

1. Confirm status: `SELECT id, title, status FROM ai_policies WHERE id = '...'`
2. Complete the title/content and submit for review

### 2. Approved Tools Missing

**Symptoms**: Portal/admin shows no approved tools
**Causes**:

- `approved_tools` passed as a comma string instead of a text array
- Field cleared on update
  **Resolution**:

1. Fix the record: `UPDATE ai_policies SET approved_tools = ARRAY['ChatGPT', 'Copilot'] WHERE id = '...'`
2. Ensure the SDK/API client sends an array

### 3. Approval Stamps Missing

**Symptoms**: `approved_at` null on an approved policy
**Causes**:

- Status updated directly without the approval action
  **Resolution**:

1. Stamp the record: `UPDATE ai_policies SET approved_by = '...', approved_at = now() WHERE id = '...'`

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid policy IDs
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
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/edu-automation/ai-policy?organization_id=$ORG"

# Database connectivity
psql -c "SELECT count(*) FROM ai_policies;"
```

### Data Integrity

```sql
-- Draft policies never approved
SELECT id, title, created_at FROM ai_policies WHERE status = 'draft';

-- Approved policies missing approval stamps
SELECT id, title FROM ai_policies WHERE status = 'approved' AND approved_at IS NULL;

-- Policies with no approved tools configured
SELECT id, title FROM ai_policies WHERE approved_tools IS NULL OR array_length(approved_tools, 1) IS NULL;
```

## Escalation

| Severity                             | Contact           | SLA            |
| ------------------------------------ | ----------------- | -------------- |
| P0 - No AI policies accessible       | Platform Engineer | 30 min         |
| P1 - Policy approval workflow broken | Backend Engineer  | 2 hours        |
| P2 - Approved tools data corruption  | Backend Engineer  | 4 hours        |
| P3 - Guidance updates delayed        | Compliance        | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302073 causes issues:
DROP TABLE IF EXISTS ai_policies;
```

### API Rollback

1. Revert `apps/api/src/routes/edu-automation.ts` route registration
2. Revert `apps/api/src/validators/edu-automation.ts` schema changes
3. Deploy previous API image

### Web Rollback

1. Revert admin pages in `apps/web/app/(admin)/admin/edu-automation/ai-policy/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `ai_policies_active` (gauge) - count of approved policies
- **Metric**: `ai_policies_draft` (gauge) - count of drafts needing review
- **Metric**: `ai_policy_review_age` (gauge) - days since a policy was last reviewed
- **Alert**: Draft policies > 5 for 7 days → P3

## Related Documentation

- Feature spec: `docs/features/ai-policy-assistant.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302073_edu_automation.sql`
