import { z } from "zod";

export const listCabMeetingsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createCabMeetingSchema = z.object({
  organizationId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional().default("scheduled"),
  notes: z.string().max(10000).optional().nullable(),
});

export const addCabAgendaItemSchema = z.object({
  organizationId: z.string().uuid().optional(),
  changeRequestId: z.string().uuid(),
  decision: z.enum(["pending", "approved", "rejected"]).optional().default("pending"),
  notes: z.string().max(10000).optional().nullable(),
});

export const updateCabAgendaItemSchema = z.object({
  decision: z.enum(["pending", "approved", "rejected"]).optional(),
  notes: z.string().max(10000).optional().nullable(),
});
