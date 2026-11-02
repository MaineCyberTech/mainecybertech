import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { requirePermission } from "../../middleware/permissions";
import { computeSharepointSummary } from "./stats-helpers";

export function registerSharepointRoutes(router: Router) {
  // ACM-P3-008 / SEC-P3-013: module reads require the catalog's view grant.
  router.get(
    "/sharepoint/structure-summary",
    requirePermission("sharepoint", "view"),
    async (req, res, next) => {
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
    },
  );
}
