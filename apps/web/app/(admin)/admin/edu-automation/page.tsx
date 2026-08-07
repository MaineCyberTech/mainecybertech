import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";
export const metadata = { title: "Edu & Automation - Admin" };

export default async function EduAutomationPage() {
  await requireAdminAccess();
  const sections = [
    {
      title: "Governance",
      items: [
        { k: "sop", l: "SOP Library" },
        { k: "compliance", l: "Compliance Readiness" },
        { k: "insurance", l: "Insurance Evidence" },
        { k: "ai-policy", l: "AI Policy" },
      ],
    },
    {
      title: "Client Education",
      items: [
        { k: "kb", l: "Knowledge Base" },
        { k: "training", l: "Training Hub" },
        { k: "phishing", l: "Phishing Sim" },
        { k: "scorecards", l: "Cyber Scorecards" },
      ],
    },
    {
      title: "Automation & AI",
      items: [
        { k: "automation", l: "Automation Catalog" },
        { k: "powershell", l: "PowerShell Builder" },
        { k: "kb-generator", l: "KB Generator" },
      ],
    },
  ];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Edu & Automation" }]} />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Education & Automation Center"
      description="SOPs, compliance, KB, training, phishing sims, automation catalog, and AI tools."
    >
      {sections.map((sec) => (
        <section key={sec.title} className="cyber-panel mb-4">
          <h2 className="cyber-heading mb-3 text-lg">{sec.title}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {sec.items.map((i) => (
              <Link
                key={i.k}
                href={`/admin/edu-automation/${i.k}`}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 text-center transition hover:border-emerald-600/25 hover:bg-cyber-base/80"
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
