import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createPowerShell } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "PowerShell Script - Edu & Automation - Admin" };

export default async function PowerShellPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; name?: string }> = [];
  try {
    const r = await api.eduAutomation.powershell.list({});
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
            { label: "PowerShell Script" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="PowerShell Script"
      description="Store and manage PowerShell scripts."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "name", label: "Name", required: true },
          { key: "scriptContent", label: "Script Content", type: "textarea" },
        ]}
        title="New Script"
        action={createPowerShell}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/powershell/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="💻"
              title="No PowerShell scripts"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
