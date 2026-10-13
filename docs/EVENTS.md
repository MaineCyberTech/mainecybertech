# Outbound Webhook Events

Consumer-facing documentation for the events the platform emits to
`webhook_endpoints`. The machine-readable catalog is the single source of
truth:

- **`packages/sdk/src/webhook-events.ts`** — `WEBHOOK_EVENTS` (11 events).
  Consumed by the admin webhook UI event pickers, API write validation
  (`apps/api/src/routes/webhook-management.ts`), and the dispatcher
  (`apps/api/src/lib/webhook-dispatcher.ts`).
- Guard: `apps/api/src/__tests__/webhook-event-catalog.test.ts` fails CI when a
  dispatch literal is not catalogued, a catalogued event has no emitter, or the
  UI stops consuming the catalog.

## Events

| Event | Emitted from |
| --- | --- |
| `ticket.created` | `routes/tickets.ts` — POST `/` |
| `ticket.updated` | `routes/tickets.ts` — PATCH `/:id` |
| `ticket.assigned` | `routes/tickets.ts` — PATCH `/:id` (assignee changed) |
| `project.created` | `routes/projects.ts` — POST `/` (+ store quote conversion) |
| `project.updated` | `routes/projects.ts` — PATCH `/:id` |
| `document.created` | `routes/documents.ts` — POST `/` |
| `document.updated` | `routes/documents.ts` — PATCH `/:id` |
| `membership.created` | `routes/memberships.ts` — POST `/invite` |
| `membership.updated` | `routes/memberships.ts` — PATCH `/:id` |
| `billing.invoice.paid` | `routes/webhooks.ts` — Stripe `invoice.paid` |
| `billing.invoice.overdue` | `routes/webhooks.ts` — Stripe invoice past due |

Events are created/edited in the admin UI under
[`modules/webhook-management.md`](modules/webhook-management.md).

## Delivery

Request body (JSON):

```json
{ "event": "ticket.created", "timestamp": "2026-10-12T00:00:00.000Z", "data": { } }
```

Headers:

| Header | Meaning |
| --- | --- |
| `X-Webhook-Event` | The event name |
| `Idempotency-Key` | Stable key for one logical event × endpoint; duplicate dispatches collapse to one delivery |
| `X-Webhook-Signature` | `sha256=<hex HMAC-SHA256 of the raw body>` using the endpoint signing secret (when configured) |

Verify the signature against the **raw request body** before parsing JSON.
Signing secrets are encrypted at rest and rotate on the endpoint's
`secret_expires_at`; see `docs/SECRETS_ROTATION.md` → "Outbound webhook signing
secrets".

## Retries and dead letters

- Delivery runs through the worker queue when available and falls back to
  inline dispatch, carrying the same idempotency key so both layers dedupe.
- Up to 3 attempts per delivery with exponential backoff; a terminal 4xx is not
  retried.
- Failures are recorded in `webhook_deliveries` and enqueued as dead letters
  (`webhook_dead_letters`), retryable/dismissable from the admin UI.
- Delivery rows store a truncated, PII-safe summary — not the raw payload or
  response body.

## Adding an event

1. Add the name to `WEBHOOK_EVENTS` in `packages/sdk/src/webhook-events.ts`.
2. Dispatch it at its natural call site with `dispatchWebhook(event, orgId, data)`.
3. Run the API tests — the catalog guard fails until an emitter exists and the
   UI consumes the catalog.

EVOL-P3-003: the catalog and its guard were committed in PR #224 (EVOL-P2-002);
this page is the consumer-facing documentation half of the finding.
