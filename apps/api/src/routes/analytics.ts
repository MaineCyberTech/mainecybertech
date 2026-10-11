import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError, success, failure } from "../types";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { toJson } from "../lib/db-types";

const router: ReturnType<typeof Router> = Router();

const trackSchema = z.object({
  event: z.string().min(1).max(100),
  page: z.string().max(500).optional(),
  productId: z.string().max(200).optional(),
  categoryId: z.string().max(200).optional(),
  promoId: z.string().max(200).optional(),
  quizId: z.string().max(200).optional(),
  quoteId: z.string().max(200).optional(),
  campaignId: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
  anonymousId: z.string().max(200).optional(),
});

// GET /api/v1/analytics/csrf - bootstrap the double-submit CSRF cookie for the
// public storefront tracker (AN-P2-003). The token itself is issued by
// csrfProtection on this safe request; the body is intentionally empty.
router.get("/csrf", (_req, res) => {
  res.status(204).end();
});

// POST /api/v1/analytics/track - public analytics event tracking
router.post("/track", async (req, res, next) => {
  try {
    const parsed = trackSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    // AN-P2-002: tracking events carry no PII. The caller's IP and
    // user-agent are deliberately NOT stored (the columns were dropped in
    // migration 5302441), matching docs/modules/analytics.md.
    const { error } = await supabase.from("store_analytics_events").insert({
      event: parsed.event,
      page: parsed.page || null,
      product_id: parsed.productId || null,
      category_id: parsed.categoryId || null,
      promo_id: parsed.promoId || null,
      quiz_id: parsed.quizId || null,
      quote_id: parsed.quoteId || null,
      campaign_id: parsed.campaignId || null,
      metadata: toJson(parsed.metadata || {}),
      anonymous_id: parsed.anonymousId || null,
    });

    if (error) {
      logger.warn({ err: error }, "Analytics track insert failed");
    }

    res.json(success({ ok: true }));
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
      return;
    }
    next(error);
  }
});

// GET /api/v1/analytics - list analytics events (admin)
router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/analytics/summary - aggregate event counts (admin)
router.get("/summary", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("get_analytics_summary");

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

export default router;
