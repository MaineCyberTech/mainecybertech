import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getApiClient } from "@/lib/api";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminOrganizationsClient from "@/components/admin/AdminOrganizationsClient";
import CreateOrganizationForm from "@/components/admin/CreateOrganizationForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizations - Admin - Maine CyberTech" };

export default async function OrganizationsPage() {
  await requireAdminAccess();
  await requirePermission("organizations", "view");
  const api = getApiClient();

  const organizations = await api.organizations.list();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Organizations" }]} />
      }
      subnav={<AdminSubnav current="organizations" />}
      title="Organizations"
      description="View and manage client tenants, domains, status, and service plans."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/organizations/new" className="cyber-button">
            Onboard organization
          </Link>
          <CreateOrganizationForm />
        </div>
      }
    >
      <AdminOrganizationsClient organizations={organizations ?? []} />
    </AdminPageShell>
  );
}
