import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeSharepointSummary } from "./stats-helpers";

export function registerSharepointRoutes(router: Router) {
  router.get("/sharepoint/structure-summary", async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("sharepoint_plans")
        .select("*")
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(computeSharepointSummary(data ?? [])));
    } catch (err) {
      next(err);
    }
  });
}
