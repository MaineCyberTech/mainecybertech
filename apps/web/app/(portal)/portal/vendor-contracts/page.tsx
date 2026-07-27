import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contracts - Portal - Maine CyberTech" };

const fmtCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function PortalVendorContractsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.vendors.contracts.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  function statusBadge(status: string) {
    const s = status.toLowerCase();
    if (s === "active")
      return (
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
          Active
        </span>
      );
    if (s.includes("expir"))
      return (
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
          Expiring Soon
        </span>
      );
    if (s === "expired")
      return (
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Expired</span>
      );
    return (
      <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Vendor Contracts">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Vendor Contracts" }]}
      />
      <PortalSubnav current="vendor-contracts" />
      <h1 className="text-2xl font-semibold text-slate-50">Vendor Contracts</h1>
      <p className="text-sm text-slate-400">{items.length} contracts for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(item.vendor_name)}</p>
                <p className="mt-1 text-xs text-slate-400">Service: {String(item.service_name)}</p>
                {item.contract_number ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Contract #: {String(item.contract_number)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  Start:{" "}
                  {item.start_date
                    ? new Date(String(item.start_date)).toISOString().slice(0, 10)
                    : "—"}
                  {" — "}
                  End:{" "}
                  {item.end_date ? new Date(String(item.end_date)).toISOString().slice(0, 10) : "—"}
                </p>
                {item.renewal_date ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Renewal: {new Date(String(item.renewal_date)).toISOString().slice(0, 10)}
                  </p>
                ) : null}
                {item.contract_value != null ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Value: {fmtCurrency.format(Number(item.contract_value))}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">Type: {String(item.contract_type)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {statusBadge(String(item.status))}
                {item.auto_renews ? (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                    Auto-renews
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No vendor contracts found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
