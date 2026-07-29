import { z } from "zod";

export const listSatisfactionPulseQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.enum(["pending", "sent", "responded", "expired", "cancelled"]).optional(),
  source: z.string().optional(),
  sourceEntityId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createSatisfactionPulseSchema = z.object({
  organizationId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  question: z.string().max(1000).optional().nullable(),
  rating: z.number().int().min(0).max(10).optional().default(5),
  feedback: z.string().max(5000).optional().nullable(),
  source: z.string().optional().default("ticket"),
  sourceEntityId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  sendAt: z.string().optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
});

export const updateSatisfactionPulseSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  question: z.string().max(1000).optional().nullable(),
  rating: z.number().int().min(0).max(10).optional(),
  feedback: z.string().max(5000).optional().nullable(),
  status: z.enum(["pending", "sent", "responded", "expired", "cancelled"]).optional(),
  source: z.string().optional(),
  sourceEntityId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  sendAt: z.string().optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
  respondedAt: z.string().optional().nullable(),
});

export const respondSatisfactionPulseSchema = z.object({
  organizationId: z.string().uuid(),
  rating: z.number().int().min(0).max(10),
  feedback: z.string().max(5000).optional().nullable(),
});

export const exportSatisfactionPulseSchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.enum(["pending", "sent", "responded", "expired", "cancelled"]).optional(),
  source: z.string().optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

export const templateSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  question: z.string().max(1000).optional().nullable(),
  defaultRating: z.number().int().min(0).max(10).optional().default(5),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(500).optional(),
  question: z.string().max(1000).optional().nullable(),
  defaultRating: z.number().int().min(0).max(10).optional(),
  isActive: z.boolean().optional(),
});

export const scheduleSchema = z.object({
  organizationId: z.string().uuid(),
  templateId: z.string().optional().nullable(),
  name: z.string().min(1).max(255),
  triggerType: z
    .enum([
      "ticket_closed",
      "project_completed",
      "onboarding_complete",
      "qbr",
      "scheduled",
      "manual",
    ])
    .optional()
    .default("ticket_closed"),
  triggerConfig: z.record(z.unknown()).optional().default({}),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly"]).optional().nullable(),
  cronExpression: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateScheduleSchema = z.object({
  templateId: z.string().optional().nullable(),
  name: z.string().min(1).max(255).optional(),
  triggerType: z
    .enum([
      "ticket_closed",
      "project_completed",
      "onboarding_complete",
      "qbr",
      "scheduled",
      "manual",
    ])
    .optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly"]).optional().nullable(),
  cronExpression: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
