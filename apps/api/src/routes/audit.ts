import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

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

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" });

    const actorUserId = req.query.actor_user_id as string | undefined;
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const actionFilter = req.query.action as string | undefined;
    if (actionFilter) query = query.eq("action", actionFilter);

    const entityType = req.query.entity_type as string | undefined;
    if (entityType) query = query.eq("entity_type", entityType);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const format = (req.query.format as string) || "csv";

    let query = supabase.from("audit_logs").select("*");

    const actorUserId = req.query.actor_user_id as string | undefined;
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const actionFilter = req.query.action as string | undefined;
    if (actionFilter) query = query.eq("action", actionFilter);

    const entityType = req.query.entity_type as string | undefined;
    if (entityType) query = query.eq("entity_type", entityType);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const rows = data ?? [];

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="audit-export-${Date.now()}.json"`);
      res.json(rows);
      return;
    }

    const headers = ["id", "action", "entity_type", "entity_id", "organization_id", "actor_user_id", "actor_type", "metadata", "created_at"];
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const vals = headers.map((h) => {
        let v = row[h];
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      });
      csvRows.push(vals.join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-export-${Date.now()}.csv"`);
    res.send(csvRows.join("\n"));
  } catch (error) {
    next(error);
  }
});

export default router;
