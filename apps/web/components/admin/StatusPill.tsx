export function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    sent: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    verified: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    closed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    pending: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    draft: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    resolved: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    rejected: "border-red-500/25 bg-red-500/10 text-red-300",
    open: "border-red-500/25 bg-red-500/10 text-red-300",
    cancelled: "border-red-500/25 bg-red-500/10 text-red-300",
    expired: "border-white/10 bg-white/5 text-slate-300",
    wont_fix: "border-white/10 bg-white/5 text-slate-300",
    inactive: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${colorMap[status.toLowerCase()] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {status}
    </span>
  );
}
