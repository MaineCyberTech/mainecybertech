import { Skeleton } from "@mct/ui";

export default function PortalLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-9 w-20" />
        ))}
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="h-9 w-32" />
          <Skeleton variant="rectangular" className="h-9 w-32" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <Skeleton className="h-5 w-36" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 rounded-lg bg-white/[0.03] p-3">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="mt-2 h-2 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
