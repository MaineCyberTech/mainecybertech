import { useRef, type FormEvent } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatRelativeTime } from "@/lib/format";
import StatusPill from "./StatusPill";
import {
  canPreview,
  docBucket,
  docDescription,
  docFolder,
  docName,
  docPath,
  docVisibility,
  fileType,
  formatBytes,
  orgName,
  typeClass,
  visibilityClass,
} from "./helpers";
import {
  VISIBILITY_OPTIONS,
  type DocumentRecord,
  type DrawerTab,
  type VisibilityValue,
} from "./types";

export default function DocumentDrawer({
  doc,
  orgMap,
  tab,
  onTabChange,
  busyId,
  successMap,
  onClose,
  onMetadataSubmit,
  onReplaceSubmit,
  onDelete,
  onCopyPath,
  onVisibilityChange,
  onGoToPreview,
}: {
  doc: DocumentRecord | null;
  orgMap: Map<string, string>;
  tab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  busyId: string | null;
  successMap: Record<string, string>;
  onClose: () => void;
  onMetadataSubmit: (event: FormEvent<HTMLFormElement>, doc: DocumentRecord) => void;
  onReplaceSubmit: (event: FormEvent<HTMLFormElement>, doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
  onCopyPath: (doc: DocumentRecord) => void;
  onVisibilityChange: (doc: DocumentRecord, visibility: VisibilityValue) => void;
  onGoToPreview: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, Boolean(doc));
  if (!doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-drawer-title"
        ref={drawerRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="h-full w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-cyber-card-deep/95 px-6 py-4 backdrop-blur">
          <div>
            <h2
              id="doc-drawer-title"
              className="font-display text-xl uppercase tracking-[0.12em] text-slate-50"
            >
              {docName(doc)}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {orgName(doc, orgMap)} • {doc.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill docId={doc.id} busyId={busyId} successMap={successMap} />
            <button type="button" className="cyber-button-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-cyber-base/60 p-4 text-sm text-slate-400">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">
                Visibility
              </span>
              <span className="mt-2 inline-flex">
                <span className={visibilityClass(docVisibility(doc))}>{docVisibility(doc)}</span>
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-cyber-base/60 p-4 text-sm text-slate-400">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Type</span>
              <span className="mt-2 inline-flex">
                <span className={typeClass(fileType(doc))}>{fileType(doc)}</span>
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-cyber-base/60 p-4 text-sm text-slate-400">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">
                Version
              </span>
              <span className="mt-2 block font-semibold text-slate-50">
                {String(doc.current_version ?? 1)}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-cyber-base/60 p-4 text-sm text-slate-400">
              <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Size</span>
              <span className="mt-2 block font-semibold text-slate-50">
                {formatBytes(doc.file_size)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["overview", "edit", "file", "preview"] as DrawerTab[]).map((tabName) => (
              <button
                key={tabName}
                type="button"
                onClick={() => onTabChange(tabName)}
                className={tab === tabName ? "cyber-button" : "cyber-button-secondary"}
              >
                {tabName[0].toUpperCase() + tabName.slice(1)}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <section className="rounded-xl border border-white/10 bg-cyber-base/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Overview</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>
                  <span className="text-slate-400">Organization:</span> {orgName(doc, orgMap)}
                </p>
                <p>
                  <span className="text-slate-400">Folder:</span> {docFolder(doc)}
                </p>
                <p>
                  <span className="text-slate-400">Bucket:</span> {docBucket(doc)}
                </p>
                <p>
                  <span className="text-slate-400">Path:</span> {docPath(doc)}
                </p>
                <p>
                  <span className="text-slate-400">Resolved Link:</span>{" "}
                  {doc.resolved_url ?? "Unresolved"}
                </p>
                <p>
                  <span className="text-slate-400">Updated:</span>{" "}
                  {formatRelativeTime(doc.updated_at ?? doc.created_at)}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-cyber-card-deep/80 p-4 text-sm text-slate-400">
                {docDescription(doc)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {doc.resolved_url ? (
                  <a
                    href={doc.resolved_url}
                    target="_blank"
                    rel="noreferrer"
                    className="cyber-button-secondary"
                  >
                    Open
                  </a>
                ) : null}
                {doc.resolved_url && canPreview(doc) ? (
                  <button
                    type="button"
                    className="cyber-button-secondary"
                    onClick={onGoToPreview}
                  >
                    Go to Preview
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cyber-button-secondary"
                  onClick={() => onCopyPath(doc)}
                >
                  Copy Path
                </button>
              </div>
            </section>
          ) : null}

          {tab === "edit" ? (
            <section className="rounded-xl border border-white/10 bg-cyber-base/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Metadata Editor</p>
              <form
                onSubmit={(e) => {
                  onMetadataSubmit(e, doc);
                }}
                className="mt-4 space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="cyber-label" htmlFor="doc-name-3">
                      Name
                    </label>
                    <input
                      id="doc-name-3"
                      name="name"
                      className="cyber-input"
                      defaultValue={docName(doc)}
                      disabled={Boolean(busyId?.endsWith(doc.id))}
                    />
                  </div>
                  <div>
                    <label className="cyber-label" htmlFor="doc-folder-2">
                      Folder
                    </label>
                    <input
                      id="doc-folder-2"
                      name="category"
                      className="cyber-input"
                      defaultValue={String(doc.folder_path ?? "")}
                      disabled={Boolean(busyId?.endsWith(doc.id))}
                    />
                  </div>
                </div>
                <div>
                  <label className="cyber-label" htmlFor="doc-description-3">
                    Description
                  </label>
                  <textarea
                    id="doc-description-3"
                    name="description"
                    rows={4}
                    className="cyber-input"
                    defaultValue={String(doc.description ?? "")}
                    disabled={Boolean(busyId?.endsWith(doc.id))}
                  />
                </div>
                <div>
                  <label className="cyber-label" htmlFor="doc-storage-path-2">
                    Storage Path
                  </label>
                  <input
                    id="doc-storage-path-2"
                    name="storagePath"
                    className="cyber-input"
                    defaultValue={String(doc.storage_path ?? "")}
                    disabled={Boolean(busyId?.endsWith(doc.id))}
                  />
                </div>
                <div>
                  <label className="cyber-label" htmlFor="doc-visibility-3">
                    Visibility
                  </label>
                  <select
                    id="doc-visibility-3"
                    className="cyber-input"
                    defaultValue={docVisibility(doc)}
                    onChange={(e) => {
                      onVisibilityChange(doc, e.target.value as VisibilityValue);
                    }}
                    disabled={Boolean(busyId?.endsWith(doc.id))}
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
                    disabled={busyId === `metadata:${doc.id}`}
                  >
                    {busyId === `metadata:${doc.id}` ? "Saving..." : "Save metadata"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {tab === "file" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-xl border border-white/10 bg-cyber-base/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Replace File</p>
                <form
                  onSubmit={(e) => {
                    onReplaceSubmit(e, doc);
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="cyber-label" htmlFor="doc-bucket">
                      Bucket
                    </label>
                    <input
                      id="doc-bucket"
                      name="bucket"
                      className="cyber-input"
                      defaultValue={docBucket(doc)}
                      disabled={Boolean(busyId?.endsWith(doc.id))}
                    />
                  </div>
                  <div>
                    <label className="cyber-label" htmlFor="doc-replacement-file">
                      Replacement File
                    </label>
                    <input
                      id="doc-replacement-file"
                      type="file"
                      name="file"
                      className="cyber-input"
                      disabled={Boolean(busyId?.endsWith(doc.id))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="cyber-button"
                      disabled={busyId === `replace:${doc.id}`}
                    >
                      {busyId === `replace:${doc.id}` ? "Replacing..." : "Replace file"}
                    </button>
                  </div>
                </form>
              </section>
              <section className="rounded-xl border border-white/10 bg-cyber-base/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Danger Zone</p>
                <p className="mt-3 text-sm text-slate-400">
                  Deleting removes the record and attempts storage cleanup for the current file
                  path.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                    onClick={() => onDelete(doc)}
                    disabled={busyId === `delete:${doc.id}`}
                  >
                    {busyId === `delete:${doc.id}` ? "Deleting..." : "Delete document"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "preview" ? (
            <section className="rounded-xl border border-white/10 bg-cyber-base/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Preview</p>
              {doc.resolved_url && canPreview(doc) ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  {fileType(doc) === "Image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.resolved_url}
                      alt={docName(doc)}
                      className="max-h-[70vh] w-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={doc.resolved_url}
                      title={docName(doc)}
                      className="h-[70vh] w-full"
                    />
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-cyber-card-deep/80 p-4 text-sm text-slate-400">
                  Inline preview is not available for this file type. Use Open to view it in a new
                  tab. If the file should preview inline, verify the stored MIME type and extension
                  are accurate.
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {doc.resolved_url ? (
                  <a
                    href={doc.resolved_url}
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
                  onClick={() => onCopyPath(doc)}
                >
                  Copy Path
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
