import Link from "next/link";

interface StoreCategoryCardProps {
  name: string;
  slug: string;
  description: string;
  count: number;
}

export default function StoreCategoryCard({
  name,
  slug,
  description,
  count,
}: StoreCategoryCardProps) {
  return (
    <Link
      href={`/store/category/${slug}`}
      className="glass-card glass-card-hover group flex flex-col p-8 no-underline sm:p-10"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
          {name}
        </h3>
        <span className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {count}
        </span>
      </div>
      <p className="mb-6 flex-1 leading-relaxed text-slate-400">{description}</p>
      <span className="mt-auto text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
        Browse {name} →
      </span>
    </Link>
  );
}
