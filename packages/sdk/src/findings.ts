import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface Finding {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  severity: "p0" | "p1" | "p2" | "p3";
  status: "open" | "in_progress" | "resolved" | "verified" | "closed" | "wont_fix";
  source: string;
  visibility: "internal" | "client_visible";
  finding_category: string | null;
  remediation_plan: string | null;
  remediation_deadline: string | null;
  verification_steps: string | null;
  verified_at: string | null;
  verified_by: string | null;
  affected_systems: string | null;
  controls_impacted: string | null;
  owner_user_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface FindingDetail extends Finding {
  comments: unknown[];
  timeline: unknown[];
}

export interface FindingStats {
  bySeverity: { p0: number; p1: number; p2: number; p3: number };
  byStatus: Record<string, number>;
  total: number;
}

export class FindingsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    severity?: string;
    source?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.severity) qp.severity = params.severity;
    if (params?.source) qp.source = params.source;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<Finding>>("/api/v1/findings", qp);
  }

  get(id: string) {
    return this.client.get<FindingDetail>(`/api/v1/findings/${id}`);
  }

  create(data: {
    organizationId: string;
    title: string;
    description?: string | null;
    severity?: string;
    source?: string;
    findingCategory?: string | null;
    remediationPlan?: string | null;
    remediationDeadline?: string | null;
    verificationSteps?: string | null;
    affectedSystems?: string | null;
    controlsImpacted?: string | null;
    assignedTo?: string | null;
    visibility?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.client.post<Finding>("/api/v1/findings", data);
  }

  update(id: string, data: Record<string, unknown>) {
    return this.client.patch<Finding>(`/api/v1/findings/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/findings/${id}`);
  }

  verify(id: string, data: { organizationId: string }) {
    return this.client.post<Finding>(`/api/v1/findings/${id}/verify`, data);
  }

  resolve(id: string, data: { organizationId: string; resolutionNotes?: string | null }) {
    return this.client.post<Finding>(`/api/v1/findings/${id}/resolve`, data);
  }

  stats(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<FindingStats>("/api/v1/findings/stats", qp);
  }

  listComments(id: string) {
    return this.client.get<unknown[]>(`/api/v1/findings/${id}/comments`);
  }

  addComment(id: string, data: { body: string; isInternal?: boolean }) {
    return this.client.post<unknown>(`/api/v1/findings/${id}/comments`, data);
  }

  getTimeline(id: string) {
    return this.client.get<unknown[]>(`/api/v1/findings/${id}/timeline`);
  }

  exportData(params?: { format?: "csv" | "json"; organizationId?: string; status?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.getBlob("/api/v1/findings/export", qp);
  }
}
