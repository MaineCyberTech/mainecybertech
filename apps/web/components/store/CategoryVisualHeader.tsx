import StoreIconTile from "./StoreIconTile";

interface CategoryVisualHeaderProps {
  categoryName: string;
  iconName: string;
  description: string;
  count: number;
}

const gradientMap: Record<string, string> = {
  emerald: "from-emerald-600/20 via-emerald-800/10 to-transparent",
  teal: "from-teal-600/20 via-teal-800/10 to-transparent",
  blue: "from-blue-600/20 via-blue-800/10 to-transparent",
  purple: "from-purple-600/20 via-purple-800/10 to-transparent",
  green: "from-green-600/20 via-green-800/10 to-transparent",
  cyan: "from-cyan-600/20 via-cyan-800/10 to-transparent",
  sky: "from-sky-600/20 via-sky-800/10 to-transparent",
  amber: "from-amber-600/20 via-amber-800/10 to-transparent",
  red: "from-red-600/20 via-red-800/10 to-transparent",
};

const accentMap: Record<string, string> = {
  emerald: "text-emerald-400 border-emerald-600/30",
  teal: "text-teal-400 border-teal-600/30",
  blue: "text-blue-400 border-blue-600/30",
  purple: "text-purple-400 border-purple-600/30",
  green: "text-green-400 border-green-600/30",
  cyan: "text-cyan-400 border-cyan-600/30",
  sky: "text-sky-400 border-sky-600/30",
  amber: "text-amber-400 border-amber-600/30",
  red: "text-red-400 border-red-600/30",
};

export default function CategoryVisualHeader({
  categoryName,
  iconName,
  description,
  count,
}: CategoryVisualHeaderProps) {
  const accent = iconName.toLowerCase().includes("shield")
    ? "teal"
    : iconName.toLowerCase().includes("heart")
      ? "blue"
      : iconName.toLowerCase().includes("file")
        ? "purple"
        : iconName.toLowerCase().includes("trend")
          ? "green"
          : iconName.toLowerCase().includes("spark")
            ? "cyan"
            : "emerald";

  const gradient = gradientMap[accent] || gradientMap.emerald;
  const accentStyle = accentMap[accent] || accentMap.emerald;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${gradient} p-8 sm:p-12`}
    >
      <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-cyber-base/60 backdrop-blur-sm">
          <StoreIconTile iconName={iconName} className="h-10 w-10" size={40} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-orbitron text-2xl font-bold uppercase tracking-wider text-slate-50">
              {categoryName}
            </h2>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${accentStyle}`}
            >
              {count} {count === 1 ? "service" : "services"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl leading-relaxed text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
