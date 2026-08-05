import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createTabletop } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tabletop Exercise - Governance - Admin" };

export default async function TabletopPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  try {
    const r = await api.governance.tabletop.list({});
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
            { label: "Tabletop Exercise" },
          ]}
        />
      }
      subnav={<AdminSubnav current="governance" />}
      title="Tabletop Exercise"
      description="Plan tabletop exercises with scenarios, participants, action items, and after-action reports."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "scenario", label: "Scenario", required: true, type: "textarea" },
          { key: "scenarioType", label: "Type" },
          { key: "participants", label: "Participants" },
          { key: "scheduledDate", label: "Scheduled", type: "date" },
          { key: "notes", label: "Notes", type: "textarea" },
          { key: "actionItems", label: "Action Items", type: "textarea" },
          { key: "afterActionReport", label: "After Action Report", type: "textarea" },
        ]}
        title="New Tabletop Exercise"
        action={createTabletop}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/governance/tabletop/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸŽ¯"
              title="No tabletop exercises"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
