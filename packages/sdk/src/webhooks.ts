import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface WebhookEndpoint {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret?: string | null;
  events: string[];
  is_active: boolean;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  last_error?: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: string;
  response_status?: number | null;
  error?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

export class WebhooksApi {
  constructor(private client: ApiClient) {}

  list(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<WebhookEndpoint[]>("/api/v1/webhook-endpoints", qp);
  }

  get(id: string) {
    return this.client.get<WebhookEndpoint>(`/api/v1/webhook-endpoints/${id}`);
  }

  create(data: {
    organizationId: string;
    name: string;
    url: string;
    secret?: string | null;
    events: string[];
  }) {
    return this.client.post<WebhookEndpoint>("/api/v1/webhook-endpoints", data);
  }

  update(id: string, data: {
    name?: string;
    url?: string;
    secret?: string | null;
    events?: string[];
    isActive?: boolean;
  }) {
    return this.client.patch<WebhookEndpoint>(`/api/v1/webhook-endpoints/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/webhook-endpoints/${id}`);
  }

  listDeliveries(webhookId: string, params?: { page?: number; limit?: number }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    return this.client.get<PaginatedResult<WebhookDelivery>>(
      `/api/v1/webhook-endpoints/${webhookId}/deliveries`, qp,
    );
  }

  test(webhookId: string) {
    return this.client.post<{ ok: boolean; status?: number; error?: string; duration_ms?: number }>(
      `/api/v1/webhook-endpoints/${webhookId}/test`,
    );
  }
}
