import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { AppError, success } from "../types";
import { getEnv } from "../config/env";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/summary", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    const baseQuery = orgId
      ? (qb: any) => qb.eq("organization_id", orgId)
      : (qb: any) => qb;

    const [
      { count: activeSubs },
      { count: overdueInvoices },
      { count: paidInvoices },
      { count: totalInvoices },
      { data: recentInvoices },
    ] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .then((q) => baseQuery(q))
        .then((q) => q.eq("status", "active")),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .then((q) => baseQuery(q))
        .then((q) => q.eq("status", "overdue")),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .then((q) => baseQuery(q))
        .then((q) => q.eq("status", "paid")),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .then((q) => baseQuery(q)),
      supabase
        .from("invoices")
        .select("*")
        .then((q) => baseQuery(q))
        .then((q) => q.order("created_at", { ascending: false }).limit(5)),
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
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const offset = (page - 1) * limit;
    const orgId = req.query.organization_id as string | undefined;
    const statusFilter = req.query.status as string | undefined;

    let query = supabase.from("invoices").select("*", { count: "exact" });
    if (orgId) query = query.eq("organization_id", orgId);
    if (statusFilter) query = query.eq("status", statusFilter);

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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data)
      throw new AppError("NOT_FOUND", "Invoice not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/subscriptions", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    let query = supabase.from("subscriptions").select("*");
    if (orgId) query = query.eq("organization_id", orgId);

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
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const offset = (page - 1) * limit;
    const orgId = req.query.organization_id as string | undefined;

    let query = supabase
      .from("payments")
      .select("*, invoices!inner(invoice_number, status)", { count: "exact" });
    if (orgId) query = query.eq("organization_id", orgId);

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
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    if (!orgId)
      throw new AppError("VALIDATION", "organization_id is required", 400);

    const { data, error } = await supabase
      .from("billing_customers")
      .select("*")
      .eq("organization_id", orgId)
      .single();
    if (error && error.code !== "PGRST116")
      throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? null));
  } catch (error) {
    next(error);
  }
});

router.post("/sync", requireAdmin, async (req, res, next) => {
  try {
    const { organizationId } = z
      .object({ organizationId: z.string().uuid().optional() })
      .parse(req.body);
    const supabase = getSupabaseAdmin();

    const env = getEnv();
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey)
      throw new AppError("CONFIG", "STRIPE_SECRET_KEY not configured", 500);

    const headers = {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    let query = supabase
      .from("billing_customers")
      .select("stripe_customer_id, organization_id");
    if (organizationId) query = query.eq("organization_id", organizationId);

    const { data: customers } = await query;
    if (!customers?.length) {
      res.json(success({ synced: 0, message: "No billing customers found" }));
      return;
    }

    let synced = 0;
    for (const customer of customers) {
      if (!customer.stripe_customer_id) continue;

      const [invoicesRes, subsRes] = await Promise.all([
        fetch(
          `https://api.stripe.com/v1/invoices?customer=${customer.stripe_customer_id}&limit=20`,
          { headers },
        ),
        fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customer.stripe_customer_id}&limit=10`,
          { headers },
        ),
      ]);

      if (invoicesRes.ok) {
        const invoicesData = (await invoicesRes.json()) as { data: any[] };
        for (const inv of invoicesData.data ?? []) {
          const status =
            inv.status === "open" && new Date(inv.due_date * 1000) < new Date()
              ? "overdue"
              : inv.status;
          await supabase.from("invoices").upsert(
            {
              organization_id: customer.organization_id,
              stripe_invoice_id: inv.id,
              invoice_number: inv.number,
              status,
              subtotal_cents: Math.round(
                inv.subtotal * (inv.currency === "usd" ? 100 : 100),
              ),
              tax_cents: Math.round((inv.tax ?? 0) * 100),
              total_cents: Math.round(inv.total * 100),
              currency: inv.currency,
              hosted_invoice_url: inv.hosted_invoice_url,
              invoice_pdf_url: inv.invoice_pdf,
              due_at: inv.due_date
                ? new Date(inv.due_date * 1000).toISOString()
                : null,
              paid_at:
                inv.status === "paid"
                  ? new Date(
                      inv.status_transitions?.paid_at * 1000,
                    ).toISOString()
                  : null,
            },
            { onConflict: "stripe_invoice_id" },
          );
        }
      }

      if (subsRes.ok) {
        const subsData = (await subsRes.json()) as { data: any[] };
        for (const sub of subsData.data ?? []) {
          const price = sub.items?.data?.[0]?.price;
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
            },
            { onConflict: "stripe_subscription_id" },
          );
        }
      }

      synced++;
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "billing.sync",
      entityType: "billing_customer",
      metadata: { organizationId, synced },
    });

    res.json(success({ synced }));
  } catch (error) {
    next(error);
  }
});

export default router;
