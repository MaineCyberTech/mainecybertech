import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createTimeEntry } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Time Entry - More Tools - Admin" };

export default async function TimeEntryPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; description?: string }> = [];
  try {
    const r = await api.final.timeEntries.list({});
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
            { label: "Time Entry" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Time Entry"
      description="Track billable time with descriptions, hours, and work dates."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "description", label: "Description", required: true },
          { key: "hours", label: "Hours", type: "number" },
          { key: "workDate", label: "Date", type: "date" },
        ]}
        title="New Time Entry"
        action={createTimeEntry}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.description ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="⏱️"
              title="No time entries"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
