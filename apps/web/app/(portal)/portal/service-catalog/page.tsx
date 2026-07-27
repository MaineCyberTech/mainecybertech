import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service Catalog - Portal - Maine CyberTech" };

const fmtCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function PortalServiceCatalogPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.serviceCatalog.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Service Catalog">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Service Catalog" }]}
      />
      <PortalSubnav current="service-catalog" />
      <h1 className="text-2xl font-semibold text-slate-50">Service Catalog</h1>
      <p className="text-sm text-slate-400">{items.length} services for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(item.name)}</p>
                <p className="mt-1 text-xs text-slate-400">Category: {String(item.category)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Billing: {String(item.billing_model)} / {String(item.unit)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Base Price: {fmtCurrency.format(Number(item.base_price))}
                </p>
                {item.included_units != null ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Included Units: {String(item.included_units)}
                  </p>
                ) : null}
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {String(item.description)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                {item.is_bundled ? (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                    Bundled
                  </span>
                ) : null}
                {item.is_active ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No services in catalog.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
