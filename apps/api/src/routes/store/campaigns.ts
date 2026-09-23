import { Router } from "express";
import { z, ZodError } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { requireOrgAccess, assertOrgScopeMatches } from "../../middleware/org-access";
import { AppError, success, failure } from "../../types";
import { logAuditEvent } from "../../services/audit";
import { type UpdateRow } from "../../lib/db-types";
import { LIST_HARD_CAP } from "../../lib/pagination";
import { isCampaignActive, rowToCampaign, type CampaignRow } from "../../lib/store-campaigns";

/** Seasonal campaigns + truthful capacity messaging (prompt 17). Extracted from `routes/store.ts` (same pattern as `routes/final/`). */
export function registerCampaignRoutes(router: Router) {
  // --- Campaigns (prompt 17: seasonal readiness + truthful capacity) ---

  const campaignSchema = z
    .object({
      slug: z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
      name: z.string().min(1).max(200),
      audience: z.string().max(500).default(""),
      headline: z.string().max(500).default(""),
      body: z.string().max(5000).default(""),
      icon: z.string().max(100).default(""),
      accent: z.string().max(50).default(""),
      recommendedProductIds: z.array(z.string().max(200)).default([]),
      trustBadges: z.array(z.string().max(100)).default([]),
      promoEligibility: z.array(z.string().max(100)).default([]),
      status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
      startsAt: z.string().optional().nullable(),
      endsAt: z.string().optional().nullable(),
      capacityEnabled: z.boolean().default(false),
      capacityTotal: z.number().int().min(0).max(1_000_000).optional().nullable(),
      capacityRemaining: z.number().int().min(0).max(1_000_000).optional().nullable(),
      capacityLabel: z.string().max(200).default(""),
      organizationId: z.string().uuid().optional().nullable(),
    })
    .superRefine((value, ctx) => {
      // Truthful-capacity guardrail: no messaging without real numbers.
      if (value.capacityEnabled && value.capacityTotal == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capacityTotal"],
          message: "capacityTotal is required when capacity messaging is enabled",
        });
      }
      if (
        value.capacityTotal != null &&
        value.capacityRemaining != null &&
        value.capacityRemaining > value.capacityTotal
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capacityRemaining"],
          message: "capacityRemaining cannot exceed capacityTotal",
        });
      }
    });

  const updateCampaignSchema = z.object({
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case")
      .optional(),
    name: z.string().min(1).max(200).optional(),
    audience: z.string().max(500).optional(),
    headline: z.string().max(500).optional(),
    body: z.string().max(5000).optional(),
    icon: z.string().max(100).optional(),
    accent: z.string().max(50).optional(),
    recommendedProductIds: z.array(z.string().max(200)).optional(),
    trustBadges: z.array(z.string().max(100)).optional(),
    promoEligibility: z.array(z.string().max(100)).optional(),
    status: z.enum(["draft", "active", "paused", "archived"]).optional(),
    startsAt: z.string().optional().nullable(),
    endsAt: z.string().optional().nullable(),
    capacityEnabled: z.boolean().optional(),
    capacityTotal: z.number().int().min(0).max(1_000_000).optional().nullable(),
    capacityRemaining: z.number().int().min(0).max(1_000_000).optional().nullable(),
    capacityLabel: z.string().max(200).optional(),
    organizationId: z.string().uuid().optional().nullable(),
  });

  function campaignInsertPayload(parsed: z.infer<typeof campaignSchema>) {
    return {
      slug: parsed.slug,
      name: parsed.name,
      audience: parsed.audience,
      headline: parsed.headline,
      body: parsed.body,
      icon: parsed.icon,
      accent: parsed.accent,
      recommended_product_ids: parsed.recommendedProductIds,
      trust_badges: parsed.trustBadges,
      promo_eligibility: parsed.promoEligibility,
      status: parsed.status,
      starts_at: parsed.startsAt ?? null,
      ends_at: parsed.endsAt ?? null,
      capacity_enabled: parsed.capacityEnabled,
      capacity_total: parsed.capacityTotal ?? null,
      capacity_remaining: parsed.capacityRemaining ?? null,
      capacity_label: parsed.capacityLabel,
      organization_id: parsed.organizationId ?? null,
    };
  }

  // GET /api/v1/store/campaigns - list active campaigns (public)
  router.get("/campaigns", async (_req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(LIST_HARD_CAP);

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      const now = new Date();
      const campaigns = ((data ?? []) as CampaignRow[])
        .filter((row) => isCampaignActive(row, now))
        .map(rowToCampaign);
      res.json(success(campaigns));
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/store/campaigns/admin - list all campaigns (admin)
  router.get("/campaigns/admin", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("store_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIST_HARD_CAP);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(((data ?? []) as CampaignRow[]).map(rowToCampaign)));
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/store/campaigns - create a campaign (admin)
  router.post("/campaigns", requireAuth, requireAdmin, requireOrgAccess, async (req, res, next) => {
    try {
      const parsed = campaignSchema.parse(req.body);
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("store_campaigns")
        .insert(campaignInsertPayload(parsed))
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        actorUserId: req.authUser?.userId ?? null,
        action: "store.campaign.create",
        entityType: "store_campaign",
        entityId: data.id,
        metadata: { slug: parsed.slug, status: parsed.status },
      });

      res.status(201).json(success(rowToCampaign(data as CampaignRow)));
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

  // PATCH /api/v1/store/campaigns/:id - update a campaign (admin)
  router.patch(
    "/campaigns/:id",
    requireAuth,
    requireAdmin,
    requireOrgAccess,
    async (req, res, next) => {
      try {
        const parsed = updateCampaignSchema.parse(req.body);
        const supabase = getSupabaseAdmin();

        const update: Record<string, unknown> = {};
        if (parsed.slug !== undefined) update.slug = parsed.slug;
        if (parsed.name !== undefined) update.name = parsed.name;
        if (parsed.audience !== undefined) update.audience = parsed.audience;
        if (parsed.headline !== undefined) update.headline = parsed.headline;
        if (parsed.body !== undefined) update.body = parsed.body;
        if (parsed.icon !== undefined) update.icon = parsed.icon;
        if (parsed.accent !== undefined) update.accent = parsed.accent;
        if (parsed.recommendedProductIds !== undefined) {
          update.recommended_product_ids = parsed.recommendedProductIds;
        }
        if (parsed.trustBadges !== undefined) update.trust_badges = parsed.trustBadges;
        if (parsed.promoEligibility !== undefined)
          update.promo_eligibility = parsed.promoEligibility;
        if (parsed.status !== undefined) update.status = parsed.status;
        if (parsed.startsAt !== undefined) update.starts_at = parsed.startsAt;
        if (parsed.endsAt !== undefined) update.ends_at = parsed.endsAt;
        if (parsed.capacityEnabled !== undefined) update.capacity_enabled = parsed.capacityEnabled;
        if (parsed.capacityTotal !== undefined) update.capacity_total = parsed.capacityTotal;
        if (parsed.capacityRemaining !== undefined)
          update.capacity_remaining = parsed.capacityRemaining;
        if (parsed.capacityLabel !== undefined) update.capacity_label = parsed.capacityLabel;
        if (parsed.organizationId !== undefined) update.organization_id = parsed.organizationId;

        if (Object.keys(update).length === 0) {
          throw new AppError("VALIDATION", "No updatable fields provided", 400);
        }

        const { data, error } = await supabase
          .from("store_campaigns")
          .update(update as UpdateRow<"store_campaigns">)
          .eq("id", String(req.params.id))
          .select()
          .maybeSingle();

        if (error) throw new AppError("DB_ERROR", error.message, 500);
        if (!data) throw new AppError("NOT_FOUND", "Campaign not found", 404);

        await logAuditEvent({
          actorUserId: req.authUser?.userId ?? null,
          action: "store.campaign.update",
          entityType: "store_campaign",
          entityId: data.id,
          metadata: { fields: Object.keys(update) },
        });

        res.json(success(rowToCampaign(data as CampaignRow)));
      } catch (error) {
        if (error instanceof ZodError) {
          res
            .status(400)
            .json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
          return;
        }
        next(error);
      }
    },
  );

  // DELETE /api/v1/store/campaigns/:id - delete a campaign (admin)
  router.delete(
    "/campaigns/:id",
    requireAuth,
    requireAdmin,
    requireOrgAccess,
    async (req, res, next) => {
      try {
        const supabase = getSupabaseAdmin();
        const { data: existing } = await supabase
          .from("store_campaigns")
          .select("organization_id")
          .eq("id", String(req.params.id))
          .maybeSingle();
        if (existing?.organization_id) {
          assertOrgScopeMatches(req, existing.organization_id);
        }
        const { error } = await supabase
          .from("store_campaigns")
          .delete()
          .eq("id", String(req.params.id));

        if (error) throw new AppError("DB_ERROR", error.message, 500);

        await logAuditEvent({
          actorUserId: req.authUser?.userId ?? null,
          action: "store.campaign.delete",
          entityType: "store_campaign",
          entityId: String(req.params.id),
        });

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );
}
