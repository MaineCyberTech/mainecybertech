import { getPackageLadders } from "@/lib/catalog/v5-loaders";
import { getProductById } from "@/lib/catalog/loader";
import type { CatalogProduct } from "@/lib/catalog/types";
import Link from "next/link";

interface PackageLadderProps {
  category: string;
}

const tierMeta: Record<string, { label: string; color: string; border: string }> = {
  good: {
    label: "Good",
    color: "text-slate-300",
    border: "border-slate-600/30",
  },
  better: {
    label: "Better",
    color: "text-emerald-400",
    border: "border-emerald-600/30",
  },
  best: {
    label: "Best",
    color: "text-amber-400",
    border: "border-amber-600/30",
  },
};

function tierInfo(
  tierKey: string,
  ladder: { good: string; better: string; best: string },
): { key: string; productId: string } {
  switch (tierKey) {
    case "good":
      return { key: "good", productId: ladder.good };
    case "better":
      return { key: "better", productId: ladder.better };
    case "best":
      return { key: "best", productId: ladder.best };
    default:
      return { key: "good", productId: ladder.good };
  }
}

export default function PackageLadder({ category }: PackageLadderProps) {
  const ladders = getPackageLadders();
  const ladder = ladders.find((l) => l.category === category);
  if (!ladder) return null;

  const tiers = ["good", "better", "best"] as const;
  const products = tiers
    .map((t) => {
      const info = tierInfo(t, ladder);
      return { ...info, product: getProductById(info.productId) };
    })
    .filter(
      (p): p is { key: string; productId: string; product: CatalogProduct } =>
        p.product !== undefined,
    );

  if (products.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {products.map(({ key, product }) => {
        const meta = tierMeta[key];
        return (
          <div
            key={key}
            className={`flex flex-col rounded-lg border ${meta.border} bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm`}
          >
            <span
              className={`mb-3 inline-block w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${meta.color}`}
            >
              {meta.label}
            </span>
            <h3 className="font-orbitron mb-2 text-lg font-bold uppercase tracking-wider text-slate-50">
              {product.name}
            </h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{product.summary}</p>
            <p className="mb-6 text-sm font-semibold text-emerald-400">{product.priceRange}</p>
            <Link
              href={`/store/${product.slug}`}
              className="font-orbitron mt-auto inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Learn More
            </Link>
          </div>
        );
      })}
    </div>
  );
}
