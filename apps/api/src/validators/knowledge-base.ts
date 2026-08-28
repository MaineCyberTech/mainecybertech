import { z } from "zod";

export const listKnowledgeBaseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createKnowledgeBaseSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(500),
  body: z.string().min(1, "Body is required"),
  category: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export const updateKnowledgeBaseSchema = createKnowledgeBaseSchema
  .partial()
  .omit({ organizationId: true });
