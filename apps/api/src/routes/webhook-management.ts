import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { AppError, success } from "../types";

const router: ReturnType<typeof Router> = Router();

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  secret: z.string().max(500).optional().nullable(),
  events: z.array(z.string().min(1)).min(1, "At least one event is required"),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000).optional(),
  secret: z.string().max(500).optional().nullable(),
  events: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, requireOrgAccess, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    let query = supabase.from("webhook_endpoints").select("*");
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

router.get("/:id", requireAuth, requireOrgAccess, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data)
      throw new AppError("NOT_FOUND", "Webhook not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        url: parsed.url,
        secret: parsed.secret ?? null,
        events: parsed.events,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "webhook.create",
      entityType: "webhook_endpoint",
      entityId: data.id,
      metadata: { name: parsed.name, url: parsed.url },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.url !== undefined) updateData.url = parsed.url;
    if (parsed.secret !== undefined) updateData.secret = parsed.secret;
    if (parsed.events !== undefined) updateData.events = parsed.events;
    if (parsed.isActive !== undefined) updateData.is_active = parsed.isActive;

    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Webhook not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "webhook.update",
      entityType: "webhook_endpoint",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .delete()
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Webhook not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "webhook.delete",
      entityType: "webhook_endpoint",
      entityId: data.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id/deliveries",
  requireAuth,
  requireOrgAccess,
  async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit as string) || 20),
      );
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("webhook_deliveries")
        .select("*", { count: "exact" })
        .eq("webhook_id", req.params.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
    } catch (error) {
      next(error);
    }
  },
);

router.post("/:id/test", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: webhook, error: fetchError } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !webhook)
      throw new AppError("NOT_FOUND", "Webhook not found", 404);

    const payload = {
      event: "ping",
      timestamp: new Date().toISOString(),
      data: { message: "Test from Maine CyberTech" },
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (webhook.secret) headers["X-Webhook-Signature"] = webhook.secret;

    const start = Date.now();
    let responseStatus = 0;
    let responseBody = "";
    let error: string | null = null;

    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      responseStatus = res.status;
      responseBody = await res.text().catch(() => "");
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const duration = Date.now() - start;

    // Generate idempotency key for this delivery attempt
    const idempotencyKey = `test-${webhook.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event: "ping",
      status: error
        ? "failed"
        : responseStatus >= 200 && responseStatus < 300
          ? "success"
          : "failed",
      request_body: payload,
      response_status: responseStatus || null,
      response_body: responseBody || null,
      error,
      duration_ms: duration,
      idempotency_key: idempotencyKey,
    });

    if (error || responseStatus >= 400) {
      await supabase
        .from("webhook_endpoints")
        .update({
          last_failure_at: new Date().toISOString(),
          last_error: error || `HTTP ${responseStatus}`,
        })
        .eq("id", webhook.id);
      res.json(
        success({
          ok: false,
          status: responseStatus,
          error: error || `HTTP ${responseStatus}`,
          duration_ms: duration,
        }),
      );
    } else {
      await supabase
        .from("webhook_endpoints")
        .update({ last_success_at: new Date().toISOString(), last_error: null })
        .eq("id", webhook.id);
      res.json(
        success({ ok: true, status: responseStatus, duration_ms: duration }),
      );
    }

    await logAuditEvent({
      organizationId: webhook.organization_id,
      actorUserId: req.authUser!.userId,
      action: "webhook.test",
      entityType: "webhook_endpoint",
      entityId: webhook.id,
      metadata: {
        url: webhook.url,
        ok: !error && responseStatus >= 200 && responseStatus < 300,
        duration_ms: duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
