import { z } from "zod";

export const createFrameworkSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().max(5000).optional().nullable(),
});

export const createControlSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(500),
  status: z
    .enum(["not_started", "in_progress", "implemented", "not_applicable"])
    .default("not_started"),
  owner: z.string().max(200).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateControlSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z
    .enum(["not_started", "in_progress", "implemented", "not_applicable"])
    .optional(),
  owner: z.string().max(200).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
