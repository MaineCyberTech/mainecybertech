import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatCurrency, formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contracts - Portal - Maine CyberTech" };

export default async function PortalVendorContractsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.vendors.contracts.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[vendor-contracts/page]", error);
    loadFailed = true;
  }

  function statusLabel(status: string) {
    const s = status.toLowerCase();
    if (s === "active") return "Active";
    if (s.includes("expir")) return "Expiring Soon";
    if (s === "expired") return "Expired";
    return status;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Vendor Contracts">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Vendor Contracts" }]}
      />
      <PortalSubnav current="vendor-contracts" />
      {loadFailed ? <DataErrorNote what="vendor-contracts" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Vendor Contracts</h1>
      <p className="text-sm text-slate-400">{items.length} contracts for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
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
                  Start: {item.start_date ? formatDate(item.start_date) : "—"}
                  {" — "}
                  End: {item.end_date ? formatDate(item.end_date) : "—"}
                </p>
                {item.renewal_date ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Renewal: {formatDate(item.renewal_date)}
                  </p>
                ) : null}
                {item.contract_value != null ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Value: {formatCurrency(Number(item.contract_value))}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">Type: {String(item.contract_type)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={statusLabel(String(item.status))} />
                {item.auto_renews ? (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                    Auto-renews
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <EmptyState icon="📄" title="No vendor contracts found." />
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
