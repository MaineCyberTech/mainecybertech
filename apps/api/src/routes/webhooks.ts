import { Router } from "express";
import Stripe from "stripe";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "../lib/logger";
import { failure, success } from "../types";
import { logAuditEvent } from "../services/audit";
import { getEnv } from "../config/env";

const router: ReturnType<typeof Router> = Router();

const JIRA_STATUS_MAP: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  "Under Review": "in_review",
  "Code Review": "in_review",
  "Done": "done",
  "Blocked": "blocked",
};

const JSM_STATUS_MAP: Record<string, string> = {
  "Open": "new",
  "In Progress": "in_progress",
  "Waiting for Customer": "waiting_on_client",
  "Waiting for Support": "in_progress",
  "Resolved": "resolved",
  "Closed": "closed",
};

router.post("/stripe", async (req, res, next) => {
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

    const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-03-31.basil" as any });
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        signature,
        stripeSecret,
      );
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json(failure("INVALID_SIGNATURE", "Webhook signature verification failed", 400));
      return;
    }

    logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

    const supabase = getSupabaseAdmin();

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const inv = event.data?.object;
      if (inv?.customer) {
        const { data: customer } = await supabase
          .from("billing_customers")
          .select("organization_id")
          .eq("stripe_customer_id", inv.customer)
          .single();

        if (customer) {
          const status = inv.status === "open" && inv.due_date && new Date(inv.due_date * 1000) < new Date() ? "overdue" : inv.status;
          await supabase.from("invoices").upsert({
            organization_id: customer.organization_id,
            stripe_invoice_id: inv.id,
            invoice_number: inv.number,
            status,
            subtotal_cents: Math.round(inv.subtotal * 100),
            tax_cents: Math.round((inv.tax ?? 0) * 100),
            total_cents: Math.round(inv.total * 100),
            currency: inv.currency,
            hosted_invoice_url: inv.hosted_invoice_url,
            invoice_pdf_url: inv.invoice_pdf,
            due_at: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
            paid_at: inv.status === "paid" ? new Date(inv.status_transitions?.paid_at * 1000).toISOString() : null,
          }, { onConflict: "stripe_invoice_id" });
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted" || event.type === "customer.subscription.created") {
      const sub = event.data?.object;
      if (sub?.customer) {
        const { data: customer } = await supabase
          .from("billing_customers")
          .select("organization_id")
          .eq("stripe_customer_id", sub.customer)
          .single();

        if (customer) {
          const price = sub.items?.data?.[0]?.price;
          await supabase.from("subscriptions").upsert({
            organization_id: customer.organization_id,
            stripe_subscription_id: sub.id,
            plan_name: price?.nickname ?? price?.product ?? "Unknown",
            status: sub.status,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            amount_cents: price?.unit_amount ?? 0,
            currency: price?.currency ?? "usd",
          }, { onConflict: "stripe_subscription_id" });
        }
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (session?.customer && session?.client_reference_id) {
        await supabase.from("billing_customers").upsert({
          organization_id: session.client_reference_id,
          stripe_customer_id: session.customer,
          billing_email: session.customer_details?.email ?? null,
        }, { onConflict: "organization_id" });
      }
    }

    await logAuditEvent({ actorType: "system", action: `stripe.${event.type}`, entityType: "stripe_event", metadata: { id: event.id } });
    res.json(success({ received: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/jira", async (req, res, next) => {
  try {
    const event = req.body;
    const issueKey: string | undefined = event.issue?.key;
    const statusName: string | undefined = event.issue?.fields?.status?.name;
    const summary: string | undefined = event.issue?.fields?.summary;

    logger.info({ event: event.webhookEvent, issueKey, status: statusName }, "Jira webhook received");

    if (issueKey && statusName) {
      const supabase = getSupabaseAdmin();
      const mappedStatus = JIRA_STATUS_MAP[statusName] ?? statusName.toLowerCase().replace(/\s+/g, "_");
      const { data: task } = await supabase
        .from("project_tasks")
        .select("id, status")
        .eq("external_jira_issue_key", issueKey)
        .single();

      if (task && task.status !== mappedStatus) {
        await supabase.from("project_tasks").update({ status: mappedStatus }).eq("id", task.id);
        logger.info({ issueKey, taskId: task.id, from: task.status, to: mappedStatus }, "Task status synced from Jira webhook");
      }
    }

    await logAuditEvent({
      actorType: "system",
      action: `jira.${event.webhookEvent ?? "unknown"}`,
      entityType: "jira_event",
      metadata: { issue: issueKey, summary, status: statusName },
    });

    res.json(success({ received: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/jsm", async (req, res, next) => {
  try {
    const event = req.body;
    const issueKey: string | undefined = event.issue?.key;
    const statusName: string | undefined = event.issue?.fields?.status?.name;
    const summary: string | undefined = event.issue?.fields?.summary;

    logger.info({ event: event.webhookEvent, issueKey, status: statusName }, "JSM webhook received");

    if (issueKey && statusName) {
      const supabase = getSupabaseAdmin();
      const mappedStatus = JSM_STATUS_MAP[statusName] ?? statusName.toLowerCase().replace(/\s+/g, "_");
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, status")
        .eq("external_jsm_issue_key", issueKey)
        .single();

      if (ticket && ticket.status !== mappedStatus) {
        await supabase.from("tickets").update({ status: mappedStatus }).eq("id", ticket.id);
        logger.info({ issueKey, ticketId: ticket.id, from: ticket.status, to: mappedStatus }, "Ticket status synced from JSM webhook");
      }
    }

    await logAuditEvent({
      actorType: "system",
      action: `jsm.${event.webhookEvent ?? "unknown"}`,
      entityType: "jsm_event",
      metadata: { issue: issueKey, summary, status: statusName },
    });

    res.json(success({ received: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/m365", async (req, res, next) => {
  try {
    const event = req.body;
    logger.info({ resource: event.resource }, "M365 webhook received");
    await logAuditEvent({
      actorType: "system",
      action: "m365.webhook",
      entityType: "m365_event",
      metadata: { resource: event.resource, changeType: event.changeType },
    });
    res.json(success({ received: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
