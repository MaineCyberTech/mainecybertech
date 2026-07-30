import Link from "next/link";
import { type Promotion } from "@/lib/catalog/promotions";
import PromoBadge from "@/components/store/PromoBadge";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Current Promotions & Offers",
  description:
    "View active promotions, bundle savings, starter credits, and limited-time offers from Maine CyberTech.",
  path: "/store/promotions",
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const promoTypeLabels: Record<string, string> = {
  bundle_savings: "Bundle Savings",
  starter_credit: "Starter Credit",
  seasonal_offer: "Seasonal Offer",
  new_client_foundation: "New Client Foundation",
  limited_capacity: "Limited Capacity",
  free_addon: "Free Add-on",
};

async function fetchActivePromotions(): Promise<Promotion[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/store/promotions`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      badgeText: (p as any).badge_text as string || "",
      detailText: (p as any).detail_text as string || "",
      promoType: (p as any).promo_type as string || "bundle_savings",
      status: (p as any).status as string || "active",
      terms: p.terms as string || "",
      eligibilityTargets: ((p as any).eligibility_targets as string[]) || [],
      startDate: (p as any).start_date as string || undefined,
      endDate: (p as any).end_date as string || undefined,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
    }));
  } catch {
    return [];
  }
}

export default async function PublicPromotionsPage() {
  const active = await fetchActivePromotions();

  return (
    <>
      <section className="px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl lg:text-6xl">
            Current{" "}
            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
              Promotions
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Limited-time offers, bundle savings, and starter credits for new and existing clients.
            All promotions have real eligibility rules and honest terms.
          </p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          {active.length === 0 ? (
            <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-12 text-center backdrop-blur-sm">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-300">
                No Active Promotions
              </h2>
              <p className="mt-3 text-slate-400">
                Check back soon for new offers, or browse our services to see what we can do for
                you.
              </p>
              <Link
                href="/store"
                className="font-orbitron mt-6 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {active.map((p) => (
                <PromotionCard key={p.id} promotion={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function PromotionCard({ promotion: p }: { promotion: Promotion }) {
  const isExpiring =
    p.endDate && new Date(p.endDate).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0F172A]/60 p-6 backdrop-blur-sm transition hover:border-emerald-600/20">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
          {p.name}
        </h3>
        <PromoBadge
          text={p.badgeText}
          type={p.promoType as "bundle_savings" | "starter_credit" | "seasonal_offer" | undefined}
        />
      </div>

      {p.detailText && <p className="mt-3 leading-relaxed text-slate-300">{p.detailText}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
          {promoTypeLabels[p.promoType] || p.promoType}
        </span>
        {p.eligibilityTargets.length === 1 && p.eligibilityTargets[0] === "all" ? (
          <span>Eligible for all services</span>
        ) : (
          <span>{p.eligibilityTargets.length} eligible services</span>
        )}
        {isExpiring && p.endDate && (
          <span className="text-amber-400">
            Expires{" "}
            {new Date(p.endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {p.terms && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">
            Terms & Eligibility
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
            {p.terms}
          </p>
        </details>
      )}
    </div>
  );
}
