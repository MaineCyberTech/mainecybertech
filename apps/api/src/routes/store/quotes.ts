import { Router } from "express";
import { z, ZodError } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { AppError, success, failure } from "../../types";
import { logAuditEvent } from "../../services/audit";
import { getProducts } from "../../lib/store-catalog";
import { toJson, type UpdateRow } from "../../lib/db-types";
import { scoreLead } from "../../lib/lead-scoring";
import { buildProposalSections, PROPOSAL_GUARDRAILS } from "../../lib/proposal-generator";
import {
  asHandoffItems,
  buildHandoffPlan,
  buildProposalTitle,
  handoffItemLabel,
  parseAmountFromPriceRange,
} from "../../lib/intake-handoff";
import { dispatchWebhook } from "../../lib/webhook-dispatcher";
import { logger } from "../../lib/logger";

/** Quotes, structured quote requests, leads and proposal drafts. Extracted from `routes/store.ts` (same pattern as `routes/final/`). */
export function registerQuoteRoutes(router: Router) {
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

  const convertQuoteRequestSchema = z.object({
    organizationId: z.string().uuid(),
    projectName: z.string().min(1).max(500).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    ownerId: z.string().uuid().optional().nullable(),
    assignedOwnerId: z.string().uuid().optional().nullable(),
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
}
