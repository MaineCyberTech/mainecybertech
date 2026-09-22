import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError, success, failure } from "../types";
import { logAuditEvent } from "../services/audit";
import { ZodError } from "zod";
import {
  getProducts,
  getCategories,
  getProductBySlug,
  getCategoryBySlug,
  getProductsByCategory,
} from "../lib/store-catalog";
import { toJson, type UpdateRow } from "../lib/db-types";
import { scoreLead } from "../lib/lead-scoring";
import { buildProposalSections, PROPOSAL_GUARDRAILS } from "../lib/proposal-generator";
import {
  asHandoffItems,
  buildHandoffPlan,
  buildProposalTitle,
  handoffItemLabel,
  parseAmountFromPriceRange,
} from "../lib/intake-handoff";
import { dispatchWebhook } from "../lib/webhook-dispatcher";
import { logger } from "../lib/logger";

const router: ReturnType<typeof Router> = Router();

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

const quoteItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().optional(),
  priceRange: z.string().optional(),
  categoryId: z.string().optional(),
});

const createQuoteSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).default(""),
  items: z.array(z.union([z.string(), quoteItemSchema])).default([]),
  // Optional lead-scoring signals the quote builder may supply.
  userCount: z.number().int().min(0).max(1_000_000).optional(),
  needsOnsite: z.boolean().optional(),
  adminAccessAvailable: z.boolean().optional(),
  requestedConsult: z.boolean().optional(),
});

const updateProposalDraftSchema = z.object({
  status: z.enum(["draft_internal", "in_review", "approved", "sent", "archived"]).optional(),
  sections: z.record(z.string(), z.array(z.string())).optional(),
});

const generateProposalDraftSchema = z.object({
  // When present, a first-class `proposals` row is created and linked.
  organizationId: z.string().uuid().optional(),
  visibility: z.enum(["internal", "client_visible"]).default("internal"),
  validUntil: z.string().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
});

const visualAssetSchema = z.object({
  linkedEntityType: z.string().min(1).max(100),
  linkedEntityId: z.string().min(1).max(200),
  assetType: z.string().min(1).max(100),
  iconName: z.string().max(100).default(""),
  accentColor: z.string().max(50).default(""),
  imageUrl: z.string().max(2000).default(""),
  altText: z.string().max(500).default(""),
  decorative: z.boolean().default(false),
  provenance: z.string().max(500).default(""),
  licenseNotes: z.string().max(1000).default(""),
});

const updateVisualAssetSchema = visualAssetSchema.partial();

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

