"use client";

import { useState } from "react";
import { getActiveCampaigns } from "@/lib/catalog/loader";
import type { SeasonalCampaign } from "@/lib/catalog/types";
import StoreIconTile from "@/components/store/StoreIconTile";

interface CampaignCardProps {
  campaign: SeasonalCampaign;
  enabled: boolean;
  onToggle: () => void;
}

function CampaignCard({ campaign, enabled, onToggle }: CampaignCardProps) {
  return (
    <div
      className={`glass-card rounded-xl border p-5 transition ${
        enabled
          ? "border-emerald-600/30 bg-gradient-to-br from-emerald-600/5 to-transparent"
          : "border-white/10 opacity-60"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0A1118]/60">
            <StoreIconTile iconName={campaign.visual.icon} className="h-5 w-5" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-50">{campaign.name}</h3>
            <p className="text-[11px] text-slate-500">ID: {campaign.id}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition ${
            enabled ? "bg-emerald-600" : "bg-slate-700"
          }`}
          aria-label={enabled ? "Disable campaign" : "Enable campaign"}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-400">{campaign.headline}</p>

      <div className="mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Audience
        </span>
        <p className="mt-0.5 text-xs text-slate-300">{campaign.audience}</p>
      </div>

      <div className="mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Recommended Products
        </span>
        <div className="mt-1 flex flex-wrap gap-1">
          {campaign.recommendedProducts.map((pid) => (
            <span
              key={pid}
              className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-500"
            >
              {pid}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {campaign.trustBadges.map((badge) => (
          <span
            key={badge}
            className="rounded border border-amber-600/20 bg-amber-600/10 px-2 py-0.5 text-[10px] text-amber-400"
          >
            {badge}
          </span>
        ))}
        {campaign.promoEligibility.map((promo) => (
          <span
            key={promo}
            className="rounded border border-purple-600/20 bg-purple-600/10 px-2 py-0.5 text-[10px] text-purple-400"
          >
            {promo}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CampaignsManagerClient() {
  const campaigns = getActiveCampaigns();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const c of campaigns) {
      map[c.id] = true;
    }
    return map;
  });

  const handleToggle = (id: string) => {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const enabledCount = Object.values(enabledMap).filter(Boolean).length;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Campaigns
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {enabledCount} / {campaigns.length} active
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            enabled={enabledMap[campaign.id] ?? true}
            onToggle={() => handleToggle(campaign.id)}
          />
        ))}
      </div>

      <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-6">
        <p className="text-xs text-slate-500">
          Campaign enable/disable state is in-memory only and resets on page reload. To make
          permanent changes, modify{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-emerald-400">
            lib/catalog/data/seasonal-campaigns.json
          </code>
        </p>
      </div>
    </div>
  );
}
