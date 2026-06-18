"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";

type Props = {
  roleId: string;
  roleKey: string;
  isSystem: boolean;
};

type Permission = {
  id: string;
  module_key: string;
  action_key: string;
  description?: string | null;
};

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error";
}

const MODULE_GROUP: Record<string, string> = {
  dashboard: "Core",
  users: "Admin",
  organizations: "Admin",
  memberships: "Admin",
  audit: "Admin",
  roles: "Admin",
  tickets: "Support",
  projects: "Projects",
  documents: "Documents",
  billing: "Finance",
  webhooks: "Integrations",
  notifications: "Communications",
};

const MODULE_ORDER = [
  "dashboard",
  "users",
  "organizations",
  "memberships",
  "audit",
  "roles",
  "tickets",
  "projects",
  "documents",
  "billing",
  "webhooks",
  "notifications",
];
const ACTION_ORDER = ["view", "create", "edit", "delete", "manage"];

function sortModules(modules: string[]): string[] {
  return [...modules].sort((a, b) => {
    const ai = MODULE_ORDER.indexOf(a);
    const bi = MODULE_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function sortActions(actions: string[]): string[] {
  return [...actions].sort((a, b) => {
    const ai = ACTION_ORDER.indexOf(a);
    const bi = ACTION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function RolePermissionsEditor({
  roleId,
  roleKey,
  isSystem,
}: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, kind: "success" | "error" = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3000,
      );
    },
    [],
  );

  const fetchData = useCallback(async () => {
    try {
      const result = await getClientApi().roles.getPermissions(roleId);
      setPermissions(result.permissions);
      setRolePermissionIds(result.rolePermissionIds);
    } catch {
      addToast("Failed to load permissions", "error");
    }
    setLoading(false);
  }, [roleId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const modules = sortModules([
    ...new Set(permissions.map((p) => p.module_key)),
  ]);
  const actions = sortActions([
    ...new Set(permissions.map((p) => p.action_key)),
  ]);
  const permMap = new Map(
    permissions.map((p) => [`${p.module_key}:${p.action_key}`, p]),
  );

  async function togglePermission(permissionId: string, currentlyHas: boolean) {
    if (isSystem && roleKey === "super_admin") return;
    setToggling(permissionId);
    try {
      await getClientApi().roles.updatePermission(
        roleId,
        permissionId,
        !currentlyHas,
      );
      if (currentlyHas) {
        setRolePermissionIds((prev) =>
          prev.filter((id) => id !== permissionId),
        );
        addToast("Permission revoked");
      } else {
        setRolePermissionIds((prev) => [...prev, permissionId]);
        addToast("Permission granted");
      }
    } catch {
      addToast("Network error updating permission", "error");
    }
    setToggling(null);
  }

  const grantedCount = rolePermissionIds.length;
  const totalCount = permissions.length;

  if (loading)
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Loading permissions...
      </div>
    );

  const groupedModules = new Map<string, string[]>();
  for (const mod of modules) {
    const group = MODULE_GROUP[mod] ?? "Other";
    if (!groupedModules.has(group)) groupedModules.set(group, []);
    groupedModules.get(group)!.push(mod);
  }

  return (
    <div className="space-y-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 text-sm ${
            t.kind === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {t.message}
        </div>
      ))}

      {isSystem && roleKey === "super_admin" ? (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
          Super Admin has all permissions and cannot be modified.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-slate-400">
          <span className="text-emerald-400 font-semibold">{grantedCount}</span>{" "}
          / {totalCount} permissions granted
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-3 w-3 rounded border border-emerald-500/30 bg-emerald-500/15" />
          <span className="text-slate-500">Granted</span>
          <span className="inline-block h-3 w-3 rounded border border-white/10 bg-[#0A1118]/60 ml-2" />
          <span className="text-slate-500">Not set</span>
        </div>
      </div>

      {[...groupedModules.entries()].map(([group, mods]) => (
        <div key={group} className="overflow-x-auto">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            {group}
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  Module
                </th>
                {actions.map((action) => (
                  <th
                    key={action}
                    className="px-3 py-2 text-center text-xs uppercase tracking-[0.12em] text-slate-500"
                  >
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map((mod) => (
                <tr
                  key={mod}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-3 font-medium text-slate-200 capitalize">
                    {mod}
                  </td>
                  {actions.map((action) => {
                    const perm = permMap.get(`${mod}:${action}`);
                    if (!perm)
                      return (
                        <td
                          key={action}
                          className="px-3 py-3 text-center text-slate-600"
                        >
                          —
                        </td>
                      );
                    const hasIt = rolePermissionIds.includes(perm.id);
                    const isToggling = toggling === perm.id;
                    const disabled = isSystem && roleKey === "super_admin";
                    return (
                      <td key={action} className="px-3 py-3 text-center">
                        <button
                          onClick={() => togglePermission(perm.id, hasIt)}
                          disabled={disabled || isToggling}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded border text-xs font-bold transition sm:h-7 sm:w-7 ${
                            hasIt
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                              : "border-white/10 bg-[#0A1118]/60 text-slate-600 hover:border-slate-600 hover:text-slate-400"
                          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          title={perm.description ?? `${mod} ${action}`}
                        >
                          {isToggling ? "..." : hasIt ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
