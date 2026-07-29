import {
  getCategories,
  getFeaturedProducts,
  getMonthlyPlans,
  getEmergencyProducts,
  getCategoryOrder,
} from "@/lib/catalog/loader";
import StoreProductCard from "@/components/store/StoreProductCard";
import StoreCategoryCard from "@/components/store/StoreCategoryCard";
import CampaignBanner from "@/components/store/CampaignBanner";
import PackageLadder from "@/components/store/PackageLadder";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Browse Our Services",
  description:
    "Explore IT services, cybersecurity solutions, Microsoft 365 support, Wi-Fi networking, security cameras, backup plans, monthly care packages, and emergency support for Maine businesses and organizations.",
  path: "/store",
});

export default function StorePage() {
  const categories = getCategories();
  const order = getCategoryOrder();
  const featured = getFeaturedProducts();
  const monthlyPlans = getMonthlyPlans();
  const emergency = getEmergencyProducts();

  const orderedCategories = order
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
    .filter((c) => c!.slug !== "monthly-it-plans" && c!.slug !== "emergency-support");

  return (
    <>
      <section className="flex min-h-[60vh] items-center justify-center px-4 pb-16 pt-24 text-center sm:pb-24 sm:pt-32">
        <div className="max-w-4xl">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl lg:text-6xl">
            Browse Our{" "}
            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
              Services
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Every service includes clear scope, fixed or estimated pricing, plain-English
            documentation, and practical next steps. No enterprise overhead, no surprise billing.
          </p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 backdrop-blur-sm">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
              Not Sure Where to Start?
            </h2>
            <p className="mt-3 leading-relaxed text-slate-400">
              If you are not sure which service fits your situation, start with a{" "}
              <strong className="text-slate-200">Quick Fix</strong> or a{" "}
              <strong className="text-slate-200">Consultation</strong>. We will listen to what is
              going on, ask a few questions, and recommend the right next step — no pressure, no
              upsells.
            </p>
            <Link
              href="/contact"
              className="font-orbitron mt-6 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Talk to a Human
            </Link>
          </div>
        </div>
      </section>

      <CampaignBanner />

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-orbitron mb-12 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Browse by <span className="text-emerald-500">Category</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orderedCategories.map((cat) => (
              <StoreCategoryCard
                key={cat!.slug}
                name={cat!.name}
                slug={cat!.slug}
                description={cat!.description}
                count={cat!.count}
              />
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-orbitron mb-4 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
              Quick <span className="text-emerald-500">Wins</span>
            </h2>
            <p className="mb-12 text-center text-lg text-slate-400">
              Focused, low-friction services that solve a specific problem or give you a clear
              improvement path — typically completed in one session.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((product) => (
                <StoreProductCard
                  key={product.slug}
                  slug={product.slug}
                  name={product.name}
                  summary={product.summary}
                  priceRange={product.priceRange}
                  categoryName={product.category}
                  categorySlug={product.categoryId}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-orbitron mb-4 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Compare <span className="text-emerald-500">Packages</span>
          </h2>
          <p className="mb-12 text-center text-lg text-slate-400">
            Not sure which tier fits? See how our packages compare across Cybersecurity and
            Microsoft 365 — from essential protection to full coverage.
          </p>
          <div className="mb-12">
            <h3 className="font-orbitron mb-6 text-center text-lg font-bold uppercase tracking-wider text-slate-400">
              Cybersecurity
            </h3>
            <PackageLadder category="Cybersecurity" />
          </div>
          <div>
            <h3 className="font-orbitron mb-6 text-center text-lg font-bold uppercase tracking-wider text-slate-400">
              Microsoft 365
            </h3>
            <PackageLadder category="Microsoft 365" />
          </div>
        </div>
      </section>

      {monthlyPlans.length > 0 && (
        <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-orbitron mb-12 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
              Monthly IT <span className="text-emerald-500">Plans</span>
            </h2>
            <p className="mb-12 text-center text-lg text-slate-400">
              Predictable monthly support and security plans for organizations that want ongoing
              coverage without hiring a full-time IT person.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {monthlyPlans.map((plan) => (
                <StoreProductCard
                  key={plan.slug}
                  slug={plan.slug}
                  name={plan.name}
                  summary={plan.summary}
                  priceRange={plan.priceRange}
                  categoryName={plan.category}
                  categorySlug={plan.categoryId}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {emergency.length > 0 && (
        <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-orbitron mb-4 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
              Emergency <span className="text-emerald-500">Support</span>
            </h2>
            <p className="mb-4 text-center text-lg text-slate-400">
              When something breaks, we can help. These services are designed for urgent situations
              where you need a focused response fast.
            </p>
            <p className="mb-12 text-center text-sm text-slate-500">
              If you are actively compromised or experiencing a live outage, call us at{" "}
              <strong className="text-emerald-400">(207) 222-7525</strong> — do not use the contact
              form.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {emergency.map((product) => (
                <StoreProductCard
                  key={product.slug}
                  slug={product.slug}
                  name={product.name}
                  summary={product.summary}
                  priceRange={product.priceRange}
                  categoryName={product.category}
                  categorySlug={product.categoryId}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Ready to Get <span className="text-emerald-500">Started?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Pick a service above, or tell us what is happening and we will recommend the right fit.
            No commitment, no pressure.
          </p>
          <Link
            href="/contact"
            className="font-orbitron mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
