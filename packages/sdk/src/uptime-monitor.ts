import { ApiClient } from "./client";

export class UptimeMonitorApi {
  constructor(private client: ApiClient) {}

  listChecks(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get("/api/v1/uptime-monitor/checks", qp);
  }

  getCheck(id: string) {
    return this.client.get(`/api/v1/uptime-monitor/checks/${id}`);
  }

  createCheck(data: Record<string, unknown>) {
    return this.client.post("/api/v1/uptime-monitor/checks", data);
  }

  updateCheck(id: string, data: Record<string, unknown>) {
    return this.client.patch(`/api/v1/uptime-monitor/checks/${id}`, data);
  }

  removeCheck(id: string) {
    return this.client.delete(`/api/v1/uptime-monitor/checks/${id}`);
  }

  getResults(id: string) {
    return this.client.get(`/api/v1/uptime-monitor/checks/${id}/results`);
  }

  getUptime(id: string) {
    return this.client.get(`/api/v1/uptime-monitor/checks/${id}/uptime`);
  }

  dashboard() {
    return this.client.get("/api/v1/uptime-monitor/dashboard");
  }
}
