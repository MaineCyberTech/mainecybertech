import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roles - Admin - Maine CyberTech" };

export default async function AdminRolesPage() {
  await requireAdminAccess();
  await requirePermission("roles", "view");
  const api = getApiClient();
  const roles = await api.roles.listWithPermissions();

  const totalPerms = roles.reduce((a: number, r: any) => a + r.permissionCount, 0);

  return (
    <AdminPageShell
      breadcrumbs={<Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Roles" }]} />}
      subnav={<AdminSubnav current="roles" />}
      title="Roles & Permissions"
      description="Manage system roles and their permission mappings."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{roles.length}</p>
          <p className="text-xs text-slate-400">Roles</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-emerald-400">{totalPerms}</p>
          <p className="text-xs text-slate-400">Total Permissions Granted</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">
            {roles.filter((r: any) => r.is_system).length}
          </p>
          <p className="text-xs text-slate-400">System Roles</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/permissions"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          View Permission Matrix
        </Link>
      </div>

      <div className="space-y-4">
        {roles.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-8 text-center text-sm text-slate-400">
            No roles found.
          </div>
        ) : (
          roles.map((role: any) => {
            const count = role.permissionCount ?? 0;
            return (
              <Link
                key={role.id}
                href={`/admin/roles/${role.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-50">{role.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {role.description ?? "No description"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      {count} permissions
                    </span>
                    <span className="cyber-pill text-xs">{role.key}</span>
                    {role.is_system ? (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                        System
                      </span>
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
