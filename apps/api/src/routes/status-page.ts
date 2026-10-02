import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { queryInt } from "../lib/query";

const router: ReturnType<typeof Router> = Router();

// --- Public status page (unauthenticated) --------------------------------
// This endpoint is an intended product feature (see
// docs/features/public-status-page.md and docs/API_ENDPOINT_INVENTORY.md): the
// public web route apps/web/app/(public)/status/[orgId]/page.tsx and the SDK
// (`statusPage.publicStatus`) consume it, and the docs list it as
// "Anyone (unauth, by org id)". Tenant data is never served without a purpose,
// but a status page is deliberately world-readable. The underlying tables are
// service-role only (RLS is org-members-only), so the projection below is an
// explicit ALLOWLIST of public fields: internal identifiers (`organization_id`)
// and audit attribution (`created_by`, an auth.users UUID) are NOT exposed.
//
// Enumeration: a caller who knows/guesses an organization UUID can read that
// org's published status. The UUIDs are opaque (not sequential) and the exposed
// fields are non-sensitive operational status, so this matches the documented
// feature. There is currently NO explicit `enabled`/`is_public` flag on
// `organizations` or on the status_* tables; the public view is always on for
// every org. Gating it on an opt-in flag would require a schema migration (sql
// under supabase/ is owned elsewhere) and a product decision, so it is reported
// as an open follow-up rather than changed here. This route is therefore left
// public; only the field surface is tightened.
const PUBLIC_COMPONENT_COLUMNS =
  "id, name, description, component_type, status, display_order, created_at, updated_at";
const PUBLIC_INCIDENT_COLUMNS =
  "id, title, description, severity, status, affected_component_ids, started_at, resolved_at, created_at, updated_at";
const PUBLIC_MAINTENANCE_COLUMNS =
  "id, title, description, scheduled_start, scheduled_end, status, affected_component_ids, created_at, updated_at";

router.get("/public/:orgId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const [compRes, incRes, maintRes] = await Promise.all([
      supabase
        .from("status_components")
        .select(PUBLIC_COMPONENT_COLUMNS)
        .eq("organization_id", String(req.params.orgId))
        .order("display_order"),
      supabase
        .from("status_incidents")
        .select(PUBLIC_INCIDENT_COLUMNS)
        .eq("organization_id", String(req.params.orgId))
        .neq("status", "resolved")
        .order("started_at", { ascending: false }),
      supabase
        .from("maintenance_notices")
        .select(PUBLIC_MAINTENANCE_COLUMNS)
        .eq("organization_id", String(req.params.orgId))
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
  createSchema: z.ZodType,
  updateSchema: z.ZodType,
) {
  router.get(`/${resource}`, async (req, res, next) => {
    try {
      const supabase = getScopedClient(req, "status-page", "read");
      const page = Math.max(1, queryInt(req.query.page, 1));
      const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 25)));
      const offset = (page - 1) * limit;
      const q = supabase
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
      const supabase = getScopedClient(req, "status-page", "read");
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", String(req.params.id))
        .eq("organization_id", req.query.organization_id as string)
        .single();
      if (error || !data) throw new AppError("NOT_FOUND", `${resource} not found`, 404);
      res.json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.post(
    `/${resource}`,
    requirePermission("status-pages", "create"),
    async (req, res, next) => {
      try {
        const parsed = createSchema.parse(req.body);
        const supabase = getScopedClient(req, "status-page", "write");
        const fields: Record<string, unknown> = {
          organization_id: parsed.organizationId,
          created_by: req.authUser!.userId,
        };
        for (const [k, v] of Object.entries(parsed)) {
          if (k === "organizationId") continue;
          if (v !== undefined && v !== null) fields[snakeCase(k)] = v;
        }
        const { data, error } = await supabase
          .from(table)
          .insert(fields as never)
          .select()
          .single();
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        await logAuditEvent({
          organizationId: parsed.organizationId,
          actorUserId: req.authUser!.userId,
          action: `${resource}.created`,
          entityType: resource,
          entityId: (data as { id: string } | null)?.id,
        });
        res.status(201).json(success(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    `/${resource}/:id`,
    requirePermission("status-pages", "edit"),
    async (req, res, next) => {
      try {
        const parsed = updateSchema.parse(req.body);
        const supabase = getScopedClient(req, "status-page", "write");
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined) fields[snakeCase(k)] = v;
        }
        const { data, error } = await supabase
          .from(table)
          .update(fields as never)
          .eq("id", String(req.params.id))
          .eq("organization_id", req.query.organization_id as string)
          .select()
          .single();
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        res.json(success(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    `/${resource}/:id`,
    requirePermission("status-pages", "delete"),
    async (req, res, next) => {
      try {
        const supabase = getScopedClient(req, "status-page", "write");
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", String(req.params.id))
          .eq("organization_id", req.query.organization_id as string);
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );
}

crudTable("components", "status_components", compCreateSchema, compUpdateSchema);
crudTable("incidents", "status_incidents", incCreateSchema, incCreateSchema.partial());
crudTable("maintenance", "maintenance_notices", maintCreateSchema, maintCreateSchema.partial());

export default router;
