import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createCompliance } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compliance Readiness - Edu & Automation - Admin" };

export default async function CompliancePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; framework?: string }> = [];
  try {
    const r = await api.eduAutomation.compliance.list({});
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
            { label: "Compliance Readiness" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Compliance Readiness"
      description="Framework-aligned controls with descriptions and readiness notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "framework", label: "Framework", required: true },
          { key: "controlId", label: "Control ID" },
          { key: "controlDescription", label: "Description", type: "textarea" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Compliance Record"
        action={createCompliance}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/compliance/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.framework ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="✅"
              title="No compliance records"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
