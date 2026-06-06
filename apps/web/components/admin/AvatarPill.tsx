type AvatarPillProps = {
  id?: string | null;
  name?: string | null;
  subtitle?: string | null;
  size?: "sm" | "md";
  active?: boolean;
};

function getInitials(name?: string | null) {
  const value = (name ?? "?").trim();
  if (!value) return "?";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export default function AvatarPill({ name, subtitle, size = "md", active = false }: AvatarPillProps) {
  const initials = getInitials(name || subtitle || "?");
  const box = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const ring = active ? "border-emerald-500/50 bg-emerald-600/15" : "border-emerald-600/25 bg-emerald-600/10";

  return (
    <div className="inline-flex items-center gap-3">
      <div className={`inline-flex ${box} items-center justify-center rounded-full border ${ring} font-semibold text-emerald-300`}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{name ?? "Unknown"}</p>
        <p className="truncate text-xs text-slate-400">{subtitle ?? ""}</p>
      </div>
    </div>
  );
}
