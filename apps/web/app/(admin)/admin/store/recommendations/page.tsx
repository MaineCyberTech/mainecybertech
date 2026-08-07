import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getRecEngineV2Data } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recommendation Engine - Store - Admin - Maine CyberTech" };

export default async function AdminStoreRecommendationsPage() {
  await requireAdminAccess();
  const data = getRecEngineV2Data();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Recommendation Engine" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-recommendations" />}
      title="Recommendation Engine V2"
      description={`${data.recommendationTypes.length} recommendation types, ${data.examples.length} example mappings`}
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Recommendation Types</h2>
        <div className="flex flex-wrap gap-2">
          {data.recommendationTypes.map((type) => (
            <span
              key={type}
              className="rounded border border-white/10 bg-cyber-base/60 px-3 py-1.5 font-mono text-xs text-slate-300"
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Example Mappings ({data.examples.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-cyber-base/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Source Product</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Recommended</th>
              </tr>
            </thead>
            <tbody>
              {data.examples.map((ex, i) => (
                <tr key={i} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-slate-50">{ex.sourceProduct}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ex.recommend.map((rec) => (
                        <span
                          key={rec}
                          className="rounded bg-emerald-600/10 px-2 py-0.5 text-xs text-emerald-400"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Admin Rules</h2>
        <ul className="space-y-1">
          {data.adminRules.map((rule, i) => (
            <li
              key={i}
              className="rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-xs text-slate-400"
            >
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </AdminPageShell>
  );
}
