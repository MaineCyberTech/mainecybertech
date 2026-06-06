import Link from "next/link";

type AdminSubnavProps = {
  current: "home" | "approvals" | "organizations" | "users" | "tickets" | "documents" | "projects" | "webhooks" | "roles" | string;
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
  { key: "webhooks", href: "/admin/webhooks", label: "Webhooks" },
];

function navClass(active: boolean) {
  return active
    ? "rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition shadow-[0_0_0_1px_rgba(5,150,105,0.08)]"
    : "rounded-lg border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-600/30 hover:bg-[#0D1622] hover:text-slate-50";
}

export default function AdminSubnav({ current }: AdminSubnavProps) {
  return (
    <nav className="cyber-subnav-scroll">
      {NAV_ITEMS.map((item) => (
        <Link key={item.key} href={item.href} className={`shrink-0 ${navClass(current === item.key)}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
