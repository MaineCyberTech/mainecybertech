import { Router } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "../lib/logger";
import { AppError, failure, success } from "../types";
import { logAuditEvent } from "../services/audit";
import { getEnv } from "../config/env";
import {
  verifyWebhookSignature,
  validateWebhookTimestamp,
  rawBodyBuffer,
} from "../lib/webhook-signature";
import { claimIdempotencyKey, storeIdempotencyKey, deleteIdempotencyKey } from "../lib/idempotency";
import {
  jiraWebhookSchema,
  jsmWebhookSchema,
  m365WebhookSchema,
  stripeWebhookSchema,
} from "../lib/webhook-schemas";
import { recordWebhookDelivery } from "../lib/metrics";
import { notifyBillingPaymentFailure } from "../lib/billing-dunning";
import { type Row } from "../lib/db-types";
import { timingSafeCompare } from "../lib/timing-safe";

const router: ReturnType<typeof Router> = Router();

/**
 * Replay window for M365 change notifications (WH-P2-001). Graph sends no
 * per-event timestamp and does not sign payloads, so the atomic idempotency
 * claim on the notification digest is the enforced replay guard. Keep it well
 * beyond Graph's own retry schedule (retries stop after ~4 hours).
 */
const M365_REPLAY_WINDOW_SECONDS = 7 * 24 * 60 * 60;

type SupabaseErrorLike = { message?: string; code?: string } | null | undefined;

/**
 * RES-P2-007: supabase-js reports failures in `{ error }` instead of throwing,
 * and these handlers used to ACK 200 regardless — during a DB degradation
 * Stripe/Jira/JSM/M365 events were accepted, never retried, and the 24h
 * idempotency claim blocked replays. Persistence steps now throw so the outer
 * catch releases the claim and the provider sees a 5xx to retry.
 */
function throwIfWriteFailed(error: SupabaseErrorLike, context: string): void {
  if (error) {
    throw new Error(`${context} failed: ${error.message ?? "unknown Supabase error"}`);
  }
}

/**
 * As above, for reads: PGRST116 (`.single()` matched no row) is an expected
 * "unknown customer/issue" case for these handlers, not a persistence failure.
 */
function throwIfReadFailed(error: SupabaseErrorLike, context: string): void {
  if (error && error.code !== "PGRST116") {
    throw new Error(`${context} failed: ${error.message ?? "unknown Supabase error"}`);
  }
}

async function logWebhookDelivery(
  event: string,
  _reqBody: unknown,
  idempotencyKey: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Persist only a truncated, PII-safe summary. The raw inbound payload
  // (which can contain Stripe/JSM/M365 PII) is intentionally NOT stored.
  const { error } = await supabase.from("webhook_deliveries").insert({
    webhook_id: null,
    event,
    status: "success",
    request_body: { event, receivedAt: new Date().toISOString() },
    response_status: 200,
    response_body: null,
    idempotency_key: idempotencyKey,
  });
  if (error) {
    // Do not mark the event processed: the delivery record is part of the
    // processed state, so a failed insert must release the claim and let the
    // sender retry (BILL-P2-006).
    throw new AppError(
      "DB_ERROR",
      `Failed to log ${event} webhook delivery: ${error.message}`,
      500,
    );
  }
  await storeIdempotencyKey(idempotencyKey, "done");
}

async function dedupWebhook(key: string, ttlSeconds?: number): Promise<boolean> {
  // Atomic claim (Redis SET NX EX or in-memory mutex fallback) — prevents
  // concurrent check-then-store races from double-processing an event. The TTL
  // is the replay window: an identical retransmission within it is rejected.
  const claimed = await claimIdempotencyKey(key, "processing", ttlSeconds);
  if (!claimed) {
    logger.info({ key }, "Duplicate webhook, skipping");
    return true;
  }
  return false;
}

const JIRA_STATUS_MAP: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  "Under Review": "in_review",
  "Code Review": "in_review",
  Done: "done",
  Blocked: "blocked",
};

