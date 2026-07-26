import { z } from "zod";
export const sop = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  sopNumber: z.string().max(100).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  version: z.string().default("1.0"),
  framework: z.array(z.string()).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
});
export const compliance = z.object({
  organizationId: z.string().min(1),
  framework: z.string().min(1).max(200),
  controlId: z.string().max(100).optional().nullable(),
  controlDescription: z.string().max(5000).optional().nullable(),
  isCompliant: z.boolean().default(false),
  evidenceCollected: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});
export const insurance = z.object({
  organizationId: z.string().min(1),
  category: z.string().min(1).max(200),
  evidenceDescription: z.string().min(1).max(5000),
  evidenceStatus: z.string().default("needed"),
  documentReference: z.string().max(1000).optional().nullable(),
  renewalDate: z.string().optional().nullable(),
});
export const aiPolicy = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  content: z.string().max(50000).optional().nullable(),
  approvedTools: z.array(z.string()).optional().nullable(),
  dataHandlingRules: z.string().max(5000).optional().nullable(),
  employeeGuidance: z.string().max(5000).optional().nullable(),
});
export const kb = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  content: z.string().max(50000).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  isPublished: z.boolean().default(false),
});
export const training = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().default("security"),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  isRequired: z.boolean().default(false),
});
export const phishing = z.object({
  organizationId: z.string().min(1),
  campaignName: z.string().min(1).max(500),
  targetCount: z.number().int().min(0).default(0),
  notes: z.string().max(5000).optional().nullable(),
});
export const scorecard = z.object({
  organizationId: z.string().min(1),
  category: z.string().min(1).max(200),
  score: z.number().int().min(0).max(100).default(0),
  badge: z.string().max(200).optional().nullable(),
});
export const automation = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  scriptType: z.string().default("powershell"),
  triggerType: z.string().default("manual"),
});
export const ps = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(500),
  scriptContent: z.string().max(100000).optional().nullable(),
  policyChecked: z.boolean().default(false),
  approvalRequired: z.boolean().default(true),
});
export const kbGen = z.object({
  organizationId: z.string().min(1),
  sourceTicketId: z.string().min(1).optional().nullable(),
  sourceTitle: z.string().max(500).optional().nullable(),
  generatedContent: z.string().max(50000).optional().nullable(),
});
