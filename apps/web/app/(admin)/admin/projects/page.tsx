import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { createProject } from "./actions";
import AdminProjectsClient from "./AdminProjectsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects - Admin - Maine CyberTech" };

export default async function AdminProjectsPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const projectsResult = await api.projects.list({});
  const projects = projectsResult.items ?? [];

  const orgIds = projects.map((p: any) => p.organization_id).filter(Boolean);
  const [organizations, allOrganizations] = await Promise.all([
    orgIds.length ? api.organizations.list({ ids: orgIds }) : Promise.resolve([] as any[]),
    api.organizations.list(),
  ]);
  const orgMap = new Map(organizations.map((o: any) => [o.id, o]));

  const activeCount = projects.filter((p: any) => p.status === "active").length;
  const completedCount = projects.filter((p: any) => p.status === "completed").length;

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Projects" }]} />}
      subnav={<AdminSubnav current="projects" />}
      title="Projects"
      description="Manage projects, publish tasks, and post client-visible or internal updates."
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{projects.length}</p>
          <p className="text-xs text-slate-500">Total Projects</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-amber-400">{activeCount}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      </div>

      <AdminProjectsClient
        projects={projects}
        orgMap={Object.fromEntries(orgMap)}
        allOrganizations={allOrganizations.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug }))}
        createProjectAction={createProject}
      />
    </AdminPageShell>
  );
}
