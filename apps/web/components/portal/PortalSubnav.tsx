import Link from "next/link";

type PortalSubnavProps = {
  current: "dashboard" | "projects" | "documents" | "support" | "billing" | string;
};

const NAV_ITEMS = [
  { key: "dashboard", href: "/portal/dashboard", label: "Dashboard" },
  { key: "projects", href: "/portal/projects", label: "Projects" },
  { key: "timeline", href: "/portal/timeline", label: "Timeline" },
  { key: "documents", href: "/portal/documents", label: "Documents" },
  { key: "support", href: "/portal/support", label: "Support" },
  { key: "billing", href: "/portal/billing", label: "Billing" }
];

function navClass(active: boolean) {
  return active
    ? "rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition shadow-[0_0_0_1px_rgba(5,150,105,0.08)]"
    : "rounded-lg border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-600/30 hover:bg-[#0D1622] hover:text-slate-50";
}

export default function PortalSubnav({ current }: PortalSubnavProps) {
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
