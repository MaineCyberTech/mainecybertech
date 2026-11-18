import { z } from "zod";
import { partialUpdateSchema } from "../lib/validators";

export const listProposalsQuerySchema = z.object({
  organizationId: z.guid().optional(),
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createProposalSchema = z.object({
  organizationId: z.guid(),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  validUntil: z.string().optional().nullable(),
  ownerUserId: z.guid().optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  phases: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().max(10000).optional().nullable(),
        assumptions: z.string().max(10000).optional().nullable(),
        notes: z.string().max(10000).optional().nullable(),
        sortOrder: z.number().int().optional().default(0),
        items: z
          .array(
            z.object({
              itemType: z.enum(["labor", "materials", "recurring", "one_time"]).default("labor"),
              name: z.string().min(1).max(500),
              description: z.string().max(10000).optional().nullable(),
              quantity: z.number().positive().optional().default(1),
              unitPrice: z.number().min(0).optional().default(0),
              totalPrice: z.number().min(0).optional().default(0),
              isOptional: z.boolean().optional().default(false),
              isRecurring: z.boolean().optional().default(false),
              recurringInterval: z.string().optional().default("monthly"),
              notes: z.string().max(5000).optional().nullable(),
              sortOrder: z.number().int().optional().default(0),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .optional()
    .default([]),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]).optional(),
  validUntil: z.string().optional().nullable(),
  ownerUserId: z.guid().optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createPhaseSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  assumptions: z.string().max(10000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

export const updatePhaseSchema = partialUpdateSchema(createPhaseSchema);

export const createLineItemSchema = z.object({
  phaseId: z.guid().optional().nullable(),
  itemType: z.enum(["labor", "materials", "recurring", "one_time"]).default("labor"),
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  quantity: z.number().positive().optional().default(1),
  unitPrice: z.number().min(0).optional().default(0),
  totalPrice: z.number().min(0).optional().default(0),
  isOptional: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.string().optional().default("monthly"),
  notes: z.string().max(5000).optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

export const updateLineItemSchema = partialUpdateSchema(createLineItemSchema);

export const submitForApprovalSchema = z.object({
  organizationId: z.guid(),
});

export const clientProposalDecisionSchema = z.object({
  organizationId: z.guid(),
  decision: z.enum(["accepted", "declined"]),
  notes: z.string().max(5000).optional().nullable(),
});

export const publishProposalSchema = z.object({
  organizationId: z.guid(),
  validityDays: z.number().int().positive().optional().default(30),
});
