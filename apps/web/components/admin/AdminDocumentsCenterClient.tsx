"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmModal from "./documents/ConfirmModal";
import CreateDocumentModal from "./documents/CreateDocumentModal";
import DocumentDrawer from "./documents/DocumentDrawer";
import DocumentLibrary from "./documents/DocumentLibrary";
import DocumentsBulkBar from "./documents/DocumentsBulkBar";
import DocumentsHeader from "./documents/DocumentsHeader";
import DocumentsToolbar from "./documents/DocumentsToolbar";
import { docName, docPath } from "./documents/helpers";
import type { AdminDocumentsCenterProps, VisibilityValue } from "./documents/types";
import { useAdminDocumentActions } from "./documents/useAdminDocumentActions";
import { useAdminDocumentsCenter } from "./documents/useAdminDocumentsCenter";

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
}: AdminDocumentsCenterProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const state = useAdminDocumentsCenter({ documents, organizations });
  const actions = useAdminDocumentActions({
    state,
    createDocumentAction,
    updateMetadataAction,
    updateVisibilityAction,
    replaceFileAction,
    deleteDocumentAction,
    bulkVisibilityAction,
    bulkDeleteAction,
    pushToast,
    router,
  });

  const {
    localDocuments,
    search,
    setSearch,
    orgFilter,
    setOrgFilter,
    visibilityFilter,
    setVisibilityFilter,
    viewMode,
    setViewMode,
    selectedIds,
    setSelectedIds,
    selectedSet,
    setDrawerId,
    drawerTab,
    setDrawerTab,
    drawerDoc,
    expandedId,
    setExpandedId,
    showCreateModal,
    setShowCreateModal,
    visibleItems,
    visibleCount,
    setVisibleCount,
    inlineRenameId,
    setInlineRenameId,
    inlineNameValue,
    setInlineNameValue,
    inlineVisibilityId,
    setInlineVisibilityId,
    busyId,
    successMap,
    confirmState,
    setConfirmState,
    bulkVisibilityValue,
    setBulkVisibilityValue,
    createFormRef,
    createFileRef,
    searchRef,
    droppedFileName,
    setDroppedFileName,
    orgMap,
    filtered,
    privateCount,
    internalCount,
    activeFilterChips,
    applyBulkFolderLocal,
    applyBulkMetadataLocal,
    toggleSelection,
    toggleSort,
    resetFilters,
    selectAllVisible,
  } = state;

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
          void actions.confirmBulkAction();
        }}
        onClose={() => setConfirmState(null)}
      />
      <ConfirmModal
        open={confirmState?.type === "bulkVisibility"}
        title="Update visibility"
        body={`Set ${selectedCount} selected document${selectedCount === 1 ? "" : "s"} to ${confirmState?.type === "bulkVisibility" ? confirmState.visibility : "the selected value"}?`}
        confirmLabel="Apply visibility"
        onConfirm={() => {
          void actions.confirmBulkAction();
        }}
        onClose={() => setConfirmState(null)}
      />

      <ConfirmModal
        open={confirmState?.type === "deleteDocument"}
        title="Delete document"
        body={
          confirmState?.type === "deleteDocument"
            ? `Delete ${docName(confirmState.doc)}? This removes the record and attempts storage cleanup.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (confirmState?.type === "deleteDocument") {
            void actions.deleteDocument(confirmState.doc);
          }
        }}
        onClose={() => setConfirmState(null)}
      />

      <DocumentsHeader
        totalCount={localDocuments.length}
        selectedCount={selectedCount}
        privateCount={privateCount}
        internalCount={internalCount}
        onCreate={() => setShowCreateModal(true)}
        onRefresh={() => router.refresh()}
      />

      <DocumentsToolbar
        search={search}
        onSearchChange={setSearch}
        searchRef={searchRef}
        organizations={organizations}
        orgFilter={orgFilter}
        onOrgFilterChange={setOrgFilter}
        visibilityFilter={visibilityFilter}
        onVisibilityFilterChange={setVisibilityFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectAllVisible={selectAllVisible}
        onClearSelection={() => setSelectedIds([])}
        activeFilterChips={activeFilterChips}
        onClearFilters={resetFilters}
      />

      {selectedCount > 0 ? (
        <DocumentsBulkBar
          selectedIds={selectedIds}
          bulkVisibilityValue={bulkVisibilityValue}
          onBulkVisibilityValueChange={setBulkVisibilityValue}
          busyId={busyId}
          onRequestBulkVisibility={() => {
            if (bulkVisibilityValue) {
              setConfirmState({
                type: "bulkVisibility",
                visibility: bulkVisibilityValue as VisibilityValue,
              });
            }
          }}
          onRequestBulkDelete={() => setConfirmState({ type: "bulkDelete" })}
          bulkFolderAction={bulkFolderAction}
          bulkMetadataAction={bulkMetadataAction}
          onApplyFolderLocal={applyBulkFolderLocal}
          onApplyMetadataLocal={applyBulkMetadataLocal}
          onClearSelection={() => setSelectedIds([])}
          onRefresh={() => router.refresh()}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <DocumentLibrary
          viewMode={viewMode}
          onToggleSort={toggleSort}
          filteredCount={filtered.length}
          visibleItems={visibleItems}
          hasMore={visibleCount < filtered.length}
          onLoadMore={() => setVisibleCount((cur) => cur + 24)}
          selectedSet={selectedSet}
          onToggleSelection={toggleSelection}
          orgMap={orgMap}
          inlineRenameId={inlineRenameId}
          inlineNameValue={inlineNameValue}
          onInlineNameValueChange={setInlineNameValue}
          onStartRename={(doc) => {
            setInlineRenameId(doc.id);
            setInlineNameValue(docName(doc));
          }}
          onCommitRename={(doc) => {
            void actions.saveInlineRename(doc);
          }}
          onCancelRename={() => setInlineRenameId(null)}
          inlineVisibilityId={inlineVisibilityId}
          onStartVisibility={(doc) => setInlineVisibilityId(doc.id)}
          onCommitVisibility={(doc, visibility) => {
            void actions.saveVisibility(doc, visibility);
          }}
          onCancelVisibility={() => setInlineVisibilityId(null)}
          expandedId={expandedId}
          onToggleExpanded={(id) => setExpandedId((cur) => (cur === id ? null : id))}
          onCancelQuickEdit={() => setExpandedId(null)}
          onQuickEditSubmit={(event, doc) => {
            void actions.submitMetadataForm(event, doc);
          }}
          busyId={busyId}
          successMap={successMap}
          onOpenDrawer={(id) => {
            setDrawerId(id);
            setDrawerTab("overview");
          }}
          onCopyPath={(doc) => {
            void actions.copyText(docPath(doc), "Storage path");
          }}
          onRequestDelete={actions.requestDeleteDocument}
          onCreate={() => setShowCreateModal(true)}
          onResetFilters={resetFilters}
        />

        <aside className="space-y-6">
          <section className="cyber-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="cyber-heading text-lg">Polish Notes</h2>
              <span className="cyber-pill">2.2.3.3b</span>
            </div>
            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-cyber-card-deep/80 p-4 text-sm text-slate-400">
              <p>• Bulk actions still confirm before destructive updates.</p>
              <p>• Active filters remain surfaced as removable chips.</p>
              <p>
                • Safe bulk folder reassignment and metadata editing are now mounted without
                replacing the working 2.2.3.3 preview and drawer behavior.
              </p>
              <p>
                • Local optimistic updates keep row badges and list state responsive after bulk
                edits.
              </p>
            </div>
          </section>
        </aside>
      </div>

      <CreateDocumentModal
        open={showCreateModal}
        organizations={organizations}
        busyId={busyId}
        formRef={createFormRef}
        fileRef={createFileRef}
        droppedFileName={droppedFileName}
        onFileSelectionChange={(files) =>
          setDroppedFileName(
            Array.from(files ?? [])
              .map((file) => file.name)
              .join(", "),
          )
        }
        onSubmit={(event) => {
          void actions.submitCreate(event);
        }}
        onClose={() => setShowCreateModal(false)}
      />

      <DocumentDrawer
        doc={drawerDoc}
        orgMap={orgMap}
        tab={drawerTab}
        onTabChange={setDrawerTab}
        busyId={busyId}
        successMap={successMap}
        onClose={() => setDrawerId(null)}
        onMetadataSubmit={(event, doc) => {
          void actions.submitMetadataForm(event, doc);
        }}
        onReplaceSubmit={(event, doc) => {
          void actions.submitReplaceFile(event, doc);
        }}
        onDelete={actions.requestDeleteDocument}
        onCopyPath={(doc) => {
          void actions.copyText(docPath(doc), "Storage path");
        }}
        onVisibilityChange={(doc, visibility) => {
          void actions.saveVisibility(doc, visibility);
        }}
        onGoToPreview={() => setDrawerTab("preview")}
      />
    </div>
  );
}
