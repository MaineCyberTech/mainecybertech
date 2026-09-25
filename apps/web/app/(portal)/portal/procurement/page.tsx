import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
export const dynamic = "force-dynamic";
export const metadata = { title: "Procurement - Portal - Maine CyberTech" };

export default async function ProcurementPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.procurement.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[procurement/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Procurement">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Procurement" }]}
      />
      <PortalSubnav current="procurement" />
      {loadFailed ? <DataErrorNote what="procurement" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Procurement Quotes</h1>
      <p className="text-sm text-slate-400">
        {items.length} quote{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.product ?? "Untitled")}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>Vendor: {String(item.vendor_name ?? "—")}</span>
              <span>
                Quote:{" "}
                {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  Number(item.quote_amount ?? 0),
                )}
              </span>
              {item.competitor_quote != null && (
                <span>
                  Competitor:{" "}
                  {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    Number(item.competitor_quote),
                  )}
                </span>
              )}
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.selected
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {item.selected ? "selected" : "candidate"}
              </span>
              {item.created_at != null && (
                <span>Created: {new Date(String(item.created_at)).toISOString().slice(0, 10)}</span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No procurement quotes found.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
