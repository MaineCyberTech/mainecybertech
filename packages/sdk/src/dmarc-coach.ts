import { ApiClient } from "./client";

export class DmarcCoachApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get("/api/v1/dmarc-coach", qp);
  }

  get(id: string) {
    return this.client.get(`/api/v1/dmarc-coach/${id}`);
  }

  create(data: Record<string, unknown>) {
    return this.client.post("/api/v1/dmarc-coach", data);
  }

  update(id: string, data: Record<string, unknown>) {
    return this.client.patch(`/api/v1/dmarc-coach/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete(`/api/v1/dmarc-coach/${id}`);
  }

  analyze(data: Record<string, unknown>) {
    return this.client.post("/api/v1/dmarc-coach/analyze", data);
  }
}
