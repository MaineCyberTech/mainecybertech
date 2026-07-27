import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createOffboardingSchema,
  createBreakGlassSchema,
  createOnboardingSchema,
  createPatchSchema,
} from "../validators/security-ops";

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

  router.get(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from(table)
        .select("*")
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .single();
      if (error || !data) throw new AppError("NOT_FOUND", "Not found", 404);
      res.json(success(data));
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

crudRoute(
  "offboarding",
  "offboarding_checklists",
  createOffboardingSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "break-glass",
  "break_glass_accounts",
  createBreakGlassSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "onboarding",
  "onboarding_clients",
  createOnboardingSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "patch-compliance",
  "patch_compliance",
  createPatchSchema as unknown as Record<string, unknown>,
);

router.get("/patch-compliance/stats", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const q = sb
      .from("patch_compliance")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    const { data, error } = await q;
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    const totalDevices = items.reduce(
      (s: number, i: Record<string, number>) => s + (i.total_devices ?? 0),
      0,
    );
    const patched = items.reduce(
      (s: number, i: Record<string, number>) => s + (i.patched_devices ?? 0),
      0,
    );
    const critical = items.reduce(
      (s: number, i: Record<string, number>) => s + (i.critical_patches ?? 0),
      0,
    );
    res.json(
      success({
        totalDevices,
        patchedDevices: patched,
        criticalPatches: critical,
        groups: items.length,
        complianceRate: totalDevices > 0 ? Math.round((patched / totalDevices) * 100) : 0,
      }),
    );
  } catch (e) {
    next(e);
  }
});

export default router;
