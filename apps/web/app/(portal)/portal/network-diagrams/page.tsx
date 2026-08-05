import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Network Diagrams - Portal - Maine CyberTech" };

export default async function PortalNetworkDiagramsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fieldServices.networkDiagrams.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Network Diagrams">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Network Diagrams" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Network Diagrams</h1>
      <p className="text-sm text-slate-400">
        {items.length} network diagram{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={String(a.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.site_name || "Unnamed site")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Devices: {String(a.device_count ?? "N/A")} &bull; VLANs:{" "}
              {String(a.vlan_count ?? "N/A")} &bull; WANs: {String(a.wan_count ?? "N/A")} &bull;
              Wireless zones: {String(a.wireless_zones ?? "N/A")} &bull; Camera zones:{" "}
              {String(a.camera_zones ?? "N/A")}
            </p>
            {(a.updated_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Updated: {new Date(String(a.updated_at)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No network diagrams available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
