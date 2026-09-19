import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface Asset {
  id: string;
  organization_id: string;
  name: string;
  asset_type: string;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  asset_tag: string | null;
  status: string;
  location: string | null;
  site: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expires: string | null;
  replacement_recommended: string | null;
  lifecycle_score: number;
  owner_user_id: string | null;
  assigned_to: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface AssetDetail extends Asset {
  comments: unknown[];
  timeline: unknown[];
}

export interface AssetStats {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  expiringWarranty: number;
  total: number;
}

export class AssetsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    assetType?: string;
    search?: string;
    warrantyExpiringBefore?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.assetType) qp.asset_type = params.assetType;
    if (params?.search) qp.search = params.search;
    if (params?.warrantyExpiringBefore) qp.warranty_expiring_before = params.warrantyExpiringBefore;
    return this.client.get<PaginatedResult<Asset>>("/api/v1/assets", qp);
  }

  get(id: string) {
    return this.client.get<AssetDetail>(`/api/v1/assets/${id}`);
  }

  create(data: Record<string, unknown>) {
    return this.client.post<Asset>("/api/v1/assets", data);
  }
  update(id: string, data: Record<string, unknown>) {
    return this.client.patch<Asset>(`/api/v1/assets/${id}`, data);
  }
  remove(id: string) {
    return this.client.delete<void>(`/api/v1/assets/${id}`);
  }

  stats(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<AssetStats>("/api/v1/assets/stats", qp);
  }

  listComments(id: string) {
    return this.client.get<unknown[]>(`/api/v1/assets/${id}/comments`);
  }
  addComment(id: string, data: { body: string; isInternal?: boolean }) {
    return this.client.post<unknown>(`/api/v1/assets/${id}/comments`, data);
  }
  getTimeline(id: string) {
    return this.client.get<unknown[]>(`/api/v1/assets/${id}/timeline`);
  }

  exportData(params?: { format?: "csv" | "json"; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.getBlob("/api/v1/assets/export", qp);
  }
}
