# MSP Proposal Builder - Runbook

## Owner

Sales Engineering / Service Delivery

## Normal Operation

### Daily

- Review proposals stuck in `draft` without line items
- Verify `grand_total` looks correct before submission

### Weekly

- Follow up on `sent` proposals pending approval
- Check `valid_until` on published proposals; refresh before expiry
- Reconcile published proposal totals against project quotes

### Monthly

- Report approved/rejected ratio and average `grand_total`
- Archive `expired` proposals
- Review recurring line-item totals against MRR forecasts

## Common Failures

### 1. Submit for Approval Rejected (400)

**Symptoms**: `POST /:id/submit-approval` returns `INVALID_STATE`
**Causes**:

- Proposal status is not `draft`
  **Resolution**:

1. `SELECT status FROM proposals WHERE id = '<id>';`
2. Reset to `draft` via PATCH if resubmission is intended

### 2. Publish Rejected (400)

**Symptoms**: `POST /:id/publish` returns `INVALID_STATE`
**Causes**:

- Proposal status is not `approved`
  **Resolution**:

1. Confirm approval request approved: `SELECT status FROM approval_requests WHERE id = '<approval_request_id>';`
2. PATCH proposal to `approved` only after legitimate approval

### 3. PATCH 409 Version Conflict

**Symptoms**: Update fails with `VERSION_CONFLICT`
**Causes**:

- Concurrent edit; stale `If-Match` version
  **Resolution**:

1. Re-fetch proposal for current `version`
2. Retry PATCH with updated header

### 4. Totals Look Wrong

**Symptoms**: `grand_total` doesn't match expected line items
**Causes**:

- Totals computed server-side at create from `quantity * unit_price` (or `totalPrice` override)
- Later line-item edits do not recompute proposal-level totals
  **Resolution**:

1. Verify line items: `SELECT name, quantity, unit_price, total_price FROM proposal_line_items WHERE proposal_id = '<id>';`
2. Recompute manually and PATCH if needed

### 5. Portal Proposal Detail 404

**Symptoms**: Client sees "Proposal not found"
**Causes**:

- Proposal is `internal` visibility
- Proposal belongs to another org
- `getDetail` called without the approved membership org
  **Resolution**:

1. Confirm the proposal is published (`visibility = client_visible`)
2. Verify the client's active org matches the proposal's org

## Verification Steps

### Health Check

```bash
# List proposals
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/proposals?organization_id=$ORG_ID"

# Detail with phases/items
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.mainecybertech.com/api/v1/proposals/$ID?organization_id=$ORG_ID"

# Submit for approval (draft only)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "'"$ORG_ID"'"}' \
  "https://api.mainecybertech.com/api/v1/proposals/$ID/submit-approval"
```

### Data Integrity

```sql
-- Published proposals past validity
SELECT title, valid_until FROM proposals
WHERE visibility = 'client_visible' AND valid_until < now();

-- Proposals with zero grand_total still sent
SELECT title FROM proposals
WHERE grand_total = 0 AND status IN ('sent', 'approved');

-- Orphaned line items (should be empty)
SELECT li.* FROM proposal_line_items li
LEFT JOIN proposals p ON p.id = li.proposal_id
WHERE p.id IS NULL;

-- Approval link integrity
SELECT title, approval_request_id FROM proposals
WHERE status = 'sent' AND approval_request_id IS NULL;
```

## Escalation

| Severity                         | Contact           | SLA            |
| -------------------------------- | ----------------- | -------------- |
| P1 - Proposal API 5xx            | Backend Engineer  | 2 hours        |
| P2 - Approval flow broken        | Backend Engineer  | 4 hours        |
| P3 - Pricing/total discrepancies | Backend Engineer  | 4 hours        |
| P3 - Portal display issues       | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If 5302059 causes issues (proposal tables only):
DROP TABLE IF EXISTS proposal_line_items;
DROP TABLE IF EXISTS proposal_phases;
DROP TABLE IF EXISTS proposals;
```

### API Rollback

1. Revert `apps/api/src/routes/proposals.ts`
2. Revert `apps/api/src/validators/proposals.ts`
3. Revert optimistic-locking middleware if changed
4. Deploy previous API image

### Web Rollback

1. Revert portal pages `apps/web/app/(portal)/portal/proposals/`
2. Revert admin pages `apps/web/app/(admin)/admin/proposals/`
3. Deploy previous Web image

## Monitoring

- **Metric**: `proposals_draft` (gauge) - draft proposals
- **Metric**: `proposals_sent_pending` (gauge) - sent proposals awaiting approval
- **Metric**: `proposals_avg_grand_total` (gauge) - average total
- **Metric**: `proposals_published_valid` (gauge) - published proposals within validity window
- **Alert**: `VERSION_CONFLICT` rate > 5% → P2
- **Alert**: Published proposals expiring within 7 days → P3

## Related Documentation

- Feature spec: `docs/features/msp-proposal-builder.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302059_proposal_builder.sql`
- Approvals: `supabase/migrations/5302058_shared_module_tables.sql`
