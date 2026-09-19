import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getPackageLadders, getProductBySlug } from "@/lib/catalog/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Package Ladders - Store - Admin - Maine CyberTech" };

export default async function AdminStoreLaddersPage() {
  await requireAdminAccess();
  const ladders = getPackageLadders();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Package Ladders" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-ladders" />}
      title="Package Ladders"
      description={`${ladders.length} category ladder${ladders.length === 1 ? "" : "s"}`}
    >
      <div className="space-y-6">
        {ladders.map((ladder) => (
          <div
            key={ladder.category}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <h2 className="mb-4 text-sm font-semibold text-slate-200">{ladder.category}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { tier: "Good", slug: ladder.good },
                { tier: "Better", slug: ladder.better },
                { tier: "Best", slug: ladder.best },
              ].map(({ tier, slug }) => {
                const product = getProductBySlug(slug);
                const priceRange = product?.priceRange ?? "";
                return (
                  <div key={tier} className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        tier === "Good"
                          ? "bg-slate-600/20 text-slate-400"
                          : tier === "Better"
                            ? "bg-blue-600/20 text-blue-400"
                            : "bg-emerald-600/20 text-emerald-400"
                      }`}
                    >
                      {tier}
                    </span>
                    <p className="mt-2 font-mono text-xs text-slate-300">{slug}</p>
                    {priceRange && <p className="mt-1 text-xs text-slate-500">{priceRange}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
