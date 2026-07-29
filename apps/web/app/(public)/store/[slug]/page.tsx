import { getCategories, getAllProducts, getProductsByCategory } from "@/lib/catalog/loader";
import { getRecommendationsForProduct } from "@/lib/catalog/bundles";
import StoreProductCard from "@/components/store/StoreProductCard";
import FAQSection from "@/components/store/FAQSection";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import TrustBadgeList from "@/components/store/TrustBadgeList";
import IntakeFormRenderer from "@/components/store/IntakeFormRenderer";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getAllProducts()
    .filter((p) => p.display)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getAllProducts().find((p) => p.slug === slug);
  if (!product) return { title: "Service Not Found" };

  return buildMetadata({
    title: product.name,
    description: product.summary,
    path: `/store/${slug}`,
  });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm">
      <h2 className="font-orbitron mb-4 text-lg font-bold uppercase tracking-wider text-emerald-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
      {children}
    </span>
  );
}

export default async function StoreProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getAllProducts().find((p) => p.slug === slug);
  if (!product) notFound();

  const recommendations = getRecommendationsForProduct(product.id);
  const sameCategory = getProductsByCategory(product.categoryId).filter(
    (p) => p.slug !== slug && p.display,
  );
  const category = getCategories().find((c) => c.id === product.categoryId);

  const intakePreview = product.intakeFields.slice(0, 4);

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
          {category && (
            <>
              <span className="text-slate-400">{category.name}</span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-slate-300">{product.name}</span>
        </nav>

        <div className="mb-12">
          <Badge>{product.category}</Badge>
          <div className="mt-4">
            <TrustBadgeList surface="product_detail" maxBadges={4} />
          </div>
          <h1 className="font-orbitron mt-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">{product.summary}</p>
          <p className="font-orbitron mt-4 text-xl font-bold text-emerald-400">
            {product.priceRange}
          </p>
        </div>

        <div className="space-y-8">
          {product.marketingCopy && (
            <p className="leading-relaxed text-slate-400">{product.marketingCopy}</p>
          )}

          {product.bestFor.length > 0 && (
            <SectionCard title="Best For">
              <ul className="space-y-2">
                {product.bestFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-emerald-500">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {product.whatIsIncluded.length > 0 && (
            <SectionCard title="What Is Included">
              <ul className="space-y-2">
                {product.whatIsIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {product.customerOutcomes.length > 0 && (
            <SectionCard title="What You Get">
              <ul className="space-y-2">
                {product.customerOutcomes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-emerald-500">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {product.whatIsNotIncluded.length > 0 && (
            <SectionCard title="What Is Not Included">
              <ul className="space-y-2">
                {product.whatIsNotIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-0.5 text-slate-500">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {product.customerPrerequisites.length > 0 && (
            <SectionCard title="Customer Prerequisites">
              <ul className="space-y-2">
                {product.customerPrerequisites.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-amber-400">ⓘ</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {intakePreview.length > 0 && (
            <SectionCard title="Questions We Will Ask">
              <p className="mb-4 text-sm text-slate-500">To get started, we will ask about:</p>
              <ul className="space-y-3">
                {intakePreview.map((field) => (
                  <li key={field.id} className="text-sm">
                    <span className="font-semibold text-slate-200">{field.label}</span>
                    {field.required && <span className="ml-1 text-xs text-red-400">*</span>}
                    {field.help && <p className="mt-0.5 text-xs text-slate-500">{field.help}</p>}
                  </li>
                ))}
              </ul>
              {product.intakeFields.length > 4 && (
                <p className="mt-4 text-xs text-slate-500">
                  +{product.intakeFields.length - 4} more question
                  {product.intakeFields.length - 4 !== 1 ? "s" : ""}
                </p>
              )}
            </SectionCard>
          )}

          <div className="rounded-lg border border-amber-600/20 bg-amber-600/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              ⚠ Safe Access Notice
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Do not paste passwords, recovery codes, MFA seeds, API keys, or any sensitive
              credentials into the contact form. Maine CyberTech will coordinate secure access
              methods during onboarding.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href={`/contact?service=${product.slug}`}
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Request This Service
          </Link>
        </div>

        {product.intakeFields.length > 0 && (
          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="font-orbitron mb-8 text-center text-2xl font-bold uppercase tracking-wider text-slate-50">
              Request This <span className="text-emerald-500">Service</span>
            </h2>
            <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm sm:p-10">
              <IntakeFormRenderer
                productId={product.id}
                productName={product.name}
                productSlug={product.slug}
                categoryName={product.category}
                fields={product.intakeFields}
              />
            </div>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="mx-auto mt-24 max-w-7xl">
          <h2 className="font-orbitron mb-12 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Recommended <span className="text-emerald-500">Next Steps</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <StoreProductCard
                key={rec.slug}
                slug={rec.slug}
                name={rec.name}
                summary={rec.summary}
                priceRange={rec.priceRange}
                categoryName={rec.category}
                categorySlug={rec.categoryId}
              />
            ))}
          </div>
        </div>
      )}

      {sameCategory.length > 0 && (
        <div className="mx-auto mt-24 max-w-7xl">
          <h2 className="font-orbitron mb-12 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            More <span className="text-emerald-500">{product.category}</span> Services
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sameCategory.map((p) => (
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
        <FAQSection productId={product.id} />
      </div>
    </section>
  );
}
