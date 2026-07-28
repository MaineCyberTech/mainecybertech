import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
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

  try {
    const r = (await api.statusPage.components.list({})) as any;
    items = r.items as typeof items;
  } catch {
    /* graceful */
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
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Components</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.name}</p>
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
    </AdminPageShell>
  );
}
