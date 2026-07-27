import { z } from "zod";

export const DynamicFormFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean(),
  placeholder: z.string().nullable(),
  options: z.array(z.string()),
  helpText: z.string().nullable(),
  validation: z.record(z.unknown()),
  sortOrder: z.number(),
});

export const DynamicFormRecordSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  form_type: z.string(),
  status: z.string(),
  fields: z.array(DynamicFormFieldSchema),
  settings: z.record(z.unknown()),
  published_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const FormSubmissionSchema = z.object({
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  respondent_id: z.string().uuid().nullable(),
  respondent_email: z.string().nullable(),
  answers: z.record(z.unknown()),
  status: z.string(),
  submitted_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DynamicFormRecord = z.infer<typeof DynamicFormRecordSchema>;
export type DynamicFormField = z.infer<typeof DynamicFormFieldSchema>;
export type FormSubmission = z.infer<typeof FormSubmissionSchema>;

export const ListDynamicFormsQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.string().optional(),
  formType: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export type ListDynamicFormsQuery = z.infer<typeof ListDynamicFormsQuerySchema> & {
  page?: number;
  limit?: number;
};

export const CreateDynamicFormSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  formType: z.string().optional().default("intake"),
  fields: z.array(DynamicFormFieldSchema).optional().default([]),
  settings: z.record(z.unknown()).optional().default({}),
  closesAt: z.string().optional().nullable(),
});

export type CreateDynamicFormInput = z.infer<typeof CreateDynamicFormSchema>;

export const UpdateDynamicFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  formType: z.string().optional(),
  status: z.string().optional(),
  fields: z.array(DynamicFormFieldSchema).optional(),
  settings: z.record(z.unknown()).optional(),
  closesAt: z.string().optional().nullable(),
});

export type UpdateDynamicFormInput = z.infer<typeof UpdateDynamicFormSchema>;

export const SubmitDynamicFormSchema = z.object({
  respondentEmail: z.string().email().optional().nullable(),
  answers: z.record(z.unknown()),
});

export type SubmitDynamicFormInput = z.infer<typeof SubmitDynamicFormSchema>;

export const ExportDynamicFormsSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  formType: z.string().optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

export type ExportDynamicFormsInput = z.infer<typeof ExportDynamicFormsSchema>;
