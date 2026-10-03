import { ApiClient } from "./client";

export type SLAMetrics = {
  summary: {
    total: number;
    breached: number;
    breachedRate: number;
    resolved: number;
  };
  byMetric: Record<
    string,
    {
      total: number;
      breached: number;
      avgMinutes: number;
    }
  >;
  recent: Array<{
    id: string;
    ticket_id: string | null;
    metric: string;
    target_minutes: number;
    actual_minutes: number | null;
    breached: boolean;
    breached_at: string | null;
    resolved_at: string | null;
    created_at: string;
  }>;
};

export class SLApi {
  constructor(private client: ApiClient) {}

  async metrics(params?: { organizationId?: string; days?: number }): Promise<SLAMetrics> {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.days !== undefined) qp.days = params.days;
    return this.client.get<SLAMetrics>("/api/v1/sla/metrics", qp);
  }
}
