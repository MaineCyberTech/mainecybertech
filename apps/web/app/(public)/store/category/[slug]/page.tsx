import { getCategoryBySlug, getProductsByCategory, getCategories } from "@/lib/catalog/loader";
import StoreProductCard from "@/components/store/StoreProductCard";
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
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  return buildMetadata({
    title: `${category.name} Services`,
    description: category.description,
    path: `/store/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(category.id);
  const categories = getCategories();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/store"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Store
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{category.name}</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {category.name.split(" ")[0]}{" "}
            <span className="text-emerald-500">{category.name.split(" ").slice(1).join(" ")}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-400">
            {category.description}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {products.length} service{products.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Other categories quick nav */}
        <div className="mb-12 flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== slug)
            .slice(0, 6)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/store/category/${c.slug}`}
                className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-600/20"
              >
                {c.name}
              </Link>
            ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-amber-600/20 bg-amber-600/5 p-8 text-center backdrop-blur-sm">
            <p className="text-lg font-semibold text-slate-300">
              No services available in this category yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Check back soon or browse other categories.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((p) => p.display)
              .map((p) => (
                <StoreProductCard
                  key={p.slug}
                  slug={p.slug}
                  name={p.name}
                  summary={p.summary}
                  priceRange={p.priceRange}
                  categoryName={p.category}
                  categorySlug={slug}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
