import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminDocumentsCenterClient from "@/components/admin/AdminDocumentsCenterClient";
import { bulkFolderAction, bulkMetadataAction } from "@/app/(admin)/admin/documents/bulk-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Documents - Admin - Maine CyberTech" };

type DocumentVisibility = "private" | "org" | "public" | "internal";

type DocumentRecord = {
  id: string;
  organization_id: string;
  uploaded_by?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  folder_path?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  visibility?: string | null;
  current_version?: number | null;
  metadata?: Record<string, any> | null;
  file_name?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  resolved_url?: string | null;
  display_name?: string;
  file_extension?: string | null;
  preview_kind?: "image" | "pdf" | "text" | "video" | "audio" | "office" | "download";
  organization_name?: string | null;
};

type ActionResult = {
  ok: boolean;
  kind?:
    | "created"
    | "updated"
    | "visibility"
    | "replaced"
    | "deleted"
    | "bulk_visibility"
    | "bulk_deleted";
  error?: string;
  document?: DocumentRecord;
  documentId?: string;
  ids?: string[];
  visibility?: string;
};

const ALLOWED_VISIBILITY: DocumentVisibility[] = ["private", "org", "public", "internal"];

function looksAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeStoragePath(value: string) {
  return String(value || "").replace(/^\/+/, "");
}

function trimOrNull(value: FormDataEntryValue | null) {
  const out = String(value ?? "").trim();
  return out ? out : null;
}

function getDisplayName(doc: Partial<DocumentRecord>) {
  return (
    doc.title?.trim() ||
    doc.name?.trim() ||
    doc.file_name?.trim() ||
    (doc.storage_path ? doc.storage_path.split("/").pop() : null) ||
    "Untitled document"
  );
}

function getExtension(fileNameOrPath?: string | null) {
  const raw = String(fileNameOrPath ?? "").trim();
  if (!raw) return null;
  const last = raw.split("/").pop() || raw;
  const idx = last.lastIndexOf(".");
  if (idx < 0 || idx == last.length - 1) return null;
  return last.slice(idx + 1).toLowerCase();
}

function inferPreviewKind(doc: Partial<DocumentRecord>): DocumentRecord["preview_kind"] {
  const mime = (doc.mime_type || "").toLowerCase();
  const ext = getExtension(doc.file_name || doc.storage_path) || "";

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime.startsWith("text/") ||
    ["md", "txt", "json", "csv", "log", "xml", "yml", "yaml"].includes(ext)
  ) {
    return "text";
  }
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
  return "download";
}

async function resolveDocumentUrl(
  api: ReturnType<typeof import("@/lib/api").getApiClient>,
  doc: Partial<DocumentRecord>,
) {
  const rawPath = String(doc?.storage_path ?? "").trim();

  if (!rawPath) return null;
  if (looksAbsoluteUrl(rawPath)) return rawPath;

  const path = normalizeStoragePath(rawPath);
  if (!path) return null;

  if (!doc.id) return null;
  try {
    const result = await api.documents.createSignedUrl(doc.id);
    return result.signedUrl;
  } catch {
    return null;
  }
}

async function enrichDocument(
  api: ReturnType<typeof import("@/lib/api").getApiClient>,
  doc: DocumentRecord,
  orgMap?: Map<string, string>,
): Promise<DocumentRecord> {
  const resolved_url = await resolveDocumentUrl(api, doc);
  const display_name = getDisplayName(doc);
  const file_extension = getExtension(doc.file_name || doc.storage_path);
  const preview_kind = inferPreviewKind(doc);

  return {
    ...doc,
    resolved_url,
    display_name,
    file_extension,
    preview_kind,
    organization_name: orgMap?.get(doc.organization_id) ?? null,
  };
}

