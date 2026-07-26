import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createLicense } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Licenses - Admin" };

export default async function LicensesPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    vendor: string;
    product_name: string;
    total_seats: number;
    assigned_seats: number;
    unused_seats: number;
    annual_cost: number | null;
    reclaimable_savings: number | null;
  }> = [];
  let savings = { totalAnnualCost: 0, reclaimableSavings: 0, unusedSeats: 0 };
  try {
    const [r, s] = await Promise.allSettled([
      api.batch.licenses.list({}),
      api.batch.licenses.savings({}),
    ]);
    if (r.status === "fulfilled") items = r.value.items as typeof items;
    if (s.status === "fulfilled") savings = s.value;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Licenses" }]} />
      }
      subnav={<AdminSubnav current="licenses" />}
      title="License Optimizer & Seat Reclaimer"
      description="Track assigned vs used licenses, costs, and reclaimable savings."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">${savings.totalAnnualCost.toLocaleString()}/yr</div>
          <div className="cyber-pill">{savings.unusedSeats} unused</div>
        </div>
      }
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "vendor", label: "Vendor", required: true },
          { key: "productName", label: "Product", required: true },
          { key: "totalSeats", label: "Total Seats", type: "number", required: true },
          { key: "assignedSeats", label: "Assigned", type: "number", required: true },
          { key: "annualCost", label: "Annual Cost", type: "number", required: true },
        ]}
        title="New License"
        action={createLicense}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((l) => (
              <div key={l.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">
                      {l.vendor} — {l.product_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {l.assigned_seats}/{l.total_seats} seats &bull; $
                      {(l.annual_cost ?? 0).toLocaleString()}/yr &bull; $
                      {(l.reclaimable_savings ?? 0).toLocaleString()} reclaimable
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📊"
              title="No licenses tracked"
              description="Track software licenses across client organizations."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
