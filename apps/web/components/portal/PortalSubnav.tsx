"use client";

import Link from "next/link";
import { useState } from "react";
import { navClass } from "@/lib/subnav-styles";

type PortalSubnavProps = {
  current: string;
};

const GROUPS = [
  {
    label: "Core",
    items: [
      { key: "dashboard", href: "/portal/dashboard", label: "Dashboard" },
      { key: "projects", href: "/portal/projects", label: "Projects" },
      { key: "documents", href: "/portal/documents", label: "Documents" },
      { key: "support", href: "/portal/support", label: "Support" },
      { key: "billing", href: "/portal/billing", label: "Billing" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", href: "/portal/assets", label: "Assets" },
      { key: "findings", href: "/portal/findings", label: "Findings" },
      { key: "qbr", href: "/portal/qbr", label: "QBR Reports" },
      { key: "sla", href: "/portal/sla", label: "SLA" },
      { key: "approvals", href: "/portal/approvals", label: "Approvals" },
      { key: "time-entries", href: "/portal/time-entries", label: "Time Entries" },
      { key: "field-services", href: "/portal/field-services", label: "Field Services" },
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
      { key: "budgets", href: "/portal/budgets", label: "Budgets" },
      { key: "runbooks", href: "/portal/runbooks", label: "Runbooks" },
      { key: "vendor-contracts", href: "/portal/vendor-contracts", label: "Vendors" },
      { key: "vendor-contacts", href: "/portal/vendor-contacts", label: "Vendor Contacts" },
      { key: "service-catalog", href: "/portal/service-catalog", label: "Services" },
      { key: "procurement", href: "/portal/procurement", label: "Procurement" },
      { key: "sharepoint", href: "/portal/sharepoint", label: "SharePoint" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { key: "timeline", href: "/portal/timeline", label: "Timeline" },
      { key: "edu-automation", href: "/portal/edu-automation", label: "Edu Automation" },
      { key: "ai-triage", href: "/portal/ai-triage", label: "AI Triage" },
      { key: "device-profiles", href: "/portal/device-profiles", label: "Device Profiles" },
      { key: "saas-audit", href: "/portal/saas-audit", label: "SaaS Audit" },
      { key: "dns-changes", href: "/portal/dns-changes", label: "DNS Changes" },
      { key: "file-requests", href: "/portal/file-requests", label: "Files" },
    ],
  },
];

export default function PortalSubnav({ current }: PortalSubnavProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const allItems = GROUPS.flatMap((g) => g.items);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm text-slate-300 sm:hidden"
        aria-label="Open navigation menu"
      >
        <span>Menu</span>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex sm:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-[#0F172A] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-slate-200">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              {GROUPS.map((group) => (
                <div key={group.label} className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedGroup(expandedGroup === group.label ? null : group.label)
                    }
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:bg-white/5"
                  >
                    {group.label}
                    <svg
                      className={`h-3 w-3 transition-transform ${expandedGroup === group.label ? "rotate-90" : ""}`}
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
                  {expandedGroup === group.label && (
                    <div className="ml-2 mt-1 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.key}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`block rounded px-3 py-2 text-sm ${current === item.key ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="hidden sm:flex sm:flex-wrap sm:gap-2">
        {allItems.slice(0, 8).map((item) => (
          <Link key={item.key} href={item.href} className={navClass(current === item.key)}>
            {item.label}
          </Link>
        ))}
        <div className="group relative">
          <span className="inline-block cursor-pointer rounded border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-emerald-600/50 hover:text-emerald-500">
            More +
          </span>
          <div className="invisible absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-white/10 bg-[#0F172A] p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
            {allItems.slice(8).map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm ${current === item.key ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
