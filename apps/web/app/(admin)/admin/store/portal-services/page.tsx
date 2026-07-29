import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getPortalServiceHubData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Service Hub - Store - Admin - Maine CyberTech" };

export default async function AdminStorePortalServicesPage() {
  await requireAdminAccess();
  const data = getPortalServiceHubData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Portal Service Hub" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-portal-services" />}
      title="Portal Service Hub Configuration"
      description={`${data.sections.length} portal sections`}
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Portal Sections ({data.sections.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.sections.map((s) => (
            <div key={s} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-3">
              <p className="text-xs text-slate-300">{s}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
