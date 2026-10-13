"use client";

import type { FormEvent } from "react";
import type { AdminDocumentsCenterState } from "./useAdminDocumentsCenter";
import { docBucket, docName, docVisibility } from "./helpers";
import type { ActionResult, DocumentRecord, PushToast, VisibilityValue } from "./types";

/**
 * Server-action wiring for the documents center: optimistic updates, rollback,
 * busy/success bookkeeping and toasts. Kept separate from the list state hook
 * so each file has a single responsibility.
 */
export function useAdminDocumentActions({
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
}: {
  state: AdminDocumentsCenterState;
  createDocumentAction: (formData: FormData) => Promise<ActionResult>;
  updateMetadataAction: (formData: FormData) => Promise<ActionResult>;
  updateVisibilityAction: (formData: FormData) => Promise<ActionResult>;
  replaceFileAction: (formData: FormData) => Promise<ActionResult>;
  deleteDocumentAction: (formData: FormData) => Promise<ActionResult>;
  bulkVisibilityAction: (formData: FormData) => Promise<ActionResult>;
  bulkDeleteAction: (formData: FormData) => Promise<ActionResult>;
  pushToast: PushToast;
  router: { refresh: () => void };
}) {
  const {
    setBusyId,
    setConfirmState,
    setDroppedFileName,
    setInlineRenameId,
    setInlineVisibilityId,
    setLocalDocuments,
    setSelectedIds,
    setShowCreateModal,
    createFileRef,
    confirmState,
    inlineNameValue,
    localDocuments,
    markSuccess,
    removeDocuments,
    selectedIds,
    upsertDocument,
  } = state;

  async function executeAction(options: {
    busyKey?: string;
    optimistic?: () => void;
    rollback?: () => void;
    action: () => Promise<ActionResult>;
    onSuccess?: (result: ActionResult) => void;
    successTitle: string;
    successMessage: string | ((result: ActionResult) => string);
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
        pushToast("error", result.error ?? "Unexpected error.", "Action failed");
        return;
      }
      onSuccess?.(result);
      if (successDocId) markSuccess(successDocId, successLabel ?? "Saved");
      pushToast(
        "success",
        typeof successMessage === "function" ? successMessage(result) : successMessage,
        successTitle,
      );
      router.refresh();
    } catch (error) {
      rollback?.();
      pushToast(
        "error",
        error instanceof Error ? error.message : "Unexpected error.",
        "Action failed",
      );
    } finally {
      if (busyKey) setBusyId((cur) => (cur == busyKey ? null : cur));
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast("success", "The value was copied to your clipboard.", `${label} copied`);
    } catch {
      pushToast("error", "Clipboard access was blocked by the browser.", "Copy failed");
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
    // USE-P3-004: send the row version the operator was looking at so a
    // concurrent edit is detected instead of overwritten.
    if (doc.version !== undefined && doc.version !== null) {
      formData.set("version", String(doc.version));
    }

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

  async function saveVisibility(doc: DocumentRecord, visibility: VisibilityValue) {
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
    // USE-P3-004: If-Match source for the server action.
    if (doc.version !== undefined && doc.version !== null) {
      formData.set("version", String(doc.version));
    }

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

  async function submitMetadataForm(event: FormEvent<HTMLFormElement>, doc: DocumentRecord) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("documentId", doc.id);
    // USE-P3-004: If-Match source for the server action.
    if (doc.version !== undefined && doc.version !== null) {
      formData.set("version", String(doc.version));
    }
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

  async function submitReplaceFile(event: FormEvent<HTMLFormElement>, doc: DocumentRecord) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      pushToast("warning", "Select a replacement file before saving.", "Choose a file");
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

  function requestDeleteDocument(doc: DocumentRecord) {
    setConfirmState({ type: "deleteDocument", doc });
  }

  async function deleteDocument(doc: DocumentRecord) {
    setConfirmState(null);
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
    const files = createFileRef.current?.files ? Array.from(createFileRef.current.files) : [];

    if (!String(formData.get("organizationId") ?? "").trim()) {
      pushToast(
        "warning",
        "Select an organization before creating a document.",
        "Organization required",
      );
      return;
    }

    if (files.length > 1) {
      for (const file of files) {
        const data = new FormData();
        data.set("organizationId", String(formData.get("organizationId") ?? ""));
        data.set(
          "name",
          String(formData.get("name") ?? "").trim() || file.name.replace(/\.[^.]+$/, ""),
        );
        data.set("bucket", String(formData.get("bucket") ?? "documents"));
        data.set("category", String(formData.get("category") ?? ""));
        data.set("visibility", String(formData.get("visibility") ?? "private"));
        data.set("description", String(formData.get("description") ?? ""));
        data.set("file", file);
        const result = await createDocumentAction(data);
        if (!result.ok) {
          pushToast("error", result.error ?? `Failed to create ${file.name}.`, "Create failed");
          return;
        }
        upsertDocument(result.document);
      }
      pushToast("success", `Created ${files.length} documents successfully.`, "Documents created");
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
        // Keep failed ids selected so the admin can retry just those.
        onSuccess: (result) => setSelectedIds(result.failed?.map((f) => f.id) ?? []),
        successTitle: "Bulk delete complete",
        successMessage: (result) => {
          const deleted = result.ids?.length ?? 0;
          const failedCount = result.failed?.length ?? 0;
          return failedCount
            ? `${deleted} of ${deleted + failedCount} documents were removed; ${failedCount} failed.`
            : `${deleted} documents were removed.`;
        },
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
        cur.map((doc) => (selectedIds.includes(doc.id) ? { ...doc, visibility } : doc)),
      );
      setConfirmState(null);
      await executeAction({
        busyKey: "bulk-visibility",
        rollback: () => setLocalDocuments(snapshot),
        action: () => bulkVisibilityAction(formData),
        onSuccess: (result) => {
          const succeeded = new Set(result.ids ?? []);
          setLocalDocuments(
            snapshot.map((doc) => (succeeded.has(doc.id) ? { ...doc, visibility } : doc)),
          );
          // Keep failed ids selected so the admin can retry just those.
          setSelectedIds(result.failed?.map((f) => f.id) ?? []);
          succeeded.forEach((id) => markSuccess(id, "Bulk saved"));
        },
        successTitle: "Bulk visibility updated",
        successMessage: (result) => {
          const updated = result.ids?.length ?? 0;
          const failed = result.failed ?? [];
          if (!failed.length) return `${updated} documents updated successfully.`;
          const ids = failed
            .slice(0, 3)
            .map((f) => f.id)
            .join(", ");
          return `${updated} of ${updated + failed.length} documents updated; ${failed.length} failed (${ids}${failed.length > 3 ? ", …" : ""}).`;
        },
      });
    }
  }

  return {
    copyText,
    saveInlineRename,
    saveVisibility,
    submitMetadataForm,
    submitReplaceFile,
    requestDeleteDocument,
    deleteDocument,
    submitCreate,
    confirmBulkAction,
  };
}
