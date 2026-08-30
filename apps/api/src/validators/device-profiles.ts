import { z } from "zod";

export const listDeviceProfilesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createDeviceProfileSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(500),
  type: z.string().max(200).optional().nullable(),
  manufacturer: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  specs: z.record(z.unknown()).optional().default({}),
});

export const updateDeviceProfileSchema = createDeviceProfileSchema.partial().omit({ organizationId: true });
