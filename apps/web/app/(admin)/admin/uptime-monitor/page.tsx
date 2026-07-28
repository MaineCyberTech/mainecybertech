import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import { StatusPill } from "@/components/admin/StatusPill";
export const dynamic = "force-dynamic";
export const metadata = { title: "Uptime Monitor - Admin - Maine CyberTech" };

export default async function UptimeMonitorPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let items = [] as Array<{
    id: string;
    url: string;
    check_type: string;
    status: string;
    created_at: string;
  }>;

  try {
    const r = (await api.uptimeMonitor.listChecks({})) as any;
    items = r.items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Uptime Monitor" }]} />
      }
      subnav={<AdminSubnav current="uptime-monitor" />}
      title="Uptime Monitor"
      description="Monitor website availability, response times, and SSL certificate expiry."
      actions={null}
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Monitors</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.url}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.check_type} &bull;{" "}
                      {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={item.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📡"
              title="No monitors configured"
              description="Add your first uptime monitor to track website availability, response times, and SSL certificate health."
              actionHref="/admin/uptime-monitor"
              actionLabel="Refresh"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
