import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createVendorContractSchema,
  updateVendorContractSchema,
  createVendorContactSchema,
  updateVendorContactSchema,
} from "../validators/vendors";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

function crudEndpoints(
  resource: string,
  table: string,
  createSchema: typeof createVendorContractSchema,
  updateSchema: typeof updateVendorContractSchema,
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
        .eq("organization_id", req.query.organization_id as string);
      const status = req.query.status as string | undefined;
      if (status) q = q.eq("status", status);
      const search = req.query.search as string | undefined;
      if (search)
        q = q.ilike(table === "vendor_contracts" ? "vendor_name" : "vendor_name", `%${search}%`);

      const { data, error, count } = await q
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(
        success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
      );
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
        .eq("organization_id", req.query.organization_id as string)
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
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        fields[snakeCase(k)] = v;
      }
      fields.organization_id = (parsed as Record<string, unknown>).organizationId;
      fields.created_by = req.authUser!.userId;

      const { data, error } = await supabase.from(table).insert(fields).select().single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        organizationId: fields.organization_id as string,
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
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        if (v !== undefined) fields[snakeCase(k)] = v;
      }

      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", `${resource} not found`, 404);

      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${resource}.updated`,
        entityType: resource,
        entityId: data.id,
        metadata: parsed as Record<string, unknown>,
      });
      res.json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.delete(`/${resource}/:id`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${resource}.deleted`,
        entityType: resource,
        entityId: String(req.params.id),
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

crudEndpoints(
  "vendor-contracts",
  "vendor_contracts",
  createVendorContractSchema as unknown as typeof createVendorContractSchema,
  updateVendorContractSchema as unknown as typeof updateVendorContractSchema,
);
crudEndpoints(
  "vendor-contacts",
  "vendor_contacts",
  createVendorContactSchema as unknown as typeof createVendorContractSchema,
  updateVendorContactSchema as unknown as typeof updateVendorContractSchema,
);

router.get("/vendor-contracts/renewals", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const ninetyDays = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    let q = supabase
      .from("vendor_contracts")
      .select("*")
      .lte("renewal_date", ninetyDays)
      .gte("renewal_date", new Date().toISOString().slice(0, 10))
      .eq("status", "active")
      .order("renewal_date", { ascending: true });
    q = q.eq("organization_id", req.query.organization_id as string);
    const { data, error } = await q;
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: (data ?? []).length }));
  } catch (err) {
    next(err);
  }
});

export default router;
