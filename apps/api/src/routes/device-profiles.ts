import { Router } from "express";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { loadOwned } from "../lib/tenant";
import {
  createDeviceProfileSchema,
  updateDeviceProfileSchema,
  listDeviceProfilesQuerySchema,
} from "../validators/device-profiles";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const parsed = listDeviceProfilesQuerySchema.parse(req.query);
    const supabase = getScopedClient(req, "device-profiles", "read");
    const page = parsed.page;
    const limit = parsed.limit;
    const offset = (page - 1) * limit;

    let query = supabase.from("device_profiles").select("*", { count: "exact" });

    const orgId = parsed.organizationId;
    if (orgId) query = query.eq("organization_id", orgId);

    if (parsed.type) query = query.eq("type", parsed.type);
    if (parsed.manufacturer) query = query.eq("manufacturer", parsed.manufacturer);
    if (parsed.search) query = query.ilike("name", `%${parsed.search}%`);

    const {
      data: profiles,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: profiles ?? [],
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
    const supabase = getScopedClient(req, "device-profiles", "read");

    let query = supabase.from("device_profiles").select("*").eq("id", String(req.params.id as string));
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();

    if (error || !data) throw new AppError("NOT_FOUND", "Device profile not found", 404);

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createDeviceProfileSchema.parse(req.body);
    const supabase = getScopedClient(req, "device-profiles", "write");

    const { data, error } = await supabase
      .from("device_profiles")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        type: parsed.type ?? null,
        manufacturer: parsed.manufacturer ?? null,
        model: parsed.model ?? null,
        specs: parsed.specs ?? {},
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "device_profile.created",
      entityType: "device_profile",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateDeviceProfileSchema.parse(req.body);
    const supabase = getScopedClient(req, "device-profiles", "write");
    await loadOwned(req, supabase as any, "device_profiles", String(req.params.id as string));

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.manufacturer !== undefined) updateData.manufacturer = parsed.manufacturer;
    if (parsed.model !== undefined) updateData.model = parsed.model;
    if (parsed.specs !== undefined) updateData.specs = parsed.specs;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("device_profiles")
      .update(updateData)
      .eq("id", String(req.params.id as string))
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "device_profile.updated",
      entityType: "device_profile",
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
    const supabase = getScopedClient(req, "device-profiles", "write");
    await loadOwned(req, supabase as any, "device_profiles", String(req.params.id as string));
    const { error } = await supabase.from("device_profiles").delete().eq("id", String(req.params.id as string));

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "device_profile.deleted",
      entityType: "device_profile",
      entityId: String(String(req.params.id as string)),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
