import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { addTimelineEvent } from "../services/approvals";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import {
  createProposalSchema,
  updateProposalSchema,
  createPhaseSchema,
  updatePhaseSchema,
  createLineItemSchema,
  updateLineItemSchema,
  submitForApprovalSchema,
  publishProposalSchema,
} from "../validators/proposals";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "title" },
  { key: "status" },
  { key: "grand_total" },
  { key: "created_at" },
  { key: "updated_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("proposals").select("*");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.export",
      entityType: "proposal",
    });
    sendExportResponse(res, data ?? [], exportColumns, "proposals");
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("proposals").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);
    const searchFilter = req.query.search as string | undefined;
    if (searchFilter) query = query.ilike("title", `%${searchFilter}%`);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Proposal not found", 404);

    const [{ data: phases }, { data: items }, { data: comments }, { data: timeline }] =
      await Promise.all([
        supabase
          .from("proposal_phases")
          .select("*")
          .eq("proposal_id", req.params.id)
          .order("sort_order"),
        supabase
          .from("proposal_line_items")
          .select("*")
          .eq("proposal_id", req.params.id)
          .order("sort_order"),
        supabase
          .from("module_comments")
          .select("*")
          .eq("module_key", "proposals")
          .eq("entity_type", "proposal")
          .eq("entity_id", req.params.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("module_timeline_events")
          .select("*")
          .eq("module_key", "proposals")
          .eq("entity_type", "proposal")
          .eq("entity_id", req.params.id)
          .order("created_at", { ascending: true }),
      ]);

    res.json(
      success({
        ...data,
        phases: phases ?? [],
        items: items ?? [],
        comments: comments ?? [],
        timeline: timeline ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createProposalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    let grandTotal = 0;
    let totalLabor = 0;
    let totalMaterials = 0;
    let totalRecurring = 0;
    let totalOneTime = 0;

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        description: parsed.description ?? null,
        status: "draft",
        visibility: parsed.visibility,
        valid_until: parsed.validUntil ?? null,
        owner_user_id: parsed.ownerUserId ?? null,
        created_by: req.authUser!.userId,
        metadata: parsed.metadata ?? {},
        grand_total: 0,
        total_labor: 0,
        total_materials: 0,
        total_recurring: 0,
        total_one_time: 0,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    for (const phase of parsed.phases) {
      const { error: phaseError } = await supabase.from("proposal_phases").insert({
        proposal_id: data.id,
        title: phase.title,
        description: phase.description ?? null,
        assumptions: phase.assumptions ?? null,
        notes: phase.notes ?? null,
        sort_order: phase.sortOrder,
      });

      if (phaseError) throw new AppError("DB_ERROR", phaseError.message, 500);
    }

    for (const phase of parsed.phases) {
      for (const item of phase.items) {
        const itemTotal = item.totalPrice > 0 ? item.totalPrice : item.quantity * item.unitPrice;
        grandTotal += itemTotal;

        if (item.itemType === "labor") totalLabor += itemTotal;
        else if (item.itemType === "materials") totalMaterials += itemTotal;
        else if (item.itemType === "recurring") totalRecurring += itemTotal;
        else totalOneTime += itemTotal;

        const { error: itemError } = await supabase.from("proposal_line_items").insert({
          proposal_id: data.id,
          phase_id: null,
          item_type: item.itemType,
          name: item.name,
          description: item.description ?? null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: itemTotal,
          is_optional: item.isOptional,
          is_recurring: item.isRecurring,
          recurring_interval: item.recurringInterval,
          notes: item.notes ?? null,
          sort_order: item.sortOrder,
        });

        if (itemError) throw new AppError("DB_ERROR", itemError.message, 500);
      }
    }

    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        grand_total: grandTotal,
        total_labor: totalLabor,
        total_materials: totalMaterials,
        total_recurring: totalRecurring,
        total_one_time: totalOneTime,
      })
      .eq("id", data.id);

    if (updateError) throw new AppError("DB_ERROR", updateError.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "proposal.created",
      entityType: "proposal",
      entityId: data.id,
      metadata: { title: parsed.title, grandTotal },
    });

    await addTimelineEvent(
      parsed.organizationId,
      "proposals",
      "proposal",
      data.id,
      "created",
      { title: parsed.title },
      req.authUser!.userId,
    );

    res
      .status(201)
      .json(
        success({
          ...data,
          grand_total: grandTotal,
          total_labor: totalLabor,
          total_materials: totalMaterials,
          total_recurring: totalRecurring,
          total_one_time: totalOneTime,
        }),
      );
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateProposalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("proposals")
      .select("version")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) throw new AppError("NOT_FOUND", "Proposal not found", 404);
    checkVersionMatch(current.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.validUntil !== undefined) updateData.valid_until = parsed.validUntil;
    if (parsed.ownerUserId !== undefined) updateData.owner_user_id = parsed.ownerUserId;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;
    if (parsed.metadata !== undefined) updateData.metadata = parsed.metadata;
    updateData.version = current.version + 1;

    const { data, error } = await supabase
      .from("proposals")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Proposal was modified by another user", 409);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.updated",
      entityType: "proposal",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("proposals").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.deleted",
      entityType: "proposal",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/phases", async (req, res, next) => {
  try {
    const parsed = createPhaseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("proposal_phases")
      .insert({
        proposal_id: req.params.id,
        title: parsed.title,
        description: parsed.description ?? null,
        assumptions: parsed.assumptions ?? null,
        notes: parsed.notes ?? null,
        sort_order: parsed.sortOrder,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.phase.created",
      entityType: "proposal_phase",
      entityId: data.id,
      metadata: { proposalId: req.params.id, title: parsed.title },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/phases/:phaseId", async (req, res, next) => {
  try {
    const parsed = updatePhaseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.assumptions !== undefined) updateData.assumptions = parsed.assumptions;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;
    if (parsed.sortOrder !== undefined) updateData.sort_order = parsed.sortOrder;

    const { data, error } = await supabase
      .from("proposal_phases")
      .update(updateData)
      .eq("id", req.params.phaseId)
      .eq("proposal_id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Phase not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.phase.updated",
      entityType: "proposal_phase",
      entityId: data.id,
      metadata: { proposalId: req.params.id, ...parsed },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/phases/:phaseId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("proposal_phases")
      .delete()
      .eq("id", req.params.phaseId)
      .eq("proposal_id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.phase.deleted",
      entityType: "proposal_phase",
      entityId: String(req.params.phaseId),
      metadata: { proposalId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/items", async (req, res, next) => {
  try {
    const parsed = createLineItemSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const itemTotal =
      parsed.totalPrice > 0 ? parsed.totalPrice : parsed.quantity * parsed.unitPrice;

    const { data, error } = await supabase
      .from("proposal_line_items")
      .insert({
        proposal_id: req.params.id,
        phase_id: parsed.phaseId ?? null,
        item_type: parsed.itemType,
        name: parsed.name,
        description: parsed.description ?? null,
        quantity: parsed.quantity,
        unit_price: parsed.unitPrice,
        total_price: itemTotal,
        is_optional: parsed.isOptional,
        is_recurring: parsed.isRecurring,
        recurring_interval: parsed.recurringInterval,
        notes: parsed.notes ?? null,
        sort_order: parsed.sortOrder,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.item.created",
      entityType: "proposal_line_item",
      entityId: data.id,
      metadata: { proposalId: req.params.id, name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/items/:itemId", async (req, res, next) => {
  try {
    const parsed = updateLineItemSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.phaseId !== undefined) updateData.phase_id = parsed.phaseId;
    if (parsed.itemType !== undefined) updateData.item_type = parsed.itemType;
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.quantity !== undefined) updateData.quantity = parsed.quantity;
    if (parsed.unitPrice !== undefined) updateData.unit_price = parsed.unitPrice;
    if (parsed.totalPrice !== undefined) updateData.total_price = parsed.totalPrice;
    if (parsed.isOptional !== undefined) updateData.is_optional = parsed.isOptional;
    if (parsed.isRecurring !== undefined) updateData.is_recurring = parsed.isRecurring;
    if (parsed.recurringInterval !== undefined)
      updateData.recurring_interval = parsed.recurringInterval;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;
    if (parsed.sortOrder !== undefined) updateData.sort_order = parsed.sortOrder;

    const { data, error } = await supabase
      .from("proposal_line_items")
      .update(updateData)
      .eq("id", req.params.itemId)
      .eq("proposal_id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Line item not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.item.updated",
      entityType: "proposal_line_item",
      entityId: data.id,
      metadata: { proposalId: req.params.id, ...parsed },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/items/:itemId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("proposal_line_items")
      .delete()
      .eq("id", req.params.itemId)
      .eq("proposal_id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "proposal.item.deleted",
      entityType: "proposal_line_item",
      entityId: String(req.params.itemId),
      metadata: { proposalId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/submit-approval", async (req, res, next) => {
  try {
    const parsed = submitForApprovalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: proposal, error: findError } = await supabase
      .from("proposals")
      .select("id, organization_id, title, description, status, grand_total, version")
      .eq("id", req.params.id)
      .single();

    if (findError || !proposal) throw new AppError("NOT_FOUND", "Proposal not found", 404);
    if (proposal.status !== "draft")
      throw new AppError(
        "INVALID_STATE",
        "Only draft proposals can be submitted for approval",
        400,
      );

    const { data: approval, error: approvalError } = await supabase
      .from("approval_requests")
      .insert({
        organization_id: parsed.organizationId,
        request_type: "proposal_approval",
        request_subject: `Proposal: ${proposal.title}`,
        request_body: proposal.description ?? null,
        request_metadata: { proposalId: proposal.id, grandTotal: proposal.grand_total },
        source_module: "proposals",
        source_entity_type: "proposal",
        source_entity_id: proposal.id,
        priority: "high",
        requested_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (approvalError) throw new AppError("DB_ERROR", approvalError.message, 500);

    await supabase
      .from("proposals")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        approval_request_id: approval.id,
        version: proposal.version + 1,
      })
      .eq("id", req.params.id)
      .eq("version", proposal.version);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "proposal.submitted_for_approval",
      entityType: "proposal",
      entityId: req.params.id,
      metadata: { approvalRequestId: approval.id },
    });

    await addTimelineEvent(
      parsed.organizationId,
      "proposals",
      "proposal",
      req.params.id,
      "submitted_for_approval",
      {},
      req.authUser!.userId,
    );

    res.json(success({ approvalId: approval.id }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", async (req, res, next) => {
  try {
    const parsed = publishProposalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: findError } = await supabase
      .from("proposals")
      .select("id, version, status")
      .eq("id", req.params.id)
      .single();

    if (findError || !current) throw new AppError("NOT_FOUND", "Proposal not found", 404);
    if (current.status !== "approved")
      throw new AppError(
        "INVALID_STATE",
        "Only approved proposals can be published to clients",
        400,
      );

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parsed.validityDays);

    const { data, error } = await supabase
      .from("proposals")
      .update({
        visibility: "client_visible",
        valid_until: validUntil.toISOString(),
        metadata: {},
        version: current.version + 1,
      })
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Proposal was modified by another user", 409);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "proposal.published",
      entityType: "proposal",
      entityId: req.params.id,
    });

    await addTimelineEvent(
      parsed.organizationId,
      "proposals",
      "proposal",
      req.params.id,
      "published",
      {},
      req.authUser!.userId,
    );

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module_comments")
      .select("*")
      .eq("module_key", "proposals")
      .eq("entity_type", "proposal")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();

    if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found", 404);

    const { body } = req.body as { body: string; isInternal?: boolean };
    if (!body || !body.trim()) throw new AppError("VALIDATION", "Comment body is required", 400);

    const { data, error } = await supabase
      .from("module_comments")
      .insert({
        organization_id: proposal.organization_id,
        module_key: "proposals",
        entity_type: "proposal",
        entity_id: req.params.id,
        author_id: req.authUser!.userId,
        body: body.trim(),
        is_internal: (req.body as { isInternal?: boolean }).isInternal ?? false,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: proposal.organization_id as string,
      actorUserId: req.authUser!.userId,
      action: "proposal.comment.created",
      entityType: "proposal",
      entityId: req.params.id,
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/timeline", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module_timeline_events")
      .select("*")
      .eq("module_key", "proposals")
      .eq("entity_type", "proposal")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

export default router;
