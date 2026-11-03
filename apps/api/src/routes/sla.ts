import { Router } from "express";
import { getScopedClient } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { responseCacheNoRenew } from "../middleware/cache";
import { LIST_HARD_CAP } from "../lib/pagination";
import { AppError, success } from "../types";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

// GET /api/v1/sla/metrics — SLA dashboard data
// ACM-P3-008 / SEC-P3-013: reads the module's rows, so it carries the
// catalog's sla:view gate rather than only org membership.
router.get(
  "/metrics",
  requirePermission("sla", "view"),
  responseCacheNoRenew(60),
  async (req, res, next) => {
    try {
      const supabase = getScopedClient(req, "sla", "read");
      const orgId = req.query.organization_id as string | undefined;
      const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString();

      // PERF-P3-005: a 90-day window can hold tens of thousands of rows. Read
      // only the columns the summary needs and cap the scan; fetch one extra
      // row so we can report truncation without a separate COUNT(*) walk.
      let query = supabase
        .from("sla_logs")
        .select("metric, breached, resolved_at, actual_minutes, created_at, id, organization_id")
        .gte("created_at", since);

      if (orgId) query = query.eq("organization_id", orgId);

      const { data: fetched, error } = await query
        .order("created_at", { ascending: false })
        .limit(LIST_HARD_CAP + 1);

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      const truncated = (fetched?.length ?? 0) > LIST_HARD_CAP;
      const logs = truncated ? fetched!.slice(0, LIST_HARD_CAP) : (fetched ?? []);
      const total = logs.length;
      const breached = logs.filter((l: { breached: boolean | null }) => l.breached).length;
      const resolved = logs.filter((l: { resolved_at: string | null }) => l.resolved_at).length;

      // Per-metric breakdown
      const byMetric: Record<string, { total: number; breached: number; avgMinutes: number }> = {};
      for (const log of logs) {
        const m = log.metric;
        if (!byMetric[m]) byMetric[m] = { total: 0, breached: 0, avgMinutes: 0 };
        byMetric[m].total++;
        if (log.breached) byMetric[m].breached++;
        if (log.actual_minutes) {
          byMetric[m].avgMinutes =
            (byMetric[m].avgMinutes * (byMetric[m].total - 1) + log.actual_minutes) /
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
          recent: logs.slice(0, 20),
          truncated,
          // Summary/byMetric cover at most LIST_HARD_CAP rows when truncated.
          covered: total,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

export default router;
