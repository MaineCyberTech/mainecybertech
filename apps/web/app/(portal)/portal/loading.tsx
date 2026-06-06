export default function PortalLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-pulse">
      <div className="h-4 w-48 rounded bg-white/5" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-lg bg-white/5" />
        ))}
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-white/5" />
          <div className="h-4 w-40 rounded bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-lg bg-white/5" />
          <div className="h-9 w-32 rounded-lg bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="h-5 w-36 rounded bg-white/5" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 rounded-lg bg-white/[0.03] p-3">
                  <div className="h-3 w-3/4 rounded bg-white/5" />
                  <div className="mt-2 h-2 w-1/4 rounded bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
