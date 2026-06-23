"use client";

import { cn } from "@mct/ui/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-white/5 border border-white/10",
        variantStyles[variant],
        className,
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
  ...props
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-card p-5 space-y-4", className)} {...props}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" className="w-20 h-8" />
        <Skeleton variant="rectangular" className="w-20 h-8" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: { rows?: number; columns?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("cyber-table-responsive", className)} {...props}>
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col}>
                  <Skeleton variant="text" width="80%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
