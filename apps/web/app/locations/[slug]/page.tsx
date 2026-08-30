import { getSEOLandingPages } from "@/lib/catalog/v5-loaders";
import { getProductsByCategory, getCategories } from "@/lib/catalog/loader";
import StoreProductCard from "@/components/store/StoreProductCard";
import FAQSection from "@/components/store/FAQSection";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pages = getSEOLandingPages();
  const match = pages.find((p) =>
    slug.includes(
      p.slug.replace("/locations/", "").replace("{town}", "").replace("-it-support", ""),
    ),
  );
  return {
    title: match?.title ?? "Location Services | Maine CyberTech",
    description: `IT support and cybersecurity services in your area.`,
  };
}

const locationNames: Record<string, string> = {
  limington: "Limington",
  standish: "Standish",
  buxton: "Buxton",
  hollis: "Hollis",
  gorham: "Gorham",
  windham: "Windham",
  scarborough: "Scarborough",
  portland: "Portland",
};

function extractTown(slug: string): string {
  for (const [key, name] of Object.entries(locationNames)) {
    if (slug.includes(key)) return name;
  }
  return slug
    .replace("-it-support", "")
    .replace("-services", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function LocationLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pages = getSEOLandingPages();
  const match = pages.find((p) =>
    slug.includes(
      p.slug.replace("/locations/", "").replace("{town}", "").replace("-it-support", ""),
    ),
  );

  if (!match) notFound();

  const town = extractTown(slug);
  const categories = getCategories();
  const relevantCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes("network") ||
      c.name.toLowerCase().includes("security") ||
      c.name.toLowerCase().includes("support") ||
      c.name.toLowerCase().includes("cloud") ||
      c.name.toLowerCase().includes("managed"),
  );
  const allProducts = relevantCategories.flatMap((c) =>
    getProductsByCategory(c.id).filter((p) => p.display),
  );

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Locations / {town}</span>
        </nav>

        <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          {town} <span className="text-emerald-500">IT Support & Cybersecurity</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-400">
          Professional IT support, cybersecurity, and technology services serving {town}, Maine and
          the surrounding area.
        </p>
      </div>

      {allProducts.length > 0 && (
        <div className="mx-auto mt-16 max-w-7xl">
          <h2 className="font-orbitron mb-8 text-center text-2xl font-bold uppercase tracking-wider text-slate-50">
            Services Available in <span className="text-emerald-500">{town}</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allProducts.map((p) => (
              <StoreProductCard
                key={p.slug}
                slug={p.slug}
                name={p.name}
                summary={p.summary}
                priceRange={p.priceRange}
                categoryName={p.category}
                categorySlug={p.categoryId}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto mt-24 max-w-3xl">
        <FAQSection categoryId="support" />
      </div>

      <div className="mx-auto mt-16 max-w-4xl text-center">
        <Link
          href="/contact"
          className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
        >
          Get Started in {town}
        </Link>
      </div>
    </section>
  );
}
