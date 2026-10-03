import { z } from "zod";

/**
 * Storage fields are NOT free-form (FILE-P2-002).
 *
 * Previously `storageBucket`/`storagePath` were plain optional strings, so a
 * caller could set them to any value and the `POST /:id/signed-url` route would
 * then mint a signed URL for that arbitrary in-bucket object — a cross-tenant
 * read (or an overwrite, via PATCH). Uploads already pin the bucket server-side
 * (`DOCUMENTS_BUCKET` in routes/documents.ts); these schemas close the metadata
 * path so every route that accepts these fields is constrained at once.
 *
 * - bucket: an allowlist of exactly one. Other buckets (avatars, logos) are
 *   public and must never be addressable through the documents API.
 * - path: must match the canonical server-generated shape
 *   `orgs/<org-uuid>/<filename>` (see the upload route). This prevents pointing
 *   at `../`-style keys or another org's prefix. The org segment is checked
 *   against `organizationId` at the route level where both are known.
 */
export const DOCUMENTS_BUCKET_ONLY = "documents";
const STORAGE_PATH_RE = /^orgs\/[0-9a-fA-F-]{36}\/[^/]+$/;

const storageBucketSchema = z.literal("documents");
const storagePathSchema = z
  .string()
  .max(1024)
  .regex(STORAGE_PATH_RE, "storagePath must look like orgs/<orgId>/<fileName>");

export const createDocumentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Document name is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  visibility: z.enum(["private", "org", "internal", "public"]).default("org"),
  folderPath: z.string().max(500).optional().nullable(),
  storageBucket: storageBucketSchema.optional().nullable(),
  storagePath: storagePathSchema.optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  uploadedBy: z.string().optional().nullable(),
  currentVersion: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  visibility: z.enum(["private", "org", "internal", "public"]).optional(),
  folderPath: z.string().max(500).optional().nullable(),
  storageBucket: storageBucketSchema.optional().nullable(),
  storagePath: storagePathSchema.optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  currentVersion: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const bulkFolderSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, "Select at least one document"),
  folderPath: z.string().min(1, "Folder path is required").max(500),
});

export const bulkMetadataSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, "Select at least one document"),
  description: z.string().max(10000).optional().nullable(),
  folderPath: z.string().max(500).optional().nullable(),
  visibility: z.enum(["private", "org", "internal", "public"]).optional().nullable(),
});
