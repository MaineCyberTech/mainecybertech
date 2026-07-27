import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uptime Monitor - Portal - Maine CyberTech" };

export default async function PortalUptimeMonitorPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.uptimeMonitor.listChecks({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

  const statusBadge = (s: string) => {
    const status = s.toLowerCase();
    if (status === "up" || status === "healthy") return "bg-emerald-500/10 text-emerald-400";
    if (status === "down" || status === "unhealthy") return "bg-red-500/10 text-red-400";
    if (status === "degraded") return "bg-amber-500/10 text-amber-400";
    return "bg-white/5 text-slate-400";
  };

  return (
    <div className="space-y-6" role="region" aria-label="Uptime Monitor">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Uptime Monitor" }]}
      />
      <PortalSubnav current="uptime-monitor" />
      <h1 className="text-2xl font-semibold text-slate-50">Uptime Monitor</h1>
      <p className="text-sm text-slate-400">Check website availability and SSL status.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((m) => (
          <div key={String(m.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="break-all font-medium text-slate-50">{String(m.url)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Type: {String(m.check_type || "HTTP")}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(String(m.status || "unknown"))}`}
              >
                {String(m.status || "Unknown")}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No monitors configured.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
