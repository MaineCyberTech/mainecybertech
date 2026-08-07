import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createSaasAudit } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SaaS Audit - More Tools - Admin" };

export default async function SaasAuditPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; vendor_name?: string }> = [];
  try {
    const r = await api.final.saasAudit.list({});
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
            { label: "SaaS Audit" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="SaaS Audit"
      description="Audit SaaS subscriptions with vendors, services, and costs."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "vendorName", label: "Vendor", required: true },
          { key: "serviceName", label: "Service", required: true },
          { key: "monthlyCost", label: "Monthly Cost", type: "number" },
          { key: "annualCost", label: "Annual Cost", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New SaaS Audit"
        action={createSaasAudit}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/saas-audit/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.vendor_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="☁️"
              title="No SaaS audits"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
