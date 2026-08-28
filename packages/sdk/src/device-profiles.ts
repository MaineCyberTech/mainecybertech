import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface DeviceProfile {
  id: string;
  organization_id: string;
  name: string;
  type: string | null;
  manufacturer: string | null;
  model: string | null;
  specs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class DeviceProfilesApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    type?: string;
    manufacturer?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.type) qp.type = params.type;
    if (params?.manufacturer) qp.manufacturer = params.manufacturer;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<DeviceProfile>>("/api/v1/device-profiles", qp);
  }

  get(id: string) {
    return this.client.get<DeviceProfile>(`/api/v1/device-profiles/${id}`);
  }

  create(data: {
    organizationId: string;
    name: string;
    type?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    specs?: Record<string, unknown>;
  }) {
    return this.client.post<DeviceProfile>("/api/v1/device-profiles", data);
  }

  update(
    id: string,
    data: {
      name?: string;
      type?: string | null;
      manufacturer?: string | null;
      model?: string | null;
      specs?: Record<string, unknown>;
    },
  ) {
    return this.client.patch<DeviceProfile>(`/api/v1/device-profiles/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/device-profiles/${id}`);
  }
}
