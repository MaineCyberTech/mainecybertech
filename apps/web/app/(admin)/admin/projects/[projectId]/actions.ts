"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

type TaskComment = {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string | null;
  author_name: string | null;
  author_email: string | null;
};
type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  details: string | null;
  status: string;
  due_at: string | null;
  sort_order: number | null;
  approval_required: boolean | null;
  approved_at: string | null;
  approved_by_name: string | null;
  approved_by_email: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  owner_name: string | null;
  owner_email: string | null;
  comments: TaskComment[];
  unread_count: number;
};
type TaskMutationResult = {
  ok: boolean;
  deleted?: boolean;
  taskId?: string;
  error?: string;
  task?: TaskRecord;
};

function parseOrder(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function fetchTaskRecord(
  projectId: string,
  taskId: string,
  currentUserId?: string | null,
): Promise<TaskRecord | null> {
  const api = getApiClient();

  const allTasks = (await api.projects.listTasks(projectId)) as any[];
  const task = allTasks.find((t) => t.id === taskId);
  if (!task) return null;

  const comments = (await api.projects.listTaskComments(projectId, { taskIds: [taskId] })) as any[];

  let lastSeenAt: string | null = null;
  if (currentUserId) {
    const readStates = (await api.projects.listReadStates(projectId, {
      taskIds: [taskId],
    })) as any[];
    const state = readStates.find((rs: any) => rs.user_id === currentUserId);
    lastSeenAt = state?.last_seen_at ?? null;
  }

  const profileIds = Array.from(
    new Set(
      [
        task.created_by,
        task.owner_id,
        task.approved_by,
        ...(comments ?? []).map((c: any) => c.author_id),
      ].filter(Boolean),
    ),
  );

  const profiles = profileIds.length
    ? ((await api.profiles.list({ ids: profileIds })) as any[])
    : [];

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
  const owner = task.owner_id ? profileMap.get(task.owner_id) : null;
  const creator = task.created_by ? profileMap.get(task.created_by) : null;
  const approver = task.approved_by ? profileMap.get(task.approved_by) : null;
  const unreadCount = currentUserId
    ? (comments ?? []).filter(
        (c: any) =>
          !lastSeenAt || new Date(c.created_at).getTime() > new Date(lastSeenAt).getTime(),
      ).length
    : 0;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    details: task.details,
    status: task.status,
    due_at: task.due_at,
    sort_order: task.sort_order,
    approval_required: task.approval_required,
    approved_at: task.approved_at,
    approved_by_name: approver?.full_name ?? null,
    approved_by_email: approver?.email ?? null,
    owner_id: task.owner_id,
    created_by: task.created_by,
    created_by_name: creator?.full_name ?? null,
    created_by_email: creator?.email ?? null,
    owner_name: owner?.full_name ?? null,
    owner_email: owner?.email ?? null,
    unread_count: unreadCount,
    comments: (comments ?? []).map((c: any) => {
      const author = profileMap.get(c.author_id);
      return {
        id: c.id,
        body: c.body,
        is_internal: Boolean(c.is_internal),
        created_at: c.created_at,
        author_name: author?.full_name ?? null,
        author_email: author?.email ?? null,
      };
    }),
  };
}

export async function reorderProjectTasks(formData: FormData) {
  try {
    const api = getApiClient();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const order = parseOrder(String(formData.get("order") ?? "[]"));
    if (!projectId || order.length === 0)
      return { ok: false as const, error: "Project ID and task order are required." };

    await api.projects.reorderTasks(projectId, { order });
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function addProjectTask(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const status = String(formData.get("status") ?? "todo").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const dueAt = String(formData.get("dueAt") ?? "").trim();
  const approvalRequired = formData.get("approvalRequired") === "on";
  const ownerIdRaw = String(formData.get("ownerId") ?? "").trim();
  const ownerId = ownerIdRaw || null;
  if (!projectId || !organizationId || !title)
    return { ok: false, error: "Project, organization, and task title are required." };

  const data = await api.projects.addTask(projectId, {
    title,
    description: description || null,
    details: details || null,
    status,
    sortOrder,
    dueAt: dueAt || null,
    approvalRequired,
    ownerId,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  const task = await fetchTaskRecord(projectId, data.id, null);
  return { ok: true, taskId: data.id, task: task ?? undefined };
}

export async function updateProjectTask(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const status = String(formData.get("status") ?? "todo").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const dueAt = String(formData.get("dueAt") ?? "").trim();
  const approvalRequired = formData.get("approvalRequired") === "on";
  const ownerIdRaw = String(formData.get("ownerId") ?? "").trim();
  const ownerId = ownerIdRaw || null;
  if (!taskId || !title) return { ok: false, taskId, error: "Task ID and title are required." };

  await api.projects.updateTask(projectId, taskId, {
    ownerId,
    title,
    description: description || null,
    details: details || null,
    status,
    sortOrder,
    dueAt: dueAt || null,
    approvalRequired,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  const task = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: task ?? undefined };
}

export async function resetProjectTaskApproval(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !taskId)
    return { ok: false, taskId, error: "Project ID and task ID are required." };

  await api.projects.updateTask(projectId, taskId, { approvedBy: null, approvedAt: null });
  revalidatePath(`/admin/projects/${projectId}`);
  const task = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: task ?? undefined };
}

export async function deleteProjectTask(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !taskId)
    return { ok: false, taskId, error: "Project ID and task ID are required." };

  await api.projects.removeTask(projectId, taskId);
  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true, deleted: true, taskId };
}

export async function addAdminTaskComment(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!projectId || !taskId || !body)
    return { ok: false, taskId, error: "Project, task, and body are required." };

  await api.projects.addTaskComment(projectId, taskId, { body, isInternal });
  revalidatePath(`/admin/projects/${projectId}`);
  const updatedTask = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: updatedTask ?? undefined };
}

