import { Router } from "express";
import { success } from "../types";
import { getSupabaseAdmin } from "../services/supabase";

const router: ReturnType<typeof Router> = Router();

router.get("/", async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};
  let healthy = true;

  const dbStart = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("roles").select("id", { count: "exact", head: true });
    checks.database = {
      status: error ? "unhealthy" : "healthy",
      latencyMs: Date.now() - dbStart,
    };
    if (error) healthy = false;
  } catch {
    checks.database = { status: "unhealthy", latencyMs: Date.now() - dbStart };
    healthy = false;
  }

  const status = healthy ? 200 : 503;
  res.status(status).json(
    success({
      service: "api",
      status: healthy ? "healthy" : "degraded",
      checks,
      uptime: process.uptime(),
    }),
  );
});

export default router;
