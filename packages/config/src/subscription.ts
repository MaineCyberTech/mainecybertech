/**
 * Stripe subscription summary shared by the API webhook/sync paths and the
 * worker reconcile job (BILL-P3-010).
 *
 * The mirror used to read only `items.data[0]`, so a base plan plus add-on
 * item silently dropped the add-on from `subscriptions.amount_cents` and
 * `plan_name`. This helper folds every item into one deterministic summary.
 *
 * Amount semantics:
 * - one item: `amountCents` stays the per-seat unit amount and `quantity` the
 *   seat count, preserving the BILL-P3-006 display contract;
 * - multiple items: `amountCents` is the full recurring total for every item
 *   (unit amount x quantity) and `quantity` is null, because no single
 *   per-seat number is meaningful for a mixed base + add-on subscription.
 *
 * Add `./subscription` to `packages/config/package.json` exports before
 * importing it from an app.
 */

export interface StripePriceLike {
  id?: string | null;
  nickname?: string | null;
  product?: string | { id?: string | null; name?: string | null } | null;
  unit_amount?: number | null;
  currency?: string | null;
  recurring?: { interval?: string | null } | null;
}

export interface StripeSubscriptionItemLike {
  quantity?: number | null;
  price?: StripePriceLike | null;
}

export interface SubscriptionSummary {
  planName: string;
  amountCents: number;
  currency: string;
  interval: string | null;
  quantity: number | null;
}

function productLabel(price: StripePriceLike): string | null {
  if (typeof price.product === "string" && price.product.trim()) return price.product;
  if (price.product && typeof price.product === "object" && price.product.name?.trim()) {
    return price.product.name;
  }
  return null;
}

function itemLabel(price: StripePriceLike): string {
  return price.nickname?.trim() || productLabel(price) || price.id || "Unknown";
}

/**
 * Fold a Stripe subscription's items into the mirror shape. Tolerates the
 * partially-expanded objects the webhook payload and the reconcile fetch
 * return (price/product may be strings or expanded objects).
 */
export function summarizeSubscriptionItems(
  items: readonly StripeSubscriptionItemLike[] | null | undefined,
): SubscriptionSummary {
  const priced = (items ?? []).filter(
    (item): item is StripeSubscriptionItemLike & { price: StripePriceLike } => Boolean(item?.price),
  );

  if (priced.length === 0) {
    return { planName: "Unknown", amountCents: 0, currency: "usd", interval: null, quantity: null };
  }

  const labels = Array.from(new Set(priced.map((item) => itemLabel(item.price))));
  const total = priced.reduce((sum, item) => {
    const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
    return sum + (item.price.unit_amount ?? 0) * quantity;
  }, 0);

  return {
    planName: labels.join(" + "),
    amountCents: Math.round(priced.length === 1 ? (priced[0].price.unit_amount ?? 0) : total),
    currency: priced[0].price.currency ?? "usd",
    interval: priced[0].price.recurring?.interval ?? null,
    quantity:
      priced.length === 1 && typeof priced[0].quantity === "number" ? priced[0].quantity : null,
  };
}
