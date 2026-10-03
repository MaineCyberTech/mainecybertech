import { ApiClient } from "./client";

export class StatusPageApi {
  constructor(private client: ApiClient) {}

  components = {
    list: (params?: { page?: number; limit?: number; organizationId?: string }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page !== undefined) qp.page = params.page;
      if (params?.limit !== undefined) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      return this.client.get("/api/v1/status-page/components", qp);
    },
    get: (id: string) => this.client.get(`/api/v1/status-page/components/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post("/api/v1/status-page/components", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch(`/api/v1/status-page/components/${id}`, data),
    remove: (id: string) => this.client.delete(`/api/v1/status-page/components/${id}`),
  };

  incidents = {
    list: (params?: { page?: number; limit?: number; organizationId?: string }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page !== undefined) qp.page = params.page;
      if (params?.limit !== undefined) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      return this.client.get("/api/v1/status-page/incidents", qp);
    },
    get: (id: string) => this.client.get(`/api/v1/status-page/incidents/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post("/api/v1/status-page/incidents", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch(`/api/v1/status-page/incidents/${id}`, data),
    remove: (id: string) => this.client.delete(`/api/v1/status-page/incidents/${id}`),
  };

  maintenance = {
    list: (params?: { page?: number; limit?: number; organizationId?: string }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page !== undefined) qp.page = params.page;
      if (params?.limit !== undefined) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      return this.client.get("/api/v1/status-page/maintenance", qp);
    },
    get: (id: string) => this.client.get(`/api/v1/status-page/maintenance/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post("/api/v1/status-page/maintenance", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch(`/api/v1/status-page/maintenance/${id}`, data),
    remove: (id: string) => this.client.delete(`/api/v1/status-page/maintenance/${id}`),
  };

  publicStatus = (orgId: string) => this.client.get(`/api/v1/status-page/public/${orgId}`);
}
