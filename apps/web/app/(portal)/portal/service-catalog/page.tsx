import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
import AdminPagination from "@/components/admin/AdminPagination";
import { formatCurrency } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Service Catalog - Portal - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

export default async function PortalServiceCatalogPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  const sp = (await props.searchParams) ?? {};
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
  );
  try {
    const r = await api.serviceCatalog.list({ organizationId: orgId, page, limit });
    items = r.items as unknown as typeof items;
    total = r.total ?? items.length;
  } catch (error) {
    console.error("[service-catalog/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Service Catalog">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Service Catalog" }]}
      />
      <PortalSubnav current="service-catalog" />
      {loadFailed ? <DataErrorNote what="service-catalog" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Service Catalog</h1>
      <p className="text-sm text-slate-400">
        {total} service{total !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(item.name)}</p>
                <p className="mt-1 text-xs text-slate-400">Category: {String(item.category)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Billing: {String(item.billing_model)} / {String(item.unit)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Base Price: {formatCurrency(Number(item.base_price))}
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
        {!loadFailed && items.length === 0 && (
          <p className="text-sm text-slate-400">No services in catalog.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
      <AdminPagination
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        buildHref={(p) => `/portal/service-catalog?page=${p}&limit=${limit}`}
        total={total}
        limit={limit}
      />
    </div>
  );
}
