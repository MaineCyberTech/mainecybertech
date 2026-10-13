import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createInsurance } from "@/lib/module-actions";
import DataErrorNote from "@/components/admin/DataErrorNote";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insurance Evidence - Edu & Automation - Admin" };

export default async function InsurancePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  let loadFailed = false;
  try {
    // FEAT-P2-005: insurance_evidence's canonical surface is insurance-binder.
    const r = await api.insuranceBinder.list({});
    items = (r as { items: typeof items }).items as typeof items;
  } catch {
    loadFailed = true;
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
      {loadFailed && <DataErrorNote what="insurance" />}
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "evidenceType", label: "Evidence Type" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "coverageArea", label: "Coverage Area" },
          { key: "insuranceProvider", label: "Insurance Provider" },
          { key: "policyNumber", label: "Policy Number" },
          { key: "expiryDate", label: "Expiry Date", type: "date" },
          { key: "status", label: "Status" },
        ]}
        title="New Insurance Record"
        action={createInsurance}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0
            ? items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
                >
                  <Link
                    className="transition hover:text-emerald-400"
                    href={`/admin/edu-automation/insurance/${item.id}`}
                  >
                    <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                  </Link>
                </div>
              ))
            : !loadFailed && (
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