// POST /api/v1/store/quotes - submit a quote (public)
router.post("/quotes", async (req, res, next) => {
  try {
    const parsed = createQuoteSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("store_quotes")
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        notes: parsed.notes,
        items: parsed.items,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    // Persist the structured quote request and a scored lead (the
    // `store_quote_requests` / `store_leads` tables were previously unwired).
    // These are operational side-records: a failure must not break the
    // customer's submission, so it is logged and recorded in the audit event.
    let leadScore: number | null = null;
    let leadBand: string | null = null;
    try {
      const { data: request, error: requestError } = await supabase
        .from("store_quote_requests")
        .insert({
          status: "submitted",
          customer: toJson({
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone ?? null,
          }),
          items: toJson(parsed.items),
          notes: parsed.notes,
        })
        .select()
        .single();
      if (requestError) throw requestError;

      const scored = scoreLead({
        items: parsed.items,
        notes: parsed.notes,
        userCount: parsed.userCount,
        needsOnsite: parsed.needsOnsite,
        adminAccessAvailable: parsed.adminAccessAvailable,
        requestedConsult: parsed.requestedConsult,
      });

      const followUpDays = scored.band === "priority" || scored.band === "high" ? 1 : 2;
      const { data: lead, error: leadError } = await supabase
        .from("store_leads")
        .insert({
          quote_request_id: (request as { id: string }).id,
          status: "new",
          lead_score: scored.score,
          lead_band: scored.band,
          score_breakdown: toJson(scored.breakdown),
          follow_up_due_at:
            scored.band === "low"
              ? null
              : new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (leadError) throw leadError;

      leadScore = scored.score;
      leadBand = scored.band;
      void lead;
    } catch (sideError) {
      logger.warn({ err: sideError }, "store.quote.lead_capture_failed");
    }

    await logAuditEvent({
      action: "store.quote.submit",
      entityType: "store_quote",
      entityId: data.id,
      metadata: { name: parsed.name, email: parsed.email, leadScore, leadBand },
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

// GET /api/v1/store/quotes - list quotes (admin)
router.get("/quotes", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/quote-requests - list structured quote requests (admin)
router.get("/quote-requests", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_quote_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/leads - list scored leads (admin)
router.get("/leads", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_leads")
      .select("*")
      .order("lead_score", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/quote-requests/:id/proposal - generate a proposal draft (admin)
router.post("/quote-requests/:id/proposal", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = generateProposalDraftSchema.parse(req.body ?? {});
    const supabase = getSupabaseAdmin();
    const actorUserId = req.authUser?.userId ?? null;

    const { data: request, error } = await supabase
      .from("store_quote_requests")
      .select("*")
      .eq("id", String(req.params.id))
      .maybeSingle();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!request) throw new AppError("NOT_FOUND", "Quote request not found", 404);

    const sections = buildProposalSections(request, await getProducts());

    // When an organization is supplied, also create the first-class proposal
    // (with a line item per requested service) so the handoff enters the
    // proposals approval/publish workflow.
    let linkedProposalId: string | null = null;
    if (parsed.organizationId) {
      if (!actorUserId) throw new AppError("UNAUTHORIZED", "Authenticated user required", 401);

      const items = asHandoffItems(request.items);
      const { data: proposal, error: proposalError } = await supabase
        .from("proposals")
        .insert({
          organization_id: parsed.organizationId,
          title: buildProposalTitle(request),
          description: sections["Executive summary"].join("\n"),
          status: "draft",
          visibility: parsed.visibility,
          valid_until: parsed.validUntil ?? null,
          owner_user_id: parsed.ownerUserId ?? null,
          created_by: actorUserId,
          metadata: toJson({ quoteRequestId: request.id, source: "store_intake" }),
        })
        .select()
        .single();
      if (proposalError) throw new AppError("DB_ERROR", proposalError.message, 500);

      const lineItems = items.map((item, index) => {
        const amount = parseAmountFromPriceRange(item.priceRange);
        return {
          proposal_id: proposal.id,
          sort_order: index,
          item_type: "one_time",
          name: handoffItemLabel(item),
          description: item.priceRange ? `Catalog price: ${item.priceRange}` : null,
          quantity: 1,
          unit_price: amount,
          total_price: amount,
          is_optional: false,
          is_recurring: false,
          recurring_interval: "monthly",
        };
      });

      if (lineItems.length > 0) {
        const { error: lineItemError } = await supabase
          .from("proposal_line_items")
          .insert(lineItems as never);
        if (lineItemError) throw new AppError("DB_ERROR", lineItemError.message, 500);

        const total = lineItems.reduce((sum, item) => sum + item.total_price, 0);
        await supabase
          .from("proposals")
          .update({ grand_total: total, total_one_time: total })
          .eq("id", proposal.id);
      }

      linkedProposalId = proposal.id;
    }

    const { data, error: insertError } = await supabase
      .from("store_proposal_drafts")
      .insert({
        quote_request_id: request.id,
        proposal_id: linkedProposalId,
        status: "draft_internal",
        sections: toJson({ ...sections, guardrails: PROPOSAL_GUARDRAILS }),
        generated_by: actorUserId,
      })
      .select()
      .single();

    if (insertError) throw new AppError("DB_ERROR", insertError.message, 500);

    await logAuditEvent({
      actorUserId,
      action: "store.proposal_draft.generate",
      entityType: "store_proposal_draft",
      entityId: data.id,
      metadata: { quoteRequestId: request.id, proposalId: linkedProposalId },
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

// GET /api/v1/store/proposal-drafts - list proposal drafts (admin)
router.get("/proposal-drafts", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_proposal_drafts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/store/proposal-drafts/:id - review/update a proposal draft (admin)
router.patch("/proposal-drafts/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateProposalDraftSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const update: Record<string, unknown> = {};
    if (parsed.status) update.status = parsed.status;
    if (parsed.sections) update.sections = toJson(parsed.sections);
    if (parsed.status && ["approved", "sent"].includes(parsed.status)) {
      update.reviewed_by = req.authUser?.userId ?? null;
    }
    if (Object.keys(update).length === 0) {
      throw new AppError("VALIDATION", "No updatable fields provided", 400);
    }

    const { data, error } = await supabase
      .from("store_proposal_drafts")
      .update(update as UpdateRow<"store_proposal_drafts">)
      .eq("id", String(req.params.id))
      .select()
      .maybeSingle();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Proposal draft not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser?.userId ?? null,
      action: "store.proposal_draft.update",
      entityType: "store_proposal_draft",
      entityId: data.id,
      metadata: { status: parsed.status ?? null },
    });

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

const convertQuoteRequestSchema = z.object({
  organizationId: z.string().uuid(),
  projectName: z.string().min(1).max(500).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  ownerId: z.string().uuid().optional().nullable(),
  assignedOwnerId: z.string().uuid().optional().nullable(),
});

// POST /api/v1/store/quote-requests/:id/convert - intake -> project handoff (admin)
router.post("/quote-requests/:id/convert", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = convertQuoteRequestSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const actorUserId = req.authUser?.userId ?? null;
    if (!actorUserId) throw new AppError("UNAUTHORIZED", "Authenticated user required", 401);

    const { data: request, error } = await supabase
      .from("store_quote_requests")
      .select("*")
      .eq("id", String(req.params.id))
      .maybeSingle();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!request) throw new AppError("NOT_FOUND", "Quote request not found", 404);
    if (request.status === "converted_to_project") {
      throw new AppError("CONFLICT", "Quote request has already been converted", 409);
    }

    const plan = buildHandoffPlan(request, {
      organizationId: parsed.organizationId,
      createdBy: actorUserId,
      projectName: parsed.projectName,
      priority: parsed.priority,
      ownerId: parsed.ownerId ?? null,
    });

    // Carry the linked first-class proposal (if one was generated) onto the
    // project so delivery can see the approved commercial scope.
    const { data: linkedDrafts } = await supabase
      .from("store_proposal_drafts")
      .select("proposal_id")
      .eq("quote_request_id", request.id)
      .not("proposal_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const linkedProposalId = linkedDrafts?.[0]?.proposal_id ?? null;
    if (linkedProposalId) plan.project.metadata.proposalId = linkedProposalId;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(plan.project as never)
      .select()
      .single();
    if (projectError) throw new AppError("DB_ERROR", projectError.message, 500);

    const { data: tasks, error: taskError } = await supabase
      .from("project_tasks")
      .insert(
        plan.taskTitles.map((title, index) => ({
          organization_id: parsed.organizationId,
          project_id: project.id,
          created_by: actorUserId,
          title,
          status: "todo",
          sort_order: index,
        })) as never,
      )
      .select();
    if (taskError) throw new AppError("DB_ERROR", taskError.message, 500);

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        organization_id: parsed.organizationId,
        created_by: actorUserId,
        title: plan.ticketTitle,
        description: plan.ticketDescription,
        priority: parsed.priority,
        category: "store_intake",
        source: "admin",
        status: "new",
        metadata: toJson({ quoteRequestId: request.id, projectId: project.id }),
      } as never)
      .select()
      .single();
    if (ticketError) throw new AppError("DB_ERROR", ticketError.message, 500);

    // Bookkeeping: flip the source rows. The project already exists, so a
    // failure here is logged rather than rolled back.
    try {
      await supabase
        .from("store_quote_requests")
        .update({ status: "converted_to_project" })
        .eq("id", request.id);

      const { data: leads } = await supabase
        .from("store_leads")
        .select("id")
        .eq("quote_request_id", request.id);
      const leadIds = (leads ?? []).map((lead) => lead.id);
      if (leadIds.length > 0) {
        await supabase
          .from("store_leads")
          .update({
            status: "converted",
            ...(parsed.assignedOwnerId ? { assigned_owner: parsed.assignedOwnerId } : {}),
          })
          .in("id", leadIds);
      }
    } catch (bookkeepingError) {
      logger.warn({ err: bookkeepingError }, "store.quote_request.convert_bookkeeping_failed");
    }

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId,
      action: "store.quote_request.converted_to_project",
      entityType: "project",
      entityId: project.id,
      metadata: {
        quoteRequestId: request.id,
        ticketId: ticket.id,
        checklistTasks: plan.taskTitles.length,
        proposalId: linkedProposalId,
      },
    });

    void dispatchWebhook("project.created", parsed.organizationId, {
      projectId: project.id,
      name: plan.project.name,
      status: plan.project.status,
      source: "store_intake",
    });

    res.status(201).json(
      success({
        project,
        ticketId: ticket.id,
        checklistTaskCount: (tasks ?? []).length,
      }),
    );
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

// --- Visual assets (admin) ---
interface VisualAssetRow {
  id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  asset_type: string;
  icon_name: string | null;
  accent_color: string | null;
  image_url: string | null;
  alt_text: string | null;
  decorative: boolean | null;
  provenance: string | null;
  license_notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToVisualAsset(row: VisualAssetRow) {
  return {
    id: row.id,
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    assetType: row.asset_type,
    iconName: row.icon_name ?? "",
    accentColor: row.accent_color ?? "",
    imageUrl: row.image_url ?? "",
    altText: row.alt_text ?? "",
    decorative: row.decorative ?? false,
    provenance: row.provenance ?? "",
    licenseNotes: row.license_notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/v1/store/visual-assets - list visual assets (admin)
router.get("/visual-assets", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("store_visual_assets").select("*");
    if (req.query.linkedEntityType) {
      query = query.eq("linked_entity_type", String(req.query.linkedEntityType));
    }
    if (req.query.linkedEntityId) {
      query = query.eq("linked_entity_id", String(req.query.linkedEntityId));
    }
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(((data ?? []) as VisualAssetRow[]).map(rowToVisualAsset)));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/visual-assets - create a visual asset (admin)
router.post("/visual-assets", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = visualAssetSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("store_visual_assets")
      .insert({
        linked_entity_type: parsed.linkedEntityType,
        linked_entity_id: parsed.linkedEntityId,
        asset_type: parsed.assetType,
        icon_name: parsed.iconName,
        accent_color: parsed.accentColor,
        image_url: parsed.imageUrl,
        alt_text: parsed.altText,
        decorative: parsed.decorative,
        provenance: parsed.provenance,
        license_notes: parsed.licenseNotes,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser?.userId ?? null,
      action: "store.visual_asset.create",
      entityType: "store_visual_asset",
      entityId: data.id,
      metadata: {
        linkedEntityType: parsed.linkedEntityType,
        linkedEntityId: parsed.linkedEntityId,
      },
    });

    res.status(201).json(success(rowToVisualAsset(data as VisualAssetRow)));
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

// PATCH /api/v1/store/visual-assets/:id - update a visual asset (admin)
router.patch("/visual-assets/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateVisualAssetSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const update: Record<string, unknown> = {};
    if (parsed.linkedEntityType !== undefined) update.linked_entity_type = parsed.linkedEntityType;
    if (parsed.linkedEntityId !== undefined) update.linked_entity_id = parsed.linkedEntityId;
    if (parsed.assetType !== undefined) update.asset_type = parsed.assetType;
    if (parsed.iconName !== undefined) update.icon_name = parsed.iconName;
    if (parsed.accentColor !== undefined) update.accent_color = parsed.accentColor;
    if (parsed.imageUrl !== undefined) update.image_url = parsed.imageUrl;
    if (parsed.altText !== undefined) update.alt_text = parsed.altText;
    if (parsed.decorative !== undefined) update.decorative = parsed.decorative;
    if (parsed.provenance !== undefined) update.provenance = parsed.provenance;
    if (parsed.licenseNotes !== undefined) update.license_notes = parsed.licenseNotes;
    if (Object.keys(update).length === 0) {
      throw new AppError("VALIDATION", "No updatable fields provided", 400);
    }

    const { data, error } = await supabase
      .from("store_visual_assets")
      .update(update as UpdateRow<"store_visual_assets">)
      .eq("id", String(req.params.id))
      .select()
      .maybeSingle();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Visual asset not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser?.userId ?? null,
      action: "store.visual_asset.update",
      entityType: "store_visual_asset",
      entityId: data.id,
      metadata: { fields: Object.keys(update) },
    });

    res.json(success(rowToVisualAsset(data as VisualAssetRow)));
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

// DELETE /api/v1/store/visual-assets/:id - delete a visual asset (admin)
router.delete("/visual-assets/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("store_visual_assets")
      .delete()
      .eq("id", String(req.params.id));

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser?.userId ?? null,
      action: "store.visual_asset.delete",
      entityType: "store_visual_asset",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/products - list products (public)
router.get("/products", async (req, res, next) => {
  try {
    const category = String(req.query.category ?? "");
    const allProducts = await getProducts();
    const result = category
      ? allProducts.filter((p) => p.category === category || p.categoryId === category)
      : allProducts;
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/products/by-id/:id - product by id (admin)
router.get("/products/by-id/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allProducts = await getProducts();
    const product = allProducts.find((p) => p.id === String(req.params.id));
    if (!product) {
      res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
      return;
    }
    res.json(success(product));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/products/:slug - product detail (public)
router.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await getProductBySlug(String(req.params.slug));
    if (!product) {
      res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
      return;
    }
    res.json(success(product));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/categories - list categories (public)
router.get("/categories", async (req, res, next) => {
  try {
    const cats = await getCategories();
    const result = await Promise.all(
      cats.map(async (c) => ({
        ...c,
        productCount: (await getProductsByCategory(c.slug)).length,
      })),
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/categories/:slug - category detail with products (public)
router.get("/categories/:slug", async (req, res, next) => {
  try {
    const category = await getCategoryBySlug(String(req.params.slug));
    if (!category) {
      res.status(404).json(failure("NOT_FOUND", "Category not found", 404));
      return;
    }
    const products = await getProductsByCategory(category.slug);
    res.json(success({ ...category, products }));
  } catch (err) {
    next(err);
  }
});

// ===== Admin CRUD for store catalog (P2-22/23) =====
// The catalog is now DB-backed (store_products / store_categories). These
// endpoints let admins manage it. Guarded by requireAdmin.
const productUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  display: z.boolean().optional(),
  status: z.string().optional(),
  priceRange: z.string().optional(),
  pricingModel: z.string().optional(),
  purchaseMode: z.string().optional(),
  summary: z.string().optional(),
  marketingHeadline: z.string().optional(),
  marketingCopy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

const categoryUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  count: z.number().int().optional(),
});

// POST /api/v1/store/products - create product (admin)
router.post("/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = productUpsertSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const row = {
      id: parsed.id ?? parsed.slug,
      slug: parsed.slug,
      name: parsed.name,
      category_id: parsed.categoryId ?? null,
      category: parsed.category ?? "",
      type: parsed.type ?? "service",
      display: parsed.display ?? true,
      status: parsed.status ?? "draft",
      price_range: parsed.priceRange ?? "",
      pricing_model: parsed.pricingModel ?? "",
      purchase_mode: parsed.purchaseMode ?? "",
      summary: parsed.summary ?? "",
      marketing_headline: parsed.marketingHeadline ?? "",
      marketing_copy: parsed.marketingCopy ?? "",
      tags: parsed.tags ?? [],
      attributes: toJson(parsed.attributes ?? {}),
    };
    const { data, error } = await supabase
      .from("store_products")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.create",
      entityType: "store_product",
      entityId: data.id,
      metadata: { slug: parsed.slug },
    });
    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/store/products/:id - update product (admin)
router.patch("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = productUpsertSchema.partial().parse(req.body);
    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from("store_products")
      .select("id")
      .eq("id", String(req.params.id))
      .maybeSingle();
    if (!existing.data) {
      res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
      return;
    }
    const row: UpdateRow<"store_products"> = {};
    if (parsed.slug !== undefined) row.slug = parsed.slug;
    if (parsed.name !== undefined) row.name = parsed.name;
    if (parsed.categoryId !== undefined) row.category_id = parsed.categoryId;
    if (parsed.category !== undefined) row.category = parsed.category;
    if (parsed.type !== undefined) row.type = parsed.type;
    if (parsed.display !== undefined) row.display = parsed.display;
    if (parsed.status !== undefined) row.status = parsed.status;
    if (parsed.priceRange !== undefined) row.price_range = parsed.priceRange;
    if (parsed.pricingModel !== undefined) row.pricing_model = parsed.pricingModel;
    if (parsed.purchaseMode !== undefined) row.purchase_mode = parsed.purchaseMode;
    if (parsed.summary !== undefined) row.summary = parsed.summary;
    if (parsed.marketingHeadline !== undefined) row.marketing_headline = parsed.marketingHeadline;
    if (parsed.marketingCopy !== undefined) row.marketing_copy = parsed.marketingCopy;
    if (parsed.tags !== undefined) row.tags = parsed.tags;
    if (parsed.attributes !== undefined) row.attributes = toJson(parsed.attributes);
    const { data, error } = await supabase
      .from("store_products")
      .update(row)
      .eq("id", String(req.params.id))
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.update",
      entityType: "store_product",
      entityId: String(String(req.params.id)),
    });
    res.json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/store/products/:id - delete product (admin)
router.delete("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("store_products")
      .delete()
      .eq("id", String(req.params.id));
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.delete",
      entityType: "store_product",
      entityId: String(String(req.params.id)),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/categories - create category (admin)
router.post("/categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = categoryUpsertSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const row = {
      id: parsed.id ?? parsed.slug,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description ?? "",
      product_ids: parsed.productIds ?? [],
      count: parsed.count ?? (parsed.productIds ? parsed.productIds.length : 0),
    };
    const { data, error } = await supabase
      .from("store_categories")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.create",
      entityType: "store_category",
      entityId: data.id,
      metadata: { slug: parsed.slug },
    });
    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/store/categories/:id - update category (admin)
router.patch("/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = categoryUpsertSchema.partial().parse(req.body);
    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from("store_categories")
      .select("id")
      .eq("id", String(req.params.id))
      .maybeSingle();
    if (!existing.data) {
      res.status(404).json(failure("NOT_FOUND", "Category not found", 404));
      return;
    }
    const row: UpdateRow<"store_categories"> = {};
    if (parsed.name !== undefined) row.name = parsed.name;
    if (parsed.slug !== undefined) row.slug = parsed.slug;
    if (parsed.description !== undefined) row.description = parsed.description;
    if (parsed.productIds !== undefined) row.product_ids = parsed.productIds;
    if (parsed.count !== undefined) row.count = parsed.count;
    const { data, error } = await supabase
      .from("store_categories")
      .update(row)
      .eq("id", String(req.params.id))
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.update",
      entityType: "store_category",
      entityId: String(String(req.params.id)),
    });
    res.json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/store/categories/:id - delete category (admin)
router.delete("/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("store_categories")
      .delete()
      .eq("id", String(req.params.id));
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.delete",
      entityType: "store_category",
      entityId: String(String(req.params.id)),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
