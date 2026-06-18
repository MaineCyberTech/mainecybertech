"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminDocumentsBulkControls from "@/components/admin/AdminDocumentsBulkControls";
import EmptyState from "@/components/EmptyState";
import type {
  BulkActionResult,
  DocumentVisibility,
} from "@/app/(admin)/admin/documents/bulk-actions";

type OrganizationRecord = { id: string; name?: string | null };
type VisibilityValue = "private" | "org" | "internal" | "public";
type DrawerTab = "overview" | "edit" | "file" | "preview";
type ViewMode = "list" | "table" | "grid";
type SortKey =
  | "updated"
  | "name"
  | "organization"
  | "folder"
  | "type"
  | "visibility";
type ToastTone = "success" | "info" | "warning" | "error";
type Toast = { id: number; tone: ToastTone; title: string; message: string };
type ActionResult = {
  ok: boolean;
  kind?: string;
  error?: string;
  document?: DocumentRecord;
  documentId?: string;
  ids?: string[];
  visibility?: string;
};

type DocumentRecord = Record<string, any> & {
  id: string;
  resolved_url?: string | null;
  display_name?: string;
  file_extension?: string | null;
  preview_kind?:
    | "image"
    | "pdf"
    | "text"
    | "video"
    | "audio"
    | "office"
    | "download";
  organization_name?: string | null;
};

