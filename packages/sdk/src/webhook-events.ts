/**
 * Canonical catalog of outbound webhook events (EVOL-P2-002).
 *
 * Single source of truth for:
 *  - the admin webhook UI event pickers (`NewWebhookForm`, `WebhookDetailClient`),
 *  - API write validation (`apps/api/src/routes/webhook-management.ts`),
 *  - the outbound dispatcher signature (`apps/api/src/lib/webhook-dispatcher.ts`).
 *
 * Decision (documented): rather than trimming the UI to the two events that
 * used to fire, every advertised event is dispatched at its natural call site:
 *   ticket.created      routes/tickets.ts       POST /
 *   ticket.updated      routes/tickets.ts       PATCH /:id
 *   ticket.assigned     routes/tickets.ts       PATCH /:id (assignedTo changed)
 *   project.created     routes/projects.ts      POST / (+ store quote conversion)
 *   project.updated     routes/projects.ts      PATCH /:id
 *   document.created    routes/documents.ts     POST /
 *   document.updated    routes/documents.ts     PATCH /:id
 *   membership.created  routes/memberships.ts   POST /invite
 *   membership.updated  routes/memberships.ts   PATCH /:id
 *   billing.invoice.paid     routes/webhooks.ts (Stripe invoice.paid)
 *   billing.invoice.overdue  routes/webhooks.ts (Stripe invoice open past due)
 *
 * `apps/api/src/__tests__/webhook-event-catalog.test.ts` fails CI when a
 * dispatch literal is not catalogued or a catalogued event has no emitter, and
 * when the webhook UI stops consuming this catalog.
 */
export const WEBHOOK_EVENTS = [
  "ticket.created",
  "ticket.updated",
  "ticket.assigned",
  "project.created",
  "project.updated",
  "document.created",
  "document.updated",
  "membership.created",
  "membership.updated",
  "billing.invoice.paid",
  "billing.invoice.overdue",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** True when `value` is a catalogued outbound event. */
export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}
