import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface QbrReport {
  id: string;
  organization_id: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  summary: string | null;
  report_data: Record<string, unknown>;
  generated_by: string | null;
  created_at: string;
}

export class QbrApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<PaginatedResult<QbrReport>>("/api/v1/qbr", qp);
  }

  get(id: string) {
    return this.client.get<QbrReport>(`/api/v1/qbr/${id}`);
  }

  generate(data: {
    organizationId: string;
    title: string;
    periodStart?: string | null;
    periodEnd?: string | null;
    visibility?: string;
  }) {
    return this.client.post<QbrReport>("/api/v1/qbr/generate", data);
  }

  update(
    id: string,
    data: { title?: string; status?: string; summary?: string | null; visibility?: string },
  ) {
    return this.client.patch<QbrReport>(`/api/v1/qbr/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/qbr/${id}`);
  }
}
