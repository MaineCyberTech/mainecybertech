import type { BulkActionResult } from "@/app/(admin)/admin/documents/bulk-actions";
import type { ToastTone } from "@/components/ui/ToastProvider";

export type OrganizationRecord = { id: string; name?: string | null };
export type VisibilityValue = "private" | "org" | "internal" | "public";
export type DrawerTab = "overview" | "edit" | "file" | "preview";
export type ViewMode = "list" | "table" | "grid";
export type SortKey = "updated" | "name" | "organization" | "folder" | "type" | "visibility";

export type ActionResult = {
  ok: boolean;
  kind?: string;
  error?: string;
  document?: DocumentRecord;
  documentId?: string;
  ids?: string[];
  failed?: { id: string; error: string }[];
  visibility?: string;
};

export type DocumentRecord = Record<string, any> & {
  id: string;
  resolved_url?: string | null;
  display_name?: string;
  file_extension?: string | null;
  preview_kind?: "image" | "pdf" | "text" | "video" | "audio" | "office" | "download";
  organization_name?: string | null;
};

export type AdminDocumentsCenterProps = {
  documents: DocumentRecord[];
  organizations: OrganizationRecord[];
  createDocumentAction: (formData: FormData) => Promise<ActionResult>;
  updateMetadataAction: (formData: FormData) => Promise<ActionResult>;
  updateVisibilityAction: (formData: FormData) => Promise<ActionResult>;
  replaceFileAction: (formData: FormData) => Promise<ActionResult>;
  deleteDocumentAction: (formData: FormData) => Promise<ActionResult>;
  bulkVisibilityAction: (formData: FormData) => Promise<ActionResult>;
  bulkDeleteAction: (formData: FormData) => Promise<ActionResult>;
  bulkFolderAction: (formData: FormData) => Promise<BulkActionResult>;
  bulkMetadataAction: (formData: FormData) => Promise<BulkActionResult>;
};

export type ConfirmState =
  | null
  | { type: "bulkDelete" }
  | { type: "bulkVisibility"; visibility: VisibilityValue }
  | { type: "deleteDocument"; doc: DocumentRecord };

export type FilterChip = { key: string; label: string; clear: () => void };

export type PushToast = (tone: ToastTone, message: string, title?: string) => void;

export const VISIBILITY_OPTIONS: VisibilityValue[] = ["private", "org", "internal", "public"];
export const UI_PREFS_KEY = "admin-documents-ui-prefs-v2233";
