import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getFulfillmentChecklists } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fulfillment Checklists - Store - Admin - Maine CyberTech" };

export default async function AdminStoreFulfillmentPage() {
  await requireAdminAccess();
  const checklists = getFulfillmentChecklists();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Fulfillment Checklists" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-fulfillment" />}
      title="Fulfillment Checklist Generator"
      description={`${checklists.length} checklist${checklists.length === 1 ? "" : "s"} configured`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Generate Checklist
        </button>
      }
    >
      {checklists.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-6 text-center text-sm text-slate-400">
          No fulfillment checklists yet. Click "Generate Checklist" to create one for a product.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((cl) => (
            <div
              key={cl.productId}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <h3 className="mb-3 text-sm font-medium text-slate-200">{cl.productId}</h3>
              <div className="space-y-2">
                {cl.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 font-mono text-[11px] text-emerald-400">
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-300">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
