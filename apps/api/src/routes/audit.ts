import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { sendExportResponse, CsvColumn } from "../lib/csv";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 25),
    );
    const offset = (page - 1) * limit;

    let query = supabase.from("audit_logs").select("*", { count: "exact" });

    const actorUserId = req.query.actor_user_id as string | undefined;
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

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
    const supabase = getSupabaseAdmin();

    let query = supabase.from("audit_logs").select("*");

    const actorUserId = req.query.actor_user_id as string | undefined;
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const actionFilter = req.query.action as string | undefined;
    if (actionFilter) query = query.eq("action", actionFilter);

    const entityType = req.query.entity_type as string | undefined;
    if (entityType) query = query.eq("entity_type", entityType);

    const entityId = req.query.entity_id as string | undefined;
    if (entityId) query = query.eq("entity_id", entityId);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    sendExportResponse(res, data ?? [], auditExportColumns, "audit");
  } catch (error) {
    next(error);
  }
});

export default router;
