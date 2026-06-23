import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { createNotification, notifyAndEmail } from "../lib/notify";
import {
  createTicketSchema,
  updateTicketSchema,
  addTicketCommentSchema,
  updateTicketCommentSchema,
} from "../validators/ticket";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const format = (req.query.format as string) || "csv";

    let query = supabase.from("tickets").select("*");

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const rows = data ?? [];

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tickets-export-${Date.now()}.json"`,
      );
      res.json(rows);
      return;
    }

    const headers = [
      "id",
      "organization_id",
      "title",
      "description",
      "status",
      "priority",
      "category",
      "source",
      "assigned_to",
      "external_jsm_issue_key",
      "labels",
      "resolution",
      "created_at",
      "updated_at",
    ];
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const vals = headers.map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      });
      csvRows.push(vals.join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tickets-export-${Date.now()}.csv"`,
    );
    res.send(csvRows.join("\n"));
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 25),
    );
    const offset = (page - 1) * limit;

    let query = supabase.from("tickets").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const {
      data: tickets,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: tickets ?? [],
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
      .from("tickets")
      .select("*, ticket_comments(*)")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      throw new AppError("NOT_FOUND", "Ticket not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createTicketSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        description: parsed.description ?? null,
        priority: parsed.priority,
        category: parsed.category ?? null,
        source: parsed.source,
        status: "new",
        created_by: req.authUser!.userId,
        external_jsm_issue_key: parsed.externalJsmIssueKey ?? null,
        labels: parsed.labels ?? null,
        resolution: parsed.resolution ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "ticket.create",
      entityType: "ticket",
      entityId: data.id,
      metadata: { title: parsed.title },
    });

    const { data: adminMembers } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("organization_id", parsed.organizationId)
      .eq("role", "admin");

    if (adminMembers?.length) {
      const adminIds = adminMembers
        .map((m: any) => m.user_id)
        .filter((id: string) => id !== req.authUser!.userId);
      if (adminIds.length) {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", adminIds);

        for (const profile of admins ?? []) {
          await createNotification({
            userId: profile.id,
            organizationId: parsed.organizationId,
            title: "New Ticket Created",
            body: `"${parsed.title}" has been created.`,
            module: "tickets",
            moduleId: data.id,
            action: "created",
          });
        }
      }
    }

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateTicketSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined)
      updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.assignedTo !== undefined)
      updateData.assigned_to = parsed.assignedTo;
    if (parsed.externalJsmIssueKey !== undefined)
      updateData.external_jsm_issue_key = parsed.externalJsmIssueKey;
    if (parsed.labels !== undefined) updateData.labels = parsed.labels;
    if (parsed.resolution !== undefined)
      updateData.resolution = parsed.resolution;

    const { data, error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Ticket not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "ticket.update",
      entityType: "ticket",
      entityId: data.id,
      metadata: parsed,
    });

    if (parsed.assignedTo) {
      const { data: assignee } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", parsed.assignedTo)
        .single();

      if (assignee) {
        await notifyAndEmail({
          userId: assignee.id,
          organizationId: data.organization_id,
          title: "Ticket Assigned to You",
          body: `"${data.title}" has been assigned to you by ${req.authUser!.email}.`,
          module: "tickets",
          moduleId: data.id,
          action: "assigned",
          email: assignee.email,
        });
      }
    }

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const parsed = addTicketCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: req.params.id,
        organization_id: parsed.organizationId,
        author_id: req.authUser!.userId,
        body: parsed.body,
        is_internal: parsed.isInternal,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "ticket.comment.add",
      entityType: "ticket_comment",
      entityId: data.id,
    });

    const { data: ticket } = await supabase
      .from("tickets")
      .select("title, submitted_by, assigned_to")
      .eq("id", req.params.id)
      .single();

    if (ticket) {
      const notifyIds = [ticket.submitted_by, ticket.assigned_to]
        .filter(Boolean)
        .filter((id: string) => id !== req.authUser!.userId);
      const uniqueIds = [...new Set(notifyIds)];
      if (uniqueIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", uniqueIds);

        for (const profile of profiles ?? []) {
          await notifyAndEmail({
            userId: profile.id,
            organizationId: parsed.organizationId,
            title: "New Comment on Ticket",
            body: `${req.authUser!.email} commented on "${ticket.title}": "${parsed.body.slice(0, 100)}${parsed.body.length > 100 ? "..." : ""}"`,
            module: "tickets",
            moduleId: req.params.id,
            action: "comment",
            email: profile.email,
          });
        }
      }
    }

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const parsed = updateTicketCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from("ticket_comments")
      .select("id, author_id, organization_id, body")
      .eq("id", req.params.commentId)
      .eq("ticket_id", req.params.id)
      .single();

    if (fetchError || !existing)
      throw new AppError("NOT_FOUND", "Comment not found", 404);

    // 5-minute edit window check
    const { data: comment } = await supabase
      .from("ticket_comments")
      .select("created_at")
      .eq("id", req.params.commentId)
      .single();

    if (comment) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (new Date(comment.created_at) < fiveMinAgo)
        throw new AppError(
          "FORBIDDEN",
          "Comment can only be edited within 5 minutes of posting",
          403,
        );
    }

    const { data, error } = await supabase
      .from("ticket_comments")
      .update({ body: parsed.body, edited_at: new Date().toISOString() })
      .eq("id", req.params.commentId)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: existing.organization_id,
      actorUserId: req.authUser!.userId,
      action: "ticket.comment.update",
      entityType: "ticket_comment",
      entityId: existing.id,
      metadata: { previousBody: existing.body },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/bulk", requireOrgAccess, async (req, res, next) => {
  try {
    const { ids, status, priority } = req.body as {
      ids?: string[];
      status?: string;
      priority?: string;
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError("VALIDATION", "ids array is required", 400);
    }
    if (!status && !priority) {
      throw new AppError("VALIDATION", "status or priority is required", 400);
    }

    const supabase = getSupabaseAdmin();
    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const { error } = await supabase
      .from("tickets")
      .update(updateData)
      .in("id", ids);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "ticket.bulk_update",
      entityType: "ticket",
      metadata: { ids, status, priority },
    });

    res.json(success({ updated: ids.length }));
  } catch (error) {
    next(error);
  }
});

export default router;
