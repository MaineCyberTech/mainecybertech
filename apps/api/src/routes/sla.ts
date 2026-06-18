import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew } from "../middleware/cache";
import { AppError, success } from "../types";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

// GET /api/v1/sla/metrics — SLA dashboard data
router.get("/metrics", responseCacheNoRenew(60), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    const days = Math.min(
      90,
      Math.max(1, parseInt(req.query.days as string) || 30),
    );
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let query = supabase
      .from("sla_logs")
      .select("*", { count: "exact" })
      .gte("created_at", since);

    if (orgId) query = query.eq("organization_id", orgId);

    const { data: logs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const total = logs?.length ?? 0;
    const breached = logs?.filter((l: any) => l.breached).length ?? 0;
    const resolved = logs?.filter((l: any) => l.resolved_at).length ?? 0;

    // Per-metric breakdown
    const byMetric: Record<
      string,
      { total: number; breached: number; avgMinutes: number }
    > = {};
    for (const log of logs ?? []) {
      const m = log.metric;
      if (!byMetric[m]) byMetric[m] = { total: 0, breached: 0, avgMinutes: 0 };
      byMetric[m].total++;
      if (log.breached) byMetric[m].breached++;
      if (log.actual_minutes) {
        byMetric[m].avgMinutes =
          (byMetric[m].avgMinutes * (byMetric[m].total - 1) +
            log.actual_minutes) /
          byMetric[m].total;
      }
    }

    res.json(
      success({
        summary: {
          total,
          breached,
          breachedRate: total > 0 ? Math.round((breached / total) * 100) : 0,
          resolved,
        },
        byMetric,
        recent: logs?.slice(0, 20) ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
