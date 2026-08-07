import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status Page - Portal - Maine CyberTech" };

export default async function PortalStatusPagesPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.statusPage.components.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

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
      <p className="text-sm text-slate-400">Current operational status of all services.</p>
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
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
