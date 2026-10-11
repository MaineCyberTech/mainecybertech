/**
 * Permission catalog + guards shared by client components, server
 * components, and server actions.
 *
 * Permission keys follow the `module:action` convention, e.g.
 * `tickets:view`, `organizations:delete`, `webhooks:manage`.
 */

import { MODULE_REGISTRY } from "@mct/sdk/module-registry";

export type PermissionScope = "admin" | "portal" | "both";

export const permKey = (moduleKey: string, actionKey: string): string =>
  `${moduleKey}:${actionKey}`;

export interface PermissionGrant {
  module_key: string;
  action_key: string;
}

export function hasPermission(
  keys: string[] | undefined | null,
  moduleKey: string,
  actionKey: string,
): boolean {
  if (!keys || keys.length === 0) return false;
  return keys.includes(permKey(moduleKey, actionKey));
}

export interface EffectivePermissions {
  isSuperAdmin: boolean;
  keys: string[];
  permissions: Array<{ module_key: string; action_key: string }>;
  roles: string[];
}

export function can(
  perms: EffectivePermissions | undefined | null,
  moduleKey: string,
  actionKey: string,
): boolean {
  if (!perms) return false;
  if (perms.isSuperAdmin) return true;
  return hasPermission(perms.keys, moduleKey, actionKey);
}

/**
 * Module display labels (EVOL-P2-001) — derived from the shared module
 * registry (`@mct/sdk/module-registry`) instead of a hand-maintained map.
 * Order follows the registry declaration order, which is what
 * `RolePermissionsEditor` relies on for its module ordering.
 */
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((module) => [module.key, module.name]),
);

export const PERMISSION_GROUPS: Array<{ key: string; label: string; scope: PermissionScope }> = [
  { key: "core", label: "Core", scope: "both" },
  { key: "admin", label: "Admin", scope: "admin" },
  { key: "security", label: "Security", scope: "both" },
  { key: "operations", label: "Operations", scope: "both" },
  { key: "clients", label: "Clients", scope: "both" },
  { key: "store", label: "Store", scope: "admin" },
  { key: "tools", label: "Tools", scope: "both" },
  { key: "portal", label: "Portal", scope: "portal" },
];

export const ACTION_ORDER = ["view", "create", "edit", "delete", "manage", "export"];
