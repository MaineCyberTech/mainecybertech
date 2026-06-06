export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-pulse">
      <div className="h-4 w-48 rounded bg-white/5" />
      <div className="flex gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-white/5" />
        ))}
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-8 w-72 rounded bg-white/5" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-white/5" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="h-4 w-3/4 rounded bg-white/5" />
            <div className="mt-3 h-3 w-1/2 rounded bg-white/5" />
            <div className="mt-2 h-3 w-1/4 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
