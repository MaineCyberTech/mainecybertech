# Alga PSA intake pilot — 2026-11-18

Status: **pilot path verified, intake rolled back to off**. Scope was the
demo/pilot `.us` portal and Acme Manufacturing only. Production `.com` and the
other demo organizations were not enabled.

## Configuration staged

The `dev` environment and the web service now carry the Acme pilot values:

- Board: Service Desk
- Initial status: New
- Default priority: Normal
- Priority map: Low/Normal/High/Urgent
- Client map: Acme Manufacturing only
- `ALGA_PSA_INTAKE_ENABLED=false`

The API key, base URL and tenant ID remain the broker-leased values from
`/etc/kestrel/portal/psa.env`; only the non-secret IDs and maps are in the
GitHub environment.

## Live test

A temporary client-role user in Acme submitted a ticket through
`/portal/support` with the intake flag enabled for the test window.

| Evidence | Value |
|---|---|
| Portal submission id | `27ac5f1e-a0dd-48ad-8873-fe9c615967f8` |
| PSA ticket | `d81e7f37-56b1-43c7-a524-48a708f30805` |
| PSA contact | `b5ad8d6a-2301-4a4d-bfeb-9eff33603eb7` |
| Board | `2fcfaecf-1473-43dc-ac58-7d9ede01e894` (Service Desk) |
| Status | `fe50b167-265c-46e2-b3e2-ff66a011e0d6` (New) |
| Priority | `ce4f8578-26e2-4a01-9fbb-f5c21bcba13f` (Normal) |
| PSA client | `2f9aee0f-6271-58bc-8def-e77a65c944f9` |
| External link | `client_portal` / `realm=11111111-1111-1111-1111-111111111111` |

Verified:

- the PSA ticket carries the portal organization, external submission id,
  priority and category attributes, and a non-empty `attributes.description`;
- the contact was created under the Acme PSA client and attached as
  `contact_name_id`;
- the Acme Supabase ticket count stayed at **6**, so the PSA path did not
  dual-write a portal ticket;
- a second direct-API diagnostic ticket (`aa920ef8-1aaf-4543-afb7-d3542716e65a`)
  was created without a contact while isolating a phone-number validation
  failure. It is labeled `PILOT TEST` and is left for the PSA admin to resolve.

## Failure found and fixed

The first portal submission failed because the temporary profile carried a
fictional phone number. The PSA contact API rejected it with
`VALIDATION_ERROR: Please enter a valid phone number`, and the portal correctly
failed closed without creating a ticket. Removing the invalid phone let the
contact create succeed. Production profiles should carry a valid phone or omit
it; the intake code does not create incomplete contacts.

## Rollback

- `ALGA_PSA_INTAKE_ENABLED` was returned to `false`; the web container was
  recreated and is healthy.
- The temporary portal user was deleted and its credential file shredded.
- The Acme crosswalk and board/status/priority values remain staged for a
  future approved window.
- The PSA ticket and contact are retained as pilot evidence; they were not
  deleted.

## Remaining before enabling permanently

- Confirm the PSA `svc-portal-intake` role still has ticket/contact write
  permissions after the pilot (the registry records client read, contact
  read/create and ticket read/create/update).
- Decide whether to keep the named Low/Normal/High/Urgent priority taxonomy or
  clean up the duplicate P1–P5 taxonomy.
- Add a read-only PSA ticket projection before the portal is expected to show
  PSA-created tickets in its support list.
- Enable only for mapped organizations and only in an approved change window.
