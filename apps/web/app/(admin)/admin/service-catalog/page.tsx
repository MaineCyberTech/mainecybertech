import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service Catalog - Admin - Maine CyberTech" };

export default async function ServiceCatalogPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    billing_model: string;
    unit: string;
    base_price: number;
    is_bundled: boolean;
    is_active: boolean;
  }> = [];
  try {
    const r = await api.serviceCatalog.list({});
    items = r.items as typeof items;
  } catch {
    /* graceful */
  }

  const byCategory = new Map<string, typeof items>();
  for (const i of items) {
    const k = byCategory.get(i.category) || [];
    k.push(i);
    byCategory.set(i.category, k);
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Service Catalog" }]} />
      }
      subnav={<AdminSubnav current="service-catalog" />}
      title="Client Billing Service Catalog"
      description="Define recurring services, pricing tiers, bundled packages, and billing models."
      actions={
        <Link href="/admin/service-catalog/new" className="cyber-button">
          Add Service
        </Link>
      }
    >
      {[...byCategory.entries()].map(([category, services]) => (
        <section key={category} className="cyber-panel mb-4">
          <h2 className="cyber-heading mb-2 text-lg capitalize">
            {category.replace(/_/g, " ")} ({services.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-50">{s.name}</p>
                  <span
                    className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${s.is_active ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  ${s.base_price}/{s.unit} &bull; {s.billing_model}{" "}
                  {s.is_bundled ? "• Bundled" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {items.length === 0 && (
        <EmptyState
          icon="💲"
          title="No services defined"
          description="Define your managed services, pricing tiers, and billing models."
          actionHref="/admin/service-catalog/new"
          actionLabel="Add Service"
        />
      )}
    </AdminPageShell>
  );
}
