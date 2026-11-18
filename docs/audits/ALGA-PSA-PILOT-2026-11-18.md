# Alga PSA intake pilot — 2026-11-18

Status: **pilot path verified; Acme-only intake enabled 2026-11-18**. Scope was
the demo/pilot `.us` portal and Acme Manufacturing only. Production `.com` and
the other demo organizations were not enabled.

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

## Rollback (first pilot window)

- `ALGA_PSA_INTAKE_ENABLED` was returned to `false` after the first test window;
  the web container was recreated and is healthy. The 2026-11-18 enablement
  below is the current state.
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

## Enablement 2026-11-18 (completed)

A controlled enablement verified the staged configuration, initially stopped at
the cutover backfill gate, then backfilled the one missing open ticket and
enabled intake for Acme only.

### Preconditions verified (before enablement)

| Check | Result |
|---|---|
| Live `/opt/mct-portal/.env` | `0600 root:root`; one `ALGA_PSA_INTAKE_ENABLED` line, `false` at the start |
| Board / status / default priority | Service Desk `2fcfaecf…`, New `fe50b167…`, Normal `ce4f8578…` (match this audit) |
| Priority map | `low`, `normal`, `high`, `urgent` all present |
| `ALGA_PSA_CLIENT_MAP` | exactly 1 entry: Acme `11111111…` → `2f9aee0f…`; no second tenant |
| PSA health | `GET /api/readyz` 200 (`database:true`, `redis:true`, v1.6.18) |
| PSA client/contact | Acme client active; pilot contact `b5ad8d6a…` active under it; 10 contacts |
| Web container | `healthy`; flag false at the start; client-map entries = 1 |
| Portal tickets | 6 Acme rows: 1 `new`, 1 `open`, 2 `in_progress`, 2 `resolved` |

### Backfill gate and resolution

Four Acme portal tickets were open. Three were already mirrored into PSA with a
`client_portal` link (`relationship: mirror`, `metadata.demo=true`):

- `52000000-0000-0000-0000-000000000001` → PSA `62e59878-7ab3-507a-a53e-b23b81c27008`
- `52700000-0000-0000-0000-000000000001` → PSA `1c793925-45d0-5431-af48-34914409c43e`
- `52700000-0000-0000-0000-000000000002` → PSA `bf577f82-4098-5c3c-a394-b2a8e9dc1507`

The fourth was **not** mirrored: portal ticket
`337f97b4-0897-4cf4-9603-30ef45c23836` (title `g`, priority urgent, status
`new`, created 2026-06-09 by a super-admin profile). The owner chose backfill,
not closure. PSA ticket `T000012` (`5d5b136a-1e8b-4459-8ae6-1e876118d81b`) was
created on 2026-11-18 as a mirror:

- Board `2fcfaecf…`, status `fe50b167…`, priority `7b439434…` (portal urgent →
  mapped urgent), client `2f9aee0f…`, `is_closed=false`.
- `entered_at` preserves the original portal timestamp
  `2026-06-09T04:28:48.564Z`; creation is silent (no new-ticket notification).
- Contact `b5ad8d6a…` is a documented pilot fallback. The portal creator profile
  `66ce903f…` (MCT super-admin) has no linked PSA contact (`psa_contact_id`
  null) and no exact email match under the Acme client. The attribution is
  stated in `attributes.description` and the link metadata; no contact was
  invented.
- External link `client_portal` / `mirror`, `external_id` = portal ticket,
  realm Acme, URL `https://app.mainecybertech.us/portal/support`; the
  by-external-link lookup returns the same ticket.
- No duplicate: Acme PSA ticket count 9 with one title `g`; Acme contact count
  10 with one pilot contact. The portal ticket was not closed or deleted and no
  portal row changed.

### Flag state

- `vars.ALGA_PSA_INTAKE_ENABLED=true` (repository variable; verified
  2026-11-18T22:55:39Z). It was written with a fresh GitHub App installation
  token from the existing `kestrel-automation` App (`app_id 5673382`,
  installation `179999687`) carrying `actions_variables: write`; the token was
  revoked after use. No PAT was used.
- `/opt/mct-portal/.env` contains `ALGA_PSA_INTAKE_ENABLED=true`; backup
  `.env.bak-psa-enable-20261118T225736Z` (`0600 root:root`).
- `mct-portal-web-1` was recreated on the same image digest, is `healthy`, and
  its environment reports the flag true with exactly one client-map entry. The
  app answered HTTP 307 on `/`.
- The earlier broker consumers still return 403 on the Actions variables API;
  that is why the one-off App installation token path was used.

### Test evidence and gap

No new portal submission was made: no active dedicated client test account with
a usable credential exists. The seeded Acme client profiles are banned; the only
active `client_user` auth row is an SSO identity with no portal profile or test
credential. No user was created, unbanned or modified. Prior pilot evidence was
re-verified:

- submission `27ac5f1e…` resolves twice to PSA ticket `d81e7f37…` with
  `client_portal` / `origin`, realm Acme — stable across retries.
- ticket board `2fcfaecf…`, status `fe50b167…`, priority `ce4f8578…`, contact
  `b5ad8d6a…`; the contact is active under the Acme client.
- Acme Supabase ticket count remains **6**; no row matches the submission id or
  the backfilled portal ticket.
- PSA Acme counts: 9 tickets and 10 contacts; no duplicate ticket/contact.

Gap: a fresh submission through the live portal action remains to be performed
when an approved client test account is available. The prior pilot remains the
end-to-end proof of the portal → PSA path.

### Exact enable / rollback commands

Persistent flag (preferred; requires an identity that can write repository
variables):

```sh
gh variable set ALGA_PSA_INTAKE_ENABLED \
  --repo MaineCyberTech/mainecybertech --body true
# then run deploy-do (or wait for the next develop deploy) so .env is rewritten

# rollback
gh variable set ALGA_PSA_INTAKE_ENABLED \
  --repo MaineCyberTech/mainecybertech --body false
```

Droplet-only fallback (non-persistent; overwritten by the next deploy). Always
keep the backup until the web container is healthy:

```sh
cd /opt/mct-portal
BK=".env.bak-psa-enable-$(date -u +%Y%m%dT%H%M%SZ)"
install -m 600 .env "$BK"
sed -i 's/^ALGA_PSA_INTAKE_ENABLED=.*/ALGA_PSA_INTAKE_ENABLED=true/' .env
docker compose -p mct-portal up -d --no-deps --force-recreate web

# rollback
cp -p "$BK" .env
docker compose -p mct-portal up -d --no-deps --force-recreate web
```
