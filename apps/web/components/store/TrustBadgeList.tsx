import type { TrustBadge, TrustBadgesData, TrustBadgePlacement } from "@/lib/catalog/types";
import { getTrustBadges } from "@/lib/catalog/loader";

interface TrustBadgeListProps {
  surface: string;
  riskLevel?: "normal" | "elevated" | "high" | "emergency";
  maxBadges?: number;
}

export default function TrustBadgeList({
  surface,
  riskLevel = "normal",
  maxBadges: maxBadgesProp,
}: TrustBadgeListProps) {
  const data: TrustBadgesData = getTrustBadges();
  const badges: TrustBadge[] = data.badges;
  const rules: TrustBadgePlacement[] = data.placementRules;

  const rule = rules.find((r) => r.surface === surface);
  if (!rule) return null;

  let selected: TrustBadge[] = [];

  if (rule.requiredBadges) {
    selected = badges.filter((b) => rule.requiredBadges!.includes(b.id));
  } else {
    selected = badges.slice(0, maxBadgesProp ?? rule.maxBadges ?? 2);
  }

  if (surface === "sensitive_service" && riskLevel === "elevated") {
    const consultBadge = badges.find((b) => b.id === "consult_required_sensitive");
    if (consultBadge && !selected.find((b) => b.id === "consult_required_sensitive")) {
      selected.push(consultBadge);
    }
  }

  if (selected.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" role="list" aria-label="Trust badges">
      {selected.map((badge) => (
        <li
          key={badge.id}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
          title={badge.description}
        >
          <span aria-hidden="true" className="text-emerald-400">
            &#10003;
          </span>
          <span>{badge.label}</span>
        </li>
      ))}
    </ul>
  );
}
