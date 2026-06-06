"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";

const PAGE_SIZE = 25;

type TicketRecord = Record<string, any> & { id: string };
type OrganizationRecord = { id: string; name?: string | null };

type Props = {
  tickets: TicketRecord[];
  organizations: OrganizationRecord[];
  createTicketAction: (formData: FormData) => Promise<void>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
}

function ticketSubject(ticket: TicketRecord) {
  return ticket.subject ?? ticket.title ?? ticket.name ?? `Ticket ${ticket.id}`;
}

function ticketDescription(ticket: TicketRecord) {
  return ticket.description ?? ticket.details ?? ticket.body ?? ticket.message ?? null;
}

function ticketCategory(ticket: TicketRecord) {
  return ticket.category ?? ticket.type ?? ticket.classification ?? "Uncategorized";
}

function ticketStatus(ticket: TicketRecord) {
  return String(ticket.status ?? ticket.state ?? ticket.ticket_status ?? "new").toLowerCase();
}

function ticketPriority(ticket: TicketRecord) {
  return String(ticket.priority ?? ticket.severity ?? "normal").toLowerCase();
}

function assigneeLabel(ticket: TicketRecord) {
  return ticket.assignee_name ?? ticket.assigned_to_name ?? ticket.assigned_to_email ?? ticket.assigned_to ?? "Unassigned";
}

function isDeletedTicket(ticket: TicketRecord) {
  const title = String(ticket.title ?? ticket.subject ?? "");
  return Boolean(ticket.is_deleted ?? ticket.deleted ?? ticket.deleted_at ?? ticket.archived_at) || title.startsWith("[Deleted] ");
}

function isClosedStatus(status: string) {
  return ["resolved", "closed", "complete", "completed"].includes(status);
}

function statusPillClass(status: string) {
  if (isClosedStatus(status)) {
    return "inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-emerald-300";
  }
  if (["triaged", "pending", "waiting", "on_hold"].includes(status)) {
    return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
  }
  return "inline-flex min-h-9 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-blue-300";
}

function priorityPillClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-red-300";
    case "high":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
    default:
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-slate-300";
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <div className="flex items-center justify-between gap-3 whitespace-nowrap">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="text-base font-semibold text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function TicketCard({ ticket, orgMap }: { ticket: TicketRecord; orgMap: Map<string, string> }) {
  const status = ticketStatus(ticket);
  const priority = ticketPriority(ticket);
  return (
    <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-slate-50">{ticketSubject(ticket)}</p>
            {ticket.external_jsm_issue_key ? (
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">{ticket.external_jsm_issue_key}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">{ticketDescription(ticket) ?? "No description provided."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={statusPillClass(status)}>{status}</span>
          <span className={priorityPillClass(priority)}>{priority}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>Org: {orgMap.get(ticket.organization_id) ?? ticket.organization_id}</span>
        <span>Category: {ticketCategory(ticket)}</span>
        <span>Assignee: {assigneeLabel(ticket)}</span>
        <span title={formatDateTime(ticket.updated_at ?? ticket.created_at)}>Updated {formatRelativeTime(ticket.updated_at ?? ticket.created_at)}</span>
      </div>
    </Link>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
      {children}
      <button type="button" onClick={onRemove} className="ml-0.5 text-emerald-400 hover:text-emerald-200">&times;</button>
    </span>
  );
}

export default function AdminTicketCenterClient({ tickets, organizations, createTicketAction }: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">("updated");
  const [page, setPage] = useState(1);

  const visibleTickets = useMemo(() => tickets.filter((ticket) => !isDeletedTicket(ticket)), [tickets]);
  const orgMap = useMemo(() => new Map(organizations.map((org) => [org.id, org.name ?? org.id])), [organizations]);

  const filtered = useMemo(() => {
    let items = visibleTickets;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((t) => {
        const subject = ticketSubject(t).toLowerCase();
        const desc = (ticketDescription(t) ?? "").toLowerCase();
        const id = t.id.toLowerCase();
        return subject.includes(q) || desc.includes(q) || id.includes(q);
      });
    }

    if (orgFilter) {
      items = items.filter((t) => t.organization_id === orgFilter);
    }

    if (statusFilter === "open") {
      items = items.filter((t) => !isClosedStatus(ticketStatus(t)));
    } else if (statusFilter === "closed") {
      items = items.filter((t) => isClosedStatus(ticketStatus(t)));
    }

    items = [...items];
    if (sortBy === "newest") {
      items.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    } else if (sortBy === "oldest") {
      items.sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
    } else {
      items.sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());
    }

    return items;
  }, [visibleTickets, search, orgFilter, statusFilter, sortBy]);

  const paginated = useMemo(() => {
    const start = 0;
    const end = page * PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, page]);

  const hasMore = paginated.length < filtered.length;

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (search.trim()) activeFilters.push({ label: `Search: "${search}"`, onRemove: () => { setSearch(""); setPage(1); } });
  if (orgFilter) activeFilters.push({ label: `Org: ${orgMap.get(orgFilter) ?? orgFilter}`, onRemove: () => { setOrgFilter(""); setPage(1); } });
  if (statusFilter !== "all") activeFilters.push({ label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter("all"); setPage(1); } });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }, []);
  const handleOrgChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { setOrgFilter(e.target.value); setPage(1); }, []);
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value as any); setPage(1); }, []);
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { setSortBy(e.target.value as any); setPage(1); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Tickets</h1>
          <p className="mt-3 text-slate-300">Create and manage support tickets across client organizations.</p>
        </div>
        <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(true)}>Create Ticket</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Open Tickets" value={visibleTickets.filter((t) => !isClosedStatus(ticketStatus(t))).length} />
        <StatCard label="Closed Tickets" value={visibleTickets.filter((t) => isClosedStatus(ticketStatus(t))).length} />
        <StatCard label="All Tickets" value={visibleTickets.length} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tickets..."
            className="cyber-input w-full pl-9"
          />
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select value={orgFilter} onChange={handleOrgChange} className="cyber-input max-w-[200px]">
          <option value="">All orgs</option>
          {organizations.map((org) => <option key={org.id} value={org.id}>{org.name ?? org.id}</option>)}
        </select>
        <select value={statusFilter} onChange={handleStatusChange} className="cyber-input max-w-[140px]">
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select value={sortBy} onChange={handleSortChange} className="cyber-input max-w-[160px]">
          <option value="updated">Recently updated</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => <Chip key={i} onRemove={f.onRemove}>{f.label}</Chip>)}
          <button type="button" className="text-xs text-slate-500 hover:text-slate-300 underline" onClick={() => { setSearch(""); setOrgFilter(""); setStatusFilter("all"); setSortBy("updated"); setPage(1); }}>Clear all</button>
        </div>
      ) : null}

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">
            {search || orgFilter || statusFilter !== "all" ? "Search Results" : "Tickets"}
          </h2>
          <span className="cyber-pill">{filtered.length} of {visibleTickets.length}</span>
        </div>
        <div className="mt-6 space-y-4">
          {paginated.length > 0 ? paginated.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} orgMap={orgMap} />) : <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">No tickets match your filters.</div>}
        </div>
        {hasMore ? (
          <div className="mt-6 text-center">
            <button type="button" className="cyber-button-secondary" onClick={() => setPage((p) => p + 1)}>Show more ({filtered.length - paginated.length} remaining)</button>
          </div>
        ) : null}
      </section>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#071018] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="font-orbitron text-xl uppercase tracking-[0.12em] text-slate-50">Create Ticket</h2>
                <p className="mt-1 text-sm text-slate-400">Open a new support ticket for a client organization.</p>
              </div>
              <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(false)}>Close</button>
            </div>
            <form action={(formData) => { startTransition(async () => { await createTicketAction(formData); setOpenModal(false); }); }} className="space-y-4 px-6 py-6">
              <div>
                <label className="cyber-label">Organization</label>
                <select name="organizationId" className="cyber-input" required defaultValue="">
                  <option value="">Select organization</option>
                  {organizations.map((org) => <option key={org.id} value={org.id}>{org.name ?? org.id}</option>)}
                </select>
              </div>
              <div>
                <label className="cyber-label">Title</label>
                <input name="subject" className="cyber-input" placeholder="Ticket title" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="cyber-label">Priority</label>
                  <select name="priority" defaultValue="normal" className="cyber-input">
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </div>
                <div>
                  <label className="cyber-label">Category</label>
                  <input name="category" className="cyber-input" placeholder="Endpoint, Billing, Networking..." />
                </div>
              </div>
              <div>
                <label className="cyber-label">Description</label>
                <textarea name="description" rows={6} className="cyber-input" placeholder="Describe the issue or request..." required />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                <button type="submit" className="cyber-button" disabled={isPending}>{isPending ? "Creating..." : "Create Ticket"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
