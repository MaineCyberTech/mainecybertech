import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface StagingCheck {
  id: string;
  organization_id: string;
  device_name: string;
  asset_tag: string | null;
  status: string;
  checklist: unknown[];
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export class StagingApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<StagingCheck>>("/api/v1/staging", qp);
  }

  get(id: string) {
    return this.client.get<StagingCheck>(`/api/v1/staging/${id}`);
  }

  create(data: {
    organizationId: string;
    deviceName: string;
    assetTag?: string | null;
    status?: string;
    checklist?: unknown[];
    assignedTo?: string | null;
  }) {
    return this.client.post<StagingCheck>("/api/v1/staging", data);
  }

  update(
    id: string,
    data: {
      deviceName?: string;
      assetTag?: string | null;
      status?: string;
      checklist?: unknown[];
      assignedTo?: string | null;
    },
  ) {
    return this.client.patch<StagingCheck>(`/api/v1/staging/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/staging/${id}`);
  }
}
