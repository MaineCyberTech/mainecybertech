import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import { responseCacheNoRenew } from "../middleware/cache";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { dispatchWebhook } from "../lib/webhook-dispatcher";
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  addTaskCommentSchema,
  updateTaskCommentSchema,
  reorderTasksSchema,
  markTaskReadSchema,
  approveTaskSchema,
  portalTaskCommentSchema,
  addProjectUpdateSchema,
  updateProjectUpdateSchema,
  createPhaseSchema,
  createMilestoneSchema,
  createDependencySchema,
} from "../validators/project";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const projectExportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "name" },
  { key: "description" },
  { key: "status" },
  { key: "priority" },
  { key: "starts_at" },
  { key: "due_at" },
  { key: "external_jira_project_key" },
  { key: "created_at" },
  { key: "updated_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    let query = supabase.from("projects").select("*");

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    sendExportResponse(res, data ?? [], projectExportColumns, "projects");
  } catch (error) {
    next(error);
  }
});

router.get("/", responseCacheNoRenew(30), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("projects").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const {
      data: projects,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: projects ?? [],
      total: count ?? 0,
      page,
      limit,
    };

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/projects/compound?organization_id=X
 *
 * Portal projects dashboard data in ONE request: projects for the
 * org plus their tasks, non-internal task comments, and the caller's
 * read states. Replaces the previous N+1 pattern (list + 3 calls per
 * project) that could exhaust the per-user rate limit on orgs with
 * many projects.
 */
router.get("/compound", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;
    const injected = (req as unknown as { orgAccessInjected?: boolean }).orgAccessInjected;
    const platformAdmin = (req as unknown as { orgAccessPlatformAdmin?: boolean })
      .orgAccessPlatformAdmin;

    let projectQuery = supabase.from("projects").select("*");
    if (orgId && !(injected && platformAdmin))
      projectQuery = projectQuery.eq("organization_id", orgId);
    const { data: projects, error: projectError } = await projectQuery.order("created_at", {
      ascending: false,
    });
    if (projectError) throw new AppError("DB_ERROR", projectError.message, 500);

    const projectIds = (projects ?? []).map((p: any) => p.id);
    let taskQuery = supabase
      .from("project_tasks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (projectIds.length > 0) taskQuery = taskQuery.in("project_id", projectIds);
    const { data: tasks, error: taskError } = await taskQuery;
    if (taskError) throw new AppError("DB_ERROR", taskError.message, 500);

    const taskIds = (tasks ?? []).map((t: any) => t.id);
    let commentQuery = supabase
      .from("project_task_comments")
      .select("*")
      .eq("is_internal", false)
      .order("created_at", { ascending: true });
    if (orgId) commentQuery = commentQuery.eq("organization_id", orgId);
    if (taskIds.length > 0) commentQuery = commentQuery.in("task_id", taskIds);
    const { data: comments, error: commentError } = await commentQuery;
    if (commentError) throw new AppError("DB_ERROR", commentError.message, 500);

    let readQuery = supabase
      .from("project_task_comment_reads")
      .select("*")
      .eq("user_id", req.authUser!.userId);
    if (orgId) readQuery = readQuery.eq("organization_id", orgId);
    if (taskIds.length > 0) readQuery = readQuery.in("task_id", taskIds);
    const { data: reads, error: readError } = await readQuery;
    if (readError) throw new AppError("DB_ERROR", readError.message, 500);

    res.json(
      success({
        projects: projects ?? [],
        tasks: tasks ?? [],
        comments: comments ?? [],
        reads: reads ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

// --- Client Project Tracker (Module 12): phases, milestones, dependencies ---

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (l: string) => `_${l.toLowerCase()}`);
}

/**
 * Tenant-scope gate for project sub-routes: verifies the parent project
 * belongs to the caller's org (orgId = requireOrgAccess-injected org or the
 * caller's body org). Platform admins (no injected org) are org-agnostic by
 * design and skip the check.
 */
async function assertProjectInOrg(
  projectId: string | string[] | undefined,
  orgId: string | undefined,
): Promise<void> {
  if (!orgId || !projectId) return;
  const projectIdStr = Array.isArray(projectId) ? projectId[0] : projectId;
  if (!projectIdStr) return;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectIdStr)
    .eq("organization_id", orgId)
    .single();
  if (error || !data) throw new AppError("NOT_FOUND", "Project not found", 404);
}

function projectSubRoute(
  resource: string,
  table: string,
  createSchema: {
    parse: (body: unknown) => Record<string, unknown>;
    partial: () => { parse: (body: unknown) => Record<string, unknown> };
  },
) {
  const updateSchema = createSchema.partial();

  router.get(`/${resource}`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const projectId = req.query.project_id as string;
      if (!projectId) throw new AppError("VALIDATION", "project_id required", 400);

      await assertProjectInOrg(
        projectId,
        (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
      );

      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success({ items: data ?? [], total: count ?? 0 }));
    } catch (err) {
      next(err);
    }
  });

  router.post(`/${resource}`, async (req, res, next) => {
    try {
      const parsed = createSchema.parse(req.body) as Record<string, unknown>;
      const supabase = getSupabaseAdmin();
      const orgId = (req.query.organization_id ?? req.body?.organizationId) as
        | string
        | undefined;

      await assertProjectInOrg(parsed.projectId as string, orgId);

      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k === "projectId") continue;
        if (v !== undefined) fields[camelToSnake(k)] = v;
      }
      const { data, error } = await supabase
        .from(table)
        .insert({ ...fields, project_id: parsed.projectId })
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        organizationId: orgId ?? (req.query.organization_id as string),
        actorUserId: req.authUser!.userId,
        action: `${resource}.created`,
        entityType: resource,
        entityId: data.id,
      });

      res.status(201).json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.patch(`/${resource}/:id`, async (req, res, next) => {
    try {
      const parsed = updateSchema.parse(req.body) as Record<string, unknown>;
      const supabase = getSupabaseAdmin();
      const orgId = (req.query.organization_id ?? req.body?.organizationId) as
        | string
        | undefined;

      const { data: child, error: childError } = await supabase
        .from(table)
        .select("project_id")
        .eq("id", req.params.id)
        .single();
      if (childError || !child) throw new AppError("NOT_FOUND", `${resource} not found`, 404);
      await assertProjectInOrg(child.project_id as string, orgId);

      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined) fields[camelToSnake(k)] = v;
      }
      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(data));
    } catch (err) {
      next(err);
    }
  });

  router.delete(`/${resource}/:id`, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = (req.query.organization_id ?? req.body?.organizationId) as
        | string
        | undefined;

      const { data: child, error: childError } = await supabase
        .from(table)
        .select("project_id")
        .eq("id", req.params.id)
        .single();
      if (childError || !child) throw new AppError("NOT_FOUND", `${resource} not found`, 404);
      await assertProjectInOrg(child.project_id as string, orgId);

      const { error } = await supabase.from(table).delete().eq("id", req.params.id);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}

