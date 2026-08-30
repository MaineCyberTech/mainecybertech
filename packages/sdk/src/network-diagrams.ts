import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface NetworkDiagramNode {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export interface NetworkDiagramEdge {
  from?: string;
  to?: string;
  label?: string;
  [key: string]: unknown;
}

export interface NetworkDiagram {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  diagram: { nodes?: NetworkDiagramNode[]; edges?: NetworkDiagramEdge[] } | Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NetworkDiagramDetail = NetworkDiagram;

export class NetworkDiagramsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    search?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.search) qp.search = params.search;
    return this.client.get<PaginatedResult<NetworkDiagram>>("/api/v1/network-diagrams", qp);
  }

  get(id: string) {
    return this.client.get<NetworkDiagramDetail>(`/api/v1/network-diagrams/${id}`);
  }

  create(data: {
    organizationId: string;
    name: string;
    description?: string | null;
    diagram?: Record<string, unknown>;
  }) {
    return this.client.post<NetworkDiagram>("/api/v1/network-diagrams", data);
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      diagram?: Record<string, unknown>;
    },
  ) {
    return this.client.patch<NetworkDiagram>(`/api/v1/network-diagrams/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/network-diagrams/${id}`);
  }
}
