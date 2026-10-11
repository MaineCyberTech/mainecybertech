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
import { roleKeyOf } from "./roles";

/**
 * PERF-P2-003: short-TTL, per-process cache of resolved effective permissions.
 *
 * Every gated request used to fan out 4-6 hosted-Supabase reads, and
 * requirePermission + requireEntitlement resolved the same user twice per
 * request. Results are cached by `userId:orgId` for a short window so
 * repeated requests (and the double resolution inside one request) reuse one
 * resolution; in-flight promises are shared so concurrent requests for the
 * same key also dedupe. Failures are never cached.
 *
 * Writes that change a user's grants call `clearPermissionCache(userId)`
 * (or clear the whole map for global role-catalog changes), so revocations
 * apply immediately on the instance that served the write; the TTL bounds
 * staleness everywhere else.
 */
const PERMISSION_CACHE_TTL_MS = 15_000;
const MAX_PERMISSION_CACHE_ENTRIES = 5_000;

interface PermissionCacheEntry {
  promise: Promise<EffectivePermissions>;
  expires: number;
}

const permissionCache = new Map<string, PermissionCacheEntry>();

function permissionCacheKey(userId: string, orgId?: string | null): string {
  return `${userId}:${orgId ?? "*"}`;
}

/**
 * Drop cached resolutions for one user (all org scopes) or the whole cache
 * when no user is given (global role/permission catalog changes). Also the
 * test-only reset hook used by permission middleware suites.
 */
export function clearPermissionCache(userId?: string): void {
  if (!userId) {
    permissionCache.clear();
    return;
  }
  const prefix = `${userId}:`;
  for (const key of [...permissionCache.keys()]) {
    if (key.startsWith(prefix)) permissionCache.delete(key);
  }
}

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
    role_id: string | null;
    status: string;
  }>;
}

export async function resolveEffectivePermissions(
  userId: string,
  orgId?: string | null,
): Promise<EffectivePermissions> {
  const key = permissionCacheKey(userId, orgId);
  const cached = permissionCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;

  const promise = resolveEffectivePermissionsUncached(userId, orgId).catch((error) => {
    // Never cache failures: the next request must retry.
    permissionCache.delete(key);
    throw error;
  });

  // Bound the map: drop expired entries, then evict oldest if still full.
  if (permissionCache.size >= MAX_PERMISSION_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [entryKey, entry] of permissionCache) {
      if (entry.expires <= now) permissionCache.delete(entryKey);
    }
    while (permissionCache.size >= MAX_PERMISSION_CACHE_ENTRIES) {
      const oldest = permissionCache.keys().next();
      if (oldest.done) break;
      permissionCache.delete(oldest.value);
    }
  }

  permissionCache.set(key, { promise, expires: Date.now() + PERMISSION_CACHE_TTL_MS });
  return promise;
}

async function resolveEffectivePermissionsUncached(
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

  const roleIds = [
    ...new Set(memberships.map((m) => m.role_id).filter((r): r is string => r !== null)),
  ];
  const orgIds = [...new Set(memberships.map((m) => m.organization_id))];
  const roles = [
    ...new Set(
      memberships.map((m) => roleKeyOf(m.roles)).filter((k): k is string => typeof k === "string"),
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
