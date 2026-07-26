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
    | string;
};

const NAV_ITEMS = [
  { key: "home", href: "/admin", label: "Overview" },
  { key: "business-os", href: "/admin/business-os", label: "Business OS" },
  { key: "approvals", href: "/admin/approvals", label: "Approvals" },
  { key: "organizations", href: "/admin/organizations", label: "Organizations" },
  { key: "users", href: "/admin/users", label: "Users" },
  { key: "roles", href: "/admin/roles", label: "Roles" },
  { key: "proposals", href: "/admin/proposals", label: "Proposals" },
  { key: "domain-monitors", href: "/admin/domain-monitors", label: "DNS" },
  { key: "qbr", href: "/admin/qbr", label: "QBR" },
  { key: "file-requests", href: "/admin/file-requests", label: "Files" },
  { key: "ai", href: "/admin/ai", label: "AI Tools" },
  { key: "vendor-contracts", href: "/admin/vendor-contracts", label: "Contracts" },
  { key: "vendor-contacts", href: "/admin/vendor-contacts", label: "Vendors" },
  { key: "tickets", href: "/admin/tickets", label: "Tickets" },
  { key: "documents", href: "/admin/documents", label: "Documents" },
  { key: "findings", href: "/admin/findings", label: "Findings" },
  { key: "assets", href: "/admin/assets", label: "Assets" },
  { key: "projects", href: "/admin/projects", label: "Projects" },
  { key: "sla", href: "/admin/sla", label: "SLA" },
  { key: "api-keys", href: "/admin/api-keys", label: "API Keys" },
  { key: "webhooks", href: "/admin/webhooks", label: "Webhooks" },
];

export default function AdminSubnav({ current }: AdminSubnavProps) {
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
