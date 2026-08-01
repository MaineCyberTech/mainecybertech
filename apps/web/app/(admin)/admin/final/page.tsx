import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";
export const metadata = { title: "More Tools - Admin" };

export default async function FinalPage() {
  await requireAdminAccess();
  const sections = [
    {
      title: "M365 & Procurement",
      items: [
        { k: "sharepoint", l: "SharePoint Planner" },
        { k: "device-profiles", l: "Device Profiles" },
        { k: "saas-audit", l: "SaaS Audit" },
        { k: "procurement", l: "Procurement" },
        { k: "dns-changes", l: "DNS Changes" },
      ],
    },
    {
      title: "Client Engagement",
      items: [
        { k: "satisfaction", l: "Satisfaction" },
        { k: "time-entries", l: "Time Entries" },
        { k: "budgets", l: "Budgets" },
        { k: "runbooks", l: "Runbooks" },
        { k: "forms", l: "Forms Builder" },
      ],
    },
    {
      title: "Operations",
      items: [{ k: "backups", l: "BDR" }],
    },
  ];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "More Tools" }]} />
      }
      subnav={<AdminSubnav current="final" />}
      title="Additional Tools"
      description="SharePoint planning, device profiles, SaaS audits, procurement, DNS, satisfaction, time, budgets, runbooks, and forms."
    >
      {sections.map((sec) => (
        <section key={sec.title} className="cyber-panel mb-4">
          <h2 className="cyber-heading mb-3 text-lg">{sec.title}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {sec.items.map((i) => (
              <Link
                key={i.k}
                href={`/admin/final/${i.k}`}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-center transition hover:border-emerald-600/25 hover:bg-[#0A1118]/80"
              >
                <p className="text-sm font-medium text-slate-50">{i.l}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </AdminPageShell>
  );
}
