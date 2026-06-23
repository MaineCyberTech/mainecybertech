import { z } from "zod";

export const createTicketSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  category: z.string().max(100).optional().nullable(),
  source: z.enum(["admin", "portal", "jsm"]).default("admin"),
  externalJsmIssueKey: z.string().max(50).optional().nullable(),
  labels: z.array(z.string().max(100)).optional().nullable(),
  resolution: z.string().max(50).optional().nullable(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: z
    .enum([
      "new",
      "open",
      "triaged",
      "in_progress",
      "waiting_on_client",
      "resolved",
      "closed",
    ])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  category: z.string().max(100).optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  externalJsmIssueKey: z.string().max(50).optional().nullable(),
  labels: z.array(z.string().max(100)).optional().nullable(),
  resolution: z.string().max(50).optional().nullable(),
});

export const addTicketCommentSchema = z.object({
  organizationId: z.string().min(1),
  body: z.string().min(1, "Comment body is required").max(10000),
  isInternal: z.boolean().default(false),
});

export const updateTicketCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000),
  isInternal: z.boolean().optional(),
});

export const bulkTicketUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one ticket ID required"),
  status: z
    .enum([
      "new",
      "open",
      "triaged",
      "in_progress",
      "waiting_on_client",
      "resolved",
      "closed",
    ])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});
