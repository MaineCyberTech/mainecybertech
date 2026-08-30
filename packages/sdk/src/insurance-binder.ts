import { ApiClient } from "./client";

export class InsuranceBinderApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; organizationId?: string; coverageArea?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.coverageArea) qp.coverage_area = params.coverageArea;
    return this.client.get("/api/v1/insurance-binder", qp);
  }

  get(id: string) {
    return this.client.get(`/api/v1/insurance-binder/${id}`);
  }

  create(data: Record<string, unknown>) {
    return this.client.post("/api/v1/insurance-binder", data);
  }

  update(id: string, data: Record<string, unknown>) {
    return this.client.patch(`/api/v1/insurance-binder/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete(`/api/v1/insurance-binder/${id}`);
  }

  coverageReport() {
    return this.client.get("/api/v1/insurance-binder/coverage-report");
  }
}
