import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import ProjectTimelineView from "@/components/portal/ProjectTimelineView";
import ProjectCalendarView from "@/components/portal/ProjectCalendarView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Timeline - Portal - Maine CyberTech" };

export default async function PortalTimelinePage() {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Timeline" }]} />
        <PortalSubnav current="projects" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">Access restricted.</div>
      </div>
    );
  }

  let projects: any[] = [];
  try {
    projects = (await api.projects.list({ organizationId: membership.organization_id })).items ?? [];
  } catch {
    projects = [];
  }

  const allTasks = (
    await Promise.all(projects.map((p: any) =>
      api.projects.listTasks(p.id).catch(() => [])
    ))
  ).flatMap((tasks, i) =>
    (tasks as any[]).map((t: any) => ({ ...t, project_id: projects[i].id }))
  );

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Timeline" }]} />
      <PortalSubnav current="projects" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Project Timeline</h1>
          <p className="mt-3 text-slate-400">Calendar and timeline view of all project tasks across your organization.</p>
        </div>
        <Link href="/portal/projects" className="cyber-button-secondary text-xs">All Projects</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{projects.length}</p>
          <p className="text-xs text-slate-500">Projects</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{allTasks.length}</p>
          <p className="text-xs text-slate-500">Total Tasks</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-emerald-400">{allTasks.filter((t: any) => !t.due_at || new Date(t.due_at) >= new Date()).length}</p>
          <p className="text-xs text-slate-500">Upcoming</p>
        </div>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Timeline</h2>
        <div className="mt-6">
          <ProjectTimelineView tasks={allTasks} projects={projects} basePath="/portal" />
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Calendar</h2>
        <div className="mt-6">
          <ProjectCalendarView tasks={allTasks} basePath="/portal" />
        </div>
      </section>
    </div>
  );
}
