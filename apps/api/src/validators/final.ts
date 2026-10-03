import { z } from "zod";
export const sp = z.object({
  organizationId: z.string().uuid(),
  siteName: z.string().min(1).max(500),
  teamName: z.string().max(500).optional().nullable(),
  structureType: z.string().default("team_site"),
  owner: z.string().max(500).optional().nullable(),
  sensitivityLabel: z.string().max(200).optional().nullable(),
  externalSharing: z.string().default("disabled"),
  notes: z.string().max(5000).optional().nullable(),
});
export const dp = z.object({
  organizationId: z.string().uuid(),
  profileName: z.string().min(1).max(500),
  deviceType: z.string().max(200).optional().nullable(),
  os: z.string().max(200).optional().nullable(),
  settings: z.record(z.unknown()).default({}),
  description: z.string().max(5000).optional().nullable(),
});
export const saas = z.object({
  organizationId: z.string().uuid(),
  vendorName: z.string().min(1).max(500),
  serviceName: z.string().min(1).max(500),
  monthlyCost: z.number().min(0).optional().nullable(),
  annualCost: z.number().min(0).optional().nullable(),
  paymentMethod: z.string().max(200).optional().nullable(),
  classification: z.string().default("unknown"),
  usageFrequency: z.string().max(200).optional().nullable(),
  cancellationRisk: z.string().max(200).optional().nullable(),
  hasDataAccess: z.boolean().default(false),
  renewalDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export const quote = z.object({
  organizationId: z.string().uuid(),
  vendorName: z.string().min(1).max(500),
  product: z.string().min(1).max(500),
  quoteAmount: z.number().min(0).optional().nullable(),
  competitorQuote: z.number().min(0).optional().nullable(),
  comparisonNotes: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export const dns = z.object({
  organizationId: z.string().uuid(),
  domain: z.string().min(1).max(253),
  changeType: z.string().min(1).max(200),
  changeDescription: z.string().max(5000).optional().nullable(),
  proposedValue: z.string().max(2000).optional().nullable(),
  currentValue: z.string().max(2000).optional().nullable(),
});
export const pulse = z.object({
  organizationId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  question: z.string().max(1000).optional().nullable(),
  rating: z.number().int().min(0).max(10).default(5),
  feedback: z.string().max(5000).optional().nullable(),
  source: z.string().default("ticket"),
  sourceEntityId: z.string().uuid().optional().nullable(),
});
export const time = z.object({
  organizationId: z.string().uuid(),
  description: z.string().min(1).max(5000),
  hours: z.number().min(0).default(0),
  billable: z.boolean().default(true),
  workDate: z.string().optional().nullable(),
  ticketId: z.string().uuid().optional().nullable(),
});
export const budget = z.object({
  organizationId: z.string().uuid(),
  itemName: z.string().min(1).max(500),
  category: z.string().default("hardware"),
  estimatedCost: z.number().min(0).optional().nullable(),
  fiscalYear: z.number().int().optional().nullable(),
  quarter: z.number().int().min(1).max(4).optional().nullable(),
  priority: z.string().default("medium"),
  notes: z.string().max(5000).optional().nullable(),
});
export const runbook = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().max(50000).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  version: z.string().default("1.0"),
});
export const form = z.object({
  organizationId: z.string().uuid(),
  formName: z.string().min(1).max(500),
  formDescription: z.string().max(5000).optional().nullable(),
  formFields: z.array(z.unknown()).default([]),
  isActive: z.boolean().default(true),
});

export const backup = z.object({
  organizationId: z.string().uuid(),
  systemName: z.string().min(1).max(500),
  backupType: z.string().default("full"),
  lastBackupAt: z.string().optional().nullable(),
  lastBackupStatus: z.string().default("unknown"),
  lastBackupSizeGb: z.number().min(0).optional().nullable(),
  nextScheduledAt: z.string().optional().nullable(),
  recoveryPointObjectiveHours: z.number().int().min(0).optional().nullable(),
  recoveryTimeObjectiveHours: z.number().int().min(0).optional().nullable(),
  retentionDays: z.number().int().min(1).default(30),
  restoreTestedAt: z.string().optional().nullable(),
  restoreTestResult: z.string().max(5000).optional().nullable(),
  offsiteReplicated: z.boolean().default(false),
  encryptionEnabled: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});
