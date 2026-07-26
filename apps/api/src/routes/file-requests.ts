import { Router } from "express";
import crypto from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { createFileRequestSchema, updateFileRequestSchema } from "../validators/file-requests";

const router: ReturnType<typeof Router> = Router();

router.get("/public/:token", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("file_requests")
      .select(
        "id, title, description, token, storage_path, max_file_size_mb, allowed_mime_types, max_files, expires_at, upload_count, status",
      )
      .eq("token", req.params.token)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "File request not found or expired", 404);
    if (data.status !== "active")
      throw new AppError("GONE", "This upload link is no longer active", 410);
    if (new Date(data.expires_at) < new Date())
      throw new AppError("EXPIRED", "This upload link has expired", 410);
    if (data.upload_count >= data.max_files)
      throw new AppError("FULL", "Upload limit reached", 410);
    res.json(
      success({
        id: data.id,
        title: data.title,
        description: data.description,
        maxFileSizeMb: data.max_file_size_mb,
        allowedMimeTypes: data.allowed_mime_types,
        maxFiles: data.max_files,
        uploadCount: data.upload_count,
        expiresAt: data.expires_at,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth);
router.use(requireOrgAccess);

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let q = supabase.from("file_requests").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) q = q.eq("status", status);

    const { data, error, count } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("file_requests")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "File request not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createFileRequestSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + parsed.expiresInDays * 86400000).toISOString();
    const storagePath = `uploads/requests/${token}`;

    const { data, error } = await supabase
      .from("file_requests")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        description: parsed.description ?? null,
        token,
        storage_path: storagePath,
        max_file_size_mb: parsed.maxFileSizeMb,
        allowed_mime_types: parsed.allowedMimeTypes ?? null,
        max_files: parsed.maxFiles,
        expires_at: expiresAt,
        notify_on_upload: parsed.notifyOnUpload,
        visibility: parsed.visibility,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "file_request.created",
      entityType: "file_request",
      entityId: data.id,
      metadata: { title: parsed.title, expiresAt },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateFileRequestSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;

    const { data, error } = await supabase
      .from("file_requests")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "File request not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: `file_request.${parsed.status === "revoked" ? "revoked" : "updated"}`,
      entityType: "file_request",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("file_requests").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "file_request.deleted",
      entityType: "file_request",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
