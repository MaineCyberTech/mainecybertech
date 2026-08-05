import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createRunbook } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Runbook - More Tools - Admin" };

export default async function RunbookPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  try {
    const r = await api.final.runbooks.list({});
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
            { label: "Client Runbook" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Client Runbook"
      description="Client runbooks with categories and version tracking."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "content", label: "Content", type: "textarea" },
          { key: "category", label: "Category" },
          { key: "version", label: "Version" },
        ]}
        title="New Runbook"
        action={createRunbook}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/runbooks/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ“–"
              title="No runbooks"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
