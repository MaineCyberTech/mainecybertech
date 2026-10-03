export function SeverityPill({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    p0: "border-red-500/25 bg-red-500/10 text-red-300",
    p1: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    p2: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    p3: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${colorMap[severity.toLowerCase()] || colorMap.p3}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}
