import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users - Admin - Maine CyberTech" };

export default async function UsersPage() {
  await requireAdminAccess();
  const api = getApiClient();

  const memberships = await api.memberships.list();

  const uniqueUserIds = [
    ...new Set(memberships.map((m: any) => m.user_id).filter(Boolean)),
  ];
  const orgIds = memberships.map((m: any) => m.organization_id).filter(Boolean);
  const roleIds = memberships.map((m: any) => m.role_id).filter(Boolean);

  const [profiles, organizations, roles] = await Promise.all([
    uniqueUserIds.length
      ? api.profiles.list({ ids: uniqueUserIds })
      : Promise.resolve([] as any[]),
    orgIds.length
      ? api.organizations.list({ ids: orgIds })
      : Promise.resolve([] as any[]),
    roleIds.length
      ? api.roles.list({ ids: roleIds })
      : Promise.resolve([] as any[]),
  ]);

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
  const orgMap = Object.fromEntries(organizations.map((o: any) => [o.id, o]));
  const roleMap = Object.fromEntries(roles.map((r: any) => [r.id, r]));

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        />
      }
      subnav={<AdminSubnav current="users" />}
      title="Users"
      description="Manage user profiles, organization memberships, and role assignments."
      actions={
        <div className="cyber-pill">Total users: {uniqueUserIds.length}</div>
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
