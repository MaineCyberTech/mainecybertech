import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { loadOwned } from "../lib/tenant";
import { createStagingSchema, updateStagingSchema } from "../validators/staging";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("hardware_staging_checks").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) query = query.eq("status", status);
    const search = req.query.search as string | undefined;
    if (search) query = query.ilike("device_name", `%${search}%`);

    const {
      data,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string | undefined;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("hardware_staging_checks").select("*").eq("id", String(req.params.id as string));
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "Staging check not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createStagingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("hardware_staging_checks")
      .insert({
        organization_id: parsed.organizationId,
        device_name: parsed.deviceName,
        asset_tag: parsed.assetTag ?? null,
        status: parsed.status,
        checklist: parsed.checklist ?? [],
        assigned_to: parsed.assignedTo ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "hardware_staging.created",
      entityType: "hardware_staging_check",
      entityId: data.id,
      metadata: { deviceName: parsed.deviceName },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateStagingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await loadOwned(req, supabase as any, "hardware_staging_checks", String(req.params.id as string));

    const updateData: Record<string, unknown> = {};
    if (parsed.deviceName !== undefined) updateData.device_name = parsed.deviceName;
    if (parsed.assetTag !== undefined) updateData.asset_tag = parsed.assetTag;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.checklist !== undefined) updateData.checklist = parsed.checklist;
    if (parsed.assignedTo !== undefined) updateData.assigned_to = parsed.assignedTo;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("hardware_staging_checks")
      .update(updateData)
      .eq("id", String(req.params.id as string))
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "hardware_staging.updated",
      entityType: "hardware_staging_check",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await loadOwned(req, supabase as any, "hardware_staging_checks", String(req.params.id as string));
    const { error } = await supabase
      .from("hardware_staging_checks")
      .delete()
      .eq("id", String(req.params.id as string));
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "hardware_staging.deleted",
      entityType: "hardware_staging_check",
      entityId: String(String(req.params.id as string)),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
