import { z } from "zod";
export const createChangeSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  changeType: z.string().default("standard"),
  riskLevel: z.string().default("low"),
  rollbackPlan: z.string().max(5000).optional().nullable(),
  implementationDate: z.string().optional().nullable(),
  verificationSteps: z.string().max(5000).optional().nullable(),
});
export const createRiskSchema = z.object({
  organizationId: z.string().min(1),
  riskDescription: z.string().min(1).max(2000),
  riskCategory: z.string().default("security"),
  likelihood: z.string().default("medium"),
  impact: z.string().default("medium"),
  mitigatingControls: z.string().max(5000).optional().nullable(),
  compensatingControls: z.string().max(5000).optional().nullable(),
  acceptanceExpires: z.string().optional().nullable(),
});
export const createRetentionSchema = z.object({
  organizationId: z.string().min(1),
  dataCategory: z.string().min(1).max(500),
  systemName: z.string().min(1).max(500),
  retentionPeriodDays: z.number().int().positive(),
  disposalMethod: z.string().max(500).optional().nullable(),
  isRegulated: z.boolean().default(false),
  regulationReference: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export const createTabletopSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  scenario: z.string().min(1).max(5000),
  scenarioType: z.string().default("cyber_incident"),
  participants: z.string().max(2000).optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  actionItems: z.string().max(5000).optional().nullable(),
  afterActionReport: z.string().max(10000).optional().nullable(),
});
