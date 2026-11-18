# Alga PSA Ticket Intake - Runbook

Status: feature-flagged, default **off**. This is the first bounded step of
ADR 0001 (`albatross/docs/adr/0001-alga-psa-system-of-record.md`): the portal
submits new support tickets to Alga PSA instead of writing its own ticket table.

- Owner: Platform Engineering
- Portal code: `apps/web/lib/alga-psa/`, `apps/web/app/(portal)/portal/support/actions.ts`
- PSA API: `https://psa.mainecybertech.us/api/v1`
- PSA contract: `POST /tickets` with `title`, `board_id`, `client_id`,
  `status_id`, `priority_id`, `attributes` and inline `external_links`.

## How the flag works

`ALGA_PSA_INTAKE_ENABLED=true` is necessary but not sufficient. Intake moves to
the PSA only when **all** of the following are present and valid:

| Variable                  | Purpose                                             | Placeholder                                  |
| ------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `ALGA_PSA_INTAKE_ENABLED` | Feature flag; only the literal `true` enables it    | `false`                                      |
| `ALGA_PSA_BASE_URL`       | API base including `/api/v1`                        | `https://psa.example.test/api/v1`            |
| `ALGA_PSA_API_KEY`        | Least-privilege PSA API key; server-only            | _(empty)_                                    |
| `ALGA_PSA_CLIENT_ID`      | Default PSA client UUID for intake                  | `<uuid>`                                     |
| `ALGA_PSA_BOARD_ID`       | PSA board UUID                                      | `<uuid>`                                     |
| `ALGA_PSA_STATUS_ID`      | Initial PSA status UUID                             | `<uuid>`                                     |
| `ALGA_PSA_PRIORITY_ID`    | Fallback PSA priority UUID                          | `<uuid>`                                     |
| `ALGA_PSA_PRIORITY_MAP`   | Optional JSON map `{low,normal,high,urgent: uuid}`  | `{"low":"<uuid>",...}`                       |
| `ALGA_PSA_CLIENT_MAP`     | Optional JSON allowlist `{portalOrgId: psClientId}` | `{"<portal-org-uuid>":"<alga-client-uuid>"}` |

If any required value is missing or malformed, the action stays on the existing
Supabase path. If `ALGA_PSA_CLIENT_MAP` is set, only mapped portal
organizations use the PSA; an unmapped organization stays on Supabase. This is
the multi-tenant safety gate: **do not enable intake for more than one portal
tenant without the map**.

The API key is read only by `apps/web/lib/alga-psa/` and is never logged,
returned in an error, or sent anywhere except the configured PSA base URL.

## Request shape

`createIntakeTicket()` posts:

```json
{
  "title": "...",
  "board_id": "<uuid>",
  "client_id": "<uuid>",
  "contact_name_id": "<contact-uuid>",
  "status_id": "<uuid>",
  "priority_id": "<uuid>",
  "attributes": {
    "description": "...",
    "portal_organization_id": "<portal-org-uuid>",
    "portal_user_id": "<portal-user-uuid>",
    "portal_priority": "high",
    "portal_category": "hardware",
    "portal_external_id": "<uuid>",
    "portal_submitted_at": "<ISO-8601>"
  },
  "external_links": [
    {
      "system": "client_portal",
      "external_id": "<uuid>",
      "relationship": "origin",
      "realm": "<portal-org-uuid>",
      "url": "https://app.mainecybertech.us/portal/support",
      "metadata": { "portal_organization_id": "<portal-org-uuid>" }
    }
  ]
}
```

Notes:

- Alga has no `description` field in its ticket create schema; the description
  is stored in `attributes.description`, which is the field the Alga ticket UI
  renders as the description.
- The ADR calls the external system `portal`, but Alga's built-in registry key
  is `client_portal`. A literal `portal` key is rejected as
  `system_not_found` unless the tenant registers a `custom:...` system. This
  runbook and the client use the built-in `client_portal` key.
- The external link `url` is explicit because `client_portal` has no URL
  template in Alga.
- The create form supplies a `submissionId` (UUID) that stays stable across a
  double-click or a retry after a timeout. Before creating, the adapter calls
  `GET /tickets/by-external-link?system=client_portal&external_id=...`. A
  definitive 404 is the only condition that allows a create; any other lookup
  failure fails closed. If the create races another request and returns 409
  `duplicate_external_link`, the adapter looks the winner up and returns it.
- `ALGA_PSA_PRIORITY_MAP` is optional. When set, all four portal priorities
  must map to valid PSA UUIDs; otherwise intake stays disabled. Without the
  map, every ticket uses `ALGA_PSA_PRIORITY_ID`.
