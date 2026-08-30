import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeProcurementCompare } from "./stats-helpers";

export function registerProcurementRoutes(router: Router) {
  router.post("/procurement/compare", async (req, res, next) => {
    try {
      const parsed = z.object({ quoteIds: z.array(z.string()).min(2).max(10) }).parse(req.body);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("procurement_quotes")
        .select("*")
        .in("id", parsed.quoteIds)
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(computeProcurementCompare(data ?? [])));
    } catch (err) {
      next(err);
    }
  });
}
