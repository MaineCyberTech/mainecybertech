/**
 * Ticket status vocabulary and transition map (FEAT-P3-006).
 *
 * Single source of truth for:
 *  - the API `updateTicketSchema`/`bulkTicketUpdateSchema` status enum,
 *  - the ticket PATCH/bulk transition validation (409 on invalid moves),
 *  - the admin ticket status selectors (only allowed next states are offered).
 *
 * The map encodes the support workflow: work flows forward through
 * new → open/triaged → in_progress → waiting_on_client → resolved → closed,
 * with `closed → in_progress` as the reopen path and `resolved → in_progress`
 * for reopened investigations. Same-status updates are no-ops and always
 * allowed. An unknown current status (e.g. a legacy row) does not block an
 * update — the API cannot validate what it cannot read.
 */
export const TICKET_STATUSES = [
  "new",
  "open",
  "triaged",
  "in_progress",
  "waiting_on_client",
  "resolved",
  "closed",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** Allowed next statuses for each current status (same status is implicit). */
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  new: ["open", "triaged", "in_progress", "closed"],
  open: ["triaged", "in_progress", "waiting_on_client", "resolved", "closed"],
  triaged: ["in_progress", "waiting_on_client", "resolved", "closed"],
  in_progress: ["waiting_on_client", "resolved", "closed"],
  waiting_on_client: ["in_progress", "resolved", "closed"],
  resolved: ["in_progress", "closed"],
  closed: ["in_progress"],
};

/** True when `value` is a known ticket status. */
export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && (TICKET_STATUSES as readonly string[]).includes(value);
}

/**
 * Next statuses offered for `from`. Unknown/absent values return the full
 * vocabulary so a caller never hides the current legacy value's options.
 */
export function allowedTicketTransitions(from: string | null | undefined): readonly TicketStatus[] {
  if (from == null || !isTicketStatus(from)) return TICKET_STATUSES;
  return TICKET_STATUS_TRANSITIONS[from];
}

/**
 * True when a ticket may move from `from` to `to`.
 *
 * Same-status updates are allowed (idempotent no-op). Unknown `from` values are
 * allowed so a partial read cannot block an update; unknown `to` values are
 * rejected.
 */
export function isTicketTransitionAllowed(
  from: string | null | undefined,
  to: string | null | undefined,
): boolean {
  if (!isTicketStatus(to)) return false;
  if (from == null || !isTicketStatus(from)) return true;
  if (from === to) return true;
  return TICKET_STATUS_TRANSITIONS[from].includes(to);
}
