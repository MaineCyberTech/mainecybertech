"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import AvatarPill from "@/components/admin/AvatarPill";
import ConfirmIntentButton from "@/components/admin/ConfirmIntentButton";
import CommentBody from "@/components/CommentBody";

type Owner = { id: string; full_name?: string | null; email?: string | null };
type Comment = {
  id: string;
  body: string;
  is_internal?: boolean | null;
  created_at?: string | null;
  author_name?: string | null;
  author_email?: string | null;
};
type TaskRecord = {
  id: string;
  title: string;
  description?: string | null;
  details?: string | null;
  status: string;
  due_at?: string | null;
  sort_order?: number | null;
  approval_required?: boolean | null;
  approved_at?: string | null;
  approved_by_name?: string | null;
  approved_by_email?: string | null;
  owner_id?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  comments?: Comment[];
  unread_count?: number | null;
};
type TaskMutationResult = {
  ok: boolean;
  deleted?: boolean;
  taskId?: string;
  error?: string;
  task?: TaskRecord;
};
type Toast = { id: string; kind: "success" | "error" | "info"; message: string };

type Props = {
  projectId: string;
  organizationId: string;
  tasks: TaskRecord[];
  owners: Owner[];
  createTaskAction: (formData: FormData) => Promise<TaskMutationResult>;
  submitTaskFormAction: (formData: FormData) => Promise<TaskMutationResult>;
  reorderTasksAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  addTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  updateTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  deleteTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  markTaskCommentsReadAction: (formData: FormData) => Promise<TaskMutationResult>;
};

