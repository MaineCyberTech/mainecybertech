"use client";

import { useState } from "react";
import type { BulkActionResult, DocumentVisibility } from "@/app/(admin)/admin/documents/bulk-actions";

type Props = {
  selectedIds: string[];
  bulkFolderAction: (formData: FormData) => Promise<BulkActionResult>;
  bulkMetadataAction: (formData: FormData) => Promise<BulkActionResult>;
  onApplyFolderLocal: (folderPath: string, ids: string[]) => void;
  onApplyMetadataLocal: (updates: { description?: string; folder_path?: string; visibility?: DocumentVisibility }, ids: string[]) => void;
  onClearSelection: () => void;
  onToast: (tone: "success" | "warning" | "error" | "info", title: string, message: string) => void;
  onRefresh?: () => void;
};

const VISIBILITY_OPTIONS: DocumentVisibility[] = ["private", "org", "internal", "public"];

export default function AdminDocumentsBulkControls({
  selectedIds,
  bulkFolderAction,
  bulkMetadataAction,
  onApplyFolderLocal,
  onApplyMetadataLocal,
  onClearSelection,
  onToast,
  onRefresh,
}: Props) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [folderValue, setFolderValue] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaFolder, setMetaFolder] = useState("");
  const [metaVisibility, setMetaVisibility] = useState<DocumentVisibility | "">("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function applyBulkFolder() {
    const nextFolder = folderValue.trim();
    if (!selectedIds.length) {
      onToast("warning", "Nothing selected", "Select one or more documents first.");
      return;
    }
    if (!nextFolder) {
      onToast("warning", "Folder required", "Enter a non-empty folder path to apply.");
      return;
    }

    const formData = new FormData();
    formData.set("folderPath", nextFolder);
    selectedIds.forEach((id) => formData.append("documentIds", id));

    try {
      setBusyKey("bulk-folder");
      const result = await bulkFolderAction(formData);
      if (!result.ok) {
        onToast("error", "Bulk folder failed", result.error ?? "Unexpected error.");
        return;
      }
      onApplyFolderLocal(nextFolder, selectedIds);
      onToast("success", "Folder reassigned", `${selectedIds.length} document(s) moved to ${nextFolder}.`);
      setShowFolderModal(false);
      setFolderValue("");
      onRefresh?.();
    } finally {
      setBusyKey(null);
    }
  }

  async function applyBulkMetadata() {
    if (!selectedIds.length) {
      onToast("warning", "Nothing selected", "Select one or more documents first.");
      return;
    }

    const safeDescription = metaDescription.trim();
    const safeFolder = metaFolder.trim();
    const safeVisibility = metaVisibility || undefined;

    if (!safeDescription && !safeFolder && !safeVisibility) {
      onToast(
        "warning",
        "No bulk fields provided",
        "Safe apply rules skip blank values. Enter at least one non-empty field.",
      );
      return;
    }

    const formData = new FormData();
    if (safeDescription) formData.set("description", safeDescription);
    if (safeFolder) formData.set("folderPath", safeFolder);
    if (safeVisibility) formData.set("visibility", safeVisibility);
    selectedIds.forEach((id) => formData.append("documentIds", id));

    try {
      setBusyKey("bulk-metadata");
      const result = await bulkMetadataAction(formData);
      if (!result.ok) {
        onToast("error", "Bulk metadata failed", result.error ?? "Unexpected error.");
        return;
      }
      onApplyMetadataLocal(
        {
          ...(safeDescription ? { description: safeDescription } : {}),
          ...(safeFolder ? { folder_path: safeFolder } : {}),
          ...(safeVisibility ? { visibility: safeVisibility } : {}),
        },
        selectedIds,
      );
      onToast("success", "Metadata applied", `${selectedIds.length} document(s) updated using safe apply rules.`);
      setShowMetadataModal(false);
      setMetaDescription("");
      setMetaFolder("");
      setMetaVisibility("");
      onRefresh?.();
    } finally {
      setBusyKey(null);
    }
  }

  if (!selectedIds.length) return null;

  return (
    <>
      <section className="cyber-panel border border-emerald-500/20 bg-[#071018]/92">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-50">{selectedIds.length} document(s) selected</p>
            <p className="mt-1 text-sm text-slate-400">
              Safe apply rules are enabled: bulk metadata only updates non-empty values and never overwrites fields with blanks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="cyber-button-secondary" onClick={() => setShowFolderModal(true)}>
              Bulk folder reassignment
            </button>
            <button type="button" className="cyber-button-secondary" onClick={() => setShowMetadataModal(true)}>
              Bulk metadata edit
            </button>
            <button type="button" className="cyber-button-secondary" onClick={onClearSelection}>
              Clear selection
            </button>
          </div>
        </div>
      </section>

      {showFolderModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <h3 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">Bulk Folder Reassignment</h3>
            <p className="mt-3 text-sm text-slate-300">Apply one folder path across {selectedIds.length} selected document(s).</p>
            <div className="mt-4">
              <label className="cyber-label">Folder Path</label>
              <input value={folderValue} onChange={(e) => setFolderValue(e.target.value)} className="cyber-input" placeholder="Example: Client Uploads / Q2" />
            </div>
            <p className="mt-3 text-xs text-slate-500">This updates <span className="text-slate-300">folder_path</span> for the selected rows only.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="cyber-button-secondary" onClick={() => setShowFolderModal(false)}>Cancel</button>
              <button type="button" className="cyber-button" disabled={busyKey === "bulk-folder"} onClick={() => { void applyBulkFolder(); }}>{busyKey === "bulk-folder" ? "Applying..." : "Apply Folder"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {showMetadataModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <h3 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">Bulk Metadata Edit</h3>
            <p className="mt-3 text-sm text-slate-300">Safe apply rules are enabled: only non-empty fields below will be applied to the selected documents.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="cyber-label">Folder Path (optional)</label>
                <input value={metaFolder} onChange={(e) => setMetaFolder(e.target.value)} className="cyber-input" placeholder="Leave blank to keep current folders" />
              </div>
              <div>
                <label className="cyber-label">Visibility (optional)</label>
                <select value={metaVisibility} onChange={(e) => setMetaVisibility(e.target.value as DocumentVisibility | "")} className="cyber-input">
                  <option value="">Keep current visibility</option>
                  {VISIBILITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="cyber-label">Description (optional)</label>
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={4} className="cyber-input" placeholder="Leave blank to keep current descriptions" />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-[#071018]/80 p-4 text-sm text-slate-400">
              <p>Safe apply summary:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Blank description will not overwrite existing descriptions.</li>
                <li>Blank folder path will not overwrite existing folders.</li>
                <li>No visibility choice means current visibility stays unchanged.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="cyber-button-secondary" onClick={() => setShowMetadataModal(false)}>Cancel</button>
              <button type="button" className="cyber-button" disabled={busyKey === "bulk-metadata"} onClick={() => { void applyBulkMetadata(); }}>{busyKey === "bulk-metadata" ? "Applying..." : "Apply Metadata"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
