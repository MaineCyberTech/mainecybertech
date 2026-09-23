import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import DataErrorNote from "@/components/admin/DataErrorNote";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status Page - Portal - Maine CyberTech" };

export default async function PortalStatusPagesPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  let incidents: Array<Record<string, unknown>> = [];
  let maintenance: Array<Record<string, unknown>> = [];
  let loadFailed = false;
  try {
    const r = (await api.statusPage.components.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[status-pages/page]", error);
    loadFailed = true;
  }
  try {
    const r = (await api.statusPage.incidents.list({ organizationId: orgId })) as any;
    incidents = r.items as unknown as typeof incidents;
  } catch (error) {
    console.error("[status-pages/page]", error);
    loadFailed = true;
  }
  try {
    const r = (await api.statusPage.maintenance.list({ organizationId: orgId })) as any;
    maintenance = r.items as unknown as typeof maintenance;
  } catch (error) {
    console.error("[status-pages/page]", error);
    loadFailed = true;
  }

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "operational" || s === "healthy") return "bg-emerald-500/10 text-emerald-400";
    if (s === "degraded") return "bg-amber-500/10 text-amber-400";
    if (s === "down" || s === "outage") return "bg-red-500/10 text-red-400";
    if (s === "maintenance") return "bg-blue-500/10 text-blue-400";
    return "bg-white/5 text-slate-400";
  };

  return (
    <div className="space-y-6" role="region" aria-label="Status Page">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Status Page" }]}
      />
      <PortalSubnav current="status-pages" />
      <h1 className="text-2xl font-semibold text-slate-50">Status Page</h1>
      {loadFailed ? <DataErrorNote what="status data" /> : null}
      <p className="text-sm text-slate-400">Current operational status of all services.</p>
      <Link
        href={`/status/${orgId}`}
        className="inline-block text-sm text-emerald-500 hover:text-emerald-400"
      >
        View public status page &rarr;
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => (
          <div
            key={String(c.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(c.name)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {String(c.component_type || "Service")}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(String(c.status || "unknown"))}`}
              >
                {String(c.status || "Unknown")}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No status components defined.</p>
        )}
      </div>

      <section className="space-y-3" aria-label="Active Incidents">
        <h2 className="text-lg font-medium text-slate-50">Active Incidents</h2>
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={String(inc.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-50">{String(inc.title)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Severity: {String(inc.severity)} &bull; Started:{" "}
                    {new Date(String(inc.started_at)).toISOString().slice(0, 16).replace("T", " ")}{" "}
                    UTC
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(String(inc.status || "unknown"))}`}
                >
                  {String(inc.status)}
                </span>
              </div>
            </div>
          ))}
          {incidents.length === 0 && <p className="text-sm text-slate-400">No active incidents.</p>}
        </div>
      </section>

      <section className="space-y-3" aria-label="Scheduled Maintenance">
        <h2 className="text-lg font-medium text-slate-50">Scheduled Maintenance</h2>
        <div className="space-y-3">
          {maintenance.map((m) => (
            <div
              key={String(m.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <p className="font-medium text-slate-50">{String(m.title)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(String(m.scheduled_start)).toISOString().slice(0, 16).replace("T", " ")} →{" "}
                {new Date(String(m.scheduled_end)).toISOString().slice(0, 16).replace("T", " ")} UTC
              </p>
            </div>
          ))}
          {maintenance.length === 0 && (
            <p className="text-sm text-slate-400">No maintenance scheduled.</p>
          )}
        </div>
      </section>

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
