import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createInsurance } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insurance Evidence - Edu & Automation - Admin" };

export default async function InsurancePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; category?: string }> = [];
  try {
    const r = await api.eduAutomation.insurance.list({});
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
            { label: "Insurance Evidence" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Insurance Evidence"
      description="Track insurance evidence with status, document references, and renewal dates."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "category", label: "Category", required: true },
          { key: "evidenceDescription", label: "Evidence Description", required: true },
          { key: "evidenceStatus", label: "Status" },
          { key: "documentReference", label: "Document Ref" },
          { key: "renewalDate", label: "Renewal Date", type: "date" },
        ]}
        title="New Insurance Record"
        action={createInsurance}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{item.category ?? String(item.id)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🛡️"
              title="No insurance records"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
