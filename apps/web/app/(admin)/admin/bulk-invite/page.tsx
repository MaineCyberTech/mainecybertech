import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import BulkInviteForm from "@/components/admin/BulkInviteForm";
import { Organization, Role } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk Invite - Admin - Maine CyberTech" };

export default async function BulkInvitePage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [organizationsResult, roles] = await Promise.all([api.organizations.list({ limit: 100 }), api.roles.list()]);
  const organizations = organizationsResult.items ?? [];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Bulk Invite" }]} />
      }
      subnav={<AdminSubnav current="approvals" />}
      title="Bulk User Import"
      description="Import multiple users via CSV and invite them to an organization."
    >
      <BulkInviteForm
        organizations={organizations.map((o: Organization) => ({ id: o.id, name: o.name }))}
        roles={roles.map((r: Role) => ({ id: r.id, name: r.name, key: r.key }))}
      />
    </AdminPageShell>
  );
}
