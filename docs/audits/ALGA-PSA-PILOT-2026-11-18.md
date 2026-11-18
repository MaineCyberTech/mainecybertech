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

## Enablement attempt 2026-11-18 (blocked before the flag change)

A second, controlled enablement attempt verified the staged configuration and
then stopped at the cutover backfill gate. The flag was **not** changed.

### Preconditions verified

| Check | Result |
|---|---|
| Live `/opt/mct-portal/.env` | `0600 root:root`; one `ALGA_PSA_INTAKE_ENABLED` line, `false` |
| Board / status / default priority | Service Desk `2fcfaecf…`, New `fe50b167…`, Normal `ce4f8578…` (match this audit) |
| Priority map | `low`, `normal`, `high`, `urgent` all present |
| `ALGA_PSA_CLIENT_MAP` | exactly 1 entry: Acme `11111111…` → `2f9aee0f…`; no second tenant |
| PSA health | `GET /api/readyz` 200 (`database:true`, `redis:true`, v1.6.18) |
| PSA client/contact | Acme client active; pilot contact `b5ad8d6a…` active under it; 10 contacts |
| Web container | `healthy`; `ALGA_PSA_INTAKE_ENABLED=false`; client-map entries = 1 |
| Portal tickets | 6 Acme rows: 1 `new`, 1 `open`, 2 `in_progress`, 2 `resolved` |

### Blocker: one open ticket is not backfilled

Four Acme portal tickets are open. Three are already mirrored into PSA with a
`client_portal` link (`relationship: mirror`, `metadata.demo=true`):

- `52000000-0000-0000-0000-000000000001` → PSA `62e59878-7ab3-507a-a53e-b23b81c27008`
- `52700000-0000-0000-0000-000000000001` → PSA `1c793925-45d0-5431-af48-34914409c43e`
- `52700000-0000-0000-0000-000000000002` → PSA `bf577f82-4098-5c3c-a394-b2a8e9dc1507`

The fourth is **not** mirrored: portal ticket
`337f97b4-0897-4cf4-9603-30ef45c23836` (title `g`, priority urgent, status
`new`, created 2026-06-09 by a super-admin profile). The PSA lookup
`GET /tickets/by-external-link?system=client_portal&external_id=337f97b4…`
returns 404, and no Acme PSA ticket carries that title. Cutover checklist step 2
requires every open portal ticket to be backfilled before intake is enabled.

Owner decision required: backfill that ticket with the portal id in the
external link, or close it as a stale test. This change deliberately did not
alter any portal ticket or PSA record.

### Flag state

`ALGA_PSA_INTAKE_ENABLED` remained `false` in `/opt/mct-portal/.env` and in the
running `mct-portal-web-1`. `vars.ALGA_PSA_INTAKE_ENABLED` was not changed.
The available portal/cross-repo broker consumers return HTTP 403
`Resource not accessible by integration` on the Actions variables API, so the
persistent path needs an identity with repository-variable write. A
droplet-only `.env` edit is not a substitute: the next deploy rewrites `.env`
from the variable.

No test submission was made; the pilot evidence above remains the live proof of
the path.

### Exact enable / rollback commands (for the approved window)

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
BK=".env.bak-psa-intake-$(date -u +%Y%m%dT%H%M%SZ)"
install -m 600 .env "$BK"
sed -i 's/^ALGA_PSA_INTAKE_ENABLED=.*/ALGA_PSA_INTAKE_ENABLED=true/' .env
docker compose -p mct-portal up -d --no-deps --force-recreate web

# rollback
cp -p "$BK" .env
docker compose -p mct-portal up -d --no-deps --force-recreate web
```
