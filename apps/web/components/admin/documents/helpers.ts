import { VISIBILITY_OPTIONS, type DocumentRecord, type VisibilityValue } from "./types";

export function docName(doc: DocumentRecord) {
  return String(
    doc?.display_name ?? doc?.title ?? doc?.name ?? doc?.file_name ?? `Document ${doc?.id}`,
  );
}
export function docDescription(doc: DocumentRecord) {
  return String(doc?.description ?? "No description provided.");
}
export function docFolder(doc: DocumentRecord) {
  return String(doc?.folder_path ?? "General");
}
export function docVisibility(doc: DocumentRecord): VisibilityValue {
  const value = String(doc?.visibility ?? "private").toLowerCase();
  return VISIBILITY_OPTIONS.includes(value as VisibilityValue)
    ? (value as VisibilityValue)
    : "private";
}
export function docBucket(doc: DocumentRecord) {
  return String(doc?.storage_bucket ?? "documents");
}
export function docPath(doc: DocumentRecord) {
  return String(doc?.storage_path ?? "");
}
export function docFileName(doc: DocumentRecord) {
  return String(doc?.file_name ?? "");
}
export function orgName(doc: DocumentRecord, orgMap: Map<string, string>) {
  return String(
    doc.organization_name ??
      orgMap.get(String(doc.organization_id ?? "")) ??
      doc.organization_id ??
      "—",
  );
}
export function extension(value: string) {
  const clean = value.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}
export function fileType(doc: DocumentRecord) {
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
  if (mime.includes("text/") || ["txt", "log", "json", "xml", "yaml", "yml", "csv"].includes(ext))
    return "Text";
  if (mime.includes("sheet") || mime.includes("excel") || ["xlsx", "xls"].includes(ext))
    return "Spreadsheet";
  if (mime.includes("word") || ["doc", "docx", "odt"].includes(ext)) return "Document";
  return ext ? ext.toUpperCase() : "Unknown";
}
export function canPreview(doc: DocumentRecord) {
  return (
    Boolean(doc?.resolved_url) &&
    ["PDF", "Image", "HTML", "Markdown", "Text"].includes(fileType(doc))
  );
}
export function formatBytes(value?: number | null) {
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
export function visibilityClass(value: VisibilityValue) {
  if (value === "org")
    return "inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300";
  if (value === "internal")
    return "inline-flex min-h-8 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300";
  if (value === "public")
    return "inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300";
  return "inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300";
}
export function typeClass(value: string) {
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
export function chipClass(seed: string, kind: "org" | "folder") {
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
    Math.abs(Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % palettes.length;
  return `inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${palettes[idx]}`;
}

/** Per-row busy/success label used by the status pills. */
export function rowStatus(
  busyId: string | null,
  successMap: Record<string, string>,
  docId: string,
) {
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

export function rowStatusSuccess(
  busyId: string | null,
  successMap: Record<string, string>,
  docId: string,
) {
  return Boolean(successMap[docId]) && !busyId?.endsWith(docId);
}
