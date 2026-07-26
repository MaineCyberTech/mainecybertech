import { z } from "zod";

export const createVendorContractSchema = z.object({
  organizationId: z.string().min(1),
  vendorName: z.string().min(1).max(500),
  serviceName: z.string().min(1).max(500),
  contractNumber: z.string().max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  contractValue: z.number().min(0).optional().nullable(),
  billingFrequency: z.string().optional().default("annual"),
  autoRenews: z.boolean().optional().default(false),
  renewalNoticeDays: z.number().int().min(1).optional().default(60),
  contractType: z.string().optional().default("software"),
  notes: z.string().max(5000).optional().nullable(),
  ownerUserId: z.string().min(1).optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
});

export const updateVendorContractSchema = createVendorContractSchema
  .partial()
  .omit({ organizationId: true });

export const createVendorContactSchema = z.object({
  organizationId: z.string().min(1),
  vendorName: z.string().min(1).max(500),
  contactName: z.string().max(500).optional().nullable(),
  roleTitle: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  supportPortalUrl: z.string().url().optional().nullable().or(z.literal("")),
  accountNumber: z.string().max(100).optional().nullable(),
  escalationPath: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
});

export const updateVendorContactSchema = createVendorContactSchema
  .partial()
  .omit({ organizationId: true });
