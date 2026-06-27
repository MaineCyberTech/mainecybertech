import pino from "pino";
import { env } from "../env";
import type { TaskHandler, TaskResult } from "../task-registry";

const logger = pino({ level: env.LOG_LEVEL });

interface ReconcilePayload {
  organizationId?: string;
  dryRun?: boolean;
  batchSize?: number;
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

async function fetchStripeSubscription(
  stripeKey: string,
  subscriptionId: string,
  retries = 2,
): Promise<StripeSubscription | null> {
  const stripeUrl = "https://api.stripe.com/v1";
  const headers = { Authorization: `Bearer ${stripeKey}` };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${stripeUrl}/subscriptions/${subscriptionId}`, { headers });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) return null;
      return await res.json() as StripeSubscription;
    } catch {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
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
    );

    let query = supabase
      .from("memberships")
      .select("id, user_id, organization_id, status, stripe_subscription_id, stripe_customer_id")
      .eq("status", "approved");

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: memberships, error: memError } = await query.limit(batchSize);

    if (memError) {
      return { ok: false, error: `Failed to fetch memberships: ${memError.message}` };
    }

    if (!memberships || memberships.length === 0) {
      logger.info("No approved memberships to reconcile");
      return { ok: true };
    }

    let reconciled = 0;
    let suspended = 0;
    let errors = 0;

    for (const membership of memberships) {
      if (!membership.stripe_subscription_id) continue;

      const sub = await fetchStripeSubscription(stripeKey, membership.stripe_subscription_id);

      if (!sub) {
        errors++;
        continue;
      }

      const isActive = sub.status === "active" || sub.status === "trialing";

      if (!isActive && !dryRun) {
        await supabase
          .from("memberships")
          .update({ status: "suspended" })
          .eq("id", membership.id);
        suspended++;
        logger.warn(
          { membershipId: membership.id, stripeStatus: sub.status, subscriptionId: sub.id },
          "Suspended membership due to inactive Stripe subscription",
        );
      }

      reconciled++;
    }

    logger.info(
      { reconciled, suspended, errors, total: memberships.length, dryRun },
      "Stripe reconciliation complete",
    );

    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Stripe reconciliation failed");
    return { ok: false, error: msg };
  }
};
