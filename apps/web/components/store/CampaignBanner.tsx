import { getActiveCampaigns } from "@/lib/catalog/loader";
import StoreIconTile from "@/components/store/StoreIconTile";
import Link from "next/link";

const accentMap: Record<string, string> = {
  teal: "border-teal-600/30 bg-teal-600/5 text-teal-400",
  blue: "border-blue-600/30 bg-blue-600/5 text-blue-400",
  purple: "border-purple-600/30 bg-purple-600/5 text-purple-400",
  green: "border-emerald-600/30 bg-emerald-600/5 text-emerald-400",
  cyan: "border-cyan-600/30 bg-cyan-600/5 text-cyan-400",
};

const badgeAccentMap: Record<string, string> = {
  teal: "bg-teal-600/10 text-teal-400 border-teal-600/20",
  blue: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  purple: "bg-purple-600/10 text-purple-400 border-purple-600/20",
  green: "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
  cyan: "bg-cyan-600/10 text-cyan-400 border-cyan-600/20",
};

export default function CampaignBanner() {
  const campaigns = getActiveCampaigns();
  const displayed = campaigns.slice(0, 2);
  if (displayed.length === 0) return null;

  return (
    <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span className="font-orbitron inline-block rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
            Seasonal Focus
          </span>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {displayed.map((campaign) => {
            const accent = campaign.visual.accent || "green";
            const cardBorder = accentMap[accent] || accentMap.green;
            const badgeStyle = badgeAccentMap[accent] || badgeAccentMap.green;
            return (
              <div
                key={campaign.id}
                className={`flex flex-col rounded-xl border ${cardBorder.split(" ")[0]} bg-[rgba(18,30,45,0.5)] p-8 backdrop-blur-sm transition hover:bg-[rgba(18,30,45,0.7)]`}
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0A1118]/60">
                    <StoreIconTile iconName={campaign.visual.icon} className="h-6 w-6" size={24} />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
                      {campaign.name}
                    </h3>
                    <p className="text-xs text-slate-500">{campaign.audience}</p>
                  </div>
                </div>
                <p className="mb-6 flex-1 leading-relaxed text-slate-300">{campaign.headline}</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.trustBadges.map((badge) => (
                    <span
                      key={badge}
                      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeStyle}`}
                    >
                      {badge.replace(/_/g, " ")}
                    </span>
                  ))}
                  {campaign.promoEligibility.map((promo) => (
                    <span
                      key={promo}
                      className="rounded-full border border-purple-600/20 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-400"
                    >
                      {promo.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
