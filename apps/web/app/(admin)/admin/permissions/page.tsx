import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getApiClient } from "@/lib/api";
import { MODULE_LABELS, PERMISSION_GROUPS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Permission Matrix | Maine CyberTech Portal",
};

export default async function PermissionMatrixPage() {
  await requireAdminAccess();
  await requirePermission("roles", "view");

  const api = getApiClient();

  let roles: any[] = [];
  let rolePermissionSets: Array<{ roleId: string; ids: Set<string> }> = [];
  let modules: Array<{ module_key: string; group_key: string; action_view_id?: string }> = [];

  try {
    roles = await api.roles.list();

    const permissionResponses = await Promise.all(
      roles.map((role: any) => api.roles.getPermissions(role.id).catch(() => null)),
    );

    const first = permissionResponses.find((r) => r && r.permissions?.length);
    if (first) {
      modules = first.permissions
        .filter((p: any) => p.action_key === "view")
        .map((p: any) => ({
          module_key: p.module_key,
          group_key: p.group_key ?? "other",
          action_view_id: p.id,
        }));
    }

    rolePermissionSets = roles.map((role: any, i: number) => ({
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
        <div className="rounded-xl border border-white/10 bg-[#0F172A]/60 p-8 text-center text-sm text-slate-400">
          Unable to load the permission matrix.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F172A]/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-400">
                  Module
                </th>
                {roles.map((role: any) => (
                  <th
                    key={role.id}
                    className="px-3 py-3 text-center text-xs uppercase tracking-[0.12em] text-slate-400"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedGroups.map((group) => (
                <Fragment key={group}>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500"
                    >
                      {PERMISSION_GROUPS.find((g) => g.key === group)?.label ?? group.toUpperCase()}
                    </td>
                  </tr>
                  {groupedModules.get(group)!.map((mod) => (
                    <tr
                      key={mod.module_key}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-2.5 text-slate-200">
                        {MODULE_LABELS[mod.module_key] ?? mod.module_key}
                      </td>
                      {roles.map((role: any) => {
                        const hasView = mod.action_view_id
                          ? rolePermissionSets
                              .find((rps) => rps.roleId === role.id)
                              ?.ids.has(mod.action_view_id)
                          : false;
                        return (
                          <td key={role.id} className="px-3 py-2.5 text-center">
                            <span
                              className={
                                hasView
                                  ? "inline-flex h-6 w-6 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/15 text-xs font-bold text-emerald-400"
                                  : "inline-flex h-6 w-6 items-center justify-center rounded border border-white/10 text-xs text-slate-600"
                              }
                            >
                              {hasView ? "✓" : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
