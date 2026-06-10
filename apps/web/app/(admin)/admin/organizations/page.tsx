import { requireAdminAccess } from "@/lib/auth/admin";
import { getApiClient } from "@/lib/api";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminOrganizationsClient from "@/components/admin/AdminOrganizationsClient";

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
      <AdminOrganizationsClient organizations={organizations ?? []} />
    </AdminPageShell>
  );
}
