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
