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
}
