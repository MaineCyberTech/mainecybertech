import { z } from "zod";
import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  sop,
  compliance,
  insurance,
  aiPolicy,
  kb,
  training,
  phishing,
  scorecard,
  automation,
  ps,
  kbGen,
} from "../validators/edu-automation";

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
  router.patch(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const f: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        if (v !== undefined) f[snake(k)] = v;
      }
      const { data, error } = await sb
        .from(table)
        .update(f)
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

  router.delete(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const { error } = await sb.from(table).delete().eq("id", req.params.id);
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

type SchemaMap = Record<string, { schema: z.ZodTypeAny; table: string }>;
const schemas: SchemaMap = {
  sop: { schema: sop, table: "sop_library" },
  compliance: { schema: compliance, table: "compliance_readiness" },
  insurance: { schema: insurance, table: "insurance_evidence" },
  "ai-policy": { schema: aiPolicy, table: "ai_policies" },
  kb: { schema: kb, table: "knowledge_articles" },
  training: { schema: training, table: "training_modules" },
  phishing: { schema: phishing, table: "phishing_campaigns" },
  scorecards: { schema: scorecard, table: "cyber_scorecards" },
  automation: { schema: automation, table: "automation_workflows" },
  powershell: { schema: ps, table: "powershell_scripts" },
  "kb-generator": { schema: kbGen, table: "kb_article_generations" },
};

for (const [path, { schema: s, table }] of Object.entries(schemas)) {
  crud(path, table, s);
}

export default router;
