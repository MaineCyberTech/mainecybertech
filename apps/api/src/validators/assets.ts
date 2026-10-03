import { z } from "zod";

export const listAssetsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z.enum(["active", "retired", "decommissioned", "lost", "repair"]).optional(),
  assetType: z.string().optional(),
  search: z.string().optional(),
  warrantyExpiringBefore: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const createAssetSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(500),
  assetType: z.string().default("hardware"),
  make: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(200).optional().nullable(),
  assetTag: z.string().max(100).optional().nullable(),
  qrLabel: z.string().max(200).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  site: z.string().max(200).optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  warrantyExpires: z.string().optional().nullable(),
  replacementRecommended: z.string().optional().nullable(),
  lifecycleScore: z.number().min(0).max(100).optional().default(100),
  assignedTo: z.string().uuid().optional().nullable(),
  maintenanceNotes: z.string().max(10000).optional().nullable(),
  supportedUntil: z.string().optional().nullable(),
  vendorSupportStatus: z.string().default("supported"),
  ipAddress: z.string().max(50).optional().nullable(),
  macAddress: z.string().max(50).optional().nullable(),
  operatingSystem: z.string().max(200).optional().nullable(),
  contractReference: z.string().max(500).optional().nullable(),
  visibility: z.enum(["internal", "client_visible"]).optional().default("internal"),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateAssetSchema = createAssetSchema.partial().omit({ organizationId: true });

export const assetStatsSchema = z.object({
  organizationId: z.string().uuid().optional(),
});