- **Portal client users become PSA contacts.** When a new ticket is needed, the
  adapter resolves the authenticated portal user through
  `GET /contacts?client_id=<psa-client>&email=<email>&limit=10` and accepts only
  an exact, case-insensitive email match (Alga's email filter is an ILIKE
  substring match, so a different address is never attached). If no contact
  exists, it creates one under the linked PSA client with `full_name`, `email`,
  the portal profile title as `role`, and the profile phone as a default work
  phone. The resulting contact id is sent as the ticket `contact_name_id`. The
  contact is never resolved for an idempotent replay: an existing ticket is
  returned before any contact lookup. A contact sync failure aborts the
  submission, so the PSA never receives an unattributed ticket. MCT staff use
  the PSA as users; only portal client submissions reach this path.
- `attributes.portal_user_id` remains the portal-side audit id. Alga's
  `entered_by` is the API key's service user, so `contact_name_id` is the
  requester link and `portal_user_id` is the cross-system audit key.

## Alga contract verification (2026-11-13, pinned source)

Checked against `/tmp/opencode/repos/alga-psa` (`origin/main`, commit
`10af40c7`) without calling the live PSA:

- **External system key:** `client_portal` is in
  `packages/types/src/interfaces/externalSystem.interfaces.ts`
  (`BUILT_IN_EXTERNAL_SYSTEMS`). `resolveExternalSystem()` accepts it as a
  built-in key; it has no `urlTemplate`, so the explicit `url` in the request
  is required and is supplied. A literal `portal` key is **not** built in and
  would fail with `system_not_found`.
- **Description:** Alga's `createTicketRequestSchema` has no `description`
  field. `TicketService.withDescriptionHtml()` calls
  `renderTicketDescriptionHtml(ticket.attributes)`, which reads
  `attributes.description`, and the ticket editors (`BentoHero.tsx`,
  `TicketInfo.tsx`) initialise from the same field. The portal therefore puts
  the customer text in `attributes.description`; it is visible on the created
  ticket without a second write.
- **Comment endpoint (not used):** if the description contract ever changes,
  `POST /api/v1/tickets/{id}/comments` accepts
  `{ "comment_text": "...", "is_internal": true }` (see
  `createTicketCommentSchema` and `ApiTicketController.addComment`). It is
  intentionally not called here: it would duplicate the description already
  displayed from `attributes.description`, and a post-create failure must not
  turn a successful ticket into a retry/duplicate. Any future comment path must
  treat the comment as best-effort and still return success for the ticket.
- **Idempotency lookup:** `GET /api/v1/tickets/by-external-link?system=…&external_id=…`
  is implemented at the pinned commit
  (`server/src/app/api/v1/tickets/by-external-link/route.ts`,
  `ApiTicketController.findByExternalLink`). It returns the ticket id and the
  matching link, or 404. Inline `external_links` on create are written in the
  same transaction and a duplicate is rejected with 409
  `duplicate_external_link` (`externalLinkPersistence.ts`); the adapter handles
  that as a race and looks the winner up.

## Known limitations of this first step

- **No read-only projection yet.** A ticket created in the PSA will not appear
  in the portal's support list or detail page. Enable this flag only for a
  pilot where staff can follow up by email/phone, or ship the projection
  first. The action deliberately returns an empty portal ticket id so the UI
  does not build a broken link.
- **One PSA priority per deployment unless mapped.** Without
  `ALGA_PSA_PRIORITY_MAP`, `ALGA_PSA_PRIORITY_ID` is used for every portal
  submission and the portal's `low`/`normal`/`high`/`urgent` choice is
  preserved only in `attributes.portal_priority`. With the map, each portal
  priority selects its PSA priority.
- **Idempotency is per form session.** The `submissionId` covers a
  double-click or a retry after a timeout. A full page reload starts a new
  submission and therefore a new key; the PSA will create a new ticket. A
  durable portal-side submission ledger is a later step if reload-level
  deduplication is required.
- **Contact matching needs a complete portal profile.** The action supplies a
  contact only when the profile has both a full name and an email; the adapter
  never creates an incomplete contact. A profile missing either submits an
  unattributed ticket, so keep portal profile names/emails complete.
- **No live PSA smoke test in CI.** The tests mock `fetch`; a real create is
  an approved change-window action. The API key needs `ticket:read` in
  addition to `ticket:create` for the pre-create lookup.

## Required configuration

