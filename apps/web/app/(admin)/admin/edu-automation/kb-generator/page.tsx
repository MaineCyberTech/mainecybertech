import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createKbGen } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "KB Generator - Edu & Automation - Admin" };

export default async function KbGenPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; source_title?: string }> = [];
  try {
    const r = await api.eduAutomation.kbGenerator.list({});
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
            { label: "KB Generator" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="KB Generator"
      description="Auto-generate knowledge base articles from source content."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "sourceTitle", label: "Source Title" },
          { key: "generatedContent", label: "Generated Content", type: "textarea" },
        ]}
        title="New KB Entry"
        action={createKbGen}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/kb-generator/${item.id}`}
                >
                  <p className="font-medium text-slate-50">
                    {item.source_title ?? String(item.id)}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ“"
              title="No KB generated entries"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
