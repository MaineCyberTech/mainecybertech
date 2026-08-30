import { z } from "zod";

export const createQbrReportSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(500),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateQbrReportSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z.enum(["draft", "review", "approved", "sent"]).optional(),
  summary: z.string().max(10000).optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});
