import { z } from "zod";

export const createLicenseSchema = z.object({
  organizationId: z.string().uuid(),
  vendor: z.string().min(1).max(500),
  productName: z.string().min(1).max(500),
  totalSeats: z.number().int().min(0).default(0),
  assignedSeats: z.number().int().min(0).default(0),
  unusedSeats: z.number().int().min(0).default(0),
  costPerSeat: z.number().min(0).optional().nullable(),
  annualCost: z.number().min(0).optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  optimizationNotes: z.string().max(5000).optional().nullable(),
  reclaimableSavings: z.number().min(0).optional().nullable(),
});

export const createStatusItemSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  severity: z.enum(["info", "warning", "critical", "maintenance"]).default("info"),
  isPublic: z.boolean().default(false),
  scheduledStart: z.string().optional().nullable(),
  scheduledEnd: z.string().optional().nullable(),
  isResolved: z.boolean().default(false),
});

export const createWebsiteMonitorSchema = z.object({
  organizationId: z.string().uuid(),
  url: z.string().min(1).max(2000),
  displayName: z.string().max(500).optional().nullable(),
  checkIntervalHours: z.number().int().min(1).max(168).default(6),
  alertsEnabled: z.boolean().default(true),
});

export const createDmarcAssessmentSchema = z.object({
  organizationId: z.string().uuid(),
  domain: z.string().min(1).max(253),
  spfRecord: z.string().max(1000).optional().nullable(),
  spfValid: z.boolean().default(false),
  dkimConfigured: z.boolean().default(false),
  dkimSelector: z.string().max(200).optional().nullable(),
  dmarcRecord: z.string().max(1000).optional().nullable(),
  dmarcPolicy: z.string().max(200).optional().nullable(),
  dmarcValid: z.boolean().default(false),
  dmarcPct: z.number().int().min(0).max(100).optional().nullable(),
  bimiConfigured: z.boolean().default(false),
  recommendationNotes: z.string().max(5000).optional().nullable(),
});
