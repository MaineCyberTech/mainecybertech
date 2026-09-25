import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import OrganizationOnboardingWizard from "@/components/admin/OrganizationOnboardingWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboard Organization - Admin - Maine CyberTech" };

export default async function OnboardOrganizationPage() {
  await requireAdminAccess();
  await requirePermission("organizations", "manage");

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Organizations", href: "/admin/organizations" },
            { label: "Onboard" },
          ]}
        />
      }
      subnav={<AdminSubnav current="organizations" />}
      title="Onboard Organization"
      description="Create a new organization, invite its first admin, and set initial details."
    >
      <OrganizationOnboardingWizard />
    </AdminPageShell>
  );
}
