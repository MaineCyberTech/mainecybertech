"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { addToQuote, isInQuote } from "@/lib/catalog/quote-storage";
import TrustBadgeList from "./TrustBadgeList";

interface StoreProductCardProps {
  slug: string;
  name: string;
  summary: string;
  priceRange: string;
  categoryName: string;
  categorySlug: string;
}

export default function StoreProductCard({
  slug,
  name,
  summary,
  priceRange,
  categoryName,
  categorySlug: _categorySlug,
}: StoreProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAddToQuote = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addToQuote(slug);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    },
    [slug],
  );

  const alreadyAdded = isInQuote(slug);

  return (
    <div className="glass-card glass-card-hover group flex flex-col p-8 no-underline sm:p-10">
      <Link href={`/store/${slug}`} className="no-underline">
        <span className="mb-4 inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {categoryName}
        </span>
        <TrustBadgeList surface="product_card" maxBadges={2} />
        <h3 className="font-orbitron mb-4 mt-2 text-lg font-bold uppercase tracking-wider text-slate-50 transition-colors group-hover:text-emerald-400">
          {name}
        </h3>
        <p className="mb-6 flex-1 leading-relaxed text-slate-400">{summary}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-400">{priceRange}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
            View Details →
          </span>
        </div>
      </Link>
      <button
        onClick={handleAddToQuote}
        disabled={added}
        className="font-orbitron mt-4 w-full rounded border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "✓ Added to Quote" : alreadyAdded ? "In Quote" : "Add to Quote"}
      </button>
    </div>
  );
}
