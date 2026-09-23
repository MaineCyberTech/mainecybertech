"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminGroupForKey } from "@/lib/navigation/admin-nav";
import { usePermissions } from "@/lib/use-permissions";

/**
 * Contextual sibling navigation for an admin section. Renders the other
 * destinations in the same sidebar group as horizontal tabs. Previously this
 * was a no-op (`return null`) that ~100 pages passed as a prop.
 */
export default function AdminSubnav({ current }: { current: string }) {
  const pathname = usePathname();
  const { can, loading } = usePermissions();
  const group = adminGroupForKey(current);

  if (loading || !group) return null;

  const items = group.items.filter((item) => !item.module || can(item.module, "view"));
  if (items.length < 2) return null;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label={`${group.label} section`} className="mb-4 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-white/10">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-2 px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
