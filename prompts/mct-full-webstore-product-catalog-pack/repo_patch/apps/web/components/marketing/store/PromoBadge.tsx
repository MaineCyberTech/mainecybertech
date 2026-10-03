export function PromoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700">
      {children}
    </span>
  );
}