export async function updateAdminTaskComment(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const commentId = String(formData.get("commentId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!projectId || !taskId || !commentId || !body)
    return { ok: false, taskId, error: "Project, task, comment, and body are required." };

  await api.projects.updateTaskComment(projectId, taskId, commentId, { body, isInternal });
  revalidatePath(`/admin/projects/${projectId}`);
  const updatedTask = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: updatedTask ?? undefined };
}

export async function deleteAdminTaskComment(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const commentId = String(formData.get("commentId") ?? "").trim();
  if (!projectId || !taskId || !commentId)
    return { ok: false, taskId, error: "Project, task, and comment are required." };

  await api.projects.removeTaskComment(projectId, taskId, commentId);
  revalidatePath(`/admin/projects/${projectId}`);
  const updatedTask = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: updatedTask ?? undefined };
}

export async function markProjectTaskCommentsRead(formData: FormData): Promise<TaskMutationResult> {
  const api = getApiClient();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !organizationId || !taskId)
    return { ok: false, taskId, error: "Project, organization, and task are required." };

  await api.projects.markTaskRead(projectId, taskId, { organizationId });
  revalidatePath(`/admin/projects/${projectId}`);
  const task = await fetchTaskRecord(projectId, taskId, null);
  return { ok: true, taskId, task: task ?? undefined };
}

export async function submitProjectTaskForm(formData: FormData): Promise<TaskMutationResult> {
  const intent = String(formData.get("intent") ?? "save").trim();
  if (intent === "delete") return deleteProjectTask(formData);
  if (intent === "resetApproval") return resetProjectTaskApproval(formData);
  return updateProjectTask(formData);
}

export async function updateProjectBasics(formData: FormData) {
  try {
    const api = getApiClient();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const status = String(formData.get("status") ?? "planned").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const startsAt = String(formData.get("startsAt") ?? "").trim();
    const dueAt = String(formData.get("dueAt") ?? "").trim();
    if (!projectId || !name)
      return { ok: false as const, error: "Project ID and name are required." };

    await api.projects.update(projectId, {
      name,
      description: description || null,
      status,
      priority,
      startsAt: startsAt || null,
      dueAt: dueAt || null,
    });

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/admin/projects");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function addProjectUpdate(formData: FormData) {
  try {
    const api = getApiClient();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const isInternal = formData.get("isInternal") === "on";
    const isPinned = formData.get("isPinned") === "on";
    if (!projectId || !body)
      return { ok: false as const, error: "Project and update body are required." };

    await api.projects.addUpdate(projectId, { body, isInternal, isPinned });
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateProjectUpdate(formData: FormData) {
  try {
    const api = getApiClient();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const updateId = String(formData.get("updateId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const isInternal = formData.get("isInternal") === "on";
    const isPinned = formData.get("isPinned") === "on";
    if (!projectId || !updateId || !body)
      return { ok: false as const, error: "Project, update, and body are required." };

    await api.projects.updateUpdate(projectId, updateId, { body, isInternal, isPinned });
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteProjectUpdate(formData: FormData) {
  try {
    const api = getApiClient();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const updateId = String(formData.get("updateId") ?? "").trim();
    if (!projectId || !updateId)
      return { ok: false as const, error: "Project ID and update ID are required." };

    await api.projects.removeUpdate(projectId, updateId);
    revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function submitProjectUpdateForm(formData: FormData) {
  const intent = String(formData.get("intent") ?? "save").trim();
  if (intent === "delete") return deleteProjectUpdate(formData);
  return updateProjectUpdate(formData);
}