/**
 * Resolve the local organization + invoice row for a Stripe object that may
 * carry a `customer` and/or `invoice` (Stripe invoice id) reference. Used by
 * the payment/refund handlers below to keep the `payments` table linked to
 * its invoice. Unknown customers/invoices resolve to nulls (PGRST116) rather
 * than throwing so processing does not fail on events for objects we have
 * never seen (Stripe would otherwise retry forever); genuine DB errors still
 * throw so the provider retries (RES-P2-007).
 */
async function resolveBillingRefs(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  opts: { customer?: string | null; invoiceId?: string | null },
): Promise<{ organizationId: string | null; invoiceRowId: string | null }> {
  let organizationId: string | null = null;
  if (opts.customer) {
    const { data: customer, error: customerError } = await supabase
      .from("billing_customers")
      .select("organization_id")
      .eq("stripe_customer_id", opts.customer)
      .single();
    throwIfReadFailed(customerError, "Stripe billing customer lookup");
    organizationId = customer?.organization_id ?? null;
  }

  let invoiceRowId: string | null = null;
  if (opts.invoiceId) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, organization_id")
      .eq("stripe_invoice_id", opts.invoiceId)
      .single();
    throwIfReadFailed(invoiceError, "Stripe invoice lookup");
    invoiceRowId = invoice?.id ?? null;
    organizationId = organizationId ?? invoice?.organization_id ?? null;
  }

  return { organizationId, invoiceRowId };
}

/**
 * Map a Stripe PaymentIntent status onto the local `payments.status` values
 * (succeeded, failed, pending; plus refunded/partially_refunded written by the
 * charge.refunded handler). Stripe statuses: succeeded, processing,
 * requires_payment_method, requires_confirmation, requires_action,
 * requires_capture, canceled.
 */
function mapPaymentIntentStatus(status: string): string {
  if (status === "succeeded") return "succeeded";
  if (status === "canceled" || status === "requires_payment_method") return "failed";
  return "pending";
}

/**
 * BILL-P2-007: terminal mirror states are monotonic. Stripe does not guarantee
 * delivery ordering and retries can deliver a stale snapshot after a later
 * event has already been applied (e.g. a `payment_intent.succeeded` retried
 * after `charge.refunded`). Once a row reaches a terminal state, a later event
 * must not move it back to a non-terminal one.
 */
const TERMINAL_PAYMENT_STATUSES = new Set(["refunded", "partially_refunded"]);
const TERMINAL_INVOICE_STATUSES = new Set(["void"]);
const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["canceled", "incomplete_expired"]);

/**
 * Read the current status of a Stripe mirror row, keyed by its Stripe id.
 * Throws on a read failure so the event is retried rather than applying a
 * transition that could downgrade a terminal state.
 */
async function readMirrorStatus(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: "payments" | "invoices" | "subscriptions",
  idColumn: string,
  idValue: string,
): Promise<string | null> {
  // The generated client types do not accept a dynamic table/column pair; the
  // runtime builder is duck-typed, matching lib/admin-scope.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .select("status")
    .eq(idColumn, idValue)
    .maybeSingle();
  if (error) {
    throw new AppError("DB_ERROR", `Failed to read ${table} status: ${error.message}`, 500);
  }
  return (data as { status?: string | null } | null)?.status ?? null;
}

/**
 * BILL-P2-006: every Stripe mirror write is checked. A failed write throws so
 * the idempotency claim is released (Stripe retries) instead of acknowledging
 * the event with the mirror silently missing the change.
 */
function assertMirrorWrite(
  error: { message: string } | null | undefined,
  context: string,
): void {
  if (error) {
    throw new AppError(
      "DB_ERROR",
      `Stripe webhook write failed (${context}): ${error.message}`,
      500,
    );
  }
}

/**
 * Epoch-seconds timestamp of the most recent refund on a charge (BILL-P2-001),
 * falling back to the Stripe event's `created` when the charge payload does not
 * embed the refund list. Returns null when neither is available so callers can
 * persist an explicit null instead of guessing.
 */
