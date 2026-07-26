import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createOffboarding } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Offboarding - Admin" };

const chk = (v: boolean) => (v ? "✅" : "⬜");

export default async function OffboardingPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    employee_name: string;
    offboarding_date: string | null;
    account_disabled: boolean;
    mailbox_converted: boolean;
    license_reclaimed: boolean;
    access_reviewed: boolean;
    evidence_collected: boolean;
    status: string;
  }> = [];
  try {
    const r = await api.securityOps.offboarding.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Offboarding" }]} />
      }
      subnav={<AdminSubnav current="offboarding" />}
      title="M365 Offboarding Safety Checklist"
      description="Guided offboarding with account disablement, mailbox handling, OneDrive transfer, license reclamation."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "employeeName", label: "Employee Name", required: true },
          { key: "employeeEmail", label: "Email", required: true },
          { key: "department", label: "Department" },
          { key: "offboardingDate", label: "Date", type: "date" },
        ]}
        title="New Offboarding"
        action={createOffboarding}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((o) => (
              <div key={o.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">
                  {o.employee_name}{" "}
                  <span className="text-xs text-slate-400">
                    {o.offboarding_date
                      ? `(${new Date(o.offboarding_date).toISOString().slice(0, 10)})`
                      : ""}
                  </span>
                </p>
                <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {chk(o.account_disabled)} Disabled {chk(o.mailbox_converted)} Mailbox{" "}
                  {chk(o.license_reclaimed)} License {chk(o.access_reviewed)} Access{" "}
                  {chk(o.evidence_collected)} Evidence
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="👋"
              title="No offboarding checklists"
              description="Start an offboarding checklist for departing employees."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
