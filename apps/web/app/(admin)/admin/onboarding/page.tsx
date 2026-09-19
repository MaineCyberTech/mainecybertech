import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createOnboarding } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding - Admin" };

export default async function OnboardingPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    client_name: string;
    status: string;
    phase: string;
    risk_level: string;
    security_baseline_score: number | null;
    support_handoff_status: string;
    created_at: string;
  }> = [];
  try {
    const r = await api.clientOnboarding.list({ limit: 50, page: 1 });
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Onboarding" }]} />
      }
      subnav={<AdminSubnav current="onboarding" />}
      title="Client Onboarding Command Center"
      description="Repeatable workspace for client discovery, M365 setup, network baseline, security baseline, and handoff."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "clientName", label: "Client Name", required: true },
          { key: "clientDomain", label: "Client Domain", placeholder: "client.example.com" },
          {
            key: "clientContactEmail",
            label: "Contact Email",
            type: "text",
            placeholder: "admin@example.com",
          },
          { key: "clientContactPhone", label: "Contact Phone" },
          { key: "notes", label: "Discovery Notes", type: "textarea" },
        ]}
        title="New Onboarding"
        action={createOnboarding}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((o) => (
              <div key={o.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/onboarding/${o.id}`}
                >
                  <p className="font-medium text-slate-50">{o.client_name}</p>
                </Link>
                <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    {o.status}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    Phase: {o.phase}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    Risk: {o.risk_level}
                  </span>
                  {o.security_baseline_score !== null && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      Security: {o.security_baseline_score}/100
                    </span>
                  )}
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    Handoff: {o.support_handoff_status}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🚀"
              title="No onboardings"
              description="Start a client onboarding workflow."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
