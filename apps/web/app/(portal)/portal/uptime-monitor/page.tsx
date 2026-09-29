import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
export const dynamic = "force-dynamic";
export const metadata = { title: "Uptime Monitor - Portal - Maine CyberTech" };

export default async function PortalUptimeMonitorPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.uptimeMonitor.listChecks({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[uptime-monitor/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Uptime Monitor">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Uptime Monitor" }]}
      />
      <PortalSubnav current="uptime-monitor" />
      {loadFailed ? <DataErrorNote what="uptime-monitor" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Uptime Monitor</h1>
      <p className="text-sm text-slate-400">Check website availability and SSL status.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((m) => (
          <div
            key={String(m.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="break-all font-medium text-slate-50">{String(m.url)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Type: {String(m.check_type || "HTTP")}
                </p>
              </div>
              <StatusPill status={String(m.status || "Unknown")} />
            </div>
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="📡" title="No monitors configured." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
