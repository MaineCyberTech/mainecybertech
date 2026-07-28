import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createISPSchema,
  createUnifiSchema,
  createPortMapSchema,
  createCameraSchema,
  createStagingSchema,
  createNetworkDiagramSchema,
} from "../validators/field-services";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

function snake(s: string) {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}
function crudRoute(path: string, table: string, createSchema: Record<string, unknown>) {
  router.get(`/${path}`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      const q = sb
        .from(table)
        .select("*", { count: "exact" })
        .eq("organization_id", req.query.organization_id as string);
      const { data, error, count } = await q
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, (page - 1) * limit + limit - 1);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(
        success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
      );
    } catch (e) {
      next(e);
    }
  });
  router.post(`/${path}`, async (req, res, next) => {
    try {
      const parsed = (createSchema as { parse: (b: unknown) => Record<string, unknown> }).parse(
        req.body,
      );
      const sb = getSupabaseAdmin();
      const fields: Record<string, unknown> = { created_by: req.authUser!.userId };
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (k !== "organizationId") fields[snake(k)] = v;
      }
      fields.organization_id = (parsed as Record<string, unknown>).organizationId;
      const { data, error } = await sb.from(table).insert(fields).select().single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: fields.organization_id as string,
        actorUserId: req.authUser!.userId,
        action: `${path}.created`,
        entityType: path,
        entityId: data.id,
      });
      res.status(201).json(success(data));
    } catch (e) {
      next(e);
    }
  });
  router.patch(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        if (v !== undefined) fields[snake(k)] = v;
      }
      const { data, error } = await sb
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Not found", 404);
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${path}.updated`,
        entityType: path,
        entityId: data.id,
      });
      res.json(success(data));
    } catch (e) {
      next(e);
    }
  });

  router.delete(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const { error } = await sb
        .from(table)
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${path}.deleted`,
        entityType: path,
        entityId: String(req.params.id),
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
}

crudRoute("isp", "isp_assessments", createISPSchema as unknown as Record<string, unknown>);

router.post("/isp/:id/score", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        monthlyCost: z.number().min(0),
        contractLength: z.number().int().min(1),
      })
      .parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data: current, error: fetchError } = await supabase
      .from("isp_assessments")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Not found", 404);
    const consolidationScore = Math.max(
      0,
      Math.min(100, 100 - (parsed.monthlyCost * parsed.contractLength) / 100),
    );
    const recommendation =
      consolidationScore > 70
        ? "Renegotiate contract"
        : consolidationScore > 40
          ? "Explore alternative providers"
          : "Current terms acceptable";
    const { data, error } = await supabase
      .from("isp_assessments")
      .update({
        monthly_cost: parsed.monthlyCost,
        contract_length_months: parsed.contractLength,
        consolidation_score: consolidationScore,
        recommendation,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

crudRoute("unifi", "unifi_surveys", createUnifiSchema as unknown as Record<string, unknown>);

router.post("/unifi/:id/plan", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        squareFootage: z.number().int().min(100),
        floors: z.number().int().min(1).max(10),
        userCount: z.number().int().min(1),
      })
      .parse(req.body);
    const supabase = getSupabaseAdmin();
    const apCount = Math.max(1, Math.ceil((parsed.squareFootage / 2000) * parsed.floors));
    const switchCount = Math.max(1, Math.ceil(apCount / 24));
    const estimatedCost = apCount * 150 + switchCount * 500;
    const { data, error } = await supabase
      .from("unifi_surveys")
      .update({ ap_count: apCount, switch_count: switchCount, estimated_cost: estimatedCost })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ ...data, apCount, switchCount, estimatedCost }));
  } catch (err) {
    next(err);
  }
});
crudRoute("port-maps", "port_maps", createPortMapSchema as unknown as Record<string, unknown>);
crudRoute(
  "camera-calc",
  "camera_calculations",
  createCameraSchema as unknown as Record<string, unknown>,
);

router.post("/camera-calc/calculate", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        organizationId: z.string().min(1),
        cameraCount: z.number().int().min(1),
        bitrateMbps: z.number().min(0.1).max(1000).default(4),
        resolution: z.string().default("1080p"),
        retentionDays: z.number().int().min(1).max(365),
        fps: z.number().int().min(1).max(60).default(15),
      })
      .parse(req.body);

    const dailyStorageGB =
      (parsed.cameraCount * parsed.bitrateMbps * parsed.retentionDays * 86400) / 8 / 1024;
    const totalStorageTB = dailyStorageGB / 1024;
    const recommendedNVR =
      totalStorageTB > 10 ? "Enterprise" : totalStorageTB > 2 ? "Business" : "Standard";

    res.json(
      success({
        dailyStorageGB: Math.round(dailyStorageGB * 100) / 100,
        totalStorageTB: Math.round(totalStorageTB * 100) / 100,
        recommendedNVR,
        cameraCount: parsed.cameraCount,
        retentionDays: parsed.retentionDays,
        bitrateMbps: parsed.bitrateMbps,
      }),
    );
  } catch (err) {
    next(err);
  }
});
crudRoute("staging", "hardware_staging", createStagingSchema as unknown as Record<string, unknown>);

router.post("/staging/:id/checklist", async (req, res, next) => {
  try {
    const parsed = z
      .object({ itemName: z.string().min(1), completed: z.boolean() })
      .parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data: current, error: fetchError } = await supabase
      .from("hardware_staging")
      .select("checklist_items, completed_items")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Not found", 404);
    const items: string[] = current.checklist_items || [];
    const completed: string[] = current.completed_items || [];
    const updatedItems = parsed.completed ? [...new Set([...items, parsed.itemName])] : items;
    const updatedCompleted = parsed.completed
      ? [...new Set([...completed, parsed.itemName])]
      : completed.filter((i: string) => i !== parsed.itemName);
    const { data, error } = await supabase
      .from("hardware_staging")
      .update({ checklist_items: updatedItems, completed_items: updatedCompleted })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
crudRoute(
  "network-diagrams",
  "network_diagrams",
  createNetworkDiagramSchema as unknown as Record<string, unknown>,
);

export default router;
