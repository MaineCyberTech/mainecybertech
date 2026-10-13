"use client";

import { useState, useRef } from "react";
import { Button } from "@mct/ui/components/Button";
import { Input, Textarea } from "@mct/ui/components/Input";
import type {
  BulkActionResult,
  DocumentVisibility,
} from "@/app/(admin)/admin/documents/bulk-actions";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  selectedIds: string[];
  bulkFolderAction: (formData: FormData) => Promise<BulkActionResult>;
  bulkMetadataAction: (formData: FormData) => Promise<BulkActionResult>;
  onApplyFolderLocal: (folderPath: string, ids: string[]) => void;
  onApplyMetadataLocal: (
    updates: { description?: string; folder_path?: string; visibility?: DocumentVisibility },
    ids: string[],
  ) => void;
  onClearSelection: () => void;
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
  onRefresh,
}: Props) {
  const { pushToast } = useToast();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [folderValue, setFolderValue] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaFolder, setMetaFolder] = useState("");
  const [metaVisibility, setMetaVisibility] = useState<DocumentVisibility | "">("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const folderModalRef = useRef<HTMLDivElement>(null);
  const metadataModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(folderModalRef, showFolderModal);
  useFocusTrap(metadataModalRef, showMetadataModal);

  async function applyBulkFolder() {
    const nextFolder = folderValue.trim();
    if (!selectedIds.length) {
      pushToast("warning", "Select one or more documents first.", "Nothing selected");
      return;
    }
    if (!nextFolder) {
      pushToast("warning", "Enter a non-empty folder path to apply.", "Folder required");
      return;
    }

    const formData = new FormData();
    formData.set("folderPath", nextFolder);
    selectedIds.forEach((id) => formData.append("documentIds", id));

    try {
      setBusyKey("bulk-folder");
      const result = await bulkFolderAction(formData);
      if (!result.ok) {
        pushToast("error", result.error ?? "Unexpected error.", "Bulk folder failed");
        return;
      }
      const succeeded = result.ids ?? [];
      const failed = result.failed ?? [];
      onApplyFolderLocal(nextFolder, succeeded);
      if (failed.length) {
        pushToast(
          "warning",
          `${succeeded.length} succeeded, ${failed.length} failed (${failed
            .slice(0, 3)
            .map((f) => f.id)
            .join(", ")}${failed.length > 3 ? ", …" : ""}).`,
          "Folder reassigned with failures",
        );
      } else {
        pushToast(
          "success",
          `${succeeded.length} document(s) moved to ${nextFolder}.`,
          "Folder reassigned",
        );
      }
      setShowFolderModal(false);
      setFolderValue("");
      onRefresh?.();
    } finally {
      setBusyKey(null);
    }
  }

  async function applyBulkMetadata() {
    if (!selectedIds.length) {
      pushToast("warning", "Select one or more documents first.", "Nothing selected");
      return;
    }

    const safeDescription = metaDescription.trim();
    const safeFolder = metaFolder.trim();
    const safeVisibility = metaVisibility || undefined;

    if (!safeDescription && !safeFolder && !safeVisibility) {
      pushToast(
        "warning",
        "Safe apply rules skip blank values. Enter at least one non-empty field.",
        "No bulk fields provided",
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
        pushToast("error", result.error ?? "Unexpected error.", "Bulk metadata failed");
        return;
      }
      const succeeded = result.ids ?? [];
      const failed = result.failed ?? [];
      onApplyMetadataLocal(
        {
          ...(safeDescription ? { description: safeDescription } : {}),
          ...(safeFolder ? { folder_path: safeFolder } : {}),
          ...(safeVisibility ? { visibility: safeVisibility } : {}),
        },
        succeeded,
      );
      if (failed.length) {
        pushToast(
          "warning",
          `${succeeded.length} succeeded, ${failed.length} failed (${failed
            .slice(0, 3)
            .map((f) => f.id)
            .join(", ")}${failed.length > 3 ? ", …" : ""}).`,
          "Metadata applied with failures",
        );
      } else {
        pushToast(
          "success",
          `${succeeded.length} document(s) updated using safe apply rules.`,
          "Metadata applied",
        );
      }
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
      <section className="cyber-panel bg-cyber-card-deep/92 border border-emerald-500/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-50">
              {selectedIds.length} document(s) selected
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Safe apply rules are enabled: bulk metadata only updates non-empty values and never
              overwrites fields with blanks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFolderModal(true)}
            >
              Bulk folder reassignment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowMetadataModal(true)}
            >
              Bulk metadata edit
            </Button>
            <Button type="button" variant="secondary" onClick={onClearSelection}>
              Clear selection
            </Button>
          </div>
        </div>
      </section>

      {showFolderModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-folder-title"
            ref={folderModalRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowFolderModal(false);
            }}
            className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
          >
            <h3
              id="bulk-folder-title"
              className="font-display text-lg uppercase tracking-[0.12em] text-slate-50"
            >
              Bulk Folder Reassignment
            </h3>
            <p className="mt-3 text-sm text-slate-300">
              Apply one folder path across {selectedIds.length} selected document(s).
            </p>
            <div className="mt-4">
              <Input
                id="bulk-folder"
                label="Folder Path"
                value={folderValue}
                onChange={(e) => setFolderValue(e.target.value)}
                placeholder="Example: Client Uploads / Q2"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              This updates <span className="text-slate-300">folder_path</span> for the selected rows
              only.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFolderModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={busyKey === "bulk-folder"}
                onClick={() => {
                  void applyBulkFolder();
                }}
              >
                {busyKey === "bulk-folder" ? "Applying..." : "Apply Folder"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showMetadataModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-meta-title"
            ref={metadataModalRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowMetadataModal(false);
            }}
            className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
          >
            <h3
              id="bulk-meta-title"
              className="font-display text-lg uppercase tracking-[0.12em] text-slate-50"
            >
              Bulk Metadata Edit
            </h3>
            <p className="mt-3 text-sm text-slate-300">
              Safe apply rules are enabled: only non-empty fields below will be applied to the
              selected documents.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                id="bulk-meta-folder"
                label="Folder Path (optional)"
                value={metaFolder}
                onChange={(e) => setMetaFolder(e.target.value)}
                placeholder="Leave blank to keep current folders"
              />
              <div>
                <label className="cyber-label" htmlFor="bulk-visibility-optional">
                  Visibility (optional)
                </label>
                <select
                  id="bulk-visibility-optional"
                  value={metaVisibility}
                  onChange={(e) => setMetaVisibility(e.target.value as DocumentVisibility | "")}
                  className="cyber-input"
                >
                  <option value="">Keep current visibility</option>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Textarea
                id="bulk-description-optional"
                label="Description (optional)"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                placeholder="Leave blank to keep current descriptions"
              />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-cyber-card-deep/80 p-4 text-sm text-slate-400">
              <p>Safe apply summary:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Blank description will not overwrite existing descriptions.</li>
                <li>Blank folder path will not overwrite existing folders.</li>
                <li>No visibility choice means current visibility stays unchanged.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowMetadataModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={busyKey === "bulk-metadata"}
                onClick={() => {
                  void applyBulkMetadata();
                }}
              >
                {busyKey === "bulk-metadata" ? "Applying..." : "Apply Metadata"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
