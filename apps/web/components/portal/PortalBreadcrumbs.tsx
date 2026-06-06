import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

type PortalBreadcrumbsProps = {
  items: Crumb[];
};

export default function PortalBreadcrumbs({ items }: PortalBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-emerald-400">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-slate-200" : "text-slate-400"}>
                  {item.label}
                </span>
              )}

              {!isLast ? <span className="text-slate-600">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
