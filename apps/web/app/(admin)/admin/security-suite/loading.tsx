import { Skeleton } from "@mct/ui";

export default function SecuritySuiteLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-9 w-24" />
        ))}
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton variant="rectangular" className="h-9 w-28" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-3 h-3 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
