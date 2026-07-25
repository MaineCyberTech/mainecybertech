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
    | string;
};

const NAV_ITEMS = [
  { key: "home", href: "/admin", label: "Overview" },
  { key: "approvals", href: "/admin/approvals", label: "Approvals" },
  { key: "organizations", href: "/admin/organizations", label: "Organizations" },
  { key: "users", href: "/admin/users", label: "Users" },
  { key: "roles", href: "/admin/roles", label: "Roles" },
  { key: "tickets", href: "/admin/tickets", label: "Tickets" },
  { key: "documents", href: "/admin/documents", label: "Documents" },
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
