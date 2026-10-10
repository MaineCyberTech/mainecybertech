import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { requirePermission } from "../middleware/permissions";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { createNotification, notifyAndEmail } from "../lib/notify";
import { dispatchWebhook } from "../lib/webhook-dispatcher";
import { isPlatformAdminKey, PLATFORM_ADMIN_KEYS, roleKeyOf } from "../lib/roles";
import { assertDeleteConfirmed } from "../lib/delete-confirm";
import {
  applyOrgScope,
  applyRequestedOrg,
  NO_ORG_MATCH,
  resolveAdminTenantScope,
  type AdminTenantScope,
} from "../lib/admin-scope";
import {
  createTicketSchema,
  updateTicketSchema,
  addTicketCommentSchema,
  updateTicketCommentSchema,
  bulkTicketUpdateSchema,
} from "../validators/ticket";
import { queryInt } from "../lib/query";
import { recordTicketCreated } from "../lib/metrics";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const ticketExportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "title" },
  { key: "description" },
  { key: "status" },
  { key: "priority" },
  { key: "category" },
  { key: "source" },
  { key: "assigned_to" },
  { key: "external_jsm_issue_key" },
  { key: "labels" },
  { key: "resolution" },
  { key: "created_at" },
  { key: "updated_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "tickets", "read");

    let query = supabase.from("tickets").select("*");

    // FILE-P2-006: exports must never default to all tenants. A genuine
    // cross-tenant admin sees every org; everyone else is limited to their
    // approved orgs, and an explicit ?organization_id may only narrow.
    const scope = await resolveAdminTenantScope(req);
    query = applyRequestedOrg(
      query,
      "organization_id",
      req.query.organization_id as string | undefined,
      scope,
    );
    query = applyOrgScope(query, "organization_id", scope);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter as never);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    // ADMIN-P2-001: every sensitive export is audit-logged (row count only,
    // never the exported content).
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "ticket.export",
      entityType: "ticket",
      metadata: { rowCount: data?.length ?? 0 },
    });

    sendExportResponse(res, data ?? [], ticketExportColumns, "tickets");
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "tickets", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, queryInt(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    let query = supabase.from("tickets").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter as never);

    const {
      data: tickets,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

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
    const orgId = req.query.organization_id as string | undefined;
    const supabase = getScopedClient(req, "tickets", "read");
    let query = supabase
      .from("tickets")
      .select("*, ticket_comments(*)")
      .eq("id", String(req.params.id));
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();

    if (error || !data) throw new AppError("NOT_FOUND", "Ticket not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", requirePermission("tickets", "create"), async (req, res, next) => {
  try {
    const parsed = createTicketSchema.parse(req.body);
    const supabase = getScopedClient(req, "tickets", "write");

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

    dispatchWebhook("ticket.created", parsed.organizationId, {
      ticketId: data.id,
      title: parsed.title,
      priority: parsed.priority,
      status: "new",
    });

    const { data: adminMembers } = await supabase
      .from("memberships")
      .select("user_id, roles!inner(key)")
      .eq("organization_id", parsed.organizationId)
      .eq("status", "approved")
      .in("roles.key", PLATFORM_ADMIN_KEYS as unknown as string[]);

    if (adminMembers?.length) {
      const adminIds = adminMembers
        .map((m: { user_id: string }) => m.user_id)
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

    recordTicketCreated();

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  requirePermission("tickets", "edit"),
  requireIfMatch,
  async (req, res, next) => {
    try {
      const parsed = updateTicketSchema.parse(req.body);
      const supabase = getScopedClient(req, "tickets", "write");
      const orgId = req.query.organization_id as string | undefined;

      let currentQuery = supabase.from("tickets").select("version").eq("id", String(req.params.id));
      if (orgId) currentQuery = currentQuery.eq("organization_id", orgId);
      const { data: current, error: fetchError } = await currentQuery.single();

      if (fetchError || !current) {
        throw new AppError("NOT_FOUND", "Ticket not found", 404);
      }

      checkVersionMatch(current.version, req.ifMatchVersion);

      const updateData: Record<string, unknown> = {};
      if (parsed.title !== undefined) updateData.title = parsed.title;
      if (parsed.description !== undefined) updateData.description = parsed.description;
      if (parsed.status !== undefined) updateData.status = parsed.status;
      if (parsed.priority !== undefined) updateData.priority = parsed.priority;
      if (parsed.category !== undefined) updateData.category = parsed.category;
      if (parsed.assignedTo !== undefined) updateData.assigned_to = parsed.assignedTo;
      if (parsed.externalJsmIssueKey !== undefined)
        updateData.external_jsm_issue_key = parsed.externalJsmIssueKey;
      if (parsed.labels !== undefined) updateData.labels = parsed.labels;
      if (parsed.resolution !== undefined) updateData.resolution = parsed.resolution;

      updateData.version = current.version + 1;

      let query = supabase
        .from("tickets")
        .update(updateData as never)
        .eq("id", String(req.params.id))
        .eq("version", current.version as number);
      if (orgId) query = query.eq("organization_id", orgId);
      const { data, error } = await query.select().single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("VERSION_CONFLICT", "Ticket was modified by another user", 409);

      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "ticket.update",
        entityType: "ticket",
        entityId: data.id,
        metadata: { ...parsed, version: data.version },
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
            email: assignee.email ?? undefined,
          });
        }
      }

      res.json(success(data));
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "tickets", "read");
    const orgId = req.query.organization_id as string | undefined;

    // Verify the ticket exists and (when scoped) belongs to the caller's org
    // before exposing its comments.
    let ticketQuery = supabase.from("tickets").select("id").eq("id", String(req.params.id));
    if (orgId) ticketQuery = ticketQuery.eq("organization_id", orgId);
    const { data: ticket, error: ticketError } = await ticketQuery.single();
    if (ticketError || !ticket) throw new AppError("NOT_FOUND", "Ticket not found", 404);

    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", String(req.params.id))
      .order("created_at", { ascending: true });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", requirePermission("tickets", "edit"), async (req, res, next) => {
  try {
    const parsed = addTicketCommentSchema.parse(req.body);
    const supabase = getScopedClient(req, "tickets", "write");
    const orgId = (req.query.organization_id ?? req.body?.organizationId) as string | undefined;

    // Verify the ticket exists AND belongs to the caller's org before
    // commenting — prevents cross-tenant comment injection and notification
    // spam into the victim org.
    let ticketQuery = supabase
      .from("tickets")
      .select("id, organization_id, title, created_by, assigned_to")
      .eq("id", String(req.params.id));
    if (orgId) ticketQuery = ticketQuery.eq("organization_id", orgId);
    const { data: ticket, error: ticketError } = await ticketQuery.single();
    if (ticketError || !ticket) throw new AppError("NOT_FOUND", "Ticket not found", 404);

    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: String(req.params.id),
        organization_id: ticket.organization_id,
        author_id: req.authUser!.userId,
        body: parsed.body,
        is_internal: parsed.isInternal,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: ticket.organization_id,
      actorUserId: req.authUser!.userId,
      action: "ticket.comment.add",
      entityType: "ticket_comment",
      entityId: data.id,
    });

    if (ticket) {
      const notifyIds: string[] = [ticket.created_by, ticket.assigned_to]
        .filter((id): id is string => typeof id === "string")
        .filter((id) => id !== req.authUser!.userId);
      const uniqueIds = [...new Set(notifyIds)];
      if (uniqueIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", uniqueIds);

        for (const profile of profiles ?? []) {
          await notifyAndEmail({
            userId: profile.id,
            organizationId: ticket.organization_id,
            title: "New Comment on Ticket",
            body: `${req.authUser!.email} commented on "${ticket.title}": "${parsed.body.slice(0, 100)}${parsed.body.length > 100 ? "..." : ""}"`,
            module: "tickets",
            moduleId: String(req.params.id),
            action: "comment",
            email: profile.email ?? undefined,
          });
        }
      }
    }

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/comments/:commentId",
  requirePermission("tickets", "edit"),
  async (req, res, next) => {
    try {
      const parsed = updateTicketCommentSchema.parse(req.body);
      const supabase = getScopedClient(req, "tickets", "write");

      const { data: existing, error: fetchError } = await supabase
        .from("ticket_comments")
        .select("id, author_id, organization_id, body, created_at")
        .eq("id", String(req.params.commentId))
        .eq("ticket_id", String(req.params.id))
        .single();

      if (fetchError || !existing) throw new AppError("NOT_FOUND", "Comment not found", 404);

      // Tenant check: the comment's ticket must belong to the comment's org,
      // and (when the caller is scoped to an org) that org must match.
      const orgId = req.query.organization_id as string | undefined;
      if (orgId && orgId !== existing.organization_id) {
        throw new AppError("FORBIDDEN", "Not authorized for this comment", 403);
      }

      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, organization_id")
        .eq("id", String(req.params.id))
        .single();
      if (!ticket || ticket.organization_id !== existing.organization_id) {
        throw new AppError("NOT_FOUND", "Comment not found", 404);
      }

      // Author check: only the comment author (or an admin of the comment's org)
      // may edit it.
      const isAuthor = existing.author_id === req.authUser!.userId;
      if (!isAuthor) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("roles!inner(id, key)")
          .eq("user_id", req.authUser!.userId)
          .eq("organization_id", existing.organization_id)
          .eq("status", "approved");

        const isOrgAdmin =
          memberships?.some((row) => isPlatformAdminKey(roleKeyOf(row.roles))) ?? false;
        if (!isOrgAdmin) {
          throw new AppError("FORBIDDEN", "Only the comment author can edit this comment", 403);
        }
      }

      // 5-minute edit window check
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (new Date(existing.created_at) < fiveMinAgo)
        throw new AppError(
          "FORBIDDEN",
          "Comment can only be edited within 5 minutes of posting",
          403,
        );

      const { data, error } = await supabase
        .from("ticket_comments")
        .update({ body: parsed.body, edited_at: new Date().toISOString() })
        .eq("id", String(req.params.commentId))
        .eq("organization_id", existing.organization_id)
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
  },
);

