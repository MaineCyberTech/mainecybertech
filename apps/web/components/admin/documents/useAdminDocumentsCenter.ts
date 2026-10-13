"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  docDescription,
  docFolder,
  docName,
  docPath,
  docVisibility,
  fileType,
  orgName,
} from "./helpers";
import {
  UI_PREFS_KEY,
  type ConfirmState,
  type DocumentRecord,
  type DrawerTab,
  type FilterChip,
  type OrganizationRecord,
  type SortKey,
  type ViewMode,
  type VisibilityValue,
} from "./types";

/**
 * Document list state, filter/sort derivation and the small local mutators
 * (optimistic upsert/remove, selection, UI preferences). Server actions live
 * in useAdminDocumentActions so presentation components stay data-free.
 */
export function useAdminDocumentsCenter({
  documents,
  organizations,
}: {
  documents: DocumentRecord[];
  organizations: OrganizationRecord[];
}) {
  const [localDocuments, setLocalDocuments] = useState<DocumentRecord[]>(documents);
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
  const [inlineRenameId, setInlineRenameId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState("");
  const [inlineVisibilityId, setInlineVisibilityId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [bulkVisibilityValue, setBulkVisibilityValue] = useState<VisibilityValue | "">("");
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
      if (typeof prefs.visibilityFilter === "string") setVisibilityFilter(prefs.visibilityFilter);
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
      if (visibilityFilter && docVisibility(doc) !== visibilityFilter) return false;
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
  }, [localDocuments, orgFilter, visibilityFilter, search, sortKey, sortDir, orgMap]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const privateCount = useMemo(
    () => filtered.filter((doc) => docVisibility(doc) === "private").length,
    [filtered],
  );
  const internalCount = useMemo(
    () => filtered.filter((doc) => docVisibility(doc) === "internal").length,
    [filtered],
  );

  const activeFilterChips = useMemo(() => {
    const chips: FilterChip[] = [];
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
        ? cur.map((doc) => (doc.id === updated.id ? { ...doc, ...updated } : doc))
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
      visibility?: VisibilityValue;
    },
    ids: string[],
  ) {
    setLocalDocuments((cur) =>
      cur.map((doc) =>
        ids.includes(doc.id)
          ? {
              ...doc,
              ...(updates.description !== undefined ? { description: updates.description } : {}),
              ...(updates.folder_path !== undefined ? { folder_path: updates.folder_path } : {}),
              ...(updates.visibility !== undefined ? { visibility: updates.visibility } : {}),
            }
          : doc,
      ),
    );

    ids.forEach((id) => markSuccess(id, "Bulk updated"));
  }

  function toggleSelection(id: string) {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id]));
  }

  function toggleSort(next: SortKey) {
    if (sortKey === next) setSortDir((cur) => (cur === "asc" ? "desc" : "asc"));
    else {
      setSortKey(next);
      setSortDir(next === "updated" ? "desc" : "asc");
    }
  }

  function resetFilters() {
    setSearch("");
    setOrgFilter("");
    setVisibilityFilter("");
  }

  function selectAllVisible() {
    setSelectedIds(visibleItems.map((item) => item.id));
  }

  return {
    localDocuments,
    setLocalDocuments,
    search,
    setSearch,
    orgFilter,
    setOrgFilter,
    visibilityFilter,
    setVisibilityFilter,
    sortKey,
    setSortKey,
    sortDir,
    viewMode,
    setViewMode,
    selectedIds,
    setSelectedIds,
    selectedSet,
    drawerId,
    setDrawerId,
    drawerTab,
    setDrawerTab,
    drawerDoc,
    expandedId,
    setExpandedId,
    showCreateModal,
    setShowCreateModal,
    visibleCount,
    setVisibleCount,
    inlineRenameId,
    setInlineRenameId,
    inlineNameValue,
    setInlineNameValue,
    inlineVisibilityId,
    setInlineVisibilityId,
    busyId,
    setBusyId,
    successMap,
    setSuccessMap,
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
    visibleItems,
    privateCount,
    internalCount,
    activeFilterChips,
    markSuccess,
    upsertDocument,
    removeDocuments,
    applyBulkFolderLocal,
    applyBulkMetadataLocal,
    toggleSelection,
    toggleSort,
    resetFilters,
    selectAllVisible,
  };
}

export type AdminDocumentsCenterState = ReturnType<typeof useAdminDocumentsCenter>;
