import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Procurement - Portal - Maine CyberTech" };

export default async function ProcurementPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.procurement.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Procurement">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Procurement" }]}
      />
      <PortalSubnav current="procurement" />
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
            <p className="font-medium text-slate-50">
              {String(item.title ?? item.name ?? "Untitled")}
            </p>
            {item.description != null && (
              <p className="mt-1 text-xs text-slate-400">{String(item.description)}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.vendor != null && <span>Vendor: {String(item.vendor)}</span>}
              {item.total_cost != null && (
                <span>
                  Total:{" "}
                  {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    Number(item.total_cost),
                  )}
                </span>
              )}
              {item.status != null && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    String(item.status) === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : String(item.status) === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {String(item.status)}
                </span>
              )}
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
