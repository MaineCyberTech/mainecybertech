import { getComparisonData } from "@/lib/catalog/v5-loaders";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Service Comparisons",
  description:
    "Side-by-side comparisons of Maine CyberTech services to help you choose the right fit.",
  path: "/store/compare",
});

export default function CompareIndexPage() {
  const data = getComparisonData();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/store"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Store
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Compare</span>
        </nav>

        <h1 className="font-orbitron mb-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Service{" "}
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
            Comparisons
          </span>
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-slate-400">
          Not sure which service fits best? These side-by-side comparisons break down the
          differences so you can pick with confidence.
        </p>

        {data.comparisons.length === 0 ? (
          <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-12 text-center backdrop-blur-sm">
            <p className="text-slate-400">No comparisons available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {data.comparisons.map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/store/compare/${comparison.slug}`}
                className="glass-card glass-card-hover group flex flex-col p-8 no-underline sm:p-10"
              >
                <h3 className="font-orbitron mb-3 text-lg font-bold uppercase tracking-wider text-slate-50">
                  {comparison.title}
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  {comparison.items.length} services · {comparison.sections.length} feature
                  comparisons
                </p>
                <span className="mt-auto text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
                  View Comparison →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/store"
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Browse All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
