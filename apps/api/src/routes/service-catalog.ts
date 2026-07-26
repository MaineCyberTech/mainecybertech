import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { createServiceSchema, updateServiceSchema } from "../validators/service-catalog";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;
    let q = supabase.from("service_catalog").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);
    const { data, error, count } = await q
      .order("category", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Service not found", 404);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createServiceSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("service_catalog")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        description: parsed.description ?? null,
        category: parsed.category,
        billing_model: parsed.billingModel,
        unit: parsed.unit,
        base_price: parsed.basePrice,
        included_units: parsed.includedUnits ?? null,
        overture_rate: parsed.overtureRate ?? null,
        is_bundled: parsed.isBundled,
        bundle_id: parsed.bundleId ?? null,
        is_active: parsed.isActive,
        visibility: parsed.visibility,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "service_catalog.created",
      entityType: "service_catalog",
      entityId: data.id,
      metadata: { name: parsed.name },
    });
    res.status(201).json(success(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateServiceSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const m: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      billingModel: "billing_model",
      unit: "unit",
      basePrice: "base_price",
      includedUnits: "included_units",
      overtureRate: "overture_rate",
      isBundled: "is_bundled",
      bundleId: "bundle_id",
      isActive: "is_active",
      visibility: "visibility",
    };
    const u: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(m)) {
      if ((parsed as Record<string, unknown>)[k] !== undefined)
        u[col] = (parsed as Record<string, unknown>)[k];
    }
    const { data, error } = await supabase
      .from("service_catalog")
      .update(u)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Service not found", 404);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "service_catalog.updated",
      entityType: "service_catalog",
      entityId: data.id,
      metadata: parsed as Record<string, unknown>,
    });
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("service_catalog").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "service_catalog.deleted",
      entityType: "service_catalog",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
