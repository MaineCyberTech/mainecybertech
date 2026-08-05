import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createRisk } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Risk Register - Governance - Admin" };

export default async function RiskRegisterPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; risk_description?: string }> = [];
  try {
    const r = await api.governance.risks.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Governance", href: "/admin/governance" },
            { label: "Risk Register" },
          ]}
        />
      }
      subnav={<AdminSubnav current="governance" />}
      title="Risk Register"
      description="Risk tracking with categories, likelihood, impact, and mitigating controls."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "riskDescription", label: "Risk Description", required: true },
          { key: "riskCategory", label: "Category" },
          { key: "likelihood", label: "Likelihood" },
          { key: "impact", label: "Impact" },
          { key: "mitigatingControls", label: "Controls", type: "textarea" },
        ]}
        title="New Risk"
        action={createRisk}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/governance/risks/${item.id}`}
                >
                  <p className="font-medium text-slate-50">
                    {item.risk_description ?? String(item.id)}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="âš ï¸"
              title="No risks registered"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
