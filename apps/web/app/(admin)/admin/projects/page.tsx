import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { createProject } from "./actions";
import AdminProjectsClient from "./AdminProjectsClient";
import { Organization, Project } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects - Admin - Maine CyberTech" };

export default async function AdminProjectsPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const projectsResult = await api.projects.list({});
  const projects = projectsResult.items ?? [];

  const orgIds = projects.map((p: Project) => p.organization_id).filter(Boolean);
  const [organizations, allOrganizations] = await Promise.all([
    orgIds.length ? api.organizations.list({ ids: orgIds }) : Promise.resolve([] as Organization[]),
    api.organizations.list(),
  ]);
  const orgMap = new Map(organizations.map((o: Organization) => [o.id, o]));

  const activeCount = projects.filter((p: Project) => p.status === "active").length;
  const completedCount = projects.filter((p: Project) => p.status === "completed").length;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Projects" }]} />
      }
      subnav={<AdminSubnav current="projects" />}
      title="Projects"
      description="Manage projects, publish tasks, and post client-visible or internal updates."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{projects.length}</p>
          <p className="text-xs text-slate-400">Total Projects</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <p className="text-2xl font-bold text-amber-400">{activeCount}</p>
          <p className="text-xs text-slate-400">Active</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
          <p className="text-xs text-slate-400">Completed</p>
        </div>
      </div>

      <AdminProjectsClient
        projects={projects}
        orgMap={Object.fromEntries(orgMap)}
        allOrganizations={allOrganizations.map((o: Organization) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
        }))}
        createProjectAction={createProject}
      />
    </AdminPageShell>
  );
}
