import type { ReactNode } from "react";
import { Fragment } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import { cn } from "@/lib/cn";
import AdminListPageSearch, {
  type AdminListPageSearchProps,
} from "./AdminListPageSearch";

export type AdminListPageProps<T> = {
  title: string;
  description?: string;
  subnavCurrent?: string;
  breadcrumbLabel?: string;
  items: T[];
  newHref?: string;
  newLabel?: string;
  actions?: ReactNode;
  headerContent?: ReactNode;
  search?: AdminListPageSearchProps;
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
  panel?: boolean;
  className?: string;
  getId?: (item: T) => string | number;
  renderRow?: (item: T, index: number) => ReactNode;
  children?: ReactNode;
};

function AdminListPageSkeleton({ panel }: { panel?: boolean }) {
  const rows = (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-white/10 bg-cyber-base/60"
        />
      ))}
    </div>
  );

  return panel ? <section className="cyber-panel">{rows}</section> : rows;
}

export default function AdminListPage<T>({
  title,
  description,
  subnavCurrent,
  breadcrumbLabel,
  items,
  newHref,
  newLabel,
  actions,
  headerContent,
  search,
  loading = false,
  emptyMessage,
  emptyState,
  panel = false,
  className,
  getId,
  renderRow,
  children,
}: AdminListPageProps<T>) {
  const hasItems = items.length > 0;

  const list =
    children ??
    items.map((item, index) => (
      <Fragment key={getId ? getId(item) : index}>
        {renderRow?.(item, index)}
      </Fragment>
    ));

  return (
    <div className={cn("space-y-6", className)}>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: breadcrumbLabel ?? title },
        ]}
      />
      {subnavCurrent ? <AdminSubnav current={subnavCurrent} /> : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="cyber-heading text-2xl">{title}</h1>
          {description ? <p className="mt-3 cyber-subtext">{description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {actions}
          {newHref ? (
            <Link href={newHref} className="cyber-button inline-block">
              {newLabel ?? "New"}
            </Link>
          ) : null}
        </div>
      </div>

      {headerContent}
      {search ? <AdminListPageSearch {...search} /> : null}

      {loading ? (
        <AdminListPageSkeleton panel={panel} />
      ) : !hasItems ? (
        emptyState ?? (
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-8 text-center text-sm text-slate-400">
            {emptyMessage ?? "No items found."}
          </div>
        )
      ) : panel ? (
        <section className="cyber-panel">
          <div className="mt-6 space-y-3">{list}</div>
        </section>
      ) : (
        <div className="space-y-4">{list}</div>
      )}
    </div>
  );
}
