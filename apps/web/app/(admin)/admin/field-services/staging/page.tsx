import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createStaging } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hardware Staging - Field Services - Admin" };

export default async function StagingPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; device_name?: string }> = [];
  try {
    const r = await api.fieldServices.staging.list({});
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
            { label: "Hardware Staging" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Hardware Staging"
      description="Track device staging with type, serial, asset tag, and notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "deviceType", label: "Device Type", required: true },
          { key: "deviceName", label: "Device Name", required: true },
          { key: "serialNumber", label: "Serial" },
          { key: "assetTag", label: "Asset Tag" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Device"
        action={createStaging}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.device_name ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🖥️"
              title="No staged devices"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
