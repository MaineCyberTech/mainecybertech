import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeBudgetAnalysis } from "./stats-helpers";

export function registerBudgetRoutes(router: Router) {
  router.get("/budgets/analysis", async (req, res, next) => {
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
  });
}
