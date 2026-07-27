import { ApiClient } from "./client";

export class BusinessOsApi {
  constructor(private client: ApiClient) {}

  async summary() {
    return this.client.get<Record<string, unknown>>("/business-os/summary");
  }

  async approvalsOverdue() {
    return this.client.get<unknown[]>("/business-os/approvals-overdue");
  }

  async recentActivity() {
    return this.client.get<unknown[]>("/business-os/recent-activity");
  }

  async orgHealth() {
    return this.client.get<unknown[]>("/business-os/org-health");
  }
}
