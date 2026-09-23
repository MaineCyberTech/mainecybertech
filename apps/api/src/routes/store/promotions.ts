import { Router } from "express";
import { z, ZodError } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { AppError, success, failure } from "../../types";
import { logAuditEvent } from "../../services/audit";
import { type UpdateRow } from "../../lib/db-types";

/** Store promotions (public reads + admin CRUD). Extracted from `routes/store.ts` (same pattern as `routes/final/`). */
export function registerPromotionRoutes(router: Router) {
  const createPromotionSchema = z.object({
    name: z.string().min(1).max(200),
    badgeText: z.string().max(200).default(""),
    detailText: z.string().max(2000).default(""),
    promoType: z.string().default("bundle_savings"),
    status: z.enum(["active", "paused", "expired", "archived"]).default("paused"),
    terms: z.string().max(5000).default(""),
    eligibilityTargets: z.array(z.string()).default([]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });

  const updatePromotionSchema = createPromotionSchema.partial();

  // GET /api/v1/store/promotions - list active promotions (public)
  router.get("/promotions", async (_req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_promotions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(data ?? []));
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/store/promotions/active alias (public)
  router.get("/promotions/active", async (_req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_promotions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(data ?? []));
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/store/promotions/admin - list all promotions (admin)
  router.get("/promotions/admin", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(data ?? []));
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/store/promotions - create a promotion (admin)
  router.post("/promotions", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = createPromotionSchema.parse(req.body);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_promotions")
        .insert({
          name: parsed.name,
          badge_text: parsed.badgeText,
          detail_text: parsed.detailText,
          promo_type: parsed.promoType,
          status: parsed.status,
          terms: parsed.terms,
          eligibility_targets: parsed.eligibilityTargets,
          start_date: parsed.startDate || null,
          end_date: parsed.endDate || null,
        })
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        action: "store.promotion.create",
        entityType: "store_promotion",
        entityId: data.id,
        metadata: { name: parsed.name },
      });

      res.status(201).json(success(data));
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

  // PATCH /api/v1/store/promotions/:id - update a promotion (admin)
  router.patch("/promotions/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = updatePromotionSchema.parse(req.body);
      const supabase = getSupabaseAdmin();

      const updates: UpdateRow<"store_promotions"> = {};
      if (parsed.name !== undefined) updates.name = parsed.name;
      if (parsed.badgeText !== undefined) updates.badge_text = parsed.badgeText;
      if (parsed.detailText !== undefined) updates.detail_text = parsed.detailText;
      if (parsed.promoType !== undefined) updates.promo_type = parsed.promoType;
      if (parsed.status !== undefined) updates.status = parsed.status;
      if (parsed.terms !== undefined) updates.terms = parsed.terms;
      if (parsed.eligibilityTargets !== undefined)
        updates.eligibility_targets = parsed.eligibilityTargets;
      if (parsed.startDate !== undefined) updates.start_date = parsed.startDate || null;
      if (parsed.endDate !== undefined) updates.end_date = parsed.endDate || null;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("store_promotions")
        .update(updates)
        .eq("id", String(req.params.id))
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Promotion not found", 404);

      res.json(success(data));
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

  // DELETE /api/v1/store/promotions/:id - delete a promotion (admin)
  router.delete("/promotions/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("store_promotions")
        .delete()
        .eq("id", String(req.params.id));

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        action: "store.promotion.delete",
        entityType: "store_promotion",
        entityId: String(String(req.params.id)) as string,
      });

      res.json(success({ deleted: true }));
    } catch (error) {
      next(error);
    }
  });
}
