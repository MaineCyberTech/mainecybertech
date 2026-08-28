import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createFrameworkSchema,
  createControlSchema,
  updateControlSchema,
} from "../validators/compliance";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/frameworks", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);

    const { data, error } = await supabase
      .from("compliance_frameworks")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.post("/frameworks", async (req, res, next) => {
  try {
    const parsed = createFrameworkSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("compliance_frameworks")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        description: parsed.description ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "compliance.framework.created",
      entityType: "compliance_framework",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/frameworks/:id/controls", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);

    const { data, error } = await supabase
      .from("compliance_controls")
      .select("*")
      .eq("framework_id", req.params.id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.post("/frameworks/:id/controls", async (req, res, next) => {
  try {
    const parsed = createControlSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: framework, error: fwError } = await supabase
      .from("compliance_frameworks")
      .select("id")
      .eq("id", req.params.id)
      .eq("organization_id", parsed.organizationId)
      .single();
    if (fwError || !framework)
      throw new AppError("NOT_FOUND", "Framework not found", 404);

    const { data, error } = await supabase
      .from("compliance_controls")
      .insert({
        framework_id: req.params.id,
        organization_id: parsed.organizationId,
        title: parsed.title,
        status: parsed.status,
        owner: parsed.owner ?? null,
        due_at: parsed.dueAt ?? null,
        notes: parsed.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "compliance.control.created",
      entityType: "compliance_control",
      entityId: data.id,
      metadata: { title: parsed.title },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/controls/:id", async (req, res, next) => {
  try {
    const parsed = updateControlSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);

    const { data: current, error: fetchError } = await supabase
      .from("compliance_controls")
      .select("id")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .single();
    if (fetchError || !current)
      throw new AppError("NOT_FOUND", "Control not found", 404);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.owner !== undefined) updateData.owner = parsed.owner;
    if (parsed.dueAt !== undefined) updateData.due_at = parsed.dueAt;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;

    const { data, error } = await supabase
      .from("compliance_controls")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "compliance.control.updated",
      entityType: "compliance_control",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/controls/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);

    const { error } = await supabase
      .from("compliance_controls")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", orgId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "compliance.control.deleted",
      entityType: "compliance_control",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
