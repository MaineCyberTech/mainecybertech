import { getComparisonBySlug } from "@/lib/catalog/v5-loaders";
import { getAllProducts } from "@/lib/catalog/loader";
import type { CatalogProduct } from "@/lib/catalog/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) return { title: "Comparison Not Found" };

  return buildMetadata({
    title: comparison.title,
    description: `Compare ${comparison.title} — side-by-side feature breakdown.`,
    path: `/store/compare/${slug}`,
  });
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="border border-white/5 px-4 py-3 align-top text-sm text-slate-300">{children}</td>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-white/5 px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-emerald-400">
      {children}
    </th>
  );
}

const sectionMap: Record<string, string> = {
  "Best for": "bestFor",
  "Price range": "priceRange",
  "Included work": "whatIsIncluded",
  "Not included": "whatIsNotIncluded",
  "Delivery type": "pricingModel",
  "Upgrade path": "recommendedUpsells",
  "Consult required": "purchaseMode",
  Coverage: "whatIsIncluded",
  "Support style": "tags",
  "Security depth": "bestFor",
  "Review cadence": "customerOutcomes",
  "One-time vs recurring": "pricingModel",
  "Best fit": "bestFor",
  "Follow-up path": "recommendedUpsells",
};

function extractSectionValues(sectionName: string, product: CatalogProduct): string[] {
  switch (sectionMap[sectionName]) {
    case "bestFor":
      return product.bestFor;
    case "priceRange":
      return [product.priceRange];
    case "whatIsIncluded":
      return product.whatIsIncluded;
    case "whatIsNotIncluded":
      return product.whatIsNotIncluded;
    case "pricingModel":
      return [product.pricingModel.replace(/_/g, " ")];
    case "recommendedUpsells": {
      const allProducts = getAllProducts();
      return product.recommendedUpsells.length > 0
        ? product.recommendedUpsells.map((id: string) => {
            const prod = allProducts.find((p: CatalogProduct) => p.id === id);
            return prod ? prod.name : id;
          })
        : ["N/A"];
    }
    case "purchaseMode":
      return [product.purchaseMode.replace(/_/g, " ")];
    case "tags":
      return product.tags;
    case "customerOutcomes":
      return product.customerOutcomes;
    default:
      return ["—"];
  }
}

export default async function CompareDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) notFound();

  const allProducts = getAllProducts();
  const items: CatalogProduct[] = comparison.items
    .map((id: string) => allProducts.find((p: CatalogProduct) => p.id === id))
    .filter((p): p is CatalogProduct => p !== undefined);

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/store"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Store
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/store/compare"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Compare
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{comparison.title}</span>
        </nav>

        <h1 className="font-orbitron mb-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          {comparison.title}
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-slate-400">
          Side-by-side comparison of features, scope, and pricing.
        </p>

        <div className="overflow-x-auto rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] backdrop-blur-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell>Feature</HeaderCell>
                {items.map((product) => (
                  <HeaderCell key={product.id}>
                    <Link
                      href={`/store/${product.slug}`}
                      className="text-emerald-400 no-underline transition hover:text-emerald-300"
                    >
                      {product.name}
                    </Link>
                  </HeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.sections.map((section: string) => (
                <tr key={section}>
                  <td className="border border-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    {section}
                  </td>
                  {items.map((product) => {
                    const values = extractSectionValues(section, product);
                    return (
                      <Cell key={product.id}>
                        {values.length > 0 ? (
                          <ul className="space-y-1">
                            {values.map((v: string, i: number) => (
                              <li key={i} className="leading-snug">
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Not Sure? Talk to Us
          </Link>
        </div>
      </div>
    </section>
  );
}