type Props = {
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

type ConfirmState =
  | null
  | { type: "bulkDelete" }
  | { type: "bulkVisibility"; visibility: VisibilityValue };

const VISIBILITY_OPTIONS: VisibilityValue[] = [
  "private",
  "org",
  "internal",
  "public",
];
const UI_PREFS_KEY = "admin-documents-ui-prefs-v2233";

function docName(doc: DocumentRecord) {
  return String(
    doc?.display_name ??
      doc?.title ??
      doc?.name ??
      doc?.file_name ??
      `Document ${doc?.id}`,
  );
}
function docDescription(doc: DocumentRecord) {
  return String(doc?.description ?? "No description provided.");
}
function docFolder(doc: DocumentRecord) {
  return String(doc?.folder_path ?? "General");
}
function docVisibility(doc: DocumentRecord): VisibilityValue {
  const value = String(doc?.visibility ?? "private").toLowerCase();
  return VISIBILITY_OPTIONS.includes(value as VisibilityValue)
    ? (value as VisibilityValue)
    : "private";
}
function docBucket(doc: DocumentRecord) {
  return String(doc?.storage_bucket ?? "documents");
}
function docPath(doc: DocumentRecord) {
  return String(doc?.storage_path ?? "");
}
function docFileName(doc: DocumentRecord) {
  return String(doc?.file_name ?? "");
}
function orgName(doc: DocumentRecord, orgMap: Map<string, string>) {
  return String(
    doc.organization_name ??
      orgMap.get(String(doc.organization_id ?? "")) ??
      doc.organization_id ??
      "—",
  );
}
function extension(value: string) {
  const clean = value.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}
function fileType(doc: DocumentRecord) {
  const mime = String(doc?.mime_type ?? "").toLowerCase();
  const ext = extension(docFileName(doc) || docPath(doc));
  if (mime.includes("pdf") || ext === "pdf") return "PDF";
  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)
  )
    return "Image";
  if (mime.includes("html") || ext === "html") return "HTML";
  if (mime.includes("markdown") || ext === "md") return "Markdown";
  if (
    mime.includes("text/") ||
    ["txt", "log", "json", "xml", "yaml", "yml", "csv"].includes(ext)
  )
    return "Text";
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    ["xlsx", "xls"].includes(ext)
  )
    return "Spreadsheet";
  if (mime.includes("word") || ["doc", "docx", "odt"].includes(ext))
    return "Document";
  return ext ? ext.toUpperCase() : "Unknown";
}
function canPreview(doc: DocumentRecord) {
  return (
    Boolean(doc?.resolved_url) &&
    ["PDF", "Image", "HTML", "Markdown", "Text"].includes(fileType(doc))
  );
}
function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}
function formatBytes(value?: number | null) {
  const size = Number(value ?? 0);
  if (!size) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let amount = size;
  while (amount >= 1024 && idx < units.length - 1) {
    amount /= 1024;
    idx += 1;
  }
  return `${amount.toFixed(amount >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
function visibilityClass(value: VisibilityValue) {
  if (value === "org")
    return "inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300";
  if (value === "internal")
    return "inline-flex min-h-8 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300";
  if (value === "public")
    return "inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300";
  return "inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300";
}
function typeClass(value: string) {
  if (value === "PDF")
    return "inline-flex min-h-8 items-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300";
  if (value === "Image")
    return "inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300";
  if (value === "Spreadsheet")
    return "inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300";
  if (value === "Document")
    return "inline-flex min-h-8 items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-300";
  if (["HTML", "Markdown", "Text"].includes(value))
    return "inline-flex min-h-8 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300";
  return "inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300";
}
function chipClass(seed: string, kind: "org" | "folder") {
  const palettes =
    kind === "org"
      ? [
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
          "border-blue-500/20 bg-blue-500/10 text-blue-200",
          "border-violet-500/20 bg-violet-500/10 text-violet-200",
          "border-amber-500/20 bg-amber-500/10 text-amber-200",
        ]
      : [
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
          "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200",
          "border-teal-500/20 bg-teal-500/10 text-teal-200",
          "border-orange-500/20 bg-orange-500/10 text-orange-200",
        ];
  const idx =
    Math.abs(Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) %
    palettes.length;
  return `inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${palettes[idx]}`;
}
function toastClass(tone: ToastTone) {
  if (tone === "success")
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (tone === "warning")
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  if (tone === "error") return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-blue-500/20 bg-blue-500/10 text-blue-200";
}

function FileThumb({
  doc,
  large = false,
}: {
  doc: DocumentRecord;
  large?: boolean;
}) {
  const type = fileType(doc);
  const size = large ? "h-36 w-full" : "h-14 w-14";
  if (type === "Image" && doc.resolved_url) {
    return (
      <img
        src={doc.resolved_url}
        alt={docName(doc)}
        className={`${size} rounded-xl object-cover ring-1 ring-white/10`}
      />
    );
  }
  const label =
    type === "Spreadsheet"
      ? "XL"
      : type === "Document"
        ? "DOC"
        : type === "Markdown"
          ? "MD"
          : type === "Unknown"
            ? "FILE"
            : type;
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-xl border border-white/10 bg-[#071018]/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 ring-1 ring-white/5`}
    >
      {label}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
        <h3 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">
          {title}
        </h3>
        <p className="mt-3 text-sm text-slate-300">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="cyber-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              danger
                ? "rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                : "cyber-button"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDocumentsCenterClient({
  documents,
  organizations,
  createDocumentAction,
  updateMetadataAction,
  updateVisibilityAction,
  replaceFileAction,
  deleteDocumentAction,
  bulkVisibilityAction,
  bulkDeleteAction,
  bulkFolderAction,
  bulkMetadataAction,
}: Props) {
  const router = useRouter();
  const [localDocuments, setLocalDocuments] =
    useState<DocumentRecord[]>(documents);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [inlineRenameId, setInlineRenameId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState("");
  const [inlineVisibilityId, setInlineVisibilityId] = useState<string | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [bulkVisibilityValue, setBulkVisibilityValue] = useState<
    VisibilityValue | ""
  >("");
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const createFileRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [droppedFileName, setDroppedFileName] = useState("");

  useEffect(() => setLocalDocuments(documents), [documents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(UI_PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as Partial<{
        search: string;
        orgFilter: string;
        visibilityFilter: string;
        sortKey: SortKey;
        sortDir: "asc" | "desc";
        viewMode: ViewMode;
      }>;
      if (typeof prefs.search === "string") setSearch(prefs.search);
      if (typeof prefs.orgFilter === "string") setOrgFilter(prefs.orgFilter);
      if (typeof prefs.visibilityFilter === "string")
        setVisibilityFilter(prefs.visibilityFilter);
      if (prefs.sortKey) setSortKey(prefs.sortKey);
      if (prefs.sortDir) setSortDir(prefs.sortDir);
      if (prefs.viewMode) setViewMode(prefs.viewMode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefs = {
      search,
      orgFilter,
      visibilityFilter,
      sortKey,
      sortDir,
      viewMode,
    };
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  }, [search, orgFilter, visibilityFilter, sortKey, sortDir, viewMode]);

  const orgMap = useMemo(
    () => new Map(organizations.map((o) => [o.id, o.name ?? o.id])),
    [organizations],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const drawerDoc = useMemo(
    () => localDocuments.find((doc) => doc.id === drawerId) ?? null,
    [localDocuments, drawerId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = localDocuments.filter((doc) => {
      if (orgFilter && String(doc.organization_id) !== orgFilter) return false;
      if (visibilityFilter && docVisibility(doc) !== visibilityFilter)
        return false;
      if (!q) return true;
      const haystack = [
        docName(doc),
        docDescription(doc),
        docFolder(doc),
        orgName(doc, orgMap),
        doc.id,
        docPath(doc),
        fileType(doc),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    items.sort((a, b) => {
      const left =
        sortKey === "name"
          ? docName(a).toLowerCase()
          : sortKey === "organization"
            ? orgName(a, orgMap).toLowerCase()
            : sortKey === "folder"
              ? docFolder(a).toLowerCase()
              : sortKey === "visibility"
                ? docVisibility(a)
                : sortKey === "type"
                  ? fileType(a).toLowerCase()
                  : String(a.updated_at ?? a.created_at ?? "");
      const right =
        sortKey === "name"
          ? docName(b).toLowerCase()
          : sortKey === "organization"
            ? orgName(b, orgMap).toLowerCase()
            : sortKey === "folder"
              ? docFolder(b).toLowerCase()
              : sortKey === "visibility"
                ? docVisibility(b)
                : sortKey === "type"
                  ? fileType(b).toLowerCase()
                  : String(b.updated_at ?? b.created_at ?? "");
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [
    localDocuments,
    orgFilter,
    visibilityFilter,
    search,
    sortKey,
    sortDir,
    orgMap,
  ]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const privateCount = useMemo(
    () => filtered.filter((doc) => docVisibility(doc) === "private").length,
    [filtered],
  );
  const internalCount = useMemo(
    () => filtered.filter((doc) => docVisibility(doc) === "internal").length,
    [filtered],
  );

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (search)
      chips.push({
        key: "search",
        label: `Search: ${search}`,
        clear: () => setSearch(""),
      });
    if (orgFilter) {
      const org = organizations.find((item) => item.id === orgFilter);
      chips.push({
        key: "org",
        label: `Org: ${org?.name ?? orgFilter}`,
        clear: () => setOrgFilter(""),
      });
    }
    if (visibilityFilter)
      chips.push({
        key: "visibility",
        label: `Visibility: ${visibilityFilter}`,
        clear: () => setVisibilityFilter(""),
      });
    return chips;
  }, [search, orgFilter, visibilityFilter, organizations]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable),
      );
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setShowCreateModal(true);
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setInlineRenameId(null);
        setInlineVisibilityId(null);
        setExpandedId(null);
        setDrawerId(null);
        setShowCreateModal(false);
        setConfirmState(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function pushToast(tone: ToastTone, title: string, message: string) {
    const toast = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tone,
      title,
      message,
    };
    setToasts((cur) => [toast, ...cur].slice(0, 4));
    window.setTimeout(
      () => setToasts((cur) => cur.filter((item) => item.id !== toast.id)),
      5000,
    );
  }

  function markSuccess(docId: string, label = "Saved") {
    setSuccessMap((cur) => ({ ...cur, [docId]: label }));
    window.setTimeout(() => {
      setSuccessMap((cur) => {
        const next = { ...cur };
        delete next[docId];
        return next;
      });
    }, 2400);
  }

  function upsertDocument(updated?: DocumentRecord | null) {
    if (!updated) return;
    setLocalDocuments((cur) => {
      const exists = cur.some((doc) => doc.id === updated.id);
      return exists
        ? cur.map((doc) =>
            doc.id === updated.id ? { ...doc, ...updated } : doc,
          )
        : [updated, ...cur];
    });
  }

  function removeDocuments(ids: string[]) {
    setLocalDocuments((cur) => cur.filter((doc) => !ids.includes(doc.id)));
    setSelectedIds((cur) => cur.filter((id) => !ids.includes(id)));
    if (drawerId && ids.includes(drawerId)) setDrawerId(null);
    if (expandedId && ids.includes(expandedId)) setExpandedId(null);
  }

  function applyBulkFolderLocal(folderPath: string, ids: string[]) {
    setLocalDocuments((cur) =>
      cur.map((doc) =>
        ids.includes(doc.id)
          ? {
              ...doc,
              folder_path: folderPath,
            }
          : doc,
      ),
    );

    ids.forEach((id) => markSuccess(id, "Folder updated"));
  }

  function applyBulkMetadataLocal(
    updates: {
      description?: string;
      folder_path?: string;
      visibility?: DocumentVisibility;
    },
    ids: string[],
  ) {
    setLocalDocuments((cur) =>
      cur.map((doc) =>
        ids.includes(doc.id)
          ? {
              ...doc,
              ...(updates.description !== undefined
                ? { description: updates.description }
                : {}),
              ...(updates.folder_path !== undefined
                ? { folder_path: updates.folder_path }
                : {}),
              ...(updates.visibility !== undefined
                ? { visibility: updates.visibility }
                : {}),
            }
          : doc,
      ),
    );

    ids.forEach((id) => markSuccess(id, "Bulk updated"));
  }

  function rowStatus(docId: string) {
    if (busyId?.endsWith(docId)) {
      if (busyId.startsWith("rename:")) return "Saving name...";
      if (busyId.startsWith("visibility:")) return "Saving visibility...";
      if (busyId.startsWith("metadata:")) return "Saving...";
      if (busyId.startsWith("replace:")) return "Replacing...";
      if (busyId.startsWith("delete:")) return "Deleting...";
      return "Working...";
    }
    return successMap[docId] ?? null;
  }

  function renderStatusPill(docId: string) {
    const status = rowStatus(docId);
    if (!status) return null;
    const success = Boolean(successMap[docId]) && !busyId?.endsWith(docId);
    return (
      <span
        className={
          success
            ? "inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300"
            : "inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
        }
      >
        {status}
      </span>
    );
  }

  async function executeAction(options: {
    busyKey?: string;
    optimistic?: () => void;
    rollback?: () => void;
    action: () => Promise<ActionResult>;
    onSuccess?: (result: ActionResult) => void;
    successTitle: string;
    successMessage: string;
    successDocId?: string | null;
    successLabel?: string;
  }) {
    const {
      busyKey,
      optimistic,
      rollback,
      action,
      onSuccess,
      successTitle,
      successMessage,
      successDocId,
      successLabel,
    } = options;
    try {
      if (busyKey) setBusyId(busyKey);
      optimistic?.();
      const result = await action();
      if (!result.ok) {
        rollback?.();
        pushToast(
          "error",
          "Action failed",
          result.error ?? "Unexpected error.",
        );
        return;
      }
      onSuccess?.(result);
      if (successDocId) markSuccess(successDocId, successLabel ?? "Saved");
      pushToast("success", successTitle, successMessage);
      router.refresh();
    } catch (error) {
      rollback?.();
      pushToast(
        "error",
        "Action failed",
        error instanceof Error ? error.message : "Unexpected error.",
      );
    } finally {
      if (busyKey) setBusyId((cur) => (cur == busyKey ? null : cur));
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast(
        "success",
        `${label} copied`,
        "The value was copied to your clipboard.",
      );
    } catch {
      pushToast(
        "error",
        "Copy failed",
        "Clipboard access was blocked by the browser.",
      );
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id],
    );
  }

  function toggleSort(next: SortKey) {
    if (sortKey === next) setSortDir((cur) => (cur === "asc" ? "desc" : "asc"));
    else {
      setSortKey(next);
      setSortDir(next === "updated" ? "desc" : "asc");
    }
  }

  async function saveInlineRename(doc: DocumentRecord) {
    const nextName = inlineNameValue.trim();
    if (!nextName || nextName === docName(doc)) {
      setInlineRenameId(null);
      return;
    }
    const snapshot = { ...doc };
    const optimisticDoc = {
      ...doc,
      name: nextName,
      title: nextName,
      display_name: nextName,
    };
    upsertDocument(optimisticDoc);
    const formData = new FormData();
    formData.set("documentId", doc.id);
    formData.set("name", nextName);
    formData.set("description", String(doc.description ?? ""));
    formData.set("category", String(doc.folder_path ?? ""));
    if (doc.storage_path) formData.set("storagePath", String(doc.storage_path));

    await executeAction({
      busyKey: `rename:${doc.id}`,
      rollback: () => upsertDocument(snapshot),
      action: () => updateMetadataAction(formData),
      onSuccess: (result) => {
        upsertDocument(result.document ?? optimisticDoc);
        setInlineRenameId(null);
      },
      successTitle: "Document renamed",
      successMessage: `${nextName} saved successfully.`,
      successDocId: doc.id,
      successLabel: "Renamed",
    });
  }

  async function saveVisibility(
    doc: DocumentRecord,
    visibility: VisibilityValue,
  ) {
    if (docVisibility(doc) === visibility) {
      setInlineVisibilityId(null);
      return;
    }
    const snapshot = { ...doc };
    const optimisticDoc = { ...doc, visibility };
    upsertDocument(optimisticDoc);
    const formData = new FormData();
    formData.set("documentId", doc.id);
    formData.set("visibility", visibility);

    await executeAction({
      busyKey: `visibility:${doc.id}`,
      rollback: () => upsertDocument(snapshot),
      action: () => updateVisibilityAction(formData),
      onSuccess: (result) => {
        upsertDocument(result.document ?? optimisticDoc);
        setInlineVisibilityId(null);
      },
      successTitle: "Visibility updated",
      successMessage: `${docName(doc)} is now ${visibility}.`,
      successDocId: doc.id,
      successLabel: "Visibility saved",
    });
  }

  async function submitMetadataForm(
    event: FormEvent<HTMLFormElement>,
    doc: DocumentRecord,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("documentId", doc.id);
    const nextName = String(formData.get("name") ?? "").trim() || docName(doc);
    const nextDescription = String(formData.get("description") ?? "");
    const nextFolder = String(formData.get("category") ?? "").trim();
    const nextStoragePath = String(formData.get("storagePath") ?? "").trim();

    const snapshot = { ...doc };
    const optimisticDoc: DocumentRecord = {
      ...doc,
      name: nextName,
      title: nextName,
      display_name: nextName,
      description: nextDescription || null,
      folder_path: nextFolder || null,
      storage_path: nextStoragePath || doc.storage_path || null,
    };
    upsertDocument(optimisticDoc);

    await executeAction({
      busyKey: `metadata:${doc.id}`,
      rollback: () => upsertDocument(snapshot),
      action: () => updateMetadataAction(formData),
      onSuccess: (result) => {
        upsertDocument(result.document ?? optimisticDoc);
      },
      successTitle: "Metadata updated",
      successMessage: `${nextName} was updated successfully.`,
      successDocId: doc.id,
      successLabel: "Metadata saved",
    });
  }

  async function submitReplaceFile(
    event: FormEvent<HTMLFormElement>,
    doc: DocumentRecord,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      pushToast(
        "warning",
        "Choose a file",
        "Select a replacement file before saving.",
      );
      return;
    }
    formData.set("documentId", doc.id);
    formData.set("bucket", String(formData.get("bucket") ?? docBucket(doc)));

    await executeAction({
      busyKey: `replace:${doc.id}`,
      action: () => replaceFileAction(formData),
      onSuccess: (result) => {
        upsertDocument(result.document);
      },
      successTitle: "File replaced",
      successMessage: `${file.name} uploaded and linked successfully.`,
      successDocId: doc.id,
      successLabel: "File replaced",
    });
  }

  async function deleteDocument(doc: DocumentRecord) {
    const confirmed = window.confirm(
      `Delete ${docName(doc)}? This removes the record and attempts storage cleanup.`,
    );
    if (!confirmed) return;
    const snapshot = { ...doc };
    removeDocuments([doc.id]);
    const formData = new FormData();
    formData.set("documentId", doc.id);
    formData.set("confirmation", "DELETE");

    await executeAction({
      busyKey: `delete:${doc.id}`,
      rollback: () => upsertDocument(snapshot),
      action: () => deleteDocumentAction(formData),
      onSuccess: () => {},
      successTitle: "Document deleted",
      successMessage: `${docName(doc)} was removed successfully.`,
    });
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = createFileRef.current?.files
      ? Array.from(createFileRef.current.files)
      : [];

    if (!String(formData.get("organizationId") ?? "").trim()) {
      pushToast(
        "warning",
        "Organization required",
        "Select an organization before creating a document.",
      );
      return;
    }

    if (files.length > 1) {
      for (const file of files) {
        const data = new FormData();
        data.set(
          "organizationId",
          String(formData.get("organizationId") ?? ""),
        );
        data.set(
          "name",
          String(formData.get("name") ?? "").trim() ||
            file.name.replace(/\.[^.]+$/, ""),
        );
        data.set("bucket", String(formData.get("bucket") ?? "documents"));
        data.set("category", String(formData.get("category") ?? ""));
        data.set("visibility", String(formData.get("visibility") ?? "private"));
        data.set("description", String(formData.get("description") ?? ""));
        data.set("file", file);
        const result = await createDocumentAction(data);
        if (!result.ok) {
          pushToast(
            "error",
            "Create failed",
            result.error ?? `Failed to create ${file.name}.`,
          );
          return;
        }
        upsertDocument(result.document);
      }
      pushToast(
        "success",
        "Documents created",
        `Created ${files.length} documents successfully.`,
      );
      setShowCreateModal(false);
      setDroppedFileName("");
      form.reset();
      router.refresh();
      return;
    }

    await executeAction({
      busyKey: "create",
      action: () => createDocumentAction(formData),
      onSuccess: (result) => {
        upsertDocument(result.document);
        setShowCreateModal(false);
        setDroppedFileName("");
        form.reset();
      },
      successTitle: "Document created",
      successMessage: "The document record was created successfully.",
      successDocId: null,
    });
  }

  async function confirmBulkAction() {
    if (!confirmState) return;
    if (confirmState.type === "bulkDelete") {
      const snapshot = localDocuments.map((doc) => ({ ...doc }));
      const removedIds = [...selectedIds];
      const formData = new FormData();
      formData.set("deleteConfirmation", "DELETE");
      removedIds.forEach((id) => formData.append("documentIds", id));
      removeDocuments(removedIds);
      setConfirmState(null);
      await executeAction({
        busyKey: "bulk-delete",
        rollback: () => {
          setLocalDocuments(snapshot);
          setSelectedIds(removedIds);
        },
        action: () => bulkDeleteAction(formData),
        onSuccess: () => setSelectedIds([]),
        successTitle: "Bulk delete complete",
        successMessage: `${removedIds.length} documents were removed.`,
      });
      return;
    }

    if (confirmState.type === "bulkVisibility") {
      const visibility = confirmState.visibility;
      const snapshot = localDocuments.map((doc) => ({ ...doc }));
      const formData = new FormData();
      formData.set("bulkVisibility", visibility);
      selectedIds.forEach((id) => formData.append("documentIds", id));
      setLocalDocuments((cur) =>
        cur.map((doc) =>
          selectedIds.includes(doc.id) ? { ...doc, visibility } : doc,
        ),
      );
      setConfirmState(null);
      await executeAction({
        busyKey: "bulk-visibility",
        rollback: () => setLocalDocuments(snapshot),
        action: () => bulkVisibilityAction(formData),
        onSuccess: () =>
          selectedIds.forEach((id) => markSuccess(id, "Bulk saved")),
        successTitle: "Bulk visibility updated",
        successMessage: `${selectedIds.length} documents updated successfully.`,
      });
    }
  }

  function renderInlineName(doc: DocumentRecord) {
    if (inlineRenameId !== doc.id) {
      return (
        <button
          type="button"
          className="font-medium text-slate-50 hover:text-emerald-300"
          onClick={() => {
            setInlineRenameId(doc.id);
            setInlineNameValue(docName(doc));
          }}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        >
          {docName(doc)}
        </button>
      );
    }
    return (
      <input
        value={inlineNameValue}
        onChange={(e) => setInlineNameValue(e.target.value)}
        onBlur={() => {
          void saveInlineRename(doc);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void saveInlineRename(doc);
          }
          if (e.key === "Escape") setInlineRenameId(null);
        }}
        className="cyber-input h-10"
        autoFocus
        disabled={Boolean(busyId?.endsWith(doc.id))}
      />
    );
  }

  function renderInlineVisibility(doc: DocumentRecord) {
    if (inlineVisibilityId !== doc.id) {
      return (
        <button
          type="button"
          className={visibilityClass(docVisibility(doc))}
          onClick={() => setInlineVisibilityId(doc.id)}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        >
          {docVisibility(doc)}
        </button>
      );
    }
    return (
      <select
        autoFocus
        className="cyber-input h-10 min-w-[140px]"
        defaultValue={docVisibility(doc)}
        onBlur={() => setInlineVisibilityId(null)}
        onChange={(e) => {
          void saveVisibility(doc, e.target.value as VisibilityValue);
        }}
        disabled={Boolean(busyId?.endsWith(doc.id))}
      >
        {VISIBILITY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  function quickEditPanel(doc: DocumentRecord) {
    if (expandedId !== doc.id) return null;
    return (
      <form
        onSubmit={(e) => {
          void submitMetadataForm(e, doc);
        }}
        className="mt-4 grid gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 md:grid-cols-2"
      >
        <div>
          <label className="cyber-label">Name</label>
          <input
            name="name"
            className="cyber-input"
            defaultValue={docName(doc)}
            disabled={Boolean(busyId?.endsWith(doc.id))}
          />
        </div>
        <div>
          <label className="cyber-label">Folder</label>
          <input
            name="category"
            className="cyber-input"
            defaultValue={String(doc.folder_path ?? "")}
            disabled={Boolean(busyId?.endsWith(doc.id))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="cyber-label">Description</label>
          <textarea
            name="description"
            rows={3}
            className="cyber-input"
            defaultValue={String(doc.description ?? "")}
            disabled={Boolean(busyId?.endsWith(doc.id))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="cyber-label">Storage Path</label>
          <input
            name="storagePath"
            className="cyber-input"
            defaultValue={String(doc.storage_path ?? "")}
            disabled={Boolean(busyId?.endsWith(doc.id))}
          />
        </div>
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          {renderStatusPill(doc.id)}
          <div className="flex gap-3">
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() => setExpandedId(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cyber-button"
              disabled={busyId === `metadata:${doc.id}`}
            >
              {busyId === `metadata:${doc.id}` ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={confirmState?.type === "bulkDelete"}
        title="Delete selected documents"
        body={`This will remove ${selectedCount} selected document${selectedCount === 1 ? "" : "s"} and attempt storage cleanup for each file path.`}
        confirmLabel="Delete selected"
        danger
        onConfirm={() => {
          void confirmBulkAction();
        }}
        onClose={() => setConfirmState(null)}
      />
      <ConfirmModal
        open={confirmState?.type === "bulkVisibility"}
        title="Update visibility"
        body={`Set ${selectedCount} selected document${selectedCount === 1 ? "" : "s"} to ${confirmState?.type === "bulkVisibility" ? confirmState.visibility : "the selected value"}?`}
        confirmLabel="Apply visibility"
        onConfirm={() => {
          void confirmBulkAction();
        }}
        onClose={() => setConfirmState(null)}
      />

      <div className="fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(2,6,23,0.30)] backdrop-blur ${toastClass(toast.tone)}`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
          </div>
        ))}
      </div>

      <section className="cyber-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
              Documents
            </h1>
            <p className="mt-3 text-slate-300">
              2.2.3.3b consolidates the working 2.2.3.3 layout with mounted bulk
              folder reassignment and safe bulk metadata actions.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#071018]/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                Total
              </span>
              <span className="mt-1 block font-semibold text-slate-50">
                {localDocuments.length}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#071018]/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                Selected
              </span>
              <span className="mt-1 block font-semibold text-slate-50">
                {selectedIds.length}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#071018]/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                Private
              </span>
              <span className="mt-1 block font-semibold text-slate-50">
                {privateCount}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#071018]/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                Internal
              </span>
              <span className="mt-1 block font-semibold text-slate-50">
                {internalCount}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="cyber-button shadow-[0_0_20px_rgba(5,150,105,0.18)]"
            onClick={() => setShowCreateModal(true)}
          >
            New Document
          </button>
          <button
            type="button"
            className="cyber-button-secondary"
            onClick={() => router.refresh()}
          >
            Refresh View
          </button>
        </div>
      </section>

      <section className="cyber-panel">
        <div className="flex flex-wrap items-end gap-4 xl:gap-5">
          <div className="min-w-[260px] flex-[1.4_1_320px]">
            <label className="cyber-label">Search</label>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cyber-input"
              placeholder="Search by name, path, org, ID, or type..."
            />
          </div>
          <div className="min-w-[220px] flex-[1_1_220px]">
            <label className="cyber-label">Organization</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="cyber-input"
            >
              <option value="">All organizations</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name ?? organization.id}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-[0.8_1_220px]">
            <label className="cyber-label">Visibility</label>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="cyber-input"
            >
              <option value="">All</option>
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[230px] flex-[0.9_1_240px]">
            <label className="cyber-label">View</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list"
                    ? "cyber-button"
                    : "cyber-button-secondary"
                }
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={
                  viewMode === "table"
                    ? "cyber-button"
                    : "cyber-button-secondary"
                }
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid"
                    ? "cyber-button"
                    : "cyber-button-secondary"
                }
              >
                Grid
              </button>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() =>
                setSelectedIds(visibleItems.map((item) => item.id))
              }
            >
              Select All Visible
            </button>
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
        {activeFilterChips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200"
              >
                {chip.label} ×
              </button>
            ))}
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() => {
                setSearch("");
                setOrgFilter("");
                setVisibilityFilter("");
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : null}
      </section>

      {selectedIds.length > 0 ? (
        <>
          <section className="cyber-panel border border-emerald-500/20 bg-[#071018]/92">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  {selectedIds.length} document
                  {selectedIds.length === 1 ? "" : "s"} selected
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Review the action before it runs. Bulk changes now open a
                  confirmation modal first.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={bulkVisibilityValue}
                    onChange={(e) =>
                      setBulkVisibilityValue(
                        e.target.value as VisibilityValue | "",
                      )
                    }
                    className="cyber-input min-w-[180px]"
                  >
                    <option value="">Set visibility...</option>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="cyber-button-secondary"
                    disabled={
                      !bulkVisibilityValue || busyId === "bulk-visibility"
                    }
                    onClick={() => {
                      if (bulkVisibilityValue) {
                        setConfirmState({
                          type: "bulkVisibility",
                          visibility: bulkVisibilityValue as VisibilityValue,
                        });
                      }
                    }}
                  >
                    {busyId === "bulk-visibility"
                      ? "Updating..."
                      : "Update Visibility"}
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                  onClick={() => setConfirmState({ type: "bulkDelete" })}
                  disabled={busyId === "bulk-delete"}
                >
                  {busyId === "bulk-delete" ? "Deleting..." : "Delete Selected"}
                </button>
              </div>
            </div>
          </section>

          <AdminDocumentsBulkControls
            selectedIds={selectedIds}
            bulkFolderAction={bulkFolderAction}
            bulkMetadataAction={bulkMetadataAction}
            onApplyFolderLocal={applyBulkFolderLocal}
            onApplyMetadataLocal={applyBulkMetadataLocal}
            onClearSelection={() => setSelectedIds([])}
            onToast={pushToast}
            onRefresh={() => router.refresh()}
          />
        </>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="cyber-panel">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="cyber-heading text-lg">Document Library</h2>
              <span className="cyber-pill">Filtered {filtered.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSort("updated")}
                className="cyber-button-secondary"
              >
                Updated
              </button>
              <button
                type="button"
                onClick={() => toggleSort("name")}
                className="cyber-button-secondary"
              >
                Name
              </button>
              <button
                type="button"
                onClick={() => toggleSort("organization")}
                className="cyber-button-secondary"
              >
                Org
              </button>
              <button
                type="button"
                onClick={() => toggleSort("folder")}
                className="cyber-button-secondary"
              >
                Folder
              </button>
              <button
                type="button"
                onClick={() => toggleSort("visibility")}
                className="cyber-button-secondary"
              >
                Visibility
              </button>
              <button
                type="button"
                onClick={() => toggleSort("type")}
                className="cyber-button-secondary"
              >
                Type
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title="No documents found"
              description="Try clearing the search, switching the visibility filter, or creating a new document record."
              actionLabel="Create Document"
              actionOnClick={() => setShowCreateModal(true)}
              secondaryLabel="Reset Filters"
              secondaryAction={() => {
                setSearch("");
                setOrgFilter("");
                setVisibilityFilter("");
              }}
            />
          ) : viewMode === "table" ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#071018]/70">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-[#071018]/95">
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-4 py-3">Select</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Folder</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-[#0A1118]/60">
                  {visibleItems.map((document) => (
                    <tr key={document.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedSet.has(document.id)}
                          onChange={() => toggleSelection(document.id)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <FileThumb doc={document} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>{renderInlineName(document)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {document.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={chipClass(
                            orgName(document, orgMap),
                            "org",
                          )}
                        >
                          {orgName(document, orgMap)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={chipClass(docFolder(document), "folder")}
                        >
                          {docFolder(document)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {renderInlineVisibility(document)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={typeClass(fileType(document))}>
                          {fileType(document)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-400">
                        {formatRelativeTime(
                          document.updated_at ?? document.created_at,
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          {renderStatusPill(document.id)}
                          {document.resolved_url ? (
                            <a
                              href={document.resolved_url}
                              target="_blank"
                              rel="noreferrer"
                              className="cyber-button-secondary"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                              Link unresolved
                            </span>
                          )}
                          <button
                            type="button"
                            className="cyber-button-secondary"
                            onClick={() => {
                              setDrawerId(document.id);
                              setDrawerTab("overview");
                            }}
                          >
                            Drawer
                          </button>
                          <Link
                            href={`/portal/documents/${document.id}`}
                            className="cyber-button-secondary"
                          >
                            Portal
                          </Link>
                          <button
                            type="button"
                            className="cyber-button-secondary"
                            onClick={() =>
                              setExpandedId(
                                expandedId === document.id ? null : document.id,
                              )
                            }
                          >
                            {expandedId === document.id
                              ? "Hide Edit"
                              : "Quick Edit"}
                          </button>
                          <button
                            type="button"
                            className="cyber-button-secondary"
                            onClick={() => {
                              void copyText(docPath(document), "Storage path");
                            }}
                          >
                            Copy Path
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                            onClick={() => {
                              void deleteDocument(document);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        {quickEditPanel(document)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "grid" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((document) => (
                <div
                  key={document.id}
                  className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,24,0.94),rgba(7,16,24,0.92))] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.24)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-full max-w-[calc(100%-28px)]">
                      <FileThumb doc={document} large />
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={selectedSet.has(document.id)}
                      onChange={() => toggleSelection(document.id)}
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div>{renderInlineName(document)}</div>
                      {renderStatusPill(document.id)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={visibilityClass(docVisibility(document))}
                      >
                        {docVisibility(document)}
                      </span>
                      <span className={typeClass(fileType(document))}>
                        {fileType(document)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={chipClass(orgName(document, orgMap), "org")}
                      >
                        {orgName(document, orgMap)}
                      </span>
                      <span
                        className={chipClass(docFolder(document), "folder")}
                      >
                        {docFolder(document)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-3">
                      {docDescription(document)}
                    </p>
                    <div className="rounded-xl border border-white/10 bg-[#071018]/70 p-3 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Version</span>
                        <span>{String(document.current_version ?? 1)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Updated</span>
                        <span>
                          {formatRelativeTime(
                            document.updated_at ?? document.created_at,
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Size</span>
                        <span>{formatBytes(document.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => {
                          setDrawerId(document.id);
                          setDrawerTab("overview");
                        }}
                      >
                        Drawer
                      </button>
                      <Link
                        href={`/portal/documents/${document.id}`}
                        className="cyber-button-secondary"
                      >
                        Portal
                      </Link>
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() =>
                          setExpandedId(
                            expandedId === document.id ? null : document.id,
                          )
                        }
                      >
                        {expandedId === document.id
                          ? "Hide Edit"
                          : "Quick Edit"}
                      </button>
                    </div>
                    {quickEditPanel(document)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleItems.map((document) => (
                <div
                  key={document.id}
                  className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,24,0.94),rgba(7,16,24,0.92))] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.24)] transition hover:border-emerald-500/20 hover:shadow-[0_22px_60px_rgba(5,150,105,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={selectedSet.has(document.id)}
                      onChange={() => toggleSelection(document.id)}
                    />
                    <FileThumb doc={document} />
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderInlineName(document)}
                        {renderInlineVisibility(document)}
                        <span className={typeClass(fileType(document))}>
                          {fileType(document)}
                        </span>
                        <span
                          className={chipClass(
                            orgName(document, orgMap),
                            "org",
                          )}
                        >
                          {orgName(document, orgMap)}
                        </span>
                        <span
                          className={chipClass(docFolder(document), "folder")}
                        >
                          {docFolder(document)}
                        </span>
                        {renderStatusPill(document.id)}
                      </div>
                      <p className="text-sm text-slate-400">
                        {docDescription(document)}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>
                          Updated{" "}
                          {formatRelativeTime(
                            document.updated_at ?? document.created_at,
                          )}
                        </span>
                        <span>Bucket: {docBucket(document)}</span>
                        <span>
                          Version: {String(document.current_version ?? 1)}
                        </span>
                        <span>Size: {formatBytes(document.file_size)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {document.resolved_url ? (
                          <a
                            href={document.resolved_url}
                            target="_blank"
                            rel="noreferrer"
                            className="cyber-button-secondary"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                            Link unresolved
                          </span>
                        )}
                        <button
                          type="button"
                          className="cyber-button-secondary"
                          onClick={() => {
                            setDrawerId(document.id);
                            setDrawerTab("overview");
                          }}
                        >
                          Drawer
                        </button>
                        <Link
                          href={`/portal/documents/${document.id}`}
                          className="cyber-button-secondary"
                        >
                          Portal
                        </Link>
                        <button
                          type="button"
                          className="cyber-button-secondary"
                          onClick={() =>
                            setExpandedId(
                              expandedId === document.id ? null : document.id,
                            )
                          }
                        >
                          {expandedId === document.id
                            ? "Hide Edit"
                            : "Quick Edit"}
                        </button>
                        <button
                          type="button"
                          className="cyber-button-secondary"
                          onClick={() => {
                            void copyText(docPath(document), "Storage path");
                          }}
                        >
                          Copy Path
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                          onClick={() => {
                            void deleteDocument(document);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      {quickEditPanel(document)}
                    </div>
                  </div>
                </div>
              ))}
              {visibleCount < filtered.length ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    className="cyber-button-secondary"
                    onClick={() => setVisibleCount((cur) => cur + 24)}
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="cyber-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="cyber-heading text-lg">Polish Notes</h2>
              <span className="cyber-pill">2.2.3.3b</span>
            </div>
            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-[#071018]/80 p-4 text-sm text-slate-400">
              <p>• Bulk actions still confirm before destructive updates.</p>
              <p>• Active filters remain surfaced as removable chips.</p>
              <p>
                • Safe bulk folder reassignment and metadata editing are now
                mounted without replacing the working 2.2.3.3 preview and drawer
                behavior.
              </p>
              <p>
                • Local optimistic updates keep row badges and list state
                responsive after bulk edits.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="font-orbitron text-xl uppercase tracking-[0.12em] text-slate-50">
                  Create Document
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add a new document record or upload one or more files.
                </p>
              </div>
              <button
                type="button"
                className="cyber-button-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
            <form
              ref={createFormRef}
              onSubmit={(e) => {
                void submitCreate(e);
              }}
              className="space-y-5 px-6 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="cyber-label">Organization</label>
                  <select
                    name="organizationId"
                    className="cyber-input"
                    defaultValue=""
                    required
                  >
                    <option value="">Select organization</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name ?? organization.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cyber-label">Name</label>
                  <input
                    name="name"
                    className="cyber-input"
                    placeholder="Optional for multi-file mode"
                  />
                </div>
                <div>
                  <label className="cyber-label">Storage Bucket</label>
                  <input
                    name="bucket"
                    className="cyber-input"
                    defaultValue="documents"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="cyber-label">Folder Path</label>
                  <input
                    name="category"
                    className="cyber-input"
                    placeholder="Optional folder/category"
                  />
                </div>
                <div>
                  <label className="cyber-label">Visibility</label>
                  <select
                    name="visibility"
                    className="cyber-input"
                    defaultValue="private"
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cyber-label">
                    Existing Storage Path (optional)
                  </label>
                  <input
                    name="fileUrl"
                    className="cyber-input"
                    placeholder="orgs/.../file.ext"
                  />
                </div>
              </div>
              <div>
                <label className="cyber-label">Upload File(s)</label>
                <div className="rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-5 text-center text-sm text-slate-300 transition hover:border-emerald-500/35 hover:bg-emerald-500/10">
                  <p className="font-semibold text-emerald-300">
                    Choose one or more files
                  </p>
                  <p className="mt-2 text-slate-400">
                    This consolidated pass preserves the working upload flow and
                    keeps the admin interactions aligned with 2.2.3.3.
                  </p>
                  <input
                    ref={createFileRef}
                    type="file"
                    name="file"
                    multiple
                    className="cyber-input mt-4"
                    onChange={(e) =>
                      setDroppedFileName(
                        Array.from(e.target.files ?? [])
                          .map((file) => file.name)
                          .join(", "),
                      )
                    }
                  />
                  {droppedFileName ? (
                    <p className="mt-3 text-emerald-300">
                      Selected: {droppedFileName}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="cyber-label">Description</label>
                <textarea name="description" rows={4} className="cyber-input" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="cyber-button-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cyber-button"
                  disabled={busyId === "create"}
                >
                  {busyId === "create" ? "Creating..." : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {drawerDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 p-4 backdrop-blur-sm">
          <div className="h-full w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#071018]/95 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="font-orbitron text-xl uppercase tracking-[0.12em] text-slate-50">
                  {docName(drawerDoc)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {orgName(drawerDoc, orgMap)} • {drawerDoc.id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {renderStatusPill(drawerDoc.id)}
                <button
                  type="button"
                  className="cyber-button-secondary"
                  onClick={() => setDrawerId(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4 text-sm text-slate-400">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                    Visibility
                  </span>
                  <span className="mt-2 inline-flex">
                    <span className={visibilityClass(docVisibility(drawerDoc))}>
                      {docVisibility(drawerDoc)}
                    </span>
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4 text-sm text-slate-400">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                    Type
                  </span>
                  <span className="mt-2 inline-flex">
                    <span className={typeClass(fileType(drawerDoc))}>
                      {fileType(drawerDoc)}
                    </span>
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4 text-sm text-slate-400">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                    Version
                  </span>
                  <span className="mt-2 block font-semibold text-slate-50">
                    {String(drawerDoc.current_version ?? 1)}
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4 text-sm text-slate-400">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                    Size
                  </span>
                  <span className="mt-2 block font-semibold text-slate-50">
                    {formatBytes(drawerDoc.file_size)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["overview", "edit", "file", "preview"] as DrawerTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDrawerTab(tab)}
                      className={
                        drawerTab === tab
                          ? "cyber-button"
                          : "cyber-button-secondary"
                      }
                    >
                      {tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                  ),
                )}
              </div>

              {drawerTab === "overview" ? (
                <section className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Overview
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>
                      <span className="text-slate-500">Organization:</span>{" "}
                      {orgName(drawerDoc, orgMap)}
                    </p>
                    <p>
                      <span className="text-slate-500">Folder:</span>{" "}
                      {docFolder(drawerDoc)}
                    </p>
                    <p>
                      <span className="text-slate-500">Bucket:</span>{" "}
                      {docBucket(drawerDoc)}
                    </p>
                    <p>
                      <span className="text-slate-500">Path:</span>{" "}
                      {docPath(drawerDoc)}
                    </p>
                    <p>
                      <span className="text-slate-500">Resolved Link:</span>{" "}
                      {drawerDoc.resolved_url ?? "Unresolved"}
                    </p>
                    <p>
                      <span className="text-slate-500">Updated:</span>{" "}
                      {formatRelativeTime(
                        drawerDoc.updated_at ?? drawerDoc.created_at,
                      )}
                    </p>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#071018]/80 p-4 text-sm text-slate-400">
                    {docDescription(drawerDoc)}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {drawerDoc.resolved_url ? (
                      <a
                        href={drawerDoc.resolved_url}
                        target="_blank"
                        rel="noreferrer"
                        className="cyber-button-secondary"
                      >
                        Open
                      </a>
                    ) : null}
                    {drawerDoc.resolved_url && canPreview(drawerDoc) ? (
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => setDrawerTab("preview")}
                      >
                        Go to Preview
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => {
                        void copyText(docPath(drawerDoc), "Storage path");
                      }}
                    >
                      Copy Path
                    </button>
                  </div>
                </section>
              ) : null}

              {drawerTab === "edit" ? (
                <section className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Metadata Editor
                  </p>
                  <form
                    onSubmit={(e) => {
                      void submitMetadataForm(e, drawerDoc);
                    }}
                    className="mt-4 space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="cyber-label">Name</label>
                        <input
                          name="name"
                          className="cyber-input"
                          defaultValue={docName(drawerDoc)}
                          disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                        />
                      </div>
                      <div>
                        <label className="cyber-label">Folder</label>
                        <input
                          name="category"
                          className="cyber-input"
                          defaultValue={String(drawerDoc.folder_path ?? "")}
                          disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="cyber-label">Description</label>
                      <textarea
                        name="description"
                        rows={4}
                        className="cyber-input"
                        defaultValue={String(drawerDoc.description ?? "")}
                        disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                      />
                    </div>
                    <div>
                      <label className="cyber-label">Storage Path</label>
                      <input
                        name="storagePath"
                        className="cyber-input"
                        defaultValue={String(drawerDoc.storage_path ?? "")}
                        disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                      />
                    </div>
                    <div>
                      <label className="cyber-label">Visibility</label>
                      <select
                        className="cyber-input"
                        defaultValue={docVisibility(drawerDoc)}
                        onChange={(e) => {
                          void saveVisibility(
                            drawerDoc,
                            e.target.value as VisibilityValue,
                          );
                        }}
                        disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                      >
                        {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="cyber-button"
                        disabled={busyId === `metadata:${drawerDoc.id}`}
                      >
                        {busyId === `metadata:${drawerDoc.id}`
                          ? "Saving..."
                          : "Save metadata"}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {drawerTab === "file" ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <section className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      Replace File
                    </p>
                    <form
                      onSubmit={(e) => {
                        void submitReplaceFile(e, drawerDoc);
                      }}
                      className="mt-4 space-y-4"
                    >
                      <div>
                        <label className="cyber-label">Bucket</label>
                        <input
                          name="bucket"
                          className="cyber-input"
                          defaultValue={docBucket(drawerDoc)}
                          disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                        />
                      </div>
                      <div>
                        <label className="cyber-label">Replacement File</label>
                        <input
                          type="file"
                          name="file"
                          className="cyber-input"
                          disabled={Boolean(busyId?.endsWith(drawerDoc.id))}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="cyber-button"
                          disabled={busyId === `replace:${drawerDoc.id}`}
                        >
                          {busyId === `replace:${drawerDoc.id}`
                            ? "Replacing..."
                            : "Replace file"}
                        </button>
                      </div>
                    </form>
                  </section>
                  <section className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      Danger Zone
                    </p>
                    <p className="mt-3 text-sm text-slate-400">
                      Deleting removes the record and attempts storage cleanup
                      for the current file path.
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                        onClick={() => {
                          void deleteDocument(drawerDoc);
                        }}
                        disabled={busyId === `delete:${drawerDoc.id}`}
                      >
                        {busyId === `delete:${drawerDoc.id}`
                          ? "Deleting..."
                          : "Delete document"}
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}

              {drawerTab === "preview" ? (
                <section className="rounded-xl border border-white/10 bg-[#0A1118]/60 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Preview
                  </p>
                  {drawerDoc.resolved_url && canPreview(drawerDoc) ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {fileType(drawerDoc) === "Image" ? (
                        <img
                          src={drawerDoc.resolved_url}
                          alt={docName(drawerDoc)}
                          className="max-h-[70vh] w-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={drawerDoc.resolved_url}
                          title={docName(drawerDoc)}
                          className="h-[70vh] w-full"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-white/10 bg-[#071018]/80 p-4 text-sm text-slate-400">
                      Inline preview is not available for this file type. Use
                      Open to view it in a new tab. If the file should preview
                      inline, verify the stored MIME type and extension are
                      accurate.
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {drawerDoc.resolved_url ? (
                      <a
                        href={drawerDoc.resolved_url}
                        target="_blank"
                        rel="noreferrer"
                        className="cyber-button-secondary"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                        Signed link missing
                      </span>
                    )}
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => {
                        void copyText(docPath(drawerDoc), "Storage path");
                      }}
                    >
                      Copy Path
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
