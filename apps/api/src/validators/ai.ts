import { z } from "zod";

export const triageInputSchema = z.object({
  organizationId: z.string().uuid(),
  rawDescription: z.string().min(10, "Description must be at least 10 characters").max(5000),
  requesterEmail: z.string().email().optional().nullable(),
});

export const convertTriageSchema = z.object({
  organizationId: z.string().uuid(),
  triageId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  category: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  ticketBody: z.string().min(1).max(10000),
});

export const copilotSummarizeSchema = z.object({
  organizationId: z.string().uuid(),
});

export const copilotReplyDraftSchema = z.object({
  organizationId: z.string().uuid(),
  tone: z.enum(["formal", "friendly", "technical", "concise"]).optional().default("friendly"),
});

/**
 * FEAT-P2-004: `ai_draft_outputs` review-gate payloads. Drafts are created
 * with `status = 'draft'` and can only be applied through the review endpoint,
 * so a human decision (with reviewer identity + timestamp) is recorded before
 * the output is used.
 */
export const createAiDraftSchema = z.object({
  organizationId: z.string().uuid(),
  moduleKey: z.string().min(1).max(100),
  promptKey: z.string().max(200).optional().nullable(),
  promptVersion: z.string().max(100).optional().nullable(),
  draftContent: z.record(z.unknown()).default({}),
  sourceEntityType: z.string().max(100).optional().nullable(),
  sourceEntityId: z.string().uuid().optional().nullable(),
});

export const reviewAiDraftSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().max(5000).optional().nullable(),
  approvedContent: z.record(z.unknown()).optional(),
});
