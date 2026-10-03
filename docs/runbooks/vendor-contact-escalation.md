# Vendor Contact Escalation - Runbook

## Owner

Platform Engineering / Service Desk Operations Lead

## Normal Operation

### Daily

- Review newly added vendor contacts for valid email/phone
- Confirm primary contacts are flagged per vendor
- Check support portal URLs resolve correctly

### Weekly

- Audit contact coverage against active vendor contracts
- Review escalation paths for completeness
- Verify stale contacts are deactivated

### Monthly

- Standardize vendor naming to avoid duplicates
- Review RLS and org scoping on contact endpoints
- Clean up inactive contacts

## Common Failures

### 1. Contact List Empty

**Symptoms**: `/portal/vendor-contacts` shows no contacts
**Causes**:

- No contacts recorded for the org
  **Resolution**:

1. Create a test contact via `POST /api/v1/vendors/vendor-contacts`
2. Verify the row: `SELECT * FROM vendor_contacts WHERE organization_id = '...'`

### 2. Vendor Name Missing

**Symptoms**: Portal card shows an empty vendor name
**Causes**:

- `vendor_name` null on the record
  **Resolution**:

1. Check the stored value: `SELECT vendor_name FROM vendor_contacts WHERE id = '...'`
2. Update the record with the vendor name

### 3. Support Portal Link Broken

**Symptoms**: Open Link fails to load
**Causes**:

- `support_portal_url` is invalid or not https
  **Resolution**:

1. Verify the URL: `SELECT support_portal_url FROM vendor_contacts WHERE id = '...'`
2. Update with a valid https URL via PATCH

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/vendors/vendor-contacts?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Contacts missing email and phone
SELECT * FROM vendor_contacts WHERE email IS NULL AND phone IS NULL;

-- Duplicate vendor contact names
SELECT vendor_name, contact_name, count(*) FROM vendor_contacts GROUP BY vendor_name, contact_name HAVING count(*) > 1;

-- Multiple primary contacts per vendor
SELECT vendor_name FROM vendor_contacts WHERE is_primary GROUP BY vendor_name HAVING count(*) > 1;
```

## Escalation

| Severity                           | Contact           | SLA            |
| ---------------------------------- | ----------------- | -------------- |
| P0 - Vendor contacts module down   | Platform Engineer | 30 min         |
| P1 - Contact endpoints failing     | Backend Engineer  | 2 hours        |
| P2 - Contact data integrity issues | Backend Engineer  | 4 hours        |
| P3 - Contact list UX bugs          | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS vendor_contacts;
```

### API Rollback

1. Revert `apps/api/src/app.ts` route registration
2. Revert `apps/api/src/routes/vendors.ts`
3. Revert `apps/api/src/validators/vendors.ts`
4. Deploy previous API image

### Web Rollback

1. Revert portal page in `apps/web/app/(portal)/portal/vendor-contacts/`
2. Deploy previous Web image

## Monitoring

- **Metric**: `vendor_contacts_active` (gauge) - count of active contacts
- **Alert**: Contact create/update error rate > 5% → P1
- **Alert**: Contacts with no email/phone > 20% → P2

## Related Documentation

- Feature spec: `docs/features/vendor-contact-escalation.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302066_vendor_contracts_contacts.sql`
