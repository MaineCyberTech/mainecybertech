import { ApiClient } from "./client";
import type { Ticket, TicketComment, PaginatedResult } from "./types";

export class TicketsApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; organizationId?: string; status?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<PaginatedResult<Ticket>>("/api/v1/tickets", qp);
  }

  get(id: string) {
    return this.client.get<Ticket>(`/api/v1/tickets/${id}`);
  }

  create(data: {
    organizationId: string;
    title: string;
    description?: string | null;
    priority?: string;
    category?: string | null;
    source?: string;
    externalJsmIssueKey?: string | null;
    labels?: string[] | null;
    resolution?: string | null;
  }) {
    return this.client.post<Ticket>("/api/v1/tickets", data);
  }

  update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      category?: string | null;
      assignedTo?: string | null;
      externalJsmIssueKey?: string | null;
      labels?: string[] | null;
      resolution?: string | null;
    },
  ) {
    return this.client.patch<Ticket>(`/api/v1/tickets/${id}`, data);
  }

  listComments(ticketId: string) {
    return this.client.get<TicketComment[]>(
      `/api/v1/tickets/${ticketId}/comments`,
    );
  }

  addComment(
    ticketId: string,
    data: { organizationId: string; body: string; isInternal?: boolean },
  ) {
    return this.client.post<TicketComment>(
      `/api/v1/tickets/${ticketId}/comments`,
      data,
    );
  }
}