function toDateTimeLocalUtc(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
function formatDateTimeUtc(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTimeUtc(value);
}
function pillBase(kind: "default" | "warning" | "danger" | "success" = "default") {
  const base =
    "inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] leading-none min-h-9";
  if (kind === "warning")
    return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-300`;
  if (kind === "danger") return `${base} border border-red-500/25 bg-red-500/10 text-red-300`;
  if (kind === "success")
    return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
  return `${base} border border-white/10 bg-white/5 text-slate-300`;
}
function taskStatusClass(status: string) {
  switch (status) {
    case "done":
      return pillBase("success");
    case "blocked":
      return pillBase("danger");
    case "in_progress":
      return pillBase("warning");
    default:
      return pillBase("default");
  }
}
function emptyTask(): TaskRecord {
  return {
    id: `temp-${Date.now()}`,
    title: "",
    description: null,
    details: null,
    status: "todo",
    due_at: null,
    sort_order: null,
    approval_required: false,
    approved_at: null,
    approved_by_name: null,
    approved_by_email: null,
    owner_id: null,
    created_by: null,
    created_by_name: null,
    created_by_email: null,
    owner_name: null,
    owner_email: null,
    comments: [],
    unread_count: 0,
  };
}

export default function ProjectTaskListV5({
  projectId,
  organizationId,
  tasks,
  owners,
  createTaskAction,
  submitTaskFormAction,
  reorderTasksAction,
  addTaskCommentAction,
  updateTaskCommentAction,
  deleteTaskCommentAction,
  markTaskCommentsReadAction,
}: Props) {
  const [items, setItems] = useState(tasks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [isSavingOrder, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isCreatingTask, startCreateTransition] = useTransition();

  function pushToast(kind: Toast["kind"], message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 2600);
  }

  const filtered = useMemo(
    () =>
      items.filter((task) => {
        const haystack =
          `${task.title ?? ""} ${task.description ?? ""} ${task.details ?? ""} ${task.owner_name ?? ""} ${task.owner_email ?? ""}`.toLowerCase();
        const matchesText = !query.trim() || haystack.includes(query.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        const matchesOwner =
          ownerFilter === "all" ||
          task.owner_id === ownerFilter ||
          (ownerFilter === "unassigned" && !task.owner_id);
        return matchesText && matchesStatus && matchesOwner;
      }),
    [items, ownerFilter, query, statusFilter],
  );

  function replaceTask(updatedTask: TaskRecord) {
    setItems((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }
  function appendTask(task: TaskRecord) {
    setItems((prev) => [...prev, { ...task, sort_order: prev.length + 1 }]);
  }
  function replaceTempTask(tempId: string, nextTask: TaskRecord) {
    setItems((prev) => prev.map((task) => (task.id === tempId ? nextTask : task)));
  }
  function removeTask(taskId: string) {
    setItems((prev) =>
      prev
        .filter((task) => task.id !== taskId)
        .map((task, index) => ({ ...task, sort_order: index + 1 })),
    );
  }

  function moveItem(activeId: string, overId: string) {
    if (activeId === overId) return;
    const fromIndex = items.findIndex((item) => item.id === activeId);
    const toIndex = items.findIndex((item) => item.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;
    const clone = [...items];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    const normalized = clone.map((item, index) => ({ ...item, sort_order: index + 1 }));
    setItems(normalized);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("order", JSON.stringify(normalized.map((item) => item.id)));
    startTransition(async () => {
      const r = await reorderTasksAction(formData);
      if (r.ok) pushToast("info", "Task order saved.");
    });
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const tempTask = emptyTask();
    tempTask.title = String(formData.get("title") ?? "New Task").trim() || "New Task";
    tempTask.description = String(formData.get("description") ?? "").trim() || null;
    tempTask.details = String(formData.get("details") ?? "").trim() || tempTask.description;
    tempTask.status = String(formData.get("status") ?? "todo").trim() || "todo";
    tempTask.owner_id = String(formData.get("ownerId") ?? "").trim() || null;
    tempTask.due_at = String(formData.get("dueAt") ?? "").trim() || null;
    tempTask.approval_required = formData.get("approvalRequired") === "on";
    const owner = owners.find((item) => item.id === tempTask.owner_id);
    tempTask.owner_name = owner?.full_name ?? owner?.email ?? null;
    tempTask.owner_email = owner?.email ?? null;
    appendTask(tempTask);
    form.reset();

    startCreateTransition(async () => {
      const result = await createTaskAction(formData);
      if (!result?.ok || !result.task) {
        removeTask(tempTask.id);
        pushToast("error", result?.error ?? "Failed to create task.");
        return;
      }
      replaceTempTask(tempTask.id, result.task);
      pushToast("success", "Task added.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.kind === "success"
                ? pillBase("success")
                : toast.kind === "error"
                  ? pillBase("danger")
                  : pillBase("default")
            }
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="cyber-label">Search</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="cyber-input"
            placeholder="title, details, owner..."
          />
        </div>
        <div>
          <label className="cyber-label">Quick Status</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["todo", "Todo"],
              ["in_progress", "In Progress"],
              ["done", "Done"],
              ["blocked", "Blocked"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={statusFilter === value ? pillBase("warning") : pillBase("default")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="cyber-label">Owners</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOwnerFilter("all")}
              className={ownerFilter === "all" ? pillBase("warning") : pillBase("default")}
            >
              All Owners
            </button>
            <button
              type="button"
              onClick={() => setOwnerFilter("unassigned")}
              className={ownerFilter === "unassigned" ? pillBase("warning") : pillBase("default")}
            >
              Unassigned
            </button>
            {owners.map((owner) => {
              const active = ownerFilter === owner.id;
              return (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => setOwnerFilter(owner.id)}
                  className={`rounded-lg border px-3 py-2 ${active ? "border-emerald-500/50 bg-emerald-600/10" : "border-white/10 bg-[#0A1118]/60"}`}
                >
                  <AvatarPill
                    id={owner.id}
                    name={owner.full_name ?? owner.email ?? owner.id}
                    subtitle={owner.email ?? "Owner"}
                    size="sm"
                    active={active}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isSavingOrder ? <div className={pillBase("warning")}>Saving task order…</div> : null}

      <form
        onSubmit={handleCreateTask}
        className="space-y-4 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="cyber-heading text-base">Add Task</h3>
            <p className="mt-1 text-sm text-slate-400">
              New tasks are appended to the live list immediately.
            </p>
          </div>
          {isCreatingTask ? <span className={pillBase("warning")}>Saving…</span> : null}
        </div>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="cyber-label">Task Title</label>
            <input name="title" className="cyber-input" required />
          </div>
          <div>
            <label className="cyber-label">Status</label>
            <select name="status" defaultValue="todo" className="cyber-input">
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
          <div>
            <label className="cyber-label">Owner</label>
            <select name="ownerId" className="cyber-input">
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.full_name ?? owner.email ?? owner.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="cyber-label">Sort Order</label>
            <input
              name="sortOrder"
              defaultValue={String((items.length || 0) + 1)}
              className="cyber-input"
            />
          </div>
          <div>
            <label className="cyber-label">Due Date & Time</label>
            <input type="datetime-local" name="dueAt" className="cyber-input" />
          </div>
          <div className="md:col-span-2">
            <label className="cyber-label">Description</label>
            <textarea name="description" rows={2} className="cyber-input" />
          </div>
          <div className="md:col-span-2">
            <label className="cyber-label">Details</label>
            <textarea name="details" rows={3} className="cyber-input" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="approvalRequired" />
          Approval required
        </label>
        <div>
          <button type="submit" className="cyber-button" disabled={isCreatingTask}>
            Add Task
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((task) => (
            <AdminTaskCard
              key={task.id}
              projectId={projectId}
              organizationId={organizationId}
              task={task}
              owners={owners}
              submitTaskFormAction={submitTaskFormAction}
              addTaskCommentAction={addTaskCommentAction}
              updateTaskCommentAction={updateTaskCommentAction}
              deleteTaskCommentAction={deleteTaskCommentAction}
              markTaskCommentsReadAction={markTaskCommentsReadAction}
              onTaskReplaced={replaceTask}
              onTaskDeleted={removeTask}
              onDragStart={setDragId}
              dragId={dragId}
              onDropped={moveItem}
              onDragEnd={() => setDragId(null)}
              pushToast={pushToast}
            />
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
            No tasks match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

type CardProps = {
  projectId: string;
  organizationId: string;
  task: TaskRecord;
  owners: Owner[];
  dragId: string | null;
  submitTaskFormAction: (formData: FormData) => Promise<TaskMutationResult>;
  addTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  updateTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  deleteTaskCommentAction: (formData: FormData) => Promise<TaskMutationResult>;
  markTaskCommentsReadAction: (formData: FormData) => Promise<TaskMutationResult>;
  onTaskReplaced: (task: TaskRecord) => void;
  onTaskDeleted: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDropped: (activeId: string, overId: string) => void;
  onDragEnd: () => void;
  pushToast: (kind: Toast["kind"], message: string) => void;
};

function AdminTaskCard({
  projectId,
  organizationId,
  task,
  owners,
  dragId,
  submitTaskFormAction,
  addTaskCommentAction,
  updateTaskCommentAction,
  deleteTaskCommentAction,
  markTaskCommentsReadAction,
  onTaskReplaced,
  onTaskDeleted,
  onDragStart,
  onDropped,
  onDragEnd,
  pushToast,
}: CardProps) {
  const [taskState, setTaskState] = useState(task);
  const [isSubmitting, startTransition] = useTransition();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [editingCommentInternal, setEditingCommentInternal] = useState(false);
  const unreadCount = Math.max(0, taskState.unread_count ?? 0);

  async function persistCommentsRead() {
    if (unreadCount <= 0) return;
    const snapshot = taskState;
    const optimisticTask = { ...taskState, unread_count: 0 };
    setTaskState(optimisticTask);
    onTaskReplaced(optimisticTask);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("organizationId", organizationId);
    formData.set("taskId", taskState.id);
    startTransition(async () => {
      const result = await markTaskCommentsReadAction(formData);
      if (!result?.ok || !result.task) {
        setTaskState(snapshot);
        onTaskReplaced(snapshot);
        return;
      }
      setTaskState(result.task);
      onTaskReplaced(result.task);
    });
  }

  async function handleTaskFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | HTMLInputElement
      | null;
    const formData = new FormData(form);
    if (submitter?.name) formData.set(submitter.name, submitter.value);
    const intent = submitter?.value ?? "save";
    const snapshot = taskState;
    const optimisticPatch: Partial<TaskRecord> = {};
    if (intent === "save") {
      optimisticPatch.title = String(formData.get("title") ?? taskState.title);
      optimisticPatch.description =
        String(formData.get("description") ?? taskState.description ?? "") || null;
      optimisticPatch.details = String(formData.get("details") ?? taskState.details ?? "") || null;
      optimisticPatch.status = String(formData.get("status") ?? taskState.status);
      optimisticPatch.owner_id =
        String(formData.get("ownerId") ?? taskState.owner_id ?? "") || null;
      optimisticPatch.due_at = String(formData.get("dueAt") ?? taskState.due_at ?? "") || null;
      const owner = owners.find((item) => item.id === optimisticPatch.owner_id);
      optimisticPatch.owner_name =
        owner?.full_name ?? (optimisticPatch.owner_id ? (owner?.email ?? null) : null);
      optimisticPatch.owner_email = owner?.email ?? null;
      optimisticPatch.approval_required = formData.get("approvalRequired") === "on";
      if (!optimisticPatch.approval_required) {
        optimisticPatch.approved_at = null;
        optimisticPatch.approved_by_name = null;
        optimisticPatch.approved_by_email = null;
      }
    }
    if (intent === "resetApproval") {
      optimisticPatch.approved_at = null;
      optimisticPatch.approved_by_name = null;
      optimisticPatch.approved_by_email = null;
    }
    if (Object.keys(optimisticPatch).length > 0) {
      const optimisticTask = { ...taskState, ...optimisticPatch };
      setTaskState(optimisticTask);
      onTaskReplaced(optimisticTask);
    }
    startTransition(async () => {
      const result = await submitTaskFormAction(formData);
      if (!result?.ok) {
        pushToast("error", result?.error ?? "Task update failed.");
        setTaskState(snapshot);
        onTaskReplaced(snapshot);
        return;
      }
      if (result.deleted && result.taskId) {
        onTaskDeleted(result.taskId);
        pushToast("success", "Task deleted.");
        return;
      }
      if (result.task) {
        setTaskState(result.task);
        onTaskReplaced(result.task);
      }
      if (intent === "resetApproval") pushToast("success", "Approval reset.");
      if (intent === "save") pushToast("success", "Task saved.");
    });
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get("body") ?? "").trim();
    const isInternal = formData.get("isInternal") === "on";
    if (!body) return;
    const snapshot = taskState;
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      body,
      is_internal: isInternal,
      created_at: new Date().toISOString(),
      author_name: "Saving...",
      author_email: null,
    };
    const optimisticTask = {
      ...taskState,
      comments: [...(taskState.comments ?? []), tempComment],
      unread_count: 0,
    };
    setTaskState(optimisticTask);
    onTaskReplaced(optimisticTask);
    form.reset();
    startTransition(async () => {
      const result = await addTaskCommentAction(formData);
      if (!result?.ok || !result.task) {
        pushToast("error", result?.error ?? "Comment failed.");
        setTaskState(snapshot);
        onTaskReplaced(snapshot);
        return;
      }
      setTaskState(result.task);
      onTaskReplaced(result.task);
      pushToast("success", "Comment added.");
    });
  }

  function beginEditComment(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
    setEditingCommentInternal(Boolean(comment.is_internal));
  }

  async function handleUpdateComment(commentId: string) {
    const snapshot = taskState;
    const optimisticTask = {
      ...taskState,
      comments: (taskState.comments ?? []).map((comment) =>
        comment.id === commentId
          ? { ...comment, body: editingCommentBody, is_internal: editingCommentInternal }
          : comment,
      ),
    };
    setTaskState(optimisticTask);
    onTaskReplaced(optimisticTask);
    setEditingCommentId(null);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("taskId", taskState.id);
    formData.set("commentId", commentId);
    formData.set("body", editingCommentBody);
    if (editingCommentInternal) formData.set("isInternal", "on");
    startTransition(async () => {
      const result = await updateTaskCommentAction(formData);
      if (!result?.ok || !result.task) {
        pushToast("error", result?.error ?? "Comment update failed.");
        setTaskState(snapshot);
        onTaskReplaced(snapshot);
        return;
      }
      setTaskState(result.task);
      onTaskReplaced(result.task);
      pushToast("success", "Comment updated.");
    });
  }

  async function handleDeleteComment(commentId: string) {
    const confirmed = window.confirm("Delete this comment? This action cannot be undone.");
    if (!confirmed) return;
    const snapshot = taskState;
    const optimisticTask = {
      ...taskState,
      comments: (taskState.comments ?? []).filter((comment) => comment.id !== commentId),
      unread_count: Math.max(0, (taskState.unread_count ?? 0) - 1),
    };
    setTaskState(optimisticTask);
    onTaskReplaced(optimisticTask);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("taskId", taskState.id);
    formData.set("commentId", commentId);
    startTransition(async () => {
      const result = await deleteTaskCommentAction(formData);
      if (!result?.ok || !result.task) {
        pushToast("error", result?.error ?? "Comment delete failed.");
        setTaskState(snapshot);
        onTaskReplaced(snapshot);
        return;
      }
      setTaskState(result.task);
      onTaskReplaced(result.task);
      pushToast("success", "Comment deleted.");
    });
  }

  return (
    <details
      className="rounded-lg border border-white/10 bg-[#0A1118]/60 open:border-emerald-600/20 open:bg-[#0A1118]/80"
      draggable
      onToggle={(event) => {
        const open = (event.currentTarget as HTMLDetailsElement).open;
        if (open) persistCommentsRead();
      }}
      onDragStart={() => onDragStart(taskState.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (dragId) onDropped(dragId, taskState.id);
        onDragEnd();
      }}
      onDragEnd={onDragEnd}
    >
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-slate-500" aria-hidden="true">
                ↕
              </span>
              <AvatarPill
                name={taskState.owner_name ?? taskState.owner_email ?? "Unassigned"}
                subtitle={taskState.owner_id ? "Assignee" : "Unassigned"}
                size="sm"
              />
              <p className="truncate font-medium text-slate-50">{taskState.title}</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {taskState.details ?? taskState.description ?? "No task details provided."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">
                Due: {formatDateTimeUtc(taskState.due_at)}
              </span>
              {taskState.approval_required ? (
                <span className={pillBase("warning")}>Approval Required</span>
              ) : null}
              {taskState.approved_at ? <span className={pillBase("success")}>Approved</span> : null}
              {taskState.comments && taskState.comments.length > 0 ? (
                <span className={pillBase("default")}>Comments {taskState.comments.length}</span>
              ) : null}
              {unreadCount > 0 ? (
                <span
                  className={`${pillBase("warning")} shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_0_18px_rgba(245,158,11,0.18)]`}
                >
                  Unread {unreadCount}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={taskStatusClass(taskState.status)}>{taskState.status}</span>
          </div>
        </div>
      </summary>

      <div className="border-t border-white/10 px-4 pb-4 pt-4">
        <p className="mb-2 text-xs text-slate-500">
          Created by:{" "}
          {taskState.created_by_name ??
            taskState.created_by_email ??
            taskState.created_by ??
            "Unknown"}
        </p>
        {taskState.approved_at ? (
          <p
            className="mb-4 text-xs text-slate-500"
            title={formatDateTimeUtc(taskState.approved_at)}
          >
            Approved by: {taskState.approved_by_name ?? taskState.approved_by_email ?? "Unknown"} •{" "}
            {formatRelativeTime(taskState.approved_at)}
          </p>
        ) : (
          <p className="mb-4 text-xs text-slate-500">Approval state: Not approved</p>
        )}

        <form onSubmit={handleTaskFormSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="taskId" value={taskState.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="cyber-label">Task Title</label>
              <input name="title" defaultValue={taskState.title} className="cyber-input" />
            </div>
            <div>
              <label className="cyber-label">Status</label>
              <select name="status" defaultValue={taskState.status} className="cyber-input">
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
              </select>
            </div>
            <div>
              <label className="cyber-label">Owner</label>
              <select
                name="ownerId"
                defaultValue={taskState.owner_id ?? ""}
                className="cyber-input"
              >
                <option value="">Unassigned</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name ?? owner.email ?? owner.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="cyber-label">Sort Order</label>
              <input
                name="sortOrder"
                defaultValue={String(taskState.sort_order ?? 0)}
                className="cyber-input"
              />
            </div>
            <div>
              <label className="cyber-label">Due Date & Time</label>
              <input
                type="datetime-local"
                name="dueAt"
                defaultValue={toDateTimeLocalUtc(taskState.due_at)}
                className="cyber-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="cyber-label">Description</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={taskState.description ?? ""}
                className="cyber-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="cyber-label">Details</label>
              <textarea
                name="details"
                rows={3}
                defaultValue={taskState.details ?? ""}
                className="cyber-input"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="approvalRequired"
              defaultChecked={Boolean(taskState.approval_required)}
            />
            Approval required
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                name="intent"
                value="save"
                className="cyber-button-secondary"
                disabled={isSubmitting}
              >
                Save Task
              </button>
              {taskState.approved_at ? (
                <button
                  type="submit"
                  name="intent"
                  value="resetApproval"
                  className="cyber-button-secondary"
                  disabled={isSubmitting}
                >
                  Reset Approval
                </button>
              ) : null}
            </div>
            <ConfirmIntentButton
              label="Delete Task"
              iconOnly
              title="Delete Task"
              confirmMessage={`Delete task "${taskState.title}"? This cannot be undone.`}
              className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-red-300 transition hover:border-red-500/40 hover:bg-red-500/15"
            />
          </div>
        </form>

        <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-[#0A1118]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Task Comments
          </p>
          {taskState.comments && taskState.comments.length > 0 ? (
            taskState.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {comment.is_internal ? (
                      <span className={pillBase("warning")}>Internal Only</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => beginEditComment(comment)}
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={editingCommentBody}
                      onChange={(event) => setEditingCommentBody(event.target.value)}
                      rows={3}
                      className="cyber-input"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={editingCommentInternal}
                        onChange={(event) => setEditingCommentInternal(event.target.checked)}
                      />
                      Internal only (hidden from client)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={isSubmitting}
                      >
                        Save Comment
                      </button>
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => setEditingCommentId(null)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CommentBody
                      body={comment.body}
                      className="markdown-body mt-2 text-sm text-slate-300"
                    />
                    <p
                      className="mt-2 text-xs text-slate-500"
                      title={formatDateTimeUtc(comment.created_at)}
                    >
                      {comment.author_name ?? comment.author_email ?? "Unknown"} •{" "}
                      {formatRelativeTime(comment.created_at)}
                    </p>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">No comments yet.</div>
          )}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="taskId" value={taskState.id} />
            <textarea
              name="body"
              rows={3}
              className="cyber-input"
              placeholder="Add an internal or client-facing comment about this task..."
              required
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="isInternal" />
              Internal only (hidden from client)
            </label>
            <button type="submit" className="cyber-button-secondary" disabled={isSubmitting}>
              Add Comment
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
