import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router = Router();

router.get("/public/:orgId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const [compRes, incRes, maintRes] = await Promise.all([
      supabase
        .from("status_components")
        .select("*")
        .eq("organization_id", req.params.orgId)
        .order("display_order"),
      supabase
        .from("status_incidents")
        .select("*")
        .eq("organization_id", req.params.orgId)
        .neq("status", "resolved")
        .order("started_at", { ascending: false }),
      supabase
        .from("maintenance_notices")
        .select("*")
        .eq("organization_id", req.params.orgId)
        .gte("scheduled_start", new Date().toISOString())
        .order("scheduled_start"),
    ]);
    res.json(
      success({
        components: compRes.data ?? [],
        activeIncidents: incRes.data ?? [],
        upcomingMaintenance: maintRes.data ?? [],
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth);
router.use(requireOrgAccess);

const compCreateSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  componentType: z.string().default("service"),
  status: z.string().default("operational"),
  displayOrder: z.number().int().default(0),
});

const compUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  componentType: z.string().optional(),
  status: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

const incCreateSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  severity: z.string().default("minor"),
  status: z.string().default("investigating"),
  affectedComponentIds: z.array(z.string()).default([]),
});

const maintCreateSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
  affectedComponentIds: z.array(z.string()).default([]),
});

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function crudTable(
  resource: string,
  table: string,
  createSchema: z.ZodObject<any>,
  updateSchema: z.ZodObject<any>,
) {
  router.get(`/${resource}`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
      const offset = (page - 1) * limit;
      let q = supabase
        .from(table)
        .select("*", { count: "exact" })
        .eq("organization_id", req.query.organization_id as string)
        .order("created_at", { ascending: false });
      const { data, error, count } = await q.range(offset, offset + limit - 1);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
    } catch (err) {
      next(err);
    }
  });

  router.get(`/${resource}/:id`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", req.params.id)
        .single();
      if (error || !data) throw new AppError("NOT_FOUND", `${resource} not found`, 404);
      res.json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.post(`/${resource}`, async (req, res, next) => {
    try {
      const parsed = createSchema.parse(req.body);
      const supabase = getSupabaseAdmin();
      const fields: Record<string, unknown> = {
        organization_id: parsed.organizationId,
        created_by: req.authUser!.userId,
      };
      for (const [k, v] of Object.entries(parsed)) {
        if (k === "organizationId") continue;
        if (v !== undefined && v !== null) fields[snakeCase(k)] = v;
      }
      const { data, error } = await supabase.from(table).insert(fields).select().single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: parsed.organizationId,
        actorUserId: req.authUser!.userId,
        action: `${resource}.created`,
        entityType: resource,
        entityId: data.id,
      });
      res.status(201).json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.patch(`/${resource}/:id`, async (req, res, next) => {
    try {
      const parsed = updateSchema.parse(req.body);
      const supabase = getSupabaseAdmin();
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined) fields[snakeCase(k)] = v;
      }
      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.delete(`/${resource}/:id`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from(table).delete().eq("id", req.params.id);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}

crudTable("components", "status_components", compCreateSchema, compUpdateSchema);
crudTable("incidents", "status_incidents", incCreateSchema, incCreateSchema.partial() as any);
crudTable(
  "maintenance",
  "maintenance_notices",
  maintCreateSchema,
  maintCreateSchema.partial() as any,
);

export default router;
