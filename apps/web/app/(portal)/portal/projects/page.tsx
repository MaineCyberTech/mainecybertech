import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const metadata = { title: "Projects - Portal - Maine CyberTech" };

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

function projectStatusClass(status: string) {
  switch (status) {
    case "completed": return "cyber-pill-success inline-flex items-center justify-center leading-none min-h-9";
    case "blocked": return "cyber-pill-danger inline-flex items-center justify-center leading-none min-h-9";
    case "client_review": return "cyber-pill-warning inline-flex items-center justify-center leading-none min-h-9";
    case "active": return "cyber-pill-warning inline-flex items-center justify-center leading-none min-h-9";
    default: return "cyber-pill inline-flex items-center justify-center leading-none min-h-9";
  }
}

function priorityClass(priority: string) {
  switch ((priority || "").toLowerCase()) {
    case "urgent": return "cyber-pill-danger inline-flex items-center justify-center leading-none min-h-9";
    case "high": return "cyber-pill-warning inline-flex items-center justify-center leading-none min-h-9";
    default: return "cyber-pill inline-flex items-center justify-center leading-none min-h-9";
  }
}

export default async function PortalProjectsPage() {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Projects" }]} />
        <PortalSubnav current="projects" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">Access restricted. Please contact your administrator.</div>
      </div>
    );
  }

  const currentUser = await api.users.me();
  const currentUserId = currentUser?.userId ?? null;

  const result = await api.projects.list({ organizationId: membership.organization_id });
  const projects = result.items ?? [];

  const projectIds = projects.map((p: any) => p.id);
  const allTasks = projectIds.length
    ? await Promise.all(projectIds.map((id: string) => api.projects.listTasks(id)))
    : [];

  const tasks = allTasks.flat();
  const taskIds = tasks.map((t: any) => t.id);
  const taskMap = new Map(tasks.map((task: any) => [task.id, task.project_id]));

  const comments = taskIds.length && projectIds.length
    ? (await Promise.all(projectIds.map((id: string) =>
        api.projects.listTaskComments(id, {
          organizationId: membership.organization_id,
          isInternal: false,
        })
      ))).flat()
    : [];

  const reads = currentUserId && taskIds.length && projectIds.length
    ? (await Promise.all(projectIds.map((id: string) =>
        api.projects.listReadStates(id, {
          organizationId: membership.organization_id,
        })
      ))).flat()
    : [];

  const readMap = new Map((reads ?? []).map((row: any) => [row.task_id, row.last_seen_at]));
  const unreadByProject = new Map<string, number>();

  (comments ?? []).forEach((comment: any) => {
    const projectId = taskMap.get(comment.task_id);
    if (!projectId) return;
    const lastSeenAt = readMap.get(comment.task_id);
    const isUnread = !lastSeenAt || new Date(comment.created_at).getTime() > new Date(lastSeenAt).getTime();
    if (!isUnread) return;
    unreadByProject.set(projectId, (unreadByProject.get(projectId) ?? 0) + 1);
  });

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Projects" }]} />
      <PortalSubnav current="projects" />

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-2xl">Projects</h2>
          <div className="cyber-pill">Total {projects.length}</div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {(projects ?? []).length > 0 ? (
            (projects ?? []).map((project: any) => {
              const unreadCount = unreadByProject.get(project.id) ?? 0;
              return (
                <Link key={project.id} href={`/portal/projects/${project.id}`} className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">{project.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={projectStatusClass(project.status)}>{project.status}</span>
                      <span className={priorityClass(project.priority)}>{project.priority}</span>
                      {unreadCount > 0 ? <span className="inline-flex items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_0_18px_rgba(245,158,11,0.18)]">Unread {unreadCount}</span> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{project.description ?? "No project summary provided."}</p>
                  <p className="mt-4 text-xs text-slate-500" title={formatDateTime(project.updated_at)}>Updated {formatRelativeTime(project.updated_at)}</p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">No projects found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
