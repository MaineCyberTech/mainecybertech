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
