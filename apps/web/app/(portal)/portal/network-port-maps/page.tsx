import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Network Port Maps - Portal - Maine CyberTech" };

export default async function PortalNetworkPortMapsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fieldServices.portMaps.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[network-port-maps/page]", error);
  }

  return (
    <div className="space-y-6" role="region" aria-label="Network Port Maps">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Network Port Maps" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Network Port Maps</h1>
      <p className="text-sm text-slate-400">
        {items.length} port map{items.length !== 1 ? "s" : ""} registered for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">
                {String(a.switch_name || "Switch")}
                {a.port_number != null ? ` : port ${String(a.port_number)}` : ""}
              </p>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
                {String(a.speed || "—")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {a.vlan_id != null ? `VLAN ${String(a.vlan_id)}` : "No VLAN"}
              {a.vlan_name ? ` (${String(a.vlan_name)})` : ""} &bull;{" "}
              {a.poe_enabled ? "PoE" : "No PoE"}
              {a.uplink ? " • Uplink" : ""}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Connected device: {String(a.connected_device || a.device_type || "—")}
            </p>
            {a.wall_jack_label ? (
              <p className="mt-1 text-xs text-slate-400">Wall jack: {String(a.wall_jack_label)}</p>
            ) : null}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No port maps available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
