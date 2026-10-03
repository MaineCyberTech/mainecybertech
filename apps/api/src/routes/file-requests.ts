import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { createFileRequestSchema, updateFileRequestSchema } from "../validators/file-requests";
import { createNotification } from "../lib/notify";
import { queryInt } from "../lib/query";
import { validateUploadContent } from "../lib/upload-validation";

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
  limits: { fileSize: 25 * 1024 * 1024 },
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
      .eq("token", String(req.params.token))
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "File request not found or expired", 404);
    if (data.status !== "active")
      throw new AppError("GONE", "This upload link is no longer active", 410);
    if (new Date(data.expires_at) < new Date())
      throw new AppError("EXPIRED", "This upload link has expired", 410);
    if (data.max_files != null && data.upload_count >= data.max_files)
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

router.post(
  "/public/:token/upload",
  // Authorization for this endpoint is the token itself, NOT a user
  // permission. `requirePermission("file-requests","create")` resolves with
  // orgId=null and unions grants across every org, so a user granted it in
  // org A could write into org B's request folder, while anonymous uploaders
  // (the intended callers) got a 401. The token row is bound to one org via
  // `data.organization_id` and every write below is derived from it. (FILE-P1-001 / MT-P1-003)
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError("VALIDATION", "No file provided", 400);

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("file_requests")
        .select("*")
        .eq("token", String(req.params.token))
        .single();
      if (error || !data) throw new AppError("NOT_FOUND", "File request not found or expired", 404);
      if (data.status !== "active")
        throw new AppError("GONE", "This upload link is no longer active", 410);
      if (new Date(data.expires_at) < new Date())
        throw new AppError("EXPIRED", "This upload link has expired", 410);
      if (data.max_files != null && data.upload_count >= data.max_files)
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
      // The object path MUST begin with the owning org's UUID so the
      // `storage_path_org_id` RLS helper (5302026) can derive the tenant and
      // orphan cleanup can reconcile the row. `data.storage_path` from the
      // request row is authoritative — never caller-supplied. (FILE-P1-002)
      const storagePath = `${data.organization_id}/requests/${data.token}/${Date.now()}-${safeName}`;
      // Byte-sniff the content: declared MIME is untrusted (markup/SVG rejected,
      // images and PDFs must match their declared type).
      validateUploadContent(req.file.buffer, req.file.mimetype);
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype || undefined,
          upsert: false,
        });
      if (uploadError) {
        throw new AppError("STORAGE_ERROR", `Upload failed: ${uploadError.message}`, 500);
      }

      // Atomically claim a slot BEFORE persisting anything.
      //
      // The previous form used `.update({ upload_count: data.upload_count + 1 })`,
      // where data.upload_count came from an earlier SELECT. The +1 was computed
      // in JS, so the write was an absolute stale value: concurrent anonymous
      // uploads each read the same low counter and every UPDATE satisfied
      // `upload_count < max_files`, letting the limit be exceeded without bound
      // (reproduced against PostgreSQL: five claims all "succeeded", counter
      // reached 1).
      //
      // claim_file_request_slot does the increment server-side inside one
      // guarded statement, so it re-reads the row and returns no row when the
      // request is full, closed, expired, or not in this org. Claiming first
      // means a rejected upload never leaves a DB row or an object behind.
      const { data: claimRows, error: updateError } = await supabase.rpc(
        "claim_file_request_slot",
        // `as never`: the generated Database type declares
        // `Functions: Record<string, never>`, so RPC args are untyped here.
        // Same convention as routes/edu-automation.ts.
        { p_request_id: data.id, p_organization_id: data.organization_id } as never,
      );
      if (updateError) {
        await supabase.storage.from("documents").remove([storagePath]);
        throw new AppError("DB_ERROR", updateError.message, 500);
      }
      // Returns at most one row: { upload_count, slot_token }. No row means the
      // request is full, closed, expired, or belongs to another org.
      const claimRow = Array.isArray(claimRows)
        ? (claimRows[0] as { upload_count: number; slot_token: string } | undefined)
        : (claimRows as { upload_count: number; slot_token: string } | null);
      if (!claimRow || claimRow.upload_count == null) {
        // Release the object we already uploaded and persist nothing.
        await supabase.storage.from("documents").remove([storagePath]);
        throw new AppError("FULL", "Upload limit reached or request no longer open", 410);
      }
      const claimed = claimRow.upload_count;
      const slotToken = claimRow.slot_token;

      // Persist the object so it can be listed/downloaded and so orphan cleanup
      // recognises it as referenced rather than deleting it as an orphan.
      const { error: rowError } = await supabase.from("file_request_uploads").insert({
        file_request_id: data.id,
        organization_id: data.organization_id,
        file_name: safeName,
        storage_bucket: "documents",
        storage_path: storagePath,
        mime_type: req.file.mimetype || null,
        file_size: req.file.size,
      });
      if (rowError) {
        // Roll both back so a failure cannot leave an untracked object or a
        // consumed slot with no upload behind it.
        //
        // The release MUST be a relative decrement, not an absolute
        // `claimed - 1`. `claimed` was read before other concurrent uploads may
        // have incremented the counter, so writing an absolute value
        // under-counts and re-opens the very limit bypass this claim exists to
        // close. Reproduced against PostgreSQL 16: with max_files=3, two claims
        // (1, 2) then an absolute rollback to `1-1=0` let three more uploads
        // succeed - five accepted uploads with a limit of three.
        await supabase.storage.from("documents").remove([storagePath]);
        await supabase.rpc("release_file_request_slot", {
          p_request_id: data.id,
          p_organization_id: data.organization_id,
          p_slot_token: slotToken,
        } as never);
        throw new AppError("DB_ERROR", rowError.message, 500);
      }

      // The slot token has done its job once the upload row is committed: the
      // slot is permanent and no release can legitimately follow. Drop it so
      // `slot_tokens` does not accumulate one key per successful upload for the
      // lifetime of the request (best-effort: the upload has already succeeded,
      // so a cleanup failure must not fail the request).
      void supabase
        .rpc("release_slot_token", {
          p_request_id: data.id,
          p_organization_id: data.organization_id,
          p_slot_token: slotToken,
        } as never)
        .then(
          () => undefined,
          () => undefined,
        );

      await logAuditEvent({
        organizationId: data.organization_id,
        actorUserId: data.created_by,
        action: "file_request.uploaded",
        entityType: "file_request",
        entityId: data.id,
        metadata: { fileName: safeName, sizeBytes: req.file.size },
      });

      if (data.notify_on_upload && data.created_by) {
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

      res.json(success({ uploaded: true, fileName: safeName, uploadCount: claimed }));
    } catch (error) {
      next(error);
    }
  },
);

