import { Router } from "express";
import { success } from "../types";
import { getSupabaseAdminNoBreaker } from "../services/supabase";
import { getEnv, type Env } from "../config/env";
import { checkRedisHealth } from "../lib/health";

const router: ReturnType<typeof Router> = Router();

type Check = { status: string; latencyMs?: number; error?: string };

// /health is unauthenticated and, when configured, calls Stripe and JSM on
// every hit — an amplification/DoS vector and a config-disclosure oracle.
// Cache the external provider checks for a short window so repeated probes
// reuse the last result instead of fanning out.
const PROVIDER_TTL_MS = 30_000;
let externalCache: { at: number; stripe: Check; jsm: Check } | null = null;

async function fetchWithTimeout(url: string, init: RequestInit, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getExternalChecks(
  env: Env,
): Promise<{ stripe: Check; jsm: Check; healthy: boolean }> {
  if (externalCache && Date.now() - externalCache.at < PROVIDER_TTL_MS) {
    const healthy =
      externalCache.stripe.status !== "unhealthy" && externalCache.jsm.status !== "unhealthy";
    return { ...externalCache, healthy };
  }

  let stripe: Check;
  if (env.STRIPE_SECRET_KEY) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      });
      stripe = { status: res.ok ? "healthy" : "unhealthy", latencyMs: Date.now() - start };
    } catch {
      stripe = { status: "unhealthy", latencyMs: Date.now() - start };
    }
  } else {
    stripe = { status: "not_configured" };
  }

  let jsm: Check;
  if (env.JSM_DOMAIN && env.JSM_EMAIL && env.JSM_API_TOKEN) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`https://${env.JSM_DOMAIN}/rest/servicedeskapi/info`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.JSM_EMAIL}:${env.JSM_API_TOKEN}`).toString("base64")}`,
        },
      });
      jsm = { status: res.ok ? "healthy" : "unhealthy", latencyMs: Date.now() - start };
    } catch {
      jsm = { status: "unhealthy", latencyMs: Date.now() - start };
    }
  } else {
    jsm = { status: "not_configured" };
  }

  externalCache = { at: Date.now(), stripe, jsm };
  const healthy = stripe.status !== "unhealthy" && jsm.status !== "unhealthy";
  return { stripe, jsm, healthy };
}

router.get("/", async (_req, res) => {
  const checks: Record<string, Check> = {};
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
  const external = await getExternalChecks(env);
  checks.stripe = external.stripe;
  checks.jsm = external.jsm;
  if (!external.healthy) healthy = false;

  // Redis is used for the response cache + BullMQ queue. It is optional in
  // single-instance deployments (cache falls back to memory), so Redis status
  // is REPORTED but never degrades the overall health to 503 — a Redis outage
  // must not take down the deploy gate or make the API appear down.
  const redis = await checkRedisHealth(env);
  checks.redis = { status: redis.status, latencyMs: redis.latencyMs, error: redis.error };

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
