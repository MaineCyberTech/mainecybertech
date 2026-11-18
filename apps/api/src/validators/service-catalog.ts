import { z } from "zod";
import { partialUpdateSchema } from "../lib/validators";

export const createServiceSchema = z.object({
  organizationId: z.guid(),
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().default("managed_services"),
  billingModel: z.string().default("monthly"),
  unit: z.string().default("per_user"),
  basePrice: z.number().min(0).default(0),
  includedUnits: z.number().int().min(0).optional().nullable(),
  overtureRate: z.number().min(0).optional().nullable(),
  isBundled: z.boolean().optional().default(false),
  bundleId: z.guid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
});

export const updateServiceSchema = partialUpdateSchema(createServiceSchema).omit({
  organizationId: true,
});
