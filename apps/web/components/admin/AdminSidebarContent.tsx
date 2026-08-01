"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const GROUPS = [
  {
    label: "Core",
    items: [
      { key: "home", href: "/admin", label: "Overview" },
      { key: "organizations", href: "/admin/organizations", label: "Organizations" },
      { key: "users", href: "/admin/users", label: "Users" },
      { key: "roles", href: "/admin/roles", label: "Roles" },
      { key: "tickets", href: "/admin/tickets", label: "Tickets" },
      { key: "documents", href: "/admin/documents", label: "Documents" },
      { key: "projects", href: "/admin/projects", label: "Projects" },
      { key: "approvals", href: "/admin/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Security",
    items: [
      { key: "governance", href: "/admin/governance", label: "Governance" },
      { key: "incidents", href: "/admin/incidents", label: "Incidents" },
      { key: "break-glass", href: "/admin/break-glass", label: "Break Glass" },
      { key: "id-verify", href: "/admin/id-verify", label: "ID Verify" },
      { key: "dmarc-coach", href: "/admin/dmarc-coach", label: "DMARC Coach" },
      { key: "patch-compliance", href: "/admin/patch-compliance", label: "Patches" },
      { key: "endpoint-security", href: "/admin/endpoint-security", label: "Endpoints" },
      { key: "m365-hardening", href: "/admin/m365-hardening", label: "M365" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", href: "/admin/assets", label: "Assets" },
      { key: "domain-monitors", href: "/admin/domain-monitors", label: "DNS" },
      { key: "website-monitors", href: "/admin/website-monitors", label: "Websites" },
      { key: "dmarc", href: "/admin/dmarc", label: "DMARC" },
      { key: "licenses", href: "/admin/license-optimizer", label: "Licenses" },
      { key: "uptime-monitor", href: "/admin/uptime-monitor", label: "Uptime" },
      { key: "field-services", href: "/admin/field-services", label: "Field" },
    ],
  },
  {
    label: "Clients",
    items: [
      { key: "offboarding", href: "/admin/offboarding", label: "Offboarding" },
      { key: "file-requests", href: "/admin/file-requests", label: "Files" },
      { key: "vendor-contracts", href: "/admin/vendor-contracts", label: "Contracts" },
      { key: "vendor-contacts", href: "/admin/vendor-contacts", label: "Vendors" },
      { key: "training-hub", href: "/admin/training-hub", label: "Training" },
      { key: "insurance-binder", href: "/admin/insurance-binder", label: "Insurance" },
    ],
  },
  {
    label: "Store",
    items: [
      { key: "store", href: "/admin/store", label: "Dashboard" },
      { key: "store-products", href: "/admin/store/products", label: "Products" },
      { key: "store-promotions", href: "/admin/store/promotions", label: "Promotions" },
      { key: "store-quotes", href: "/admin/store/quotes", label: "Quotes" },
      { key: "store-campaigns", href: "/admin/store/campaigns", label: "Campaigns" },
    ],
  },
  {
    label: "Tools",
    items: [
      { key: "api-keys", href: "/admin/api-keys", label: "API Keys" },
      { key: "webhooks", href: "/admin/webhooks", label: "Webhooks" },
      { key: "ai", href: "/admin/ai", label: "AI Tools" },
      { key: "edu-automation", href: "/admin/edu-automation", label: "Edu/AI" },
      { key: "final", href: "/admin/final", label: "More" },
      { key: "health", href: "/admin/health", label: "Health" },
      { key: "audit", href: "/admin/audit", label: "Audit" },
      { key: "bulk-invite", href: "/admin/bulk-invite", label: "Bulk Invite" },
    ],
  },
];

export default function AdminSidebarContent({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const groupButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const groupLinks = useRef<Record<string, HTMLAnchorElement | null>>({});

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const groupFlyoutId = (label: string) => `admin-sidebar-flyout-${label.toLowerCase().replace(/\s+/g, "-")}`;

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

  const handleFlyoutKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    label: string,
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setActiveGroup(null);
      groupButtons.current[label]?.focus();
    }
  };

  // Auto-expand the group containing the current route
  const autoGroup =
    GROUPS.find((g) => g.items.some((i) => isActive(i.href)))?.label ?? null;
  const openGroup = activeGroup ?? autoGroup;

  return (
    <nav aria-label="Admin navigation" className="relative space-y-1">
      {GROUPS.map((group) => {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                      ref={(el) => {
                        groupLinks.current[`${group.label}-${itemIndex}`] = el;
                      }}
                      className={`block border-l-2 px-3 py-1.5 text-xs transition ${
                        isActive(item.href)
                          ? "border-emerald-500 bg-emerald-500/5 text-emerald-400 font-medium"
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
                  className="absolute left-full top-0 z-30 ml-2 w-52 rounded-lg border border-white/10 bg-[#0F172A] p-2 shadow-2xl backdrop-blur-sm"
                >
                  <p className="mb-1.5 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {group.label}
                  </p>
                  {group.items.map((item, itemIndex) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveGroup(null)}
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