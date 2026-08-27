import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  total?: number;
  limit?: number;
  className?: string;
};

function pageLinkClass(active: boolean) {
  return cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-xs font-medium transition",
    active
      ? "bg-emerald-600/20 text-emerald-400"
      : "border border-white/10 text-slate-400 hover:text-slate-200",
  );
}

function pageWindow(current: number, total: number): number[] {
  const delta = 2;
  const start = Math.max(1, current - delta);
  const end = Math.min(total, current + delta);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

/**
 * Server-rendered pagination control for admin list pages backed by a
 * paginated API endpoint (returns `{ items, total, page, limit }`).
 * Renders nothing when there is a single page or less.
 */
export default function AdminPagination({
  currentPage,
  totalPages,
  buildHref,
  total,
  limit,
  className,
}: Props) {
  if (totalPages <= 1) return null;

  const window = pageWindow(currentPage, totalPages);
  const first = window[0];
  const last = window[window.length - 1];

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      {total !== undefined && limit !== undefined ? (
        <span className="mr-2 text-xs text-slate-400">
          {total} total &bull; page {currentPage} of {totalPages}
        </span>
      ) : null}

      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className="cyber-button-secondary text-xs">
          Previous
        </Link>
      ) : null}

      {first > 1 ? (
        <>
          <Link href={buildHref(1)} className={pageLinkClass(1 === currentPage)}>
            1
          </Link>
          {first > 2 ? <span className="px-1 text-slate-500">…</span> : null}
        </>
      ) : null}

      {window.map((p) => (
        <Link key={p} href={buildHref(p)} className={pageLinkClass(p === currentPage)}>
          {p}
        </Link>
      ))}

      {last < totalPages ? (
        <>
          {last < totalPages - 1 ? <span className="px-1 text-slate-500">…</span> : null}
          <Link href={buildHref(totalPages)} className={pageLinkClass(totalPages === currentPage)}>
            {totalPages}
          </Link>
        </>
      ) : null}

      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className="cyber-button-secondary text-xs">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
