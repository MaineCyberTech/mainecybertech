import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { createFileRequestSchema, updateFileRequestSchema } from "../validators/file-requests";
import { createNotification } from "../lib/notify";

const router: ReturnType<typeof Router> = Router();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/rtf",
];

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".ps1",
  ".vbs",
  ".js",
  ".jse",
  ".msi",
  ".msp",
  ".hta",
  ".reg",
  ".dll",
  ".sh",
  ".jar",
  ".php",
  ".cgi",
  ".pl",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      cb(new AppError("VALIDATION", `File type ${ext} is not allowed`, 400));
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError("VALIDATION", `File type ${file.mimetype} is not allowed`, 400));
      return;
    }
    cb(null, true);
  },
});

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

router.post("/public/:token/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("VALIDATION", "No file provided", 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("file_requests")
      .select("*")
      .eq("token", req.params.token)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "File request not found or expired", 404);
    if (data.status !== "active")
      throw new AppError("GONE", "This upload link is no longer active", 410);
    if (new Date(data.expires_at) < new Date())
      throw new AppError("EXPIRED", "This upload link has expired", 410);
    if (data.upload_count >= data.max_files)
      throw new AppError("FULL", "Upload limit reached", 410);
    if (data.max_file_size_mb && req.file.size > data.max_file_size_mb * 1024 * 1024) {
      throw new AppError("VALIDATION", `File exceeds the ${data.max_file_size_mb}MB limit`, 400);
    }
    if (
      data.allowed_mime_types &&
      Array.isArray(data.allowed_mime_types) &&
      data.allowed_mime_types.length > 0 &&
      !data.allowed_mime_types.includes(req.file.mimetype)
    ) {
      throw new AppError(
        "VALIDATION",
        `File type ${req.file.mimetype} is not allowed for this request`,
        400,
      );
    }

    const safeName = req.file.originalname.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${data.storage_path}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype || undefined,
        upsert: true,
      });
    if (uploadError) {
      throw new AppError("STORAGE_ERROR", `Upload failed: ${uploadError.message}`, 500);
    }

    const { data: updated, error: updateError } = await supabase
      .from("file_requests")
      .update({ upload_count: data.upload_count + 1 })
      .eq("id", data.id)
      .select()
      .single();
    if (updateError) throw new AppError("DB_ERROR", updateError.message, 500);

    await logAuditEvent({
      organizationId: data.organization_id,
      actorUserId: data.created_by,
      action: "file_request.uploaded",
      entityType: "file_request",
      entityId: data.id,
      metadata: { fileName: safeName, sizeBytes: req.file.size },
    });

    if (data.notify_on_upload) {
      await createNotification({
        userId: data.created_by,
        organizationId: data.organization_id,
        title: "File uploaded",
        body: `A file was uploaded to "${data.title}".`,
        module: "documents",
        moduleId: data.id,
        action: "uploaded",
      });
    }

    res.json(success({ uploaded: true, fileName: safeName, uploadCount: updated.upload_count }));
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
    const supabase = getScopedClient(req, "file-requests", "read");
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let q = supabase
      .from("file_requests")
      .select("*", { count: "exact" })
      .eq("organization_id", req.query.organization_id as string);
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
    const supabase = getScopedClient(req, "file-requests", "read");
    const { data, error } = await supabase
      .from("file_requests")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
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
    const supabase = getScopedClient(req, "file-requests", "write");
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
    const supabase = getScopedClient(req, "file-requests", "write");

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;

    const { data, error } = await supabase
      .from("file_requests")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
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
    const supabase = getScopedClient(req, "file-requests", "write");
    const { error } = await supabase
      .from("file_requests")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string);
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
