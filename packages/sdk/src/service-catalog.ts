import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface ServiceCatalogItem {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string;
  billing_model: string;
  unit: string;
  base_price: number;
  included_units: number | null;
  is_bundled: boolean;
  is_active: boolean;
  created_at: string;
}

export class ServiceCatalogApi {
  constructor(private client: ApiClient) {}
  list(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<PaginatedResult<ServiceCatalogItem>>("/api/v1/service-catalog", qp);
  }
  get(id: string) {
    return this.client.get<ServiceCatalogItem>(`/api/v1/service-catalog/${id}`);
  }
  create(data: Record<string, unknown>) {
    return this.client.post<ServiceCatalogItem>("/api/v1/service-catalog", data);
  }
  update(id: string, data: Record<string, unknown>) {
    return this.client.patch<ServiceCatalogItem>(`/api/v1/service-catalog/${id}`, data);
  }
  remove(id: string) {
    return this.client.delete<void>(`/api/v1/service-catalog/${id}`);
  }
}
