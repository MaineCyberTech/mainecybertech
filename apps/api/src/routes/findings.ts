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
  createFindingSchema,
  updateFindingSchema,
  verifyFindingSchema,
  resolveFindingSchema,
} from "../validators/findings";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "title" },
  { key: "severity" },
  { key: "status" },
  { key: "source" },
  { key: "remediation_deadline" },
  { key: "created_at" },
  { key: "updated_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("findings").select("*");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "finding.export",
      entityType: "finding",
    });
    sendExportResponse(res, data ?? [], exportColumns, "findings");
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

    let query = supabase.from("findings").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) query = query.eq("status", status);
    const severity = req.query.severity as string | undefined;
    if (severity) query = query.eq("severity", severity);
    const source = req.query.source as string | undefined;
    if (source) query = query.eq("source", source);
    const search = req.query.search as string | undefined;
    if (search) query = query.ilike("title", `%${search}%`);

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

router.get("/stats", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("findings").select("severity, status");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const items = data ?? [];
    const bySeverity = { p0: 0, p1: 0, p2: 0, p3: 0 };
    const byStatus: Record<string, number> = {};
    for (const f of items) {
      const sev = (f as { severity: string }).severity as keyof typeof bySeverity;
      if (sev in bySeverity) bySeverity[sev]++;
      const st = (f as { status: string }).status;
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }

    res.json(success({ bySeverity, byStatus, total: items.length }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string | undefined;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("findings").select("*").eq("id", req.params.id);
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "Finding not found", 404);

    const [{ data: comments }, { data: timeline }] = await Promise.all([
      supabase
        .from("module_comments")
        .select("*")
        .eq("module_key", "findings")
        .eq("entity_type", "finding")
        .eq("entity_id", req.params.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("module_timeline_events")
        .select("*")
        .eq("module_key", "findings")
        .eq("entity_type", "finding")
        .eq("entity_id", req.params.id)
        .order("created_at", { ascending: true }),
    ]);

    res.json(success({ ...data, comments: comments ?? [], timeline: timeline ?? [] }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createFindingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("findings")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        description: parsed.description ?? null,
        severity: parsed.severity,
        source: parsed.source,
        finding_category: parsed.findingCategory ?? null,
        remediation_plan: parsed.remediationPlan ?? null,
        remediation_deadline: parsed.remediationDeadline ?? null,
        verification_steps: parsed.verificationSteps ?? null,
        affected_systems: parsed.affectedSystems ?? null,
        controls_impacted: parsed.controlsImpacted ?? null,
        assigned_to: parsed.assignedTo ?? null,
        owner_user_id: req.authUser!.userId,
        created_by: req.authUser!.userId,
        visibility: parsed.visibility,
        metadata: parsed.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: `finding.${parsed.severity}.created`,
      entityType: "finding",
      entityId: data.id,
      metadata: { title: parsed.title, severity: parsed.severity },
    });

    await addTimelineEvent(
      parsed.organizationId,
      "findings",
      "finding",
      data.id,
      "created",
      { title: parsed.title, severity: parsed.severity },
      req.authUser!.userId,
    );

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateFindingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("findings")
      .select("version")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) throw new AppError("NOT_FOUND", "Finding not found", 404);
    checkVersionMatch(current.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.severity !== undefined) updateData.severity = parsed.severity;
    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
      if (parsed.status === "resolved") updateData.resolved_at = new Date().toISOString();
    }
    if (parsed.source !== undefined) updateData.source = parsed.source;
    if (parsed.findingCategory !== undefined) updateData.finding_category = parsed.findingCategory;
    if (parsed.remediationPlan !== undefined) updateData.remediation_plan = parsed.remediationPlan;
    if (parsed.remediationDeadline !== undefined)
      updateData.remediation_deadline = parsed.remediationDeadline;
    if (parsed.verificationSteps !== undefined)
      updateData.verification_steps = parsed.verificationSteps;
    if (parsed.affectedSystems !== undefined) updateData.affected_systems = parsed.affectedSystems;
    if (parsed.controlsImpacted !== undefined)
      updateData.controls_impacted = parsed.controlsImpacted;
    if (parsed.assignedTo !== undefined) updateData.assigned_to = parsed.assignedTo;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;
    if (parsed.metadata !== undefined) updateData.metadata = parsed.metadata;
    updateData.version = current.version + 1;

    const { data, error } = await supabase
      .from("findings")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Finding was modified by another user", 409);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "finding.updated",
      entityType: "finding",
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
    const { error } = await supabase.from("findings").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "finding.deleted",
      entityType: "finding",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/verify", async (req, res, next) => {
  try {
    const parsed = verifyFindingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: findError } = await supabase
      .from("findings")
      .select("id, status, version")
      .eq("id", req.params.id)
      .single();

    if (findError || !current) throw new AppError("NOT_FOUND", "Finding not found", 404);
    if (current.status !== "resolved")
      throw new AppError("INVALID_STATE", "Only resolved findings can be verified", 400);

    const { data, error } = await supabase
      .from("findings")
      .update({
        status: "verified",
        verified_by: req.authUser!.userId,
        verified_at: new Date().toISOString(),
        version: current.version + 1,
      })
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Finding was modified by another user", 409);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "finding.verified",
      entityType: "finding",
      entityId: req.params.id,
    });

    await addTimelineEvent(
      parsed.organizationId,
      "findings",
      "finding",
      req.params.id,
      "verified",
      {},
      req.authUser!.userId,
    );

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/resolve", async (req, res, next) => {
  try {
    const parsed = resolveFindingSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: findError } = await supabase
      .from("findings")
      .select("id, status, version")
      .eq("id", req.params.id)
      .single();

    if (findError || !current) throw new AppError("NOT_FOUND", "Finding not found", 404);
    if (!["open", "in_progress"].includes(current.status))
      throw new AppError("INVALID_STATE", "Only open or in-progress findings can be resolved", 400);

    const { data, error } = await supabase
      .from("findings")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        remediation_plan: parsed.resolutionNotes ?? undefined,
        version: current.version + 1,
      })
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Finding was modified by another user", 409);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "finding.resolved",
      entityType: "finding",
      entityId: req.params.id,
    });

    await addTimelineEvent(
      parsed.organizationId,
      "findings",
      "finding",
      req.params.id,
      "resolved",
      { notes: parsed.resolutionNotes },
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
      .eq("module_key", "findings")
      .eq("entity_type", "finding")
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
    const { data: finding } = await supabase
      .from("findings")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();
    if (!finding) throw new AppError("NOT_FOUND", "Finding not found", 404);

    const { body } = req.body as { body: string; isInternal?: boolean };
    if (!body?.trim()) throw new AppError("VALIDATION", "Comment body is required", 400);

    const { data, error } = await supabase
      .from("module_comments")
      .insert({
        organization_id: finding.organization_id,
        module_key: "findings",
        entity_type: "finding",
        entity_id: req.params.id,
        author_id: req.authUser!.userId,
        body: body.trim(),
        is_internal: (req.body as { isInternal?: boolean }).isInternal ?? false,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: finding.organization_id as string,
      actorUserId: req.authUser!.userId,
      action: "finding.comment.created",
      entityType: "finding",
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
      .eq("module_key", "findings")
      .eq("entity_type", "finding")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

export default router;
