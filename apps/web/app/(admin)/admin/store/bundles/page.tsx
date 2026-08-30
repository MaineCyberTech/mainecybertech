import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getAllProducts, getProductById, getBundleRules } from "@/lib/catalog/loader";
import { getAllBundles, getRecommendationsForProduct } from "@/lib/catalog/bundles";
import { validateRecommendations } from "@/lib/catalog/validation";
export const dynamic = "force-dynamic";
export const metadata = { title: "Store Bundles - Admin" };

export default async function StoreBundlesPage() {
  await requireAdminAccess();
  const rules = getBundleRules();
  const bundles = getAllBundles();
  const products = getAllProducts();
  const recIssues = validateRecommendations();
  const invalidIds = new Set(recIssues.map((i) => i.value!));

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Bundles" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-bundles" />}
      title="Bundle & Recommendation Manager"
      description="View bundle rules, eligible products, and recommendation graph."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{rules.length} rules</div>
          <div className="cyber-pill">{bundles.length} bundles</div>
          {recIssues.length > 0 ? (
            <div className="cyber-pill border-red-600/30 bg-red-600/10 text-red-400">
              {recIssues.length} issue{recIssues.length !== 1 ? "s" : ""}
            </div>
          ) : null}
        </div>
      }
    >
      {recIssues.length > 0 ? (
        <section className="mb-6 rounded-xl border border-red-600/20 bg-red-600/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-400">Recommendation Warnings</h3>
          <ul className="space-y-1">
            {recIssues.map((iss, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{iss.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-slate-200">Bundle Rules ({rules.length})</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => {
            const recommended = rule.recommend.map((id) => getProductById(id)).filter(Boolean);
            return (
              <div key={rule.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <p className="mb-1 font-mono text-xs text-slate-500">{rule.id}</p>
                <p className="mb-2 text-sm text-slate-300">
                  When viewing{" "}
                  <span className="font-semibold text-emerald-400">{rule.whenCategoryViewed}</span>
                </p>
                {rule.whenTagsInclude && rule.whenTagsInclude.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {rule.whenTagsInclude.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mb-1 text-[11px] text-slate-500">Recommend:</p>
                <div className="flex flex-wrap gap-1">
                  {recommended.map((p) => (
                    <span
                      key={p!.id}
                      className={`inline-block rounded px-2 py-0.5 text-[11px] ${
                        invalidIds.has(p!.id)
                          ? "bg-red-600/10 text-red-400"
                          : "bg-emerald-600/10 text-emerald-400"
                      }`}
                    >
                      {p!.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-slate-200">
          Bundle-Eligible Products ({bundles.length})
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bundles.map((b) => (
            <div key={b.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <p className="mb-1 text-sm font-medium text-slate-50">{b.name}</p>
              <p className="mb-2 text-xs text-slate-500">{b.category}</p>
              {b.priceRange ? (
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                  {b.priceRange}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-200">
          Recommendations Graph ({products.length} products)
        </h2>
        <div className="space-y-2">
          {products
            .filter((p) => p.recommendedUpsells.length > 0)
            .map((p) => {
              const recs = getRecommendationsForProduct(p.id);
              return (
                <div key={p.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-slate-50">{p.name}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {p.recommendedUpsells.length} upsell
                      {p.recommendedUpsells.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {recs.length > 0 ? (
                      recs.map((r) => (
                        <span
                          key={r.id}
                          className="inline-block rounded bg-emerald-600/10 px-2 py-0.5 text-[11px] text-emerald-400"
                        >
                          {r.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-600">
                        {p.recommendedUpsells.length > 0
                          ? "Some recommendations missing — see warnings above"
                          : "No recommendations"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        {products.filter((p) => p.recommendedUpsells.length > 0).length === 0 ? (
          <p className="text-sm text-slate-500">No products have recommendations configured.</p>
        ) : null}
      </section>
    </AdminPageShell>
  );
}