router.use(requireAuth);
router.use(requireOrgAccess);

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.get("/", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "file-requests", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 25)));
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
      .eq("id", String(req.params.id))
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "File request not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

// --- Org-scoped access to uploaded files (FILE-P1-002) -----------------------
// Objects land in the same private `documents` bucket as other documents. An
// approved member of the owning org can list them and mint a short-lived signed
// URL; the path is always read from the `file_request_uploads` row so the
// caller can never target an arbitrary object.

router.get("/:id/uploads", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "file-requests", "read");
    const { data: request, error: requestError } = await supabase
      .from("file_requests")
      .select("id")
      .eq("id", String(req.params.id))
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (requestError || !request) throw new AppError("NOT_FOUND", "File request not found", 404);

    const { data, error } = await supabase
      .from("file_request_uploads")
      .select("id, file_name, mime_type, file_size, uploaded_at")
      .eq("file_request_id", request.id)
      .eq("organization_id", req.query.organization_id as string)
      .order("uploaded_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/uploads/:uploadId/signed-url", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "file-requests", "read");
    const orgId = req.query.organization_id as string;

    // Verify the parent request AND the upload row belong to the caller's org
    // before signing the stored path.
    const { data: request, error: requestError } = await supabase
      .from("file_requests")
      .select("id")
      .eq("id", String(req.params.id))
      .eq("organization_id", orgId)
      .single();
    if (requestError || !request) throw new AppError("NOT_FOUND", "File request not found", 404);

    const { data: upload, error: uploadError } = await supabase
      .from("file_request_uploads")
      .select("storage_bucket, storage_path")
      .eq("id", String(req.params.uploadId))
      .eq("file_request_id", request.id)
      .eq("organization_id", orgId)
      .single();
    if (uploadError || !upload) throw new AppError("NOT_FOUND", "Upload not found", 404);

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(upload.storage_bucket)
      .createSignedUrl(upload.storage_path, 3600);
    if (urlError || !signedUrl)
      throw new AppError("STORAGE_ERROR", "Failed to create signed URL", 500);

    res.json(success({ signedUrl: signedUrl.signedUrl, expiresIn: 3600 }));
  } catch (error) {
    next(error);
  }
});

router.post("/", requirePermission("file-requests", "create"), async (req, res, next) => {
  try {
    const parsed = createFileRequestSchema.parse(req.body);
    const supabase = getScopedClient(req, "file-requests", "write");
    const token = generateToken();
    const expiresAt = new Date(Date.now() + parsed.expiresInDays * 86400000).toISOString();
    // Org-parseable prefix: the raw org UUID must lead so `storage_path_org_id`
    // derives the tenant. Kept as the request's canonical folder; individual
    // uploads are `<storage_path>/<ts>-<name>` with the org UUID still leading.
    const storagePath = `${parsed.organizationId}/requests/${token}`;

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
      // Explicit projection: `slot_tokens` is an internal single-use release
      // credential and must never be returned to a client.
      .select(
        "id, organization_id, title, description, token, storage_path, max_file_size_mb, allowed_mime_types, max_files, upload_count, expires_at, status, visibility, notify_on_upload, created_by, created_at, updated_at",
      )
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

router.patch("/:id", requirePermission("file-requests", "edit"), async (req, res, next) => {
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
      .update(updateData as never)
      .eq("id", String(req.params.id))
      .eq("organization_id", req.query.organization_id as string)
      // Explicit projection: never return `slot_tokens` (internal release token).
      .select(
        "id, organization_id, title, description, token, storage_path, max_file_size_mb, allowed_mime_types, max_files, upload_count, expires_at, status, visibility, notify_on_upload, created_by, created_at, updated_at",
      )
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

router.delete("/:id", requirePermission("file-requests", "delete"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "file-requests", "write");
    const { error } = await supabase
      .from("file_requests")
      .delete()
      .eq("id", String(req.params.id))
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
