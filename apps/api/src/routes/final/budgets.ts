import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { requirePermission } from "../../middleware/permissions";
import { computeBudgetAnalysis } from "./stats-helpers";

export function registerBudgetRoutes(router: Router) {
  // ACM-P3-008 / SEC-P3-013: module reads require the catalog's view grant.
  router.get(
    "/budgets/analysis",
    requirePermission("budgets", "view"),
    async (req, res, next) => {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from("budget_roadmaps")
          .select("*")
          .eq("organization_id", req.query.organization_id as string);
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        res.json(success(computeBudgetAnalysis(data ?? [])));
      } catch (err) {
        next(err);
      }
    },
  );
}
