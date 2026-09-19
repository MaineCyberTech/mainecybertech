import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createIsp } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "ISP Assessment - Field Services - Admin" };

export default async function IspPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; client_name?: string }> = [];
  try {
    const r = await api.fieldServices.isp.list({});
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
            { label: "Field Services", href: "/admin/field-services" },
            { label: "ISP Assessment" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="ISP Assessment"
      description="Document ISP assessments with current provider, services, and notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "clientName", label: "Client Name", required: true },
          { key: "currentProvider", label: "Current Provider" },
          { key: "services", label: "Services", type: "textarea" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New ISP Assessment"
        action={createIsp}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/field-services/isp/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.client_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🌐"
              title="No ISP assessments"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
