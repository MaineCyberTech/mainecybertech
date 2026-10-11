import { env } from "../env";
import { wsTransport } from "../services/supabase";
import { logger } from "../logger";
import { recordStripeReconcileDrift } from "../metrics";
import type { TaskHandler, TaskResult } from "../task-registry";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ReconcilePayload {
  organizationId?: string;
  dryRun?: boolean;
  batchSize?: number;
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start?: number;
  current_period_end: number;
  trial_start?: number | null;
  trial_end?: number | null;
  cancel_at_period_end: boolean;
  canceled_at?: number | null;
  items: {
    data: Array<{
      quantity?: number | null;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: { interval?: string | null } | null;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  status: string;
  total: number;
}

interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  amount_received?: number | null;
}

interface StripeListPage<T> {
  data: T[];
  has_more?: boolean;
}

const STRIPE_API_BASE = "https://api.stripe.com/v1";

/**
 * Drift comparison reads at most this many pages per resource per organization
 * (100 items per page). When a Stripe list is longer than the bound the
 * count/sum comparison is skipped instead of reporting a truncated list as
 * drift (BILL-P2-003).
 */
const STRIPE_LIST_PAGE_SIZE = 100;
const STRIPE_MAX_LIST_PAGES = 10;

function toIsoOrNull(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? new Date(seconds * 1000).toISOString()
    : null;
}

/**
 * GET a Stripe API URL with bounded retry/backoff: 429 honours Retry-After,
 * network errors back off. Returns null once the retries are exhausted so the
 * caller can count the failure (it used to be swallowed as a per-item no-op).
 */
async function stripeGet<T>(stripeKey: string, url: string, retries = 2): Promise<T | null> {
  const headers = { Authorization: `Bearer ${stripeKey}` };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

async function fetchStripeSubscription(
  stripeKey: string,
  subscriptionId: string,
): Promise<StripeSubscription | null> {
  return stripeGet<StripeSubscription>(
    stripeKey,
    `${STRIPE_API_BASE}/subscriptions/${subscriptionId}`,
  );
}

/**
 * Fetch a bounded number of pages from a Stripe list endpoint. `complete` is
 * false when the list still has more pages at the bound, in which case the
 * caller must not compare counts/sums.
 */
async function fetchStripeList<T>(
  stripeKey: string,
  resource: "invoices" | "payment_intents",
  customerId: string,
  maxPages = STRIPE_MAX_LIST_PAGES,
): Promise<{ items: T[]; complete: boolean } | null> {
  const items: T[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${STRIPE_API_BASE}/${resource}`);
    url.searchParams.set("customer", customerId);
    url.searchParams.set("limit", String(STRIPE_LIST_PAGE_SIZE));
    if (startingAfter) url.searchParams.set("starting_after", startingAfter);

    const body = await stripeGet<StripeListPage<T>>(stripeKey, url.toString());
    if (!body) return null;

    const data = body.data ?? [];
    items.push(...data);
    if (!body.has_more || data.length === 0) return { items, complete: true };
    startingAfter = (data[data.length - 1] as { id: string }).id;
  }

  return { items, complete: false };
}

interface DriftOutcome {
  drift: number;
  errors: number;
}

/**
 * Compare the local invoice mirror with Stripe's invoice list for one
 * organization (count + sum of totals). Read-only: repairing the invoice
 * mirror is the API's `/billing/sync` job; the worker's role is to make the
 * mismatch visible and fail the run (BILL-P2-003).
 */
async function detectInvoiceDrift(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  stripeKey: string,
  organizationId: string,
  stripeCustomerId: string,
): Promise<DriftOutcome> {
  const stripeInvoices = await fetchStripeList<StripeInvoice>(
    stripeKey,
    "invoices",
    stripeCustomerId,
  );
  if (!stripeInvoices) return { drift: 0, errors: 1 };

  const { data: mirrorInvoices, error } = await supabase
    .from("invoices")
    .select("total_cents")
    .eq("organization_id", organizationId);
  if (error) return { drift: 0, errors: 1 };

  if (!stripeInvoices.complete) {
    logger.warn(
      { organizationId },
      "Invoice list exceeds the page bound; skipping invoice drift comparison",
    );
    return { drift: 0, errors: 0 };
  }

  let drift = 0;
  const mirrorCount = mirrorInvoices?.length ?? 0;
  const mirrorSum = (mirrorInvoices ?? []).reduce(
    (sum, row) => sum + (row.total_cents ?? 0),
    0,
  );
  const stripeSum = stripeInvoices.items.reduce((sum, inv) => sum + Math.round(inv.total ?? 0), 0);

  if (mirrorCount !== stripeInvoices.items.length) {
    drift++;
    recordStripeReconcileDrift("invoice_count");
    logger.warn(
      { organizationId, mirrorCount, stripeCount: stripeInvoices.items.length },
      "Invoice count drift detected",
    );
  }
  if (mirrorSum !== stripeSum) {
    drift++;
    recordStripeReconcileDrift("invoice_sum");
    logger.warn({ organizationId, mirrorSum, stripeSum }, "Invoice total drift detected");
  }

  return { drift, errors: 0 };
}

/**
 * Compare the local payment mirror with Stripe's payment intents for one
 * organization (succeeded count + sum of amount_received). Pending/failed
 * intents are not compared: both sides legitimately keep them with different
 * lifecycles, and only settled money is authoritative.
 */
async function detectPaymentDrift(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  stripeKey: string,
  organizationId: string,
  stripeCustomerId: string,
): Promise<DriftOutcome> {
  const stripePayments = await fetchStripeList<StripePaymentIntent>(
    stripeKey,
    "payment_intents",
    stripeCustomerId,
  );
  if (!stripePayments) return { drift: 0, errors: 1 };

  const { data: mirrorPayments, error } = await supabase
    .from("payments")
    .select("amount_cents, status")
    .eq("organization_id", organizationId);
  if (error) return { drift: 0, errors: 1 };

  if (!stripePayments.complete) {
    logger.warn(
      { organizationId },
      "Payment intent list exceeds the page bound; skipping payment drift comparison",
    );
    return { drift: 0, errors: 0 };
  }

  let drift = 0;
  const stripeSucceeded = stripePayments.items.filter((p) => p.status === "succeeded");
  const mirrorSucceeded = (mirrorPayments ?? []).filter((p) => p.status === "succeeded");
  const mirrorSum = mirrorSucceeded.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
  const stripeSum = stripeSucceeded.reduce(
    (sum, p) => sum + Math.round(p.amount_received ?? p.amount ?? 0),
    0,
  );

  if (mirrorSucceeded.length !== stripeSucceeded.length) {
    drift++;
    recordStripeReconcileDrift("payment_count");
    logger.warn(
      { organizationId, mirrorCount: mirrorSucceeded.length, stripeCount: stripeSucceeded.length },
      "Payment count drift detected",
    );
  }
  if (mirrorSum !== stripeSum) {
    drift++;
    recordStripeReconcileDrift("payment_sum");
    logger.warn({ organizationId, mirrorSum, stripeSum }, "Payment total drift detected");
  }

  return { drift, errors: 0 };
}

export const stripeReconcile: TaskHandler = async (payload): Promise<TaskResult> => {
  const { organizationId, dryRun = false, batchSize = 50 } = payload as ReconcilePayload;
  const stripeKey = env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return { ok: false, error: "STRIPE_SECRET_KEY not configured" };
  }

  logger.info({ organizationId, dryRun, batchSize }, "Starting Stripe reconciliation");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
      { realtime: { transport: wsTransport } },
    );

    let query = supabase
      .from("billing_customers")
      .select("organization_id, stripe_customer_id")
      .not("stripe_customer_id", "is", null);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: billingCustomers, error: bcError } = await query.limit(batchSize);

    if (bcError) {
      return { ok: false, error: `Failed to fetch billing customers: ${bcError.message}` };
    }

    if (!billingCustomers || billingCustomers.length === 0) {
      logger.info("No billing customers to reconcile");
      return { ok: true };
    }

    let reconciled = 0;
    let suspended = 0;
    let drift = 0;
    let errors = 0;

    for (const customer of billingCustomers) {
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, status, created_at")
        .eq("organization_id", customer.organization_id)
        .order("created_at", { ascending: false });

      if (subError) {
        errors++;
        logger.error(
          { organizationId: customer.organization_id, error: subError.message },
          "Failed to read the subscription mirror",
        );
        continue;
      }

      // Prefer the active/trialing subscription. A nondeterministic `limit 1`
      // could pick an old cancelled row and suspend a paying tenant.
      const sub =
        (subscriptions ?? []).find((s) => s.status === "active" || s.status === "trialing") ??
        subscriptions?.[0];
      if (!sub?.stripe_subscription_id) continue;

      const stripeSub = await fetchStripeSubscription(stripeKey, sub.stripe_subscription_id);

      if (!stripeSub) {
        errors++;
        logger.error(
          {
            organizationId: customer.organization_id,
            subscriptionId: sub.stripe_subscription_id,
          },
          "Failed to fetch subscription from Stripe",
        );
        continue;
      }

      // Drift detection (BILL-P2-003): Stripe is the source of truth. A
      // differing status means the local mirror - and everything derived from
      // it - is stale. Record it before the write-back below so the mismatch
      // stays visible even when the repair succeeds.
      if (stripeSub.status !== sub.status) {
        drift++;
        recordStripeReconcileDrift("subscription_status");
        logger.warn(
          {
            organizationId: customer.organization_id,
            subscriptionId: stripeSub.id,
            mirrorStatus: sub.status,
            stripeStatus: stripeSub.status,
          },
          "Subscription status drift detected",
        );
      }

      // Write the fetched Stripe state back to the mirror (never under
      // dryRun) so the local copy converges even when a webhook was missed.
      // BILL-P2-001/P2-005: the trial, interval and cancellation lifecycle is
      // mirrored too, so the mirror can answer trial-window / cancel-at-period-
      // end / seat questions without a live Stripe call.
      if (!dryRun) {
        const item = stripeSub.items?.data?.[0];
        const price = item?.price;
        const { error: writeBackError } = await supabase
          .from("subscriptions")
          .update({
            status: stripeSub.status,
            current_period_start: toIsoOrNull(stripeSub.current_period_start),
            current_period_end: toIsoOrNull(stripeSub.current_period_end),
            amount_cents: price?.unit_amount ?? 0,
            currency: price?.currency ?? "usd",
            interval: price?.recurring?.interval ?? null,
            trial_start: toIsoOrNull(stripeSub.trial_start),
            trial_end: toIsoOrNull(stripeSub.trial_end),
            cancel_at_period_end: stripeSub.cancel_at_period_end ?? false,
            canceled_at: toIsoOrNull(stripeSub.canceled_at),
            quantity: item?.quantity ?? null,
          })
          .eq("stripe_subscription_id", stripeSub.id);

        if (writeBackError) {
          errors++;
          logger.error(
            { organizationId: customer.organization_id, error: writeBackError.message },
            "Failed to write subscription state back to the mirror",
          );
          continue;
        }
      }

      // Only suspend on terminal states - `past_due` is still dunning and must
      // not lock a tenant out.
      const terminal = ["canceled", "unpaid", "incomplete_expired"].includes(stripeSub.status);

      if (terminal && !dryRun) {
        const { error: updateError } = await supabase
          .from("memberships")
          .update({ status: "suspended" })
          .eq("organization_id", customer.organization_id)
          .eq("status", "approved");

        if (updateError) {
          errors++;
          continue;
        }
        suspended++;
      }

      const invoiceOutcome = await detectInvoiceDrift(
        supabase,
        stripeKey,
        customer.organization_id,
        customer.stripe_customer_id,
      );
      const paymentOutcome = await detectPaymentDrift(
        supabase,
        stripeKey,
        customer.organization_id,
        customer.stripe_customer_id,
      );
      drift += invoiceOutcome.drift + paymentOutcome.drift;
      errors += invoiceOutcome.errors + paymentOutcome.errors;

      reconciled++;
    }

    logger.info(
      { reconciled, suspended, drift, errors, total: billingCustomers.length, dryRun },
      "Stripe reconciliation complete",
    );

    // The task used to return ok:true even when individual Stripe calls or
    // mirror writes failed, so partial failures were indistinguishable from a
    // clean run. Drift and per-item errors now both fail the run so the
    // task-failure alert fires (BILL-P2-003).
    if (drift > 0 || errors > 0) {
      const parts: string[] = [];
      if (drift > 0) parts.push(`${drift} drift finding(s)`);
      if (errors > 0) parts.push(`${errors} error(s)`);
      return { ok: false, error: `Stripe reconciliation completed with ${parts.join(" and ")}` };
    }

    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Stripe reconciliation failed");
    return { ok: false, error: msg };
  }
};
