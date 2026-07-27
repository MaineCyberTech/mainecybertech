import Link from "next/link";
import { navClass } from "@/lib/subnav-styles";

type AdminSubnavProps = {
  current:
    | "home"
    | "approvals"
    | "organizations"
    | "users"
    | "tickets"
    | "documents"
    | "projects"
    | "webhooks"
    | "roles"
    | "sla"
    | "api-keys"
    | "business-os"
    | "uptime-monitor"
    | "training-hub"
    | "license-optimizer"
    | "dmarc-coach"
    | "insurance-binder"
    | "status-pages"
    | string;
};

type NavItem = { type?: "item" | "divider"; key: string; href?: string; label: string };

const NAV_ITEMS: NavItem[] = [
  // Core
  { key: "home", href: "/admin", label: "Overview" },
  { key: "organizations", href: "/admin/organizations", label: "Organizations" },
  { key: "users", href: "/admin/users", label: "Users" },
  { key: "roles", href: "/admin/roles", label: "Roles" },
  { key: "tickets", href: "/admin/tickets", label: "Tickets" },
  { key: "documents", href: "/admin/documents", label: "Documents" },
  { key: "projects", href: "/admin/projects", label: "Projects" },
  { key: "approvals", href: "/admin/approvals", label: "Approvals" },
  { type: "divider", key: "div1", label: "" },

  // Business
  { key: "business-os", href: "/admin/business-os", label: "Business OS" },
  { key: "qbr", href: "/admin/qbr", label: "QBR" },
  { key: "proposals", href: "/admin/proposals", label: "Proposals" },
  { key: "findings", href: "/admin/findings", label: "Findings" },
  { key: "service-catalog", href: "/admin/service-catalog", label: "Services" },
  { key: "sla", href: "/admin/sla", label: "SLA" },
  { type: "divider", key: "div2", label: "" },

  // Security
  { key: "governance", href: "/admin/governance", label: "Governance" },
  { key: "incidents", href: "/admin/incidents", label: "Incidents" },
  { key: "break-glass", href: "/admin/break-glass", label: "BreakGlass" },
  { key: "id-verify", href: "/admin/id-verify", label: "ID Verify" },
  { type: "divider", key: "div3", label: "" },

  // Operations
  { key: "assets", href: "/admin/assets", label: "Assets" },
  { key: "domain-monitors", href: "/admin/domain-monitors", label: "DNS" },
  { key: "website-monitors", href: "/admin/website-monitors", label: "Websites" },
  { key: "dmarc", href: "/admin/dmarc", label: "DMARC" },
  { key: "dmarc-coach", href: "/admin/dmarc-coach", label: "DMARC Coach" },
  { key: "patch-compliance", href: "/admin/patch-compliance", label: "Patches" },
  { key: "endpoint-security", href: "/admin/endpoint-security", label: "Endpoints" },
  { key: "m365-hardening", href: "/admin/m365-hardening", label: "M365" },
  { key: "licenses", href: "/admin/license-optimizer", label: "Licenses" },
  { key: "uptime-monitor", href: "/admin/uptime-monitor", label: "Uptime" },
  { key: "field-services", href: "/admin/field-services", label: "Field" },
  { type: "divider", key: "div4", label: "" },

  // Clients
  { key: "onboarding", href: "/admin/onboarding", label: "Onboarding" },
  { key: "offboarding", href: "/admin/offboarding", label: "Offboarding" },
  { key: "file-requests", href: "/admin/file-requests", label: "Files" },
  { key: "status", href: "/admin/status", label: "Status" },
  { key: "vendor-contracts", href: "/admin/vendor-contracts", label: "Contracts" },
  { key: "vendor-contacts", href: "/admin/vendor-contacts", label: "Vendors" },
  { key: "training-hub", href: "/admin/training-hub", label: "Training" },
  { key: "insurance-binder", href: "/admin/insurance-binder", label: "Insurance" },
  { key: "status-pages", href: "/admin/status-pages", label: "Status Pages" },
  { type: "divider", key: "div5", label: "" },

  // Tools
  { key: "api-keys", href: "/admin/api-keys", label: "API Keys" },
  { key: "webhooks", href: "/admin/webhooks", label: "Webhooks" },
  { key: "ai", href: "/admin/ai", label: "AI Tools" },
  { key: "edu-automation", href: "/admin/edu-automation", label: "Edu/AI" },
  { key: "final", href: "/admin/final", label: "More" },
];

export default function AdminSubnav({ current }: AdminSubnavProps) {
  return (
    <nav className="cyber-subnav-scroll">
      {NAV_ITEMS.map((item) => {
        if (item.type === "divider") {
          return <hr key={item.key} className="my-2 w-full shrink-0 border-t border-white/10" />;
        }
        return (
          <Link
            key={item.key}
            href={item.href!}
            className={`shrink-0 ${navClass(current === item.key)}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
