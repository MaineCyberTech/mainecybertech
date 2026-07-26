import { z } from "zod";
import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { sp, dp, saas, quote, dns, pulse, time, budget, runbook, form } from "../validators/final";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);
function snake(s: string) {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}
function crud(path: string, table: string, schema: z.ZodTypeAny) {
  router.get(`/${path}`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const pg = Math.max(1, parseInt(req.query.page as string) || 1);
      const lm = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      let q = sb.from(table).select("*", { count: "exact" });
      const o = req.query.organization_id as string;
      if (o) q = q.eq("organization_id", o);
      const { data, error, count } = await q
        .order("created_at", { ascending: false })
        .range((pg - 1) * lm, (pg - 1) * lm + lm - 1);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(
        success({
          items: data ?? [],
          total: count ?? 0,
          page: pg,
          limit: lm,
        } as PaginatedResult<unknown>),
      );
    } catch (e) {
      next(e);
    }
  });
  router.post(`/${path}`, async (req, res, next) => {
    try {
      const p = schema.parse(req.body) as Record<string, unknown>;
      const sb = getSupabaseAdmin();
      const f: Record<string, unknown> = { created_by: req.authUser!.userId };
      for (const [k, v] of Object.entries(p)) {
        if (k !== "organizationId") f[snake(k)] = v;
      }
      f.organization_id = p.organizationId as string;
      const { data, error } = await sb.from(table).insert(f).select().single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: f.organization_id as string,
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
}

const schemas: Record<string, { schema: z.ZodTypeAny; table: string }> = {
  sharepoint: { schema: sp, table: "sharepoint_plans" },
  "device-profiles": { schema: dp, table: "device_profiles" },
  "saas-audit": { schema: saas, table: "saas_audits" },
  procurement: { schema: quote, table: "procurement_quotes" },
  "dns-changes": { schema: dns, table: "dns_change_requests" },
  satisfaction: { schema: pulse, table: "satisfaction_pulses" },
  "time-entries": { schema: time, table: "time_entries" },
  budgets: { schema: budget, table: "budget_roadmaps" },
  runbooks: { schema: runbook, table: "client_runbooks" },
  forms: { schema: form, table: "custom_forms" },
};
for (const [p, { schema: s, table }] of Object.entries(schemas)) crud(p, table, s);

export default router;