projectSubRoute("phases", "project_phases", createPhaseSchema as any);
projectSubRoute("milestones", "project_milestones", createMilestoneSchema as any);
projectSubRoute("dependencies", "project_dependencies", createDependencySchema as any);

router.get("/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string | undefined;
    const injected = (req as unknown as { orgAccessInjected?: boolean }).orgAccessInjected;
    const platformAdmin = (req as unknown as { orgAccessPlatformAdmin?: boolean })
      .orgAccessPlatformAdmin;
    const supabase = getSupabaseAdmin();
    let query = supabase.from("projects").select("*, project_tasks(*)").eq("id", req.params.id);
    // Platform admins are org-agnostic: honor an EXPLICIT org, but don't
    // pin them to the middleware-injected default org (which would 404
    // projects belonging to other tenants).
    if (orgId && !(injected && platformAdmin)) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();

    if (error || !data) throw new AppError("NOT_FOUND", "Project not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/detail", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string | undefined;
    const injected = (req as unknown as { orgAccessInjected?: boolean }).orgAccessInjected;
    const platformAdmin = (req as unknown as { orgAccessPlatformAdmin?: boolean })
      .orgAccessPlatformAdmin;
    const supabase = getSupabaseAdmin();

    let query = supabase.from("projects").select("*, project_tasks(*)").eq("id", req.params.id);
    if (orgId && !(injected && platformAdmin)) query = query.eq("organization_id", orgId);
    const { data: project, error: projError } = await query.single();

    if (projError || !project) throw new AppError("NOT_FOUND", "Project not found", 404);

    // Platform admins can fetch any tenant's project without an org param Ã¢â‚¬â€
    // scope the sub-queries to the project's own org in that case.
    const scopeOrgId = orgId ?? (project as { organization_id?: string }).organization_id;

    const [
      { data: memberships, error: memError },
      { data: tasks, error: tasksError },
      { data: comments, error: commentsError },
      { data: readStates, error: readsError },
    ] = await Promise.all([
      supabase
        .from("memberships")
        .select("id, user_id, role_id, status, is_billing_contact, is_security_contact")
        .eq("organization_id", scopeOrgId)
        .eq("status", "approved"),
      supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", req.params.id)
        .order("sort_order"),
      supabase
        .from("project_task_comments")
        .select("*")
        .eq("project_id", req.params.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_task_comment_reads")
        .select("task_id, last_seen_at")
        .eq("user_id", req.authUser!.userId)
        .eq("organization_id", scopeOrgId),
    ]);

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);
    if (tasksError) throw new AppError("DB_ERROR", tasksError.message, 500);
    if (commentsError) throw new AppError("DB_ERROR", commentsError.message, 500);
    if (readsError) throw new AppError("DB_ERROR", readsError.message, 500);

    const memberUserIds = (memberships ?? []).map((m: { user_id: string }) => m.user_id);
    const allUserIds = new Set<string>(memberUserIds);
    for (const t of tasks ?? []) {
      if ((t as { owner_id: string | null }).owner_id)
        allUserIds.add((t as { owner_id: string | null }).owner_id!);
    }
    for (const c of comments ?? []) {
      allUserIds.add((c as { author_id: string }).author_id);
    }

    const userIds = [...allUserIds];
    const { data: profiles, error: profError } =
      userIds.length > 0
        ? await supabase
            .from("profiles")
            .select(
              "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
            )
            .in("id", userIds)
        : { data: [], error: null };

    if (profError) throw new AppError("DB_ERROR", profError.message, 500);

    const memberRoleIds = [
      ...new Set((memberships ?? []).map((m: { role_id: string }) => m.role_id)),
    ];
    const { data: roles, error: rolesError } =
      memberRoleIds.length > 0
        ? await supabase.from("roles").select("id, key, name").in("id", memberRoleIds)
        : { data: [], error: null };

    if (rolesError) throw new AppError("DB_ERROR", rolesError.message, 500);

    res.json(
      success({
        project,
        memberships: memberships ?? [],
        profiles: profiles ?? [],
        roles: roles ?? [],
        tasks: tasks ?? [],
        comments: comments ?? [],
        readStates: readStates ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/", requirePermission("projects", "create"), async (req, res, next) => {
  try {
    const parsed = createProjectSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        description: parsed.description ?? null,
        status: parsed.status,
        priority: parsed.priority,
        starts_at: parsed.startsAt ?? null,
        due_at: parsed.dueAt ?? null,
        external_jira_project_key: parsed.externalJiraProjectKey ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "project.create",
      entityType: "project",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    dispatchWebhook("project.created", parsed.organizationId, {
      projectId: data.id,
      name: parsed.name,
      status: parsed.status,
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateProjectSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const orgId = (req.query.organization_id ?? req.body?.organizationId) as
      | string
      | undefined;

    let currentQuery = supabase.from("projects").select("version").eq("id", req.params.id);
    if (orgId) currentQuery = currentQuery.eq("organization_id", orgId);
    const { data: current, error: fetchError } = await currentQuery.single();

    if (fetchError || !current) {
      throw new AppError("NOT_FOUND", "Project not found", 404);
    }

    checkVersionMatch(current.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.startsAt !== undefined) updateData.starts_at = parsed.startsAt;
    if (parsed.dueAt !== undefined) updateData.due_at = parsed.dueAt;
    if (parsed.externalJiraProjectKey !== undefined)
      updateData.external_jira_project_key = parsed.externalJiraProjectKey;

    updateData.version = current.version + 1;

    let updateQuery = supabase
      .from("projects")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version);
    if (orgId) updateQuery = updateQuery.eq("organization_id", orgId);
    const { data, error } = await updateQuery.select().single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Project was modified by another user", 409);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.update",
      entityType: "project",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requirePermission("projects", "delete"), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !project) throw new AppError("NOT_FOUND", "Project not found", 404);

    const { error } = await supabase.from("projects").delete().eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.delete",
      entityType: "project",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", req.params.id)
      .order("sort_order");

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks", async (req, res, next) => {
  try {
    const parsed = createTaskSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { data, error } = await supabase
      .from("project_tasks")
      .insert({
        project_id: req.params.id,
        title: parsed.title,
        description: parsed.description ?? null,
        details: parsed.details ?? null,
        status: parsed.status,
        sort_order: parsed.sortOrder,
        due_at: parsed.dueAt ?? null,
        approval_required: parsed.approvalRequired,
        owner_id: parsed.ownerId ?? null,
        external_jira_issue_key: parsed.externalJiraIssueKey ?? null,
        issue_type: parsed.issueType ?? null,
        priority: parsed.priority ?? "normal",
        labels: parsed.labels ?? null,
        parent_task_id: parsed.parentTaskId ?? null,
        epic_key: parsed.epicKey ?? null,
        resolution: parsed.resolution ?? null,
        sprint: parsed.sprint ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.create",
      entityType: "project_task",
      entityId: data.id,
      metadata: { projectId: req.params.id, title: parsed.title },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/tasks/:taskId", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateTaskSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      String(req.params.id),
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { data: currentTask, error: taskFetchError } = await supabase
      .from("project_tasks")
      .select("version")
      .eq("id", req.params.taskId)
      .single();

    if (taskFetchError || !currentTask) {
      throw new AppError("NOT_FOUND", "Task not found", 404);
    }

    checkVersionMatch(currentTask.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.details !== undefined) updateData.details = parsed.details;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.sortOrder !== undefined) updateData.sort_order = parsed.sortOrder;
    if (parsed.dueAt !== undefined) updateData.due_at = parsed.dueAt;
    if (parsed.approvalRequired !== undefined)
      updateData.approval_required = parsed.approvalRequired;
    if (parsed.ownerId !== undefined) updateData.owner_id = parsed.ownerId;
    if (parsed.approvedBy !== undefined) updateData.approved_by = parsed.approvedBy;
    if (parsed.approvedAt !== undefined) updateData.approved_at = parsed.approvedAt;
    if (parsed.externalJiraIssueKey !== undefined)
      updateData.external_jira_issue_key = parsed.externalJiraIssueKey;
    if (parsed.issueType !== undefined) updateData.issue_type = parsed.issueType;
    if (parsed.priority !== undefined) updateData.priority = parsed.priority;
    if (parsed.labels !== undefined) updateData.labels = parsed.labels;
    if (parsed.parentTaskId !== undefined) updateData.parent_task_id = parsed.parentTaskId;
    if (parsed.epicKey !== undefined) updateData.epic_key = parsed.epicKey;
    if (parsed.resolution !== undefined) updateData.resolution = parsed.resolution;
    if (parsed.sprint !== undefined) updateData.sprint = parsed.sprint;

    updateData.version = currentTask.version + 1;

    const { data, error } = await supabase
      .from("project_tasks")
      .update(updateData)
      .eq("version", currentTask.version)
      .eq("id", req.params.taskId)
      .eq("project_id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Task not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.update",
      entityType: "project_task",
      entityId: data.id,
      metadata: { projectId: req.params.id, ...parsed },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/tasks/:taskId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", req.params.taskId)
      .eq("project_id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.delete",
      entityType: "project_task",
      entityId: String(req.params.taskId),
      metadata: { projectId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/tasks/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    let query = supabase.from("project_task_comments").select("*").eq("project_id", req.params.id);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const isInternal = req.query.is_internal as string | undefined;
    if (isInternal === "false") query = query.eq("is_internal", false);
    else if (isInternal === "true") query = query.eq("is_internal", true);

    const taskIds = req.query.task_ids as string | undefined;
    if (taskIds) {
      const ids = taskIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) query = query.in("task_id", ids);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks/:taskId/comments", async (req, res, next) => {
  try {
    const parsed = addTaskCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { data, error } = await supabase
      .from("project_task_comments")
      .insert({
        task_id: req.params.taskId,
        author_id: req.authUser!.userId,
        body: parsed.body,
        is_internal: parsed.isInternal,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.comment.create",
      entityType: "project_task_comment",
      entityId: data.id,
      metadata: { taskId: req.params.taskId, projectId: req.params.id },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/updates", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    const { data, error } = await supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", req.params.id)
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/updates", async (req, res, next) => {
  try {
    const parsed = addProjectUpdateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { data, error } = await supabase
      .from("project_updates")
      .insert({
        project_id: req.params.id,
        author_id: req.authUser!.userId,
        body: parsed.body,
        is_internal: parsed.isInternal,
        is_pinned: parsed.isPinned,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.update.create",
      entityType: "project_update",
      entityId: data.id,
      metadata: { projectId: req.params.id },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/updates/:updateId", async (req, res, next) => {
  try {
    const parsed = updateProjectUpdateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const updateData: Record<string, unknown> = {};
    if (parsed.body !== undefined) updateData.body = parsed.body;
    if (parsed.isInternal !== undefined) updateData.is_internal = parsed.isInternal;
    if (parsed.isPinned !== undefined) updateData.is_pinned = parsed.isPinned;

    const { data, error } = await supabase
      .from("project_updates")
      .update(updateData)
      .eq("id", req.params.updateId)
      .eq("project_id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Update not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.update.edit",
      entityType: "project_update",
      entityId: String(req.params.updateId),
      metadata: { projectId: req.params.id, ...parsed },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/updates/:updateId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    const { error } = await supabase
      .from("project_updates")
      .delete()
      .eq("id", req.params.updateId)
      .eq("project_id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.update.delete",
      entityType: "project_update",
      entityId: String(req.params.updateId),
      metadata: { projectId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/tasks/:taskId/comments/:commentId", async (req, res, next) => {
  try {
    const parsed = updateTaskCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const updateData: Record<string, unknown> = {};
    if (parsed.body !== undefined) updateData.body = parsed.body;
    if (parsed.isInternal !== undefined) updateData.is_internal = parsed.isInternal;

    const { data, error } = await supabase
      .from("project_task_comments")
      .update(updateData)
      .eq("id", req.params.commentId)
      .eq("task_id", req.params.taskId)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Comment not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.comment.edit",
      entityType: "project_task_comment",
      entityId: String(req.params.commentId),
      metadata: { taskId: req.params.taskId, projectId: req.params.id },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/tasks/:taskId/comments/:commentId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    const { error } = await supabase
      .from("project_task_comments")
      .delete()
      .eq("id", req.params.commentId)
      .eq("task_id", req.params.taskId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.comment.delete",
      entityType: "project_task_comment",
      entityId: String(req.params.commentId),
      metadata: { taskId: req.params.taskId, projectId: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/tasks/read-states", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );
    let query = supabase
      .from("project_task_comment_reads")
      .select("*")
      .eq("user_id", req.authUser!.userId);

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const taskIds = req.query.task_ids as string | undefined;
    if (taskIds) {
      const ids = taskIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) query = query.in("task_id", ids);
    }

    const { data, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks/reorder", async (req, res, next) => {
  try {
    const parsed = reorderTasksSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    for (let index = 0; index < parsed.order.length; index++) {
      const { error } = await supabase
        .from("project_tasks")
        .update({ sort_order: index + 1 })
        .eq("id", parsed.order[index])
        .eq("project_id", req.params.id);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "project.task.reorder",
      entityType: "project_task",
      metadata: { projectId: req.params.id, count: parsed.order.length },
    });

    res.json(success({ reordered: parsed.order.length }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks/:taskId/read", async (req, res, next) => {
  try {
    const parsed = markTaskReadSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    // SECURITY DEFINER RPC so the insert path bypasses RLS (a direct
    // upsert hit "new row violates row-level security policy" on hosted
    // for projects whose tasks had no prior read row).
    const { error } = await supabase.rpc("mark_task_read", {
      p_user_id: req.authUser!.userId,
      p_task_id: req.params.taskId,
      p_organization_id: parsed.organizationId,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "project.task.mark_read",
      entityType: "project_task",
      entityId: String(req.params.taskId),
      metadata: { projectId: req.params.id },
    });

    res.json(success({ marked: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks/:taskId/approve", async (req, res, next) => {
  try {
    const parsed = approveTaskSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { error } = await supabase.rpc("approve_project_task", {
      p_task_id: req.params.taskId,
      p_organization_id: parsed.organizationId,
      p_user_id: req.authUser!.userId,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "project.task.approve",
      entityType: "project_task",
      entityId: String(req.params.taskId),
      metadata: { projectId: req.params.id },
    });

    res.json(success({ approved: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tasks/:taskId/portal-comment", async (req, res, next) => {
  try {
    const parsed = portalTaskCommentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    await assertProjectInOrg(
      req.params.id,
      (req.query.organization_id ?? req.body?.organizationId) as string | undefined,
    );

    const { error } = await supabase.rpc("add_project_task_comment", {
      p_task_id: req.params.taskId,
      p_organization_id: parsed.organizationId,
      p_body: parsed.body,
      p_user_id: req.authUser!.userId,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "project.task.portal_comment",
      entityType: "project_task",
      entityId: String(req.params.taskId),
      metadata: { projectId: req.params.id },
    });

    res.status(201).json(success({ added: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
