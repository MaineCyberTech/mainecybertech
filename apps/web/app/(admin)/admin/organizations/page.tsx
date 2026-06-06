import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";
import { getApiClient } from "@/lib/api";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizations - Admin - Maine CyberTech" };

export default async function OrganizationsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  const organizations = await api.organizations.list();

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Organizations" }
          ]}
        />
      }
      subnav={<AdminSubnav current="organizations" />}
      title="Organizations"
      description="View and manage client tenants, domains, status, and service plans."
    >
      <div className="space-y-4">
        {organizations && organizations.length > 0 ? (
          organizations.map((org: any) => (
            <Link
              key={org.id}
              href={`/admin/organizations/${org.id}`}
              className="block glass-card glass-card-hover p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-50">{org.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Slug: {org.slug} • Domain: {org.primary_domain ?? "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="cyber-pill">{org.status}</span>
                  <span className="cyber-pill-success">
                    {org.support_plan ?? "No Plan"}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="cyber-panel text-slate-400">
            No organizations found.
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
