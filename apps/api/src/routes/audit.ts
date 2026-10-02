import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireOrgAccess } from "../middleware/org-access";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import { queryInt } from "../lib/query";
import {
  applyOrgScope,
  applyRequestedOrg,
  resolveAdminTenantScope,
} from "../lib/admin-scope";

const router: ReturnType<typeof Router> = Router();

// requireOrgAccess resolves the caller's tenant scope; requireAdmin gates the
// admin role. The handlers below then apply a mandatory org predicate so a
// single-org admin can never read another tenant's audit trail, even with an
// explicit ?organization_id (audit MT-P1-001 / ADMIN-P1-001).
router.use(requireAuth, requireOrgAccess, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const scope = await resolveAdminTenantScope(req);
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, queryInt(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    const requestedOrg = req.query.organization_id as string | undefined;

    let query = getSupabaseAdmin().from("audit_logs").select("*", { count: "exact" });
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);

    const actionFilter = req.query.action as string | undefined;
    if (actionFilter) query = query.eq("action", actionFilter);

    const entityType = req.query.entity_type as string | undefined;
    if (entityType) query = query.eq("entity_type", entityType);

    const entityId = req.query.entity_id as string | undefined;
    if (entityId) query = query.eq("entity_id", entityId);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

const auditExportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "action" },
  { key: "entity_type" },
  { key: "entity_id" },
  { key: "organization_id" },
  { key: "actor_user_id" },
  { key: "actor_type" },
  { key: "metadata" },
  { key: "created_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const scope = await resolveAdminTenantScope(req);

    let query = getSupabaseAdmin().from("audit_logs").select("*");

    const requestedOrg = req.query.organization_id as string | undefined;
    query = applyRequestedOrg(query, "organization_id", requestedOrg, scope);
    query = applyOrgScope(query, "organization_id", scope);

    const actionFilter = req.query.action as string | undefined;
    if (actionFilter) query = query.eq("action", actionFilter);

    const entityType = req.query.entity_type as string | undefined;
    if (entityType) query = query.eq("entity_type", entityType);

    const entityId = req.query.entity_id as string | undefined;
    if (entityId) query = query.eq("entity_id", entityId);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    sendExportResponse(res, data ?? [], auditExportColumns, "audit");
  } catch (error) {
    next(error);
  }
});

export default router;
