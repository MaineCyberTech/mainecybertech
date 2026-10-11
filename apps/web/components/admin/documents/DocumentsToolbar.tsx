import type { RefObject } from "react";
import {
  VISIBILITY_OPTIONS,
  type FilterChip,
  type OrganizationRecord,
  type ViewMode,
} from "./types";

export default function DocumentsToolbar({
  search,
  onSearchChange,
  searchRef,
  organizations,
  orgFilter,
  onOrgFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  viewMode,
  onViewModeChange,
  onSelectAllVisible,
  onClearSelection,
  activeFilterChips,
  onClearFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  organizations: OrganizationRecord[];
  orgFilter: string;
  onOrgFilterChange: (value: string) => void;
  visibilityFilter: string;
  onVisibilityFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  activeFilterChips: FilterChip[];
  onClearFilters: () => void;
}) {
  return (
    <section className="cyber-panel">
      <div className="flex flex-wrap items-end gap-4 xl:gap-5">
        <div className="min-w-[260px] flex-[1.4_1_320px]">
          <label className="cyber-label" htmlFor="doc-search">
            Search
          </label>
          <input
            id="doc-search"
            ref={searchRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="cyber-input"
            placeholder="Search by name, path, org, ID, or type..."
          />
        </div>
        <div className="min-w-[220px] flex-[1_1_220px]">
          <label className="cyber-label" htmlFor="doc-organization">
            Organization
          </label>
          <select
            id="doc-organization"
            value={orgFilter}
            onChange={(e) => onOrgFilterChange(e.target.value)}
            className="cyber-input"
          >
            <option value="">All organizations</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name ?? organization.id}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-[0.8_1_220px]">
          <label className="cyber-label" htmlFor="doc-visibility">
            Visibility
          </label>
          <select
            id="doc-visibility"
            value={visibilityFilter}
            onChange={(e) => onVisibilityFilterChange(e.target.value)}
            className="cyber-input"
          >
            <option value="">All</option>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[230px] flex-[0.9_1_240px]">
          <span className="cyber-label">View</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "cyber-button" : "cyber-button-secondary"}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={viewMode === "table" ? "cyber-button" : "cyber-button-secondary"}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "cyber-button" : "cyber-button-secondary"}
            >
              Grid
            </button>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          <button type="button" className="cyber-button-secondary" onClick={onSelectAllVisible}>
            Select All Visible
          </button>
          <button type="button" className="cyber-button-secondary" onClick={onClearSelection}>
            Clear
          </button>
        </div>
      </div>
      {activeFilterChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200"
            >
              {chip.label} ×
            </button>
          ))}
          <button type="button" className="cyber-button-secondary" onClick={onClearFilters}>
            Clear all filters
          </button>
        </div>
      ) : null}
    </section>
  );
}
