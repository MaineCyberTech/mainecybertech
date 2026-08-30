import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createChangeRequest } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change Request - Governance - Admin" };

export default async function ChangeRequestPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  try {
    const r = await api.governance.changes.list({});
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
            { label: "Change Request" },
          ]}
        />
      }
      subnav={<AdminSubnav current="governance" />}
      title="Change Request"
      description="Change advisory requests with risk levels, rollback plans, and verification steps."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "changeType", label: "Type" },
          { key: "riskLevel", label: "Risk" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "rollbackPlan", label: "Rollback Plan", type: "textarea" },
          { key: "verificationSteps", label: "Verification", type: "textarea" },
        ]}
        title="New Change Request"
        action={createChangeRequest}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/governance/change-requests/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🔄"
              title="No change requests"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
