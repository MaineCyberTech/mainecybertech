import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  primaryDomain: z.string().max(255).optional().nullable(),
  supportPlan: z.string().max(100).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  primaryDomain: z.string().max(255).optional().nullable(),
  supportPlan: z.string().max(100).optional().nullable(),
  logoUrl: z.string().max(1000).optional().nullable(),
  brandColor: z.string().max(7).optional().nullable(),
  accentColor: z.string().max(7).optional().nullable(),
  customDomain: z.string().max(255).optional().nullable(),
});

export const createDomainSchema = z.object({
  domain: z.string().min(1).max(255),
  autoApprove: z.boolean().default(false),
});

export const updateDomainSchema = z.object({
  autoApprove: z.boolean(),
});
