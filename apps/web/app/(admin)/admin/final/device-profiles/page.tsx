import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createDeviceProfile } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Device Profile - More Tools - Admin" };

export default async function DeviceProfilePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; profile_name?: string }> = [];
  try {
    const r = await api.final.deviceProfiles.list({});
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
            { label: "More Tools", href: "/admin/final" },
            { label: "Device Profile" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Device Profile"
      description="Standard device profiles with type, OS, and descriptions."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "profileName", label: "Profile Name", required: true },
          { key: "deviceType", label: "Device Type" },
          { key: "os", label: "OS" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        title="New Device Profile"
        action={createDeviceProfile}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.profile_name ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🖥️"
              title="No device profiles"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
