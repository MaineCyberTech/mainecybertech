"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { BulkActionResult } from "@/app/(portal)/portal/documents/bulk-actions";

type DocumentRecord = Record<string, any> & {
  id: string;
  resolved_url?: string | null;
  file_extension?: string | null;
  preview_kind?: "image" | "pdf" | "text" | "video" | "audio" | "office" | "download";
};

type ViewMode = "list" | "table" | "grid";
type SortKey = "updated" | "name" | "type";

type Props = {
  documents: DocumentRecord[];
  organizationId: string;
  uploadAction: (formData: FormData) => Promise<{ ok: boolean; error?: string; document?: any }>;
  bulkFolderAction?: (formData: FormData) => Promise<BulkActionResult>;
  bulkMetadataAction?: (formData: FormData) => Promise<BulkActionResult>;
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function docName(doc: DocumentRecord) {
  return doc.display_name ?? doc.title ?? doc.name ?? doc.file_name ?? `Document ${doc.id?.slice(0, 8)}`;
}

function docExtension(filename?: string | null) {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

export default function PortalDocumentsCenterClient({ documents, organizationId, uploadAction, bulkFolderAction, bulkMetadataAction }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkFolderOpen, setBulkFolderOpen] = useState(false);
  const [bulkMetaOpen, setBulkMetaOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; kind: "success" | "error" }>>([]);

  const addToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const sorted = useMemo(() => {
    let list = [...documents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        docName(d).toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q) || (d.file_name ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = docName(a).localeCompare(docName(b));
      else if (sortKey === "type") cmp = (a.mime_type ?? "").localeCompare(b.mime_type ?? "");
      else cmp = (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "");
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [documents, search, sortKey, sortAsc]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelectedIds((prev) => prev.length === sorted.length ? [] : sorted.map((d) => d.id));
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!fd.get("file")) { addToast("Please select a file", "error"); return; }
    const res = await uploadAction(fd);
    if (res.ok) { addToast("Document uploaded successfully"); form.reset(); }
    else { addToast(res.error ?? "Upload failed", "error"); }
  }

  async function handleBulkFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bulkFolderAction) return;
    setBusy("folder");
    const fd = new FormData(e.currentTarget);
    fd.set("documentIds", JSON.stringify(selectedIds));
    const res = await bulkFolderAction(fd);
    if (res.ok) { addToast(`${res.updated} documents updated`); setSelectedIds([]); setBulkFolderOpen(false); }
    else { addToast(res.error ?? "Failed", "error"); }
    setBusy(null);
  }

  async function handleBulkMetadata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bulkMetadataAction) return;
    setBusy("metadata");
    const fd = new FormData(e.currentTarget);
    fd.set("documentIds", JSON.stringify(selectedIds));
    const res = await bulkMetadataAction(fd);
    if (res.ok) { addToast(`${res.updated} documents updated`); setSelectedIds([]); setBulkMetaOpen(false); }
    else { addToast(res.error ?? "Failed", "error"); }
    setBusy(null);
  }

  const hasBulk = !!bulkFolderAction && !!bulkMetadataAction;
  const sortIndicator = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-lg border px-4 py-3 text-sm ${t.kind === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
          {t.message}
        </div>
      ))}

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Upload Document</h2>
        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="cyber-label">Title</label><input name="name" className="cyber-input" placeholder="Document title..." required /></div>
            <div className="md:col-span-2"><label className="cyber-label">Description</label><textarea name="description" rows={3} className="cyber-input" placeholder="Optional notes..." /></div>
            <div><label className="cyber-label">File</label><input type="file" name="file" className="cyber-input" required /></div>
            <div><label className="cyber-label">Visibility</label><select name="visibility" className="cyber-input" defaultValue="org"><option value="org">Organization</option><option value="private">Private</option></select></div>
          </div>
          <button type="submit" className="cyber-button">Upload Document</button>
        </form>
      </section>

      <section className="cyber-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="cyber-heading text-lg">Document Library</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{sorted.length} documents</span>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              {(["list", "table", "grid"] as ViewMode[]).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${viewMode === mode ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="cyber-input flex-1 min-w-[200px]" />
        </div>

        {selectedIds.length > 0 && hasBulk ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <span className="text-sm font-medium text-slate-200">{selectedIds.length} selected</span>
            <button onClick={() => setBulkFolderOpen(true)} className="cyber-button-secondary text-xs">Set Folder</button>
            <button onClick={() => setBulkMetaOpen(true)} className="cyber-button-secondary text-xs">Edit Metadata</button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-slate-400 hover:text-slate-200 ml-auto">Clear</button>
          </div>
        ) : null}

        {bulkFolderOpen ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/80 p-4">
            <form onSubmit={handleBulkFolder} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]"><label className="cyber-label">Folder Path</label><input name="folderPath" className="cyber-input" placeholder="e.g. /Contracts/2026" required /></div>
              <button type="submit" disabled={busy === "folder"} className="cyber-button">{busy === "folder" ? "Applying..." : "Apply Folder"}</button>
              <button type="button" onClick={() => setBulkFolderOpen(false)} className="cyber-button-secondary">Cancel</button>
            </form>
          </div>
        ) : null}

        {bulkMetaOpen ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/80 p-4">
            <form onSubmit={handleBulkMetadata} className="space-y-3">
              <div><label className="cyber-label">Description</label><textarea name="description" rows={2} className="cyber-input" placeholder="New description..." /></div>
              <div><label className="cyber-label">Folder Path</label><input name="folderPath" className="cyber-input" placeholder="e.g. /Contracts/2026" /></div>
              <div className="flex gap-3">
                <button type="submit" disabled={busy === "metadata"} className="cyber-button">{busy === "metadata" ? "Applying..." : "Apply Metadata"}</button>
                <button type="button" onClick={() => setBulkMetaOpen(false)} className="cyber-button-secondary">Cancel</button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="mt-6">
          {sorted.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">No documents found.</div>
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {sorted.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:bg-[#0A1118]/80">
                  {hasBulk ? <input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleSelect(doc.id)} className="shrink-0 accent-emerald-600" /> : null}
                  <Link href={`/portal/documents/${doc.id}`} className="flex flex-1 items-center justify-between min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-50">{docName(doc)}</p>
                      <p className="mt-1 text-xs text-slate-500">{doc.file_name ?? ""} • {formatDate(doc.updated_at ?? doc.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ml-4 shrink-0">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{formatBytes(doc.file_size)}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{docExtension(doc.file_name) || (doc.mime_type ?? "?")}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {hasBulk ? <th className="px-3 py-2 w-10"><input type="checkbox" checked={selectedIds.length === sorted.length && sorted.length > 0} onChange={toggleAll} className="accent-emerald-600" /></th> : null}
                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 cursor-pointer select-none" onClick={() => { setSortKey("name"); setSortAsc(!(sortKey === "name" && !sortAsc)); }}>Name{sortIndicator("name")}</th>
                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Type</th>
                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Size</th>
                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 cursor-pointer select-none" onClick={() => { setSortKey("updated"); setSortAsc(!(sortKey === "updated" && !sortAsc)); }}>Updated{sortIndicator("updated")}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((doc) => (
                    <tr key={doc.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                      {hasBulk ? <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleSelect(doc.id)} className="accent-emerald-600" /></td> : null}
                      <td className="px-3 py-3 font-medium text-slate-50">{docName(doc)}</td>
                      <td className="px-3 py-3 text-slate-400">{docExtension(doc.file_name) || (doc.mime_type ?? "—")}</td>
                      <td className="px-3 py-3 text-slate-400">{formatBytes(doc.file_size)}</td>
                      <td className="px-3 py-3 text-slate-400">{formatDate(doc.updated_at ?? doc.created_at)}</td>
                      <td className="px-3 py-3"><Link href={`/portal/documents/${doc.id}`} className="text-emerald-400 hover:text-emerald-300 text-xs">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.slice(0, 30).map((doc) => (
                <Link key={doc.id} href={`/portal/documents/${doc.id}`}
                  className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80">
                  {doc.resolved_url ? (
                    <img src={doc.resolved_url} alt={docName(doc)} className="h-32 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-white/10 bg-[#071018] text-3xl text-slate-600">{docExtension(doc.file_name) || "📄"}</div>
                  )}
                  <p className="mt-3 truncate font-medium text-sm text-slate-50">{docName(doc)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatBytes(doc.file_size)} • {formatDate(doc.updated_at ?? doc.created_at)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
