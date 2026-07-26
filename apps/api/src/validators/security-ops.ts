import { z } from "zod";

export const createOffboardingSchema = z.object({
  organizationId: z.string().min(1),
  employeeName: z.string().min(1).max(500),
  employeeEmail: z.string().email().optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  offboardingDate: z.string().optional().nullable(),
  accountDisabled: z.boolean().default(false),
  mailboxConverted: z.boolean().default(false),
  onedriveTransferred: z.boolean().default(false),
  licenseReclaimed: z.boolean().default(false),
  accessReviewed: z.boolean().default(false),
  evidenceCollected: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});

export const createBreakGlassSchema = z.object({
  organizationId: z.string().min(1),
  accountName: z.string().min(1).max(500),
  system: z.string().min(1).max(500),
  custodianName: z.string().max(500).optional().nullable(),
  lastRotatedAt: z.string().optional().nullable(),
  nextRotationAt: z.string().optional().nullable(),
  accessProcedure: z.string().max(5000).optional().nullable(),
  testNotes: z.string().max(5000).optional().nullable(),
});

export const createOnboardingSchema = z.object({
  organizationId: z.string().min(1),
  clientName: z.string().min(1).max(500),
  notes: z.string().max(5000).optional().nullable(),
});

export const createPatchSchema = z.object({
  organizationId: z.string().min(1),
  deviceGroup: z.string().min(1).max(500),
  totalDevices: z.number().int().min(0).default(0),
  patchedDevices: z.number().int().min(0).default(0),
  pendingPatches: z.number().int().min(0).default(0),
  criticalPatches: z.number().int().min(0).default(0),
  lastPatchDate: z.string().optional().nullable(),
  nextMaintenanceWindow: z.string().optional().nullable(),
  exceptionCount: z.number().int().min(0).default(0),
  compliancePct: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
