import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createAutomation } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Automation Workflow - Edu & Automation - Admin" };

export default async function AutomationPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; name?: string }> = [];
  try {
    const r = await api.eduAutomation.automation.list({});
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
            { label: "Automation Workflow" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Automation Workflow"
      description="Script and trigger-based automation workflows."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "scriptType", label: "Script Type" },
          { key: "triggerType", label: "Trigger Type" },
        ]}
        title="New Workflow"
        action={createAutomation}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/automation/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="⚡"
              title="No automation workflows"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
