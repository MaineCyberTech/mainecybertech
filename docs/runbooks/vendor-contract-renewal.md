# Vendor Contract Renewal - Runbook

## Owner

Procurement / Vendor Management Lead

## Normal Operation

### Daily

- Review the 90-day renewal queue via `GET /api/v1/vendors/vendor-contracts/renewals`
- Confirm renewals that require action are escalated to the client sponsor

### Weekly

- Update contract `status` as renewals are signed (active → expiring_soon → expired)
- Verify auto-renewal flags match the actual vendor agreements
- Review vendor contacts for stale emails/phones

### Monthly

- Audit `contract_value` and `billing_frequency` against invoices
- Run the full contract list export for leadership
- Reconcile `renewal_date` drift against vendor statements

## Common Failures

### 1. Renewal Missed

**Symptoms**: Contract expired without action
**Causes**:

- `renewal_date` not set or wrong
- Status set to `expired` instead of leaving `active` for renewal tracking
- Auto-renewal assumed incorrectly
  **Resolution**:

1. Verify the contract: `SELECT vendor_name, renewal_date, status FROM vendor_contracts WHERE id = '...'`
2. Set the correct `renewal_date` and `auto_renews`
3. Keep status `active` until the renewal is signed

### 2. Renewals List Wrong

**Symptoms**: `/vendor-contracts/renewals` missing a contract
**Causes**:

- `renewal_date` outside the 90-day window
- `status` not `active`
  **Resolution**:

1. Confirm `renewal_date` is within 90 days and `status = 'active'`
2. The endpoint filters `renewal_date BETWEEN today AND +90 days` with `status = 'active'`

### 3. Contract Search Fails

**Symptoms**: Portal search returns no results for a known vendor
**Causes**:

- Search only matches `vendor_name` (not service name or contract number)
  **Resolution**:

1. Search with the vendor name substring
2. If needed, query directly: `SELECT * FROM vendor_contracts WHERE vendor_name ILIKE '%acme%'`

### 4. RLS Access Denied

**Symptoms**: 403/404 on valid contract IDs
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
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/vendors/vendor-contracts?organization_id=$ORG"

# Renewals queue
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/vendors/vendor-contracts/renewals?organization_id=$ORG"
```

### Data Integrity

```sql
-- Contracts expiring in the next 90 days
SELECT vendor_name, renewal_date, status FROM vendor_contracts
WHERE renewal_date BETWEEN current_date AND current_date + 90 AND status = 'active'
ORDER BY renewal_date;

-- Contracts past renewal without status update
SELECT vendor_name, end_date, status FROM vendor_contracts WHERE end_date < current_date;

-- Orphaned contacts (vendor_name with no matching contract)
SELECT vc.id FROM vendor_contacts vc
LEFT JOIN vendor_contracts c ON lower(c.vendor_name) = lower(vc.vendor_name)
WHERE c.id IS NULL;
```

## Escalation

| Severity                       | Contact           | SLA            |
| ------------------------------ | ----------------- | -------------- |
| P0 - No contracts accessible   | Platform Engineer | 30 min         |
| P1 - Renewal queue broken      | Backend Engineer  | 2 hours        |
| P2 - Contract data corruption  | Backend Engineer  | 4 hours        |
| P3 - Stale vendor contact info | Vendor Management | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
-- If migration 5302066 causes issues:
DROP TABLE IF EXISTS vendor_contacts;
DROP TABLE IF EXISTS vendor_contracts;
```

### API Rollback

1. Revert `apps/api/src/routes/vendors.ts` route registration
2. Revert `apps/api/src/validators/vendors.ts` schema changes
3. Deploy previous API image

### Web Rollback

1. Revert portal pages in `apps/web/app/(portal)/portal/vendor-contracts/` and `vendor-contacts/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `vendor_contracts_expiring_90d` (gauge) - count of contracts renewing within 90 days
- **Metric**: `vendor_contracts_expired` (gauge) - count with end_date in the past
- **Alert**: Expired contract count > 5 → P2
- **Alert**: Renewal queue empty for > 14 days with active contracts → P3

## Related Documentation

- Feature spec: `docs/features/vendor-contract-renewal.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302066_vendor_contracts_contacts.sql`
