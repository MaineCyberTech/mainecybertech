import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface Proposal {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "approved" | "rejected" | "expired";
  visibility: "internal" | "client_visible";
  total_labor: number;
  total_materials: number;
  total_recurring: number;
  total_one_time: number;
  grand_total: number;
  valid_until: string | null;
  sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  approval_request_id: string | null;
  owner_user_id: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalPhase {
  id: string;
  proposal_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  assumptions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalLineItem {
  id: string;
  proposal_id: string;
  phase_id: string | null;
  sort_order: number;
  item_type: "labor" | "materials" | "recurring" | "one_time";
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_optional: boolean;
  is_recurring: boolean;
  recurring_interval: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalDetail extends Proposal {
  phases: ProposalPhase[];
  items: ProposalLineItem[];
  comments: unknown[];
  timeline: unknown[];
}

export class ProposalsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<Proposal>>("/api/v1/proposals", qp);
  }

  get(id: string) {
    return this.client.get<ProposalDetail>(`/api/v1/proposals/${id}`);
  }

  create(data: {
    organizationId: string;
    title: string;
    description?: string | null;
    validUntil?: string | null;
    ownerUserId?: string | null;
    visibility?: string;
    metadata?: Record<string, unknown>;
    phases?: Array<{
      title: string;
      description?: string | null;
      assumptions?: string | null;
      notes?: string | null;
      sortOrder?: number;
      items?: Array<{
        itemType?: string;
        name: string;
        description?: string | null;
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
        isOptional?: boolean;
        isRecurring?: boolean;
        recurringInterval?: string;
        notes?: string | null;
        sortOrder?: number;
      }>;
    }>;
  }) {
    return this.client.post<Proposal>("/api/v1/proposals", data);
  }

  update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      status?: string;
      validUntil?: string | null;
      ownerUserId?: string | null;
      visibility?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.client.patch<Proposal>(`/api/v1/proposals/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/proposals/${id}`);
  }

  addPhase(
    proposalId: string,
    data: {
      title: string;
      description?: string | null;
      assumptions?: string | null;
      notes?: string | null;
      sortOrder?: number;
    },
  ) {
    return this.client.post<ProposalPhase>(`/api/v1/proposals/${proposalId}/phases`, data);
  }

  updatePhase(
    proposalId: string,
    phaseId: string,
    data: {
      title?: string;
      description?: string | null;
      assumptions?: string | null;
      notes?: string | null;
      sortOrder?: number;
    },
  ) {
    return this.client.patch<ProposalPhase>(
      `/api/v1/proposals/${proposalId}/phases/${phaseId}`,
      data,
    );
  }

  removePhase(proposalId: string, phaseId: string) {
    return this.client.delete<void>(`/api/v1/proposals/${proposalId}/phases/${phaseId}`);
  }

  addItem(
    proposalId: string,
    data: {
      phaseId?: string | null;
      itemType?: string;
      name: string;
      description?: string | null;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      isOptional?: boolean;
      isRecurring?: boolean;
      recurringInterval?: string;
      notes?: string | null;
      sortOrder?: number;
    },
  ) {
    return this.client.post<ProposalLineItem>(`/api/v1/proposals/${proposalId}/items`, data);
  }

  updateItem(proposalId: string, itemId: string, data: Record<string, unknown>) {
    return this.client.patch<ProposalLineItem>(
      `/api/v1/proposals/${proposalId}/items/${itemId}`,
      data,
    );
  }

  removeItem(proposalId: string, itemId: string) {
    return this.client.delete<void>(`/api/v1/proposals/${proposalId}/items/${itemId}`);
  }

  submitForApproval(proposalId: string, data: { organizationId: string }) {
    return this.client.post<{ approvalId: string }>(
      `/api/v1/proposals/${proposalId}/submit-approval`,
      data,
    );
  }

  publish(proposalId: string, data: { organizationId: string; validityDays?: number }) {
    return this.client.post<Proposal>(`/api/v1/proposals/${proposalId}/publish`, data);
  }

  listComments(proposalId: string) {
    return this.client.get<unknown[]>(`/api/v1/proposals/${proposalId}/comments`);
  }

  addComment(proposalId: string, data: { body: string; isInternal?: boolean }) {
    return this.client.post<unknown>(`/api/v1/proposals/${proposalId}/comments`, data);
  }

  getTimeline(proposalId: string) {
    return this.client.get<unknown[]>(`/api/v1/proposals/${proposalId}/timeline`);
  }

  exportData(params?: { format?: "csv" | "json"; organizationId?: string; status?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.getBlob("/api/v1/proposals/export", qp);
  }
}
