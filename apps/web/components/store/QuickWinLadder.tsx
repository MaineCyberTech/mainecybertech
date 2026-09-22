import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/types";
import { pickCopyVariant } from "@/lib/catalog/copy-variants";
import StoreProductCard from "./StoreProductCard";

interface QuickWinLadderProps {
  quickWin?: CatalogProduct;
  bundle?: CatalogProduct;
  monthlyPlan?: CatalogProduct;
}

const STEPS = [
  {
    key: "quick-win",
    label: "1 · Quick win",
    blurb: "One focused fix with a clear finish line.",
  },
  {
    key: "bundle",
    label: "2 · Bundle",
    blurb: "Combine related work and save versus booking separately.",
  },
  {
    key: "monthly",
    label: "3 · Monthly plan",
    blurb: "Ongoing coverage so problems get caught early.",
  },
] as const;

/**
 * Prompt 17 quick-win ladder: quick win → bundle → monthly plan, with one
 * primary CTA. Renders nothing for steps without a product so the ladder never
 * advertises something the catalog does not have.
 */
export default function QuickWinLadder({ quickWin, bundle, monthlyPlan }: QuickWinLadderProps) {
  const products = [quickWin, bundle, monthlyPlan];
  const available = products.filter((p): p is CatalogProduct => Boolean(p));
  if (available.length === 0) return null;

  const intro = pickCopyVariant(
    "quick_win_ladder_intro",
    available[0].slug,
    "Start small, then grow into a bundle or a monthly plan when it makes sense.",
  );

  return (
    <section id="quick-win-ladder" className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-center font-display text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
          Start With a <span className="text-emerald-500">Quick Win</span>
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-slate-400">{intro}</p>

        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => {
            const product = products[index];
            return (
              <div key={step.key} className="flex flex-col">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  {step.label}
                </p>
                <p className="mb-4 text-sm text-slate-400">{step.blurb}</p>
                {product ? (
                  <StoreProductCard
                    slug={product.slug}
                    name={product.name}
                    summary={product.summary}
                    priceRange={product.priceRange}
                    categoryName={product.category}
                    categorySlug={product.categoryId}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 p-6 text-xs text-slate-500">
                    Nothing published here yet — ask us what fits.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/store/quiz"
            className="inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Start With a Quick Win
          </Link>
        </div>
      </div>
    </section>
  );
}