function refundTimestampSeconds(
  charge: { refunds?: { data?: Array<{ created?: number | null }> } | null } | null | undefined,
  fallback?: number | null,
): number | null {
  const refunds = Array.isArray(charge?.refunds?.data) ? charge.refunds.data : [];
  let latest = 0;
  for (const refund of refunds) {
    if (typeof refund?.created === "number" && refund.created > latest) latest = refund.created;
  }
  if (latest > 0) return latest;
  return typeof fallback === "number" ? fallback : null;
}

const JSM_STATUS_MAP: Record<string, string> = {
  Open: "new",
  "In Progress": "in_progress",
  "Waiting for Customer": "waiting_on_client",
  "Waiting for Support": "in_progress",
  Resolved: "resolved",
  Closed: "closed",
};

router.post("/stripe", async (req, res, next) => {
  let claimedKey: string | null = null;
  // Set once the signature verifies; lets the catch below emit a failed
  // delivery metric for the event (BILL-P2-006).
  let eventType: string | null = null;
  try {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) {
      res.status(400).json(failure("MISSING_SIGNATURE", "Missing stripe-signature header", 400));
      return;
    }

    const env = getEnv();
    const stripeSecret = env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
      res.status(500).json(failure("CONFIG_ERROR", "Stripe webhook secret not configured", 500));
      return;
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2025-03-31.basil" as any,
    });
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        (req as { rawBody?: Buffer }).rawBody as Buffer,
        signature,
        stripeSecret,
      );
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res
        .status(400)
        .json(failure("INVALID_SIGNATURE", "Webhook signature verification failed", 400));
      return;
    }

    // WH-P2-006: minimal shape check on the verified event before processing.
    // (Stripe's constructEvent is itself the parse+signature step, so this can
    // only run after the HMAC check.)
    event = stripeWebhookSchema.parse(event);

    logger.info({ type: event.type, id: event.id }, "Stripe webhook received");
    eventType = event.type;

    const stripeKey = `stripe-${event.id}`;
    claimedKey = stripeKey;
    if (await dedupWebhook(stripeKey)) {
      res.json(success({ received: true }));
      return;
    }

    const supabase = getSupabaseAdmin();

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const inv = event.data?.object;
      if (inv?.customer) {
        const { data: customer, error: customerError } = await supabase
          .from("billing_customers")
          .select("organization_id")
          .eq("stripe_customer_id", inv.customer)
          .single();
        throwIfReadFailed(customerError, "Stripe billing customer lookup");

        if (customer) {
          // BILL-P2-007: a void invoice is terminal — a late or retried
          // invoice.paid/payment_failed event must not resurrect it.
          const currentInvoiceStatus = await readMirrorStatus(
            supabase,
            "invoices",
            "stripe_invoice_id",
            inv.id,
          );
          if (TERMINAL_INVOICE_STATUSES.has(currentInvoiceStatus ?? "")) {
            logger.info(
              {
                stripeInvoiceId: inv.id,
                currentStatus: currentInvoiceStatus,
                eventType: event.type,
              },
              "Skipping stale Stripe invoice event (terminal state)",
            );
          } else {
            const status =
              inv.status === "open" && inv.due_date && new Date(inv.due_date * 1000) < new Date()
                ? "overdue"
                : inv.status;
            const { error: invoiceWriteError } = await supabase.from("invoices").upsert(
              {
                organization_id: customer.organization_id,
                stripe_invoice_id: inv.id,
                invoice_number: inv.number,
                status,
                // Stripe already returns amounts in the smallest currency unit (cents)
                subtotal_cents: Math.round(inv.subtotal),
                tax_cents: Math.round(inv.tax ?? 0),
                total_cents: Math.round(inv.total),
                currency: inv.currency,
                hosted_invoice_url: inv.hosted_invoice_url,
                invoice_pdf_url: inv.invoice_pdf,
                due_at: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
                paid_at:
                  inv.status === "paid"
                    ? new Date(inv.status_transitions?.paid_at * 1000).toISOString()
                    : null,
              },
              { onConflict: "stripe_invoice_id" },
            );
            assertMirrorWrite(invoiceWriteError, "invoices.upsert");

            // BILL-P2-004: dunning visibility. A failed charge previously just
            // flipped the invoice row; notify the org's billing contacts so the
            // card gets fixed before the subscription is suspended.
            if (event.type === "invoice.payment_failed") {
              await notifyBillingPaymentFailure({
                organizationId: customer.organization_id,
                invoice: inv,
                supabase,
              });
            }
          }
        }
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.created"
    ) {
      const sub = event.data?.object;
      if (sub?.customer) {
        const { data: customer, error: customerError } = await supabase
          .from("billing_customers")
          .select("organization_id")
          .eq("stripe_customer_id", sub.customer)
          .single();
        throwIfReadFailed(customerError, "Stripe billing customer lookup");

        if (customer) {
          // BILL-P2-007: canceled/incomplete_expired subscriptions are
          // terminal — a late subscription.updated must not resurrect them.
          const currentSubscriptionStatus = await readMirrorStatus(
            supabase,
            "subscriptions",
            "stripe_subscription_id",
            sub.id,
          );
          if (TERMINAL_SUBSCRIPTION_STATUSES.has(currentSubscriptionStatus ?? "")) {
            logger.info(
              {
                stripeSubscriptionId: sub.id,
                currentStatus: currentSubscriptionStatus,
                eventType: event.type,
              },
              "Skipping stale Stripe subscription event (terminal state)",
            );
          } else {
            const item = sub.items?.data?.[0];
            const price = item?.price;
            const { error: subscriptionWriteError } = await supabase.from("subscriptions").upsert(
              {
                organization_id: customer.organization_id,
                stripe_subscription_id: sub.id,
                plan_name: price?.nickname ?? price?.product ?? "Unknown",
                status: sub.status,
                current_period_start: sub.current_period_start
                  ? new Date(sub.current_period_start * 1000).toISOString()
                  : null,
                current_period_end: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000).toISOString()
                  : null,
                amount_cents: price?.unit_amount ?? 0,
                currency: price?.currency ?? "usd",
                // BILL-P2-001/P2-005: trial, interval and cancellation lifecycle.
                interval: price?.recurring?.interval ?? null,
                trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
                trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                cancel_at_period_end: sub.cancel_at_period_end ?? false,
                canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
                quantity: item?.quantity ?? null,
              },
              { onConflict: "stripe_subscription_id" }
            );
            assertMirrorWrite(subscriptionWriteError, "subscriptions.upsert");
          }
        }
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (session?.customer && session?.client_reference_id) {
        const { error: billingCustomerWriteError } = await supabase
          .from("billing_customers")
          .upsert(
            {
              organization_id: session.client_reference_id,
              stripe_customer_id: session.customer,
              billing_email: session.customer_details?.email ?? null,
            },
            { onConflict: "organization_id" },
          );
        assertMirrorWrite(billingCustomerWriteError, "billing_customers.upsert");
      }
    }

    // Payment lifecycle → populate the `payments` table (BILL-P1-002).
    // Stripe's canonical payment object is the PaymentIntent; amounts are
    // already in the smallest currency unit.
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const pi = event.data?.object;
      if (pi?.id) {
        const { organizationId, invoiceRowId } = await resolveBillingRefs(supabase, {
          customer: pi.customer,
          invoiceId: pi.invoice,
        });
        if (organizationId) {
          // BILL-P2-007: refunds are terminal — a late or retried
          // payment_intent event must not downgrade refunded back to
          // succeeded/failed/pending.
          const currentPaymentStatus = await readMirrorStatus(
            supabase,
            "payments",
            "stripe_payment_intent_id",
            pi.id,
          );
          if (TERMINAL_PAYMENT_STATUSES.has(currentPaymentStatus ?? "")) {
            logger.info(
              {
                stripePaymentIntentId: pi.id,
                currentStatus: currentPaymentStatus,
                eventType: event.type,
              },
              "Skipping stale Stripe payment event (terminal state)",
            );
          } else {
            const succeeded = pi.status === "succeeded";
            const { error: paymentWriteError } = await supabase.from("payments").upsert(
              {
                organization_id: organizationId,
                invoice_id: invoiceRowId,
                stripe_payment_intent_id: pi.id,
                amount_cents: Math.round(
                  succeeded ? (pi.amount_received ?? pi.amount) : pi.amount,
                ),
                currency: pi.currency,
                status: mapPaymentIntentStatus(pi.status),
                paid_at: succeeded ? new Date((pi.created ?? 0) * 1000).toISOString() : null,
              },
              { onConflict: "stripe_payment_intent_id" },
            );
            assertMirrorWrite(paymentWriteError, "payments.upsert");
          }
        }
      }
    }

    // Refunds → update the linked payment (BILL-P1-003). A charge may not have
    // a local PaymentIntent row (e.g. created before this handler shipped), so
    // this is a best-effort update keyed on the PI id. The refunded amount and
    // timestamp are stored alongside the status (BILL-P2-001).
    if (event.type === "charge.refunded") {
      const charge = event.data?.object;
      const paymentIntentId = charge?.payment_intent;
      if (paymentIntentId) {
        const fullyRefunded =
          typeof charge.amount === "number" && charge.amount_refunded >= charge.amount;
        const currentPaymentStatus = await readMirrorStatus(
          supabase,
          "payments",
          "stripe_payment_intent_id",
          paymentIntentId,
        );
        if (currentPaymentStatus === "refunded" && !fullyRefunded) {
          // BILL-P2-007: a stale partial-refund snapshot must not downgrade a
          // full refund.
          logger.info(
            { stripePaymentIntentId: paymentIntentId, currentStatus: currentPaymentStatus },
            "Skipping stale partial refund (payment already fully refunded)",
          );
        } else {
          const refundedAt = refundTimestampSeconds(charge, event.created);
          const { error: refundErr } = await supabase
            .from("payments")
            .update({
              status: fullyRefunded ? "refunded" : "partially_refunded",
              refund_amount_cents: Math.round(charge.amount_refunded ?? 0),
              refunded_at: refundedAt ? new Date(refundedAt * 1000).toISOString() : null,
            })
            .eq("stripe_payment_intent_id", paymentIntentId);
          assertMirrorWrite(refundErr, "payments.update refund");
        }
      }
    }

    // Invoice lifecycle → map void / uncollectible onto the existing enum and
    // timestamp the void transition (BILL-P2-005).
    if (event.type === "invoice.voided" || event.type === "invoice.marked_uncollectible") {
      const inv = event.data?.object;
      if (inv?.id) {
        const status = event.type === "invoice.voided" ? "void" : "uncollectible";
        const voidedAt = inv.status_transitions?.voided_at ?? event.created;
        const { error: invoiceVoidWriteError } = await supabase
          .from("invoices")
          .update({
            status,
            voided_at:
              event.type === "invoice.voided" && voidedAt
                ? new Date(voidedAt * 1000).toISOString()
                : undefined,
          })
          .eq("stripe_invoice_id", inv.id);
        assertMirrorWrite(invoiceVoidWriteError, "invoices.update lifecycle");
=======
        const { error: voidError } = await supabase
          .from("invoices")
          .update({ status })
          .eq("stripe_invoice_id", inv.id);
        throwIfWriteFailed(voidError, "Stripe invoice status update");
>>>>>>> 4fbe52bf (fix(api): fail inbound webhooks when persistence fails (RES-P2-007))
      }
    }

    const stripeAuditOk = await logAuditEvent({
      actorType: "system",
      action: `stripe.${event.type}`,
      entityType: "stripe_event",
      metadata: { id: event.id },
    });
    // RES-P2-007: an audit-trail gap must fail the webhook so Stripe retries;
    // the business upserts above are idempotent.
    if (stripeAuditOk === false) {
      throw new Error(`audit log write failed for stripe.${event.type}`);
    }

    await logWebhookDelivery(`stripe.${event.type}`, req.body, `stripe-${event.id}`);
    recordWebhookDelivery("success", `stripe.${event.type}`);

    res.json(success({ received: true }));
  } catch (error) {
    // Release the claim so Stripe's retry can reprocess the event
    // (claim-before-process must not persist a "duplicate" on failure).
    if (claimedKey) {
      await deleteIdempotencyKey(claimedKey).catch(() => undefined);
    }
    if (eventType) {
      // BILL-P2-006: a mirror-write (or any processing) failure is a failed
      // delivery, not a success — surface it so it is alertable.
      recordWebhookDelivery("failed", `stripe.${eventType}`);
    }
    next(error);
  }
});

