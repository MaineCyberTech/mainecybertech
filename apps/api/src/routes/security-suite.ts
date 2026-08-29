import { Router } from "express";
import { z } from "zod";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { loadOwned } from "../lib/tenant";
import {
  createM365Schema,
  createIncidentSchema,
  createIdVerifySchema,
  createEndpointSchema,
} from "../validators/security-suite";

type EndpointSecurity = {
  total_endpoints?: number | null;
  av_installed?: boolean | null;
  disk_encrypted?: boolean | null;
  mdm_enrolled?: boolean | null;
};

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

function snake(s: string) {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function crudRoute(path: string, table: string, createSchema: Record<string, unknown>) {
  router.get(`/${path}`, async (req, res, next) => {
    try {
      const sb = getScopedClient(req, "security-suite", "read");
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
      const sb = getScopedClient(req, "security-suite", "read");
      const data = await loadOwned(req, sb as any, table, req.params.id);
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
      const sb = getScopedClient(req, "security-suite", "write");
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
      const sb = getScopedClient(req, "security-suite", "write");
      const current = await loadOwned(req, sb as any, table, req.params.id, "id, organization_id");
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        if (v !== undefined) fields[snake(k)] = v;
      }
      const { data, error } = await sb
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .eq("organization_id", current.organization_id as string)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Not found", 404);
      await logAuditEvent({
        organizationId: current.organization_id as string,
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
      const sb = getScopedClient(req, "security-suite", "write");
      const current = await loadOwned(req, sb as any, table, req.params.id, "id, organization_id");
      const { error } = await sb
        .from(table)
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", current.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: current.organization_id as string,
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
  "m365-hardening",
  "m365_hardening",
  createM365Schema as unknown as Record<string, unknown>,
);
crudRoute(
  "incidents",
  "incident_responses",
  createIncidentSchema as unknown as Record<string, unknown>,
);
crudRoute(
  "identity-verification",
  "identity_verifications",
  createIdVerifySchema as unknown as Record<string, unknown>,
);
router.post("/identity-verification/:id/verify", async (req, res, next) => {
  try {
    const parsed = z
      .object({ verificationPass: z.boolean(), notes: z.string().optional() })
      .parse(req.body);
    const supabase = getScopedClient(req, "security-suite", "write");
    await loadOwned(req, supabase as any, "identity_verifications", String(req.params.id));
    const { data, error } = await supabase
      .from("identity_verifications")
      .update({
        verification_pass: parsed.verificationPass,
        verified_at: new Date().toISOString(),
        verified_by: req.authUser!.userId,
        notes: parsed.notes,
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
router.get("/endpoint-security/coverage", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "security-suite", "read");
    const { data, error } = await supabase
      .from("endpoint_security")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = (data ?? []) as EndpointSecurity[];
    const totalEndpoints = items.reduce((s: number, e) => s + (e.total_endpoints || 0), 0);
    const avCoverage =
      totalEndpoints > 0
        ? Math.round(
            (items
              .filter((e) => e.av_installed)
              .reduce((s: number, e) => s + (e.total_endpoints || 0), 0) /
              totalEndpoints) *
              100,
          )
        : 0;
    const encryptionCoverage =
      totalEndpoints > 0
        ? Math.round(
            (items
              .filter((e) => e.disk_encrypted)
              .reduce((s: number, e) => s + (e.total_endpoints || 0), 0) /
              totalEndpoints) *
              100,
          )
        : 0;
    const mdmCoverage =
      totalEndpoints > 0
        ? Math.round(
            (items
              .filter((e) => e.mdm_enrolled)
              .reduce((s: number, e) => s + (e.total_endpoints || 0), 0) /
              totalEndpoints) *
              100,
          )
        : 0;
    res.json(
      success({
        totalEndpoints,
        avCoverage,
        encryptionCoverage,
        mdmCoverage,
        overallCoverage: Math.round((avCoverage + encryptionCoverage + mdmCoverage) / 3),
      }),
    );
  } catch (err) {
    next(err);
  }
});

crudRoute(
  "endpoint-security",
  "endpoint_security",
  createEndpointSchema as unknown as Record<string, unknown>,
);

router.post("/m365-hardening/:id/scan", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "security-suite", "write");
    await loadOwned(req, supabase as any, "m365_hardening", String(req.params.id));
    const { data: current, error: fetchError } = await supabase
      .from("m365_hardening")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Not found", 404);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("m365_hardening")
      .update({
        last_scanned_at: now,
        scan_status: "completed",
        next_scan_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ ...data, scannedAt: now }));
  } catch (err) {
    next(err);
  }
});

export default router;
