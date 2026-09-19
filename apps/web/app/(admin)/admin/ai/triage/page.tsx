import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import TriageAnalyzeClient from "@/components/admin/TriageAnalyzeClient";
import { Organization } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Triage - Admin - Maine CyberTech" };

export default async function TriagePage() {
  await requireAdminAccess();
  const api = getApiClient();

  let orgs: { id: string; name: string }[] = [];
  try {
    const list = await api.organizations.list({ limit: 100 });
    orgs = (list.items ?? []).map((o: Organization) => ({ id: o.id, name: o.name }));
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "AI Tools", href: "/admin/ai" },
            { label: "Triage" },
          ]}
        />
      }
      subnav={<AdminSubnav current="ai" />}
      title="Ticket Triage"
      description="Analyze a client issue description and get a structured ticket draft with suggested category, priority, and missing information."
      actions={
        <a href="/admin/ai" className="cyber-button-secondary">
          Back to AI Tools
        </a>
      }
    >
      <TriageAnalyzeClient organizations={orgs} />
    </AdminPageShell>
  );
}
