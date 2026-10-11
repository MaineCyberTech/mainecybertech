import type { FormEvent } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { formatRelativeTime } from "@/lib/format";
import FileThumb from "./FileThumb";
import InlineNameEditor from "./InlineNameEditor";
import InlineVisibilityEditor from "./InlineVisibilityEditor";
import QuickEditPanel from "./QuickEditPanel";
import StatusPill from "./StatusPill";
import {
  chipClass,
  docBucket,
  docDescription,
  docFolder,
  docVisibility,
  fileType,
  formatBytes,
  orgName,
  typeClass,
  visibilityClass,
} from "./helpers";
import type { DocumentRecord, SortKey, ViewMode, VisibilityValue } from "./types";

export default function DocumentLibrary({
  viewMode,
  onToggleSort,
  filteredCount,
  visibleItems,
  hasMore,
  onLoadMore,
  selectedSet,
  onToggleSelection,
  orgMap,
  inlineRenameId,
  inlineNameValue,
  onInlineNameValueChange,
  onStartRename,
  onCommitRename,
  onCancelRename,
  inlineVisibilityId,
  onStartVisibility,
  onCommitVisibility,
  onCancelVisibility,
  expandedId,
  onToggleExpanded,
  onCancelQuickEdit,
  onQuickEditSubmit,
  busyId,
  successMap,
  onOpenDrawer,
  onCopyPath,
  onRequestDelete,
  onCreate,
  onResetFilters,
}: {
  viewMode: ViewMode;
  onToggleSort: (key: SortKey) => void;
  filteredCount: number;
  visibleItems: DocumentRecord[];
  hasMore: boolean;
  onLoadMore: () => void;
  selectedSet: Set<string>;
  onToggleSelection: (id: string) => void;
  orgMap: Map<string, string>;
  inlineRenameId: string | null;
  inlineNameValue: string;
  onInlineNameValueChange: (value: string) => void;
  onStartRename: (doc: DocumentRecord) => void;
  onCommitRename: (doc: DocumentRecord) => void;
  onCancelRename: () => void;
  inlineVisibilityId: string | null;
  onStartVisibility: (doc: DocumentRecord) => void;
  onCommitVisibility: (doc: DocumentRecord, visibility: VisibilityValue) => void;
  onCancelVisibility: () => void;
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
  onCancelQuickEdit: () => void;
  onQuickEditSubmit: (event: FormEvent<HTMLFormElement>, doc: DocumentRecord) => void;
  busyId: string | null;
  successMap: Record<string, string>;
  onOpenDrawer: (id: string) => void;
  onCopyPath: (doc: DocumentRecord) => void;
  onRequestDelete: (doc: DocumentRecord) => void;
  onCreate: () => void;
  onResetFilters: () => void;
}) {
  return (
    <section className="cyber-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="cyber-heading text-lg">Document Library</h2>
          <span className="cyber-pill">Filtered {filteredCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleSort("updated")}
            className="cyber-button-secondary"
          >
            Updated
          </button>
          <button type="button" onClick={() => onToggleSort("name")} className="cyber-button-secondary">
            Name
          </button>
          <button
            type="button"
            onClick={() => onToggleSort("organization")}
            className="cyber-button-secondary"
          >
            Org
          </button>
          <button
            type="button"
            onClick={() => onToggleSort("folder")}
            className="cyber-button-secondary"
          >
            Folder
          </button>
          <button
            type="button"
            onClick={() => onToggleSort("visibility")}
            className="cyber-button-secondary"
          >
            Visibility
          </button>
          <button
            type="button"
            onClick={() => onToggleSort("type")}
            className="cyber-button-secondary"
          >
            Type
          </button>
        </div>
      </div>

      {filteredCount === 0 ? (
        <EmptyState
          icon="🗂️"
          title="No documents found"
          description="Try clearing the search, switching the visibility filter, or creating a new document record."
          actionLabel="Create Document"
          actionOnClick={onCreate}
          secondaryLabel="Reset Filters"
          secondaryAction={onResetFilters}
        />
      ) : viewMode === "table" ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-cyber-card-deep/70">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-cyber-card-deep/95">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                <th scope="col" className="px-4 py-3">
                  Select
                </th>
                <th scope="col" className="px-4 py-3">
                  File
                </th>
                <th scope="col" className="px-4 py-3">
                  Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Organization
                </th>
                <th scope="col" className="px-4 py-3">
                  Folder
                </th>
                <th scope="col" className="px-4 py-3">
                  Visibility
                </th>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Updated
                </th>
                <th scope="col" className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-cyber-base/60">
              {visibleItems.map((document) => (
                <tr key={document.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedSet.has(document.id)}
                      onChange={() => onToggleSelection(document.id)}
                      aria-label="Select document"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <FileThumb doc={document} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>
                      <InlineNameEditor
                        doc={document}
                        editing={inlineRenameId === document.id}
                        value={inlineNameValue}
                        onChangeValue={onInlineNameValueChange}
                        onStart={onStartRename}
                        onCommit={onCommitRename}
                        onCancel={onCancelRename}
                        disabled={Boolean(busyId?.endsWith(document.id))}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{document.id}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={chipClass(orgName(document, orgMap), "org")}>
                      {orgName(document, orgMap)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={chipClass(docFolder(document), "folder")}>
                      {docFolder(document)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <InlineVisibilityEditor
                      doc={document}
                      editing={inlineVisibilityId === document.id}
                      onStart={onStartVisibility}
                      onCommit={onCommitVisibility}
                      onCancel={onCancelVisibility}
                      disabled={Boolean(busyId?.endsWith(document.id))}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={typeClass(fileType(document))}>{fileType(document)}</span>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-400">
                    {formatRelativeTime(document.updated_at ?? document.created_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill docId={document.id} busyId={busyId} successMap={successMap} />
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
                        onClick={() => onOpenDrawer(document.id)}
                      >
                        Drawer
                      </button>
                      <Link href={`/portal/documents/${document.id}`} className="cyber-button-secondary">
                        Portal
                      </Link>
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => onToggleExpanded(document.id)}
                      >
                        {expandedId === document.id ? "Hide Edit" : "Quick Edit"}
                      </button>
                      <button
                        type="button"
                        className="cyber-button-secondary"
                        onClick={() => onCopyPath(document)}
                      >
                        Copy Path
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                        onClick={() => onRequestDelete(document)}
                      >
                        Delete
                      </button>
                    </div>
                    <QuickEditPanel
                      doc={document}
                      open={expandedId === document.id}
                      busyId={busyId}
                      successMap={successMap}
                      onSubmit={onQuickEditSubmit}
                      onCancel={onCancelQuickEdit}
                    />
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
                  onChange={() => onToggleSelection(document.id)}
                  aria-label="Select document"
                />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div>
                    <InlineNameEditor
                      doc={document}
                      editing={inlineRenameId === document.id}
                      value={inlineNameValue}
                      onChangeValue={onInlineNameValueChange}
                      onStart={onStartRename}
                      onCommit={onCommitRename}
                      onCancel={onCancelRename}
                      disabled={Boolean(busyId?.endsWith(document.id))}
                    />
                  </div>
                  <StatusPill docId={document.id} busyId={busyId} successMap={successMap} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={visibilityClass(docVisibility(document))}>
                    {docVisibility(document)}
                  </span>
                  <span className={typeClass(fileType(document))}>{fileType(document)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={chipClass(orgName(document, orgMap), "org")}>
                    {orgName(document, orgMap)}
                  </span>
                  <span className={chipClass(docFolder(document), "folder")}>
                    {docFolder(document)}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm text-slate-400">{docDescription(document)}</p>
                <div className="rounded-xl border border-white/10 bg-cyber-card-deep/70 p-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Version</span>
                    <span>{String(document.current_version ?? 1)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Updated</span>
                    <span>{formatRelativeTime(document.updated_at ?? document.created_at)}</span>
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
                    onClick={() => onOpenDrawer(document.id)}
                  >
                    Drawer
                  </button>
                  <Link href={`/portal/documents/${document.id}`} className="cyber-button-secondary">
                    Portal
                  </Link>
                  <button
                    type="button"
                    className="cyber-button-secondary"
                    onClick={() => onToggleExpanded(document.id)}
                  >
                    {expandedId === document.id ? "Hide Edit" : "Quick Edit"}
                  </button>
                </div>
                <QuickEditPanel
                  doc={document}
                  open={expandedId === document.id}
                  busyId={busyId}
                  successMap={successMap}
                  onSubmit={onQuickEditSubmit}
                  onCancel={onCancelQuickEdit}
                />
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
                  onChange={() => onToggleSelection(document.id)}
                  aria-label="Select document"
                />
                <FileThumb doc={document} />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <InlineNameEditor
                      doc={document}
                      editing={inlineRenameId === document.id}
                      value={inlineNameValue}
                      onChangeValue={onInlineNameValueChange}
                      onStart={onStartRename}
                      onCommit={onCommitRename}
                      onCancel={onCancelRename}
                      disabled={Boolean(busyId?.endsWith(document.id))}
                    />
                    <InlineVisibilityEditor
                      doc={document}
                      editing={inlineVisibilityId === document.id}
                      onStart={onStartVisibility}
                      onCommit={onCommitVisibility}
                      onCancel={onCancelVisibility}
                      disabled={Boolean(busyId?.endsWith(document.id))}
                    />
                    <span className={typeClass(fileType(document))}>{fileType(document)}</span>
                    <span className={chipClass(orgName(document, orgMap), "org")}>
                      {orgName(document, orgMap)}
                    </span>
                    <span className={chipClass(docFolder(document), "folder")}>
                      {docFolder(document)}
                    </span>
                    <StatusPill docId={document.id} busyId={busyId} successMap={successMap} />
                  </div>
                  <p className="text-sm text-slate-400">{docDescription(document)}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>
                      Updated {formatRelativeTime(document.updated_at ?? document.created_at)}
                    </span>
                    <span>Bucket: {docBucket(document)}</span>
                    <span>Version: {String(document.current_version ?? 1)}</span>
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
                      onClick={() => onOpenDrawer(document.id)}
                    >
                      Drawer
                    </button>
                    <Link href={`/portal/documents/${document.id}`} className="cyber-button-secondary">
                      Portal
                    </Link>
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => onToggleExpanded(document.id)}
                    >
                      {expandedId === document.id ? "Hide Edit" : "Quick Edit"}
                    </button>
                    <button
                      type="button"
                      className="cyber-button-secondary"
                      onClick={() => onCopyPath(document)}
                    >
                      Copy Path
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                      onClick={() => onRequestDelete(document)}
                    >
                      Delete
                    </button>
                  </div>
                  <QuickEditPanel
                    doc={document}
                    open={expandedId === document.id}
                    busyId={busyId}
                    successMap={successMap}
                    onSubmit={onQuickEditSubmit}
                    onCancel={onCancelQuickEdit}
                  />
                </div>
              </div>
            </div>
          ))}
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button type="button" className="cyber-button-secondary" onClick={onLoadMore}>
                Load more
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
