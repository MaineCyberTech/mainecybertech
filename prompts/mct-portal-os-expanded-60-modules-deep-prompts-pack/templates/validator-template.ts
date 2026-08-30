import { z } from "zod";
export const listQuerySchema = z.object({
  organizationId: z.string().uuid(),
  status: z.string().optional(),
  search: z.string().optional(),
});
export const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});
export const updateSchema = createSchema.partial().omit({ organizationId: true });
