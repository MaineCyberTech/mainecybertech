import { getVisibleProducts, getActiveCampaigns } from "@/lib/catalog/loader";
import { getApiClient } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import Link from "next/link";
import type { StorePromotion } from "@mct/sdk";
import type { SeasonalCampaign } from "@/lib/catalog/types";

export const metadata = { title: "Store - Portal - Maine CyberTech" };

const categoryIcons: Record<string, string> = {
  "Quick Fixes": "🔧",
  "Monthly IT Plans": "📅",
  "Emergency Support": "🚨",
  "Security Services": "🛡️",
  Compliance: "📋",
  Infrastructure: "🏗️",
  Consulting: "💡",
  Training: "🎓",
};

interface ProductCardProps {
  product: ReturnType<typeof getVisibleProducts>[0];
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm transition hover:border-emerald-600/30 hover:shadow-[0_0_20px_rgba(5,150,105,0.1)]">
      <div className="mb-4">
        <span className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          {categoryIcons[product.category] ?? "▸"} {product.category}
        </span>
      </div>
      <h3 className="font-orbitron mb-2 text-lg font-bold text-slate-50">{product.name}</h3>
      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{product.summary}</p>
      <div className="flex items-center justify-between">
        <span className="font-orbitron text-sm font-bold text-emerald-400">
          {product.priceRange}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            product.status === "active"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-slate-600/20 bg-slate-600/10 text-slate-400"
          }`}
        >
          {product.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-4 border-t border-white/5 pt-4">
        <a
          href={`/store/products/${product.slug}`}
          className="font-orbitron w-full text-center text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:text-emerald-300"
        >
          View Details →
        </a>
      </div>
    </article>
  );
}

function PromotionCard({ promotion }: { promotion: StorePromotion }) {
  if (promotion.status !== "active") return null;

  return (
    <div className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            {promotion.badge_text && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A1118]">
                {promotion.badge_text}
              </span>
            )}
            <span className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              {promotion.promo_type.replace(/_/g, " ")}
            </span>
          </div>
          <h4 className="font-orbitron mb-1 text-base font-bold text-slate-50">{promotion.name}</h4>
          <p className="mb-3 text-sm leading-relaxed text-slate-400">{promotion.detail_text}</p>
          {promotion.terms && (
            <p className="text-xs italic leading-relaxed text-slate-500">
              Terms: {promotion.terms}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: SeasonalCampaign }) {
  return (
    <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm">
      <div className="mb-4">
        <span className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          {campaign.audience}
        </span>
      </div>
      <h4 className="font-orbitron mb-2 text-lg font-bold text-slate-50">{campaign.headline}</h4>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">
        Recommended products: {campaign.recommendedProducts.join(", ") || "Various"}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Seasonal Campaign</span>
        <Link
          href={`/store/campaigns/${campaign.id}`}
          className="font-orbitron text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:text-emerald-300"
        >
          View Campaign →
        </Link>
      </div>
    </div>
  );
}

async function fetchPromotions(): Promise<StorePromotion[]> {
  try {
    const client = getApiClient();
    return await client.store.listActivePromotions();
  } catch {
    return [];
  }
}

export default async function PortalStorePage() {
  const products = getVisibleProducts();
  const campaigns = getActiveCampaigns();
  const promotions = await fetchPromotions();

  // Group products by category
  const productsByCategory = products.reduce(
    (acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    },
    {} as Record<string, typeof products>,
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Store" }]} />
      <PortalSubnav current="store" />

      {/* Hero Section */}
      <section className="rounded-lg border border-emerald-600/20 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent p-8 backdrop-blur-sm">
        <div className="max-w-4xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              Service Catalog
            </span>
          </div>
          <h1 className="font-orbitron mb-4 text-3xl font-bold uppercase tracking-wider text-slate-50">
            Maine CyberTech Store
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Browse our complete catalog of cybersecurity services, managed IT plans, and compliance
            solutions. All pricing is transparent and tailored for small to mid-market businesses.
          </p>
        </div>
      </section>

      {/* Active Promotions */}
      {promotions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
              Current Promotions
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        </section>
      )}

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
              Seasonal Campaigns
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      )}

      {/* Product Categories */}
      <section>
        <h2 className="font-orbitron mb-6 text-xl font-bold uppercase tracking-wider text-slate-50">
          Services by Category
        </h2>
        <div className="space-y-8">
          {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
            <div key={categoryName}>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">{categoryIcons[categoryName] ?? "▸"}</span>
                <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
                  {categoryName}
                </h3>
                <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {categoryProducts.length} services
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 text-center backdrop-blur-sm">
        <h2 className="font-orbitron mb-3 text-xl font-bold uppercase tracking-wider text-slate-50">
          Need Help Choosing?
        </h2>
        <p className="mx-auto mb-6 mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Not sure which services are right for your business? Take our quick assessment or contact
          our team for a personalized recommendation.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/portal/service-catalog"
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Service Finder Quiz
          </Link>
          <Link
            href="/store/contact"
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-transparent px-8 py-3 text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/10 hover:shadow-[0_0_25px_rgba(5,150,105,0.2)]"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
