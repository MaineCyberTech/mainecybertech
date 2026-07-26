import { z } from "zod";

export const listApprovalsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  requestType: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createApprovalSchema = z.object({
  organizationId: z.string().min(1),
  requestType: z.string().min(1).max(100),
  requestSubject: z.string().min(1).max(500),
  requestBody: z.string().max(10000).optional().nullable(),
  requestMetadata: z.record(z.unknown()).optional().default({}),
  sourceModule: z.string().max(100).optional().nullable(),
  sourceEntityType: z.string().max(100).optional().nullable(),
  sourceEntityId: z.string().min(1).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  assignedTo: z.string().min(1).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
});

export const updateApprovalSchema = z.object({
  requestSubject: z.string().min(1).max(500).optional(),
  requestBody: z.string().max(10000).optional().nullable(),
  requestMetadata: z.record(z.unknown()).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedTo: z.string().min(1).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional(),
});

export const approveRequestSchema = z.object({
  organizationId: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
});

export const rejectRequestSchema = z.object({
  organizationId: z.string().min(1),
  reason: z.string().min(1, "Rejection reason is required").max(5000),
});

export const cancelRequestSchema = z.object({
  organizationId: z.string().min(1),
  reason: z.string().max(5000).optional().nullable(),
});

export const addApprovalCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000),
  isInternal: z.boolean().optional().default(false),
});

export const exportApprovalsSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  requestType: z.string().optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});
