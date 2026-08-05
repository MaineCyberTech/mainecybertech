import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createPhishing } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phishing Sim - Edu & Automation - Admin" };

export default async function PhishingPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; campaign_name?: string }> = [];
  try {
    const r = await api.eduAutomation.phishing.list({});
    items = (r as { items: typeof items }).items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Edu & Automation", href: "/admin/edu-automation" },
            { label: "Phishing Sim" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Phishing Sim"
      description="Phishing simulation campaigns with target counts and notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "campaignName", label: "Campaign Name", required: true },
          { key: "targetCount", label: "Targets", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Campaign"
        action={createPhishing}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/phishing/${item.id}`}
                >
                  <p className="font-medium text-slate-50">
                    {item.campaign_name ?? String(item.id)}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸŽ£"
              title="No phishing campaigns"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
