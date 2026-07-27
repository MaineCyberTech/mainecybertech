import Link from "next/link";
import { navClass } from "@/lib/subnav-styles";

type PortalSubnavProps = {
  current: "dashboard" | "projects" | "documents" | "support" | "billing" | string;
};

const NAV_ITEMS = [
  { key: "dashboard", href: "/portal/dashboard", label: "Dashboard" },
  { key: "projects", href: "/portal/projects", label: "Projects" },
  { key: "timeline", href: "/portal/timeline", label: "Timeline" },
  { key: "documents", href: "/portal/documents", label: "Documents" },
  { key: "support", href: "/portal/support", label: "Support" },
  { key: "billing", href: "/portal/billing", label: "Billing" },
  { key: "assets", href: "/portal/assets", label: "Assets" },
  { key: "findings", href: "/portal/findings", label: "Findings" },
  { key: "qbr", href: "/portal/qbr", label: "QBR Reports" },
  { key: "runbooks", href: "/portal/runbooks", label: "Runbooks" },
  { key: "vendor-contracts", href: "/portal/vendor-contracts", label: "Vendors" },
  { key: "budgets", href: "/portal/budgets", label: "Budgets" },
  { key: "vendor-contacts", href: "/portal/vendor-contacts", label: "Vendor Contacts" },
  { key: "service-catalog", href: "/portal/service-catalog", label: "Services" },
  { key: "time-entries", href: "/portal/time-entries", label: "Time Entries" },
  { key: "field-services", href: "/portal/field-services", label: "Field Services" },
  { key: "security-suite", href: "/portal/security-suite", label: "Security Suite" },
  { key: "security-ops", href: "/portal/security-ops", label: "Security Ops" },
  { key: "edu-automation", href: "/portal/edu-automation", label: "Edu Automation" },
  { key: "domain-monitors", href: "/portal/domain-monitors", label: "Domain Monitors" },
  { key: "ai-triage", href: "/portal/ai-triage", label: "AI Triage" },
  { key: "governance", href: "/portal/governance", label: "Governance" },
  { key: "sla", href: "/portal/sla", label: "SLA" },
  { key: "approvals", href: "/portal/approvals", label: "Approvals" },
  { key: "sharepoint", href: "/portal/sharepoint", label: "SharePoint" },
  { key: "device-profiles", href: "/portal/device-profiles", label: "Device Profiles" },
  { key: "saas-audit", href: "/portal/saas-audit", label: "SaaS Audit" },
  { key: "procurement", href: "/portal/procurement", label: "Procurement" },
  { key: "dns-changes", href: "/portal/dns-changes", label: "DNS Changes" },
  { key: "status", href: "/portal/status", label: "Status" },
  { key: "file-requests", href: "/portal/file-requests", label: "Files" },
];

export default function PortalSubnav({ current }: PortalSubnavProps) {
  return (
    <nav className="cyber-subnav-scroll">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`shrink-0 ${navClass(current === item.key)}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
