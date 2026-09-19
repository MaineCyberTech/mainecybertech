import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getIntakeToProjectData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake-to-Project Ops - Store - Admin - Maine CyberTech" };

export default async function AdminStoreOperationsPage() {
  await requireAdminAccess();
  const data = getIntakeToProjectData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Intake-to-Project Operations" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-operations" />}
      title="Intake-to-Project Operations"
      description={`${data.entities.length} entity types`}
      actions={
        <button
          type="button"
          disabled
          title="Coming soon"
          className="cursor-not-allowed rounded-lg bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500"
        >
          Convert to Project
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Entity Objects ({data.entities.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.entities.map((obj) => (
            <span
              key={obj}
              className="rounded border border-white/10 bg-cyber-base/60 px-3 py-1.5 font-mono text-xs text-slate-300"
            >
              {obj}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Status Map</h2>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <pre className="text-xs text-slate-400">
            {JSON.stringify(data.statusMap, null, 2) || "{}"}
          </pre>
        </div>
      </section>

      <div className="mt-8 rounded-lg border border-white/10 bg-cyber-base/60 p-6 text-center text-sm text-slate-400">
        Active intake-to-project mappings will appear here once wired to quote and proposal data.
      </div>
    </AdminPageShell>
  );
}
