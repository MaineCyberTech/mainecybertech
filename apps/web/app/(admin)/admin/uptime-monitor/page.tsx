import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { StatusPill } from "@/components/admin/StatusPill";
import { createUptimeCheck } from "@/lib/module-actions";
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
  } catch (e) {
    console.error("Uptime Monitor: failed to load data", e);
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
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "url", label: "URL", required: true },
          {
            key: "checkType",
            label: "Type",
            type: "select",
            options: ["http", "https", "tcp", "ping"],
          },
          { key: "checkIntervalMinutes", label: "Interval (min)", type: "number" },
          { key: "expectedStatusCode", label: "Expected Status", type: "number" },
          { key: "timeoutSeconds", label: "Timeout (s)", type: "number" },
        ]}
        title="New Check"
        action={createUptimeCheck}
      />
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Monitors</h2>
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
                      href={`/admin/uptime-monitor/${item.id}`}
                    >
                      <p className="font-medium text-slate-50">{item.url}</p>
                    </Link>
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
