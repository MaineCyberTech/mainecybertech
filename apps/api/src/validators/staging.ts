import { z } from "zod";

export const listStagingQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createStagingSchema = z.object({
  organizationId: z.string().uuid(),
  deviceName: z.string().min(1, "Device name is required").max(500),
  assetTag: z.string().max(200).optional().nullable(),
  status: z.string().min(1).default("pending"),
  checklist: z.array(z.unknown()).optional().default([]),
  assignedTo: z.string().uuid().optional().nullable(),
});

export const updateStagingSchema = createStagingSchema.partial().omit({ organizationId: true });
