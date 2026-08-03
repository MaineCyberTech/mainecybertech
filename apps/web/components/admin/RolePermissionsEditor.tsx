"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";
import { MODULE_LABELS, PERMISSION_GROUPS, ACTION_ORDER } from "@/lib/permissions";

type Props = {
  roleId: string;
  roleKey: string;
  isSystem: boolean;
};

type Permission = {
  id: string;
  module_key: string;
  action_key: string;
  group_key?: string | null;
  scope?: string | null;
  label?: string | null;
  description?: string | null;
};

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error";
}

const LEGACY_GROUP: Record<string, string> = {
  dashboard: "core",
  users: "admin",
  organizations: "admin",
  memberships: "admin",
  audit: "admin",
  roles: "admin",
  settings: "admin",
  "bulk-invite": "admin",
  billing: "admin",
  tickets: "core",
  support: "core",
  projects: "core",
  documents: "core",
  approvals: "core",
  notifications: "core",
  webhooks: "tools",
  "api-keys": "tools",
  ai: "tools",
  health: "tools",
  store: "store",
  "store-products": "store",
  "store-promotions": "store",
  "store-quotes": "store",
  "store-campaigns": "store",
  "store-analytics": "store",
  "store-categories": "store",
};

const GROUP_ORDER = PERMISSION_GROUPS.map((g) => g.key);

function sortModules(modules: string[]): string[] {
  return [...modules].sort((a, b) => {
    const ai = MODULE_ORDER.indexOf(a);
    const bi = MODULE_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

const MODULE_ORDER: string[] = Object.keys(MODULE_LABELS);

function sortActions(actions: string[]): string[] {
  return [...actions].sort((a, b) => {
    const ai = ACTION_ORDER.indexOf(a);
    const bi = ACTION_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function RolePermissionsEditor({ roleId, roleKey, isSystem }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  const addToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

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

  const modules = sortModules([...new Set(permissions.map((p) => p.module_key))]);
  const actions = sortActions([...new Set(permissions.map((p) => p.action_key))]);
  const permMap = new Map(permissions.map((p) => [`${p.module_key}:${p.action_key}`, p]));

  async function togglePermission(permissionId: string, currentlyHas: boolean) {
    if (isSystem && roleKey === "super_admin") return;
    setToggling(permissionId);
    try {
      await getClientApi().roles.updatePermission(roleId, permissionId, !currentlyHas);
      if (currentlyHas) {
        setRolePermissionIds((prev) => prev.filter((id) => id !== permissionId));
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
    return <div className="py-8 text-center text-sm text-slate-400">Loading permissions...</div>;

  const groupedModules = new Map<string, string[]>();
  for (const mod of modules) {
    const firstPerm = permMap.get(`${mod}:view`) ?? permMap.get(`${mod}:create`);
    const group = firstPerm?.group_key ?? LEGACY_GROUP[mod] ?? "other";
    if (!groupedModules.has(group)) groupedModules.set(group, []);
    groupedModules.get(group)!.push(mod);
  }

  const groupLabel = (key: string) =>
    PERMISSION_GROUPS.find((g) => g.key === key)?.label ??
    key.charAt(0).toUpperCase() + key.slice(1);

  const orderedGroups = [...groupedModules.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

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
          <span className="font-semibold text-emerald-400">{grantedCount}</span> / {totalCount}{" "}
          permissions granted
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-3 w-3 rounded border border-emerald-500/30 bg-emerald-500/15" />
          <span className="text-slate-400">Granted</span>
          <span className="ml-2 inline-block h-3 w-3 rounded border border-white/10 bg-[#0A1118]/60" />
          <span className="text-slate-400">Not set</span>
        </div>
      </div>

      {orderedGroups.map((group) => {
        const isCollapsed = collapsedGroups.has(group);
        return (
          <div key={group} className="overflow-x-auto rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              aria-expanded={!isCollapsed}
              aria-controls={`role-group-${group}`}
              className="flex w-full items-center justify-between rounded-t-lg bg-white/[0.03] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300 transition hover:bg-white/[0.06]"
            >
              <span>
                {groupLabel(group)}
                <span className="ml-2 text-[9px] font-semibold normal-case tracking-normal text-slate-500">
                  {groupedModules.get(group)!.length} modules
                </span>
              </span>
              <svg
                className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {!isCollapsed ? (
              <table id={`role-group-${group}`} className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-400">
                      Module
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="px-3 py-2 text-center text-xs uppercase tracking-[0.12em] text-slate-400"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedModules.get(group)!.map((mod) => (
                    <tr
                      key={mod}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-3 font-medium capitalize text-slate-200">
                        {MODULE_LABELS[mod] ?? mod}
                      </td>
                      {actions.map((action) => {
                        const perm = permMap.get(`${mod}:${action}`);
                        if (!perm)
                          return (
                            <td key={action} className="px-3 py-3 text-center text-slate-600">
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
                              aria-pressed={hasIt}
                              aria-label={`Toggle ${mod} ${action} permission (${hasIt ? "granted" : "not granted"})`}
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
