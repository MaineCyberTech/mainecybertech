import { z } from "zod";
import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  sp,
  dp,
  saas,
  quote,
  dns,
  pulse,
  time,
  budget,
  runbook,
  form,
  backup,
} from "../validators/final";

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
      const q = sb
        .from(table)
        .select("*", { count: "exact" })
        .eq("organization_id", req.query.organization_id as string);
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
      const p = schema.parse(req.body) as Record<string, unknown>;
      const sb = getSupabaseAdmin();
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(p)) {
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
  backups: { schema: backup, table: "backup_status" },
};
for (const [p, { schema: s, table }] of Object.entries(schemas)) crud(p, table, s);

router.get("/sharepoint/structure-summary", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sharepoint_plans")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    res.json(
      success({
        totalPlans: items.length,
        plannedSites: items.filter((s: any) => s.status === "planned").length,
        activeSites: items.filter((s: any) => s.status === "active").length,
        teamsWithExternalSharing: items.filter((s: any) => s.external_sharing === "enabled").length,
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/backups/stats", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const q = sb
      .from("backup_status")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    const { data, error } = await q;
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items =
      data ??
      ([] as Array<{
        last_backup_status: string;
        restore_test_result: string | null;
        offsite_replicated: boolean;
        encryption_enabled: boolean;
      }>);
    const failed = items.filter((b) => b.last_backup_status === "failed").length;
    const untested = items.filter((b) => !b.restore_test_result).length;
    const offsite = items.filter((b) => b.offsite_replicated).length;
    const encrypted = items.filter((b) => b.encryption_enabled).length;
    res.json(
      success({ total: items.length, failed, untested, offsiteReplicated: offsite, encrypted }),
    );
  } catch (e) {
    next(e);
  }
});

router.get("/backups/risk-analysis", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("backup_status")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    const total = items.length;
    const failed = items.filter((b: any) => b.status === "failed").length;
    const untested = items.filter((b: any) => b.last_restore_test === null).length;
    const riskScore = total > 0 ? Math.round(((failed * 3 + untested * 2) / (total * 3)) * 100) : 0;
    res.json(
      success({
        total,
        failed,
        untested,
        riskScore,
        riskLevel: riskScore > 50 ? "high" : riskScore > 25 ? "medium" : "low",
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/budgets/analysis", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("budget_roadmaps")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    const totalProjected = items.reduce((s: number, b: any) => s + (b.projected || 0), 0);
    const totalActual = items.reduce((s: number, b: any) => s + (b.actual || 0), 0);
    const variance =
      totalProjected > 0 ? Math.round(((totalActual - totalProjected) / totalProjected) * 100) : 0;
    res.json(
      success({
        totalProjected,
        totalActual,
        variance,
        totalCategories: items.length,
        categories: items.map((b: any) => ({
          category: b.category,
          projected: b.projected,
          actual: b.actual,
          variance:
            b.projected > 0 ? Math.round((((b.actual || 0) - b.projected) / b.projected) * 100) : 0,
        })),
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/procurement/compare", async (req, res, next) => {
  try {
    const parsed = z.object({ quoteIds: z.array(z.string()).min(2).max(10) }).parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("procurement_quotes")
      .select("*")
      .in("id", parsed.quoteIds);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const quotes = data ?? [];
    const priced = quotes.map((q: any) => ({
      ...q,
      price: Number(q.quote_amount) || 0,
    }));
    const lowestPrice = Math.min(...priced.map((q: any) => q.price));
    const highestPrice = Math.max(...priced.map((q: any) => q.price));
    res.json(
      success({
        quotes: priced.map((q: any) => ({
          ...q,
          savings: q.price ? Math.round((1 - q.price / highestPrice) * 100) : 0,
          isLowest: q.price === lowestPrice,
        })),
        lowestPrice,
        highestPrice,
        averagePrice:
          Math.round((priced.reduce((s: number, q: any) => s + q.price, 0) / priced.length) * 100) /
          100,
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
