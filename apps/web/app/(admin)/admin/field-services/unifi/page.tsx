import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createUnifi } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "UniFi Survey - Field Services - Admin" };

export default async function UnifiPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; site_name?: string }> = [];
  try {
    const r = await api.fieldServices.unifi.list({});
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
            { label: "UniFi Survey" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="UniFi Survey"
      description="Site surveys with APs, switches, cameras, cable runs, and PoE budget."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "siteName", label: "Site Name", required: true },
          { key: "siteAddress", label: "Address" },
          { key: "accessPoints", label: "APs", type: "number" },
          { key: "switches", label: "Switches", type: "number" },
          { key: "cameras", label: "Cameras", type: "number" },
          { key: "cableRunsEstimated", label: "Cable Runs", type: "number" },
          { key: "poeBudgetWatts", label: "PoE Budget (W)", type: "number" },
        ]}
        title="New UniFi Survey"
        action={createUnifi}
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
              icon="📡"
              title="No UniFi surveys"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
