import { z } from "zod";

export const listDomainMonitorsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: z.enum(["active", "paused", "error"]).optional(),
  search: z.string().optional(),
  sslExpiringBefore: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createDomainMonitorSchema = z.object({
  organizationId: z.string().min(1),
  domain: z.string().min(1, "Domain is required").max(253),
  displayName: z.string().max(200).optional().nullable(),
  zoneId: z.string().max(100).optional().nullable(),
  dnsProvider: z.string().optional().default("cloudflare"),
  cloudflareProxied: z.boolean().optional().default(true),
  checkIntervalHours: z.number().int().min(1).max(168).optional().default(24),
  alertsEnabled: z.boolean().optional().default(true),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateDomainMonitorSchema = createDomainMonitorSchema
  .partial()
  .omit({ organizationId: true });
