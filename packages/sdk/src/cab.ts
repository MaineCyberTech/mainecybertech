import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export type CabMeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type CabDecision = "pending" | "approved" | "rejected";

export interface CabAgendaItem {
  id: string;
  meeting_id: string;
  organization_id: string;
  change_request_id: string;
  decision: CabDecision;
  notes: string | null;
  created_at: string;
}

export interface CabMeeting {
  id: string;
  organization_id: string;
  scheduled_at: string | null;
  status: CabMeetingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  agenda?: CabAgendaItem[];
}

export interface CabMeetingDetail extends CabMeeting {
  agenda: CabAgendaItem[];
}

export interface CabMeetingListResult extends PaginatedResult<CabMeeting> {}

export class CabApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: CabMeetingStatus;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<CabMeetingListResult>("/api/v1/cab/meetings", qp);
  }

  get(id: string) {
    return this.client.get<CabMeetingDetail>(`/api/v1/cab/meetings/${id}`);
  }

  create(data: {
    organizationId: string;
    scheduledAt?: string | null;
    status?: CabMeetingStatus;
    notes?: string | null;
  }) {
    return this.client.post<CabMeeting>("/api/v1/cab/meetings", data);
  }

  addAgendaItem(
    meetingId: string,
    data: {
      organizationId?: string;
      changeRequestId: string;
      decision?: CabDecision;
      notes?: string | null;
    },
  ) {
    return this.client.post<CabAgendaItem>(
      `/api/v1/cab/meetings/${meetingId}/agenda`,
      data,
    );
  }

  updateAgendaItem(
    id: string,
    data: {
      decision?: CabDecision;
      notes?: string | null;
    },
  ) {
    return this.client.patch<CabAgendaItem>(`/api/v1/cab/agenda/${id}`, data);
  }
}
