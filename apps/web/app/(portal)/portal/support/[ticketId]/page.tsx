import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { requireAdminAccess } from "@/lib/auth/admin";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ticket Details - Portal - Maine CyberTech" };

function ticketSubject(ticket: any) {
  return ticket?.subject ?? ticket?.title ?? ticket?.name ?? `Ticket ${ticket?.id}`;
}

function ticketDescription(ticket: any) {
  return ticket?.description ?? ticket?.details ?? ticket?.body ?? ticket?.message ?? "No description provided.";
}

function ticketCategory(ticket: any) {
  return ticket?.category ?? ticket?.type ?? ticket?.classification ?? "General";
}

function ticketStatus(ticket: any) {
  return String(ticket?.status ?? ticket?.state ?? ticket?.ticket_status ?? "new").toLowerCase();
}

function ticketPriority(ticket: any) {
  return String(ticket?.priority ?? ticket?.severity ?? "normal").toLowerCase();
}

function isDeletedTicket(ticket: any) {
  const title = String(ticket?.title ?? ticket?.subject ?? "");
  return Boolean(ticket?.is_deleted ?? ticket?.deleted ?? ticket?.deleted_at ?? ticket?.archived_at) || title.startsWith("[Deleted] ");
}

function commentBody(comment: any) {
  return comment?.body ?? comment?.comment ?? comment?.message ?? "";
}

function commentInternal(comment: any) {
  return Boolean(comment?.is_internal ?? comment?.internal_only ?? false);
}

function commentAuthor(comment: any) {
  return comment?.author_name ?? comment?.created_by_name ?? comment?.author_email ?? comment?.created_by ?? "Support";
}

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

function statusClass(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
    case "complete":
    case "completed":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-emerald-300";
    case "triaged":
    case "pending":
    case "waiting":
    case "on_hold":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
    default:
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-blue-300";
  }
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

type Props = { params: Promise<{ ticketId: string }> };

export default async function PortalSupportDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Support", href: "/portal/support" }, { label: "Ticket" }]} />
        <PortalSubnav current="support" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">Access restricted.</div>
      </div>
    );
  }

  let ticket: any;
  try {
    ticket = await api.tickets.get(ticketId);
  } catch {
    return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Ticket not found.</div>;
  }
  if (isDeletedTicket(ticket)) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Ticket not found.</div>;

  const rawComments = await api.tickets.listComments(ticketId);
  const comments = (rawComments ?? []).filter((comment: any) => !commentInternal(comment));
  const status = ticketStatus(ticket);
  const priority = ticketPriority(ticket);

  let isAdmin = false;
  try { await requireAdminAccess(); isAdmin = true; } catch { isAdmin = false; }

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Support", href: "/portal/support" }, { label: ticketSubject(ticket) }]} />
      <PortalSubnav current="support" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">{ticketSubject(ticket)}</h1>
          <p className="mt-3 text-slate-300">Category: {ticketCategory(ticket)}</p>
          <p className="mt-2 whitespace-nowrap text-xs text-slate-500">Ticket ID: {ticket.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={statusClass(status)}>{status}</span>
          <span className={priorityClass(priority)}>{priority}</span>
          {isAdmin ? <Link href={`/admin/tickets/${ticketId}`} className="cyber-button-secondary">View in Admin</Link> : null}
          <Link href="/portal/support" className="cyber-button-secondary">Back to Support</Link>
        </div>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Details</h2>
        <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{ticketDescription(ticket)}</p></div>
      </section>

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3"><h2 className="cyber-heading text-lg">Comments</h2><span className="cyber-pill">Total {comments.length}</span></div>
        <div className="mt-6 space-y-4">
          {comments.length > 0 ? comments.map((comment: any) => (
            <div key={comment.id ?? `${comment.created_at}-${commentBody(comment)}`} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-50">{commentAuthor(comment)}</p><span className="text-xs text-slate-500" title={formatDateTime(comment.created_at)}>{formatRelativeTime(comment.created_at)}</span></div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{commentBody(comment)}</p>
            </div>
          )) : <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">No comments yet.</div>}
        </div>
      </section>
    </div>
  );
}
