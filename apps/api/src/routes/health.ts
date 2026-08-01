import { Router } from "express";
import { success } from "../types";
import { getSupabaseAdminNoBreaker } from "../services/supabase";
import { getEnv } from "../config/env";

const router: ReturnType<typeof Router> = Router();

router.get("/", async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let healthy = true;

  const dbStart = Date.now();
  try {
    const supabase = getSupabaseAdminNoBreaker();
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

  const env = getEnv();

  if (env.STRIPE_SECRET_KEY) {
    const stripeStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      checks.stripe = {
        status: res.ok ? "healthy" : "unhealthy",
        latencyMs: Date.now() - stripeStart,
      };
      if (!res.ok) healthy = false;
    } catch {
      checks.stripe = { status: "unhealthy", latencyMs: Date.now() - stripeStart };
      healthy = false;
    }
  } else {
    checks.stripe = { status: "not_configured" };
  }

  if (env.JSM_DOMAIN && env.JSM_EMAIL && env.JSM_API_TOKEN) {
    const jsmStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://${env.JSM_DOMAIN}/rest/servicedeskapi/info`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.JSM_EMAIL}:${env.JSM_API_TOKEN}`).toString("base64")}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      checks.jsm = {
        status: res.ok ? "healthy" : "unhealthy",
        latencyMs: Date.now() - jsmStart,
      };
      if (!res.ok) healthy = false;
    } catch {
      checks.jsm = { status: "unhealthy", latencyMs: Date.now() - jsmStart };
      healthy = false;
    }
  } else {
    checks.jsm = { status: "not_configured" };
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
