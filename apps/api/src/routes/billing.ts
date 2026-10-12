import { Router, type Request } from "express";
import { z } from "zod";
import { getScopedClient, getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { AppError, failure, success } from "../types";
import { getEnv } from "../config/env";
import { httpClients } from "../lib/http-client";
import { logger } from "../lib/logger";
import { queryInt } from "../lib/query";
import { resolveAdminTenantScope, applyOrgScope, applyRequestedOrg } from "../lib/admin-scope";
import { resolveEffectivePermissions, ADMIN_BYPASS_KEYS } from "../lib/permissions";
<<<<<<< HEAD
import { listCountMode } from "../lib/pagination";
=======
import { decryptField } from "../lib/field-encryption";
import { invoicePaidAtIso, epochSecondsToIsoOrNow } from "../lib/billing-timestamps";
>>>>>>> f5ff33e1 (fix(billing): P3 batch — PM-id redaction, email encryption, paid_at guards, left-join payments, entitlement override, seats/trials, sync gating, doc sync [BILL-P3-002/003/004/005/006/007/008])

type StripePrice = {
  nickname?: string | null;
  product?: string | null;
  unit_amount?: number | null;
  currency?: string | null;
  recurring?: { interval?: string | null } | null;
};

type StripeInvoice = {
  id: string;
  number: string | null;
  status: string;
  subtotal: number;
  tax: number | null;
  total: number;
  currency: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  due_date: number | null;
  created?: number | null;
  status_transitions?: { paid_at?: number | null; voided_at?: number | null } | null;
};

type StripeSubscription = {
  id: string;
  status: string;
  current_period_start: number | null;
  current_period_end: number | null;
  trial_start?: number | null;
  trial_end?: number | null;
  cancel_at_period_end?: boolean | null;
  canceled_at?: number | null;
  items: { data: Array<{ price: StripePrice; quantity?: number | null }> };
};

type StripeCharge = {
  id: string;
  payment_intent?: string | null;
  amount?: number | null;
  amount_refunded?: number | null;
  refunds?: { data?: Array<{ created?: number | null }> } | null;
};

type StripePaymentIntent = {
  id: string;
  status: string;
  amount: number;
  amount_received?: number | null;
  currency: string;
  created: number | null;
  invoice?: string | null;
  customer?: string | null;
};

// BILL-P2-002 / PERF-P2-006: page through Stripe list endpoints. Fixed page
// sizes (20/10/20) silently dropped every object past the first page; the sync
// now follows `starting_after` until Stripe says there is no more, bounded by
// a page cap. Hitting the cap is reported as a failed sync (mirrors the JSM
// sync pattern) instead of a partial success. The cap defaults to
// STRIPE_MAX_PAGES and can be raised per deployment with STRIPE_SYNC_MAX_PAGES
// for accounts with more than 1000 objects per list.
const STRIPE_PAGE_SIZE = 100;
const STRIPE_MAX_PAGES = 10; // 1000 objects per list, per customer, per run

type StripeListPage<T> = {
  data?: T[];
  has_more?: boolean;
};

type StripePageResult<T> = {
  items: T[];
  truncated: boolean;
  error?: string;
};

/**
 * Fetch every page of a Stripe list endpoint with `starting_after`, bounded by
 * `maxPages`. Never throws: a failed page is returned as `error` (with
 * whatever was fetched so far) and a `has_more` left at the cap as
 * `truncated`, so the caller can fail the sync loudly instead of reporting
 * success for a partial mirror.
 */
async function fetchStripePages<T extends { id: string }>(
  url: string,
  params: Record<string, string>,
  headers: Record<string, string>,
  label: string,
  maxPages: number = STRIPE_MAX_PAGES,
): Promise<StripePageResult<T>> {
  const items: T[] = [];
  let startingAfter: string | null = null;

  for (let page = 0; page < maxPages; page++) {
    const query = new URLSearchParams({ ...params, limit: String(STRIPE_PAGE_SIZE) });
    if (startingAfter) query.set("starting_after", startingAfter);

    try {
      const res = await httpClients.stripe.get(`${url}?${query.toString()}`, { headers });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return {
          items,
          truncated: false,
          error: `${label}: Stripe API ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
        };
      }

      const body = (await res.json()) as StripeListPage<T>;
      const pageItems = body.data ?? [];
      items.push(...pageItems);

      if (!body.has_more || pageItems.length === 0) {
        return { items, truncated: false };
      }

      startingAfter = pageItems[pageItems.length - 1]?.id ?? null;
      if (!startingAfter) return { items, truncated: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { items, truncated: false, error: `${label}: ${message}` };
    }
  }

  // `has_more` was still true when the page cap was reached.
  return { items, truncated: true };
}

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

/**
 * BILL-P2-008: billing reads previously ran with no org predicate whenever no
 * organization was resolved — a cross-tenant role holder (`admin`/
 * `super_admin`) without an explicit org got an all-tenant read with no
 * super-admin gate and no audit. Audit implicit all-tenant reads here; each
 * GET handler below applies the mandatory `resolveAdminTenantScope` predicate.
 */
router.use(async (req, _res, next) => {
  try {
    if (req.method !== "GET") {
      next();
      return;
    }
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;
    if (scope.allTenants && !requestedOrg) {
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "billing.cross_tenant_read",
        entityType: "billing",
        metadata: { path: req.path },
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});
/**
 * Epoch-seconds timestamp of the most recent refund on a charge (BILL-P2-001).
 * Used by the sync's charge backfill; returns null when Stripe does not embed
 * the refund list so callers persist an explicit null rather than guessing.
 */
function latestRefundCreated(charge: StripeCharge): number | null {
  const refunds = Array.isArray(charge.refunds?.data) ? charge.refunds.data : [];
  let latest = 0;
  for (const refund of refunds) {
    if (typeof refund?.created === "number" && refund.created > latest) latest = refund.created;
  }
  return latest > 0 ? latest : null;
}

/**
 * BILL-P3-002: never return the raw Stripe payment-method id (`pm_...`) to
 * users. Both billing UIs rendered it verbatim; the API now redacts it to a
 * prefix + last four characters so the portal shows an opaque descriptor
 * instead of a usable Stripe token.
 */
function maskPaymentMethodId(paymentMethodId: string | null | undefined): string | null {
  if (!paymentMethodId) return null;
  if (paymentMethodId.length <= 8) return "••••";
  return `${paymentMethodId.slice(0, 3)}••••${paymentMethodId.slice(-4)}`;
}

/**
 * BILL-P3-002: `billing_customers.billing_email` is stored encrypted (see
 * webhooks.ts checkout.session.completed). Legacy plaintext rows (and the
 * dev/test `plain:` fallback) decrypt to themselves; a malformed ciphertext
 * must not 500 the read, so it degrades to null.
 */
function decryptBillingEmail(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    return decryptField(stored);
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "Failed to decrypt billing email",
    );
    return null;
  }
}

router.get("/summary", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;

    const baseQuery = (qb: any) =>
      applyOrgScope(
        applyRequestedOrg(qb, "organization_id", requestedOrg, scope),
        "organization_id",
        scope,
      );

    const [
      { count: activeSubs },
      { count: overdueInvoices },
      { count: paidInvoices },
      { count: totalInvoices },
      { data: recentInvoices },
    ] = await Promise.all([
      // Apply the scope + filters to the builder *before* awaiting it: a
      // supabase-js `.then()` resolves the PostgREST response, so chaining
      // predicates onto the resolved value throws (the summary used to 500).
      baseQuery(supabase.from("subscriptions").select("*", { count: "exact", head: true }))
        // BILL-P3-006: mirror `isSubscriptionActive` — a trialing plan is an
        // active plan for entitlement purposes, so it must not show as 0.
        .in("status", ["active", "trialing"]),
      baseQuery(supabase.from("invoices").select("*", { count: "exact", head: true })).eq(
        "status",
        "overdue",
      ),
      baseQuery(supabase.from("invoices").select("*", { count: "exact", head: true })).eq(
        "status",
        "paid",
      ),
      baseQuery(supabase.from("invoices").select("*", { count: "exact", head: true })),
      baseQuery(supabase.from("invoices").select("*"))
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    res.json(
      success({
        activeSubscriptions: activeSubs ?? 0,
        overdueInvoices: overdueInvoices ?? 0,
        paidInvoices: paidInvoices ?? 0,
        totalInvoices: totalInvoices ?? 0,
        recentInvoices: recentInvoices ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/invoices", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;
    const statusFilter = req.query.status as string | undefined;

    let query = supabase.from("invoices").select("*", { count: listCountMode(req.query) });
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);
    if (statusFilter) query = query.eq("status", statusFilter as never);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.get("/invoices/:id", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;
    let query = supabase.from("invoices").select("*").eq("id", String(req.params.id));
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);
    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "Invoice not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/subscriptions", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;

    let query = supabase.from("subscriptions").select("*");
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.get("/payments", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;

    let query = supabase
      .from("payments")
<<<<<<< HEAD
      .select("*, invoices!inner(invoice_number, status)", { count: listCountMode(req.query) });
=======
      // BILL-P3-004: left join (no `!inner`) so payments without a mirrored
      // invoice (one-off PaymentIntents, invoice not yet synced) still list
      // with a null invoice column instead of disappearing.
      .select("*, invoices(invoice_number, status)", { count: "exact" });
>>>>>>> f5ff33e1 (fix(billing): P3 batch — PM-id redaction, email encryption, paid_at guards, left-join payments, entitlement override, seats/trials, sync gating, doc sync [BILL-P3-002/003/004/005/006/007/008])
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.get("/billing-customer", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "billing", "read");
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      typeof req.query.organization_id === "string" ? req.query.organization_id : undefined;

    let query = supabase.from("billing_customers").select("*");
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);
    const { data, error } = await query.single();
    if (error && error.code !== "PGRST116") throw new AppError("DB_ERROR", error.message, 500);
    if (!data) {
      res.json(success(null));
      return;
    }
    // BILL-P3-002: decrypt the stored billing contact email and redact the raw
    // Stripe payment-method id before it reaches any user-facing response.
    res.json(
      success({
        ...data,
        billing_email: decryptBillingEmail(data.billing_email),
        default_payment_method: maskPaymentMethodId(data.default_payment_method),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/sync", requirePermission("billing", "manage"), async (req, res, next) => {
  try {
    const { organizationId } = z
      .object({ organizationId: z.string().uuid().optional() })
      .parse(req.body);
    const supabase = getScopedClient(req, "billing", "write");

    // Scope the sync to a single organization. `req.orgId` (resolved by
    // requireOrgAccess) is the authority; a body/query org may only narrow,
    // never widen, the caller's scope. Previously an omitted org left the
    // query with no predicate at all, so the handler synced EVERY tenant's
    // billing customers, invoices, subscriptions and payments.
    const scope = await resolveAdminTenantScope(req);
    const requestedOrg =
      organizationId ??
      (typeof req.query.organization_id === "string" ? req.query.organization_id : undefined);
    const targetOrg = requestedOrg ?? req.orgId ?? undefined;

    if (!targetOrg) {
      // Never silently fall back to "all tenants".
      throw new AppError("VALIDATION", "organizationId is required", 400);
    }
    if (!scope.allTenants && !scope.orgIds.includes(targetOrg)) {
      throw new AppError("FORBIDDEN", "You do not have access to this organization", 403);
    }

    const env = getEnv();
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new AppError("CONFIG", "STRIPE_SECRET_KEY not configured", 500);

    const stripeHeaders = {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const { data: customers } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id, organization_id")
      .eq("organization_id", targetOrg);

    if (!customers?.length) {
      res.json(success({ synced: 0, message: "No billing customers found" }));
      return;
    }

    let synced = 0;
    const counts = { invoices: 0, subscriptions: 0, payments: 0, refunds: 0 };
    const errors: string[] = [];
    // PERF-P2-006: operator-controlled page bound (default 10 pages of 100).
    const maxPages = env.STRIPE_SYNC_MAX_PAGES ?? STRIPE_MAX_PAGES;

    for (const customer of customers) {
      if (!customer.stripe_customer_id) continue;
      const customerId = customer.stripe_customer_id;

      const [invoicesPage, subsPage, paymentsPage, chargesPage] = await Promise.all([
        fetchStripePages<StripeInvoice>(
          "https://api.stripe.com/v1/invoices",
          { customer: customerId },
          stripeHeaders,
          `invoices (${customerId})`,
          maxPages,
        ),
        fetchStripePages<StripeSubscription>(
          "https://api.stripe.com/v1/subscriptions",
          { customer: customerId },
          stripeHeaders,
          `subscriptions (${customerId})`,
          maxPages,
        ),
        fetchStripePages<StripePaymentIntent>(
          "https://api.stripe.com/v1/payment_intents",
          { customer: customerId },
          stripeHeaders,
          `payment_intents (${customerId})`,
          maxPages,
        ),
        fetchStripePages<StripeCharge>(
          "https://api.stripe.com/v1/charges",
          { customer: customerId },
          stripeHeaders,
          `charges (${customerId})`,
          maxPages,
        ),
      ]);

      for (const pageError of [
        invoicesPage.error,
        subsPage.error,
        paymentsPage.error,
        chargesPage.error,
      ]) {
        if (pageError) errors.push(pageError);
      }
      if (
        invoicesPage.truncated ||
        subsPage.truncated ||
        paymentsPage.truncated ||
        chargesPage.truncated
      ) {
        errors.push(
          `page cap (${maxPages} pages of ${STRIPE_PAGE_SIZE}) reached for customer ${customerId}`,
        );
      }

      for (const inv of invoicesPage.items) {
        const status =
          inv.status === "open" && new Date((inv.due_date ?? 0) * 1000) < new Date()
            ? "overdue"
            : inv.status;
        await supabase.from("invoices").upsert(
          {
            organization_id: customer.organization_id,
            stripe_invoice_id: inv.id,
            invoice_number: inv.number,
            status: status as never,
            // Stripe already returns amounts in the smallest currency unit (cents)
            subtotal_cents: Math.round(inv.subtotal),
            tax_cents: Math.round(inv.tax ?? 0),
            total_cents: Math.round(inv.total),
            currency: inv.currency,
            hosted_invoice_url: inv.hosted_invoice_url,
            invoice_pdf_url: inv.invoice_pdf,
            due_at: inv.due_date ? new Date((inv.due_date ?? 0) * 1000).toISOString() : null,
            // BILL-P3-003: `status_transitions.paid_at` can be absent — never
            // write 1970-01-01 for a paid invoice.
            paid_at: inv.status === "paid" ? invoicePaidAtIso(inv) : null,
            // BILL-P2-005: timestamp the void transition. Undefined keeps any
            // previously recorded value when Stripe omits status_transitions.
            voided_at: inv.status_transitions?.voided_at
              ? new Date(inv.status_transitions.voided_at * 1000).toISOString()
              : undefined,
          },
          { onConflict: "stripe_invoice_id" },
        );
        counts.invoices++;
      }

      for (const sub of subsPage.items) {
        const item = sub.items?.data?.[0];
        const price = item?.price;
        await supabase.from("subscriptions").upsert(
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
          { onConflict: "stripe_subscription_id" },
        );
        counts.subscriptions++;
      }

      // Populate payment history (BILL-P1-002). PaymentIntents are Stripe's
      // canonical payment object; link to the local invoice when one exists.
      if (paymentsPage.items.length) {
        const { data: orgInvoices } = await supabase
          .from("invoices")
          .select("id, stripe_invoice_id")
          .eq("organization_id", customer.organization_id);
        const invoiceIdByStripeId = new Map(
          (orgInvoices ?? []).map((inv) => [inv.stripe_invoice_id, inv.id]),
        );

        // BILL-P2-007: refunds are terminal and Stripe's PaymentIntent status
        // stays `succeeded` after a charge refund, so a sync would otherwise
        // overwrite a locally recorded refunded/partially_refunded status.
        const { data: orgPayments } = await supabase
          .from("payments")
          .select("stripe_payment_intent_id, status")
          .eq("organization_id", customer.organization_id);
        const terminalPaymentIntents = new Set(
          (orgPayments ?? [])
            .filter(
              (payment) =>
                payment.status === "refunded" || payment.status === "partially_refunded",
            )
            .map((payment) => payment.stripe_payment_intent_id),
        );

        for (const pi of paymentsPage.items) {
          if (terminalPaymentIntents.has(pi.id)) {
            // Keep the terminal refund status; do not downgrade it to the PI status.
            continue;
          }
          const succeeded = pi.status === "succeeded";
          await supabase.from("payments").upsert(
            {
              organization_id: customer.organization_id,
              invoice_id: pi.invoice ? (invoiceIdByStripeId.get(pi.invoice) ?? null) : null,
              stripe_payment_intent_id: pi.id,
              amount_cents: Math.round(
                succeeded ? (pi.amount_received ?? pi.amount) : pi.amount,
              ),
              currency: pi.currency,
              status: succeeded
                ? "succeeded"
                : pi.status === "canceled" || pi.status === "requires_payment_method"
                  ? "failed"
                  : "pending",
              paid_at: succeeded ? epochSecondsToIsoOrNow(pi.created) : null,
            },
            { onConflict: "stripe_payment_intent_id" },
          );
          counts.payments++;
        }
      }

      // Refund backfill (BILL-P2-001): `charge.refunded` is the live path, but
      // a missed webhook (or a refund that predates the handler) would leave
      // the payment mirrored as succeeded. Stripe charges carry the refunded
      // amount and (usually) the refund list, so replay them after the PI
      // upsert — which also repairs the upsert's succeeded status.
      for (const charge of chargesPage.items) {
        const paymentIntentId = charge.payment_intent;
        const refundedCents = charge.amount_refunded ?? 0;
        if (!paymentIntentId || refundedCents <= 0) continue;

        const fullyRefunded =
          typeof charge.amount === "number" && refundedCents >= charge.amount;
        const refundedAt = latestRefundCreated(charge);
        await supabase
          .from("payments")
          .update({
            status: fullyRefunded ? "refunded" : "partially_refunded",
            refund_amount_cents: Math.round(refundedCents),
            refunded_at: refundedAt ? new Date(refundedAt * 1000).toISOString() : null,
          })
          .eq("stripe_payment_intent_id", paymentIntentId);
        counts.refunds++;
      }

      synced++;
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "billing.sync",
      entityType: "billing_customer",
      organizationId: targetOrg,
      metadata: { organizationId: targetOrg, synced, counts, errors: errors.length },
    });

    if (errors.length > 0) {
      // Fail closed: a sync that skipped a Stripe page or stopped at the page
      // cap must not be acknowledged as a complete mirror.
      res.status(502).json(
        failure(
          "STRIPE_SYNC_INCOMPLETE",
          `Stripe sync incomplete: ${errors.length} error(s)`,
          502,
          { synced, counts, errors },
        ),
      );
      return;
    }

    res.json(success({ synced, counts }));
  } catch (error) {
    next(error);
  }
});

// ADMIN-P2-009: the Stripe portal can change payment methods and cancel the
// subscription, so it is restricted to the org's billing contacts and callers
// holding `billing:manage` (finance / client-billing roles; admin and
// super_admin bypass, matching requirePermission).
async function assertBillingPortalAccess(req: Request, orgId: string) {
  const userId = req.authUser!.userId;

  const { data: billingContact, error } = await getSupabaseAdmin()
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .eq("is_billing_contact", true)
    .maybeSingle();

  if (error) throw new AppError("DB_ERROR", error.message, 500);
  if (billingContact) return;

  const resolved = await resolveEffectivePermissions(userId, orgId);
  const adminBypass = resolved.roles.some((key) =>
    (ADMIN_BYPASS_KEYS as readonly string[]).includes(key),
  );
  if (resolved.isSuperAdmin || adminBypass || resolved.keys.has("billing:manage")) return;

  // Platform admins (admin/super_admin in any org) may act on a tenant where
  // they hold no membership — re-resolve org-agnostically before denying.
  if (resolved.roles.length === 0) {
    const fallback = await resolveEffectivePermissions(userId, null);
    if (
      fallback.isSuperAdmin ||
      fallback.roles.some((key) => (ADMIN_BYPASS_KEYS as readonly string[]).includes(key))
    ) {
      return;
    }
  }

  throw new AppError("FORBIDDEN", "Billing contact or billing permission required", 403);
}

router.post("/create-portal-session", async (req, res, next) => {
  try {
    const env = getEnv();
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new AppError("CONFIG", "STRIPE_SECRET_KEY not configured", 500);

    const supabase = getScopedClient(req, "billing", "write");
    const activeOrgHeader =
      typeof req.headers?.["x-active-org"] === "string"
        ? (req.headers["x-active-org"] as string)
        : undefined;
    const orgId =
      (req.body?.organizationId as string | undefined) ??
      (req.query.organization_id as string | undefined) ??
      (activeOrgHeader?.length ? activeOrgHeader : undefined) ??
      (req.cookies?.["mct_active_org"] as string | undefined);
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);

    // ADMIN-P2-009: only billing contacts (or billing:manage holders) may
    // open the portal session for this org.
    await assertBillingPortalAccess(req, orgId);

    const { data: customer, error } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("organization_id", orgId)
      .single();

    if (error || !customer?.stripe_customer_id) {
      throw new AppError("NOT_FOUND", "No Stripe customer found for this organization", 404);
    }

    const body = new URLSearchParams({
      customer: customer.stripe_customer_id,
      return_url: `${env.APP_BASE_URL}/portal/billing`,
    });

    const portalRes = await httpClients.stripe.fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    if (!portalRes.ok) {
      const errorText = await portalRes.text().catch(() => "Unknown error");
      logger.error({ status: portalRes.status, error: errorText }, "Stripe portal session failed");
      throw new AppError("STRIPE_ERROR", "Failed to create billing portal session", 500);
    }

    const session = (await portalRes.json()) as { url: string };

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "billing.portal_session",
      entityType: "billing_customer",
    });

    res.json(success({ url: session.url }));
  } catch (error) {
    next(error);
  }
});

export default router;
