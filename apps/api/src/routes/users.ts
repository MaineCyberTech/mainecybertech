import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .order("email");

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", req.params.id)
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "User not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/detail", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", req.params.id)
      .single();

    if (userError || !user)
      throw new AppError("NOT_FOUND", "User not found", 404);

    const { data: memberships, error: memError } = await supabase
      .from("memberships")
      .select(
        "id, organization_id, user_id, role_id, status, is_billing_contact, is_security_contact, created_at",
      )
      .eq("user_id", req.params.id);

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);

    const orgIds = [
      ...new Set(
        (memberships ?? []).map(
          (m: { organization_id: string }) => m.organization_id,
        ),
      ),
    ];
    const roleIds = [
      ...new Set(
        (memberships ?? []).map((m: { role_id: string }) => m.role_id),
      ),
    ];

    const [
      { data: organizations, error: orgsError },
      { data: roles, error: rolesError },
    ] = await Promise.all([
      orgIds.length > 0
        ? supabase
            .from("organizations")
            .select(
              "id, name, slug, status, primary_domain, support_plan, created_at, updated_at",
            )
            .in("id", orgIds)
        : { data: [], error: null },
      roleIds.length > 0
        ? supabase.from("roles").select("id, key, name").in("id", roleIds)
        : { data: [], error: null },
    ]);

    if (orgsError) throw new AppError("DB_ERROR", orgsError.message, 500);
    if (rolesError) throw new AppError("DB_ERROR", rolesError.message, 500);

    const { data: allRoles, error: allRolesError } = await supabase
      .from("roles")
      .select("id, key, name");

    if (allRolesError)
      throw new AppError("DB_ERROR", allRolesError.message, 500);

    res.json(
      success({
        user,
        profile: user,
        memberships: memberships ?? [],
        organizations: organizations ?? [],
        roles: roles ?? [],
        allRoles: allRoles ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", requireAdmin, async (req, res, next) => {
  try {
    const { roleId, organizationId } = z
      .object({
        roleId: z.string().min(1, "roleId is required"),
        organizationId: z.string().optional(),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("memberships")
      .update({ role_id: roleId })
      .eq("user_id", req.params.id);
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.role.update",
      entityType: "user",
      entityId: String(req.params.id),
      metadata: { roleId, organizationId },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/permissions", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.params.id;

    const [
      { data: memberships, error: memError },
      { data: allPermissions, error: permError },
      { data: overrides, error: ovrError },
    ] = await Promise.all([
      supabase
        .from("memberships")
        .select(
          "id, organization_id, role_id, status, roles(key, name), organizations(name)",
        )
        .eq("user_id", userId),
      supabase
        .from("permissions")
        .select("id, module_key, action_key, description")
        .order("module_key")
        .order("action_key"),
      supabase
        .from("user_permission_overrides")
        .select("id, organization_id, permission_id, is_allowed")
        .eq("user_id", userId),
    ]);

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);
    if (permError) throw new AppError("DB_ERROR", permError.message, 500);
    if (ovrError) throw new AppError("DB_ERROR", ovrError.message, 500);

    const rolePermissions = memberships?.length
      ? await supabase
          .from("role_permissions")
          .select("permission_id")
          .in(
            "role_id",
            memberships.map((m: any) => m.role_id),
          )
      : { data: [] as any[], error: null };

    if (rolePermissions.error)
      throw new AppError(
        "DB_ERROR",
        (rolePermissions.error as any).message,
        500,
      );

    res.json(
      success({
        memberships: memberships ?? [],
        permissions: allPermissions ?? [],
        rolePermissionIds: (rolePermissions.data ?? []).map(
          (rp: any) => rp.permission_id,
        ),
        overrides: overrides ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put("/:id/permissions", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.params.id;
    const { organizationId, permissionId, isAllowed } = req.body as {
      organizationId?: string;
      permissionId?: string;
      isAllowed?: boolean;
    };

    if (!organizationId || !permissionId || isAllowed === undefined) {
      throw new AppError(
        "VALIDATION",
        "organizationId, permissionId, and isAllowed are required",
        400,
      );
    }

    const { data: existing, error: checkError } = await supabase
      .from("user_permission_overrides")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("permission_id", permissionId)
      .maybeSingle();

    if (checkError) throw new AppError("DB_ERROR", checkError.message, 500);

    if (existing) {
      const { error } = await supabase
        .from("user_permission_overrides")
        .update({ is_allowed: isAllowed })
        .eq("id", existing.id);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
    } else {
      const { error } = await supabase
        .from("user_permission_overrides")
        .insert({
          user_id: userId,
          organization_id: organizationId,
          permission_id: permissionId,
          is_allowed: isAllowed,
        });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.permission.override",
      entityType: "user_permission_override",
      metadata: {
        targetUserId: userId,
        organizationId,
        permissionId,
        isAllowed,
      },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
