import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
export const dynamic = "force-dynamic";
export const metadata = { title: "Patch Compliance - Admin" };

export default async function PatchPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    device_group: string;
    total_devices: number;
    patched_devices: number;
    pending_patches: number;
    critical_patches: number;
    compliance_pct: number | null;
  }> = [];
  let stats = { totalDevices: 0, patchedDevices: 0, criticalPatches: 0, complianceRate: 0 };
  try {
    const [r, s] = await Promise.allSettled([
      api.securityOps.patchCompliance.list({}),
      api.securityOps.patchCompliance.stats({}),
    ]);
    if (r.status === "fulfilled") items = r.value.items as unknown as typeof items;
    if (s.status === "fulfilled") stats = s.value;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Patch Compliance" }]} />
      }
      subnav={<AdminSubnav current="patch-compliance" />}
      title="Patch Compliance Dashboard"
      description="Track device groups, patching progress, pending updates, and maintenance windows."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{stats.complianceRate}% Compliant</div>
          <div className="cyber-pill">{stats.criticalPatches} Critical</div>
        </div>
      }
    >
      <section className="cyber-panel">
        <div className="grid gap-4 md:grid-cols-2">
          {items.length > 0 ? (
            items.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{p.device_group}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {p.patched_devices}/{p.total_devices} patched &bull; {p.pending_patches} pending
                  &bull; {p.critical_patches} critical
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${p.compliance_pct || 0}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🛡️"
              title="No patch groups"
              description="Track patch compliance by device group."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
