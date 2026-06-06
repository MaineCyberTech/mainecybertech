import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { responseCache } from "../middleware/cache";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", responseCache(120), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("roles").select("id, key, name, description, is_system");

    const idsFilter = req.query.ids as string | undefined;
    if (idsFilter) {
      const ids = idsFilter.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    }

    const { data, error } = await query.order("name");
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
      .from("roles")
      .select("id, key, name, description, is_system")
      .eq("id", req.params.id)
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Role not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/permissions", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: role }, { data: allPermissions }, { data: rolePermissionIds }] = await Promise.all([
      supabase.from("roles").select("id, key, name").eq("id", req.params.id).single(),
      supabase.from("permissions").select("id, module_key, action_key, description").order("module_key").order("action_key"),
      supabase.from("role_permissions").select("permission_id").eq("role_id", req.params.id),
    ]);

    if (!role) throw new AppError("NOT_FOUND", "Role not found", 404);

    res.json(success({
      role,
      permissions: allPermissions ?? [],
      rolePermissionIds: (rolePermissionIds ?? []).map((rp: any) => rp.permission_id),
    }));
  } catch (error) {
    next(error);
  }
});

router.put("/:id/permissions", requireAdmin, async (req, res, next) => {
  try {
    const { permissionId, hasPermission } = req.body as { permissionId?: string; hasPermission?: boolean };
    if (!permissionId || hasPermission === undefined) {
      throw new AppError("VALIDATION", "permissionId and hasPermission are required", 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: role } = await supabase.from("roles").select("id, key, is_system").eq("id", req.params.id).single();
    if (!role) throw new AppError("NOT_FOUND", "Role not found", 404);
    if (role.is_system && role.key === "super_admin") {
      throw new AppError("VALIDATION", "Super Admin role permissions cannot be modified", 400);
    }

    if (hasPermission) {
      await supabase.from("role_permissions").upsert({
        role_id: req.params.id,
        permission_id: permissionId,
      }, { onConflict: "role_id,permission_id" });
    } else {
      await supabase.from("role_permissions").delete()
        .eq("role_id", req.params.id)
        .eq("permission_id", permissionId);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "role.permissions.update",
      entityType: "role",
      entityId: String(req.params.id),
      metadata: { permissionId, hasPermission },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
