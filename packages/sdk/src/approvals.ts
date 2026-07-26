import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  request_type: string;
  request_subject: string;
  request_body: string | null;
  request_metadata: Record<string, unknown>;
  source_module: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  requested_by: string | null;
  assigned_to: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  due_at: string | null;
  visibility: "internal" | "client_visible";
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface ApprovalDetail extends ApprovalRequest {
  comments: unknown[];
  timeline: unknown[];
}

export class ApprovalsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    requestType?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.requestType) qp.request_type = params.requestType;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<ApprovalRequest>>("/api/v1/approvals", qp);
  }

  get(id: string) {
    return this.client.get<ApprovalDetail>(`/api/v1/approvals/${id}`);
  }

  create(data: {
    organizationId: string;
    requestType: string;
    requestSubject: string;
    requestBody?: string | null;
    requestMetadata?: Record<string, unknown>;
    sourceModule?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
    priority?: string;
    assignedTo?: string | null;
    dueAt?: string | null;
    visibility?: string;
  }) {
    return this.client.post<ApprovalRequest>("/api/v1/approvals", data);
  }

  update(
    id: string,
    data: {
      requestSubject?: string;
      requestBody?: string | null;
      requestMetadata?: Record<string, unknown>;
      priority?: string;
      assignedTo?: string | null;
      dueAt?: string | null;
      visibility?: string;
    },
  ) {
    return this.client.patch<ApprovalRequest>(`/api/v1/approvals/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/approvals/${id}`);
  }

  approve(id: string, data: { organizationId: string; notes?: string | null }) {
    return this.client.post<ApprovalRequest>(`/api/v1/approvals/${id}/approve`, data);
  }

  reject(id: string, data: { organizationId: string; reason: string }) {
    return this.client.post<ApprovalRequest>(`/api/v1/approvals/${id}/reject`, data);
  }

  cancel(id: string, data: { organizationId: string; reason?: string | null }) {
    return this.client.post<ApprovalRequest>(`/api/v1/approvals/${id}/cancel`, data);
  }

  stats(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<ApprovalStats>("/api/v1/approvals/stats", qp);
  }

  addComment(id: string, data: { body: string; isInternal?: boolean }) {
    return this.client.post<unknown>(`/api/v1/approvals/${id}/comments`, data);
  }

  listComments(id: string) {
    return this.client.get<unknown[]>(`/api/v1/approvals/${id}/comments`);
  }

  getTimeline(id: string) {
    return this.client.get<unknown[]>(`/api/v1/approvals/${id}/timeline`);
  }

  exportData(params?: {
    format?: "csv" | "json";
    organizationId?: string;
    status?: string;
    requestType?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.requestType) qp.request_type = params.requestType;
    return this.client.getBlob(`/api/v1/approvals/export`, qp);
  }
}
