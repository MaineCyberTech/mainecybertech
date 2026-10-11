import { ApiClient } from "./client";
import type {
  Document,
  DocumentVersion,
  DocumentShare,
  DocumentAccessResponse,
  PaginatedResult,
  BulkPreviewResult,
  BulkUpdateResult,
} from "./types";

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
    return this.client.delete<void>(`/api/v1/documents/${id}`, undefined, { confirm: true });
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

  bulkFolder(data: { documentIds: string[]; folderPath: string; confirm?: boolean }) {
    return this.client.post<BulkUpdateResult>("/api/v1/documents/bulk/folder", data);
  }

  /**
   * ADMIN-P2-003: resolve the rows a bulk folder apply would touch, without
   * writing. Review `rows[].changes` before calling `bulkFolder` to apply.
   */
  previewBulkFolder(data: { documentIds: string[]; folderPath: string }) {
    return this.client.post<BulkPreviewResult>("/api/v1/documents/bulk/folder", {
      ...data,
      dryRun: true,
    });
  }

  bulkMetadata(data: {
    documentIds: string[];
    description?: string | null;
    folderPath?: string | null;
    visibility?: string | null;
    /** Required when the apply includes `visibility` (elevated operation). */
    confirm?: boolean;
  }) {
    return this.client.post<BulkUpdateResult>("/api/v1/documents/bulk/metadata", data);
  }

  /**
   * ADMIN-P2-003: resolve the rows/diffs a bulk metadata apply would produce,
   * without writing. A subsequent `bulkMetadata` call that changes visibility
   * must pass `confirm: true`.
   */
  previewBulkMetadata(data: {
    documentIds: string[];
    description?: string | null;
    folderPath?: string | null;
    visibility?: string | null;
  }) {
    return this.client.post<BulkPreviewResult>("/api/v1/documents/bulk/metadata", {
      ...data,
      dryRun: true,
    });
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

  // Access a shared document via public token (no auth required)
  accessShare(token: string) {
    return this.client.get<DocumentAccessResponse>(
      `/api/v1/documents/shares/${token}`,
    );
  }
}
