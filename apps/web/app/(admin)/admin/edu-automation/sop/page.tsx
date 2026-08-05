import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createSop } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SOP Library - Edu & Automation - Admin" };

export default async function SopPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  try {
    const r = await api.eduAutomation.sop.list({});
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
            { label: "SOP Library" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="SOP Library"
      description="Standard operating procedures with numbering, versioning, and categories."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "sopNumber", label: "SOP Number" },
          { key: "category", label: "Category" },
          { key: "version", label: "Version" },
          { key: "content", label: "Content", type: "textarea" },
        ]}
        title="New SOP"
        action={createSop}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/sop/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ“‹"
              title="No SOPs"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
