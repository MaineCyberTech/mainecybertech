import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getComparisonData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comparisons - Store - Admin - Maine CyberTech" };

export default async function AdminStoreComparisonsPage() {
  await requireAdminAccess();
  const data = getComparisonData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Comparisons" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-comparisons" />}
      title="Comparison Pages"
      description={`${data.comparisons.length} comparison page${data.comparisons.length === 1 ? "" : "s"} defined`}
    >
      <div className="space-y-4">
        {data.comparisons.map((cmp) => (
          <div key={cmp.slug} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-50">{cmp.title}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">/{cmp.slug}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <div>
                <p className="mb-1 text-[11px] text-slate-500">Items ({cmp.items.length})</p>
                <div className="flex flex-wrap gap-1">
                  {cmp.items.map((item) => (
                    <span
                      key={item}
                      className="rounded bg-emerald-600/10 px-2 py-0.5 text-xs text-emerald-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-slate-500">Sections ({cmp.sections.length})</p>
                <div className="flex flex-wrap gap-1">
                  {cmp.sections.map((s) => (
                    <span key={s} className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
