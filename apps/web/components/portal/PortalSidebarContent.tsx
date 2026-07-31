"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const GROUPS = [
  {
    label: "Core",
    items: [
      { key: "dashboard", href: "/portal/dashboard", label: "Dashboard" },
      { key: "projects", href: "/portal/projects", label: "Projects" },
      { key: "documents", href: "/portal/documents", label: "Documents" },
      { key: "support", href: "/portal/support", label: "Support" },
      { key: "billing", href: "/portal/billing", label: "Billing" },
      { key: "approvals", href: "/portal/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", href: "/portal/assets", label: "Assets" },
      { key: "findings", href: "/portal/findings", label: "Findings" },
      { key: "qbr", href: "/portal/qbr", label: "QBR Reports" },
      { key: "sla", href: "/portal/sla", label: "SLA" },
      { key: "time-entries", href: "/portal/time-entries", label: "Time Entries" },
      { key: "field-services", href: "/portal/field-services", label: "Field Services" },
      { key: "file-requests", href: "/portal/file-requests", label: "Files" },
    ],
  },
  {
    label: "Security",
    items: [
      { key: "security-suite", href: "/portal/security-suite", label: "Security Suite" },
      { key: "security-ops", href: "/portal/security-ops", label: "Security Ops" },
      { key: "domain-monitors", href: "/portal/domain-monitors", label: "Domain Monitors" },
      { key: "governance", href: "/portal/governance", label: "Governance" },
      { key: "status", href: "/portal/status", label: "Status" },
    ],
  },
  {
    label: "Business",
    items: [
      { key: "vendor-contracts", href: "/portal/vendor-contracts", label: "Vendors" },
      { key: "vendor-contacts", href: "/portal/vendor-contacts", label: "Vendor Contacts" },
      { key: "service-catalog", href: "/portal/service-catalog", label: "Services" },
      { key: "training-hub", href: "/portal/training-hub", label: "Training" },
      { key: "insurance-binder", href: "/portal/insurance-binder", label: "Insurance" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { key: "timeline", href: "/portal/timeline", label: "Timeline" },
      { key: "edu-automation", href: "/portal/edu-automation", label: "Edu Automation" },
      { key: "saas-audit", href: "/portal/saas-audit", label: "SaaS Audit" },
      { key: "device-profiles", href: "/portal/device-profiles", label: "Device Profiles" },
      { key: "dns-changes", href: "/portal/dns-changes", label: "DNS Changes" },
    ],
  },
];

export default function PortalSidebarContent({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/portal/dashboard") return pathname === "/portal/dashboard" || pathname === "/portal";
    return pathname.startsWith(href);
  };

  const autoGroup =
    GROUPS.find((g) => g.items.some((i) => isActive(i.href)))?.label ?? null;
  const openGroup = activeGroup ?? autoGroup;

  return (
    <nav aria-label="Portal navigation" className="relative space-y-1">
      {GROUPS.map((group) => {
        const isOpen = openGroup === group.label;
        return (
          <div key={group.label} className="relative">
            <button
              onClick={() => setActiveGroup(isOpen ? null : group.label)}
              className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
                isOpen
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
              aria-expanded={isOpen}
              aria-haspopup="true"
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
                <div className="ml-3 space-y-0.5 border-l border-white/10">
                  {group.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveGroup(null)}
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
                <div className="absolute left-full top-0 z-30 ml-2 w-52 rounded-lg border border-white/10 bg-[#0F172A] p-2 shadow-2xl backdrop-blur-sm">
                  <p className="mb-1.5 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveGroup(null)}
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