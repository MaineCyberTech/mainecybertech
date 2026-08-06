/**
 * Data-driven permission resolution shared by GET /api/v1/me/permissions
 * (routes/me.ts) and the requirePermission middleware
 * (middleware/permissions.ts).
 *
 * Effective permissions = union of role_permissions across the user's
 * approved memberships (optionally scoped to one org), with per-org
 * user_permission_overrides applied (is_allowed=true adds a permission,
 * is_allowed=false removes one). super_admin profiles bypass the
 * computation entirely and receive every catalog permission.
 *
 * NOTE: the `admin` role is NOT bypassed here — that bypass lives in the
 * requirePermission middleware (matching requireAdmin), so me.ts keeps
 * reporting the admin role's real catalog grants to the UI.
 */
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";

/**
 * Role keys that the requirePermission middleware treats as having every
 * permission (same trust level as requireAdmin). `admin` is included even
 * though its catalog grants exclude `delete` actions — the middleware
 * bypass preserves the pre-permission behavior where admins could delete.
 */
export const ADMIN_BYPASS_KEYS = ["super_admin", "admin"] as const;

export interface PermissionRow {
  id: string;
  module_key: string;
  action_key: string;
  description?: string | null;
}

export interface EffectivePermissions {
  isSuperAdmin: boolean;
  /** `${module_key}:${action_key}` keys, e.g. `tickets:create` */
  keys: Set<string>;
  permissions: PermissionRow[];
  roles: string[];
  memberships: Array<{
    id: string;
    organization_id: string;
    role_id: string;
    status: string;
  }>;
}

export async function resolveEffectivePermissions(
  userId: string,
  orgId?: string | null,
): Promise<EffectivePermissions> {
  const supabase = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new AppError("DB_ERROR", profileError.message, 500);

  if (profile?.is_super_admin) {
    const { data: allPermissions, error: permError } = await supabase
      .from("permissions")
      .select("id, module_key, action_key, description");
    if (permError) throw new AppError("DB_ERROR", permError.message, 500);

    return {
      isSuperAdmin: true,
      keys: new Set((allPermissions ?? []).map((p) => `${p.module_key}:${p.action_key}`)),
      permissions: allPermissions ?? [],
      roles: ["super_admin"],
      memberships: [],
    };
  }

  let membershipsQuery = supabase
    .from("memberships")
    .select("id, organization_id, role_id, status, roles(key)")
    .eq("user_id", userId)
    .eq("status", "approved");
  if (orgId) membershipsQuery = membershipsQuery.eq("organization_id", orgId);

  const { data: memberships, error: membershipsError } = await membershipsQuery;
  if (membershipsError) throw new AppError("DB_ERROR", membershipsError.message, 500);

  if (!memberships || memberships.length === 0) {
    return {
      isSuperAdmin: false,
      keys: new Set(),
      permissions: [],
      roles: [],
      memberships: [],
    };
  }

  const roleIds = [...new Set(memberships.map((m) => m.role_id))];
  const orgIds = [...new Set(memberships.map((m) => m.organization_id))];
  const roles = [
    ...new Set(
      memberships
        .map((m: any) => m.roles?.key)
        .filter((k: unknown): k is string => typeof k === "string"),
    ),
  ];

  const [{ data: rolePerms, error: rolePermsError }, { data: overrides, error: ovrError }] =
    await Promise.all([
      supabase.from("role_permissions").select("role_id, permission_id").in("role_id", roleIds),
      supabase
        .from("user_permission_overrides")
        .select("organization_id, permission_id, is_allowed")
        .eq("user_id", userId)
        .in("organization_id", orgIds),
    ]);

  if (rolePermsError) throw new AppError("DB_ERROR", rolePermsError.message, 500);
  if (ovrError) throw new AppError("DB_ERROR", ovrError.message, 500);

  const grantedIds = new Set<string>((rolePerms ?? []).map((rp) => rp.permission_id));

  for (const override of overrides ?? []) {
    if (override.is_allowed) {
      grantedIds.add(override.permission_id);
    } else {
      grantedIds.delete(override.permission_id);
    }
  }

  let permissions: PermissionRow[] = [];
  if (grantedIds.size > 0) {
    const { data: perms, error: permsError } = await supabase
      .from("permissions")
      .select("id, module_key, action_key, description")
      .in("id", [...grantedIds]);
    if (permsError) throw new AppError("DB_ERROR", permsError.message, 500);
    permissions = perms ?? [];
  }

  return {
    isSuperAdmin: false,
    keys: new Set(permissions.map((p) => `${p.module_key}:${p.action_key}`)),
    permissions,
    roles,
    memberships: memberships.map((m) => ({
      id: m.id,
      organization_id: m.organization_id,
      role_id: m.role_id,
      status: m.status,
    })),
  };
}