export default async function AdminDocumentsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  async function createDocumentAction(formData: FormData): Promise<ActionResult> {
    "use server";
    const admin = await requireAdminAccess();

    try {
      const api = getApiClient();
      const organizationId = String(formData.get("organizationId") ?? "").trim();
      const providedTitle =
        String(formData.get("title") ?? "").trim() ||
        String(formData.get("name") ?? "").trim();
      const folderPath = trimOrNull(formData.get("category"));
      const requestedVisibility = String(formData.get("visibility") ?? "org").trim() || "org";
      const visibility = ALLOWED_VISIBILITY.includes(requestedVisibility as DocumentVisibility)
        ? requestedVisibility
        : "org";
      const bucket = String(formData.get("bucket") ?? "documents").trim() || "documents";
      const suppliedPath = String(formData.get("fileUrl") ?? formData.get("storagePath") ?? "").trim();
      const description = trimOrNull(formData.get("description"));
      const file = formData.get("file");

      if (!organizationId) {
        return { ok: false, error: "Organization is required." };
      }

      if (!providedTitle) {
        return { ok: false, error: "Document title is required." };
      }

      if (file instanceof File && file.size > 0) {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const doc = await api.documents.upload({
          file: blob,
          organizationId,
          name: providedTitle,
          description,
          visibility,
          folderPath,
          bucket,
        });
        return {
          ok: true,
          kind: "created",
          document: await enrichDocument(api, doc as unknown as DocumentRecord),
        };
      }

      if (!suppliedPath) {
        return { ok: false, error: "Provide a storage path or upload a file." };
      }

      const doc = await api.documents.create({
        organizationId,
        name: providedTitle,
        description,
        visibility,
        folderPath,
        storageBucket: bucket,
        storagePath: suppliedPath,
        mimeType: null,
        fileName: null,
        fileSize: null,
        uploadedBy: admin.userId,
        currentVersion: 1,
        metadata: {},
      });

      return {
        ok: true,
        kind: "created",
        document: await enrichDocument(api, doc as unknown as DocumentRecord),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function updateMetadataAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    const api = getApiClient();

    try {
      const documentId = String(formData.get("documentId") ?? "").trim();
      const title =
        String(formData.get("title") ?? "").trim() ||
        String(formData.get("name") ?? "").trim();
      const description = trimOrNull(formData.get("description"));
      const folderPath = trimOrNull(formData.get("category"));
      const storagePathInput = trimOrNull(formData.get("fileUrl") ?? formData.get("storagePath"));

      if (!documentId) {
        return { ok: false, error: "Document ID is required." };
      }

      if (!title) {
        return { ok: false, error: "Document title is required." };
      }

      const data = await api.documents.update(documentId, {
        name: title,
        description,
        folderPath,
        storagePath: storagePathInput ?? undefined,
      });

      return {
        ok: true,
        kind: "updated",
        document: await enrichDocument(api, data as unknown as DocumentRecord),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function updateVisibilityAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    const api = getApiClient();

    try {
      const documentId = String(formData.get("documentId") ?? "").trim();
      const requestedVisibility = String(formData.get("visibility") ?? "private").trim();
      const visibility = ALLOWED_VISIBILITY.includes(requestedVisibility as DocumentVisibility)
        ? requestedVisibility
        : "private";

      if (!documentId) {
        return { ok: false, error: "Document ID is required." };
      }

      const data = await api.documents.update(documentId, { visibility });

      return {
        ok: true,
        kind: "visibility",
        document: await enrichDocument(api, data as unknown as DocumentRecord),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function replaceFileAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    try {
      const api = getApiClient();
      const documentId = String(formData.get("documentId") ?? "").trim();
      const file = formData.get("file");

      if (!documentId || !(file instanceof File) || file.size === 0) {
        return { ok: false, error: "Document ID and replacement file are required." };
      }

      const current = await api.documents.get(documentId) as unknown as DocumentRecord;
      if (!current) {
        return { ok: false, error: "Document record not found." };
      }

      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const data = await api.documents.upload({
        file: blob,
        organizationId: current.organization_id,
        name: current.name || current.title || "document",
        visibility: current.visibility || "org",
        bucket: current.storage_bucket || "documents",
        documentId,
        currentVersion: Number(current.current_version ?? 1),
      });

      return {
        ok: true,
        kind: "replaced",
        document: await enrichDocument(api, data as unknown as DocumentRecord),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function deleteDocumentAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    try {
      const api = getApiClient();
      const documentId = String(formData.get("documentId") ?? "").trim();
      const confirmation = String(formData.get("confirmation") ?? "").trim();

      if (!documentId) {
        return { ok: false, error: "Document ID is required." };
      }

      if (confirmation !== "DELETE") {
        return { ok: false, error: "Type DELETE to remove this document record." };
      }

      await api.documents.remove(documentId);

      return { ok: true, kind: "deleted", documentId };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function bulkVisibilityAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    try {
      const api = getApiClient();
      const ids = formData.getAll("documentIds").map(String).filter(Boolean);
      const requestedVisibility = String(formData.get("bulkVisibility") ?? "").trim();
      const visibility = ALLOWED_VISIBILITY.includes(requestedVisibility as DocumentVisibility)
        ? requestedVisibility
        : null;

      if (!ids.length) {
        return { ok: false, error: "Select at least one document." };
      }

      if (!visibility) {
        return { ok: false, error: "Select a valid visibility value." };
      }

      await api.documents.bulkMetadata({ documentIds: ids, visibility });

      return { ok: true, kind: "bulk_visibility", ids, visibility };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  async function bulkDeleteAction(formData: FormData): Promise<ActionResult> {
    "use server";
    await requireAdminAccess();

    try {
      const api = getApiClient();
      const ids = formData.getAll("documentIds").map(String).filter(Boolean);
      const confirmation = String(formData.get("deleteConfirmation") ?? "").trim();

      if (!ids.length) {
        return { ok: false, error: "Select at least one document." };
      }

      if (confirmation !== "DELETE") {
        return { ok: false, error: "Type DELETE to bulk remove document records." };
      }

      for (const id of ids) {
        try {
          await api.documents.remove(id);
        } catch {
          // skip already-deleted docs
        }
      }

      return { ok: true, kind: "bulk_deleted", ids };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      };
    }
  }

  const [organizations, docsResult] = await Promise.all([
    api.organizations.list(),
    api.documents.list({}),
  ]);
  const rows = docsResult.items ?? [];

  const orgMap = new Map<string, string>(
    (organizations as { id: string; name?: string | null }[]).map((org) => [
      org.id,
      org.name ?? "Unknown organization",
    ]),
  );

  const docs = await Promise.all(
    (rows as DocumentRecord[]).map((doc) => enrichDocument(api, doc, orgMap)),
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Documents" }]} />
      <AdminSubnav current="documents" />
      <AdminDocumentsCenterClient
        documents={docs}
        organizations={organizations as { id: string; name?: string | null }[]}
        createDocumentAction={createDocumentAction}
        updateMetadataAction={updateMetadataAction}
        updateVisibilityAction={updateVisibilityAction}
        replaceFileAction={replaceFileAction}
        deleteDocumentAction={deleteDocumentAction}
        bulkVisibilityAction={bulkVisibilityAction}
        bulkDeleteAction={bulkDeleteAction}
        bulkFolderAction={bulkFolderAction}
        bulkMetadataAction={bulkMetadataAction}
      />
    </div>
  );
}

