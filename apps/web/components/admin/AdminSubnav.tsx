"use client";

import Link from "next/link";
import { useState } from "react";
import { navClass } from "@/lib/subnav-styles";

type AdminSubnavProps = {
  current: string;
};

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
    label: "Business",
    items: [
      { key: "business-os", href: "/admin/business-os", label: "Business OS" },
      { key: "qbr", href: "/admin/qbr", label: "QBR" },
      { key: "proposals", href: "/admin/proposals", label: "Proposals" },
      { key: "findings", href: "/admin/findings", label: "Findings" },
      { key: "service-catalog", href: "/admin/service-catalog", label: "Services" },
      { key: "sla", href: "/admin/sla", label: "SLA" },
    ],
  },
  {
    label: "Security",
    items: [
      { key: "governance", href: "/admin/governance", label: "Governance" },
      { key: "incidents", href: "/admin/incidents", label: "Incidents" },
      { key: "break-glass", href: "/admin/break-glass", label: "BreakGlass" },
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
      { key: "onboarding", href: "/admin/onboarding", label: "Onboarding" },
      { key: "offboarding", href: "/admin/offboarding", label: "Offboarding" },
      { key: "file-requests", href: "/admin/file-requests", label: "Files" },
      { key: "status", href: "/admin/status", label: "Status" },
      { key: "vendor-contracts", href: "/admin/vendor-contracts", label: "Contracts" },
      { key: "vendor-contacts", href: "/admin/vendor-contacts", label: "Vendors" },
      { key: "training-hub", href: "/admin/training-hub", label: "Training" },
      { key: "insurance-binder", href: "/admin/insurance-binder", label: "Insurance" },
      { key: "status-pages", href: "/admin/status-pages", label: "Status Pages" },
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
    ],
  },
];

export default function AdminSubnav({ current }: AdminSubnavProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const allItems = GROUPS.flatMap((g) => g.items);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm text-slate-300 sm:hidden"
        aria-label="Open admin navigation"
      >
        <span>Admin Menu</span>
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
              <span className="text-sm font-semibold text-slate-200">Admin Navigation</span>
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