1. Create a least-privilege PSA service identity/API key with permission to
   create tickets and read ticket external links (`ticket:create` and
   `ticket:read`), plus contact read/create for the portal-contact mapping
   (`contact:read` and `contact:create`). The pre-create lookup uses
   `GET /tickets/by-external-link`; contact resolution uses `GET /contacts` and
   `POST /contacts`. Do not reuse an admin key.
2. Confirm the `client_id`, `board_id`, `status_id` and `priority_id` are UUIDs
   from the same PSA tenant and that the board accepts API-created tickets. If
   `ALGA_PSA_PRIORITY_MAP` is set, confirm all four priority UUIDs exist in
   `GET /api/v1/tickets/priorities`.
3. Store `ALGA_PSA_API_KEY` in the platform secret store (Vault or the
   deployment environment). Never commit it to the repo or `.env.example`.
4. Inject the variables into the `web` service only. The API and worker do not
   need them.
5. Keep `ALGA_PSA_INTAKE_ENABLED=false` until the cutover checklist below is
   complete.

## Cutover checklist

1. **Inventory and freeze writes**
   - Export the portal ticket tables and identify open tickets.
   - Put the portal ticket write endpoints/forms into maintenance or read-only
     mode so a submission cannot be written to both systems.
   - Announce the intake window and the email/phone fallback.
2. **Backfill open portal tickets**
   - Create the corresponding PSA tickets with the original portal ticket id
     in the external link, `relationship: "mirror"` or `"reference"` as
     appropriate, and a migration comment that names the portal ticket number.
   - Preserve the original portal URL/number; do not rewrite history silently.
   - Verify record counts and spot-check attachments/statuses before proceeding.
3. **Enable intake for the pilot tenant**
   - Set the flag and all required values; set `ALGA_PSA_CLIENT_MAP` if more
     than one portal organization exists.
   - Submit a test ticket through the portal; confirm the PSA ticket, the
     `client_portal` origin link, the description in `attributes.description`,
     and that no new Supabase ticket row was created.
   - Confirm the PSA ticket has the portal user as its contact
     (`contact_name_id`).
   - Re-submit the same form (double-click or retry) and confirm the same PSA
     ticket is returned, with no second ticket, no second external link, and
     no duplicate contact.
4. **Verify and widen**
   - Compare portal submission count with PSA tickets created through the
     `client_portal` link.
   - Check the PSA board/status/priority defaults and notification routing.
   - Only then enable the flag for additional mapped tenants.
5. **Read-only projection (only if needed)**
   - If the portal must show live PSA status, add a read-only projection keyed
     by the external link. Do not make the portal a second ticket writer.
6. **Retire the old write path**
   - After the retention period and a verified backfill, remove the Supabase
     ticket-create branch and the old ticket tables per ADR 0001.

## Rollback

1. Set `ALGA_PSA_INTAKE_ENABLED=false` and restart/redeploy the `web` service.
   The action immediately returns to the existing Supabase path.

   `deploy-do.yml` reads the flag from the GitHub repository variable
   `vars.ALGA_PSA_INTAKE_ENABLED`; the droplet `.env` is rewritten on every
   deploy. Exact rollback:

   ```sh
   gh variable set ALGA_PSA_INTAKE_ENABLED \
     --repo MaineCyberTech/mainecybertech --body false
   # then run deploy-do, or update the running stack without waiting for one:
   cd /opt/mct-portal
   BK=".env.bak-psa-intake-$(date -u +%Y%m%dT%H%M%SZ)"
   install -m 600 .env "$BK"
   sed -i 's/^ALGA_PSA_INTAKE_ENABLED=.*/ALGA_PSA_INTAKE_ENABLED=false/' .env
   docker compose -p mct-portal up -d --no-deps --force-recreate web
   ```

   Keep `$BK` until `docker inspect --format '{{.State.Health.Status}}'
   mct-portal-web-1` reports `healthy`. It is the service-recovery trap: if the
   recreate fails, restore it and investigate before retrying.
2. No dual write occurs in either direction, so there is nothing to unwind in
   Supabase. Tickets created in the PSA during the enabled window remain valid;
   do not delete them.
3. Record the rollback time and reconcile any submissions made during the
   window by their `client_portal` external links.
4. If the PSA is unavailable while the flag is on, the action returns a clear
   error and does **not** write a Supabase fallback ticket. Users are directed
   to `support@mainecybertech.com` until the flag is turned off.

## Verification commands

```bash
cd apps/web
pnpm test -- __tests__/lib/alga-psa __tests__/app/\(portal\)/portal/support/actions.test.ts
pnpm typecheck
```

Do not run these against the live PSA. The client tests mock `fetch`; the
action tests mock the Alga module. A live smoke test is a separate, approved
change window with a real pilot tenant.