router.post("/jira", async (req, res, next) => {
  try {
    // WH-P2-006: reject malformed payloads before any signature/HMAC work.
    const event = jiraWebhookSchema.parse(req.body);
    const issueKey: string | undefined = event.issue?.key;
    const statusName: string | undefined = event.issue?.fields?.status?.name;
    const summary: string | undefined = event.issue?.fields?.summary;

    logger.info(
      { event: event.webhookEvent, issueKey, status: statusName },
      "Jira webhook received",
    );

    const jiraSecret = getEnv().JIRA_WEBHOOK_SECRET;
    if (!jiraSecret) {
      logger.warn("Jira webhook secret not configured");
      res.status(501).json(failure("NOT_IMPLEMENTED", "Jira webhook not configured", 501));
      return;
    }
    const sig = req.headers["x-hub-signature"] as string | undefined;
    if (!sig) {
      logger.warn("Jira webhook missing x-hub-signature header");
      res.status(401).json(failure("UNAUTHORIZED", "Missing webhook signature", 401));
      return;
    }
    // WH-P2-004: verify over the exact received bytes; fail closed when the raw
    // body was not captured (re-serialized JSON is not signature-stable).
    const rawBody = rawBodyBuffer((req as { rawBody?: unknown }).rawBody);
    if (!rawBody) {
      logger.warn("Jira webhook raw body unavailable — rejecting");
      res.status(401).json(failure("UNAUTHORIZED", "Invalid webhook signature", 401));
      return;
    }
    if (!verifyWebhookSignature(rawBody, sig, jiraSecret)) {
      logger.warn("Jira webhook signature verification failed");
      res.status(401).json(failure("UNAUTHORIZED", "Invalid webhook signature", 401));
      return;
    }

    if (!validateWebhookTimestamp(event, undefined, { requireTimestamp: true })) {
      logger.warn(
        { event: event.webhookEvent, issueKey },
        "Jira webhook timestamp outside tolerance",
      );
      res.status(400).json(failure("BAD_REQUEST", "Webhook timestamp outside tolerance", 400));
      return;
    }

    const jiraKey = `jira-${event.webhookEvent ?? "unknown"}-${issueKey ?? "unknown"}-${crypto
      .createHash("sha256")
      .update(rawBody)
      .digest("hex")
      .slice(0, 16)}`;
    if (await dedupWebhook(jiraKey)) {
      res.json(success({ received: true }));
      return;
    }

    try {
      if (issueKey && statusName) {
        const supabase = getSupabaseAdmin();
        const mappedStatus =
          JIRA_STATUS_MAP[statusName] ?? statusName.toLowerCase().replace(/\s+/g, "_");
        const { data: task, error: taskError } = await supabase
          .from("project_tasks")
          .select("id, status")
          .eq("external_jira_issue_key", issueKey)
          .single();
        throwIfReadFailed(taskError, "Jira project task lookup");

        if (task && task.status !== mappedStatus) {
          const { error: updateError } = await supabase
            .from("project_tasks")
            .update({ status: mappedStatus as Row<"project_tasks">["status"] })
            .eq("id", task.id);
          throwIfWriteFailed(updateError, "Jira project task status update");
          logger.info(
            { issueKey, taskId: task.id, from: task.status, to: mappedStatus },
            "Task status synced from Jira webhook",
          );
        }
      }

      const jiraAuditOk = await logAuditEvent({
        actorType: "system",
        action: `jira.${event.webhookEvent ?? "unknown"}`,
        entityType: "jira_event",
        metadata: { issue: issueKey, summary, status: statusName },
      });
      if (jiraAuditOk === false) {
        throw new Error(`audit log write failed for jira.${event.webhookEvent ?? "unknown"}`);
      }

      await logWebhookDelivery(`jira.${event.webhookEvent ?? "unknown"}`, req.body, jiraKey);
      recordWebhookDelivery("success", `jira.${event.webhookEvent ?? "unknown"}`);

      res.json(success({ received: true }));
    } catch (error) {
      // Release the claim so the sender's retry can reprocess the event
      // (claim-before-process must not persist a "duplicate" on failure).
      await deleteIdempotencyKey(jiraKey).catch(() => undefined);
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/jsm", async (req, res, next) => {
  try {
    // WH-P2-006: reject malformed payloads before any signature/HMAC work.
    const event = jsmWebhookSchema.parse(req.body);
    const issueKey: string | undefined = event.issue?.key;
    const statusName: string | undefined = event.issue?.fields?.status?.name;
    const summary: string | undefined = event.issue?.fields?.summary;

    logger.info(
      { event: event.webhookEvent, issueKey, status: statusName },
      "JSM webhook received",
    );

    const jsmSecret = getEnv().JSM_WEBHOOK_SECRET;
    if (!jsmSecret) {
      logger.warn("JSM webhook secret not configured");
      res.status(501).json(failure("NOT_IMPLEMENTED", "JSM webhook not configured", 501));
      return;
    }
    const sig = req.headers["x-hub-signature"] as string | undefined;
    if (!sig) {
      logger.warn("JSM webhook missing x-hub-signature header");
      res.status(401).json(failure("UNAUTHORIZED", "Missing webhook signature", 401));
      return;
    }
    // WH-P2-004: verify over the exact received bytes; fail closed when the raw
    // body was not captured (re-serialized JSON is not signature-stable).
    const rawBody = rawBodyBuffer((req as { rawBody?: unknown }).rawBody);
    if (!rawBody) {
      logger.warn("JSM webhook raw body unavailable — rejecting");
      res.status(401).json(failure("UNAUTHORIZED", "Invalid webhook signature", 401));
      return;
    }
    if (!verifyWebhookSignature(rawBody, sig, jsmSecret)) {
      logger.warn("JSM webhook signature verification failed");
      res.status(401).json(failure("UNAUTHORIZED", "Invalid webhook signature", 401));
      return;
    }

    if (!validateWebhookTimestamp(event, undefined, { requireTimestamp: true })) {
      logger.warn(
        { event: event.webhookEvent, issueKey },
        "JSM webhook timestamp outside tolerance",
      );
      res.status(400).json(failure("BAD_REQUEST", "Webhook timestamp outside tolerance", 400));
      return;
    }

    const jsmKey = `jsm-${event.webhookEvent ?? "unknown"}-${issueKey ?? "unknown"}-${crypto
      .createHash("sha256")
      .update(rawBody)
      .digest("hex")
      .slice(0, 16)}`;
    if (await dedupWebhook(jsmKey)) {
      res.json(success({ received: true }));
      return;
    }

    try {
      if (issueKey && statusName) {
        const supabase = getSupabaseAdmin();
        const mappedStatus =
          JSM_STATUS_MAP[statusName] ?? statusName.toLowerCase().replace(/\s+/g, "_");
        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .select("id, status")
          .eq("external_jsm_issue_key", issueKey)
          .single();
        throwIfReadFailed(ticketError, "JSM ticket lookup");

        if (ticket && ticket.status !== mappedStatus) {
          const { error: updateError } = await supabase
            .from("tickets")
            .update({ status: mappedStatus as Row<"tickets">["status"] })
            .eq("id", ticket.id);
          throwIfWriteFailed(updateError, "JSM ticket status update");
          logger.info(
            {
              issueKey,
              ticketId: ticket.id,
              from: ticket.status,
              to: mappedStatus,
            },
            "Ticket status synced from JSM webhook",
          );
        }
      }

      const jsmAuditOk = await logAuditEvent({
        actorType: "system",
        action: `jsm.${event.webhookEvent ?? "unknown"}`,
        entityType: "jsm_event",
        metadata: { issue: issueKey, summary, status: statusName },
      });
      if (jsmAuditOk === false) {
        throw new Error(`audit log write failed for jsm.${event.webhookEvent ?? "unknown"}`);
      }

      await logWebhookDelivery(`jsm.${event.webhookEvent ?? "unknown"}`, req.body, jsmKey);
      recordWebhookDelivery("success", `jsm.${event.webhookEvent ?? "unknown"}`);

      res.json(success({ received: true }));
    } catch (error) {
      // Release the claim so the sender's retry can reprocess the event
      // (claim-before-process must not persist a "duplicate" on failure).
      await deleteIdempotencyKey(jsmKey).catch(() => undefined);
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/m365", (req, res) => {
  const validationToken = req.query.validationToken as string | undefined;
  if (validationToken) {
    res.set("Content-Type", "text/plain");
    res.send(validationToken);
    return;
  }
  res.status(400).json(failure("VALIDATION", "Missing validationToken", 400));
});

router.post("/m365", async (req, res, next) => {
  let claimedKey: string | null = null;
  try {
    // WH-P2-006: minimal shape check before clientState verification; a
    // non-object body or a non-array/empty `value` is rejected with 400.
    const event = m365WebhookSchema.parse(req.body);
    logger.info({ resource: event.value[0]?.resource }, "M365 webhook received");

    const clientState = getEnv().M365_CLIENT_STATE;
    if (!clientState) {
      logger.warn("M365 webhook clientState not configured");
      res.status(501).json(failure("NOT_IMPLEMENTED", "M365 webhook not configured", 501));
      return;
    }

    const value = event.value;

    for (const notification of value) {
      // clientState is the only authentication for M365 change notifications
      // (Graph does not sign webhook payloads). Missing or mismatched
      // clientState must be rejected — previously an omitted clientState
      // passed the check, making the endpoint unauthenticated. SEC-P3-002:
      // compare in constant time so the secret is not timing-observable.
      if (!notification.clientState || !timingSafeCompare(notification.clientState, clientState)) {
        logger.warn(
          { resource: notification.resource, hasClientState: Boolean(notification.clientState) },
          "M365 webhook clientState missing or mismatch",
        );
        res.status(401).json(failure("UNAUTHORIZED", "Invalid or missing clientState", 401));
        return;
      }
    }

    if (!validateWebhookTimestamp(event)) {
      logger.warn({ resource: value[0]?.resource }, "M365 webhook timestamp outside tolerance");
      res.status(400).json(failure("BAD_REQUEST", "Webhook timestamp outside tolerance", 400));
      return;
    }

    const notification = value[0];
    const resource = notification?.resource;
    const changeType = notification?.changeType;
    // WH-P2-001: Graph change notifications carry no event timestamp and are
    // not signed — clientState is the authentication, so a timestamp window
    // cannot be enforced on the payload. Replay is instead bounded by an
    // atomic idempotency claim on a deterministic digest of the full
    // notification, held for M365_REPLAY_WINDOW_SECONDS: an identical
    // retransmission (Graph retry or a captured replay) is rejected, while
    // distinct legitimate events are not suppressed.
    const eventDigest = crypto
      .createHash("sha256")
      .update(JSON.stringify(notification ?? {}))
      .digest("hex")
      .slice(0, 16);
    const m365Key = `m365-${resource ?? "unknown"}-${changeType ?? "unknown"}-${notification?.subscriptionExpirationDateTime ?? "no-expiry"}-${eventDigest}`;
    claimedKey = m365Key;
    if (await dedupWebhook(m365Key, M365_REPLAY_WINDOW_SECONDS)) {
      res.json(success({ received: true }));
      return;
    }

    const m365AuditOk = await logAuditEvent({
      actorType: "system",
      action: "m365.webhook",
      entityType: "m365_event",
      metadata: { resource, changeType, notificationCount: value.length },
    });
    if (m365AuditOk === false) {
      throw new Error("audit log write failed for m365.webhook");
    }

    await logWebhookDelivery("m365.webhook", req.body, m365Key);
    recordWebhookDelivery("success", "m365.webhook");

    res.json(success({ received: true }));
  } catch (error) {
    // Release the claim so Graph's retry can reprocess the notification
    // (claim-before-process must not persist a "duplicate" on failure).
    if (claimedKey) {
      await deleteIdempotencyKey(claimedKey).catch(() => undefined);
    }
    next(error);
  }
});

export default router;
