import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface TriageAnalysis {
  id: string;
  raw_description: string;
  suggested_category: string;
  suggested_priority: string;
  suggested_subject: string;
  missing_info: string[];
  confidence_score: number;
  status: string;
  created_at: string;
}

export interface TicketSummary {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  commentCount: number;
  keyPoints: string[];
  suggestedNextAction: string;
}

export interface ReplyDraft {
  draftReply: string;
  ticketSubject: string;
  tone: string;
}

export interface AiDraftOutput {
  id: string;
  organization_id: string;
  module_key: string;
  prompt_key: string | null;
  prompt_version: string | null;
  draft_content: Record<string, unknown>;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_content: Record<string, unknown> | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export class AiApi {
  constructor(private client: ApiClient) {}

  triageAnalyze(data: {
    organizationId: string;
    rawDescription: string;
    requesterEmail?: string | null;
  }) {
    return this.client.post<TriageAnalysis>("/api/v1/ai/triage/analyze", data);
  }

  triageConvert(data: {
    organizationId: string;
    triageId: string;
    subject: string;
    category?: string;
    priority?: string;
    ticketBody: string;
  }) {
    return this.client.post<{ ticket: Record<string, unknown>; triageId: string }>(
      "/api/v1/ai/triage/convert",
      data,
    );
  }

  triageList(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<PaginatedResult<TriageAnalysis>>("/api/v1/ai/triage", qp);
  }

  copilotSummarize(ticketId: string) {
    return this.client.get<TicketSummary>(`/api/v1/ai/copilot/${ticketId}/summarize`);
  }

  copilotReplyDraft(ticketId: string, data: { organizationId: string; tone?: string }) {
    return this.client.post<ReplyDraft>(`/api/v1/ai/copilot/${ticketId}/reply-draft`, data);
  }

  /**
   * FEAT-P3-009: the human review gate for `ai_draft_outputs`. Drafts are
   * created by the API and stay `draft` until a reviewer approves/rejects.
   */
  drafts = {
    create: (data: {
      organizationId: string;
      moduleKey: string;
      promptKey?: string | null;
      promptVersion?: string | null;
      draftContent: Record<string, unknown>;
      sourceEntityType?: string | null;
      sourceEntityId?: string | null;
    }) => this.client.post<AiDraftOutput>("/api/v1/ai/drafts", data),
    list: (params?: {
      page?: number;
      limit?: number;
      organizationId?: string;
      status?: string;
      moduleKey?: string;
    }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page) qp.page = params.page;
      if (params?.limit) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      if (params?.status) qp.status = params.status;
      if (params?.moduleKey) qp.module_key = params.moduleKey;
      return this.client.get<PaginatedResult<AiDraftOutput>>("/api/v1/ai/drafts", qp);
    },
    get: (id: string, organizationId: string) =>
      this.client.get<AiDraftOutput>(`/api/v1/ai/drafts/${id}`, {
        organization_id: organizationId,
      }),
    review: (
      id: string,
      organizationId: string,
      data: {
        decision: "approved" | "rejected";
        reviewNotes?: string | null;
        approvedContent?: Record<string, unknown>;
      },
    ) =>
      this.client.post<AiDraftOutput>(
        `/api/v1/ai/drafts/${id}/review?organization_id=${encodeURIComponent(organizationId)}`,
        data,
      ),
  };
}
