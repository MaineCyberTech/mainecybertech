# Outbound Webhook Events — moved

> **Consolidated (EVOL-P3-009).** The consumer-facing outbound webhook contract
> lives in one place: **[`docs/WEBHOOKS.md`](WEBHOOKS.md)** — event catalog,
> delivery envelope, request headers, the two-layer retry budget,
> dead-letter/replay semantics and endpoint management. This page is a pointer
> kept so existing links keep working; it is not a second contract.

The machine-readable catalog remains the single source of truth:
`packages/sdk/src/webhook-events.ts` (`WEBHOOK_EVENTS`, 11 events), consumed by
the admin UI event pickers, API write validation and the dispatcher. The guard
`apps/api/src/__tests__/webhook-event-catalog.test.ts` fails CI when an emitter
is uncatalogued, a catalogued event has no emitter, `docs/WEBHOOKS.md` stops
listing an event, or this page stops pointing at the canonical contract.
