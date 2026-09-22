import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/types";

export interface PackageTier {
  label: "Good" | "Better" | "Best" | string;
  product: CatalogProduct;
}

function rowValues(product: CatalogProduct) {
  return {
    price: product.priceRange || "Ask us",
    included: product.whatIsIncluded.length,
    bestFor: product.bestFor[0] ?? product.summary,
    upgrade: product.recommendedUpsells.length > 0 ? "Yes" : "—",
  };
}

/**
 * Prompt 17 mini comparison: good / better / best side by side. Features are
 * derived from each product's real catalog data — nothing is asserted that the
 * catalog does not contain.
 */
export default function MiniPackageComparison({
  title = "Compare Packages",
  tiers,
}: {
  title?: string;
  tiers: PackageTier[];
}) {
  const available = tiers.filter((tier) => Boolean(tier.product));
  if (available.length < 2) return null;

  return (
    <section
      aria-labelledby="mini-comparison-heading"
      className="rounded-lg border border-white/10 bg-cyber-base/60 p-6"
    >
      <h2
        id="mini-comparison-heading"
        className="font-display text-lg font-bold uppercase tracking-wider text-slate-50"
      >
        {title}
      </h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-white/10 px-3 py-2 text-left font-semibold text-slate-400">
                Tier
              </th>
              {available.map((tier) => (
                <th
                  key={tier.product.id}
                  className="border-b border-white/10 px-3 py-2 text-left font-semibold text-emerald-400"
                >
                  {tier.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-white/5 px-3 py-2 text-slate-400">Price</td>
              {available.map((tier) => (
                <td
                  key={tier.product.id}
                  className="border-b border-white/5 px-3 py-2 text-slate-200"
                >
                  {rowValues(tier.product).price}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-b border-white/5 px-3 py-2 text-slate-400">Included items</td>
              {available.map((tier) => (
                <td
                  key={tier.product.id}
                  className="border-b border-white/5 px-3 py-2 text-slate-200"
                >
                  {rowValues(tier.product).included}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-b border-white/5 px-3 py-2 text-slate-400">Best for</td>
              {available.map((tier) => (
                <td
                  key={tier.product.id}
                  className="border-b border-white/5 px-3 py-2 text-slate-400"
                >
                  {rowValues(tier.product).bestFor}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-slate-400">Upgrade path</td>
              {available.map((tier) => (
                <td key={tier.product.id} className="px-3 py-2 text-slate-400">
                  {rowValues(tier.product).upgrade}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {available.map((tier) => (
          <Link
            key={tier.product.id}
            href={`/store/${tier.product.slug}`}
            className="rounded border border-emerald-600/30 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/10"
          >
            {tier.label}: {tier.product.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
