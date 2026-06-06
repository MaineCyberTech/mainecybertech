"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

type TicketRecord = Record<string, any> & { id: string };

type Props = {
  tickets: TicketRecord[];
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
  return ticket.category ?? ticket.type ?? ticket.classification ?? "General";
}

function ticketStatus(ticket: TicketRecord) {
  return String(ticket.status ?? ticket.state ?? ticket.ticket_status ?? "new").toLowerCase();
}

function ticketPriority(ticket: TicketRecord) {
  return String(ticket.priority ?? ticket.severity ?? "normal").toLowerCase();
}

function isDeletedTicket(ticket: TicketRecord) {
  const title = String(ticket.title ?? ticket.subject ?? "");
  return Boolean(ticket.is_deleted ?? ticket.deleted ?? ticket.deleted_at ?? ticket.archived_at) || title.startsWith("[Deleted] ");
}

function isClosedStatus(status: string) {
  return ["resolved", "closed", "complete", "completed"].includes(status);
}

function ticketPillClass(status: string) {
  if (isClosedStatus(status)) {
    return "inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-emerald-300";
  }
  if (["pending", "waiting", "on_hold", "triaged"].includes(status)) {
    return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
  }
  return "inline-flex min-h-9 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-blue-300";
}

function priorityClass(priority: string) {
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

function TicketList({ title, tickets, emptyText }: { title: string; tickets: TicketRecord[]; emptyText: string }) {
  return (
    <section className="cyber-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cyber-heading text-lg">{title}</h2>
        <span className="cyber-pill">Total {tickets.length}</span>
      </div>
      <div className="mt-6 space-y-4">
        {tickets.length > 0 ? tickets.map((ticket) => {
          const status = ticketStatus(ticket);
          const priority = ticketPriority(ticket);
          return (
            <Link key={ticket.id} href={`/portal/support/${ticket.id}`} className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80">
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
                  <span className={ticketPillClass(status)}>{status}</span>
                  <span className={priorityClass(priority)}>{priority}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>{ticketCategory(ticket)}</span>
                <span title={formatDateTime(ticket.updated_at ?? ticket.created_at)}>Updated {formatRelativeTime(ticket.updated_at ?? ticket.created_at)}</span>
              </div>
            </Link>
          );
        }) : <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">{emptyText}</div>}
      </div>
    </section>
  );
}

export default function SupportCenterClient({ tickets, createTicketAction }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleTickets = useMemo(() => (tickets ?? []).filter((ticket) => !isDeletedTicket(ticket)), [tickets]);
  const openTickets = useMemo(() => visibleTickets.filter((ticket) => !isClosedStatus(ticketStatus(ticket))), [visibleTickets]);
  const closedTickets = useMemo(() => visibleTickets.filter((ticket) => isClosedStatus(ticketStatus(ticket))), [visibleTickets]);
  const visibleOpenTickets = openTickets.length > 0 ? openTickets : visibleTickets;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Support</h1>
          <p className="mt-3 text-slate-300">Open and track support requests for your organization.</p>
        </div>
        <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(true)}>Submit Ticket</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Open Tickets" value={openTickets.length} />
        <StatCard label="Closed Tickets" value={closedTickets.length} />
        <StatCard label="All Tickets" value={visibleTickets.length} />
      </div>

      <TicketList title={openTickets.length > 0 ? "Open Tickets" : "Recent Tickets"} tickets={visibleOpenTickets} emptyText="No open tickets right now." />

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Ticket History</h2>
          <button type="button" className="cyber-button-secondary" onClick={() => setShowHistory((value) => !value)}>{showHistory ? "Hide History" : "Show History"}</button>
        </div>
        {showHistory ? <div className="mt-6"><TicketList title="All Tickets" tickets={visibleTickets} emptyText="No ticket history yet." /></div> : null}
      </section>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#071018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="font-orbitron text-xl uppercase tracking-[0.12em] text-slate-50">Create Support Ticket</h2>
                <p className="mt-1 text-sm text-slate-400">Submit a new issue or request.</p>
              </div>
              <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(false)}>Close</button>
            </div>
            <form action={(formData) => { startTransition(async () => { await createTicketAction(formData); setOpenModal(false); }); }} className="space-y-4 px-6 py-6">
              <div>
                <label className="cyber-label">Title</label>
                <input name="subject" className="cyber-input" placeholder="What do you need help with?" required />
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
                  <input name="category" className="cyber-input" placeholder="Networking, Endpoint, Billing..." />
                </div>
              </div>
              <div>
                <label className="cyber-label">Description</label>
                <textarea name="description" rows={6} className="cyber-input" placeholder="Describe the issue or request in as much detail as possible..." required />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                <button type="submit" className="cyber-button" disabled={isPending}>{isPending ? "Submitting..." : "Submit Ticket"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
