import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeTimeEntriesSummary } from "./stats-helpers";

// PERF-P3-001: the summary aggregates rows in memory; cap the read so a large
// worklog cannot exhaust the API container. The response flags truncation.
const TIME_ENTRY_SUMMARY_MAX_ROWS = 5000;

export function registerTimeEntryRoutes(router: Router) {
  router.get("/time-entries/summary", async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.query.organization_id as string | undefined;
      const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString();

      let query = supabase.from("time_entries").select("*").gte("work_date", since.slice(0, 10));
      if (orgId) query = query.eq("organization_id", orgId);
      const { data, error } = await query
        .order("work_date", { ascending: false })
        .limit(TIME_ENTRY_SUMMARY_MAX_ROWS);
      if (error) throw new AppError("DB_ERROR", error.message, 500);

      const rows = data ?? [];
      res.json(
        success({
          ...computeTimeEntriesSummary(rows, days),
          maxRows: TIME_ENTRY_SUMMARY_MAX_ROWS,
          truncated: rows.length >= TIME_ENTRY_SUMMARY_MAX_ROWS,
        }),
      );
    } catch (err) {
      next(err);
    }
  });
}
