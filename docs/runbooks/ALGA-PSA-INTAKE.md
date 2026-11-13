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
| `ALGA_PSA_PRIORITY_ID`    | Initial PSA priority UUID                           | `<uuid>`                                     |
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
  "status_id": "<uuid>",
  "priority_id": "<uuid>",
  "attributes": {
    "description": "...",
    "portal_organization_id": "<portal-org-uuid>",
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
- A fresh `external_id` UUID is generated per submission. Retry idempotency
  needs a stable submission token supplied by the form; that is a follow-up
  item, not part of this first step.

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

## Known limitations of this first step

- **No read-only projection yet.** A ticket created in the PSA will not appear
  in the portal's support list or detail page. Enable this flag only for a
  pilot where staff can follow up by email/phone, or ship the projection
  first. The action deliberately returns an empty portal ticket id so the UI
  does not build a broken link.
- **One PSA priority per deployment.** `ALGA_PSA_PRIORITY_ID` is used for every
  portal submission; the portal's `low`/`normal`/`high` choice is preserved in
  `attributes.portal_priority` but does not select a PSA priority yet.
- **No per-request idempotency token.** A new external-link UUID is generated
  per submission. A future form token can make retries idempotent without
  changing the PSA contract.
- **No live PSA smoke test in CI.** The tests mock `fetch`; a real create is
  an approved change-window action.

## Required configuration

1. Create a least-privilege PSA service identity/API key with permission to
   create tickets and read ticket external links. Do not reuse an admin key.
2. Confirm the `client_id`, `board_id`, `status_id` and `priority_id` are UUIDs
   from the same PSA tenant and that the board accepts API-created tickets.
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
