import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

/**
 * GET /api/v1/me/permissions
 *
 * Returns the current user's effective permission set computed from
 * approved memberships -> role_permissions -> permissions, with
 * per-org user_permission_overrides applied. Super admins bypass the
 * computation and receive every permission.
 */
router.get("/permissions", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.authUser!.userId;

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

      res.json(
        success({
          isSuperAdmin: true,
          permissions: allPermissions ?? [],
          keys: (allPermissions ?? []).map((p) => `${p.module_key}:${p.action_key}`),
          roles: ["super_admin"],
          memberships: [],
        }),
      );
      return;
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("memberships")
      .select("id, organization_id, role_id, status, roles(key)")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (membershipsError) throw new AppError("DB_ERROR", membershipsError.message, 500);

    if (!memberships || memberships.length === 0) {
      res.json(
        success({
          isSuperAdmin: false,
          permissions: [],
          keys: [],
          roles: [],
          memberships: [],
        }),
      );
      return;
    }

    const roleIds = [...new Set(memberships.map((m) => m.role_id))];
    const orgIds = [...new Set(memberships.map((m) => m.organization_id))];
    const roleKeys = [
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

    let permissions: Array<{
      id: string;
      module_key: string;
      action_key: string;
      description?: string | null;
    }> = [];
    if (grantedIds.size > 0) {
      const { data: perms, error: permsError } = await supabase
        .from("permissions")
        .select("id, module_key, action_key, description")
        .in("id", [...grantedIds]);
      if (permsError) throw new AppError("DB_ERROR", permsError.message, 500);
      permissions = perms ?? [];
    }

    res.json(
      success({
        isSuperAdmin: false,
        permissions,
        keys: permissions.map((p) => `${p.module_key}:${p.action_key}`),
        roles: roleKeys,
        memberships: memberships.map((m) => ({
          organization_id: m.organization_id,
          role_id: m.role_id,
          status: m.status,
        })),
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
