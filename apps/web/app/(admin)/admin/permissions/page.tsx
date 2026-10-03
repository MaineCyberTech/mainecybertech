import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getApiClient } from "@/lib/api";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import PermissionMatrixClient from "@/components/admin/PermissionMatrixClient";
import { PermissionInfo, Role } from "@mct/sdk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Permission Matrix | Maine CyberTech Portal",
};

export default async function PermissionMatrixPage() {
  await requireAdminAccess();
  await requirePermission("roles", "view");

  const api = getApiClient();

  let roles: Role[] = [];
  let rolePermissionSets: Array<{ roleId: string; ids: Set<string> }> = [];
  let modules: Array<{ module_key: string; group_key: string; action_view_id?: string }> = [];

  try {
    roles = await api.roles.list();

    const permissionResponses = await Promise.all(
      roles.map((role: Role) => api.roles.getPermissions(role.id).catch(() => null)),
    );

    const first = permissionResponses.find((r) => r && r.permissions?.length);
    if (first) {
      modules = first.permissions
        .filter((p: PermissionInfo) => p.action_key === "view")
        .map((p: PermissionInfo) => ({
          module_key: p.module_key,
          group_key: p.group_key ?? "other",
          action_view_id: p.id,
        }));
    }

    rolePermissionSets = roles.map((role: Role, i: number) => ({
      roleId: role.id,
      ids: new Set(permissionResponses[i]?.rolePermissionIds ?? []),
    }));
  } catch {
    // Render empty matrix with an error banner below
  }

  const groupedModules = new Map<string, typeof modules>();
  for (const mod of modules) {
    const group = mod.group_key;
    if (!groupedModules.has(group)) groupedModules.set(group, []);
    groupedModules.get(group)!.push(mod);
  }
  const groupOrder = PERMISSION_GROUPS.map((g) => g.key);
  const orderedGroups = [...groupedModules.keys()].sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const matrixGroups = orderedGroups.map((group) => ({
    group,
    modules: groupedModules.get(group) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Permission Matrix</h1>
          <p className="mt-1 text-sm text-slate-400">
            Role vs module visibility matrix. Toggle individual role permissions on the role detail
            pages.
          </p>
        </div>
        <Link
          href="/admin/roles"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
        >
          Manage Roles
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          Unable to load the permission matrix.
        </div>
      ) : (
        <PermissionMatrixClient
          roles={roles}
          rolePermissionSets={rolePermissionSets}
          groupedModules={matrixGroups}
        />
      )}
    </div>
  );
}
