import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createPortMap } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Port Map - Field Services - Admin" };

export default async function PortMapPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; switch_name?: string }> = [];
  try {
    const r = await api.fieldServices.portMaps.list({});
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
            { label: "Port Map" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Port Map"
      description="Switch port mappings with VLAN, connected device, and device type."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "switchName", label: "Switch Name", required: true },
          { key: "portNumber", label: "Port #", type: "number" },
          { key: "vlanId", label: "VLAN ID", type: "number" },
          { key: "vlanName", label: "VLAN Name" },
          { key: "connectedDevice", label: "Device" },
          { key: "deviceType", label: "Type" },
        ]}
        title="New Port Map"
        action={createPortMap}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/field-services/port-maps/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.switch_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🔌"
              title="No port maps"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
