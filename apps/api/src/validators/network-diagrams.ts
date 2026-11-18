import { z } from "zod";
import { partialUpdateSchema } from "../lib/validators";

export const listNetworkDiagramsQuerySchema = z.object({
  organizationId: z.guid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createNetworkDiagramSchema = z.object({
  organizationId: z.guid(),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  diagram: z
    .record(z.string(), z.unknown())
    .optional()
    .default({ nodes: [], edges: [] } as Record<string, unknown>),
});

export const updateNetworkDiagramSchema = partialUpdateSchema(createNetworkDiagramSchema).omit({
  organizationId: true,
});
