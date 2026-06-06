import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import BulkInviteForm from "@/components/admin/BulkInviteForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk Invite - Admin - Maine CyberTech" };

export default async function BulkInvitePage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [organizations, roles] = await Promise.all([
    api.organizations.list(),
    api.roles.list(),
  ]);

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Bulk Invite" }]} />}
      subnav={<AdminSubnav current="approvals" />}
      title="Bulk User Import"
      description="Import multiple users via CSV and invite them to an organization."
    >
      <BulkInviteForm
        organizations={organizations.map((o: any) => ({ id: o.id, name: o.name }))}
        roles={roles.map((r: any) => ({ id: r.id, name: r.name, key: r.key }))}
      />
    </AdminPageShell>
  );
}
