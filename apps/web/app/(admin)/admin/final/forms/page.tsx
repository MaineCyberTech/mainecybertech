import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createForm } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Custom Form - More Tools - Admin" };

export default async function FormsPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; form_name?: string }> = [];
  try {
    const r = await api.final.forms.list({});
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
            { label: "Custom Form" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Custom Form"
      description="Build and manage custom forms with descriptions."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "formName", label: "Form Name", required: true },
          { key: "formDescription", label: "Description", type: "textarea" },
        ]}
        title="New Custom Form"
        action={createForm}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/forms/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.form_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📄"
              title="No custom forms"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
