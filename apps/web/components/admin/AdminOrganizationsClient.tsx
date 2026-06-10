"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 25;

type Organization = Record<string, any> & { id: string; name: string };

export default function AdminOrganizationsClient({ organizations }: { organizations: Organization[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    for (const o of organizations) {
      if (o.status) s.add(o.status);
    }
    return Array.from(s).sort();
  }, [organizations]);

  const filtered = useMemo(() => {
    let items = organizations;
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((o) =>
        [o.name, o.slug, o.primary_domain, o.id].some((f) => f && String(f).toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      items = items.filter((o) => o.status === statusFilter);
    }
    return items;
  }, [organizations, search, statusFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const chips: { label: string; onRemove: () => void }[] = [];
  if (search.trim()) chips.push({ label: `Search: "${search}"`, onRemove: () => { setSearch(""); setPage(1); } });
  if (statusFilter !== "all") chips.push({ label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter("all"); setPage(1); } });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search organizations..." aria-label="Search organizations"
            className="w-full rounded-lg border border-white/10 bg-[#0A1118] py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status"
          className="rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none">
          <option value="all">All statuses</option>
          {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {chip.label}
              <button type="button" onClick={chip.onRemove} className="ml-0.5 text-emerald-400 hover:text-emerald-200">&times;</button>
            </span>
          ))}
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-300">Clear all</button>
        </div>
      )}

      <div className="space-y-4">
        {paginated.length > 0 ? (
          paginated.map((org: Organization) => (
            <Link key={org.id} href={`/admin/organizations/${org.id}`} className="block glass-card glass-card-hover p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-50">{org.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Slug: {org.slug} &bull; Domain: {org.primary_domain ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="cyber-pill">{org.status}</span>
                  <span className="cyber-pill-success">{org.support_plan ?? "No Plan"}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="cyber-panel text-slate-400">No organizations found.</div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button type="button" onClick={() => setPage((p) => p + 1)} className="cyber-button-secondary text-sm">Show more</button>
        </div>
      )}

      <p className="text-xs text-slate-500">{filtered.length} organization{filtered.length !== 1 ? "s" : ""} found</p>
    </div>
  );
}
