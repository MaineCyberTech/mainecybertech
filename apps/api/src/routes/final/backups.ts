import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { AppError, success } from "../../types";
import { computeBackupStats, computeBackupRisk } from "./stats-helpers";

export function registerBackupRoutes(router: Router) {
  router.get("/backups/stats", async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const q = sb
        .from("backup_status")
        .select("*")
        .eq("organization_id", req.query.organization_id as string);
      const { data, error } = await q;
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(computeBackupStats(data ?? [])));
    } catch (e) {
      next(e);
    }
  });

  router.get("/backups/risk-analysis", async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("backup_status")
        .select("*")
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(computeBackupRisk(data ?? [])));
    } catch (err) {
      next(err);
    }
  });
}
