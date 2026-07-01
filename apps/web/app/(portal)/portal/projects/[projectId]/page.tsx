import Link from "next/link";
import AvatarPill from "@/components/admin/AvatarPill";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { requireAdminAccess } from "@/lib/auth/admin";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import CommentBody from "@/components/CommentBody";
import ProjectTasksWithViews from "@/components/portal/ProjectTasksWithViews";
import { addPortalProjectUpdate, approvePortalProjectTask, addPortalTaskComment } from "./actions";

export const metadata = { title: "Project Details - Portal - Maine CyberTech" };

function projectStatusClass(status: string) {
  const base =
    "inline-flex items-center justify-center leading-none min-h-9 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]";
  if (status === "completed")
    return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
  if (status === "blocked") return `${base} border border-red-500/25 bg-red-500/10 text-red-300`;
  return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-300`;
}

function priorityClass(priority: string) {
  const base =
    "inline-flex items-center justify-center leading-none min-h-9 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]";
  if ((priority || "").toLowerCase() === "urgent")
    return `${base} border border-red-500/25 bg-red-500/10 text-red-300`;
  if ((priority || "").toLowerCase() === "high")
    return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-300`;
  return `${base} border border-white/10 bg-white/5 text-slate-300`;
}

function taskStatusClass(status: string) {
  const base =
    "inline-flex items-center justify-center leading-none min-h-9 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]";
  if (status === "done")
    return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
  if (status === "blocked") return `${base} border border-red-500/25 bg-red-500/10 text-red-300`;
  if (status === "in_progress")
    return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-300`;
  return `${base} border border-white/10 bg-white/5 text-slate-300`;
}

function formatDateTime(value?: string | null) {
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
  return formatDateTime(value);
}

type Props = { params: Promise<{ projectId: string }> };

export default async function PortalProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs
          items={[
            { label: "Portal", href: "/portal/dashboard" },
            { label: "Projects", href: "/portal/projects" },
            { label: "Project" },
          ]}
        />
        <PortalSubnav current="projects" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          Access restricted.
        </div>
      </div>
    );
  }

  const currentUser = await api.users.me();
  const currentUserId = currentUser?.userId ?? null;

  let project: any;
  try {
    project = await api.projects.getDetail(projectId);
  } catch {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs
          items={[
            { label: "Portal", href: "/portal/dashboard" },
            { label: "Projects", href: "/portal/projects" },
            { label: "Project" },
          ]}
        />
        <PortalSubnav current="projects" />
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          Project not found.
        </div>
      </div>
    );
  }

  const rawTasks = project.tasks ?? [];
  const taskComments = project.comments ?? [];
  const profileMap = new Map<string, any>((project.profiles ?? []).map((p: any) => [p.id, p]));
  const readStates = project.readStates ?? [];
  const readMap = new Map(readStates.map((r: any) => [r.task_id, r.last_seen_at]));

  let isAdmin = false;
  try {
    await requireAdminAccess();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  if (currentUserId && rawTasks.length > 0) {
    await Promise.all(
      rawTasks.map((t: any) =>
        api.projects.markTaskRead(projectId, t.id, { organizationId: membership.organization_id }),
      ),
    );
  }

  const commentsByTask = new Map<string, any[]>();
  taskComments.forEach((comment: any) => {
    const list = commentsByTask.get(comment.task_id) ?? [];
    list.push(comment);
    commentsByTask.set(comment.task_id, list);
  });

  const taskListHtml = (
    <div className="space-y-4">
      {rawTasks.length > 0 ? (
        rawTasks.map((task: any) => {
          const comments = commentsByTask.get(task.id) ?? [];
          const owner = task.owner_id ? profileMap.get(task.owner_id) : null;
          const lastSeenAt = readMap.get(task.id);
          const unreadCount = comments.filter(
            (c: any) =>
              !lastSeenAt ||
              new Date(c.created_at).getTime() > new Date(lastSeenAt as string).getTime(),
          ).length;
          return (
            <details
              key={task.id}
              className="rounded-lg border border-white/10 bg-[#0A1118]/60 open:border-emerald-600/20 open:bg-[#0A1118]/80"
            >
              <summary className="cursor-pointer list-none p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <AvatarPill
                        name={owner?.full_name ?? owner?.email ?? "Unassigned"}
                        subtitle={task.owner_id ? "Assignee" : "Unassigned"}
                        size="sm"
                      />
                      <p className="font-medium text-slate-50">{task.title}</p>
                      {task.external_jira_issue_key ? (
                        <span className="shrink-0 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
                          {task.external_jira_issue_key}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {task.details ?? task.description ?? "No details."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Due: {formatDateTime(task.due_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={taskStatusClass(task.status)}>{task.status}</span>
                    {task.approval_required ? (
                      <span className="cyber-pill-warning">Approval Required</span>
                    ) : null}
                    {task.approved_at ? <span className="cyber-pill-success">Approved</span> : null}
                    {comments.length > 0 ? (
                      <span className="cyber-pill">Comments {comments.length}</span>
                    ) : null}
                    {unreadCount > 0 ? (
                      <span className="cyber-pill-warning shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_0_18px_rgba(245,158,11,0.18)]">
                        Unread {unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </summary>
              <div className="space-y-4 border-t border-white/10 px-4 pb-4 pt-4">
                <div className="rounded-lg border border-white/10 bg-[#0A1118]/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Task Details
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                    {task.details ?? task.description ?? "No details."}
                  </p>
                </div>
                {task.approval_required && !task.approved_at ? (
                  <form
                    action={async (fd) => {
                      await approvePortalProjectTask(fd);
                    }}
                  >
                    <input type="hidden" name="projectId" value={project.project.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="cyber-button-secondary">
                      Approve Task
                    </button>
                  </form>
                ) : null}
                <div className="rounded-lg border border-white/10 bg-[#0A1118]/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Comments
                  </p>
                  <div className="mt-4 space-y-3">
                    {comments.length > 0 ? (
                      comments.map((comment: any) => {
                        const author = profileMap.get(comment.author_id);
                        return (
                          <div
                            key={comment.id}
                            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-3"
                          >
                            <CommentBody
                              body={comment.body}
                              className="markdown-body text-sm text-slate-300"
                            />
                            <p
                              className="mt-2 text-xs text-slate-500"
                              title={formatDateTime(comment.created_at)}
                            >
                              {author?.full_name ?? author?.email ?? "Unknown"} &bull;{" "}
                              {formatRelativeTime(comment.created_at)}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400">No comments yet.</div>
                    )}
                  </div>
                  <form
                    action={async (fd) => {
                      await addPortalTaskComment(fd);
                    }}
                    className="mt-4 space-y-3"
                  >
                    <input type="hidden" name="projectId" value={project.project.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <textarea
                      name="body"
                      rows={3}
                      className="cyber-input"
                      placeholder="Add a comment..."
                      required
                    />
                    <button type="submit" className="cyber-button-secondary">
                      Add Comment
                    </button>
                  </form>
                </div>
              </div>
            </details>
          );
        })
      ) : (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
          No tasks published for this project yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Projects", href: "/portal/projects" },
          { label: project.project.name },
        ]}
      />
      <PortalSubnav current="projects" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
            {project.project.name}
          </h1>
          <p className="mt-3 text-slate-400">
            {project.project.description ?? "No project summary provided."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={projectStatusClass(project.project.status)}>
            {project.project.status}
          </span>
          <span className={priorityClass(project.project.priority)}>
            {project.project.priority}
          </span>
          {isAdmin ? (
            <Link href={`/admin/projects/${projectId}`} className="cyber-button-secondary">
              View in Admin
            </Link>
          ) : null}
          <Link href="/portal/projects" className="cyber-button-secondary">
            Back to Projects
          </Link>
        </div>
      </div>

      <ProjectTasksWithViews
        projectId={projectId}
        currentUserId={currentUserId}
        organizationId={membership.organization_id}
        tasks={rawTasks}
        taskListHtml={taskListHtml}
      />

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Project Updates</h2>
        <div className="mt-6 space-y-4">
          {rawTasks.length > 0 ? (
            rawTasks
              .filter((t: any) => t.updates?.length)
              .flatMap((t: any) => t.updates ?? [])
              .concat(project.project.project_updates ?? [])
              .slice(0, 20)
              .map((update: any) => {
                const author = profileMap.get(update.author_id);
                return (
                  <div
                    key={update.id}
                    className={`rounded-lg border p-4 ${update.is_pinned ? "border-amber-400/30 bg-amber-500/5 shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_0_18px_rgba(245,158,11,0.12)]" : "border-white/10 bg-[#0A1118]/60"}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-50">
                          {author?.full_name ?? author?.email ?? "Unknown Author"}
                        </p>
                        <p
                          className="text-xs text-slate-500"
                          title={formatDateTime(update.created_at)}
                        >
                          {formatRelativeTime(update.created_at)}
                        </p>
                      </div>
                      {update.is_pinned ? (
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_0_18px_rgba(245,158,11,0.12)]">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {update.body}
                    </p>
                  </div>
                );
              })
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No updates yet.
            </div>
          )}
        </div>

        <form
          action={async (fd) => {
            await addPortalProjectUpdate(fd);
          }}
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="projectId" value={project.project.id} />
          <div>
            <label className="cyber-label">Add Project Update</label>
            <textarea
              name="body"
              rows={4}
              className="cyber-input"
              placeholder="Add a project question, status check-in, or update request..."
              required
            />
          </div>
          <div>
            <button type="submit" className="cyber-button-secondary">
              Post Update
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
