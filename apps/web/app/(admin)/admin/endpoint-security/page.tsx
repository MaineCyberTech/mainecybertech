import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
export const dynamic = "force-dynamic";
export const metadata = { title: "Endpoint Security" };
export default async function EndpointPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    device_group: string;
    total_endpoints: number;
    av_installed: number;
    disk_encrypted: number;
    mdm_enrolled: number;
    coverage_pct: number | null;
  }> = [];
  try {
    const r = await api.securitySuite.endpoints.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }
  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Endpoint Security" }]} />
      }
      subnav={<AdminSubnav current="endpoint-security" />}
      title="Endpoint Security Coverage Map"
      description="Track endpoint protection, disk encryption, MDM, and EDR deployment across device groups."
      actions={null}
    >
      <section className="cyber-panel">
        <div className="grid gap-4 md:grid-cols-2">
          {items.length > 0 ? (
            items.map((e) => (
              <div key={e.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{e.device_group}</p>
                <p className="mt-2 text-xs text-slate-400">
                  AV: {e.av_installed}/{e.total_endpoints} &bull; Encrypted: {e.disk_encrypted}/
                  {e.total_endpoints} &bull; MDM: {e.mdm_enrolled}/{e.total_endpoints}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${e.coverage_pct || 0}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="💻"
              title="No endpoint groups"
              description="Track endpoint security coverage by device group."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
