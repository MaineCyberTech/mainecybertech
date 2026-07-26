import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface FileRequest {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  token: string;
  storage_path: string;
  max_file_size_mb: number;
  max_files: number;
  expires_at: string;
  upload_count: number;
  status: string;
  notify_on_upload: boolean;
  created_at: string;
}

export class FileRequestsApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; organizationId?: string; status?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<PaginatedResult<FileRequest>>("/api/v1/file-requests", qp);
  }

  get(id: string) {
    return this.client.get<FileRequest>(`/api/v1/file-requests/${id}`);
  }

  create(data: {
    organizationId: string;
    title: string;
    description?: string | null;
    maxFileSizeMb?: number;
    allowedMimeTypes?: string[] | null;
    maxFiles?: number;
    expiresInDays?: number;
    notifyOnUpload?: boolean;
    visibility?: string;
  }) {
    return this.client.post<FileRequest>("/api/v1/file-requests", data);
  }

  update(
    id: string,
    data: { title?: string; description?: string | null; status?: string; visibility?: string },
  ) {
    return this.client.patch<FileRequest>(`/api/v1/file-requests/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/file-requests/${id}`);
  }

  getPublic(token: string) {
    return this.client.get<unknown>(`/api/v1/file-requests/public/${token}`);
  }
}
