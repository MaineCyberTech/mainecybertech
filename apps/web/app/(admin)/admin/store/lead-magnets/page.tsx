import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getLeadMagnets } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead Magnets - Store - Admin - Maine CyberTech" };

export default async function AdminStoreLeadMagnetsPage() {
  await requireAdminAccess();
  const magnets = getLeadMagnets();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Lead Magnets" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-lead-magnets" />}
      title="Lead Magnet Management"
      description={`${magnets.length} downloadable checklist${magnets.length === 1 ? "" : "s"}`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Publish Checklist
        </button>
      }
    >
      {magnets.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-6 text-center text-sm text-slate-400">
          No lead magnets configured yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {magnets.map((m) => (
            <div key={m.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-50">{m.title}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">{m.description}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">/{m.slug}</p>
              {m.checklist.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-500">{m.checklist.length} items</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
