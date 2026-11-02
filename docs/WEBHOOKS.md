# Outbound Webhooks — Event Catalog and Consumer Contract

Consumer-facing contract for the webhooks the portal delivers to registered
endpoints. The event list is generated from the SDK catalog
(`packages/sdk/src/webhook-events.ts`), which is the single source of truth used
by the admin UI pickers, API write validation and the dispatcher.
`apps/api/src/__tests__/webhook-event-catalog.test.ts` fails CI when an emitter
ships an event that is not catalogued, when a catalogued event has no emitter,
or when this document stops listing a catalogued event.

## Event catalog

| Event | Emitted when | Producer |
| ----- | ------------ | -------- |
| `ticket.created` | A ticket is created | `POST /api/v1/tickets` |
| `ticket.updated` | A ticket is updated | `PATCH /api/v1/tickets/:id` |
| `ticket.assigned` | A ticket's assignee changes | `PATCH /api/v1/tickets/:id` |
| `project.created` | A project is created (incl. store quote conversion) | `POST /api/v1/projects`, store quote conversion |
| `project.updated` | A project is updated | `PATCH /api/v1/projects/:id` |
| `document.created` | A document is created | `POST /api/v1/documents` |
| `document.updated` | A document is updated | `PATCH /api/v1/documents/:id` |
| `membership.created` | A membership invitation is created | `POST /api/v1/memberships/invite` |
| `membership.updated` | A membership is updated | `PATCH /api/v1/memberships/:id` |
| `billing.invoice.paid` | Stripe reports an invoice paid | Stripe webhook (`invoice.paid`) |
| `billing.invoice.overdue` | A Stripe invoice becomes past due | Stripe webhook (`invoice.payment_failed`/open) |

## Delivery envelope

Every delivery posts a JSON body with the same three keys:

```json
{
  "event": "ticket.created",
  "timestamp": "2026-10-12T00:00:00.000Z",
  "data": { "ticketId": "…", "title": "…" }
}
```

`timestamp` is part of the envelope on first delivery **and on every retry** —
the retry task replays the stored body byte-for-byte.

## Request headers

| Header | Value |
| ------ | ----- |
| `Content-Type` | `application/json` |
| `X-Webhook-Event` | The event name from the catalog above |
| `X-Webhook-Signature` | `sha256=<hex>` — HMAC-SHA256 of the **exact request body bytes** using the endpoint's signing secret. Present only when the endpoint has a secret configured; a secret that cannot be decrypted fails the delivery closed instead of sending unsigned. |
| `Idempotency-Key` | Stable per logical event **and endpoint** (`<base>:<endpointId>`); also persisted in `webhook_deliveries.idempotency_key`. |

Verify the signature over the raw body before parsing it, and compare in
constant time.

## Retries, dedup and DLQ

- The first attempt is dispatched immediately: through the worker
  `webhook-dispatcher` queue task when the queue is available, or the API's
  inline fallback path when it is not. Both carry the same `Idempotency-Key`,
  so the two layers dedupe against each other.
- **Inline (API fallback) path:** the API retries a transient failure (network
  error or HTTP ≥ 500) up to **3 attempts** with short backoff (200 ms base,
  ×2); a terminal 4xx is not retried. If all attempts fail the delivery is
  recorded failed and dead-lettered immediately — the worker retry task ignores
  it (`dead_letter` is set), so a delivery has a single retry owner.
- **Worker queue path:** the queue task attempts delivery once; a failed
  delivery is retried by the worker `webhook-retry` task up to **5 attempts**
  with 1/2/4/8/16-minute backoff (the first retry ~5 minutes after the initial
  attempt). Retried payloads are byte-identical to the first attempt, including
  the envelope `timestamp`.
- After the final failure the delivery moves to `webhook_dead_letters` for
  admin triage/replay in the admin console. Dead letters are retained 180 days;
  delivery rows 90 days (`scripts` retention task, migration `5302454`).
- An admin replay re-creates the delivery with a stable dedup key
  (`dlq-replay-<dead-letter-id>`) that is sent as the `Idempotency-Key`, so an
  overlapping replay request (double-click or concurrent admin) collapses to a
  single retry instead of a second POST.
- Consumers should dedupe on `Idempotency-Key` (or on
  `event` + `timestamp` + payload digest). Re-delivery after a failure is
  expected and safe to ignore.

## Endpoint management

Endpoints are created and managed under **Admin → Webhooks**
(`/api/v1/webhook-endpoints`). Each endpoint selects the events it subscribes
to from the catalog above and may carry a signing secret; deliveries and dead
letters are visible per endpoint.

## Inbound webhooks

Inbound receivers (Stripe/Jira/JSM/M365) are a separate surface — see
`docs/modules/webhooks.md`. Note there: Stripe/Jira/JSM authenticate with
signature headers, while **M365 authenticates with `clientState` only and sends
no signature**.
