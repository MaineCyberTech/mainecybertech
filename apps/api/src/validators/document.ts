import { z } from "zod";

export const createDocumentSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1, "Document name is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  visibility: z.enum(["private", "org", "internal", "public"]).default("org"),
  folderPath: z.string().max(500).optional().nullable(),
  storageBucket: z.string().optional().nullable(),
  storagePath: z.string().optional().nullable(),
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
  storageBucket: z.string().optional().nullable(),
  storagePath: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  currentVersion: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const bulkFolderSchema = z.object({
  documentIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one document"),
  folderPath: z.string().min(1, "Folder path is required").max(500),
});

export const bulkMetadataSchema = z.object({
  documentIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one document"),
  description: z.string().max(10000).optional().nullable(),
  folderPath: z.string().max(500).optional().nullable(),
  visibility: z
    .enum(["private", "org", "internal", "public"])
    .optional()
    .nullable(),
});
