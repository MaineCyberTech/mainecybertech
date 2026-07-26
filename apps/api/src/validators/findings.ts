import { z } from "zod";

export const listFindingsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.enum(["open", "in_progress", "resolved", "verified", "closed", "wont_fix"]).optional(),
  severity: z.enum(["p0", "p1", "p2", "p3"]).optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createFindingSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  severity: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
  source: z.string().default("security"),
  findingCategory: z.string().max(200).optional().nullable(),
  remediationPlan: z.string().max(10000).optional().nullable(),
  remediationDeadline: z.string().optional().nullable(),
  verificationSteps: z.string().max(10000).optional().nullable(),
  affectedSystems: z.string().max(2000).optional().nullable(),
  controlsImpacted: z.string().max(2000).optional().nullable(),
  assignedTo: z.string().min(1).optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateFindingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  severity: z.enum(["p0", "p1", "p2", "p3"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "verified", "closed", "wont_fix"]).optional(),
  source: z.string().optional(),
  findingCategory: z.string().max(200).optional().nullable(),
  remediationPlan: z.string().max(10000).optional().nullable(),
  remediationDeadline: z.string().optional().nullable(),
  verificationSteps: z.string().max(10000).optional().nullable(),
  affectedSystems: z.string().max(2000).optional().nullable(),
  controlsImpacted: z.string().max(2000).optional().nullable(),
  assignedTo: z.string().min(1).optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyFindingSchema = z.object({
  organizationId: z.string().min(1),
});

export const resolveFindingSchema = z.object({
  organizationId: z.string().min(1),
  resolutionNotes: z.string().max(10000).optional().nullable(),
});
