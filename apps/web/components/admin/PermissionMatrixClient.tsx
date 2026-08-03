"use client";

import { useCallback, useState } from "react";
import { MODULE_LABELS, PERMISSION_GROUPS } from "@/lib/permissions";

type Props = {
  roles: any[];
  rolePermissionSets: Array<{ roleId: string; ids: Set<string> }>;
  groupedModules: Array<{
    group: string;
    modules: Array<{ module_key: string; group_key: string; action_view_id?: string }>;
  }>;
};

export default function PermissionMatrixClient({
  roles,
  rolePermissionSets,
  groupedModules,
}: Props) {
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

  const groupLabel = (key: string) =>
    PERMISSION_GROUPS.find((g) => g.key === key)?.label ??
    key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F172A]/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-400">Module</th>
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
          {groupedModules.map(({ group, modules }) => {
            const isCollapsed = collapsedGroups.has(group);
            return (
              <FragmentRow
                key={group}
                group={group}
                label={groupLabel(group)}
                isCollapsed={isCollapsed}
                onToggle={() => toggleGroup(group)}
                moduleCount={modules.length}
                colSpan={roles.length + 1}
              >
                {modules.map((mod) => (
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
              </FragmentRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRow({
  group,
  label,
  isCollapsed,
  onToggle,
  moduleCount,
  colSpan,
  children,
}: {
  group: string;
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  moduleCount: number;
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-white/5 bg-white/[0.02]">
        <td colSpan={colSpan} className="px-0 py-0">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!isCollapsed}
            aria-controls={`matrix-group-${group}`}
            className="flex w-full items-center justify-between px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 transition hover:bg-white/[0.04]"
          >
            <span>
              {label}
              <span className="ml-2 text-[9px] font-semibold normal-case tracking-normal text-slate-500">
                {moduleCount} modules
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
        </td>
      </tr>
      {!isCollapsed ? children : null}
    </>
  );
}
