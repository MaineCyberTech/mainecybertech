export function TrustBadge({ label, description }: { label: string; description?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      <span aria-hidden="true">✓</span>
      <span>{label}</span>
      {description ? <span className="sr-only">: {description}</span> : null}
    </span>
  );
}
