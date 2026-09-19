import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getDependencyEngineData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dependency Engine - Store - Admin - Maine CyberTech" };

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    required: "border-red-500/25 bg-red-500/10 text-red-400",
    recommended: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  };
  return map[severity] ?? "border-white/10 bg-white/5 text-slate-400";
}

export default async function AdminStoreDependenciesPage() {
  await requireAdminAccess();
  const data = getDependencyEngineData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Dependency Engine" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-dependencies" />}
      title="Product Dependency Engine"
      description={`${data.dependencies.length} dependency rule${data.dependencies.length === 1 ? "" : "s"}`}
      actions={
        <button
          type="button"
          className="rounded-lg border border-emerald-600/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/10"
        >
          Check Dependencies
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Dependency Types</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
            requires (hard)
          </span>
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
            recommends (soft)
          </span>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Rules ({data.dependencies.length})
        </h2>
        <div className="space-y-3">
          {data.dependencies.map((rule) => (
            <div
              key={rule.productId}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-200">
                  {rule.productId}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${severityBadge(rule.severity)}`}
                >
                  {rule.severity}
                </span>
              </div>
              <div className="space-y-1">
                {rule.requires.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-red-400">requires</span>
                    <div className="flex flex-wrap gap-1">
                      {rule.requires.map((dep) => (
                        <span
                          key={dep}
                          className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {rule.recommends.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-amber-400">recommends</span>
                    <div className="flex flex-wrap gap-1">
                      {rule.recommends.map((dep) => (
                        <span
                          key={dep}
                          className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
