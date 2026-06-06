"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 25;

type Membership = Record<string, any> & { id: string; user_id: string; organization_id: string; role_id: string };
type Profile = { id: string; full_name?: string | null; email?: string | null; is_super_admin?: boolean };
type Organization = { id: string; name?: string | null };
type Role = { id: string; name?: string | null };

type Props = {
  memberships: Membership[];
  profileMap: Record<string, Profile>;
  orgMap: Record<string, Organization>;
  roleMap: Record<string, Role>;
};

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
      {children}
      <button type="button" onClick={onRemove} className="ml-0.5 text-emerald-400 hover:text-emerald-200">&times;</button>
    </span>
  );
}

export default function AdminUsersClient({ memberships, profileMap, orgMap, roleMap }: Props) {
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const orgList = useMemo(() => {
    const seen = new Set<string>();
    const list: Organization[] = [];
    for (const m of memberships) {
      const org = orgMap[m.organization_id];
      if (org && !seen.has(org.id)) {
        seen.add(org.id);
        list.push(org);
      }
    }
    return list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [memberships, orgMap]);

  const filtered = useMemo(() => {
    let items = memberships;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((m) => {
        const p = profileMap[m.user_id];
        const name = (p?.full_name ?? "").toLowerCase();
        const email = (p?.email ?? "").toLowerCase();
        const id = m.user_id.toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }

    if (orgFilter) {
      items = items.filter((m) => m.organization_id === orgFilter);
    }

    if (statusFilter === "active") {
      items = items.filter((m) => m.status === "active");
    } else if (statusFilter === "inactive") {
      items = items.filter((m) => m.status !== "active");
    }

    return items;
  }, [memberships, search, orgFilter, statusFilter, profileMap]);

  const paginated = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = paginated.length < filtered.length;

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (search.trim()) activeFilters.push({ label: `Search: "${search}"`, onRemove: () => { setSearch(""); setPage(1); } });
  if (orgFilter) activeFilters.push({ label: `Org: ${(orgMap[orgFilter]?.name) ?? orgFilter}`, onRemove: () => { setOrgFilter(""); setPage(1); } });
  if (statusFilter !== "all") activeFilters.push({ label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter("all"); setPage(1); } });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or ID..."
            className="cyber-input w-full pl-9"
          />
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select value={orgFilter} onChange={(e) => { setOrgFilter(e.target.value); setPage(1); }} className="cyber-input max-w-[200px]">
          <option value="">All orgs</option>
          {orgList.map((org) => <option key={org.id} value={org.id}>{org.name ?? org.id}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="cyber-input max-w-[140px]">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => <Chip key={i} onRemove={f.onRemove}>{f.label}</Chip>)}
          <button type="button" className="text-xs text-slate-500 hover:text-slate-300 underline" onClick={() => { setSearch(""); setOrgFilter(""); setStatusFilter("all"); setPage(1); }}>Clear all</button>
        </div>
      ) : null}

      <div className="space-y-4">
        {paginated.length > 0 ? (
          paginated.map((membership) => {
            const profile = profileMap[membership.user_id] as Profile | undefined;
            const org = orgMap[membership.organization_id] as Organization | undefined;
            const role = roleMap[membership.role_id] as Role | undefined;

            return (
              <Link
                key={membership.id}
                href={`/admin/users/${membership.user_id}`}
                className="block glass-card glass-card-hover p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-50">
                      {profile?.full_name ?? "Unknown User"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {profile?.email ?? "No email"}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Org: {org?.name ?? "Unknown Org"} &middot; Role: {role?.name ?? "Unknown"} &middot; Status: {membership.status}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile?.is_super_admin ? (
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                        Super Admin
                      </span>
                    ) : null}

                    {membership.is_billing_contact ? (
                      <span className="cyber-pill-success">Billing Contact</span>
                    ) : null}

                    {membership.is_security_contact ? (
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                        Security Contact
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="cyber-panel text-slate-400">
            {search || orgFilter || statusFilter !== "all" ? "No users match your filters." : "No users found."}
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="text-center">
          <button type="button" className="cyber-button-secondary" onClick={() => setPage((p) => p + 1)}>Show more ({filtered.length - paginated.length} remaining)</button>
        </div>
      ) : null}
    </div>
  );
}