router.delete("/:id", requirePermission("tickets", "delete"), async (req, res, next) => {
  try {
    assertDeleteConfirmed(req.body);
    const supabase = getScopedClient(req, "tickets", "write");
    const orgId = (req.query.organization_id ?? req.body?.organizationId) as string | undefined;

    let fetchQuery = supabase
      .from("tickets")
      .select("id, organization_id")
      .eq("id", String(req.params.id));
    if (orgId) fetchQuery = fetchQuery.eq("organization_id", orgId);
    const { data: ticket, error: fetchError } = await fetchQuery.single();

    if (fetchError || !ticket) throw new AppError("NOT_FOUND", "Ticket not found", 404);

    let deleteQuery = supabase.from("tickets").delete().eq("id", String(req.params.id));
    if (orgId) deleteQuery = deleteQuery.eq("organization_id", orgId);
    const { error } = await deleteQuery;

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: ticket.organization_id,
      actorUserId: req.authUser!.userId,
      action: "ticket.delete",
      entityType: "ticket",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Resolve which of the given ticket ids belong to the caller's tenant scope.
 *
 * `bulk_update_with_version` skips its per-row `is_org_member` check when the
 * caller is service-role (`auth.uid()` is null) — which is exactly how this
 * route calls it. The ids MUST therefore be pre-filtered here, mirroring
 * `resolveOwnedDocumentIds` in routes/documents.ts.
 *
 * A genuine cross-tenant admin (`resolveAdminTenantScope().allTenants`) may
 * touch any tenant; everyone else is restricted to their own approved orgs and
 * ids outside that set are dropped before the RPC runs.
 */
async function resolveOwnedTicketIds(
  supabase: SupabaseClient,
  ticketIds: string[],
  scope: AdminTenantScope,
): Promise<string[]> {
  if (scope.allTenants) return ticketIds;
  const orgIds = scope.orgIds.length > 0 ? scope.orgIds : [NO_ORG_MATCH];
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .in("id", ticketIds)
    .in("organization_id", orgIds);
  if (error) throw new AppError("DB_ERROR", error.message, 500);
  return (data ?? []).map((t: { id: string }) => t.id);
}

router.post("/bulk", requireAdmin, async (req, res, next) => {
  try {
    const { ids, status, priority } = bulkTicketUpdateSchema.parse(req.body);

    // The bulk RPC skips its per-row org check for service-role calls, and
    // this route never referenced the org resolved by requireOrgAccess. Resolve
    // the caller's tenant scope and pre-filter the ids so a single-org admin
    // can never update another tenant's tickets (cross-tenant write).
    const scope = await resolveAdminTenantScope(req);
    const supabase = getScopedClient(req, "tickets", "write");
    const ownedIds = await resolveOwnedTicketIds(supabase, ids, scope);
    const skipped = ids.length - ownedIds.length;

    const updates = ownedIds.map((id) => {
      const data: Record<string, string> = {};
      if (status) data.status = status;
      if (priority) data.priority = priority;
      return { id, data };
    });

    const { data: results, error } = await supabase.rpc("bulk_update_with_version", {
      table_name: "tickets",
      updates,
    } as never);

    if (error) {
      if (error.message.includes("Version conflict")) {
        throw new AppError(
          "VERSION_CONFLICT",
          "This ticket was modified by someone else. Reload and try again.",
          409,
        );
      }
      throw new AppError("DB_ERROR", error.message, 500);
    }

    const resultRows = (results as unknown as { success: boolean }[] | null) ?? [];
    const successful = resultRows.filter((r) => r.success).length;
    const failed = resultRows.filter((r) => !r.success);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "ticket.bulk_update",
      entityType: "ticket",
      metadata: { ids, ownedIds, skipped, status, priority, successful, failed: failed.length },
    });

    res.json(success({ results, successful, failed: failed.length, skipped }));
  } catch (error) {
    next(error);
  }
});

export default router;
