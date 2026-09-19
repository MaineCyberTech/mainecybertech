import { ApiClient } from "./client";
import type { DashboardSummary } from "./types";

export interface BusinessOsSummary {
  organizations: {
    total: number;
    approved: number;
    pending: number;
    recent: Array<{ id: string; name: string; status: string; createdAt: string }>;
  };
  tickets: { open: number };
  projects: { active: number };
  documents: { total: number };
  approvals: { pending: number };
  users: { total: number };
}

export interface OrgHealthItem {
  id: string;
  name: string;
  openTickets: number;
  activeProjects: number;
}

export class DashboardApi {
  constructor(private client: ApiClient) {}

  summary() {
    return this.client.get<DashboardSummary>("/api/v1/dashboard/summary");
  }

  businessOsSummary() {
    return this.client.get<BusinessOsSummary>("/api/v1/business-os/summary");
  }

  approvalsOverdue() {
    return this.client.get<{ items: unknown[]; total: number }>(
      "/api/v1/business-os/approvals-overdue",
    );
  }

  recentActivity(params?: { limit?: number }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.limit) qp.limit = params.limit;
    return this.client.get<unknown[]>("/api/v1/business-os/recent-activity", qp);
  }

  orgHealth() {
    return this.client.get<OrgHealthItem[]>("/api/v1/business-os/org-health");
  }
}
