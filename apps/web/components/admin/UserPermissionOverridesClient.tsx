"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";
import { MODULE_LABELS, PERMISSION_GROUPS } from "@/lib/permissions";

type Props = {
  userId: string;
  memberships: Array<{ id: string; organization_id: string; role_id: string }>;
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

type Override = {
  id: string;
  organization_id: string;
  permission_id: string;
  is_allowed: boolean;
};

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error";
}

const GROUP_ORDER = PERMISSION_GROUPS.map((g) => g.key);

export default function UserPermissionOverridesClient({ userId, memberships }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    getClientApi()
      .users.getPermissions(userId)
      .then((result) => {
        if (cancelled) return;
        setPermissions(result.permissions);
        setRolePermissionIds(result.rolePermissionIds);
        setOverrides(result.overrides ?? []);
      })
      .catch(() => {
        if (!cancelled) addToast("Failed to load permissions", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, addToast]);

  const modules = [...new Set(permissions.map((p) => p.module_key))];
  const actions = [...new Set(permissions.map((p) => p.action_key))];
  const permMap = new Map(permissions.map((p) => [`${p.module_key}:${p.action_key}`, p]));

  async function cycleOverride(orgId: string, permissionId: string, current: Override | undefined) {
    const next: boolean | null = current ? (current.is_allowed ? false : null) : true;
    setBusy(`${orgId}:${permissionId}`);
    try {
      await getClientApi().users.updatePermissions(userId, {
        organizationId: orgId,
        permissionId,
        isAllowed: next,
      });
      setOverrides((prev) => {
        const filtered = prev.filter(
          (o) => o.organization_id !== orgId || o.permission_id !== permissionId,
        );
        if (next === null) return filtered;
        return [
          ...filtered,
          { id: "tmp", organization_id: orgId, permission_id: permissionId, is_allowed: next },
        ];
      });
      addToast(
        next === null
          ? "Override removed (role default applies)"
          : next
            ? "Permission explicitly granted"
            : "Permission explicitly denied",
      );
    } catch {
      addToast("Network error updating override", "error");
    }
    setBusy(null);
  }

  if (loading)
    return <div className="py-8 text-center text-sm text-slate-400">Loading permissions...</div>;

  if (memberships.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-sm text-slate-400">
        No memberships — permission overrides require an organization membership.
      </div>
    );
  }

  const groupedModules = new Map<string, string[]>();
  for (const mod of modules) {
    const firstPerm = permMap.get(`${mod}:view`) ?? permMap.get(`${mod}:create`);
    const group = firstPerm?.group_key ?? "other";
    if (!groupedModules.has(group)) groupedModules.set(group, []);
    groupedModules.get(group)!.push(mod);
  }
  const orderedGroups = [...groupedModules.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="mt-4 space-y-8">
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

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-emerald-500/30 bg-emerald-500/15" />
          Role default
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-emerald-500/60 bg-emerald-500/60" />
          Override allow
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-red-500/60 bg-red-500/60" />
          Override deny
        </span>
        <span>Click a cell to cycle: allow → deny → reset</span>
      </div>

      {memberships.map((membership) => {
        const orgOverrides = overrides.filter(
          (o) => o.organization_id === membership.organization_id,
        );
        return (
          <div key={membership.id}>
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Organization {membership.organization_id.slice(0, 8)}…
            </h3>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              {orderedGroups.map((group) => {
                const groupLabel = PERMISSION_GROUPS.find((g) => g.key === group)?.label ?? group;
                const isCollapsed = collapsedGroups.has(group);
                return (
                  <div key={group} className="border-b border-white/5 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`override-group-${group}`}
                      className="flex w-full items-center justify-between bg-white/[0.02] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 transition hover:bg-white/[0.04]"
                    >
                      <span>
                        {groupLabel}
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
                      <table id={`override-group-${group}`} className="w-full text-left text-sm">
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
                              <td className="px-3 py-2.5 text-slate-200">
                                {MODULE_LABELS[mod] ?? mod}
                              </td>
                              {actions.map((action) => {
                                const perm = permMap.get(`${mod}:${action}`);
                                if (!perm)
                                  return (
                                    <td
                                      key={action}
                                      className="px-3 py-2.5 text-center text-slate-600"
                                    >
                                      —
                                    </td>
                                  );
                                const override = orgOverrides.find(
                                  (o) => o.permission_id === perm.id,
                                );
                                const hasRole = rolePermissionIds.includes(perm.id);
                                const cellBusy =
                                  busy === `${membership.organization_id}:${perm.id}`;
                                let bg = "bg-[#0A1118]/60";
                                if (override?.is_allowed) bg = "bg-emerald-500/60";
                                else if (override && !override.is_allowed) bg = "bg-red-500/60";
                                else if (hasRole) bg = "bg-emerald-500/15";
                                return (
                                  <td key={action} className="px-3 py-2.5 text-center">
                                    <button
                                      onClick={() =>
                                        cycleOverride(membership.organization_id, perm.id, override)
                                      }
                                      disabled={cellBusy}
                                      aria-label={`Toggle ${mod} ${action} override for ${membership.organization_id} (current: ${override ? (override.is_allowed ? "allowed" : "denied") : hasRole ? "role default granted" : "not set"})`}
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded border text-xs font-bold transition ${bg} ${
                                        override?.is_allowed
                                          ? "border-emerald-500/60 text-emerald-950 hover:opacity-80"
                                          : override && !override.is_allowed
                                            ? "border-red-500/60 text-red-50 hover:opacity-80"
                                            : hasRole
                                              ? "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50"
                                              : "border-white/10 text-slate-600 hover:border-slate-500 hover:text-slate-400"
                                      } ${cellBusy ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                                    >
                                      {cellBusy
                                        ? "..."
                                        : override
                                          ? override.is_allowed
                                            ? "✓"
                                            : "✗"
                                          : hasRole
                                            ? "✓"
                                            : ""}
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
          </div>
        );
      })}
    </div>
  );
}
