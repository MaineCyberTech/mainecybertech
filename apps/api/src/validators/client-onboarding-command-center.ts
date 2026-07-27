import { z } from "zod";

export const listOnboardingQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  riskLevel: z.string().optional(),
  onboardingLeadId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createOnboardingSchema = z.object({
  organizationId: z.string().min(1),
  clientName: z.string().min(1).max(255),
  clientDomain: z.string().max(255).optional().nullable(),
  clientContactEmail: z.string().email().optional().nullable(),
  clientContactPhone: z.string().max(50).optional().nullable(),
  onboardingLeadId: z.string().optional().nullable(),
  status: z.string().optional().default("discovery"),
  phase: z.string().optional().default("discovery"),
  riskLevel: z.string().optional().default("medium"),
  discoveryNotes: z.string().max(10000).optional().nullable(),
  m365SetupStatus: z.string().optional().default("not_started"),
  m365TenantId: z.string().max(255).optional().nullable(),
  m365Licenses: z.record(z.unknown()).optional().default({}),
  accessCollectionStatus: z.string().optional().default("not_started"),
  accessCredentials: z.record(z.unknown()).optional().default({}),
  networkBaselineStatus: z.string().optional().default("not_started"),
  networkDiagramUrl: z.string().url().optional().nullable(),
  networkScanResults: z.record(z.unknown()).optional().default({}),
  documentationStatus: z.string().optional().default("not_started"),
  documentationUrl: z.string().url().optional().nullable(),
  securityBaselineStatus: z.string().optional().default("not_started"),
  securityBaselineScore: z.number().int().min(0).max(100).optional().nullable(),
  securityFindings: z.array(z.unknown()).optional().default([]),
  supportHandoffStatus: z.string().optional().default("not_started"),
  supportHandoffNotes: z.string().max(10000).optional().nullable(),
  nextReviewAt: z.string().optional().nullable(),
});

export const updateOnboardingSchema = z.object({
  clientName: z.string().min(1).max(255).optional(),
  clientDomain: z.string().max(255).optional().nullable(),
  clientContactEmail: z.string().email().optional().nullable(),
  clientContactPhone: z.string().max(50).optional().nullable(),
  onboardingLeadId: z.string().optional().nullable(),
  status: z.string().optional(),
  phase: z.string().optional(),
  riskLevel: z.string().optional(),
  discoveryNotes: z.string().max(10000).optional().nullable(),
  m365SetupStatus: z.string().optional(),
  m365TenantId: z.string().max(255).optional().nullable(),
  m365Licenses: z.record(z.unknown()).optional(),
  accessCollectionStatus: z.string().optional(),
  accessCredentials: z.record(z.unknown()).optional(),
  networkBaselineStatus: z.string().optional(),
  networkDiagramUrl: z.string().url().optional().nullable(),
  networkScanResults: z.record(z.unknown()).optional(),
  documentationStatus: z.string().optional(),
  documentationUrl: z.string().url().optional().nullable(),
  securityBaselineStatus: z.string().optional(),
  securityBaselineScore: z.number().int().min(0).max(100).optional().nullable(),
  securityFindings: z.array(z.unknown()).optional(),
  supportHandoffStatus: z.string().optional(),
  supportHandoffNotes: z.string().max(10000).optional().nullable(),
  handoffCompletedAt: z.string().optional().nullable(),
  nextReviewAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
});

export const completePhaseSchema = z.object({
  organizationId: z.string().min(1),
  completedBy: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
});

export const exportOnboardingSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  riskLevel: z.string().optional(),
  format: z.string().optional().default("csv"),
});

export const checklistItemSchema = z.object({
  itemKey: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  isRequired: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateChecklistItemSchema = z.object({
  isCompleted: z.boolean().optional(),
  completedBy: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
