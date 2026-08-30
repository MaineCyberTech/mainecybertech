import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getContentQualityAuditorData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Auditor - Store - Admin - Maine CyberTech" };

export default async function AdminStoreContentAuditPage() {
  await requireAdminAccess();
  const data = getContentQualityAuditorData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Content Audit" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-content-audit" />}
      title="Content Quality Auditor"
      description={`${data.dimensions.length} audit dimensions`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Run Content Audit
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Audit Dimensions ({data.dimensions.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.dimensions.map((dim) => (
            <div key={dim.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-3">
              <p className="text-xs text-slate-300">{dim.label}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
