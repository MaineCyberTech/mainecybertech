interface PromoBadgeProps {
  text: string;
  type?: "bundle_savings" | "seasonal_offer" | "starter_credit";
}

export default function PromoBadge({ text, type = "bundle_savings" }: PromoBadgeProps) {
  const colorMap: Record<string, string> = {
    bundle_savings: "border-emerald-600/30 bg-emerald-600/10 text-emerald-400",
    seasonal_offer: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    starter_credit: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };

  const colorClass = colorMap[type] || colorMap.bundle_savings;

  return (
    <span
      role="status"
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colorClass}`}
    >
      {text}
    </span>
  );
}
