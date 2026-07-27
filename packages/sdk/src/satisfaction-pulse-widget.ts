import { z } from "zod";

export const SatisfactionPulseRecordSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  subject: z.string(),
  question: z.string().nullable(),
  rating: z.number().int(),
  feedback: z.string().nullable(),
  source: z.string(),
  source_entity_id: z.string().uuid().nullable(),
  template_id: z.string().uuid().nullable(),
  status: z.string(),
  sent_at: z.string().nullable(),
  responded_at: z.string().nullable(),
  send_at: z.string().nullable(),
  scheduled_for: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string(),
  subject: z.string(),
  question: z.string().nullable(),
  default_rating: z.number().int(),
  is_active: z.boolean(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  name: z.string(),
  trigger_type: z.string(),
  trigger_config: z.record(z.unknown()),
  frequency: z.string().nullable(),
  cron_expression: z.string().nullable(),
  is_active: z.boolean(),
  last_run_at: z.string().nullable(),
  next_run_at: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SatisfactionPulseRecord = z.infer<typeof SatisfactionPulseRecordSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;

export const ListSatisfactionPulseQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  sourceEntityId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export type ListSatisfactionPulseQuery = z.infer<typeof ListSatisfactionPulseQuerySchema> & {
  page?: number;
  limit?: number;
};

export const CreateSatisfactionPulseSchema = z.object({
  organizationId: z.string().min(1),
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

export type CreateSatisfactionPulseInput = z.infer<typeof CreateSatisfactionPulseSchema>;

export const UpdateSatisfactionPulseSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  question: z.string().max(1000).optional().nullable(),
  rating: z.number().int().min(0).max(10).optional(),
  feedback: z.string().max(5000).optional().nullable(),
  status: z.string().optional(),
  source: z.string().optional(),
  sourceEntityId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  sendAt: z.string().optional().nullable(),
  scheduledFor: z.string().optional().nullable(),
  respondedAt: z.string().optional().nullable(),
});

export type UpdateSatisfactionPulseInput = z.infer<typeof UpdateSatisfactionPulseSchema>;

export const RespondSatisfactionPulseSchema = z.object({
  organizationId: z.string().min(1),
  rating: z.number().int().min(0).max(10),
  feedback: z.string().max(5000).optional().nullable(),
});

export type RespondSatisfactionPulseInput = z.infer<typeof RespondSatisfactionPulseSchema>;

export const ExportSatisfactionPulseSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

export type ExportSatisfactionPulseInput = z.infer<typeof ExportSatisfactionPulseSchema>;

export const TemplateInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  question: z.string().max(1000).optional().nullable(),
  defaultRating: z.number().int().min(0).max(10).optional().default(5),
  isActive: z.boolean().optional().default(true),
});

export type TemplateInput = z.infer<typeof TemplateInputSchema>;

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(500).optional(),
  question: z.string().max(1000).optional().nullable(),
  defaultRating: z.number().int().min(0).max(10).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

export const ScheduleInputSchema = z.object({
  organizationId: z.string().min(1),
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

export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

export const UpdateScheduleSchema = z.object({
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

export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

export const SatisfactionPulseResponseSchema = z.object({
  ok: z.boolean(),
  data: SatisfactionPulseRecordSchema.optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const SatisfactionPulseListResponseSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      items: z.array(SatisfactionPulseRecordSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    })
    .optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const TemplateResponseSchema = z.object({
  ok: z.boolean(),
  data: TemplateSchema.optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const TemplateListResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(TemplateSchema).optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const ScheduleResponseSchema = z.object({
  ok: z.boolean(),
  data: ScheduleSchema.optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const ScheduleListResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(ScheduleSchema).optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});
