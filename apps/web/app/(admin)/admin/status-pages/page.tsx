import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import DataErrorNote from "@/components/admin/DataErrorNote";
import {
  createStatusComponent,
  createStatusIncident,
  createStatusMaintenance,
} from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Status Pages - Admin - Maine CyberTech" };

function ComponentStatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    operational: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    degraded: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    outage: "border-red-500/25 bg-red-500/10 text-red-300",
    maintenance: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  };
  const colors = colorMap[status.toLowerCase()] || "border-white/10 bg-white/5 text-slate-300";
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${colors}`}
    >
      {status}
    </span>
  );
}

export default async function StatusPagesPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let items = [] as Array<{
    id: string;
    name: string;
    component_type: string;
    status: string;
    created_at: string;
  }>;
  let incidents = [] as Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    started_at: string;
  }>;
  let maintenance = [] as Array<{
    id: string;
    title: string;
    status: string;
    scheduled_start: string;
    scheduled_end: string;
  }>;

  let loadFailed = false;
  try {
    const r = (await api.statusPage.components.list({})) as any;
    items = r.items as typeof items;
  } catch (e) {
    console.error("Status Pages: failed to load data", e);
    loadFailed = true;
  }
  try {
    const r = (await api.statusPage.incidents.list({})) as any;
    incidents = r.items as typeof incidents;
  } catch (e) {
    console.error("Status Pages: failed to load incidents", e);
  }
  try {
    const r = (await api.statusPage.maintenance.list({})) as any;
    maintenance = r.items as typeof maintenance;
  } catch (e) {
    console.error("Status Pages: failed to load maintenance", e);
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Status Pages" }]} />
      }
      subnav={<AdminSubnav current="status-pages" />}
      title="Status Pages"
      description="Manage public status components, active incidents, and scheduled maintenance."
      actions={null}
    >
      {loadFailed && <DataErrorNote what="status pages" />}
      <div className="flex flex-wrap gap-3">
        <CrudForm
          fields={[
            { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description" },
            { key: "componentType", label: "Type" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["operational", "degraded", "partial_outage", "major_outage", "maintenance"],
            },
          ]}
          title="New Component"
          action={createStatusComponent}
        />
        <CrudForm
          fields={[
            { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
            { key: "title", label: "Title", required: true },
            { key: "description", label: "Description", type: "textarea" },
            {
              key: "severity",
              label: "Severity",
              type: "select",
              options: ["minor", "major", "critical", "maintenance"],
            },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["investigating", "identified", "monitoring", "resolved"],
            },
          ]}
          title="New Incident"
          action={createStatusIncident}
        />
        <CrudForm
          fields={[
            { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
            { key: "title", label: "Title", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "scheduledStart", label: "Starts", type: "date", required: true },
            { key: "scheduledEnd", label: "Ends", type: "date", required: true },
          ]}
          title="New Maintenance"
          action={createStatusMaintenance}
        />
      </div>
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Components</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      className="transition hover:text-emerald-400"
                      href={`/admin/status-pages/${item.id}`}
                    >
                      <p className="font-medium text-slate-50">{item.name}</p>
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.component_type} &bull;{" "}
                      {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ComponentStatusPill status={item.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📊"
              title="No status components defined"
              description="Add your first status component to start building your public status page."
              actionHref="/admin/status-pages"
              actionLabel="Refresh"
            />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Active Incidents</h2>
        <div className="mt-6 space-y-3">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{inc.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {inc.severity} &bull; started{" "}
                      {new Date(inc.started_at).toISOString().slice(0, 16).replace("T", " ")} UTC
                    </p>
                  </div>
                  <ComponentStatusPill status={inc.status} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No incidents recorded.</p>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Scheduled Maintenance</h2>
        <div className="mt-6 space-y-3">
          {maintenance.length > 0 ? (
            maintenance.map((m) => (
              <div key={m.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{m.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(m.scheduled_start).toISOString().slice(0, 16).replace("T", " ")} →{" "}
                      {new Date(m.scheduled_end).toISOString().slice(0, 16).replace("T", " ")} UTC
                    </p>
                  </div>
                  <ComponentStatusPill status={m.status} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No maintenance notices scheduled.</p>
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
