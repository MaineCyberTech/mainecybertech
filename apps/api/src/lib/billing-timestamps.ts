/**
 * BILL-P3-003: paid timestamps must never persist an epoch date.
 *
 * `status_transitions.paid_at` is Stripe's canonical payment time, but it is
 * optional (absent on partial/older payloads). The sync path used to fall back
 * to `0` — persisting `1970-01-01` — and the webhook path multiplied
 * `undefined` by 1000, producing an Invalid Date and a `RangeError` that made
 * the event 500 and retry-fail forever.
 *
 * Prefer the transition timestamp, then the invoice's own `created` time, and
 * only then "now" — never epoch.
 */
export function invoicePaidAtIso(inv: {
  status_transitions?: { paid_at?: number | null } | null;
  created?: number | null;
}): string {
  const paidAt = inv.status_transitions?.paid_at;
  if (typeof paidAt === "number" && Number.isFinite(paidAt) && paidAt > 0) {
    return new Date(paidAt * 1000).toISOString();
  }
  return epochSecondsToIsoOrNow(inv.created);
}

/**
 * Convert Stripe epoch seconds to an ISO timestamp, falling back to "now" for
 * a missing/invalid value so a successful payment is never timestamped 1970.
 */
export function epochSecondsToIsoOrNow(seconds: number | null | undefined): string {
  return typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
    ? new Date(seconds * 1000).toISOString()
    : new Date().toISOString();
}
