import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding - Admin" };

const chk = (v: boolean) => (v ? "✅" : "⬜");

export default async function OnboardingPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    client_name: string;
    discovery_complete: boolean;
    m365_setup_complete: boolean;
    security_baseline_applied: boolean;
    handoff_complete: boolean;
    status: string;
  }> = [];
  try {
    const r = await api.securityOps.onboarding.list({});
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
      actions={
        <Link href="/admin/onboarding/new" className="cyber-button">
          New Onboarding
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((o) => (
              <div key={o.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{o.client_name}</p>
                <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {chk(o.discovery_complete)} Discovery {chk(o.m365_setup_complete)} M365{" "}
                  {chk(o.security_baseline_applied)} Security {chk(o.handoff_complete)} Handoff
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🚀"
              title="No onboardings"
              description="Start a client onboarding workflow."
              actionHref="/admin/onboarding/new"
              actionLabel="New Onboarding"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
