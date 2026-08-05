import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createSharePoint } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SharePoint Plan - More Tools - Admin" };

export default async function SharePointPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; site_name?: string }> = [];
  try {
    const r = await api.final.sharepoint.list({});
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
            { label: "SharePoint Plan" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="SharePoint Plan"
      description="Plan SharePoint sites with teams, owners, and sensitivity labels."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "siteName", label: "Site Name", required: true },
          { key: "teamName", label: "Team Name" },
          { key: "owner", label: "Owner" },
          { key: "sensitivityLabel", label: "Sensitivity" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New SharePoint Plan"
        action={createSharePoint}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/sharepoint/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.site_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ“"
              title="No SharePoint plans"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
