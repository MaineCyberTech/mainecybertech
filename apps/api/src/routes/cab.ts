import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  listCabMeetingsQuerySchema,
  createCabMeetingSchema,
  addCabAgendaItemSchema,
  updateCabAgendaItemSchema,
} from "../validators/cab";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/meetings", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    const { status } = listCabMeetingsQuerySchema.parse(req.query);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("cab_meetings").select("*", { count: "exact" });
    if (orgId) query = query.eq("organization_id", orgId);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const meetingIds = (data ?? []).map((m: { id: string }) => m.id);
    const agendaByMeeting: Record<string, unknown[]> = {};
    if (meetingIds.length > 0) {
      const { data: agenda, error: agendaError } = await supabase
        .from("cab_agenda_items")
        .select("*")
        .in("meeting_id", meetingIds);
      if (agendaError) throw new AppError("DB_ERROR", agendaError.message, 500);
      for (const item of agenda ?? []) {
        const mid = (item as { meeting_id: string }).meeting_id;
        agendaByMeeting[mid] = agendaByMeeting[mid] ?? [];
        agendaByMeeting[mid].push(item);
      }
    }

    const items = (data ?? []).map((m: { id: string }) => ({
      ...m,
      agenda: agendaByMeeting[m.id] ?? [],
    }));

    res.json(
      success({ items, total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", async (req, res, next) => {
  try {
    const parsed = createCabMeetingSchema.parse(req.body);
    const orgId = (req.query.organization_id as string | undefined) ?? parsed.organizationId;
    if (!orgId) throw new AppError("VALIDATION", "organizationId is required", 400);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("cab_meetings")
      .insert({
        organization_id: orgId,
        scheduled_at: parsed.scheduledAt ?? null,
        status: parsed.status,
        notes: parsed.notes ?? null,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "cab_meeting.created",
      entityType: "cab_meeting",
      entityId: data.id,
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string | undefined;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("cab_meetings").select("*").eq("id", req.params.id);
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "CAB meeting not found", 404);

    const { data: agenda, error: agendaError } = await supabase
      .from("cab_agenda_items")
      .select("*")
      .eq("meeting_id", req.params.id);
    if (agendaError) throw new AppError("DB_ERROR", agendaError.message, 500);

    res.json(success({ ...data, agenda: agenda ?? [] }));
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/agenda", async (req, res, next) => {
  try {
    const parsed = addCabAgendaItemSchema.parse(req.body);
    const orgId = (req.query.organization_id as string | undefined) ?? parsed.organizationId;
    if (!orgId) throw new AppError("VALIDATION", "organizationId is required", 400);
    const supabase = getSupabaseAdmin();

    const { data: meeting, error: meetingError } = await supabase
      .from("cab_meetings")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();
    if (meetingError || !meeting)
      throw new AppError("NOT_FOUND", "CAB meeting not found", 404);

    const { data, error } = await supabase
      .from("cab_agenda_items")
      .insert({
        meeting_id: req.params.id,
        organization_id: orgId,
        change_request_id: parsed.changeRequestId,
        decision: parsed.decision,
        notes: parsed.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "cab_agenda_item.created",
      entityType: "cab_agenda_item",
      entityId: data.id,
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/agenda/:id", async (req, res, next) => {
  try {
    const parsed = updateCabAgendaItemSchema.parse(req.body);
    const orgId = req.query.organization_id as string | undefined;
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("cab_agenda_items")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current)
      throw new AppError("NOT_FOUND", "CAB agenda item not found", 404);
    if (orgId && current.organization_id !== orgId)
      throw new AppError("FORBIDDEN", "Not authorized for this organization", 403);

    const updateData: Record<string, unknown> = {};
    if (parsed.decision !== undefined) updateData.decision = parsed.decision;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes ?? null;

    const { data, error } = await supabase
      .from("cab_agenda_items")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: (current as { organization_id: string }).organization_id,
      actorUserId: req.authUser!.userId,
      action: "cab_agenda_item.updated",
      entityType: "cab_agenda_item",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

export default router;
