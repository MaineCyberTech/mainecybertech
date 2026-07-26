import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createBackup } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Backup DR - More Tools - Admin" };

export default async function BackupPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; system_name?: string }> = [];
  try {
    const r = await api.final.backups.list({});
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
            { label: "More Tools", href: "/admin/final" },
            { label: "Backup DR" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Backup DR"
      description="Backup and disaster recovery planning with RPO, RTO, and retention."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "systemName", label: "System Name", required: true },
          { key: "backupType", label: "Backup Type" },
          { key: "retentionDays", label: "Retention Days", type: "number" },
          { key: "recoveryPointObjectiveHours", label: "RPO (hrs)", type: "number" },
          { key: "recoveryTimeObjectiveHours", label: "RTO (hrs)", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Backup Plan"
        action={createBackup}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.system_name ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="💾"
              title="No backup plans"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
