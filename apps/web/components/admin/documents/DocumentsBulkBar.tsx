import type { BulkActionResult, DocumentVisibility } from "@/app/(admin)/admin/documents/bulk-actions";
import AdminDocumentsBulkControls from "@/components/admin/AdminDocumentsBulkControls";
import { VISIBILITY_OPTIONS, type VisibilityValue } from "./types";

export default function DocumentsBulkBar({
  selectedIds,
  bulkVisibilityValue,
  onBulkVisibilityValueChange,
  busyId,
  onRequestBulkVisibility,
  onRequestBulkDelete,
  bulkFolderAction,
  bulkMetadataAction,
  onApplyFolderLocal,
  onApplyMetadataLocal,
  onClearSelection,
  onRefresh,
}: {
  selectedIds: string[];
  bulkVisibilityValue: VisibilityValue | "";
  onBulkVisibilityValueChange: (value: VisibilityValue | "") => void;
  busyId: string | null;
  onRequestBulkVisibility: () => void;
  onRequestBulkDelete: () => void;
  bulkFolderAction: (formData: FormData) => Promise<BulkActionResult>;
  bulkMetadataAction: (formData: FormData) => Promise<BulkActionResult>;
  onApplyFolderLocal: (folderPath: string, ids: string[]) => void;
  onApplyMetadataLocal: (
    updates: { description?: string; folder_path?: string; visibility?: DocumentVisibility },
    ids: string[],
  ) => void;
  onClearSelection: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <section className="cyber-panel bg-cyber-card-deep/92 border border-emerald-500/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-50">
              {selectedIds.length} document
              {selectedIds.length === 1 ? "" : "s"} selected
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Review the action before it runs. Bulk changes now open a confirmation modal first.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={bulkVisibilityValue}
                onChange={(e) => onBulkVisibilityValueChange(e.target.value as VisibilityValue | "")}
                aria-label="Bulk visibility"
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
                disabled={!bulkVisibilityValue || busyId === "bulk-visibility"}
                onClick={onRequestBulkVisibility}
              >
                {busyId === "bulk-visibility" ? "Updating..." : "Update Visibility"}
              </button>
            </div>
            <button
              type="button"
              className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
              onClick={onRequestBulkDelete}
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
        onApplyFolderLocal={onApplyFolderLocal}
        onApplyMetadataLocal={onApplyMetadataLocal}
        onClearSelection={onClearSelection}
        onRefresh={onRefresh}
      />
    </>
  );
}
