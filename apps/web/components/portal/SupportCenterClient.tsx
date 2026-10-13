"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

type TicketRecord = Record<string, any> & { id: string };

type TicketCounts = { open: number; closed: number; all: number };

type Props = {
  tickets: TicketRecord[];
  createTicketAction: (
    formData: FormData,
  ) => Promise<{ ok: boolean; error?: string; ticketId?: string; subject?: string }>;
  // USE-P2-002: server-side pagination metadata. Optional so the component
  // still renders standalone (tests, other call sites) with page-local values.
  page?: number;
  pageSize?: number;
  total?: number;
  counts?: TicketCounts;
  // USE-P3-001: `?create=1` deep link (dashboard CTA) opens the create form.
  initialCreateOpen?: boolean;
};

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
  return (
    Boolean(ticket.is_deleted ?? ticket.deleted ?? ticket.deleted_at ?? ticket.archived_at) ||
    title.startsWith("[Deleted] ")
  );
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
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <div className="flex items-center justify-between gap-3 whitespace-nowrap">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="text-base font-semibold text-slate-50">{value}</p>
      </div>
    </div>
  );
}

function TicketList({
  title,
  tickets,
  emptyText,
  total,
}: {
  title: string;
  tickets: TicketRecord[];
  emptyText: string;
  total?: number;
}) {
  return (
    <section className="cyber-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cyber-heading text-lg">{title}</h2>
        <span className="cyber-pill">
          {total !== undefined && total > tickets.length
            ? `Showing ${tickets.length} of ${total}`
            : `Total ${tickets.length}`}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const status = ticketStatus(ticket);
            const priority = ticketPriority(ticket);
            return (
              <Link
                key={ticket.id}
                href={`/portal/support/${ticket.id}`}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-5 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-50">{ticketSubject(ticket)}</p>
                      {ticket.external_jsm_issue_key ? (
                        <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-300">
                          {ticket.external_jsm_issue_key}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {ticketDescription(ticket) ?? "No description provided."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={ticketPillClass(status)}>{status}</span>
                    <span className={priorityClass(priority)}>{priority}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>{ticketCategory(ticket)}</span>
                  <span title={formatDateTime(ticket.updated_at ?? ticket.created_at)}>
                    Updated {formatRelativeTime(ticket.updated_at ?? ticket.created_at)}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

export default function SupportCenterClient({
  tickets,
  createTicketAction,
  page = 1,
  pageSize,
  total,
  counts,
  initialCreateOpen = false,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [openModal, setOpenModal] = useState(initialCreateOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, openModal);
  const [formError, setFormError] = useState<string | null>(null);
  // USE-P3-001: closing the modal silently left users unsure the ticket was
  // submitted; keep the created ticket so the list page can confirm it.
  const [createdTicket, setCreatedTicket] = useState<{ id: string; subject: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleTickets = useMemo(
    () => (tickets ?? []).filter((ticket) => !isDeletedTicket(ticket)),
    [tickets],
  );
  const openTickets = useMemo(
    () => visibleTickets.filter((ticket) => !isClosedStatus(ticketStatus(ticket))),
    [visibleTickets],
  );
  const closedTickets = useMemo(
    () => visibleTickets.filter((ticket) => isClosedStatus(ticketStatus(ticket))),
    [visibleTickets],
  );
  const visibleOpenTickets = openTickets.length > 0 ? openTickets : visibleTickets;

  // USE-P2-002: the stat cards must reflect every ticket, not just the fetched
  // page, so prefer the server totals and fall back to page-local counts.
  const stats: TicketCounts = counts ?? {
    open: openTickets.length,
    closed: closedTickets.length,
    all: visibleTickets.length,
  };
  const effectivePageSize = pageSize ?? (visibleTickets.length || 25);
  const effectiveTotal = total ?? visibleTickets.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectivePageSize));
  const rangeStart = effectiveTotal === 0 ? 0 : (page - 1) * effectivePageSize + 1;
  // Base the window end on the rows actually rendered (the last page is
  // usually short), not the nominal page window.
  const rangeEnd = Math.min(rangeStart + visibleTickets.length - 1, effectiveTotal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
            Support
          </h1>
          <p className="mt-3 text-slate-300">
            Open and track support requests for your organization.
          </p>
        </div>
        <button type="button" className="cyber-button-secondary" onClick={() => setOpenModal(true)}>
          Submit Ticket
        </button>
      </div>

      {createdTicket ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <span>
            Ticket created: <span className="font-medium">{createdTicket.subject}</span>.
          </span>
          {createdTicket.id ? (
            <Link href={`/portal/support/${createdTicket.id}`} className="underline">
              View ticket
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Open Tickets" value={stats.open} />
        <StatCard label="Closed Tickets" value={stats.closed} />
        <StatCard label="All Tickets" value={stats.all} />
      </div>

      <TicketList
        title={openTickets.length > 0 ? "Open Tickets" : "Recent Tickets"}
        tickets={visibleOpenTickets}
        emptyText="No open tickets right now."
      />

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Ticket History</h2>
          <button
            type="button"
            className="cyber-button-secondary"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>
        {showHistory ? (
          <div className="mt-6">
            <TicketList
              title="All Tickets"
              tickets={visibleTickets}
              emptyText="No ticket history yet."
              total={effectiveTotal}
            />
          </div>
        ) : null}
      </section>

      {effectiveTotal > 0 ? (
        <nav
          aria-label="Ticket pagination"
          className="flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <p className="text-xs text-slate-400">
            Showing {rangeStart}–{rangeEnd} of {effectiveTotal} tickets
          </p>
          {totalPages > 1 ? (
            <div className="flex items-center gap-3">
              {page > 1 ? (
                <Link
                  href={`/portal/support?page=${page - 1}`}
                  className="cyber-button-secondary text-xs"
                  rel="prev"
                >
                  Previous
                </Link>
              ) : (
                <span className="cyber-button-secondary text-xs opacity-40" aria-disabled="true">
                  Previous
                </span>
              )}
              <span className="text-xs text-slate-400">
                Page {Math.min(page, totalPages)} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/portal/support?page=${page + 1}`}
                  className="cyber-button-secondary text-xs"
                  rel="next"
                >
                  Next
                </Link>
              ) : (
                <span className="cyber-button-secondary text-xs opacity-40" aria-disabled="true">
                  Next
                </span>
              )}
            </div>
          ) : null}
        </nav>
      ) : null}

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-support-ticket-title"
            ref={modalRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpenModal(false);
            }}
            className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-cyber-card-deep shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2
                  id="create-support-ticket-title"
                  className="font-display text-xl uppercase tracking-[0.12em] text-slate-50"
                >
                  Create Support Ticket
                </h2>
                <p className="mt-1 text-sm text-slate-400">Submit a new issue or request.</p>
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
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                setFormError(null);
                startTransition(async () => {
                  const result = await createTicketAction(formData);
                  if (result.ok) {
                    // USE-P3-001: confirm the submission with the created
                    // ticket (and a link) instead of only closing the modal.
                    setCreatedTicket({
                      id: result.ticketId ?? "",
                      subject: result.subject ?? "Submitted",
                    });
                    setOpenModal(false);
                  } else {
                    setFormError(result.error ?? "Failed to create ticket.");
                  }
                });
              }}
              className="space-y-4 px-6 py-6"
            >
              <div>
                <label className="cyber-label" htmlFor="support-title">
                  Title
                </label>
                <input
                  id="support-title"
                  name="subject"
                  className="cyber-input"
                  placeholder="What do you need help with?"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="cyber-label" htmlFor="support-priority">
                    Priority
                  </label>
                  <select
                    id="support-priority"
                    name="priority"
                    defaultValue="normal"
                    className="cyber-input"
                  >
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </div>
                <div>
                  <label className="cyber-label" htmlFor="support-category">
                    Category
                  </label>
                  <input
                    id="support-category"
                    name="category"
                    className="cyber-input"
                    placeholder="Networking, Endpoint, Billing..."
                  />
                </div>
              </div>
              <div>
                <label className="cyber-label" htmlFor="support-description">
                  Description
                </label>
                <textarea
                  id="support-description"
                  name="description"
                  rows={6}
                  className="cyber-input"
                  placeholder="Describe the issue or request in as much detail as possible..."
                  required
                />
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
                  {isPending ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
              {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
