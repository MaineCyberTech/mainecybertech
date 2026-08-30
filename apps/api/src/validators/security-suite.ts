import { z } from "zod";

export const createM365Schema = z.object({
  organizationId: z.string().uuid(),
  tenantDomain: z.string().min(1).max(253),
  notes: z.string().max(5000).optional().nullable(),
});
export const createIncidentSchema = z.object({
  organizationId: z.string().uuid(),
  incidentType: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  affectedSystems: z.string().max(2000).optional().nullable(),
  leadUserId: z.string().uuid().optional().nullable(),
});
export const createIdVerifySchema = z.object({
  organizationId: z.string().uuid(),
  requestorName: z.string().min(1).max(500),
  requestorEmail: z.string().email().optional().nullable(),
  verificationMethod: z.string().min(1).max(200),
  actionAuthorized: z.string().max(500).optional().nullable(),
});
export const createEndpointSchema = z.object({
  organizationId: z.string().uuid(),
  deviceGroup: z.string().min(1).max(500),
  totalEndpoints: z.number().int().min(0).default(0),
});
