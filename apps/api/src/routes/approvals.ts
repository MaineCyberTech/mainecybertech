import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import {
  approveRequest,
  rejectRequest,
  cancelRequest,
  addTimelineEvent,
} from "../services/approvals";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import {
  createApprovalSchema,
  updateApprovalSchema,
  approveRequestSchema,
  rejectRequestSchema,
  cancelRequestSchema,
  addApprovalCommentSchema,
} from "../validators/approvals";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "request_type" },
  { key: "request_subject" },
  { key: "status" },
  { key: "priority" },
  { key: "requested_by" },
  { key: "approved_by" },
  { key: "approved_at" },
  { key: "created_at" },
  { key: "updated_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    let query = supabase.from("approval_requests").select("*");

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const typeFilter = req.query.request_type as string | undefined;
    if (typeFilter) query = query.eq("request_type", typeFilter);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "approval.export",
      entityType: "approval_request",
    });

    sendExportResponse(res, data ?? [], exportColumns, "approvals");
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    let query = supabase.from("approval_requests").select("status");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const items = data ?? [];
    res.json(
      success({
        total: items.length,
        pending: items.filter((r: { status: string }) => r.status === "pending").length,
        approved: items.filter((r: { status: string }) => r.status === "approved").length,
        rejected: items.filter((r: { status: string }) => r.status === "rejected").length,
        cancelled: items.filter((r: { status: string }) => r.status === "cancelled").length,
      }),
    );
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

    let query = supabase.from("approval_requests").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const typeFilter = req.query.request_type as string | undefined;
    if (typeFilter) query = query.eq("request_type", typeFilter);

    const searchFilter = req.query.search as string | undefined;
    if (searchFilter) query = query.ilike("request_subject", `%${searchFilter}%`);

    const {
      data: requests,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: requests ?? [],
      total: count ?? 0,
      page,
      limit,
    };

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Approval request not found", 404);

    const { data: comments } = await supabase
      .from("module_comments")
      .select("*")
      .eq("module_key", "approvals")
      .eq("entity_type", "approval_request")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });

    const { data: timeline } = await supabase
      .from("module_timeline_events")
      .select("*")
      .eq("module_key", "approvals")
      .eq("entity_type", "approval_request")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });

    res.json(success({ ...data, comments: comments ?? [], timeline: timeline ?? [] }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createApprovalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        organization_id: parsed.organizationId,
        request_type: parsed.requestType,
        request_subject: parsed.requestSubject,
        request_body: parsed.requestBody ?? null,
        request_metadata: parsed.requestMetadata ?? {},
        source_module: parsed.sourceModule ?? null,
        source_entity_type: parsed.sourceEntityType ?? null,
        source_entity_id: parsed.sourceEntityId ?? null,
        priority: parsed.priority,
        assigned_to: parsed.assignedTo ?? null,
        due_at: parsed.dueAt ?? null,
        visibility: parsed.visibility,
        requested_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: `approval.${parsed.requestType}.created`,
      entityType: "approval_request",
      entityId: data.id,
      metadata: { requestType: parsed.requestType, requestSubject: parsed.requestSubject },
    });

    await addTimelineEvent(
      parsed.organizationId,
      "approvals",
      "approval_request",
      data.id,
      "created",
      { requestType: parsed.requestType, requestSubject: parsed.requestSubject },
      req.authUser!.userId,
    );

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateApprovalSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("approval_requests")
      .select("version")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) {
      throw new AppError("NOT_FOUND", "Approval request not found", 404);
    }

    checkVersionMatch(current.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.requestSubject !== undefined) updateData.request_subject = parsed.requestSubject;
    if (parsed.requestBody !== undefined) updateData.request_body = parsed.requestBody;
    if (parsed.requestMetadata !== undefined) updateData.request_metadata = parsed.requestMetadata;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.assignedTo !== undefined) updateData.assigned_to = parsed.assignedTo;
    if (parsed.dueAt !== undefined) updateData.due_at = parsed.dueAt;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;

    updateData.version = current.version + 1;

    const { data, error } = await supabase
      .from("approval_requests")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Request was modified by another user", 409);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "approval.updated",
      entityType: "approval_request",
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
    const { error } = await supabase.from("approval_requests").delete().eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "approval.deleted",
      entityType: "approval_request",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/approve", async (req, res, next) => {
  try {
    const parsed = approveRequestSchema.parse(req.body);

    const result = await approveRequest(
      req.params.id,
      req.authUser!.userId,
      parsed.organizationId,
      parsed.notes,
    );

    await addTimelineEvent(
      parsed.organizationId,
      "approvals",
      "approval_request",
      req.params.id,
      "approved",
      { notes: parsed.notes },
      req.authUser!.userId,
    );

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", async (req, res, next) => {
  try {
    const parsed = rejectRequestSchema.parse(req.body);

    const result = await rejectRequest(
      req.params.id,
      req.authUser!.userId,
      parsed.organizationId,
      parsed.reason,
    );

    await addTimelineEvent(
      parsed.organizationId,
      "approvals",
      "approval_request",
      req.params.id,
      "rejected",
      { reason: parsed.reason },
      req.authUser!.userId,
    );

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const parsed = cancelRequestSchema.parse(req.body);

    const result = await cancelRequest(
      req.params.id,
      req.authUser!.userId,
      parsed.organizationId,
      parsed.reason,
    );

    await addTimelineEvent(
      parsed.organizationId,
      "approvals",
      "approval_request",
      req.params.id,
      "cancelled",
      { reason: parsed.reason },
      req.authUser!.userId,
    );

    res.json(success(result));
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
      .eq("module_key", "approvals")
      .eq("entity_type", "approval_request")
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
    const parsed = addApprovalCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: approval } = await supabase
      .from("approval_requests")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();

    if (!approval) throw new AppError("NOT_FOUND", "Approval request not found", 404);

    const { data, error } = await supabase
      .from("module_comments")
      .insert({
        organization_id: approval.organization_id,
        module_key: "approvals",
        entity_type: "approval_request",
        entity_id: req.params.id,
        author_id: req.authUser!.userId,
        body: parsed.body,
        is_internal: parsed.isInternal,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: approval.organization_id as string,
      actorUserId: req.authUser!.userId,
      action: "approval.comment.created",
      entityType: "approval_request",
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
      .eq("module_key", "approvals")
      .eq("entity_type", "approval_request")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

export default router;
