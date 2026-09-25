import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeTimeEntriesSummary } from "./stats-helpers";

export function registerTimeEntryRoutes(router: Router) {
  router.get("/time-entries/summary", async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.query.organization_id as string | undefined;
      const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString();

      let query = supabase.from("time_entries").select("*").gte("work_date", since.slice(0, 10));
      if (orgId) query = query.eq("organization_id", orgId);
      const { data, error } = await query.order("work_date", { ascending: false });
      if (error) throw new AppError("DB_ERROR", error.message, 500);

      res.json(success(computeTimeEntriesSummary(data ?? [], days)));
    } catch (err) {
      next(err);
    }
  });
}
