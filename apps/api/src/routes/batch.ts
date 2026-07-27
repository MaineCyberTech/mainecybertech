import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createLicenseSchema,
  createStatusItemSchema,
  createWebsiteMonitorSchema,
  createDmarcAssessmentSchema,
} from "../validators/batch";
const router: ReturnType<typeof Router> = Router();

router.get("/status/public", async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("status_items")
      .select("*")
      .eq("is_public", true)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (e) {
    next(e);
  }
});

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

  router.get(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from(table)
        .select("*")
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .single();
      if (error || !data) throw new AppError("NOT_FOUND", "Record not found", 404);
      res.json(success(data));
    } catch (e) {
      next(e);
    }
  });

  router.patch(`/${path}/:id`, async (req, res, next) => {
    try {
      const parsed = (createSchema as { parse: (b: unknown) => Record<string, unknown> }).parse(
        req.body,
      );
      const sb = getSupabaseAdmin();
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k !== "organizationId") fields[snake(k)] = v;
      }
      const { data, error } = await sb
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: req.query.organization_id as string,
        actorUserId: req.authUser!.userId,
        action: `${path}.updated`,
        entityType: path,
        entityId: String(req.params.id),
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
        organizationId: req.query.organization_id as string,
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

crudRoute(
  "licenses",
  "license_tracking",
  createLicenseSchema as unknown as Record<string, unknown>,
);
crudRoute("status", "status_items", createStatusItemSchema as unknown as Record<string, unknown>);
crudRoute(
  "website-monitors",
  "website_monitors",
  createWebsiteMonitorSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "dmarc",
  "dmarc_assessments",
  createDmarcAssessmentSchema as unknown as Record<string, unknown>,
);

router.get("/licenses/savings", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const q = sb
      .from("license_tracking")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    const { data, error } = await q;
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items =
      data ??
      ([] as Array<{
        reclaimable_savings: number | null;
        annual_cost: number | null;
        total_seats: number;
        assigned_seats: number;
      }>);
    const totalSavings = items.reduce((sum, l) => sum + (l.reclaimable_savings ?? 0), 0);
    const totalCost = items.reduce((sum, l) => sum + (l.annual_cost ?? 0), 0);
    const unusedSeats = items.reduce(
      (sum, l) => sum + Math.max(0, l.total_seats - l.assigned_seats),
      0,
    );
    res.json(
      success({
        totalLicenses: items.length,
        totalAnnualCost: totalCost,
        reclaimableSavings: totalSavings,
        unusedSeats,
      }),
    );
  } catch (e) {
    next(e);
  }
});

export default router;
