import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminUsersClient from "@/components/admin/AdminUsersClient";
import InviteUserForm from "@/components/admin/InviteUserForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users - Admin - Maine CyberTech" };

export default async function UsersPage() {
  await requireAdminAccess();
  await requirePermission("users", "view");
  const api = getApiClient();

  const compound = await api.users.getCompound().catch(() => [] as any[]);

  const memberships = compound.flatMap((c: any) => c.memberships ?? []);
  const profileMap = Object.fromEntries(compound.map((c: any) => [c.user.id, c.user]));
  const orgMap = Object.fromEntries([
    ...new Map(compound.flatMap((c: any) => c.organizations ?? []).map((o: any) => [o.id, o])),
  ]);
  const roleMap = Object.fromEntries([
    ...new Map(compound.flatMap((c: any) => c.roles ?? []).map((r: any) => [r.id, r])),
  ]);

  return (
    <AdminPageShell
      breadcrumbs={<Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Users" }]} />}
      subnav={<AdminSubnav current="users" />}
      title="Users"
      description="Manage user profiles, organization memberships, and role assignments."
      actions={
        <div className="flex items-center gap-3">
          <div className="cyber-pill">Total users: {compound.length}</div>
          <InviteUserForm />
        </div>
      }
    >
      <AdminUsersClient
        memberships={memberships}
        profileMap={profileMap}
        orgMap={orgMap}
        roleMap={roleMap}
      />
    </AdminPageShell>
  );
}
