import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import CrudForm from "@/components/admin/CrudForm";
import { createVendorContract } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contracts - Admin - Maine CyberTech" };

export default async function VendorContractsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let contracts: Array<{
    id: string;
    vendor_name: string;
    service_name: string;
    renewal_date: string | null;
    end_date: string | null;
    contract_value: number | null;
    auto_renews: boolean;
    status: string;
  }> = [];
  let upcoming: Array<{
    id: string;
    vendor_name: string;
    service_name: string;
    renewal_date: string | null;
  }> = [];

  try {
    const [r, u] = await Promise.allSettled([
      api.vendors.contracts.list({}),
      api.vendors.contracts.renewals({}),
    ]);
    if (r.status === "fulfilled") contracts = r.value.items as typeof contracts;
    if (u.status === "fulfilled") upcoming = u.value.items as typeof upcoming;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Vendor Contracts" }]} />
      }
      subnav={<AdminSubnav current="vendor-contracts" />}
      title="Vendor Contract Renewal Calendar"
      description="Track vendor contracts, renewals, service agreements, and billing across client organizations."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{upcoming.length} renewing soon</div>
        </div>
      }
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "vendorName", label: "Vendor", required: true },
          { key: "serviceName", label: "Service", required: true },
          { key: "renewalDate", label: "Renewal Date", type: "date" },
          { key: "contractValue", label: "Value", type: "number" },
        ]}
        title="New Vendor Contract"
        action={createVendorContract}
      />
      {upcoming.length > 0 && (
        <section className="cyber-panel">
          <h2 className="cyber-heading mb-4 text-lg">Upcoming Renewals ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map((c) => (
              <Link
                key={c.id}
                href={`/admin/vendor-contracts/${c.id}`}
                className="block rounded-lg border border-amber-500/20 bg-[#0A1118]/60 p-3 transition hover:border-amber-500/40"
              >
                <p className="text-sm font-medium text-slate-50">
                  {c.vendor_name} — {c.service_name}
                </p>
                <p className="text-xs text-slate-400">
                  Renews:{" "}
                  {c.renewal_date ? new Date(c.renewal_date).toISOString().slice(0, 10) : "N/A"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">All Contracts ({contracts.length})</h2>
        <div className="mt-4 space-y-3">
          {contracts.length > 0 ? (
            contracts.map((c) => (
              <Link
                key={c.id}
                href={`/admin/vendor-contracts/${c.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">
                      {c.vendor_name} — {c.service_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.contract_value ? `$${c.contract_value.toLocaleString()}` : "N/A"} &bull;{" "}
                      {c.auto_renews ? "Auto-renews" : "Manual renewal"} &bull;{" "}
                      {c.end_date
                        ? `Ends ${new Date(c.end_date).toISOString().slice(0, 10)}`
                        : "Ongoing"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${c.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    {c.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="📅"
              title="No contracts"
              description="Track vendor contracts and renewal dates."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
