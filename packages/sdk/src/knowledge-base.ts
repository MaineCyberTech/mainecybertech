import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface KnowledgeBaseArticle {
  id: string;
  organization_id: string;
  title: string;
  body: string;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export class KnowledgeBaseApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    organizationId?: string;
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.search) qp.search = params.search;
    if (params?.category) qp.category = params.category;
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    return this.client.get<PaginatedResult<KnowledgeBaseArticle>>("/api/v1/knowledge-base", qp);
  }

  get(id: string) {
    return this.client.get<KnowledgeBaseArticle>(`/api/v1/knowledge-base/${id}`);
  }

  create(data: {
    organizationId: string;
    title: string;
    body: string;
    category?: string | null;
    tags?: string[];
    isPublished?: boolean;
  }) {
    return this.client.post<KnowledgeBaseArticle>("/api/v1/knowledge-base", data);
  }

  update(
    id: string,
    data: {
      title?: string;
      body?: string;
      category?: string | null;
      tags?: string[];
      isPublished?: boolean;
    },
  ) {
    return this.client.patch<KnowledgeBaseArticle>(`/api/v1/knowledge-base/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/knowledge-base/${id}`);
  }
}
