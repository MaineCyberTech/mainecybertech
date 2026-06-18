import { ApiClient } from "./client";
import type { Document, DocumentVersion, PaginatedResult } from "./types";

export type DocumentShare = {
  id: string;
  document_id: string;
  organization_id: string;
  created_by: string;
  token: string;
  expires_at: string;
  access_count: number;
  max_access: number | null;
  revoked_at: string | null;
  created_at: string;
  share_url?: string;
};

export class DocumentsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    visibility?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.visibility) qp.visibility = params.visibility;
    return this.client.get<PaginatedResult<Document>>("/api/v1/documents", qp);
  }

  createSignedUrl(id: string) {
    return this.client.post<{ signedUrl: string }>(
      `/api/v1/documents/${id}/signed-url`,
    );
  }

  get(id: string) {
    return this.client.get<Document>(`/api/v1/documents/${id}`);
  }

  create(data: {
    organizationId: string;
    name: string;
    description?: string | null;
    visibility?: string;
    folderPath?: string | null;
    storageBucket?: string | null;
    storagePath?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    uploadedBy?: string | null;
    currentVersion?: number | null;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.client.post<Document>("/api/v1/documents", data);
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      visibility?: string;
      folderPath?: string | null;
      storageBucket?: string | null;
      storagePath?: string | null;
      mimeType?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      currentVersion?: number | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    return this.client.patch<Document>(`/api/v1/documents/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/documents/${id}`);
  }

  upload(data: {
    file: File | Blob;
    organizationId: string;
    name: string;
    description?: string | null;
    visibility?: string;
    folderPath?: string | null;
    bucket?: string;
    documentId?: string;
    currentVersion?: number;
  }) {
    const fd = new FormData();
    fd.append("file", data.file);
    fd.append("organizationId", data.organizationId);
    fd.append("name", data.name);
    if (data.description) fd.append("description", data.description);
    if (data.visibility) fd.append("visibility", data.visibility);
    if (data.folderPath) fd.append("folderPath", data.folderPath);
    if (data.bucket) fd.append("bucket", data.bucket);
    if (data.documentId) fd.append("documentId", data.documentId);
    if (data.currentVersion !== undefined)
      fd.append("currentVersion", String(data.currentVersion));
    return this.client.postFormData<Document>("/api/v1/documents/upload", fd);
  }

  bulkFolder(data: { documentIds: string[]; folderPath: string }) {
    return this.client.post<{ updated: number }>(
      "/api/v1/documents/bulk/folder",
      data,
    );
  }

  bulkMetadata(data: {
    documentIds: string[];
    description?: string | null;
    folderPath?: string | null;
    visibility?: string | null;
  }) {
    return this.client.post<{ updated: number }>(
      "/api/v1/documents/bulk/metadata",
      data,
    );
  }

  listVersions(id: string, params?: { page?: number; limit?: number }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    return this.client.get<PaginatedResult<DocumentVersion>>(
      `/api/v1/documents/${id}/versions`,
      qp,
    );
  }

  getVersion(documentId: string, versionId: string) {
    return this.client.get<DocumentVersion>(
      `/api/v1/documents/${documentId}/versions/${versionId}`,
    );
  }

  // Document Shares
  createShare(
    documentId: string,
    data: { expiresAt: string; maxAccess?: number },
  ) {
    return this.client.post<DocumentShare>(
      `/api/v1/documents/${documentId}/shares`,
      data,
    );
  }

  listShares(documentId: string) {
    return this.client.get<DocumentShare[]>(
      `/api/v1/documents/${documentId}/shares`,
    );
  }

  updateShare(
    documentId: string,
    shareId: string,
    data: { expiresAt?: string; maxAccess?: number; revoked?: boolean },
  ) {
    return this.client.patch<{ updated: boolean }>(
      `/api/v1/documents/${documentId}/shares/${shareId}`,
      data,
    );
  }

  removeShare(documentId: string, shareId: string) {
    return this.client.delete<void>(
      `/api/v1/documents/${documentId}/shares/${shareId}`,
    );
  }
}
