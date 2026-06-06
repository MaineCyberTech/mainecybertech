import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import ProjectTaskListV5 from "@/components/admin/ProjectTaskListV5";
import {
  reorderProjectTasks,
  addProjectTask,
  submitProjectTaskForm,
  addAdminTaskComment,
  updateAdminTaskComment,
  deleteAdminTaskComment,
  markProjectTaskCommentsRead
} from "./actions";

export const metadata = { title: "Project Details - Admin - Maine CyberTech" };

function pillBase(kind: "default" | "warning" | "danger" | "success" = "default") {
  const base = "inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] leading-none min-h-9";
  if (kind === "warning") return `${base} border border-amber-500/25 bg-amber-500/10 text-amber-300`;
  if (kind === "danger") return `${base} border border-red-500/25 bg-red-500/10 text-red-300`;
  if (kind === "success") return `${base} border border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
  return `${base} border border-white/10 bg-white/5 text-slate-300`;
}

function projectStatusClass(status: string) {
  switch (status) {
    case "completed": return pillBase("success");
    case "blocked": return pillBase("danger");
    case "client_review": return pillBase("warning");
    case "active": return pillBase("warning");
    default: return pillBase("default");
  }
}

function priorityClass(priority: string) {
  switch ((priority || "").toLowerCase()) {
    case "urgent": return pillBase("danger");
    case "high": return pillBase("warning");
    default: return pillBase("default");
  }
}

type Props = { params: Promise<{ projectId: string }> };

export default async function AdminProjectDetailPage({ params }: Props) {
  const _admin = await requireAdminAccess();
  const { projectId } = await params;
  const api = getApiClient();

  let detail: any;
  try {
    detail = await api.projects.getDetail(projectId);
  } catch {
    return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Project not found.</div>;
  }

  const project = detail.project;
  const profiles = detail.profiles ?? [];
  const rawTasks = detail.tasks ?? [];
  const rawComments = detail.comments ?? [];
  const readStates = detail.readStates ?? [];

  const profileMap = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
  const readMap = new Map<string, any>((readStates ?? []).map((row: any) => [row.task_id, row.last_seen_at]));
  const owners = [...new Set(rawTasks.map((t: any) => t.owner_id).filter(Boolean))].map((id: any) => ({ id, full_name: profileMap.get(id)?.full_name ?? null, email: profileMap.get(id)?.email ?? null }));

  const commentsByTask = new Map<string, any[]>();
  (rawComments ?? []).forEach((comment: any) => {
    const author = profileMap.get(comment.author_id);
    const list = commentsByTask.get(comment.task_id) ?? [];
    list.push({
      id: comment.id,
      body: comment.body,
      is_internal: Boolean(comment.is_internal),
      created_at: comment.created_at,
      author_name: author?.full_name ?? null,
      author_email: author?.email ?? null
    });
    commentsByTask.set(comment.task_id, list);
  });

  const tasks = (rawTasks ?? []).map((task: any) => {
    const owner = task.owner_id ? profileMap.get(task.owner_id) : null;
    const creator = task.created_by ? profileMap.get(task.created_by) : null;
    const approver = task.approved_by ? profileMap.get(task.approved_by) : null;
    const comments = commentsByTask.get(task.id) ?? [];
    const lastSeenAt = readMap.get(task.id);
    const unreadCount = comments.filter((comment: any) => !lastSeenAt || new Date(comment.created_at).getTime() > new Date(lastSeenAt).getTime()).length;
    return {
      ...task,
      owner_name: owner?.full_name ?? null,
      owner_email: owner?.email ?? null,
      created_by_name: creator?.full_name ?? null,
      created_by_email: creator?.email ?? null,
      approved_by_name: approver?.full_name ?? null,
      approved_by_email: approver?.email ?? null,
      comments,
      unread_count: unreadCount
    };
  });

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Projects", href: "/admin/projects" }, { label: project.name }]} />}
      subnav={<AdminSubnav current="projects" />}
      title={project.name}
      description={project.description ?? "Admin project workspace"}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className={projectStatusClass(project.status)}>{project.status}</span>
          <span className={priorityClass(project.priority)}>{project.priority}</span>
          {project.external_jira_project_key ? (
            <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">{project.external_jira_project_key}</span>
          ) : null}
          <Link href={`/portal/projects/${project.id}`} className="cyber-button-secondary">Open Portal</Link>
          <Link href="/admin/projects" className="cyber-button-secondary">Back to Projects</Link>
        </div>
      }
    >
      <section className="cyber-panel">
        <ProjectTaskListV5
          projectId={project.id}
          organizationId={project.organization_id}
          tasks={tasks}
          owners={owners}
          createTaskAction={addProjectTask}
          submitTaskFormAction={submitProjectTaskForm}
          reorderTasksAction={reorderProjectTasks}
          addTaskCommentAction={addAdminTaskComment}
          updateTaskCommentAction={updateAdminTaskComment}
          deleteTaskCommentAction={deleteAdminTaskComment}
          markTaskCommentsReadAction={markProjectTaskCommentsRead}
        />
      </section>
    </AdminPageShell>
  );
}
