import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { responseCacheNoRenew, invalidateCache } from "../middleware/cache";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", requireAdmin, responseCacheNoRenew(120), async (req, res, next) => {
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

router.get("/with-permissions", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: roles } = await supabase
      .from("roles")
      .select("id, key, name, description, is_system")
      .order("name");
    const { data: counts } = await supabase
      .from("role_permissions")
      .select("role_id, permission_id");

    if (!roles) throw new AppError("DB_ERROR", "Failed to fetch roles", 500);

    const countMap = new Map<string, number>();
    for (const rp of counts ?? []) {
      countMap.set(rp.role_id, (countMap.get(rp.role_id) ?? 0) + 1);
    }

    const result = roles.map((r: any) => ({
      ...r,
      permissionCount: countMap.get(r.id) ?? 0,
    }));

    res.json(success(result));
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

const createRoleSchema = z.object({
  key: z
    .string()
    .min(1, "key is required")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "key must be lowercase letters, numbers, underscores, or dashes"),
  name: z.string().min(1, "name is required").max(100),
  description: z.string().max(500).optional().nullable(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

// POST /api/v1/roles - create a custom role (admin)
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createRoleSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("roles")
      .insert({
        key: parsed.key,
        name: parsed.name,
        description: parsed.description ?? null,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError("VALIDATION", `A role with key "${parsed.key}" already exists`, 409);
      }
      throw new AppError("DB_ERROR", error.message, 500);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "role.create",
      entityType: "role",
      entityId: data.id,
      metadata: { key: parsed.key, name: parsed.name },
    });

    invalidateCache(`/api/v1/roles`);
    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { code: "VALIDATION", message: error.issues } });
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/roles/:id - update role name/description (admin)
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateRoleSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("roles")
      .select("id, is_system")
      .eq("id", req.params.id)
      .single();
    if (!existing) throw new AppError("NOT_FOUND", "Role not found", 404);

    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.description !== undefined) updates.description = parsed.description;

    const { data, error } = await supabase
      .from("roles")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Role not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "role.update",
      entityType: "role",
      entityId: data.id,
      metadata: parsed,
    });

    invalidateCache(`/api/v1/roles`);
    res.json(success(data));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { code: "VALIDATION", message: error.issues } });
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/roles/:id - delete a custom role (admin)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("roles")
      .select("id, key, is_system")
      .eq("id", req.params.id)
      .single();
    if (!existing) throw new AppError("NOT_FOUND", "Role not found", 404);
    if (existing.is_system) {
      throw new AppError("VALIDATION", "System roles cannot be deleted", 400);
    }

    const { error } = await supabase.from("roles").delete().eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "role.delete",
      entityType: "role",
      entityId: String(req.params.id),
      metadata: { key: existing.key },
    });

    invalidateCache(`/api/v1/roles`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/permissions", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: role }, { data: allPermissions }, { data: rolePermissionIds }] =
      await Promise.all([
        supabase.from("roles").select("id, key, name").eq("id", req.params.id).single(),
        supabase
          .from("permissions")
          .select("id, module_key, action_key, group_key, scope, label, description")
          .order("module_key")
          .order("action_key"),
        supabase.from("role_permissions").select("permission_id").eq("role_id", req.params.id),
      ]);

    if (!role) throw new AppError("NOT_FOUND", "Role not found", 404);

    res.json(
      success({
        role,
        permissions: allPermissions ?? [],
        rolePermissionIds: (rolePermissionIds ?? []).map((rp: any) => rp.permission_id),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put("/:id/permissions", requireAdmin, async (req, res, next) => {
  try {
    const { permissionId, hasPermission } = z
      .object({
        permissionId: z.string().min(1),
        hasPermission: z.boolean(),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();

    const { data: role } = await supabase
      .from("roles")
      .select("id, key, is_system")
      .eq("id", req.params.id)
      .single();
    if (!role) throw new AppError("NOT_FOUND", "Role not found", 404);
    if (role.is_system && role.key === "super_admin") {
      throw new AppError("VALIDATION", "Super Admin role permissions cannot be modified", 400);
    }

    if (hasPermission) {
      await supabase.from("role_permissions").upsert(
        {
          role_id: req.params.id,
          permission_id: permissionId,
        },
        { onConflict: "role_id,permission_id" },
      );
    } else {
      await supabase
        .from("role_permissions")
        .delete()
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

    invalidateCache(`/api/v1/roles`);
    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
