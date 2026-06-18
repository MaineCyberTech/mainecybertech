import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew } from "../middleware/cache";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const prefix = `mct_${raw.slice(0, 8)}`;
  return {
    fullKey: `mct_${raw}`,
    prefix,
    hash: crypto.createHash("sha256").update(`mct_${raw}`).digest("hex"),
  };
}

// GET /api/v1/api-keys — list keys for an org
router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string;

    let query = supabase
      .from("api_keys")
      .select(
        "id, name, key_prefix, permissions, expires_at, last_used_at, is_active, created_at",
      )
      .order("created_at", { ascending: false });

    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/api-keys — create a new API key
router.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const { fullKey, prefix, hash } = generateApiKey();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        key_hash: hash,
        key_prefix: prefix,
        created_by: req.authUser!.userId,
        expires_at: parsed.expiresAt ?? null,
      })
      .select("id, name, key_prefix, is_active, created_at")
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "api_key.create",
      entityType: "api_key",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    // Return the full key only on creation
    res.status(201).json(success({ ...data, fullKey }));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/api-keys/:id — update (revoke/toggle)
router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        isActive: z.boolean().optional(),
        name: z.string().min(1).max(100).optional(),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (parsed.isActive !== undefined) updateData.is_active = parsed.isActive;
    if (parsed.name !== undefined) updateData.name = parsed.name;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("api_keys")
      .update(updateData)
      .eq("id", req.params.id)
      .select("id, name, key_prefix, is_active, created_at")
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "API key not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "api_key.update",
      entityType: "api_key",
      entityId: req.params.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/api-keys/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "api_key.delete",
      entityType: "api_key",
      entityId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
