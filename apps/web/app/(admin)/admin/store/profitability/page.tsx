import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getProfitabilityData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profitability Scoring - Store - Admin - Maine CyberTech" };

export default async function AdminStoreProfitabilityPage() {
  await requireAdminAccess();
  const data = getProfitabilityData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Profitability Scoring" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-profitability" />}
      title="Profitability & Effort Scoring"
      description={`${data.dimensions.length} scoring dimensions`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Score Product
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Scoring Dimensions ({data.dimensions.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.dimensions.map((dim) => (
            <div key={dim.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <p className="text-xs font-medium text-slate-200">{dim.label}</p>
              <p className="mt-1 text-[11px] text-slate-500">Weight: {dim.weight}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
