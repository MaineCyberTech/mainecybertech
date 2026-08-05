import { ApiClient } from "./client";

export class BusinessOsApi {
  constructor(private client: ApiClient) {}

  async summary() {
    return this.client.get<Record<string, unknown>>("/api/v1/business-os/summary");
  }

  async approvalsOverdue() {
    return this.client.get<unknown[]>("/api/v1/business-os/approvals-overdue");
  }

  async recentActivity(params?: { limit?: number }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.limit) qp.limit = params.limit;
    return this.client.get<unknown[]>("/api/v1/business-os/recent-activity", qp);
  }

  async orgHealth() {
    return this.client.get<unknown[]>("/api/v1/business-os/org-health");
  }
}
