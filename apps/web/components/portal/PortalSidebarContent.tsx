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

export default function PortalSidebarContent() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === "/portal/dashboard") return pathname === "/portal/dashboard" || pathname === "/portal";
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Portal navigation" className="space-y-1">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <button
            onClick={() => setCollapsed((p) => ({ ...p, [group.label]: !p[group.label] }))}
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 transition"
          >
            <svg
              className={`h-3 w-3 transition ${collapsed[group.label] ? "-rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {group.label}
          </button>
          {!collapsed[group.label] && (
            <div className="ml-3 space-y-0.5 border-l border-white/10">
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
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
          )}
        </div>
      ))}
    </nav>
  );
}