import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createNetworkDiagram } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Network Diagram - Field Services - Admin" };

export default async function NetworkDiagramPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; site_name?: string }> = [];
  try {
    const r = await api.fieldServices.networkDiagrams.list({});
    items = (r as { items: typeof items }).items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Field Services", href: "/admin/field-services" },
            { label: "Network Diagram" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Network Diagram"
      description="Topology planning with device counts, VLANs, WANs, and zones."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "siteName", label: "Site Name", required: true },
          { key: "deviceCount", label: "Devices", type: "number" },
          { key: "vlanCount", label: "VLANs", type: "number" },
          { key: "wanCount", label: "WANs", type: "number" },
          { key: "wirelessZones", label: "Wireless Zones", type: "number" },
          { key: "cameraZones", label: "Camera Zones", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Network Diagram"
        action={createNetworkDiagram}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.site_name ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📐"
              title="No network diagrams"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
