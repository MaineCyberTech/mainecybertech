import { z } from "zod";
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
  createSopSchema,
  updateSopSchema,
} from "../validators/governance";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

function snake(s: string) {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function crudRoute(
  path: string,
  table: string,
  createSchema: Record<string, unknown>,
  updateSchema?: Record<string, unknown>,
) {
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
      let body: Record<string, unknown> = req.body as Record<string, unknown>;
      if (updateSchema) {
        body = (updateSchema as { parse: (b: unknown) => Record<string, unknown> }).parse(
          req.body,
        ) as Record<string, unknown>;
      }
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(body)) {
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
  "change-requests",
  "change_requests",
  createChangeSchema as unknown as Record<string, unknown>,
);

router.post("/change-requests/:id/submit", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("change_requests")
      .update({ status: "pending_review", submitted_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (data) {
      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: req.authUser!.userId,
        action: "change_request.submitted",
        entityType: "change_request",
        entityId: data.id,
      });
    }
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/change-requests/:id/approve", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("change_requests")
      .update({
        status: "approved",
        approved_by: req.authUser!.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("status", "pending_review")
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (data) {
      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: req.authUser!.userId,
        action: "change_request.approved",
        entityType: "change_request",
        entityId: data.id,
      });
    }
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/change-requests/:id/reject", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("change_requests")
      .update({ status: "rejected" })
      .eq("id", req.params.id)
      .eq("status", "pending_review")
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (data) {
      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: req.authUser!.userId,
        action: "change_request.rejected",
        entityType: "change_request",
        entityId: data.id,
      });
    }
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/change-requests/:id/implement", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("change_requests")
      .update({ status: "implemented", implemented_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("status", "approved")
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (data) {
      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: req.authUser!.userId,
        action: "change_request.implemented",
        entityType: "change_request",
        entityId: data.id,
      });
    }
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/change-requests/:id/verify", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("change_requests")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("status", "implemented")
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (data) {
      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: req.authUser!.userId,
        action: "change_request.verified",
        entityType: "change_request",
        entityId: data.id,
      });
    }
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
crudRoute("risks", "risk_register", createRiskSchema as unknown as Record<string, unknown>);

router.post("/risks/:id/assess", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        likelihood: z.number().int().min(1).max(5),
        impact: z.number().int().min(1).max(5),
        mitigatingControls: z.string().optional(),
        acceptingControls: z.string().optional(),
      })
      .parse(req.body);
    const supabase = getSupabaseAdmin();
    const riskScore = parsed.likelihood * parsed.impact;
    const riskLevel =
      riskScore >= 15 ? "critical" : riskScore >= 10 ? "high" : riskScore >= 5 ? "medium" : "low";
    const { data, error } = await supabase
      .from("risk_register")
      .update({
        likelihood: parsed.likelihood,
        impact: parsed.impact,
        risk_score: riskScore,
        risk_level: riskLevel,
        mitigating_controls: parsed.mitigatingControls,
        accepting_controls: parsed.acceptingControls,
        assessed_at: new Date().toISOString(),
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

router.get("/sop-library/compliance-map", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sop_library")
      .select("compliance_framework, framework_control_ids, status")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const frameworks: Record<string, { active: number; draft: number; controlIds: string[] }> = {};
    for (const row of data ?? []) {
      const fw = row.compliance_framework || "uncategorized";
      if (!frameworks[fw]) frameworks[fw] = { active: 0, draft: 0, controlIds: [] };
      if (row.status === "active") frameworks[fw].active++;
      else frameworks[fw].draft++;
      for (const cid of row.framework_control_ids ?? []) {
        if (!frameworks[fw].controlIds.includes(cid)) frameworks[fw].controlIds.push(cid);
      }
    }
    res.json(success({ frameworks, totalSops: (data ?? []).length }));
  } catch (err) {
    next(err);
  }
});

router.get("/sop-library/framework-gaps", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sop_library")
      .select("compliance_framework, framework_control_ids, status")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const frameworks = [
      "NIST 800-53",
      "ISO 27001",
      "CIS Controls",
      "HIPAA",
      "CMMC",
      "PCI DSS",
      "SOC 2",
    ];
    const coverage = frameworks.map((fw) => {
      const sops = (data ?? []).filter((s: any) => s.compliance_framework === fw);
      const active = sops.filter((s: any) => s.status === "active").length;
      const controlIds = [...new Set(sops.flatMap((s: any) => s.framework_control_ids ?? []))];
      return {
        framework: fw,
        totalSops: sops.length,
        activeSops: active,
        coveragePercent: active > 0 ? Math.min(100, Math.round((controlIds.length / 20) * 100)) : 0,
      };
    });
    res.json(
      success({
        frameworks: coverage,
        overallCompliance: Math.round(
          coverage.reduce((s: number, f: any) => s + f.coveragePercent, 0) / coverage.length,
        ),
      }),
    );
  } catch (err) {
    next(err);
  }
});

crudRoute(
  "sop-library",
  "sop_library",
  createSopSchema as unknown as Record<string, unknown>,
  updateSopSchema as unknown as Record<string, unknown>,
);

export default router;
