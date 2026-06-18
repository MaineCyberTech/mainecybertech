import { Router } from "express";
import multer from "multer";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew, invalidateCache } from "../middleware/cache";
import {
  createDocumentSchema,
  updateDocumentSchema,
  bulkFolderSchema,
  bulkMetadataSchema,
} from "../validators/document";
import { z } from "zod";

const createShareSchema = z.object({
  expiresAt: z.string().datetime(),
  maxAccess: z.number().int().positive().optional(),
});

const updateShareSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  maxAccess: z.number().int().positive().optional().nullable(),
  revoked: z.boolean().optional(),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});
const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", responseCacheNoRenew(30), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 25),
    );
    const offset = (page - 1) * limit;

    let query = supabase.from("documents").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const visibility = req.query.visibility as string | undefined;
    if (visibility) query = query.eq("visibility", visibility);

    const {
      data: documents,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: documents ?? [],
      total: count ?? 0,
      page,
      limit,
    };

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      throw new AppError("NOT_FOUND", "Document not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createDocumentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("documents")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        description: parsed.description ?? null,
        visibility: parsed.visibility,
        folder_path: parsed.folderPath ?? null,
        storage_bucket: parsed.storageBucket ?? null,
        storage_path: parsed.storagePath ?? null,
        mime_type: parsed.mimeType ?? null,
        file_name: parsed.fileName ?? null,
        file_size: parsed.fileSize ?? null,
        uploaded_by: parsed.uploadedBy ?? null,
        current_version: parsed.currentVersion ?? null,
        metadata: parsed.metadata ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "document.create",
      entityType: "document",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError("VALIDATION", "File is required", 400);
    }

    const organizationId = String(req.body.organizationId ?? "").trim();
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim() || null;
    const visibility = String(req.body.visibility ?? "org").trim() || "org";
    const folderPath = String(req.body.folderPath ?? "").trim() || null;

    if (!organizationId || !name) {
      throw new AppError(
        "VALIDATION",
        "Organization ID and name are required",
        400,
      );
    }

    const supabase = getSupabaseAdmin();
    const bucket = String(req.body.bucket ?? "documents").trim() || "documents";
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `orgs/${organizationId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype || undefined,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(
        "STORAGE_ERROR",
        `Upload failed: ${uploadError.message}`,
        500,
      );
    }

    const documentId = String(req.body.documentId ?? "").trim() || null;

    if (documentId) {
      const currentVersion = Number(req.body.currentVersion ?? 1);
      const { data: current, error: fetchError } = await supabase
        .from("documents")
        .select("storage_bucket, storage_path, current_version")
        .eq("id", documentId)
        .single();

      if (fetchError) {
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new AppError("NOT_FOUND", "Document not found", 404);
      }

      if (current.storage_bucket && current.storage_path) {
        await supabase.storage
          .from(current.storage_bucket)
          .remove([current.storage_path]);
      }

      const nextVersion = currentVersion + 1;

      const { data, error: updateError } = await supabase
        .from("documents")
        .update({
          storage_bucket: bucket,
          storage_path: storagePath,
          mime_type: file.mimetype || null,
          file_name: file.originalname || null,
          file_size: file.size,
          current_version: nextVersion,
        })
        .eq("id", documentId)
        .select()
        .single();

      if (updateError) {
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new AppError("DB_ERROR", updateError.message, 500);
      }

      await supabase.from("document_versions").insert({
        document_id: data.id,
        version_number: nextVersion,
        storage_path: storagePath,
        uploaded_by: req.authUser!.userId,
      });

      await logAuditEvent({
        organizationId,
        actorUserId: req.authUser!.userId,
        action: "document.update",
        entityType: "document",
        entityId: data.id,
        metadata: { name, action: "file_replaced" },
      });

      res.json(success(data));
    } else {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          organization_id: organizationId,
          name,
          description,
          visibility,
          folder_path: folderPath,
          storage_bucket: bucket,
          storage_path: storagePath,
          mime_type: file.mimetype || null,
          file_name: file.originalname || null,
          file_size: file.size,
          uploaded_by: req.authUser!.userId,
          current_version: 1,
          metadata: {},
        })
        .select()
        .single();

      if (error) {
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new AppError("DB_ERROR", error.message, 500);
      }

      await supabase.from("document_versions").insert({
        document_id: data.id,
        version_number: 1,
        storage_path: storagePath,
        uploaded_by: req.authUser!.userId,
      });

      await logAuditEvent({
        organizationId,
        actorUserId: req.authUser!.userId,
        action: "document.create",
        entityType: "document",
        entityId: data.id,
        metadata: { name },
      });

      res.status(201).json(success(data));
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateDocumentSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined)
      updateData.description = parsed.description;
    if (parsed.visibility !== undefined)
      updateData.visibility = parsed.visibility;
    if (parsed.folderPath !== undefined)
      updateData.folder_path = parsed.folderPath;
    if (parsed.storageBucket !== undefined)
      updateData.storage_bucket = parsed.storageBucket;
    if (parsed.storagePath !== undefined)
      updateData.storage_path = parsed.storagePath;
    if (parsed.mimeType !== undefined) updateData.mime_type = parsed.mimeType;
    if (parsed.fileName !== undefined) updateData.file_name = parsed.fileName;
    if (parsed.fileSize !== undefined) updateData.file_size = parsed.fileSize;
    if (parsed.currentVersion !== undefined)
      updateData.current_version = parsed.currentVersion;
    if (parsed.metadata !== undefined) updateData.metadata = parsed.metadata;

    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Document not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.update",
      entityType: "document",
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
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("storage_bucket, storage_path")
      .eq("id", req.params.id)
      .single();

    if (fetchError) throw new AppError("NOT_FOUND", "Document not found", 404);

    if (doc.storage_bucket && doc.storage_path) {
      await supabase.storage
        .from(doc.storage_bucket)
        .remove([doc.storage_path]);
    }

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.delete",
      entityType: "document",
      entityId: String(req.params.id),
      metadata: { name: doc.storage_path },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/signed-url", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("storage_bucket, storage_path")
      .eq("id", req.params.id)
      .single();

    if (docError || !doc)
      throw new AppError("NOT_FOUND", "Document not found", 404);
    if (!doc.storage_bucket || !doc.storage_path)
      throw new AppError(
        "BAD_REQUEST",
        "Document has no storage reference",
        400,
      );

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 3600);

    if (urlError || !signedUrl)
      throw new AppError("STORAGE_ERROR", "Failed to create signed URL", 500);

    res.json(success({ signedUrl: signedUrl.signedUrl }));
  } catch (error) {
    next(error);
  }
});

router.post("/bulk/folder", async (req, res, next) => {
  try {
    const parsed = bulkFolderSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("documents")
      .update({ folder_path: parsed.folderPath })
      .in("id", parsed.documentIds);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.bulk_folder",
      entityType: "document",
      metadata: {
        documentIds: parsed.documentIds,
        folderPath: parsed.folderPath,
      },
    });

    res.json(success({ updated: parsed.documentIds.length }));
  } catch (error) {
    next(error);
  }
});

router.post("/bulk/metadata", async (req, res, next) => {
  try {
    const parsed = bulkMetadataSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.description !== undefined)
      updateData.description = parsed.description;
    if (parsed.folderPath !== undefined)
      updateData.folder_path = parsed.folderPath;
    if (parsed.visibility !== undefined)
      updateData.visibility = parsed.visibility;

    if (Object.keys(updateData).length === 0) {
      throw new AppError("VALIDATION", "No fields to update", 400);
    }

    const { error } = await supabase
      .from("documents")
      .update(updateData)
      .in("id", parsed.documentIds);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.bulk_metadata",
      entityType: "document",
      metadata: {
        documentIds: parsed.documentIds,
        fields: Object.keys(updateData),
      },
    });

    res.json(success({ updated: parsed.documentIds.length }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/versions", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("document_versions")
      .select("*", { count: "exact" })
      .eq("document_id", req.params.id)
      .order("version_number", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/versions/:versionId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("id", req.params.versionId)
      .eq("document_id", req.params.id)
      .single();

    if (error || !data)
      throw new AppError("NOT_FOUND", "Version not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/shares", async (req, res, next) => {
  try {
    const parsed = createShareSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, organization_id, storage_bucket, storage_path")
      .eq("id", req.params.id)
      .single();

    if (docError || !doc)
      throw new AppError("NOT_FOUND", "Document not found", 404);

    const hasAccess = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", req.authUser!.userId)
      .eq("organization_id", doc.organization_id)
      .eq("status", "approved")
      .maybeSingle()
      .then(({ data }) => !!data);

    if (!hasAccess)
      throw new AppError("FORBIDDEN", "Not authorized for this document", 403);

    const token = crypto.randomUUID();
    const { data: share, error } = await supabase
      .from("document_shares")
      .insert({
        document_id: doc.id,
        organization_id: doc.organization_id,
        created_by: req.authUser!.userId,
        token,
        expires_at: parsed.expiresAt,
        max_access: parsed.maxAccess ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.share.create",
      entityType: "document",
      entityId: doc.id,
      metadata: { shareId: share.id, expiresAt: parsed.expiresAt },
    });

    const baseUrl = process.env.APP_BASE_URL ?? "";
    const shareUrl = `${baseUrl}/api/v1/documents/shares/${token}`;

    res.json(success({ ...share, shareUrl }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/shares", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, organization_id")
      .eq("id", req.params.id)
      .single();

    if (docError || !doc)
      throw new AppError("NOT_FOUND", "Document not found", 404);

    const hasAccess = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", req.authUser!.userId)
      .eq("organization_id", doc.organization_id)
      .eq("status", "approved")
      .maybeSingle()
      .then(({ data }) => !!data);

    if (!hasAccess)
      throw new AppError("FORBIDDEN", "Not authorized for this document", 403);

    const { data, error } = await supabase
      .from("document_shares")
      .select("*")
      .eq("document_id", doc.id)
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/shares/:shareId", async (req, res, next) => {
  try {
    const parsed = updateShareSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: share, error: shareError } = await supabase
      .from("document_shares")
      .select("id, document_id, organization_id")
      .eq("id", req.params.shareId)
      .single();

    if (shareError || !share)
      throw new AppError("NOT_FOUND", "Share not found", 404);

    const hasAccess = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", req.authUser!.userId)
      .eq("organization_id", share.organization_id)
      .eq("status", "approved")
      .maybeSingle()
      .then(({ data }) => !!data);

    if (!hasAccess) throw new AppError("FORBIDDEN", "Not authorized", 403);

    const updateData: Record<string, unknown> = {};
    if (parsed.expiresAt !== undefined)
      updateData.expires_at = parsed.expiresAt;
    if (parsed.maxAccess !== undefined)
      updateData.max_access = parsed.maxAccess;
    if (parsed.revoked) updateData.revoked_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      throw new AppError("VALIDATION", "No fields to update", 400);
    }

    const { error } = await supabase
      .from("document_shares")
      .update(updateData)
      .eq("id", req.params.shareId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.share.update",
      entityType: "document",
      entityId: share.document_id,
      metadata: {
        shareId: req.params.shareId,
        changes: Object.keys(updateData),
      },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/shares/:shareId", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: share, error: shareError } = await supabase
      .from("document_shares")
      .select("id, document_id, organization_id")
      .eq("id", req.params.shareId)
      .single();

    if (shareError || !share)
      throw new AppError("NOT_FOUND", "Share not found", 404);

    const hasAccess = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", req.authUser!.userId)
      .eq("organization_id", share.organization_id)
      .eq("status", "approved")
      .maybeSingle()
      .then(({ data }) => !!data);

    if (!hasAccess) throw new AppError("FORBIDDEN", "Not authorized", 403);

    const { error } = await supabase
      .from("document_shares")
      .delete()
      .eq("id", req.params.shareId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "document.share.delete",
      entityType: "document",
      entityId: share.document_id,
      metadata: { shareId: req.params.shareId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
