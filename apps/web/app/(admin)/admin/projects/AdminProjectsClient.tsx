"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  organization_id: string;
  external_jira_project_key?: string | null;
};
type Org = { id: string; name: string; slug: string };

const PAGE_SIZE = 25;

function projectStatusClass(status: string) {
  switch (status) {
    case "completed":
      return "cyber-pill-success";
    case "blocked":
      return "cyber-pill-danger";
    case "client_review":
      return "cyber-pill-warning";
    case "active":
      return "cyber-pill-warning";
    default:
      return "cyber-pill";
  }
}

function priorityClass(priority: string) {
  switch ((priority || "").toLowerCase()) {
    case "urgent":
      return "cyber-pill-danger";
    case "high":
      return "cyber-pill-warning";
    default:
      return "cyber-pill";
  }
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-emerald-400 hover:text-emerald-200"
      >
        &times;
      </button>
    </span>
  );
}

type Props = {
  projects: Project[];
  orgMap: Record<string, { name: string }>;
  allOrganizations: Org[];
  createProjectAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export default function AdminProjectsClient({
  projects,
  orgMap,
  allOrganizations,
  createProjectAction,
}: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let items = projects;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => {
        return p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      });
    }

    if (orgFilter) {
      items = items.filter((p) => p.organization_id === orgFilter);
    }

    if (statusFilter !== "all") {
      items = items.filter((p) => p.status === statusFilter);
    }

    return items;
  }, [projects, search, orgFilter, statusFilter]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (search.trim())
    activeFilters.push({
      label: `Search: "${search}"`,
      onRemove: () => {
        setSearch("");
        setPage(1);
      },
    });
  if (orgFilter)
    activeFilters.push({
      label: `Org: ${orgMap[orgFilter]?.name ?? orgFilter}`,
      onRemove: () => {
        setOrgFilter("");
        setPage(1);
      },
    });
  if (statusFilter !== "all")
    activeFilters.push({
      label: `Status: ${statusFilter}`,
      onRemove: () => {
        setStatusFilter("all");
        setPage(1);
      },
    });

  const allStatuses = useMemo(() => {
    const s = new Set(projects.map((p) => p.status));
    return ["all", ...Array.from(s).sort()];
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <input
            type="text"
            value={search}
            onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }, [])}
            placeholder="Search projects..."
            className="cyber-input w-full pl-9"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={orgFilter}
          onChange={(e) => {
            setOrgFilter(e.target.value);
            setPage(1);
          }}
          className="cyber-input max-w-[200px]"
        >
          <option value="">All orgs</option>
          {allOrganizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.slug})
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="cyber-input max-w-[160px]"
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All status" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <a href="/api/v1/projects/export?format=csv" className="cyber-button-secondary text-xs">
          Download CSV
        </a>
        <a href="/api/v1/projects/export?format=json" className="cyber-button-secondary text-xs">
          Download JSON
        </a>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => (
            <Chip key={i} onRemove={f.onRemove}>
              {f.label}
            </Chip>
          ))}
          <button
            type="button"
            className="text-xs text-slate-500 underline hover:text-slate-300"
            onClick={() => {
              setSearch("");
              setOrgFilter("");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Clear all
          </button>
        </div>
      ) : null}

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">
            {search || orgFilter || statusFilter !== "all"
              ? "Search Results"
              : `Project Queue (${projects.length})`}
          </h2>
          <div className="flex items-center gap-3">
            {search || orgFilter || statusFilter !== "all" ? (
              <span className="cyber-pill">
                {filtered.length} of {projects.length}
              </span>
            ) : null}
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() => setOpenModal(true)}
            >
              Create Project
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {paginated.length > 0 ? (
            paginated.map((project: any) => {
              const org = orgMap[project.organization_id];
              return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-50">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Org: {org?.name ?? "Unknown Org"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {project.description ?? "No project summary provided."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={projectStatusClass(project.status)}>{project.status}</span>
                      <span className={priorityClass(project.priority)}>{project.priority}</span>
                      {project.external_jira_project_key ? (
                        <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
                          {project.external_jira_project_key}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <EmptyState
              icon="📁"
              title="No projects found"
              description="There are no projects matching your current filters."
              actionLabel="Create Project"
              actionOnClick={() => setOpenModal(true)}
            />
          )}
        </div>
        {hasMore ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              className="cyber-button-secondary"
              onClick={() => setPage((p) => p + 1)}
            >
              Show more ({filtered.length - paginated.length} remaining)
            </button>
          </div>
        ) : null}
      </section>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-white/10 bg-[#071018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="font-orbitron text-xl uppercase tracking-[0.12em] text-slate-50">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Start a new project for a client organization.
                </p>
              </div>
              <button
                type="button"
                className="cyber-button-secondary"
                onClick={() => setOpenModal(false)}
              >
                Close
              </button>
            </div>
            <form
              action={(formData) => {
                startTransition(async () => {
                  const result = await createProjectAction(formData);
                  if (result.ok) setOpenModal(false);
                });
              }}
              className="space-y-4 px-6 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="cyber-label">Organization</label>
                  <select name="organizationId" className="cyber-input" required defaultValue="">
                    <option value="">Select organization</option>
                    {allOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cyber-label">Status</label>
                  <select name="status" defaultValue="planned" className="cyber-input">
                    <option value="planned">planned</option>
                    <option value="active">active</option>
                    <option value="blocked">blocked</option>
                    <option value="client_review">client_review</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="cyber-label">Project Name</label>
                  <input name="name" className="cyber-input" required />
                </div>
                <div className="md:col-span-2">
                  <label className="cyber-label">Description</label>
                  <textarea name="description" rows={3} className="cyber-input" />
                </div>
                <div>
                  <label className="cyber-label">Priority</label>
                  <input name="priority" defaultValue="normal" className="cyber-input" />
                </div>
                <div>
                  <label className="cyber-label">Jira Project Key</label>
                  <input
                    name="externalJiraProjectKey"
                    className="cyber-input font-mono text-xs"
                    placeholder="e.g. PROJ"
                  />
                </div>
                <div>
                  <label className="cyber-label">Start Date</label>
                  <input type="datetime-local" name="startsAt" className="cyber-input" />
                </div>
                <div>
                  <label className="cyber-label">Due Date</label>
                  <input type="datetime-local" name="dueAt" className="cyber-input" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="cyber-button-secondary"
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-button" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
