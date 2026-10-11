import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mct/sdk/database.types";
import { AppError } from "../types";
import { CROSS_TENANT_KEYS } from "./roles";

/**
 * SEC-P1-001 / ADMIN-P1-003 / CHAIN-P1-004: central role-assignment guard.
 *
 * The `users:manage` / `roles:manage` permissions are delegable inside a
 * tenant, but granting a CROSS-TENANT role (`admin` / `super_admin` in
 * lib/roles.ts) must stay a platform-super-admin action — otherwise a
 * delegated user-manager can self-escalate into the cross-tenant tier that the
 * admin-scope checks rely on. Non-super-admins may also never change their own
 * role.
 */
export function isCrossTenantRoleKey(key: string | null | undefined): boolean {
  return key != null && (CROSS_TENANT_KEYS as readonly string[]).includes(key);
}

export async function assertCanAssignRole(
  supabase: SupabaseClient<Database>,
  callerUserId: string,
  roleKey: string | null | undefined,
  targetUserId?: string | null,
): Promise<void> {
  const assigningCrossTenant = isCrossTenantRoleKey(roleKey);
  const changingSelf = Boolean(targetUserId && targetUserId === callerUserId);
  if (!assigningCrossTenant && !changingSelf) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", callerUserId)
    .maybeSingle();

  if (!profile?.is_super_admin) {
    if (assigningCrossTenant) {
      throw new AppError("FORBIDDEN", "Only super admins can assign cross-tenant roles", 403);
    }
    throw new AppError("FORBIDDEN", "You cannot change your own role", 403);
  }
}

/**
 * Resolve a role id to its catalog key and reject unknown ids, so assignment
 * paths cannot smuggle an arbitrary/unknown role into a membership.
 */
export async function resolveRoleKey(
  supabase: SupabaseClient<Database>,
  roleId: string,
): Promise<string> {
  const { data: role, error } = await supabase
    .from("roles")
    .select("key")
    .eq("id", roleId)
    .maybeSingle();

  if (error) throw new AppError("DB_ERROR", error.message, 500);
  if (!role) throw new AppError("NOT_FOUND", "Role not found", 404);
  return role.key as string;
}
