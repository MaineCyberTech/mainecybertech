"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import { usePermissions, type ServerPermissionData } from "@/lib/use-permissions";

import { ADMIN_NAV_GROUPS as GROUPS } from "@/lib/navigation/admin-nav";

export default function AdminSidebarContent({
  mobile,
  permissions,
}: {
  mobile?: boolean;
  permissions?: ServerPermissionData | null;
}) {
  const pathname = usePathname() ?? "";
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const groupButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const groupLinks = useRef<Record<string, HTMLAnchorElement | null>>({});
  const { can, loading } = usePermissions(permissions);

  // Longest matching href wins, so `/admin/store/products` does not also mark
  // `/admin/store` active (which produced duplicate aria-current="page").
  const activeHref = useMemo(() => {
    const hrefs = GROUPS.flatMap((group) => group.items.map((item) => item.href));
    const matches = hrefs.filter((h) => pathname === h || pathname.startsWith(`${h}/`));
    return matches.sort((a, b) => b.length - a.length)[0] ?? null;
  }, [pathname]);

  const isActive = (href: string) => href === activeHref;

  const visibleGroups = loading
    ? []
    : GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.module) return true;
          return can(item.module, "view");
        }),
      })).filter((group) => group.items.length > 0);

  const groupFlyoutId = (label: string) =>
    `admin-sidebar-flyout-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleGroupKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    label: string,
    isOpen: boolean,
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setActiveGroup(label);
      setTimeout(() => groupLinks.current[`${label}-0`]?.focus(), 0);
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      setActiveGroup(null);
      groupButtons.current[label]?.focus();
    }
  };

  const handleFlyoutKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, label: string) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setActiveGroup(null);
      groupButtons.current[label]?.focus();
    }
  };

  // Auto-expand the group containing the current route
  const autoGroup =
    (loading ? [] : visibleGroups.find((g) => g.items.some((i) => isActive(i.href)))?.label) ??
    null;
  const openGroup = activeGroup ?? autoGroup;

  if (loading) {
    return (
      <nav aria-label="Admin navigation" className="space-y-2">
        <div className="h-8 animate-pulse rounded bg-white/5" />
        <div className="h-8 animate-pulse rounded bg-white/5" />
        <div className="h-8 animate-pulse rounded bg-white/5" />
      </nav>
    );
  }

  return (
    <nav aria-label="Admin navigation" className="relative space-y-1">
      {visibleGroups.map((group) => {
        const isOpen = openGroup === group.label;
        return (
          <div key={group.label} className="relative">
            <button
              onClick={() => setActiveGroup(isOpen ? null : group.label)}
              onKeyDown={(e) => handleGroupKeyDown(e, group.label, isOpen)}
              ref={(el) => {
                groupButtons.current[group.label] = el;
              }}
              className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
                isOpen
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={groupFlyoutId(group.label)}
            >
              <span>{group.label}</span>
              <svg
                className={`h-3 w-3 transition ${isOpen ? "-rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Flyout on desktop, inline on mobile */}
            {isOpen &&
              (mobile ? (
                <div
                  id={groupFlyoutId(group.label)}
                  onKeyDown={(e) => handleFlyoutKeyDown(e, group.label)}
                  className="ml-3 space-y-0.5 border-l border-white/10"
                >
                  {group.items.map((item, itemIndex) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveGroup(null)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      ref={(el) => {
                        groupLinks.current[`${group.label}-${itemIndex}`] = el;
                      }}
                      className={`block border-l-2 px-3 py-1.5 text-xs transition ${
                        isActive(item.href)
                          ? "border-emerald-500 bg-emerald-500/5 font-medium text-emerald-400"
                          : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <div
                  id={groupFlyoutId(group.label)}
                  onKeyDown={(e) => handleFlyoutKeyDown(e, group.label)}
                  className="absolute left-full top-0 z-30 ml-2 w-52 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-2xl backdrop-blur-sm"
                >
                  <p className="mb-1.5 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {group.label}
                  </p>
                  {group.items.map((item, itemIndex) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveGroup(null)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      ref={(el) => {
                        groupLinks.current[`${group.label}-${itemIndex}`] = el;
                      }}
                      className={`block rounded px-3 py-1.5 text-xs transition ${
                        isActive(item.href)
                          ? "bg-emerald-600/15 font-medium text-emerald-400"
                          : "text-slate-300 hover:bg-white/5 hover:text-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
