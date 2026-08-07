import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createRetention } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Retention - Governance - Admin" };

export default async function RetentionPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; data_category?: string }> = [];
  try {
    const r = await api.governance.retention.list({});
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
            { label: "Data Retention" },
          ]}
        />
      }
      subnav={<AdminSubnav current="governance" />}
      title="Data Retention"
      description="Data retention policies with retention periods, disposal methods, and regulation tracking."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "dataCategory", label: "Data Category", required: true },
          { key: "systemName", label: "System Name", required: true },
          { key: "retentionPeriodDays", label: "Retention (days)", type: "number", required: true },
          { key: "disposalMethod", label: "Disposal Method" },
          { key: "isRegulated", label: "Regulated", type: "checkbox" },
        ]}
        title="New Retention Policy"
        action={createRetention}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/governance/retention/${item.id}`}
                >
                  <p className="font-medium text-slate-50">
                    {item.data_category ?? String(item.id)}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🗄️"
              title="No retention policies"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
