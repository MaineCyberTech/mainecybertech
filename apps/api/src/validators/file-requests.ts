import { z } from "zod";

export const createFileRequestSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  maxFileSizeMb: z.number().int().min(1).max(1024).optional().default(50),
  allowedMimeTypes: z.array(z.string()).optional().nullable(),
  maxFiles: z.number().int().min(1).max(100).optional().default(1),
  expiresInDays: z.number().int().min(1).max(90).optional().default(7),
  notifyOnUpload: z.boolean().optional().default(true),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
});

export const updateFileRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["active", "completed", "expired", "revoked"]).optional(),
  visibility: z.enum(["internal", "client_visible"]).optional(),
});
