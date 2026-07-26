import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createChangeSchema,
  createRiskSchema,
  createRetentionSchema,
  createTabletopSchema,
} from "../validators/governance";

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
      let q = sb.from(table).select("*", { count: "exact" });
      const orgId = req.query.organization_id as string | undefined;
      if (orgId) q = q.eq("organization_id", orgId);
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
      const { data, error } = await sb.from(table).select("*").eq("id", req.params.id).single();
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
}

crudRoute(
  "change-requests",
  "change_requests",
  createChangeSchema as unknown as Record<string, unknown>,
);
crudRoute("risks", "risk_register", createRiskSchema as unknown as Record<string, unknown>);
crudRoute(
  "retention",
  "retention_policies",
  createRetentionSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "tabletop",
  "tabletop_exercises",
  createTabletopSchema as unknown as Record<string, unknown>,
);

export default router;
