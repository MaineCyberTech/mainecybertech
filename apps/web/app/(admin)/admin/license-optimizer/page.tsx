import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { StatusPill } from "@/components/admin/StatusPill";
import { createLicenseAllocation } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "License Optimizer - Admin - Maine CyberTech" };

export default async function LicenseOptimizerPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let items = [] as Array<{
    id: string;
    software_name: string;
    license_type: string;
    total_seats: number;
    used_seats: number;
    status: string;
    created_at: string;
  }>;

  try {
    const r = (await api.licenseOptimizer.list({})) as any;
    items = r.items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "License Optimizer" }]} />
      }
      subnav={<AdminSubnav current="license-optimizer" />}
      title="License Optimizer"
      description="Track software license utilization, identify underused seats, and calculate potential savings."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "softwareName", label: "Software", required: true },
          { key: "licenseType", label: "Type" },
          { key: "totalSeats", label: "Total Seats", type: "number" },
          { key: "usedSeats", label: "Used Seats", type: "number" },
          { key: "costPerSeat", label: "Cost/Seat", type: "number" },
        ]}
        title="New License Allocation"
        action={createLicenseAllocation}
      />
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Licenses</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      className="transition hover:text-emerald-400"
                      href={`/admin/license-optimizer/${item.id}`}
                    >
                      <p className="font-medium text-slate-50">{item.software_name}</p>
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.license_type} &bull; {item.used_seats}/{item.total_seats} seats &bull;{" "}
                      {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={item.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📊"
              title="No licenses tracked yet"
              description="Add your first software license to start tracking utilization and identifying savings opportunities."
              actionHref="/admin/license-optimizer"
              actionLabel="Refresh"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
