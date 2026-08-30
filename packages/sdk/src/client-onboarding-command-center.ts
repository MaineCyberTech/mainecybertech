import { z } from "zod";

export const ClientOnboardingRecordSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  client_name: z.string(),
  client_domain: z.string().nullable(),
  client_contact_email: z.string().nullable(),
  client_contact_phone: z.string().nullable(),
  onboarding_lead_id: z.string().uuid().nullable(),
  status: z.string(),
  phase: z.string(),
  risk_level: z.string(),
  discovery_notes: z.string().nullable(),
  m365_setup_status: z.string(),
  m365_tenant_id: z.string().nullable(),
  m365_licenses: z.record(z.unknown()),
  access_collection_status: z.string(),
  access_credentials: z.record(z.unknown()),
  network_baseline_status: z.string(),
  network_diagram_url: z.string().nullable(),
  network_scan_results: z.record(z.unknown()),
  documentation_status: z.string(),
  documentation_url: z.string().nullable(),
  security_baseline_status: z.string(),
  security_baseline_score: z.number().nullable(),
  security_findings: z.array(z.unknown()),
  support_handoff_status: z.string(),
  support_handoff_notes: z.string().nullable(),
  handoff_completed_at: z.string().nullable(),
  next_review_at: z.string().nullable(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  onboarding_record_id: z.string().uuid(),
  phase: z.string(),
  item_key: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  is_required: z.boolean(),
  is_completed: z.boolean(),
  completed_by: z.string().uuid().nullable(),
  completed_at: z.string().nullable(),
  notes: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ClientOnboardingRecord = z.infer<typeof ClientOnboardingRecordSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ListOnboardingQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  riskLevel: z.string().optional(),
  onboardingLeadId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export type ListOnboardingQuery = z.infer<typeof ListOnboardingQuerySchema> & {
  page?: number;
  limit?: number;
};

export const CreateOnboardingSchema = z.object({
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

export type CreateOnboardingInput = z.infer<typeof CreateOnboardingSchema>;

export const UpdateOnboardingSchema = z.object({
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

export type UpdateOnboardingInput = z.infer<typeof UpdateOnboardingSchema>;

export const CompletePhaseSchema = z.object({
  organizationId: z.string().min(1),
  completedBy: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
});

export type CompletePhaseInput = z.infer<typeof CompletePhaseSchema>;

export const ExportOnboardingSchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  riskLevel: z.string().optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

export type ExportOnboardingInput = z.infer<typeof ExportOnboardingSchema>;

export const ChecklistItemInputSchema = z.object({
  itemKey: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  isRequired: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export type ChecklistItemInput = z.infer<typeof ChecklistItemInputSchema>;

export const UpdateChecklistItemSchema = z.object({
  isCompleted: z.boolean().optional(),
  completedBy: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type UpdateChecklistItemInput = z.infer<typeof UpdateChecklistItemSchema>;

export const ClientOnboardingResponseSchema = z.object({
  ok: z.boolean(),
  data: ClientOnboardingRecordSchema.optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const ClientOnboardingListResponseSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      items: z.array(ClientOnboardingRecordSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    })
    .optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});

export const ChecklistListResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(ChecklistItemSchema).optional(),
  error: z
    .object({ code: z.string(), message: z.string(), status: z.number().optional() })
    .optional(),
});
