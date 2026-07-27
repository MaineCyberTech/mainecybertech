import { z } from "zod";

export const listDynamicFormsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  formType: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const formFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "email",
    "phone",
    "select",
    "multiselect",
    "checkbox",
    "radio",
    "date",
    "file",
  ]),
  required: z.boolean().optional().default(false),
  placeholder: z.string().max(255).optional().nullable(),
  options: z.array(z.string()).optional().default([]),
  helpText: z.string().max(500).optional().nullable(),
  validation: z.record(z.unknown()).optional().default({}),
  sortOrder: z.number().int().optional().default(0),
});

export const createDynamicFormSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  formType: z.string().optional().default("intake"),
  fields: z.array(formFieldSchema).optional().default([]),
  settings: z.record(z.unknown()).optional().default({}),
  closesAt: z.string().optional().nullable(),
});

export const updateDynamicFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  formType: z.string().optional(),
  status: z.string().optional(),
  fields: z.array(formFieldSchema).optional(),
  settings: z.record(z.unknown()).optional(),
  closesAt: z.string().optional().nullable(),
});

export const publishDynamicFormSchema = z.object({
  closesAt: z.string().optional().nullable(),
});

export const submitDynamicFormSchema = z.object({
  formId: z.string().uuid(),
  respondentEmail: z.string().email().optional().nullable(),
  answers: z.record(z.unknown()),
});

export const exportDynamicFormsSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  formType: z.string().optional(),
  format: z.string().optional().default("csv"),
});
