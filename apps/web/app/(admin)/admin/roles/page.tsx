import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roles - Admin - Maine CyberTech" };

export default async function AdminRolesPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const roles = await api.roles.list();

  // Fetch permission counts for each role
  const permissionCounts = new Map<string, number>();
  await Promise.all(roles.map(async (role: any) => {
    try {
      const perms = await api.roles.getPermissions(role.id);
      permissionCounts.set(role.id, perms.rolePermissionIds.length);
    } catch {
      permissionCounts.set(role.id, 0);
    }
  }));

  const totalPerms = [...permissionCounts.values()].reduce((a, b) => a + b, 0);

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Roles" }]} />}
      subnav={<AdminSubnav current="roles" />}
      title="Roles & Permissions"
      description="Manage system roles and their permission mappings."
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{roles.length}</p>
          <p className="text-xs text-slate-500">Roles</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-emerald-400">{totalPerms}</p>
          <p className="text-xs text-slate-500">Total Permissions Granted</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{roles.filter((r: any) => r.is_system).length}</p>
          <p className="text-xs text-slate-500">System Roles</p>
        </div>
      </div>

      <div className="space-y-4">
        {roles.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-8 text-center text-sm text-slate-500">No roles found.</div>
        ) : (
          roles.map((role: any) => {
            const count = permissionCounts.get(role.id) ?? 0;
            return (
              <Link key={role.id} href={`/admin/roles/${role.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-50">{role.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{role.description ?? "No description"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">{count} permissions</span>
                    <span className="cyber-pill text-xs">{role.key}</span>
                    {role.is_system ? (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold text-blue-300 uppercase tracking-wider">System</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </AdminPageShell>
  );
}
